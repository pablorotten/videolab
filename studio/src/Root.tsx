import React from 'react';
import { Composition } from 'remotion';
import { Demo, type DemoProps } from './components/Demo';

// Placeholder for the Remotion studio preview. Real renders get props from compose.
const preview: DemoProps = {
  videoSrc: 'footage.mp4',
  title: 'Demo',
  subtitle: '',
  tagline: '',
  fps: 30,
  width: 1280,
  height: 800,
  introFrames: 90,
  videoFrames: 300,
  outroFrames: 120,
  zooms: [{ at: 0, scale: 1, originX: 50, originY: 50 }],
  captions: [],
};

export const Root: React.FC = () => (
  <Composition
    id="Demo"
    component={Demo}
    defaultProps={preview}
    durationInFrames={preview.introFrames + preview.videoFrames + preview.outroFrames}
    fps={preview.fps}
    width={preview.width}
    height={preview.height}
    calculateMetadata={({ props }) => ({
      durationInFrames: props.introFrames + props.videoFrames + props.outroFrames,
      fps: props.fps,
      width: props.width,
      height: props.height,
    })}
  />
);
