#!/usr/bin/env node
// videolab recorder — Phase A.
//
// Run from the target app repo (which contains demo.yml):
//   npx <path-to-videolab> record <flow>
//
// It starts the app via demo.yml's start_command, polls the URL until ready,
// drives the real UI through a flow script from videolab/apps/<app>/flows/,
// and saves raw footage to videolab/apps/<app>/raw/<flow>.webm.
// The app process is always torn down afterwards.

import { existsSync } from "node:fs";
import { readFile, mkdir, rename, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { spawn } from "node:child_process";

const VIDEOLAB_ROOT = process.env.VIDEOLAB_ROOT || path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

const log = (...msgs) => console.log("[videolab]", ...msgs);
const fail = (msg) => {
  console.error("[videolab] error:", msg);
  process.exit(1);
};

// Minimal YAML reader covering demo.yml's shape (nested maps, scalars).
// Avoids a dependency for now; swap in the `yaml` package if demo.yml grows.
function parseSimpleYaml(text) {
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

async function waitForUrl(url, timeoutMs = 120000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`app did not respond at ${url} within ${timeoutMs / 1000}s`);
}

async function main() {
  const [command, flowName] = process.argv.slice(2);
  if (command !== "record" || !flowName) {
    console.error(`Usage (from the app repo that contains demo.yml):\n  videolab record <flow>\n`);
    process.exit(1);
  }

  const appCwd = process.cwd();
  const demoPath = path.join(appCwd, "demo.yml");
  if (!existsSync(demoPath)) fail(`no demo.yml found in ${appCwd}`);
  const demo = parseSimpleYaml(await readFile(demoPath, "utf8"));
  for (const key of ["name", "start_command", "url"]) {
    if (!demo[key]) fail(`demo.yml is missing '${key}'`);
  }

  const appDir = path.join(VIDEOLAB_ROOT, "apps", demo.name);
  const flowFile = path.join(appDir, "flows", `${flowName}.js`);
  if (!existsSync(flowFile)) fail(`flow not found: ${flowFile}`);

  const rawDir = path.join(appDir, "raw");
  await mkdir(rawDir, { recursive: true });

  // Best effort: free up the demo URL's port from stale dev servers.
  const portMatch = new URL(demo.url).port || "80";
  try {
    const netstat = spawn("netstat", ["-ano"], { shell: false });
    let out = "";
    for await (const chunk of netstat.stdout) out += chunk;
    const stale = new Set(
      [...out.matchAll(new RegExp(`:${portMatch}\\s.*LISTENING\\s+(\\d+)`, "gi"))].map((m) => m[1])
    );
    for (const pid of stale) {
      log(`port ${portMatch} in use by PID ${pid} — killing stale server`);
      spawn("taskkill", ["/PID", pid, "/T", "/F"], { shell: false });
    }
    if (stale.size) await new Promise((r) => setTimeout(r, 1500));
  } catch {
    /* best effort */
  }

  // -- Start the app --------------------------------------------------------
  log(`starting app: ${demo.start_command}`);
  const appProcess = spawn(demo.start_command, {
    cwd: appCwd,
    shell: true,
    stdio: ["ignore", "inherit", "inherit"],
  });
  appProcess.on("error", (err) => console.error("[videolab] app spawn failed:", err));

  try {
    await waitForUrl(demo.url);
    log(`app is up at ${demo.url}`);

    // -- Record -------------------------------------------------------------
    const { chromium } = await import("playwright");
    const browser = await chromium.launch();
    const context = await browser.newContext({
      viewport: demo.viewport || { width: 1280, height: 800 },
      recordVideo: { dir: rawDir, size: demo.viewport || { width: 1280, height: 800 } },
    });
    const page = await context.newPage();
    const step = (m) => log("flow:", m);

    process.exitCode = 0;
    try {
      const flow = await import(pathToFileURL(flowFile).href);
      if (typeof flow.default !== "function") fail(`flow must default-export an async function: ${flowFile}`);
      await flow.default({ page, log: step, demo });
      log("flow completed");
    } catch (err) {
      console.error("[videolab] flow failed:", err);
      process.exitCode = 1;
    } finally {
      await page.close();   // close flushes the video
      await context.close();
      await browser.close();
    }

    // Newest webm in rawDir is this recording; rename to <flow>.webm.
    const files = (await readdir(rawDir)).filter((f) => f.endsWith(".webm")).sort();
    if (files.length) {
      const target = path.join(rawDir, `${flowName}.webm`);
      await rename(path.join(rawDir, files.at(-1)), target);
      log("footage:", target);
    }
  } finally {
    // -- Teardown -------------------------------------------------------------
    log("stopping app");
    if (appProcess.pid) {
      if (process.platform === "win32") {
        spawn("taskkill", ["/PID", String(appProcess.pid), "/T", "/F"], { shell: false });
      } else {
        appProcess.kill("SIGTERM");
      }
    }
  }
}

main().catch((e) => fail(e.message));
