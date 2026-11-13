import React from 'react';
import { Composition } from 'remotion';
import { Demo, type DemoProps } from './components/Demo';
import { demoPropsSchema } from './schema';

// Placeholder for the Remotion studio preview. Real renders get props from compose.
const preview: DemoProps = {
  videoSrc: 'footage.mp4',
  title: 'Demo',
  subtitle: '',
  tagline: '',
  fps: 30,
  width: 1280,
  height: 800,
  footageWidth: 1280,
  footageHeight: 800,
  introFrames: 90,
  videoFrames: 300,
  outroFrames: 120,
  zooms: [{ at: 0, scale: 1, originX: 50, originY: 50 }],
  captions: [],
};

export const Root: React.FC<{ defaultProps?: DemoProps }> = ({ defaultProps }) => {
  // `videolab studio` generates an entry that passes render/props.json here, so the
  // props panel edits the values the preview actually uses. Plain `remotion studio`
  // (no video) falls back to the placeholder.
  const props = defaultProps ?? preview;
  return (
    <Composition
      id="Demo"
      component={Demo}
      schema={demoPropsSchema}
      defaultProps={props}
      durationInFrames={props.introFrames + props.videoFrames + props.outroFrames}
      fps={props.fps}
      width={props.width}
      height={props.height}
      calculateMetadata={({ props: resolved }) => ({
        durationInFrames: resolved.introFrames + resolved.videoFrames + resolved.outroFrames,
        fps: resolved.fps,
        width: resolved.width,
        height: resolved.height,
      })}
    />
  );
};
