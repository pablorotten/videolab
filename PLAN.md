# videolab plan: two modes — record and film

## Goal

Keep videolab as one tool with two deliberate outputs:

1. **record** (existing, improved): a continuous recording of the real app, for
   documentation, changelogs, or raw material to edit by hand in CapCut.
2. **film** (new): Playwright stills composed into a branded, edited promo — the
   finished product, closer to `demo-made-with-claude-opus.mp4`.

The quality gap with the reference video is not the renderer. It is the capture
substrate and the fact that the reference was art-directed per video instead of
generated from a fixed template. This plan keeps Remotion (a better renderer than
the reference pipeline) and changes those two things.

When a user asks videolab for a new video, the tool must ask which mode they want
before scaffolding anything.

## Non-goals

- No AI-generated video pixels, ever.
- No fabricated app states or fake results. Stills must come from the real UI.
  Presentation (cursor, titles, background, window chrome) may be drawn.
- No music by default. Optional SFX or a user-provided audio file only.
- No per-app content committed to this repo. Everything still lives under
  `projects/`, which stays gitignored.
- No shared `node_modules` with target apps.

## Product model

A video workspace has a **mode**, stored in `video.json`:

```json
{ "mode": "record" }
{ "mode": "film" }
```

Missing `mode` means `record`, so every existing workspace keeps working.

| | record | film |
|---|---|---|
| Capture | continuous WebM | named 2x PNG stills + event log |
| Edit | intro, outro, zooms, captions, optional window stage | model-authored `scene.tsx` |
| Output | 1080p (optional 60 fps) | 1080p60, optional 720p/GIF |
| Best for | docs, tutorials, raw B-roll | promos, landing pages, social |

## CLI

```
videolab new <video> [--mode record|film]   scaffold a workspace
videolab list                                list workspaces with mode + status
videolab record <video>                      capture (video or stills, per mode)
videolab compose <video>                     render (template or scene, per mode)
videolab studio <video>                      Remotion preview for that workspace
```

`videolab new` is interactive when stdin is a TTY:

```
What kind of video?
  1) Demo recording — real continuous footage (docs, B-roll for CapCut)
  2) Showcase film — stills composed into a polished promo

Mode [1]:
```

With `--mode`, it never prompts. Without a TTY and without `--mode`, it exits with
the two options instead of guessing.

`list` output example:

```
movie-kombat/collections-search   record   recorded   rendered
movie-kombat/film-tour            film     shots(11)  -
```

`record` keeps its name in both modes: it means "capture the workspace according to
its mode". `compose` means "produce the final file".

`AGENTS.md` must tell agents to ask the user which mode they want before running
`new`, and to pass `--mode` explicitly.

## Workspace layout

```
projects/<app>/<video>/
  video.json         mode + metadata (source of truth for the edit)
  flow.js            Playwright script, default export
  scene.tsx          film only: the composition, written by the model
  shots/             film only: generated stills + shots.json
  events.json        film only: generated click/scroll log
  raw/footage.webm   record only: generated
  render/            generated work dir (entry.tsx, props.json, footage.mp4)
  out/<video>.mp4    generated final output
```

`projects/` remains gitignored and disposable.

## Mode selection and contracts

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

Brand values can also come from an optional `brand:` block in the app's
`demo.yml`; `video.json` wins. videolab only reads `demo.yml`, never writes it.

### `flow.js`

Both modes receive the existing context plus capture helpers:

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
- Capture automatically listens for real `mousedown` and `scroll` events and writes
  `events.json` with normalized coordinates, target text, and timestamps. This is
  what the scene uses to place the painted cursor and ripples.
- Capture injects presentation-only CSS in film mode: hide scrollbars, hide the
  recording cursor overlay, disable text caret. No app behavior is changed.

`shots.json` and `events.json` are generated. `scene.tsx` is authored.

### `scene.tsx`

One composition per film. It imports the scene library and receives generated
props:

```tsx
import React from "react";
import { AbsoluteFill, staticFile, useCurrentFrame } from "remotion";
import { Film, Background, Camera, BrowserShot, TitleBlock, Cursor } from "../../../studio/src/scene";

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

The `@videolab/scene` alias is the preferred import; the relative path above is the
fallback if the alias is not available.

## Scene library (`studio/src/scene/`)

Keep the library small, composable, and data-driven. v1:

| Primitive | Purpose |
|---|---|
| `Film` | root: duration, fps, brand fonts/colors, safe area |
| `Background` | branded gradient/mesh, optional blurred logo; deterministic by seed |
| `Camera` | keyframed 2.5D transform: x, y, scale, rotateX, rotateY, opacity |
| `BrowserShot` | still in a browser window: chrome bar, URL, radius, shadow, 2x image |
| `Stack` | layered screenshots in perspective |
| `Wall` | grid montage of stills with slow drift |
| `Compare` | two windows side by side with labels |
| `TitleBlock` | kicker + headline + supporting line, animated entrance |
| `Cursor` | SVG pointer and click ripples, keyframed in normalized shot coords |
| `Logo` | logo + wordmark intro/outro card |
| `Caption` | lower-third for record mode and occasional film use |
| `Sfx` / `Audio` | optional, off by default |

Rules:

- All motion is a pure function of `frame`. No timers, no randomness without a seed.
- Fonts load before the first frame; prefer local files, allow
  `@remotion/google-fonts` as a fallback.
- CSS 3D is allowed, but prefer plain transforms and a `perspective` on the camera
  wrapper. Test each primitive at 1080p60.
- Sizes are authored for a 1920x1080 canvas and scale with `useVideoConfig`.

## Capture: film mode

`lib/capture-stills.js` (new) reuses the existing app lifecycle from
`lib/record.js`:

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

## Compose: film mode

`lib/compose-film.js`:

1. Validate `video.json`, `shots/`, `events.json`, `scene.tsx`.
2. Resolve brand: `video.json.brand` over `demo.yml.brand` over defaults. Copy
   logo/font assets into `render/assets/`.
3. Write `render/props.json` with `shots`, `events`, `film`, `brand`, and frame
   metadata.
4. Generate `render/entry.tsx`:

   ```tsx
   import { Composition, registerRoot } from "remotion";
   import Scene from "../scene";
   import props from "./props.json";

   const Root = () => (
     <Composition
       id="Scene"
       component={Scene}
       durationInFrames={/* literal from video.json */}
       fps={/* literal */}
       width={/* literal */}
       height={/* literal */}
       defaultProps={props}
     />
   );
   registerRoot(Root);
   ```

5. Render with the Remotion CLI:
   `npx remotion render render/entry.tsx Scene out/<video>.mp4 --props render/props.json --public-dir <workspace> --overwrite`.
6. Optional exports from `video.json.exports` (`["master", "web720", "gif"]`) run
   through ffmpeg with `-movflags +faststart`; loudness normalization only if an
   audio track exists.
7. Log a checklist: duration, resolution, fps, shot count, beats, audio.

`remotion.config.ts` at the repo root adds a webpack alias so scenes can import
`@videolab/scene` instead of `../../../studio/src/scene`:

```ts
import path from "node:path";
import { Config } from "@remotion/cli/config";

Config.overrideWebpackConfig((config) => ({
  ...config,
  resolve: {
    ...config.resolve,
    alias: {
      ...(config.resolve?.alias ?? {}),
      "@videolab/scene": path.resolve("studio/src/scene"),
    },
  },
}));
```

Fallback if Remotion cannot bundle an entry outside `studio/`: copy `scene.tsx`
into a gitignored `studio/.generated/<app>/<video>.tsx` at compose time and clean
it up afterwards. The CLI may write there; agents still may not edit `studio/`.

## Record mode improvements

Cheap, opt-in, and backward compatible:

1. **High quality**: `quality: "high"` records at 2x the viewport
   (`recordVideo.size = viewport * 2`) and composes down to 1080p. Fixes soft zooms.
2. **60 fps**: default output fps becomes 60 (configurable); normalize the WebM to
   CFR first.
3. **Window stage**: `stage: "window"` puts the footage in a browser frame on a
   branded background, with breathing room, replacing the full-bleed look. Reuses
   `BrowserShot` with an `OffthreadVideo` inside.
4. **Editorial beats**: `beats` render like film `TitleBlock`s instead of caption
   pills. `captions` stay for click-level detail.
5. **Better cursor**: ease the pointer between real events and center ripples on the
   click target; keep it presentation-only.
6. **Head/tail trim**: `trim: { start, end }` removes setup and teardown without
   touching chronology. Arbitrary cuts/reordering are explicitly out of scope.
7. **Audio**: accept a user-provided file; no synthesis, no music by default.
8. **Output presets**: master 1080p + optional 720p WebM + GIF.

Existing `video.json` files without the new keys keep today's behavior, except the
default fps if we decide 60 is safe for every workspace. Safer: keep `fps: 30`
unless set, and make the `new` scaffold write 60.

## Art direction (this is what makes it "cool")

Tooling alone will still produce generic videos. The `new --mode film` scaffold and
`AGENTS.md` must include a short, concrete brief:

- 4–6 named beats with a numbered kicker, a headline, and one supporting line.
  Write outcomes, not click descriptions.
- Derive the background and accent from the app's logo/brand. No default indigo.
- Put the app in a browser window with real URL chrome on a branded background.
  Leave empty space; do not fill the frame edge to edge.
- At least one non-flat shot: stack, wall, or side-by-side compare.
- Start with the logo/wordmark, end with the tagline. No dead time.
- Cursor moves only when it is about to click something meaningful; no idle drift.
- Prefer cuts and holds over constant motion.

Add a `docs/film-checklist.md` with these points and a frame-by-frame reference
breakdown of `demo-made-with-claude-opus.mp4` (intro, stack, beats, compare, wall,
outro) so the model has a target, not just primitives.

## Milestones

### M0 — Decisions and scaffolding (0.5 day)

- Confirm defaults: film 1920x1080@60, record keeps 30 unless configured; no music.
- Add `remotion.config.ts` with the scene alias.
- Create `studio/src/scene/` with `Film`, `Background`, `Camera`, `BrowserShot`,
  `TitleBlock`, `Cursor` stubs and a preview composition.

Done when `npm run studio` renders a preview scene from dummy stills.

### M1 — Mode plumbing and CLI (1 day)

- `video.json.mode` with `record` default.
- `videolab new` with interactive prompt and `--mode`.
- `list` shows mode and status.
- `record`/`compose` dispatch by mode; `studio <video>` previews a workspace.
- Update `AGENTS.md` and `README.md`: ask for the mode, new files, contracts.

Done when `new` scaffolds both modes and existing workspaces still compose.

### M2 — Film capture (1 day)

- `lib/capture-stills.js`: app lifecycle, 2x context, `shot()`, `mark()`, event log,
  scrollbar/caret suppression, stability waits.
- `shots.json` + `events.json` shapes.
- Reuse `record` plumbing rather than duplicating app startup.

Done when a flow on movie-kombat produces 10+ crisp stills and a usable events file.

### M3 — Scene library v1 (2 days)

- Implement the primitives in the table, including 2.5D camera, stack, wall,
  compare, painted cursor with ripples.
- Keep every animation frame-pure and deterministic.
- Basic intro/outro with logo and brand tokens.

Done when a hand-written scene can reproduce the reference beats with our stills.

### M4 — Film compose (1 day)

- Brand resolution, asset copying, props, generated entry, Remotion render.
- Optional exports and loudness normalization.
- Clear validation errors (missing shots, unknown shot name, absent scene).

Done when `record` + `compose` on a film workspace yields `out/<video>.mp4`.

### M5 — Record upgrades (1 day)

- 2x capture, 1080p, optional 60 fps, CFR normalization.
- Window stage + beats + better cursor + trim.
- Keep old behavior for configs that do not opt in.

Done when `library-tour` re-renders with the stage on and zooms stay sharp at 1080p.

### M6 — Reference film and parity pass (1–2 days)

- Build one 40–55 s film on movie-kombat using real stills.
- Score it against the checklist, compare frames side by side with the reference.
- Iterate on typography, spacing, easing, and compression until the checklist is
  fully met.

Done when the film passes every checklist item and a reviewer would call it a
finished promo, not a screen recording.

### M7 — Docs and cleanup (0.5 day)

- `README.md`: two modes, commands, when to use which.
- `AGENTS.md`: mode question, ownership (`flow.js`, `video.json`, `scene.tsx`),
  film pitfalls (fonts, still size, scrollbars).
- Remove dead code, verify Windows paths, verify existing workspaces.

Total: about 7–9 focused agent days, plus the per-video authoring time.

## Execution plan for this week

Tracked in GitHub:

- Milestone: `v0.4 - dual mode`
- Epic: #1
- Work issues: #7 (M0/M1), #4 (M2), #2 (M3), #3 (M4), #6 (M5), #5 (M6), #8 (M7)
- Labels: `area:*`, `mode:*`, `needs:visual-review`

The concrete sequence:

1. Switch out of plan mode; create the milestone and 7 issues with `gh`, then land
   the contract PR. (Milestone and issues are created; the contract PR is #7.)
2. Re-open a worktree for Agent A (capture) and another for Agent B (scene kit).
   Both against the contract branch.
3. Agent A captures 10–15 stills early and stores them under its worktree
   `projects/`; Agent B starts with placeholders and swaps in real stills at
   integration.
4. Integration agent lands M4.
5. You and I drive M6 frame by frame, then land M7 and CI.

Operating notes:

- Phase 0 (#7) blocks everything. Do not spawn capture or scene agents before it
  merges.
- **Agent A = capture (#4 + #6).** Both touch `lib/app-lifecycle.js`,
  `lib/record.js` and the app lifecycle. Only one agent may run the app at a time
  (port 3000).
- **Agent B = scene kit (#2).** No app needed; it renders against checked-in
  placeholder fixtures.
- **Integration (#3)** rebases on both branches and wires the real stills in.
- **M6 (#5) is one driver with you reviewing frames.** Do not parallelize taste.
- Merge order: #7 → (#4, #2) → #3 → #6 → #5 → #8.
- Every visual PR attaches a contact sheet.
- Each worktree needs its own `npm install`; Playwright's browser is already
  installed globally on this machine.

## Acceptance criteria

A film is done when:

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

A record video is done when:

- [ ] Same commands and `flow.js` as today.
- [ ] 1080p output; zooms sharp when `quality: "high"`.
- [ ] Optional window stage and beats render correctly.
- [ ] Footage still comes from one continuous real session.

## Risks and mitigations

| Risk | Mitigation |
|---|---|
| Remotion cannot bundle an entry outside `studio/` | webpack alias first; generated copy into `studio/.generated/` as fallback |
| 3D transforms look different than expected | prefer 2.5D transforms; preview per primitive; no complex perspective chains |
| Large still sets slow compose | WebP option, cap shots, copy only referenced assets |
| Fonts missing offline | bundle local font files; Google fonts only as fallback |
| Windows path separators in generated imports | always emit POSIX paths |
| Film mode becomes a generic template again | per-video `scene.tsx` is mandatory; the checklist is part of done |
| Fake UI creeping in | hard rule: stills from the real UI; presentation-only drawing |
| Longer render times at 1080p60 | render master at 60; allow 30 fps fallback and 720p exports |

## Open decisions (defaults chosen above)

1. Film defaults to 1080p60; record keeps 30 unless configured. Confirm.
2. Music stays out; SFX optional. Confirm.
3. Arbitrary cuts/reordering in record mode stay out of scope; only head/tail trim.
4. Scene files are TSX; `video.json` stays JSON.
