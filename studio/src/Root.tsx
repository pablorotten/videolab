import React from 'react';
import { Composition, staticFile } from 'remotion';
import { GenericDemo, type VideoConfig } from './components/GenericDemo';
import generatedVideo from './generated/current.json';

const movieKombatConfig: VideoConfig = {
  title: 'Movie Kombat',
  subtitle: 'Find your next favorite film',
  tagline: 'Your next favorite is waiting.',
  fps: 30,
  width: 1280,
  height: 800,
  videoFrames: 1824,
  introFrames: 90,
  outroFrames: 120,
  zooms: [
    { at: 0, scale: 1 },
    { at: 130, scale: 1.13 },
    { at: 260, scale: 1.02 },
    { at: 410, scale: 1.17 },
    { at: 560, scale: 1.03 },
    { at: 720, scale: 1.08 },
    { at: 900, scale: 1 },
    { at: 1110, scale: 1.06 },
    { at: 1320, scale: 1.02 },
    { at: 1500, scale: 1 },
  ],
  splits: { from: 1050, to: 1590, labels: ['KOMBAT 01', 'KOMBAT 02', 'KOMBAT 03'] },
  captions: [
    { from: 150, durationInFrames: 100, text: 'Build your movie list' },
    { from: 360, durationInFrames: 110, text: 'Search. Add. Curate.' },
    { from: 620, durationInFrames: 100, text: 'Remove movies anytime' },
    { from: 900, durationInFrames: 100, text: 'Pick your contenders' },
    { from: 1710, durationInFrames: 90, text: 'One movie takes the crown' },
  ],
};

export const Root: React.FC = () => (
  <>
    <Composition
      id="MovieKombatDemo"
      component={GenericDemo}
      durationInFrames={movieKombatConfig.introFrames + movieKombatConfig.videoFrames + movieKombatConfig.outroFrames}
      fps={movieKombatConfig.fps}
      width={movieKombatConfig.width}
      height={movieKombatConfig.height}
      defaultProps={{ videoSrc: staticFile('movie-kombat/collection-kombat.mp4'), config: movieKombatConfig }}
    />
    <Composition
      id={generatedVideo.compositionId}
      component={GenericDemo}
      durationInFrames={generatedVideo.config.introFrames + generatedVideo.config.videoFrames + generatedVideo.config.outroFrames}
      fps={generatedVideo.config.fps}
      width={generatedVideo.config.width}
      height={generatedVideo.config.height}
      defaultProps={{ videoSrc: staticFile(generatedVideo.videoAsset), config: generatedVideo.config as VideoConfig }}
    />
  </>
);
