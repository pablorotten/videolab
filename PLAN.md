# videolab — Build Plan

Goal: scaffold the recorder (A) and composer (B), then record **one flow of one
app end to end** — from `demo.yml` in the app repo to a finished MP4 in
`apps/<app>/out/`.

Every phase starts with a checkpoint with the user before installing anything.

---

## Phase 0 — Confirm open decisions ✅ (2026-11-06)

Settled:

1. **Recorder engine**: Microsoft `playwright-cli` (testreel/plain-Playwright as fallback).
2. **Composer engine**: Remotion.
3. **First target app**: `movie-kombat` (`C:\Users\pablo\DEV\projects\movie-kombat`,
   Vite + React; starts with `npm run dev`, default URL `http://localhost:5173`).
   Its 2–3 demo flows to be chosen in Phase 2.
4. **OpenCode permissions**: *pending* — add videolab and
   `movie-kombat` to `external_directory` so the app-repo session
   can write assets here (user action, before Phase 2 E2E).

## Phase 1 — Repo foundation

1. `git init`, first commit of README/AGENTS/PLAN.
2. Create `.gitignore`: `node_modules/`, `apps/*/raw/`, `apps/*/out/`, `*.mp4`.
3. Create directory skeleton: `bin/`, `studio/`, `apps/movie-kombat/{flows,raw,out}`.
4. `npm init` at repo root — **vs separate `bin/package.json` / `studio/package.json`**
   (hard rule: never shared `node_modules` with target apps; a single root
   workspace is fine and keeps installs simple). Decide with user.
5. `npx playwright install chromium` (browser download — confirm first; Node and
   ffmpeg 9.0.2 already exist).

Output: clean git repo with skeleton, toolchain ready.

## Phase 2 — Recorder (A)

1. **`demo.yml` contract** — define the schema the app repos will hold:
   `name`, `start_command`, `url`, `viewport`, optional `seed`/`setup`.
   Keep it minimal; document in `bin/README.md`.
2. **`bin/recorder` CLI** (Node script, runnable via `npx`/`bin` entry or a
   workspace script). Responsibilities:
   - Read `demo.yml` from the current working directory (the app repo).
   - Start the app process, wait for its URL to respond (poll with timeout).
   - Run a **flow** (a Playwright script or playwright-cli scenario) against it.
   - Capture video per flow segment into `videolab/apps/<app>/raw/<flow>.webm`.
   - Always tear the app down afterwards, even on failure; non-zero exit on error.
3. **First flow** — write `apps/<app>/flows/<flow-1>.js` (or the playwright-cli
   equivalent) for the app's simplest, most demo-worthy path.
   Record it: raw footage lands in `apps/<app>/raw/`.

Output: `videolab record <flow>` works from the app repo, produces raw footage.

## Phase 3 — Composer (B) ✅ (2026-11-07)

1. Scaffolded `studio/` as a Remotion project using the root package layout
   chosen in Phase 0. Remotion 4 + React are installed at the repo root.
2. Built shared components: `<Intro>`, `<Outro>`, `<Zoom>` (Ken Burns-style
   zoom on raw footage), `<Caption>` (timing data from the flow script).
3. Added the first composition config in `studio/src/DemoVideo.tsx`, mapping raw
   footage + flow metadata → Remotion compositions (intro/outro, segment order,
   caption timings).
4. Rendered `apps/movie-kombat/out/movie-kombat-collection-kombat.mp4`:
   67.8 seconds, 1280×800, with intro, outro, five timed captions, and zooms.
5. Added `videolab compose <flow>`; it normalizes Chromium WebM with ffmpeg and
   invokes the Remotion render.

Output: `videolab compose <flow>` produces a finished MP4.

## Phase 4 — End-to-end validation

1. Full run from the **app repo session**: agent invokes videolab CLI →
   record → compose → MP4 in `apps/<app>/out/`.
2. Watch the video; tune viewport, pacing, zooms, captions.
3. Record and compose flow 2 (and optionally 3) to prove reusability.
4. Update AGENTS.md status + worked-usage notes; tidy kept assets
   (raw/ stays disposable).

## Phase 5 — Polish (later, optional)

- Voiceover track in Remotion (TTS or recorded audio).
- Chapters/segment markers via playwright-cli.
- App presets (shared viewport/theme constants).
- CI smoke: record the shortest flow on a schedule to catch app regressions.

---

## Risks / notes

- **Player-first**: verify `playwright-cli` actually captures good footage
  (cursor, smoothness) before building the CLI around it; fall back to plain
  Playwright + ffmpeg if not.
- File sizes: raw WebM from headless Chromium is fine; encode to MP4 with
  ffmpeg (already installed) before/inside Remotion if needed.
- Windows paths in YAML (`start_command`) — use `npx`-style cross-platform
  commands.
- Keep videolab as a CLI contract; sessions never `cd` into it.
- MP4s and `raw/` never get committed — enforced by `.gitignore` in Phase 1.
