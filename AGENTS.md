# videolab — agent context

This repo is the video lab for recording and editing demos of my apps.

## What it is

- **A (record)**: Playwright drives a real app and captures footage.
- **B (compose)**: Remotion adds intro, outro, zooms, captions, voiceover.

The model writes and runs code; it never generates video pixels.

## Current status

**Scaffold only.** No git, no `package.json`, no dependencies installed.
Do not assume any tooling exists yet. Confirm setup steps with the user before
installing packages or downloading browsers/assets.

## Conventions

- The app under test lives in its own repo and must run from there.
- An OpenCode session for recording should start in the app repo, not here.
- videolab is invoked as a CLI/tool; do not `cd` into it to work.
- Per-app files go under `apps/<app>/` (flows, raw, out).
- Final videos go to `apps/<app>/out/`; raw footage is disposable.
- No shared `node_modules` between videolab and target apps.
- Keep `demo.yml` in the target app repo; keep all video assets here.

## Planned layout

```
bin/          # recorder CLI
studio/       # Remotion project
apps/<app>/   # flows/, raw/, out/
```

## Chosen directions (tentative)

- Recorder: Microsoft `playwright-cli` first; `testreel` as a lower-code alternative.
- Editor: Remotion.
- Optional: Videowright if we want a pure explainer instead of real footage.

## Hard rules

- Never fake app behavior in a demo. If it is a product demo, it must record the
  real UI. Recomposed/mocked footage belongs to marketing, not evidence.
- Do not commit MP4s or `raw/`.
- Do not install the storylab/stickman tooling here.

## Next step

Scaffold the recorder and one app config, then record a single flow end to end.
