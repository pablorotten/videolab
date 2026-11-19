import { zColor } from '@remotion/zod-types';
import { z } from 'zod';
import type { DemoProps } from './components/Demo';

// Describes DemoProps to Remotion Studio so its props panel shows real controls
// instead of raw JSON: numbers become fields you can drag sideways (`.multipleOf()`
// sets the drag step, `.min()/.max()` clamps), `zColor()` becomes a colour picker,
// and arrays get per-item add/remove buttons.
//
// Everything edited here lives in the browser only. `video.json` stays the source
// of truth and `compose` never reads this file's values.

const frame = (description: string) => z.number().min(0).multipleOf(1).describe(description);
const percent = (description: string) => z.number().min(0).max(100).describe(description);
const span = (description: string) => z.number().min(1).multipleOf(1).describe(description);

export const zoomSchema = z.object({
  at: frame('Frame where this zoom is reached. Must increase down the list.'),
  scale: z.number().min(1).max(6).describe('1 = footage as recorded, 1.2 = 20% closer.'),
  originX: percent('Horizontal focus point, as a % of the footage.'),
  originY: percent('Vertical focus point, as a % of the footage.'),
});

export const captionSchema = z.object({
  from: frame('Frame (in the footage) where the caption appears.'),
  durationInFrames: span('How long the caption stays on screen, in frames.'),
  text: z.string().describe('Caption line. Keep it short enough to read at a glance.'),
});

// Style objects are partial overrides: a video may set only one field, and the rest
// stay undefined and fall back to the component defaults. Every field is optional —
// a required one makes the Studio props panel crash on partial overrides.
const family = z.string().optional().describe('System family (Arial, Georgia...) or a Google Font registered in studio/src/fonts.ts.');
const weight = z.number().min(1).optional().describe('Numeric weight: 400, 700 or 900.');

export const captionStyleSchema = z.object({
  background: z.string().optional().describe('Plate colour behind the text. Any CSS colour or gradient.'),
  border: z.string().optional().describe('CSS border, e.g. 2px solid #67e8f9.'),
  color: zColor().optional().describe('Text colour.'),
  fontFamily: family,
  fontWeight: weight,
  borderRadius: z.number().min(0).optional(),
  boxShadow: z.string().optional().describe('CSS box-shadow.'),
  transform: z.string().optional().describe('CSS transform, e.g. rotate(-1deg).'),
  padding: z.string().optional().describe('CSS padding, e.g. 12px 24px.'),
  fontSize: z.number().min(1).optional(),
});

export const introStyleSchema = z.object({
  background: z.string().optional().describe('CSS background: a colour or a gradient.'),
  titleColor: zColor().optional().describe('Title colour.'),
  titleFontSize: z.number().min(1).optional(),
  subtitleColor: zColor().optional().describe('Subtitle colour.'),
  subtitleFontSize: z.number().min(1).optional(),
  fontFamily: family,
  fontWeight: weight,
});

export const outroStyleSchema = z.object({
  background: z.string().optional().describe('CSS background: a colour or a gradient.'),
  taglineColor: zColor().optional().describe('Tagline colour.'),
  taglineFontSize: z.number().min(1).optional(),
  titleColor: zColor().optional().describe('Title colour.'),
  titleFontSize: z.number().min(1).optional(),
  fontFamily: family,
  fontWeight: weight,
});

export const demoPropsSchema = z.object({
  title: z.string().describe('Intro and outro title.'),
  subtitle: z.string().describe('Intro subtitle.'),
  tagline: z.string().describe('Outro tagline, usually the URL.'),
  zooms: z.array(zoomSchema).min(1).describe('Zoom keyframes, in order. The first one must start at frame 0.'),
  captions: z.array(captionSchema).describe('Caption cues over the footage.'),
  captionStyle: captionStyleSchema.nullable().optional().describe('Overrides for the caption defaults.'),
  introStyle: introStyleSchema.nullable().optional().describe('Overrides for the intro defaults.'),
  outroStyle: outroStyleSchema.nullable().optional().describe('Overrides for the outro defaults.'),

  // Derived: written by buildProps() in lib/compose.js from video.json and the footage.
  // Editable for quick experiments, but changing them desyncs the preview from the render.
  videoSrc: z.string().describe('Footage file inside render/. Derived from video.json.'),
  audioSrc: z.string().nullable().optional().describe('Loopback WAV inside render/, when audio recording is enabled.'),
  audioOffsetFrames: z.number().optional().describe('Audio shift in frames; negative trims audio that started early.'),
  fps: z.number().min(1).max(120).multipleOf(1).describe('Derived from video.json.'),
  width: z.number().min(1).describe('Output width. Derived from video.json.'),
  height: z.number().min(1).describe('Output height. Derived from video.json.'),
  footageWidth: z.number().min(1).describe('Recorded footage width. Derived from the footage.'),
  footageHeight: z.number().min(1).describe('Recorded footage height. Derived from the footage.'),
  introFrames: span('Derived from video.json intro.'),
  videoFrames: span('Derived from the footage duration.'),
  outroFrames: span('Derived from video.json outro.'),
});

// Fails to compile if the schema ever drifts from the component's props.
type SchemaProps = z.infer<typeof demoPropsSchema>;
export const _schemaMatchesDemoProps = (props: SchemaProps): DemoProps => props;

