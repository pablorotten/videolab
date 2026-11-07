import React from 'react';
import { AbsoluteFill, OffthreadVideo, Sequence, interpolate, useCurrentFrame } from 'remotion';
import { Caption } from './Caption';
import { Intro } from './Intro';
import { Outro } from './Outro';

export type VideoConfig = {
  title: string;
  subtitle: string;
  tagline: string;
  fps: number;
  width: number;
  height: number;
  videoFrames: number;
  introFrames: number;
  outroFrames: number;
  zooms: { at: number; scale: number }[];
  splits?: { from: number; to: number; labels: string[] };
  captions: { from: number; durationInFrames: number; text: string }[];
};

export type GenericDemoProps = { videoSrc: string; config: VideoConfig };

export const GenericDemo: React.FC<GenericDemoProps> = ({ videoSrc, config }) => {
  const frame = useCurrentFrame();
  const videoFrame = Math.max(0, frame - config.introFrames);
  const opacity = interpolate(
    videoFrame,
    [0, 12, config.videoFrames - 12, config.videoFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );
  const scale = interpolate(
    videoFrame,
    config.zooms.map(({ at }) => at),
    config.zooms.map(({ scale: value }) => value),
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );
  const split = config.splits && videoFrame >= config.splits.from && videoFrame < config.splits.to;

  return (
    <AbsoluteFill style={{ backgroundColor: '#0b1020', fontFamily: 'Arial, sans-serif' }}>
      <Sequence durationInFrames={config.introFrames} premountFor={config.fps}>
        <Intro title={config.title} subtitle={config.subtitle} />
      </Sequence>
      <Sequence from={config.introFrames} durationInFrames={config.videoFrames} premountFor={config.fps}>
        <AbsoluteFill style={{ opacity, overflow: 'hidden' }}>
          {split ? (
            <AbsoluteFill style={{ gap: 8, padding: 10, background: '#05070d' }}>
              {config.splits!.labels.map((label, index) => (
                <div key={`${label}-${index}`} style={{ position: 'relative', flex: 1, overflow: 'hidden', borderRadius: 16, border: `2px solid ${['#67e8f9', '#f472b6', '#a78bfa'][index % 3]}` }}>
                  <OffthreadVideo src={videoSrc} muted startFrom={Math.floor(((videoFrame - config.splits!.from) * config.splits!.labels.length + index * 95) % Math.max(1, config.videoFrames - 1))} style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scale(1.08)' }} />
                  <div style={{ position: 'absolute', top: 12, left: 14, padding: '6px 12px', borderRadius: 999, color: 'white', background: 'rgba(5,7,13,.78)', fontSize: 16, fontWeight: 900, letterSpacing: 2 }}>{label}</div>
                </div>
              ))}
            </AbsoluteFill>
          ) : (
            <OffthreadVideo src={videoSrc} muted style={{ width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${scale})` }} />
          )}
          {config.captions.map((caption) => (
            <Sequence key={`${caption.from}-${caption.text}`} from={caption.from} durationInFrames={caption.durationInFrames}>
              <Caption text={caption.text} />
            </Sequence>
          ))}
        </AbsoluteFill>
      </Sequence>
      <Sequence from={config.introFrames + config.videoFrames} durationInFrames={config.outroFrames}>
        <Outro title={config.title} tagline={config.tagline} />
      </Sequence>
    </AbsoluteFill>
  );
};
