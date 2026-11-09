#!/usr/bin/env node
// videolab CLI. Run from the app repo (the one that contains demo.yml):
//   node <videolab>/bin/videolab.js record <video>
//   node <videolab>/bin/videolab.js compose <video>

import { existsSync } from "node:fs";
import { readdir } from "node:fs/promises";
import path from "node:path";
import { readDemo, VIDEOLAB_ROOT } from "../lib/app.js";
import { record } from "../lib/record.js";
import { compose } from "../lib/compose.js";

const USAGE = `Usage (run from the app repo that contains demo.yml):
  videolab list              list this app's videos
  videolab record <video>    run the video's flow.js and save raw footage
  videolab compose <video>   render raw footage + video.json to out/<video>.mp4
`;

async function list() {
  const demo = await readDemo();
  const dir = path.join(VIDEOLAB_ROOT, "projects", demo.name);
  const names = existsSync(dir)
    ? (await readdir(dir, { withFileTypes: true })).filter((d) => d.isDirectory()).map((d) => d.name)
    : [];
  console.log(names.join("\n") || "(no videos yet)");
}

const [command, video] = process.argv.slice(2);
try {
  if (command === "list") await list();
  else if (command === "record" && video) process.exitCode = await record(video);
  else if (command === "compose" && video) await compose(video);
  else {
    console.error(USAGE);
    process.exitCode = 1;
  }
} catch (err) {
  console.error("[videolab] error:", err.message);
  process.exitCode = 1;
}
