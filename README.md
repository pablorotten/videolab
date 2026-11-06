# videolab

Shared video lab for producing demo videos of my apps.

Two layers, one repo:

- **A — Record**: drive a real running app with Playwright, capture actual footage,
  encode with ffmpeg. Evidence, not recreation.
- **B — Compose**: take that footage into Remotion and add intro, outro, zooms,
  captions, and optional voiceover.

The models in OpenCode do not generate video. They write and run code (browser
scripts, Remotion components, ffmpeg commands); the video is the output of that
code rendering the real app.

## Why a separate repo

- Keeps app repos clean: no video dependencies, no browser tooling, no large assets.
- Central place for brand, shared intros/outros, and reusable Remotion components.
- One recorder and one editing setup for every app.

## Architecture (planned, not built yet)

```
videolab/
  bin/                 # A: recorder CLI (Playwright)
  studio/              # B: Remotion project
  apps/
    <app>/
      flows/           # scenario definitions for that app
      raw/             # captured footage (gitignored)
      out/             # final MP4s (gitignored)
```

Each target app repo keeps only a small `demo.yml` describing how to start it
(start command, URL, seed, viewport). All video assets and outputs live here.

## How it is meant to be used

1. Open an OpenCode session **in the app repo** (the app must run from there).
2. Ask the agent to use videolab to record a flow.
3. The recorder starts the app, drives the real UI, and writes footage to
   `videolab/apps/<app>/raw/`.
4. Render with Remotion into `videolab/apps/<app>/out/`.

The agent should *invoke* videolab as a CLI, not `cd` into it.

## Status

**Not initialized.** No git, no `package.json`, no dependencies installed.
This is a purpose/context scaffold only.

## Decisions still open

- **A engine**: Microsoft `playwright-cli` (official, animated cursor, chapters)
  vs `testreel` (JSON steps, window chrome, MP4/GIF) vs plain Playwright video.
  Recommendation so far: `playwright-cli` as the base, `testreel` if we want
  zero-glue JSON configs.
- **B engine**: Remotion (recommended) vs Videowright (HTML/CSS segments +
  voiceover pipeline).
- First target app and first 2–3 flows to record.

## Environment facts

- Windows, working from `C:\Users\pablo\DEV\projects`.
- Node `v24.22.0`, npm `11.10.0`, ffmpeg `9.0.2` already installed.
- Playwright's Chromium is **not** installed yet.
- OpenCode here is v2.2.5; models are text-only, so all video work is code-driven.
- `external_directory` permission currently allows only the `learn-english`
  reference. Add videolab and the target app paths when wiring this up.

## Non-goals

- Text-to-video models (Veo, Sora, Kling). Not integrated in OpenCode, and they
  cannot show a real app.
- Faceless/stickman story videos. That is `storylab`, deliberately separate.
