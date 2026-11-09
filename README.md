# videolab

Produces demo videos from real app footage. This repo is only the tool — no app
content is tracked here.

- **Record** (`lib/record.js`): starts the app from its `demo.yml`, runs a Playwright
  flow against it, and saves the footage.
- **Compose** (`lib/compose.js`, `studio/`): renders that footage with a Remotion
  composition: intro, outro, zooms, captions.

## Usage

From the app repo (the one with `demo.yml`):

```
node C:/Users/pablo/DEV/projects/videolab/bin/videolab.js list
node C:/Users/pablo/DEV/projects/videolab/bin/videolab.js record library-tour
node C:/Users/pablo/DEV/projects/videolab/bin/videolab.js compose library-tour
```

All per-video files, including the output, are created under
`projects/<app>/<video>/` in this repo. That folder is gitignored and disposable.

```
projects/<app>/<video>/out/<video>.mp4
```

## Setup (done on this machine)

```
npm install
npx playwright install chromium
```

Needs Node 22+ and `ffmpeg`/`ffprobe` on the PATH.

## Studio preview

```
npm run studio
```

The preview shows placeholder props. Real renders read `render/props.json`.
