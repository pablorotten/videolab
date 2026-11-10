import React from 'react';
import { AbsoluteFill, Easing, OffthreadVideo, Sequence, interpolate, staticFile, useCurrentFrame } from 'remotion';
import { Caption } from './Caption';
import { Intro } from './Intro';
import { Outro } from './Outro';

export type ZoomKey = { at: number; scale: number; originX: number; originY: number };
export type CaptionCue = { from: number; durationInFrames: number; text: string };

export type DemoProps = {
  videoSrc: string;
  title: string;
  subtitle: string;
  tagline: string;
  fps: number;
  width: number;
  height: number;
  introFrames: number;
  videoFrames: number;
  outroFrames: number;
  zooms: ZoomKey[];
  captions: CaptionCue[];
};

const FADE_FRAMES = 12;
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

// Eased transition between zoom keys; origin moves too, so the zoom can target a region.
const zoomAt = (frame: number, keys: ZoomKey[]): ZoomKey => {
  if (frame <= keys[0].at) return keys[0];
  for (let i = 1; i < keys.length; i += 1) {
    const prev = keys[i - 1];
    const next = keys[i];
    if (frame <= next.at) {
      const lerp = (a: number, b: number) =>
        interpolate(frame, [prev.at, next.at], [a, b], { ...clamp, easing: Easing.inOut(Easing.cubic) });
      return {
        at: frame,
        scale: lerp(prev.scale, next.scale),
        originX: lerp(prev.originX, next.originX),
        originY: lerp(prev.originY, next.originY),
      };
    }
  }
  return keys[keys.length - 1];
};

export const Demo: React.FC<DemoProps> = ({
  videoSrc, title, subtitle, tagline, fps, introFrames, videoFrames, outroFrames, zooms, captions,
}) => {
  const frame = useCurrentFrame();
  const videoFrame = Math.max(0, frame - introFrames);
  const opacity = interpolate(
    videoFrame,
    [0, FADE_FRAMES, videoFrames - FADE_FRAMES, videoFrames],
    [0, 1, 1, 0],
    clamp,
  );
  const zoom = zoomAt(videoFrame, zooms);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#0b1020',
        fontFamily: 'Arial, sans-serif'
      }}
    >
      <Sequence durationInFrames={introFrames} premountFor={fps}>
        <Intro title={title} subtitle={subtitle} frames={introFrames} />
      </Sequence>
      <Sequence from={introFrames} durationInFrames={videoFrames} premountFor={fps}>
        <AbsoluteFill style={{ opacity, overflow: 'hidden' }}>
          <OffthreadVideo
            src={staticFile(videoSrc)}
            muted
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transformOrigin: `${zoom.originX}% ${zoom.originY}%`,
              transform: `scale(${zoom.scale})`,
            }}
          />
          {captions.map((caption) => (
            <Sequence key={`${caption.from}-${caption.text}`} from={caption.from} durationInFrames={caption.durationInFrames}>
              <Caption text={caption.text} frames={caption.durationInFrames} />
            </Sequence>
          ))}
        </AbsoluteFill>
      </Sequence>
      <Sequence from={introFrames + videoFrames} durationInFrames={outroFrames}>
        <Outro title={title} tagline={tagline} frames={outroFrames} />
      </Sequence>
    </AbsoluteFill>
  );
};
