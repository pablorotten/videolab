import React from 'react';
import { AbsoluteFill, OffthreadVideo, Sequence, useCurrentFrame, interpolate } from 'remotion';
import { Caption } from './components/Caption';
import { Intro } from './components/Intro';
import { Outro } from './components/Outro';
import { Zoom } from './components/Zoom';

export const DEMO_FPS = 30;
export const DEMO_WIDTH = 1280;
export const DEMO_HEIGHT = 800;
export const VIDEO_FRAMES = 1824; // 60.8 seconds recorded at 30fps
export const INTRO_FRAMES = 90;
export const OUTRO_FRAMES = 120;
export const demoDurationInFrames = INTRO_FRAMES + VIDEO_FRAMES + OUTRO_FRAMES;

export type DemoVideoProps = { videoSrc: string };

const captions = [
  { from: 100, durationInFrames: 85, text: 'Choose a movie collection' },
  { from: 225, durationInFrames: 90, text: 'Start the Kombat' },
  { from: 480, durationInFrames: 100, text: 'Every matchup is a knockout' },
  { from: 1220, durationInFrames: 100, text: 'One movie makes it to the final' },
  { from: 1740, durationInFrames: 84, text: 'And the winner is…' },
];

export const DemoVideo: React.FC<DemoVideoProps> = ({ videoSrc }) => {
  const frame = useCurrentFrame();
  const videoFrame = Math.max(0, frame - INTRO_FRAMES);
  const videoOpacity = interpolate(
    videoFrame,
    [0, 12, VIDEO_FRAMES - 12, VIDEO_FRAMES],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  return (
    <AbsoluteFill style={{ backgroundColor: '#0b1020', fontFamily: 'Arial, sans-serif' }}>
      <Sequence durationInFrames={INTRO_FRAMES} premountFor={DEMO_FPS}>
        <Intro />
      </Sequence>

      <Sequence from={INTRO_FRAMES} durationInFrames={VIDEO_FRAMES} premountFor={DEMO_FPS}>
        <AbsoluteFill style={{ opacity: videoOpacity }}>
          <Zoom videoFrame={videoFrame}>
            <OffthreadVideo src={videoSrc} muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </Zoom>
          {captions.map((caption) => (
            <Sequence key={caption.from} from={caption.from} durationInFrames={caption.durationInFrames}>
              <Caption text={caption.text} />
            </Sequence>
          ))}
        </AbsoluteFill>
      </Sequence>

      <Sequence from={INTRO_FRAMES + VIDEO_FRAMES} durationInFrames={OUTRO_FRAMES}>
        <Outro />
      </Sequence>
    </AbsoluteFill>
  );
};
