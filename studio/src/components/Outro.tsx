import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';

export const Outro: React.FC<{ title: string; tagline: string; frames: number }> = ({ title, tagline, frames }) => {
  const frame = useCurrentFrame();
  const fade = Math.min(18, Math.floor(frames / 4));
  const opacity = interpolate(frame, [0, fade, frames - fade, frames], [0, 1, 1, 0], { extrapolateRight: 'clamp' });
  return (
    <AbsoluteFill style={{ opacity, justifyContent: 'center', alignItems: 'center', background: 'linear-gradient(135deg, #111827, #312e81)', color: 'white', textAlign: 'center' }}>
      <div style={{ fontSize: 58, fontWeight: 900 }}>{tagline}</div>
      <div style={{ marginTop: 24, fontSize: 28, color: '#67e8f9' }}>{title}</div>
    </AbsoluteFill>
  );
};
