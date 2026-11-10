import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const VIDEOLAB_ROOT =
  process.env.VIDEOLAB_ROOT || path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// Minimal reader for demo.yml: nested maps and scalars only.
export function parseDemoYaml(text) {
  const out = {};
  const stack = [{ indent: -1, obj: out }];
  for (const raw of text.split(/\r?\n/)) {
    if (!raw.trim() || raw.trim().startsWith("#")) continue;
    const indent = raw.search(/\S/);
    const idx = raw.trim().indexOf(":");
    const key = raw.trim().slice(0, idx).trim();
    let value = raw.trim().slice(idx + 1).trim();
    while (stack.length > 1 && indent <= stack.at(-1).indent) stack.pop();
    const parent = stack.at(-1).obj;
    if (value === "") {
      parent[key] = {};
      stack.push({ indent, obj: parent[key] });
    } else {
      if (value === "true") value = true;
      else if (value === "false") value = false;
      else if (/^\d+$/.test(value)) value = Number(value);
      parent[key] = value;
    }
  }
  return out;
}

export async function readDemo(cwd = process.cwd()) {
  const file = path.join(cwd, "demo.yml");
  if (!existsSync(file)) throw new Error(`no demo.yml in ${cwd}; run videolab from the app repo`);
  const demo = parseDemoYaml(await readFile(file, "utf8"));
  for (const key of ["name", "start_command", "url"]) {
    if (!demo[key]) throw new Error(`demo.yml is missing '${key}'`);
  }
  return demo;
}

// Every video workspace lives in this repo, under projects/, and is never tracked:
//   projects/<app>/<video>/{flow.js,video.json,raw/,render/,out/}
// It is scratch state for one app's demos, safe to delete at any time.
export function videoPaths(appName, video) {
  if (!/^[a-z0-9][a-z0-9-]*$/i.test(video)) throw new Error(`invalid video name: ${video}`);
  const dir = path.join(VIDEOLAB_ROOT, "projects", appName, video);
  return {
    dir,
    flow: path.join(dir, "flow.js"),
    config: path.join(dir, "video.json"),
    raw: path.join(dir, "raw"),
    footage: path.join(dir, "raw", "footage.webm"),
    render: path.join(dir, "render"),
    normalized: path.join(dir, "render", "footage.mp4"),
    propsFile: path.join(dir, "render", "props.json"),
    out: path.join(dir, "out", `${video}.mp4`),
  };
}
