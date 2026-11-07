# videolab — agent context

Video lab for recording and editing demos of my apps.

- **Record**: Playwright drives the real running app and saves footage.
- **Compose**: Remotion adds intro, outro, zooms, and captions to that footage.

The model writes and runs code. It never generates video pixels.

## Status

Rebuilt from scratch (v0.2). First end-to-end run passed: `movie-kombat/library-tour`
recorded and composed to `out/library-tour.mp4` (22.6 s). Timings and zooms in its
`video.json` are a first draft; tune them after watching the output.
Chromium for Playwright is installed.

## Layout

```
bin/videolab.js                  CLI entry: list | record <video> | compose <video>
lib/                             recorder, composer, app/path helpers (do not edit per video)
studio/src/                      Remotion project: generic Demo composition (do not edit per video)
apps/<app>/videos/<video>/       one self-contained workspace per video
  flow.js                        Playwright script (default export)
  video.json                     timing, zooms, captions (source of truth for the edit)
  raw/footage.webm               generated, gitignored, disposable
  render/                        generated, gitignored (normalized MP4, props.json)
  out/<video>.mp4                generated, gitignored, the final video
```

## Contract for agents working from an app repo

Run videolab from the app repo (the one with `demo.yml`), never `cd` into videolab:

```
node <videolab>/bin/videolab.js list
node <videolab>/bin/videolab.js record <video>
node <videolab>/bin/videolab.js compose <video>
```

The app repo keeps only `demo.yml` (`name`, `start_command`, `url`, `viewport`).
`name` must match the folder under `apps/`.

To make a new video, copy an existing `apps/<app>/videos/<video>/` folder and edit
its `flow.js` and `video.json`.

**May edit:** `apps/<app>/videos/<video>/flow.js` and `video.json` for the app being recorded.

**Never edit:** `bin/`, `lib/`, `studio/`, `package.json`, the lockfile, another app's
folder, or any `raw/`, `render/`, `out/` directory.

## video.json

Times are seconds relative to the recording; `intro` and `outro` are seconds too.

- `title`, `subtitle`, `tagline`: intro and outro text.
- `fps` (default 30), `intro` (default 3), `outro` (default 4).
- `cursor` (default false): draw a pointer and click ripples in the recording. Read by
  `record`, not `compose`. Headless Chromium does not show the real mouse pointer.
- `zooms`: keys `{at, scale, originX?, originY?}`. `at` must strictly increase.
  `originX`/`originY` are percentages of the frame and set where the zoom focuses.
  Transitions ease in and out.
- `captions`: `{from, duration, text}`.

## Hard rules

- Never fake app behavior. Demo footage must come from the real UI. Zooms, captions,
  intro, and outro are fine; replaying one take as if it were several, or any
  simulated result, is not.
- Do not commit MP4s, WebMs, `raw/`, `render/`, or `out/`.
- Do not install storylab/stickman tooling here.
- No shared `node_modules` between videolab and target apps.
