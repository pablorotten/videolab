# videolab — Build Plan

Goal: scaffold the recorder (A) and composer (B), then record **one flow of one
app end to end** — from `demo.yml` in the app repo to a finished MP4 in
`apps/<app>/out/`.

Every phase starts with a checkpoint with the user before installing anything.

---

## Phase 0 — Confirm open decisions (with user)

Before any install, settle the choices flagged in README.md:

1. **Recorder engine** — Microsoft `playwright-cli` (recommended base) vs
   `testreel` (zero-glue JSON steps) vs plain Playwright script + ffmpeg.
   Default: `playwright-cli`.
2. **Composer engine** — Remotion (recommended) vs Videowright.
   Default: Remotion.
3. **First target app** — which repo, and its 2–3 demo flows.
4. **OpenCode permissions** — add videolab + the target app path to
   `external_directory` so a session in the app repo can write assets here.

Output: decisions recorded in AGENTS.md, nothing installed yet.

## Phase 1 — Repo foundation

1. `git init`, first commit of README/AGENTS/PLAN.
2. Create `.gitignore`: `node_modules/`, `apps/*/raw/`, `apps/*/out/`, `*.mp4`.
3. Create directory skeleton: `bin/`, `studio/`, `apps/<app>/{flows,raw,out}`.
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

## Phase 3 — Composer (B)

1. Scaffold `studio/` as a Remotion project (`studio/package.json`, its own
   `node_modules`).
2. Build shared components: `<Intro>`, `<Outro>`, `<Zoom>` (Ken Burns-style
   zoom on raw footage), `<Caption>` (timing data from the flow script).
3. **Composition config** — a small per-app file in `apps/<app>/` that maps raw
   footage + flow metadata → Remotion compositions (intro/outro, segment order,
   caption timings).
4. Render milestone: re-render flow 1 with intro + outro + 1–2 zooms into
   `apps/<app>/out/<app>-<flow>.mp4`.

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
