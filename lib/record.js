import { existsSync } from "node:fs";
import { mkdir, readdir, rename, rm } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { spawn, spawnSync } from "node:child_process";
import { chromium } from "playwright";
import { readDemo, videoPaths } from "./app.js";

const log = (...msgs) => console.log("[videolab]", ...msgs);

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
      const context = await browser.newContext({
        viewport: size,
        recordVideo: { dir: capture, size },
      });
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
