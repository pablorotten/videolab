import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';

export const Outro: React.FC<{ title: string; tagline: string }> = ({ title, tagline }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 18, 100, 120], [0, 1, 1, 0], { extrapolateRight: 'clamp' });
  return (
    <AbsoluteFill style={{ opacity, justifyContent: 'center', alignItems: 'center', background: 'linear-gradient(135deg, #111827, #312e81)', color: 'white', textAlign: 'center' }}>
      <div style={{ fontSize: 58, fontWeight: 900 }}>{tagline}</div>
      <div style={{ marginTop: 24, fontSize: 28, color: '#67e8f9' }}>{title}</div>
    </AbsoluteFill>
  );
};
