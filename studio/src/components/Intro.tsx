import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { resolveFontFamily } from '../fonts';

export type IntroStyle = {
  background?: string;
  titleColor?: string;
  titleFontSize?: number;
  subtitleColor?: string;
  subtitleFontSize?: number;
  fontFamily?: string;
  fontWeight?: number | string;
};

const DEFAULT_INTRO_STYLE: Required<IntroStyle> = {
  background: 'linear-gradient(135deg, #111827, #312e81)',
  titleColor: 'white',
  titleFontSize: 76,
  subtitleColor: '#c4b5fd',
  subtitleFontSize: 26,
  fontFamily: 'Arial, sans-serif',
  fontWeight: 900,
};

export const Intro: React.FC<{ title: string; subtitle: string; frames: number; style?: IntroStyle | null }> = ({ title, subtitle, frames, style }) => {
  const frame = useCurrentFrame();
  const fade = Math.min(18, Math.floor(frames / 4));
  const opacity = interpolate(frame, [0, fade, frames - fade, frames], [0, 1, 1, 0], { extrapolateRight: 'clamp' });
  const scale = interpolate(frame, [0, frames], [0.92, 1], { extrapolateRight: 'clamp' });
  const s = { ...DEFAULT_INTRO_STYLE, ...(style ?? {}) };
  return (
    <AbsoluteFill style={{ opacity, justifyContent: 'center', alignItems: 'center', background: s.background, fontFamily: resolveFontFamily(s.fontFamily) }}>
      <div style={{ transform: `scale(${scale})`, textAlign: 'center' }}>
        <div style={{ fontSize: s.titleFontSize, fontWeight: s.fontWeight, color: s.titleColor }}>{title.toUpperCase()}</div>
        <div style={{ marginTop: 22, fontSize: s.subtitleFontSize, color: s.subtitleColor }}>{subtitle}</div>
      </div>
    </AbsoluteFill>
  );
};
