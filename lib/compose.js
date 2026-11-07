import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { execFileSync, spawnSync } from "node:child_process";
import { VIDEOLAB_ROOT, readDemo, videoPaths } from "./app.js";

const log = (...msgs) => console.log("[videolab]", ...msgs);
const DEFAULT_FPS = 30;

function probe(file) {
  const out = execFileSync(
    "ffprobe",
    ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height:format=duration", "-of", "json", file],
    { encoding: "utf8" },
  );
  const json = JSON.parse(out);
  return {
    width: json.streams[0].width,
    height: json.streams[0].height,
    duration: Number(json.format.duration),
  };
}

const toFrames = (seconds, fps) => Math.round(seconds * fps);

function requireSeconds(value, name, min) {
  if (typeof value !== "number" || !(value >= min)) throw new Error(`video.json: '${name}' must be a number >= ${min}`);
  return value;
}

// Converts video.json (seconds, relative to the recording) into frame-based props.
function buildProps(cfg, demoName, info) {
  const fps = cfg.fps ?? DEFAULT_FPS;
  const introFrames = toFrames(requireSeconds(cfg.intro ?? 3, "intro", 1), fps);
  const outroFrames = toFrames(requireSeconds(cfg.outro ?? 4, "outro", 1), fps);
  const videoFrames = toFrames(info.duration, fps);

  const zooms = (cfg.zooms ?? [{ at: 0, scale: 1 }]).map((z) => ({
    at: toFrames(z.at ?? 0, fps),
    scale: z.scale ?? 1,
    originX: z.originX ?? 50,
    originY: z.originY ?? 50,
  }));
  for (let i = 1; i < zooms.length; i += 1) {
    if (zooms[i].at <= zooms[i - 1].at) throw new Error("video.json: zooms must have strictly increasing 'at' values");
  }

  const captions = (cfg.captions ?? []).map((c) => {
    const cue = { from: toFrames(c.from, fps), durationInFrames: toFrames(c.duration, fps), text: c.text };
    if (cue.from + cue.durationInFrames > videoFrames) {
      log(`warning: caption "${c.text}" runs past the end of the footage`);
    }
    return cue;
  });

  return {
    videoSrc: "footage.mp4",
    title: cfg.title ?? demoName,
    subtitle: cfg.subtitle ?? "",
    tagline: cfg.tagline ?? "",
    fps,
    width: info.width,
    height: info.height,
    introFrames,
    videoFrames,
    outroFrames,
    zooms,
    captions,
  };
}

// Composes raw/footage.webm with video.json into out/<video>.mp4.
export async function compose(video) {
  const demo = await readDemo(process.cwd());
  const paths = videoPaths(demo.name, video);
  if (!existsSync(paths.footage)) throw new Error(`no footage at ${paths.footage}; run 'videolab record ${video}' first`);
  if (!existsSync(paths.config)) throw new Error(`video config not found: ${paths.config}`);

  const cfg = JSON.parse(await readFile(paths.config, "utf8"));
  const info = probe(paths.footage);
  const props = buildProps(cfg, demo.name, info);

  // Remotion seeks H.264 far more reliably than Chromium WebM.
  await mkdir(paths.render, { recursive: true });
  log("normalizing footage with ffmpeg");
  execFileSync(
    "ffmpeg",
    ["-y", "-v", "error", "-i", paths.footage, "-c:v", "libx264", "-preset", "fast", "-crf", "18",
      "-pix_fmt", "yuv420p", "-r", String(props.fps), "-an", path.join(paths.render, "footage.mp4")],
    { stdio: "inherit" },
  );

  const propsFile = path.join(paths.render, "props.json");
  await writeFile(propsFile, JSON.stringify(props, null, 2));

  await mkdir(path.dirname(paths.out), { recursive: true });
  const npx = process.platform === "win32" ? "npx.cmd" : "npx";
  log(`rendering to ${paths.out}`);
  const result = spawnSync(
    npx,
    ["remotion", "render", "studio/src/index.ts", "Demo", paths.out,
      "--props", propsFile, "--public-dir", paths.render, "--overwrite"],
    { cwd: VIDEOLAB_ROOT, stdio: "inherit", shell: process.platform === "win32" },
  );
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`Remotion exited with status ${result.status}`);
  log("finished:", paths.out);
}
