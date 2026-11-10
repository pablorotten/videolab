import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';

export type OutroStyle = {
  background?: string;
  taglineColor?: string;
  taglineFontSize?: number;
  titleColor?: string;
  titleFontSize?: number;
  fontWeight?: number | string;
};

const DEFAULT_OUTRO_STYLE: Required<OutroStyle> = {
  background: 'linear-gradient(135deg, #111827, #312e81)',
  taglineColor: 'white',
  taglineFontSize: 58,
  titleColor: '#67e8f9',
  titleFontSize: 28,
  fontWeight: 900,
};

export const Outro: React.FC<{ title: string; tagline: string; frames: number; style?: OutroStyle | null }> = ({ title, tagline, frames, style }) => {
  const frame = useCurrentFrame();
  const fade = Math.min(18, Math.floor(frames / 4));
  const opacity = interpolate(frame, [0, fade, frames - fade, frames], [0, 1, 1, 0], { extrapolateRight: 'clamp' });
  const s = { ...DEFAULT_OUTRO_STYLE, ...(style ?? {}) };
  return (
    <AbsoluteFill style={{ opacity, justifyContent: 'center', alignItems: 'center', background: s.background, color: s.taglineColor, textAlign: 'center' }}>
      <div style={{ fontSize: s.taglineFontSize, fontWeight: s.fontWeight, color: s.taglineColor }}>{tagline}</div>
      <div style={{ marginTop: 24, fontSize: s.titleFontSize, color: s.titleColor }}>{title}</div>
    </AbsoluteFill>
  );
};