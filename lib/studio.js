import { unwatchFile, watchFile } from "node:fs";
import net from "node:net";
import { spawn } from "node:child_process";
import { VIDEOLAB_ROOT } from "./app.js";
import { prepare } from "./compose.js";

const log = (...msgs) => console.log("[videolab]", ...msgs);

function portIsFree(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", () => resolve(false));
    server.once("listening", () => server.close(() => resolve(true)));
    server.listen(port);
  });
}

async function findPort(start) {
  for (let port = start; port < start + 20; port += 1) {
    if (await portIsFree(port)) return port;
  }
  return start;
}

// Rebuilds render/props.json when video.json or the raw footage changes, so Studio
// (which watches that file) refreshes without a restart.
function watchForChanges(paths, video) {
  let timer = null;
  const refresh = () => {
    if (timer) return;
    timer = setTimeout(() => {
      timer = null;
      prepare(video).then(
        () => log("props refreshed; the Studio preview should update"),
        (err) => log("could not refresh props:", err.message),
      );
    }, 300);
  };
  watchFile(paths.config, { interval: 500 }, refresh);
  watchFile(paths.footage, { interval: 1000 }, refresh);
  return () => {
    if (timer) clearTimeout(timer);
    unwatchFile(paths.config, refresh);
    unwatchFile(paths.footage, refresh);
  };
}

// Starts Remotion Studio for one workspace with its real props and footage.
// Prepares render/ first; does not render the final video.
export async function studio(video, { port = 3000 } = {}) {
  const { paths } = await prepare(video);
  const chosen = await findPort(port);
  if (chosen !== port) log(`port ${port} is busy; using ${chosen}`);

  const npx = process.platform === "win32" ? "npx.cmd" : "npx";
  const args = [
    "remotion", "studio", "studio/src/index.ts",
    "--props", paths.propsFile,
    "--public-dir", paths.render,
    "--port", String(chosen),
  ];
  log(`Remotion Studio: http://localhost:${chosen}`);
  const stopWatching = watchForChanges(paths, video);

  const code = await new Promise((resolve) => {
    const child = spawn(npx, args, { cwd: VIDEOLAB_ROOT, stdio: "inherit", shell: process.platform === "win32" });
    child.on("error", (err) => {
      log("could not start Remotion Studio:", err.message);
      resolve(1);
    });
    child.on("exit", (c) => resolve(c ?? 0));
  });
  stopWatching();
  return code;
}
