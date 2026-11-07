import React from 'react';
import { Composition, staticFile } from 'remotion';
import { DemoVideo, DEMO_FPS, DEMO_HEIGHT, DEMO_WIDTH, demoDurationInFrames } from './DemoVideo';

export const Root: React.FC = () => (
  <Composition
    id="MovieKombatDemo"
    component={DemoVideo}
    durationInFrames={demoDurationInFrames}
    fps={DEMO_FPS}
    width={DEMO_WIDTH}
    height={DEMO_HEIGHT}
    defaultProps={{
      videoSrc: staticFile('movie-kombat/collection-kombat.mp4'),
    }}
  />
);
