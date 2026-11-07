import { existsSync } from "node:fs";
import { mkdir, readFile, readdir, rename, rm } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { spawn, spawnSync } from "node:child_process";
import { chromium } from "playwright";
import { readDemo, videoPaths } from "./app.js";

const log = (...msgs) => console.log("[videolab]", ...msgs);

// Headless Chromium does not paint the mouse pointer into recordings. Enabled per
// video with "cursor": true in video.json. This overlay draws an arrow that follows
// the pointer and a ripple on click. It is presentation only; it lives in the page
// DOM for recording and does not change app behavior.
const CURSOR_SCRIPT = `(() => {
  const install = () => {
    if (document.getElementById("videolab-cursor")) return;
    const style = document.createElement("style");
    style.textContent =
      "#videolab-cursor{position:fixed;left:0;top:0;width:24px;height:24px;pointer-events:none;z-index:2147483647;transition:left .15s ease-out,top .15s ease-out;filter:drop-shadow(0 1px 2px rgba(0,0,0,.5))}" +
      ".videolab-ripple{position:fixed;width:36px;height:36px;margin:-18px 0 0 -18px;border-radius:50%;border:3px solid #67e8f9;pointer-events:none;z-index:2147483646;animation:videolab-ripple .5s ease-out forwards}" +
      "@keyframes videolab-ripple{from{transform:scale(.3);opacity:1}to{transform:scale(1.6);opacity:0}}";
    document.documentElement.appendChild(style);
    const cursor = document.createElement("div");
    cursor.id = "videolab-cursor";
    cursor.innerHTML = '<svg viewBox="0 0 24 24" width="24" height="24"><path d="M4 2 L4 20 L9 15 L12 22 L15 21 L12 14 L19 14 Z" fill="white" stroke="black" stroke-width="1.5" stroke-linejoin="round"/></svg>';
    document.documentElement.appendChild(cursor);
    const move = (x, y) => { cursor.style.left = x + "px"; cursor.style.top = y + "px"; };
    document.addEventListener("mousemove", (e) => move(e.clientX, e.clientY), true);
    document.addEventListener("mousedown", (e) => {
      move(e.clientX, e.clientY);
      const ripple = document.createElement("div");
      ripple.className = "videolab-ripple";
      ripple.style.left = e.clientX + "px";
      ripple.style.top = e.clientY + "px";
      document.documentElement.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
    }, true);
  };
  if (document.documentElement) install();
  else document.addEventListener("DOMContentLoaded", install);
})();`;

async function isResponding(url) {
  try {
    await fetch(url);
    return true;
  } catch {
    return false;
  }
}

async function waitForUrl(url, timeoutMs = 120000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (await isResponding(url)) return;
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`app did not respond at ${url} within ${timeoutMs / 1000}s`);
}

function stopApp(child) {
  if (!child.pid) return;
  if (process.platform === "win32") {
    spawnSync("taskkill", ["/PID", String(child.pid), "/T", "/F"]);
  } else {
    child.kill("SIGTERM");
  }
}

// Records one video: starts the app, runs its flow, saves raw/footage.webm.
// Returns the exit code (0 when the flow completed).
export async function record(video) {
  const cwd = process.cwd();
  const demo = await readDemo(cwd);
  const paths = videoPaths(demo.name, video);
  if (!existsSync(paths.flow)) throw new Error(`flow not found: ${paths.flow}`);
  const videoCfg = existsSync(paths.config) ? JSON.parse(await readFile(paths.config, "utf8")) : {};

  const flow = await import(pathToFileURL(paths.flow).href);
  if (typeof flow.default !== "function") {
    throw new Error(`flow must default-export an async function: ${paths.flow}`);
  }

  if (await isResponding(demo.url)) {
    throw new Error(
      `${demo.url} already responds. Stop the running server first; videolab does not kill processes it did not start.`,
    );
  }

  // Each run replaces the previous footage for this video only.
  await rm(paths.raw, { recursive: true, force: true });
  const capture = path.join(paths.raw, ".capture");
  await mkdir(capture, { recursive: true });

  const size = demo.viewport || { width: 1280, height: 800 };
  log(`starting app: ${demo.start_command}`);
  const app = spawn(demo.start_command, {
    cwd,
    shell: true,
    stdio: ["ignore", "inherit", "inherit"],
  });
  app.on("error", (err) => console.error("[videolab] app spawn failed:", err));

  let exitCode = 0;
  try {
    await waitForUrl(demo.url);
    log(`app is up at ${demo.url}`);

    const browser = await chromium.launch();
    try {
      // Warm-up outside the recording: the first load of a dev server compiles
      // the bundle and would otherwise leave a blank page at the start of the footage.
      const warm = await browser.newContext({ viewport: size });
      const warmPage = await warm.newPage();
      await warmPage.goto(demo.url, { waitUntil: "networkidle", timeout: 120000 }).catch(() => {});
      await warm.close();

      const context = await browser.newContext({
        viewport: size,
        recordVideo: { dir: capture, size },
      });
      if (videoCfg.cursor === true) await context.addInitScript(CURSOR_SCRIPT);
      const page = await context.newPage();
      try {
        await flow.default({ page, log: (m) => log("flow:", m), demo });
        log("flow completed");
      } catch (err) {
        console.error("[videolab] flow failed:", err.message);
        exitCode = 1;
      } finally {
        await context.close(); // closing the context flushes the video file
      }
    } finally {
      await browser.close();
    }

    const files = (await readdir(capture)).filter((f) => f.endsWith(".webm"));
    if (files.length !== 1) throw new Error(`expected one recording, found ${files.length}`);
    await rename(path.join(capture, files[0]), paths.footage);
    log("footage:", paths.footage);
  } finally {
    await rm(capture, { recursive: true, force: true });
    log("stopping app");
    stopApp(app);
  }
  return exitCode;
}
