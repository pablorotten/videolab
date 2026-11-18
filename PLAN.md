# videolab plan v0.5: three modes — record, film, motion

Supersedes the v0.4 "dual mode" plan. Same engine, same hard rules; one new mode
and the fork-on-create reconciliation.

## Goal

Keep videolab as one engine producing three deliberate output types, all from
project-owned template copies (fork-on-create):

1. **record** (existing, improved): a continuous recording of the real app, for
   documentation, changelogs, or raw material to edit by hand in CapCut.
2. **film** (planned): Playwright stills of the real app composed into a branded,
   edited promo — the finished product, closer to
   `demo-made-with-claude-opus.mp4`.
3. **motion** (new): agent-authored motion graphics with **no app and no
   capture**. The user provides assets (icons, logo, brand colors) and a brief;
   the model composes diagrams, explainers, and icon animations with Remotion.
   Canonical example: "here are server, computer, and phone icons — explain
   client-server architecture with arrows." Output is a silent MP4; the user
   adds music/voiceover in CapCut.

The quality gap with reference videos is not the renderer. It is the capture
substrate (film), the art direction (all modes), and the expressiveness ceiling
of a single shared composition (solved by fork-on-create). This plan keeps
Remotion and addresses all three.

When a user asks videolab for a new video, the tool (or the agent) must ask which
mode they want before scaffolding anything. Motion is the only mode that does not
require an app repo.

## Non-goals

- No AI-generated video pixels, ever. Motion draws vector primitives and
  user-provided assets; it never generates raster "footage".
- No fabricated app states or fake results. Stills (film) and footage (record)
  must come from the real UI. Presentation (cursor, titles, background, window
  chrome, diagrams) may be drawn. Motion videos are illustrations: they may draw
  schematic UI, but must not imitate a specific real app to fake its results.
- No music by default. Optional SFX or a user-provided audio file only.
- No per-app content committed to this repo. Everything still lives under
  `projects/`, which stays gitignored.
- No shared `node_modules` with target apps.

## Fork-on-create (the architecture everything sits on)

`templates/<name>/` holds tracked Remotion templates. `videolab new <video>
--mode <m>` copies the mode's template into `projects/<app>/<video>/studio/src/`,
and from then on that copy is the video's own code:

- Per-video design lives in the project's copy — never in the tracked template,
  never in `bin/`/`lib/`.
- Templates may evolve; existing videos are never affected (they run their own
  copy). Adopting an improvement into an old video is a manual, deliberate copy.
- `bin/` and `lib/` are the shared engine: recording, normalization,
  orchestration. They run for every video — keep them generic and stable.

The v0.4 plan spec'd film `scene.tsx` importing a shared tracked scene library
(`../../../studio/src/scene` + a webpack `@videolab/scene` alias). That
contradicted fork-on-create and is dropped: **the scene library lives inside each
template**, so every project forks its own copy. No webpack alias, no
`studio/.generated/` fallback.

## Product model

A video workspace has a **mode**, stored in `video.json`:

```json
{ "mode": "record" }   // default for workspaces without the key
{ "mode": "film" }
{ "mode": "motion" }
```

| | record | film | motion |
|---|---|---|---|
| Capture | continuous WebM | named 2x PNG stills + event log | none — user assets only |
| Input | app repo + `demo.yml` | app repo + `demo.yml` | assets folder + brief (no app needed) |
| Edit | intro, outro, zooms, captions, optional window stage | model-authored `scene.tsx` on the scene library | model-authored `scene.tsx` on the scene library |
| Output | 1080p (optional 60 fps) | 1080p60, optional 720p/GIF | 1080p60, optional 720p/GIF |
| Best for | docs, tutorials, raw B-roll | promos, landing pages, social | explainers, diagrams, icon animations |

Mode → template mapping: `record` → `templates/demo`, `film` → `templates/film`,
`motion` → `templates/motion`. A `template` key in the `new` invocation may
override the mode's default template.

## CLI

```
videolab new <video> [--mode record|film|motion] [--template <name>]
videolab list                                list workspaces with mode + status
videolab record <video>                      capture (video or stills, per mode)
videolab compose <video>                     render (per mode/template)
videolab studio <video>                      Remotion preview for that workspace
```

`videolab new` is interactive when stdin is a TTY:

```
What kind of video?
  1) Demo recording — real continuous footage (docs, B-roll for CapCut)
  2) Showcase film — stills of the real app composed into a promo
  3) Motion graphics — icons and diagrams, no app needed

Mode [1]:
```

With `--mode`, it never prompts. Without a TTY and without `--mode`, it exits
with the three options instead of guessing.

**Motion does not require a repo or `demo.yml`.** It can be invoked from any
directory: the workspace name segment defaults to the current directory's
basename, or `--app <name>` overrides it. `readDemo()` is only enforced for
record and film; motion skips app startup entirely, so `record` is a no-op that
validates assets instead.

`record` keeps its name in all modes: it means "capture the workspace according
to its mode" (motion: validate assets, nothing to capture). `compose` means
"produce the final file".

`list` output example:

```
movie-kombat/collections-search   record   recorded   rendered
movie-kombat/film-tour            film     shots(11)  -
motion/client-server-explainer    motion   assets(3)  rendered
```

`AGENTS.md` must tell agents to ask the user which mode they want before running
`new`, and to pass `--mode` explicitly.

## Workspace layouts

```
projects/<app>/<video>/                     record
  video.json         mode + beats (source of truth for the edit)
  flow.js            Playwright script, default export
  studio/src/        project-owned copy of templates/demo
  raw/footage.webm   generated
  render/            generated work dir (entry.tsx, props.json, footage.mp4)
  out/<video>.mp4    generated final output

projects/<app>/<video>/                     film
  video.json         mode + film config (duration, brand, audio)
  flow.js            Playwright script with shot()/mark() helpers
  scene.tsx          the composition, written by the model (imports the project's
                     own scene library from studio/src/)
  shots/             generated stills + shots.json
  events.json        generated click/scroll log
  studio/src/        project-owned copy of templates/film (scene library lives here)
  render/            generated
  out/<video>.mp4    generated

projects/<app>/<video>/                     motion
  video.json         mode + motion config (duration, fps, brand)
  assets/            user-provided SVG/PNG icons, logo, brand refs
  scene.tsx          the composition, written by the model (imports the project's
                     own scene library from studio/src/)
  studio/src/        project-owned copy of templates/motion
  render/            generated
  out/<video>.mp4    generated
```

`projects/` remains gitignored and disposable. Snapshots capture the whole
folder, including the project's `studio/` copy and assets.

## Mode contracts

### `video.json`

Record mode keeps its current shape, plus new optional keys:

```json
{
  "mode": "record",
  "title": "Movie Kombat",
  "subtitle": "Collections, search & streaming platforms",
  "tagline": "Build your list your way.",
  "fps": 60,
  "intro": 3,
  "outro": 4,
  "cursor": true,
  "quality": "high",
  "stage": "window",
  "zooms": [{ "at": 0, "scale": 1 }],
  "captions": [{ "from": 10, "duration": 2.5, "text": "..." }],
  "beats": [{ "at": 18, "kicker": "02 — SCENARIOS", "title": "Plan for every future", "body": "..." }]
}
```

Film mode:

```json
{
  "mode": "film",
  "title": "Movie Kombat",
  "tagline": "Build your list your way.",
  "fps": 60,
  "width": 1920,
  "height": 1080,
  "duration": 48,
  "brand": {
    "background": "#0e1620",
    "accent": "#f0b429",
    "text": "#f7f4ee",
    "muted": "#a8b0bd",
    "font": "IBM Plex Sans"
  },
  "audio": null
}
```

Motion mode:

```json
{
  "mode": "motion",
  "title": "Client-server architecture",
  "fps": 60,
  "width": 1920,
  "height": 1080,
  "duration": 40,
  "brand": { "background": "#101418", "accent": "#67e8f9", "text": "#f5f7fa", "font": "Jost" }
}
```

Brand values can also come from an optional `brand:` block in the app's
`demo.yml` (record/film); `video.json` wins. videolab only reads `demo.yml`,
never writes it.

### `flow.js`

Record keeps today's context: `{ page, log, demo }`.

Film adds capture helpers:

```js
export default async function flow({ page, log, demo, shot, mark }) {
  await page.goto(demo.url, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);

  await shot("hero");
  await page.getByRole("button", { name: /Movie Collections/ }).click();
  await page.getByRole("heading", { name: "Tarantino's favourites" }).click();
  await shot("collection", { cursor: { x: 0.63, y: 0.42 }, click: true });

  mark("collection-loaded");
}
```

- In record mode, `shot` is a no-op that logs a warning; `mark` writes a timing.
- In film mode, `shot(name, opts)` saves `shots/<name>.png` at 2x DPR and records
  the events since the previous shot. Options: `{ fullPage, clip, cursor, click,
  hideScrollbars }`.
- Capture automatically listens for real `mousedown` and `scroll` events and
  writes `events.json` with normalized coordinates, target text, and timestamps.
  This is what the scene uses to place the painted cursor and ripples.
- Capture injects presentation-only CSS in film mode: hide scrollbars, hide the
  recording cursor overlay, disable text caret. No app behavior is changed.

Motion has no `flow.js`.

### `scene.tsx` (film and motion)

One composition per film/motion video, authored by the model in the workspace.
It imports the scene library **from the project's own template copy** (relative
import, e.g. `./studio/src/scene`) and receives generated props:

```tsx
import React from "react";
import { AbsoluteFill, staticFile, useCurrentFrame } from "remotion";
import { Film, Background, Camera, BrowserShot, TitleBlock, Cursor } from "./studio/src/scene";

export default function Scene({ shots, events, film, brand }) {
  const frame = useCurrentFrame();
  return (
    <Film brand={brand} duration={film.duration}>
      <Background variant="mesh" seed={7} />
      <Camera keys={[
        { at: 0, x: 0, y: 40, scale: 0.94 },
        { at: 90, x: -40, y: 0, scale: 1.02 },
      ]}>
        <BrowserShot src={staticFile(shots.hero.src)} url="localhost:3000" width={1180} />
        <Cursor keys={[{ at: 40, x: 0.62, y: 0.44 }, { at: 70, x: 0.62, y: 0.44, click: true }]} />
      </Camera>
      <TitleBlock at={20} kicker="01 — WORKSPACE" title="Model your assets" body="..." />
    </Film>
  );
}
```

Motion uses the same shape with diagram primitives instead of `BrowserShot`:

```tsx
<Film brand={brand} duration={motion.duration}>
  <Background variant="mesh" seed={3} />
  <Camera keys={[{ at: 0, scale: 0.9 }, { at: 200, scale: 1.05 }]}>
    <Icon id="server" at={10} x={0.3} y={0.5} size={180} />
    <Icon id="laptop" at={10} x={0.7} y={0.5} size={180} />
    <Arrow from="server" to="laptop" at={30} label="HTTPS request" style="draw" />
  </Camera>
  <TitleBlock at={0} title="How a request travels" body="..." />
</Film>
```

## Scene library (inside each template, forked per video)

Keep the library small, composable, and data-driven. Each template ships the
primitives it needs; duplication between templates is accepted (they fork
independently). v1:

| Primitive | Purpose | demo | film | motion |
|---|---|---|---|---|
| `Film` | root: duration, fps, brand fonts/colors, safe area | – | ✓ | ✓ |
| `Background` | branded gradient/mesh, optional blurred logo; deterministic by seed | – | ✓ | ✓ |
| `Camera` | keyframed 2.5D transform: x, y, scale, rotateX, rotateY, opacity | – | ✓ | ✓ |
| `BrowserShot` | still in a browser window: chrome bar, URL, radius, shadow, 2x image | – | ✓ | – |
| `Stack` | layered screenshots in perspective | – | ✓ | – |
| `Wall` | grid montage of stills with slow drift | – | ✓ | – |
| `Compare` | two windows side by side with labels | – | ✓ | – |
| `Icon` | user-provided SVG/PNG asset, placed + scaled, draw/pop entrance | – | – | ✓ |
| `Arrow` | SVG path between anchors: draw-on animation, label, arrowhead | – | – | ✓ |
| `DiagramNode` | icon + label card, the unit of a motion diagram | – | – | ✓ |
| `TitleBlock` | kicker + headline + supporting line, animated entrance | – | ✓ | ✓ |
| `Cursor` | SVG pointer and click ripples, keyframed in normalized coords | – | ✓ | – |
| `Logo` | logo + wordmark intro/outro card | – | ✓ | ✓ |
| `Caption` | lower-third (already exists in templates/demo) | ✓ | ✓ | ✓ |

Rules:

- All motion is a pure function of `frame`. No timers, no randomness without a seed.
- Fonts load before the first frame; prefer local files, allow
  `@remotion/google-fonts` as a fallback.
- CSS 3D is allowed, but prefer plain transforms and a `perspective` on the camera
  wrapper. Test each primitive at 1080p60.
- Sizes are authored for a 1920x1080 canvas and scale with `useVideoConfig`.
- Icons: prefer SVG (scale + per-path draw animation); PNG allowed with
  pop/slide entrances only. The model must never rasterize or generate icons.

## Capture

### film — `lib/capture-stills.js` (new)

Reuses the existing app lifecycle from `lib/record.js`:

1. Start the app from `demo.yml`, wait for `demo.url`, warm it in a throwaway
   context (existing behavior).
2. New context with `viewport`, `deviceScaleFactor: 2`, no `recordVideo`.
3. Run `flow.js` with `shot`/`mark`.
4. Each `shot`:
   - hide scrollbars/caret via injected CSS;
   - wait for fonts, images, and `requestAnimationFrame` x2 so the frame is stable;
   - `page.screenshot({ path: shots/<name>.png, fullPage?, clip? })`;
   - write dimensions and a `cursor`/`click` hint into `shots.json`.
5. Write `events.json` from the event listener.
6. Stop the app.

Stills are lossless PNG by default. Add `"stillFormat": "webp"` if size becomes a
problem. A 10–15 shot film is expected to be 20–60 MB in `projects/`.

### motion — no capture

`record` on a motion workspace validates `assets/` (present, readable,
SVG-parseable or a known raster format), writes the asset manifest into
`render/props.json`, and does nothing else. No browser, no app, no `demo.yml`.

## Compose

Mode-dispatched; all paths render the project's own `studio/src` copy (existing
behavior from fork-on-create). `prepare()` currently hard-requires
`raw/footage.webm` — this splits by mode:

- **record**: today's path (normalize footage, props, render `templates` copy).
- **film** (`lib/compose-film.js`):
  1. Validate `video.json`, `shots/`, `events.json`, `scene.tsx`.
  2. Resolve brand: `video.json.brand` over `demo.yml.brand` over defaults.
     Copy logo/font assets into `render/assets/`.
  3. Write `render/props.json` with `shots`, `events`, `film`, `brand`, frame
     metadata.
  4. Generate `render/entry.tsx` importing the project's `scene.tsx`.
  5. `npx remotion render render/entry.tsx Scene out/<video>.mp4 --props
     render/props.json --public-dir <workspace> --overwrite`.
  6. Optional exports from `video.json.exports` (`["master", "web720", "gif"]`)
     via ffmpeg with `-movflags +faststart`; loudness normalization only if an
     audio track exists.
- **motion** (`lib/compose-motion.js`): same as film minus shots/events —
  validate `video.json`, `scene.tsx`, and the asset manifest; brand resolution;
  props; entry; render; exports.

`remotion.config.ts` at the repo root is only needed if Remotion cannot bundle an
entry that imports across the workspace boundary — not expected, since the
project's `studio/` copy already renders today. If it becomes necessary, the
fallback is copying `scene.tsx` into a gitignored `templates/.generated/` at
compose time; agents still may not edit templates.

## Record mode improvements

Cheap, opt-in, and backward compatible:

1. **High quality**: `quality: "high"` records at 2x the viewport
   (`recordVideo.size = viewport * 2`) and composes down to 1080p. Fixes soft zooms.
2. **60 fps**: output fps configurable; normalize the WebM to CFR first. Keep
   `fps: 30` unless set; the `new` scaffold for record writes 60.
3. **Window stage**: `stage: "window"` puts the footage in a browser frame on a
   branded background, with breathing room, replacing the full-bleed look.
4. **Editorial beats**: `beats` render like film `TitleBlock`s instead of caption
   pills. `captions` stay for click-level detail.
5. **Better cursor**: ease the pointer between real events and center ripples on
   the click target; keep it presentation-only.
6. **Head/tail trim**: `trim: { start, end }` removes setup and teardown without
   touching chronology. Arbitrary cuts/reordering are explicitly out of scope.
7. **Audio**: accept a user-provided file; no synthesis, no music by default.
8. **Output presets**: master 1080p + optional 720p WebM + GIF.

Existing `video.json` files without the new keys keep today's behavior.

## Art direction (this is what makes it "cool")

Tooling alone will still produce generic videos. Each mode's scaffold and
`AGENTS.md` must include a short, concrete brief:

- **All modes**: derive background and accent from the app's logo/brand (or the
  user-provided brand for motion). No default indigo. Start with a logo/wordmark,
  end with the tagline. No dead time.
- **Film**: 4–6 named beats with a numbered kicker, a headline, and one
  supporting line — outcomes, not click descriptions. App in a browser window
  with real URL chrome on a branded background; leave empty space. At least one
  non-flat shot: stack, wall, or compare. Cursor moves only when it is about to
  click something meaningful; prefer cuts and holds over constant motion.
- **Motion**: 3–6 diagram steps, each with one idea and one sentence. Icons
  appear when the narration reaches them; arrows draw on in the direction of the
  flow; one camera move per step, not constant drift. Label arrows with the
  actual protocol/action ("HTTPS request", "TCP handshake"), not "data".
- **Record**: `beats` are outcome sentences; the window stage gives breathing
  room; captions stay click-level.

Add a `docs/film-checklist.md` with these points and a frame-by-frame reference
breakdown of `demo-made-with-claude-opus.mp4` (intro, stack, beats, compare,
wall, outro) so the model has a target, not just primitives. Motion gets a
sibling `docs/motion-checklist.md`.

## Milestones

### M0 — Template generalization (0.5 day)

- Move `studio/src` → `templates/demo` (update `npm run studio`, AGENTS.md,
  scaffold source); `videolab new --mode record --template <name>` override.
- `video.json.mode` with `record` default; mode → template mapping.
- Split `prepare()`'s hard footage requirement by mode; no-footage compose path.
- Scaffold variants: film/motion workspaces get `scene.tsx` stub + assets dir
  (motion) instead of `flow.js` starter; motion skips `demo.yml` requirement.
- `list` shows mode and status.

Done when: an existing record workspace still records/previews/composes
unchanged, and `new --mode motion` scaffolds a workspace that composes a stub
scene without any app.

### M1 — Motion template v1 (1–2 days)

- `templates/motion` with the scene library subset: `Film`, `Background`,
  `Camera`, `Icon`, `Arrow`, `DiagramNode`, `TitleBlock`, `Logo`, `Caption`.
- Frame-pure, deterministic; icons from `assets/` referenced by manifest.
- Stub `scene.tsx` that renders one Icon, one Arrow, one TitleBlock.
- Art-direction brief + `docs/motion-checklist.md`.

Done when: `npm run studio` at the template renders a 3-node diagram with a
draw-on arrow from dummy assets.

### M2 — Motion reference video (1 day)

- Build a 30–50 s client-server explainer from user-provided icons
  (server/laptop/phone): request travels, response returns, framing zooms per
  step, title cards intro/outro.
- Score against `docs/motion-checklist.md`; iterate.

Done when: a reviewer would call it a finished explainer, not a template demo.

### M3 — Film capture (1 day)  *(v0.4 M2)*

- `lib/capture-stills.js`: app lifecycle, 2x context, `shot()`, `mark()`, event
  log, scrollbar/caret suppression, stability waits.
- `shots.json` + `events.json` shapes; reuse `record` plumbing rather than
  duplicating app startup.

Done when: a flow on a real app produces 10+ crisp stills and a usable events file.

### M4 — Film scene library v1 (2 days)  *(v0.4 M3)*

- Implement the film primitives: 2.5D camera, `BrowserShot`, `Stack`, `Wall`,
  `Compare`, painted cursor with ripples, logo intro/outro with brand tokens.
- Frame-pure and deterministic.

Done when: a hand-written scene can reproduce the reference beats with real stills.

### M5 — Film compose (1 day)  *(v0.4 M4)*

- Brand resolution, asset copying, props, generated entry, Remotion render.
- Optional exports and loudness normalization.
- Clear validation errors (missing shots, unknown shot name, absent scene).

Done when: `record` + `compose` on a film workspace yields `out/<video>.mp4`.

### M6 — Record upgrades (1 day)  *(v0.4 M5)*

- 2x capture, 1080p, optional 60 fps, CFR normalization.
- Window stage + beats + better cursor + trim.
- Keep old behavior for configs that do not opt in.

Done when: a record video re-renders with the stage on and zooms stay sharp at 1080p.

### M7 — Reference film and parity pass (1–2 days)  *(v0.4 M6)*

- Build one 40–55 s film on a real app using real stills.
- Score against `docs/film-checklist.md`, compare frames side by side with the
  reference; iterate on typography, spacing, easing, and compression.

Done when: the film passes every checklist item and a reviewer would call it a
finished promo, not a screen recording.

### M8 — Docs, CI and cleanup (0.5 day)  *(v0.4 M7)*

- `README.md`: three modes, commands, when to use which.
- `AGENTS.md`: mode question, ownership, film/motion pitfalls (fonts, still
  size, scrollbars, SVG parsing).
- Remove dead code, verify Windows paths, verify existing workspaces.

Total: about 9–11 focused agent days, plus the per-video authoring time.

## Execution notes

- Motion (M0–M2) fronts the milestone: it needs no capture work and validates
  the mode plumbing end to end with the least machinery.
- Film milestones (M3–M5) can run after motion lands; capture (M3) and scene
  library (M4) can proceed in parallel agents once M0 merges.
- M7 (reference film) is one driver with the user reviewing frames. Do not
  parallelize taste.
- Every visual PR attaches a contact sheet.
- Each worktree needs its own `npm install`; Playwright's browser is already
  installed globally on this machine.

## Acceptance criteria

A **motion** video is done when:

- [ ] 1920x1080 at 60 fps, deterministic across two renders.
- [ ] Built only from user-provided assets and drawn vector primitives.
- [ ] Background/accents from the user's brand, not the default indigo.
- [ ] Arrows draw on in flow direction, labeled with real actions.
- [ ] Icons appear in step with the explanation; one camera move per step.
- [ ] 3–6 steps, each one idea; logo/title intro, tagline outro; no dead time.
- [ ] Silent MP4 (+ optional 720p/GIF); audio only if user-provided.

A **film** is done when:

- [ ] 1920x1080 at 60 fps, deterministic across two renders.
- [ ] Background and accents derived from the app's brand, not the default indigo.
- [ ] App shown in browser chrome with real URL, not edge to edge.
- [ ] 4–6 beats with kicker, headline, and supporting line.
- [ ] At least one stack, wall, or compare shot.
- [ ] Cursor painted from the event log; ripples land on the click target.
- [ ] Logo/wordmark intro and tagline outro.
- [ ] No dead time, no loading spinners, no fabricated app states.
- [ ] Audio absent or user-provided; no synthesized music.
- [ ] `projects/` only; app repo untouched; nothing per-app committed.

A **record** video is done when:

- [ ] Same commands and `flow.js` as today.
- [ ] 1080p output; zooms sharp when `quality: "high"`.
- [ ] Optional window stage and beats render correctly.
- [ ] Footage still comes from one continuous real session.

## Risks and mitigations

| Risk | Mitigation |
|---|---|
| Mode plumbing regressions break existing record workspaces | M0's done-criteria: existing workspace composes unchanged; `mode` defaults to record |
| Motion becomes a generic template again | per-video `scene.tsx` is mandatory; the motion checklist is part of done |
| 3D transforms look different than expected | prefer 2.5D transforms; preview per primitive; no complex perspective chains |
| SVG icons vary wildly in quality/structure | manifest validates parse-ability; PNG fallback with pop/slide entrances; never rasterize/generate icons |
| Arrow routing between anchors looks wrong | anchor to `DiagramNode` edges, orthogonal segments first, curved as opt-in |
| Large still sets slow compose | WebP option, cap shots, copy only referenced assets |
| Fonts missing offline | bundle local font files; Google fonts only as fallback |
| Windows path separators in generated imports | always emit POSIX paths |
| Fake UI creeping in | hard rule: stills/footage from the real UI; motion never imitates a real app's results |
| Longer render times at 1080p60 | render master at 60; allow 30 fps fallback and 720p exports |

## Open decisions (defaults chosen above)

1. Motion defaults to 1080p60 and silent output; audio only user-provided. Confirm.
2. Film defaults to 1080p60; record keeps 30 unless configured. Confirm.
3. Music stays out; SFX optional. Confirm.
4. Arbitrary cuts/reordering in record mode stay out of scope; only head/tail trim.
5. Scene files are TSX; `video.json` stays JSON.
6. Scene library is duplicated per template instead of shared tracked code
   (fork-on-create consistency). Revisit only if duplication causes drift pain.
