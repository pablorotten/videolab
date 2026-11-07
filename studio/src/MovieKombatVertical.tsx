import React from 'react';
import { AbsoluteFill, OffthreadVideo, Sequence, useCurrentFrame, interpolate } from 'remotion';
import { Caption } from './components/Caption';
import { Intro } from './components/Intro';
import { Outro } from './components/Outro';
import { DEMO_FPS, INTRO_FRAMES, OUTRO_FRAMES, VIDEO_FRAMES, type DemoVideoProps } from './DemoVideo';

const verticalCaptions = [
  { from: 150, durationInFrames: 100, text: 'Search your next favorite' },
  { from: 360, durationInFrames: 100, text: 'Add it to your list' },
  { from: 630, durationInFrames: 100, text: 'Remove it anytime' },
  { from: 900, durationInFrames: 100, text: 'Let the matchups begin' },
  { from: 1710, durationInFrames: 90, text: 'And the winner is…' },
];

export const MovieKombatVertical: React.FC<DemoVideoProps> = ({ videoSrc }) => {
  const frame = useCurrentFrame();
  const videoFrame = Math.max(0, frame - INTRO_FRAMES);
  const split = videoFrame >= 1050 && videoFrame < 1590;
  const cut = split ? Math.max(0, videoFrame - 1050) * 3 : videoFrame >= 1590 ? 1570 : 0;
  const zoom = interpolate(videoFrame, [0, 150, 280, 450, 620, 900, 1200, 1500], [1, 1.04, 1.12, 1.02, 1.1, 1.02, 1.12, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const opacity = interpolate(videoFrame, [0, 12, VIDEO_FRAMES - 12, VIDEO_FRAMES], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ backgroundColor: '#080b14', fontFamily: 'Arial, sans-serif' }}>
      <Sequence durationInFrames={INTRO_FRAMES} premountFor={DEMO_FPS}><Intro /></Sequence>
      <Sequence from={INTRO_FRAMES} durationInFrames={VIDEO_FRAMES} premountFor={DEMO_FPS}>
        <AbsoluteFill style={{ opacity }}>
          {split ? (
            <AbsoluteFill style={{ gap: 8, padding: 8, background: '#05070d' }}>
              {[0, 1, 2].map((index) => (
                <div key={index} style={{ position: 'relative', flex: 1, overflow: 'hidden', borderRadius: 14, border: `2px solid ${['#67e8f9', '#f472b6', '#a78bfa'][index]}` }}>
                  <OffthreadVideo src={videoSrc} muted startFrom={Math.floor((cut + index * 90) % 1450)} endAt={1810} style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scale(1.18)' }} />
                  <div style={{ position: 'absolute', top: 12, left: 12, color: 'white', background: 'rgba(5,7,13,.8)', borderRadius: 20, padding: '7px 12px', fontSize: 14, fontWeight: 900, letterSpacing: 1 }}>KOMBAT 0{index + 1}</div>
                </div>
              ))}
            </AbsoluteFill>
          ) : (
            <AbsoluteFill style={{ overflow: 'hidden' }}>
              <div style={{ position: 'absolute', inset: '-12%', transform: `scale(${zoom})`, transformOrigin: 'center' }}>
                <OffthreadVideo src={videoSrc} muted startFrom={cut} endAt={1820} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            </AbsoluteFill>
          )}
          {verticalCaptions.map((caption) => (
            <Sequence key={caption.from} from={caption.from} durationInFrames={caption.durationInFrames}><Caption text={caption.text} /></Sequence>
          ))}
        </AbsoluteFill>
      </Sequence>
      <Sequence from={INTRO_FRAMES + VIDEO_FRAMES} durationInFrames={OUTRO_FRAMES}><Outro /></Sequence>
    </AbsoluteFill>
  );
};
