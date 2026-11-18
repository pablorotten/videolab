import { existsSync } from "node:fs";
import { cp, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { VIDEOLAB_ROOT, readDemo, videoPaths } from "./app.js";

const log = (...msgs) => console.log("[videolab]", ...msgs);

const STARTER_FLOW = `// Playwright flow for this video. Runs against the app started from demo.yml.
// \`page\` is a fresh page on the recording context; \`demo\` carries name and url.
// Dev servers that compile on first hit can stall the first request — warm those
// endpoints here with page.request.get(...), which never appears in footage.
export default async function flow({ page, log, demo }) {
  await page.goto(demo.url, { waitUntil: "networkidle" });
  log("opened app");
  // Add the steps of your demo below.
  // await page.getByRole("button", { name: "New" }).click();
  // await page.waitForTimeout(1000);
}
`;

const STARTER_CONFIG = {
  title: "",
  subtitle: "",
  tagline: "",
  intro: 3,
  outro: 4,
  zooms: [],
  captions: [],
};

// Fork-on-create: a video never renders the tracked template. The first command
// that touches the video copies studio/src into the project, and from then on
// that copy is the video's own code — fully editable, immune to template changes.
// Existing project files are never overwritten; the project owns them.
export async function scaffold(video, cwd = process.cwd(), { quiet = false } = {}) {
  const demo = await readDemo(cwd);
  const paths = videoPaths(demo.name, video);

  if (!existsSync(paths.studioSrc)) {
    const template = path.join(VIDEOLAB_ROOT, "studio", "src");
    await cp(template, paths.studioSrc, { recursive: true });
    if (!quiet) log(`copied the studio template into ${paths.studioSrc} — this video's own copy; edit it freely`);
  }
  await mkdir(paths.dir, { recursive: true });
  if (!existsSync(paths.flow)) await writeFile(paths.flow, STARTER_FLOW);
  if (!existsSync(paths.config)) {
    await writeFile(paths.config, `${JSON.stringify(STARTER_CONFIG, null, 2)}\n`);
  }
  return paths;
}
