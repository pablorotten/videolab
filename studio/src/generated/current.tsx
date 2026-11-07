import React from 'react';
import { Composition, staticFile } from 'remotion';
import { GenericDemo, type VideoConfig } from '../components/GenericDemo';
import videoConfig from '../../../apps/movie-kombat/videos/collection-kombat.json';

const config = videoConfig as VideoConfig;
export const CurrentVideo: React.FC = () => <Composition id="CurrentVideo" component={GenericDemo} durationInFrames={config.introFrames + config.videoFrames + config.outroFrames} fps={config.fps} width={config.width} height={config.height} defaultProps={{ videoSrc: staticFile('movie-kombat/collection-kombat.mp4'), config }} />;
