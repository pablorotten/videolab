import React from 'react';
import { AbsoluteFill, Easing, OffthreadVideo, Sequence, interpolate, staticFile, useCurrentFrame } from 'remotion';
import { Caption, type CaptionStyle } from './Caption';
import { Intro, type IntroStyle } from './Intro';
import { Outro, type OutroStyle } from './Outro';

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
  footageWidth: number;
  footageHeight: number;
  introFrames: number;
  videoFrames: number;
  outroFrames: number;
  zooms: ZoomKey[];
  captions: CaptionCue[];
  captionStyle?: CaptionStyle | null;
  introStyle?: IntroStyle | null;
  outroStyle?: OutroStyle | null;
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
  videoSrc, title, subtitle, tagline, fps, width, height, footageWidth, footageHeight, introFrames, videoFrames, outroFrames, zooms, captions, captionStyle, introStyle, outroStyle,
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
  // Crop mode: output window differs from the recorded footage, so cover-fit the
  // desktop frame and pan so the zoom origin lands at the window centre.
  // Non-crop (default): keep the original behaviour — origin stays in place.
  const isCrop = width !== footageWidth || height !== footageHeight;
  const coverScale = isCrop ? Math.max(width / footageWidth, height / footageHeight) : 1;
  const totalScale = coverScale * zoom.scale;
  // Clamp the pan so the crop window never leaves the footage: the requested
  // origin may point past the edge (a tall crop on a short recording), and
  // without this the composition background shows through as a blue band.
  const cropW = width / totalScale;
  const cropH = height / totalScale;
  const panX = cropW >= footageWidth
    ? footageWidth / 2
    : Math.min(Math.max(zoom.originX / 100 * footageWidth, cropW / 2), footageWidth - cropW / 2);
  const panY = cropH >= footageHeight
    ? footageHeight / 2
    : Math.min(Math.max(zoom.originY / 100 * footageHeight, cropH / 2), footageHeight - cropH / 2);
  const tx = isCrop ? width / 2 - totalScale * panX : 0;
  const ty = isCrop ? height / 2 - totalScale * panY : 0;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#0b1020',
        fontFamily: 'Arial, sans-serif'
      }}
    >
      <Sequence durationInFrames={introFrames} premountFor={fps}>
        <Intro title={title} subtitle={subtitle} frames={introFrames} style={introStyle} />
      </Sequence>
      <Sequence from={introFrames} durationInFrames={videoFrames} premountFor={fps}>
        <AbsoluteFill style={{ opacity, overflow: 'hidden' }}>
          <OffthreadVideo
            src={staticFile(videoSrc)}
            muted
            style={
              isCrop
                ? {
                    width: footageWidth,
                    height: footageHeight,
                    objectFit: 'none',
                    transformOrigin: '0 0',
                    transform: `translate(${tx}px, ${ty}px) scale(${totalScale})`,
                  }
                : {
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transformOrigin: `${zoom.originX}% ${zoom.originY}%`,
                    transform: `scale(${zoom.scale})`,
                  }
            }
          />
          {captions.map((caption) => (
            <Sequence key={`${caption.from}-${caption.text}`} from={caption.from} durationInFrames={caption.durationInFrames}>
              <Caption text={caption.text} frames={caption.durationInFrames} style={captionStyle} />
            </Sequence>
          ))}
        </AbsoluteFill>
      </Sequence>
      <Sequence from={introFrames + videoFrames} durationInFrames={outroFrames}>
        <Outro title={title} tagline={tagline} frames={outroFrames} style={outroStyle} />
      </Sequence>
    </AbsoluteFill>
  );
};
