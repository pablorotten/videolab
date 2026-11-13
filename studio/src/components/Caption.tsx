import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { resolveFontFamily } from '../fonts';

export type CaptionStyle = {
  background?: string;
  border?: string;
  color?: string;
  fontFamily?: string;
  fontWeight?: number | string;
  borderRadius?: number;
  boxShadow?: string;
  transform?: string;
  padding?: string;
  fontSize?: number;
};

const DEFAULT_CAPTION_STYLE: Required<CaptionStyle> = {
  background: 'rgba(11,16,32,.88)',
  border: '2px solid #67e8f9',
  color: 'white',
  fontFamily: 'Arial, sans-serif',
  fontWeight: 700,
  borderRadius: 14,
  boxShadow: '0 8px 30px rgba(0,0,0,.35)',
  transform: 'none',
  padding: '12px 24px',
  fontSize: 28,
};

export const Caption: React.FC<{ text: string; frames: number; style?: CaptionStyle | null }> = ({ text, frames, style }) => {
  const frame = useCurrentFrame();
  const fadeOutStart = Math.max(9, frames - 10);
  const opacity = interpolate(frame, [0, 8, fadeOutStart, frames], [0, 1, 1, 0], { extrapolateRight: 'clamp' });
  const s = { ...DEFAULT_CAPTION_STYLE, ...(style ?? {}) };
  return (
    <AbsoluteFill style={{ opacity, justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 42, pointerEvents: 'none' }}>
      <div style={{ background: s.background, border: s.border, borderRadius: s.borderRadius, color: s.color, fontFamily: resolveFontFamily(s.fontFamily), fontWeight: s.fontWeight, padding: s.padding, fontSize: s.fontSize, boxShadow: s.boxShadow, transform: s.transform }}>
        {text}
      </div>
    </AbsoluteFill>
  );
};