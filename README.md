# videolab

Produces demo videos from real app footage. This repo is the engine and the
template — no app content is tracked here.

- **Record** (`lib/record.js`): starts the app from its `demo.yml`, runs a Playwright
  flow against it, and saves the footage.
- **Compose** (`lib/compose.js`, `studio/`): renders that footage with a Remotion
  composition: intro, outro, zooms, captions.

Every video owns a private copy of the composition: `studio/src/` is a tracked
**template** that gets copied into the project on creation (fork-on-create). The
copy is the video's own code — edit it freely; template changes never affect
existing videos.

## Usage

From the app repo (the one with `demo.yml`), or from anywhere with
`--cwd <app-repo>` — the app repo is only read, never written:

```
node C:/Users/pablo/DEV/projects/videolab/bin/videolab.js list
node C:/Users/pablo/DEV/projects/videolab/bin/videolab.js new library-tour
node C:/Users/pablo/DEV/projects/videolab/bin/videolab.js record library-tour
node C:/Users/pablo/DEV/projects/videolab/bin/videolab.js studio library-tour
node C:/Users/pablo/DEV/projects/videolab/bin/videolab.js compose library-tour
```

`new` scaffolds the video (template copy + starter flow and video.json); the other
commands auto-scaffold if it does not exist yet. All per-video files, including the
output, are created under `projects/<app>/<video>/` in this repo. That folder is
gitignored and disposable.

```
projects/<app>/<video>/out/<video>.mp4
```

## Setup (done on this machine)

```
npm install
npx playwright install chromium
```

Needs Node 22+ and `ffmpeg`/`ffprobe` on the PATH.

## Preview before rendering

`studio` prepares `render/footage.mp4` and `render/props.json`, then opens Remotion
Studio with the video's real footage and edit. It does not render:

```
node C:/Users/pablo/DEV/projects/videolab/bin/videolab.js studio library-tour
```

The command watches `video.json` and the raw footage, so saving an edit refreshes the
preview live. It keeps running until you stop it (Ctrl+C). Only run `compose` once the
user approves the preview.

`npm run studio` (from this repo) opens the Studio with placeholder props, for
developing the composition itself. Real renders read `render/props.json`.
