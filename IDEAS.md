# videolab ideas

A living list of future ideas, experiments, and things worth exploring. Nothing
here is committed work — when an idea graduates, it moves to `PLAN.md` (and a
GitHub issue) and gets checked off here. The graveyard at the bottom records
what was decided against, so it doesn't get re-proposed.

Started 2026-11, alongside the `v0.4 - dual mode` plan.

## Capture experiments

- Speed ramps: detect long idle stretches from the events log (network waits,
  compile stalls, thinking pauses) and speed them up 4x at compose time.
  Chronology preserved, no fake states — the boring part is real, just shorter.
- Multi-viewport takes: run the same flow twice at desktop and mobile widths,
  compose side by side or stacked. Pairs naturally with a `Compare` primitive.
- Dark/light mode pass: same flow, `colorScheme` override, cut between them.
- Keyboard overlay: visualize real keystrokes as a small lower-third during
  typing-heavy flows (from the event log, presentation-only).
- Take manager: record one take per beat instead of one continuous session, and
  compose the takes in order. Each take is still real footage; the edit is just
  more deliberate. Needs care so the "one continuous session" record story
  stays available for docs.
- Slow-motion micro-moments: capture at 60 fps, retime one key interaction to
  half speed for emphasis.
- Scroll-driven camera drift: log scroll positions, let the composition move
  gently with the page instead of hard zooms.
- Cold vs warm start: two takes of the same first interaction, one on a cold
  server, one warm — as a compare shot. Honest, and a nice dev-tool story.
- Pointer easing curves: interpolate the painted cursor between real events;
  try spring vs linear vs ease-out and compare side by side.
- Cookie banner / consent overlay suppression via injected CSS: presentation
  only, but it hides something the app chose to show. Open question — decide
  deliberately, don't slip it in.

## Composition experiments

- Background variants: seeded mesh gradients, subtle grain, duotone derived
  from the app's accent color. Deterministic by seed, per the scene rules.
- Auto-brand: extract an accent color from the app's logo or favicon at compose
  time and use it as the *starting* palette, so `video.json` only overrides.
- Beat-synced cuts: derive cut/zoom points from `events.json` (clicks, marks)
  instead of hand-authoring every `zooms.at`.
- Caption styles: typewriter reveal, slide-up lower thirds, per-word timing.
  All as data in `captionStyle`, never component edits.
- Transition presets between sections: whip pan, cross dissolve, iris. Data
  keys, not new hardcoded looks.
- Motion blur on fast zooms — experiment with what Remotion allows at 60 fps.
- UI sound pack: tiny synthesized click/pop SFX as an opt-in layer (the plan
  allows optional SFX; music stays out).
- Poster/thumbnail generator: branded first-frame plus title, exported
  alongside `out/<video>.mp4`.
- Contact sheets: auto-generate an N-frame grid for visual PR review (ties into
  the "every visual PR attaches a contact sheet" rule in PLAN.md).
- Determinism check as a test: render the same workspace twice, diff frame
  hashes, fail CI on drift.

## Workflow and tooling

- `videolab validate`: lint `video.json` — zooms strictly increasing, captions
  within footage duration, unknown keys as warnings.
- `videolab doctor`: verify ffmpeg/ffprobe, the Playwright browser, a free
  port, and that `demo.yml` parses — before a long session starts.
- Proxy renders: half-res, 15 fps draft for style iteration; full-res only
  after approval. Could cut compose iteration time a lot.
- Render cache: hash (footage + video.json + studio code) → skip re-render
  when nothing changed.
- JSON schema for `video.json` so editors autocomplete and warn while editing.
- Named template presets: small `video.json` fragments ("clean", "editorial",
  "terminal") the scaffold can merge, so a new video doesn't start from zero.
- Storyboard generator: sample stills from the footage, draft beats/captions
  as a starting point for the model to refine with the user.
- Batch compose: `videolab compose --all` across apps for re-renders after a
  studio tooling change.
- Snapshot diff: show what changed between the last `.snapshots/` entry and
  now, before deciding to restore.

## Studio UX

- Timeline view: map zooms/captions/beats onto footage time as one scrubber.
- Zoom origin picker: grab a frame, click the focus point, write
  `originX`/`originY` into `video.json`. Keeps the canvas read-only while
  making zoom framing a one-click edit instead of guessing percentages.
- Caption WYSIWYG with the video's real font and size in the panel.
- Side-by-side video.json diff against the last snapshot.

## Model-agnostic video tools

The filter for anything in this section: the tool is only the *engine* — the
brain is our own agent (e.g. OpenCode pointed at any model). It must produce
motion graphics via code or scenes, be connectable through API keys, MCP or
agent skills, and must NOT be a closed SaaS with its own AI/credits or a
generative-pixel video model.

Discarded by the filter: Motion / motion.so (closed SaaS, own credits and
engines), ArtCraft (closed credit-based model catalog), generative video
stacks (Veo, Kling, Sora, ComfyUI), and LLM+stock-footage assemblers
(MoneyPrinterTurbo, ShortGPT — assembled video, not motion graphics).

Candidates to evaluate:

- **Remotion** (remotion.dev): React-as-video — the incumbent videolab already
  runs on. Official Agent Skills explicitly support OpenCode:
  `npx remotion skills add` installs `/remotion-create`, `/remotion-markup`,
  `/remotion-render`, `/remotion-captions`, `/remotion-docs`. Its hosted MCP
  was shut down Oct 2026; skills are the supported path.
- **Motion Canvas** (motioncanvas.io): open-source TypeScript animation
  library with a built-in timeline editor and audio sync. Zero AI inside —
  the agent writes the TS. More animation-first (vector, narrated explainers)
  than Remotion.
- **Revideo** (github.com/midrender/revideo, formerly redotvideo): Motion
  Canvas fork adding headless rendering, a REST API and a React player —
  designed to be driven programmatically; the open-source "Remotion
  alternative" for embedding video generation in an app.
- **Blender + mcp-for-blender** (ahujasid): MCP server (uvx-installable) that
  lets any MCP-capable agent drive Blender — scenes, posing, camera, render.
  The "Tu novia dice" pipeline shape, with the agent as the animator.
  Optional text-to-3D hooks (Tripo, Rodin, Meshy) exist but are not required.
- **Manim Community Edition** (manim.community): Python animation DSL, the
  most battle-tested with LLMs of the bunch. Math/explainer register rather
  than brand motion graphics, but agent ergonomics are the best documented.
- **Three.js** (threejs.org): the standard WebGL 3D library — not a video tool
  by itself, but a *companion* inside the engines above: `@remotion/three`
  renders Three.js scenes inside Remotion compositions (headless-friendly,
  deterministic), and it would drive from Blender-style node/scene setups via
  code. This is the low-poly "Tu novia dice" creature route without leaving
  Remotion. Cost: more craft per scene (cameras, lighting, materials), heavier
  still-iteration, and 3D expressiveness is harder for a cheap model to nail
  than SVG transforms. Keep as an option for a 3D variant, not the default.

### Reference recipe — the "agent motion graphics" workflow

Source: Rexan Wong's X thread (x.com/rexan_wong/status/2103707054108299437,
Nov 2026). Audited: none of the tools are his, no affiliations found; the
thread is also an episode of his build-in-public content machine, but the
method is sound. The steps below are the recipe with the small print added.

1. **Reference-first.** Pick 1–2 videos to direct from (whatships.com —
   independent catalog, free). Naming a style beats describing one; without a
   reference the model falls back to centered text + gradient + fades.
2. **Engine.** Remotion (official agent skills, OpenCode explicitly
   supported) or HyperFrames (HeyGen's open-source HTML→MP4 renderer, newer,
   less battle-tested). Both: agent writes code, deterministic re-render.
3. **Real UI components (optional).** 21st.dev MCP for React/Tailwind
   components so the agent doesn't invent fake-looking buttons. Freemium:
   catalog free, AI generation paid. Never use it to fake an app's own UI.
4. **Context dump, 3 storyboards.** Brand assets + real product screenshots +
   reference + braindump; ask for 3 storyboard variants, pick a direction
   instead of fixing the first idea.
5. **Stills before motion.** One still frame per scene, approved before any
   animation. A still costs seconds (1 frame + PNG); a full render costs
   minutes (every frame + encode). Most errors are static (layout, copy,
   hierarchy) — catch them at 1/750th of the cost.
6. **Director notes.** Camera language and concrete edits ("slow every zoom
   to 0.7x", "hard cut here"), not "make it better".

Small print he omits: 21st.dev AI credits, Remotion's company license at
scale, and that step 6 is the un-automatable work.

Videolab tie-in: steps 2, 5 and 6 already exist here (Remotion core, `studio`
preview without rendering, notes→`video.json`). Adoptable additions:
reference-first in the film brief, 3 storyboard variants before committing
`video.json`, and a per-beat still sheet as an approval artifact. Film mode
(PLAN.md v0.4) *is* this workflow.

Evaluation angle for all five: same brief into OpenCode, then score the edit
loop — can the agent change one caption without touching anything else
(videolab's `video.json` property), re-render fast, and keep the rest of the
video byte-stable?

## Wilder ideas

- Narration from a user-provided script via TTS. The plan bans synthesized
  *music*; narration is content, so this deserves one deliberate experiment
  before a yes or no.
  - **edge-tts** (Python, Microsoft voices, $0): the one "Tu novia dice"-style
    pipelines use — script in, measured durations out, which is what makes
    scene sync possible before animating. The starting point given the $0-model
    plan.
  - **Kokoro-82M** (open weights, local): offline alternative with decent
    polish, no API dependency.
- Two-app crossover videos: app A's export meets app B's import — camera pans
  between two `BrowserShot`s. Good for integrations.
- Live-reload demos: record while a dev server hot-reloads, showing the change
  land in the UI in real time.
- Changelog reel: auto-compose the last N git tags of an app as one video,
  with tag notes as captions.
- Social presets: framed 9:16 and 1:1 exports that pan within desktop footage
  (`width`/`height` already enables this — what's missing is good default
  framing and pacing per format).
- Diagram explainer from user-provided icons: the user drops SVG/PNG icons in
  a folder and describes the schema in natural language ("client and server,
  arrow between them, then the gateway appears in the middle with zoom"). The
  agent transcribes it to a manifest (nodes, edges, appearance order, zooms,
  labels) plus a Remotion component that paints icons, arrows and geometric
  shapes as SVG. Output: clean silent MP4 → the user takes it to CapCut for
  music/voiceover. Same family as the LLM-explainer video: film mode, no
  recording, free model viable (it's spec → code, not craft). New pieces vs
  that project: a small diagram data format and an icons+arrows SVG
  component — a day or two, not a rewrite. This is film mode's canonical
  use case.
- Local status page: tiny web view of every workspace with thumbnails, mode,
  and status, so `list` gets a face.
- CI final renders: footage lives in gitignored `projects/`, so this needs
  artifact upload — heavy, but it would let visual PRs carry real videos.

## Graveyard (decided against — don't revive without new reasons)

- AI-generated video pixels. Hard no.
- Fabricated app states, faked results, replaying one take as several. Hard no.
- Synthesized music. No by default; user-provided audio files only.
- Paid SaaS TTS (ElevenLabs). Closed SaaS with its own AI/credits; narration
  stays on free/open tooling (edge-tts, Kokoro-82M).
- Arbitrary cuts or reordering in record mode. Out of scope; head/tail trim
  only.
- Killing servers videolab didn't start. Never.
