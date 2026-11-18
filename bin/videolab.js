#!/usr/bin/env node
// videolab CLI. Primary contract: run from the app repo (the one that contains
// demo.yml). Bidirectional: from anywhere else — including this repo — pass
// --cwd <app-repo> so the app repo is only ever read, never written.
//   videolab list
//   videolab new <video>
//   videolab record <video>
//   videolab studio <video>
//   videolab compose <video>

import { existsSync } from "node:fs";
import { readdir } from "node:fs/promises";
import path from "node:path";
import { readDemo, VIDEOLAB_ROOT } from "../lib/app.js";
import { record } from "../lib/record.js";
import { compose } from "../lib/compose.js";
import { studio } from "../lib/studio.js";
import { scaffold } from "../lib/scaffold.js";

const USAGE = `Usage (from the app repo that contains demo.yml, or with --cwd <app-repo>):
  videolab list              list this app's videos (without demo.yml: every app's)
  videolab new <video>       scaffold a video: copy the template + starter flow and video.json
  videolab record <video>    run the video's flow.js and save raw footage
  videolab studio <video>    open Remotion Studio with this video's edit (no render)
  videolab compose <video>   render raw footage + video.json to out/<video>.mp4

Options:
  --cwd <dir>                app repo to read demo.yml from (default: current directory)
`;

async function listApp(demo, cwd) {
  const dir = path.join(VIDEOLAB_ROOT, "projects", demo.name);
  const names = existsSync(dir)
    ? (await readdir(dir, { withFileTypes: true })).filter((d) => d.isDirectory()).map((d) => d.name)
    : [];
  console.log(names.join("\n") || "(no videos yet)");
}

// Without a demo.yml in the working directory, list every app's videos so the
// tool stays usable from videolab itself ("go to this folder and make a video").
async function listAll() {
  const projects = path.join(VIDEOLAB_ROOT, "projects");
  if (!existsSync(projects)) return;
  const apps = (await readdir(projects, { withFileTypes: true })).filter((d) => d.isDirectory());
  let total = 0;
  for (const app of apps) {
    const videos = (await readdir(path.join(projects, app.name), { withFileTypes: true }))
      .filter((d) => d.isDirectory() && !d.name.startsWith("."))
      .map((d) => `${app.name}/${d.name}`);
    console.log(videos.join("\n"));
    total += videos.length;
  }
  if (total === 0) console.log("(no videos yet)");
}

async function list(cwd) {
  if (existsSync(path.join(cwd, "demo.yml"))) {
    await listApp(await readDemo(cwd), cwd);
  } else {
    await listAll();
  }
}

const argv = process.argv.slice(2);
let cwd = process.cwd();
const cwdFlag = argv.indexOf("--cwd");
if (cwdFlag !== -1 && argv[cwdFlag + 1]) {
  cwd = path.resolve(argv[cwdFlag + 1]);
  argv.splice(cwdFlag, 2);
}
const [command, video] = argv;

try {
  if (command === "list") await list(cwd);
  else if (command === "new" && video) await scaffold(video, cwd);
  else if (command === "record" && video) process.exitCode = await record(video, cwd);
  else if (command === "studio" && video) process.exitCode = await studio(video, { cwd });
  else if (command === "compose" && video) await compose(video, cwd);
  else {
    console.error(USAGE);
    process.exitCode = 1;
  }
} catch (err) {
  console.error("[videolab] error:", err.message);
  process.exitCode = 1;
}
