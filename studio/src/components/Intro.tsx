import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';

export const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 18, 72, 90], [0, 1, 1, 0], { extrapolateRight: 'clamp' });
  const scale = interpolate(frame, [0, 90], [0.92, 1], { extrapolateRight: 'clamp' });
  return (
    <AbsoluteFill style={{ opacity, justifyContent: 'center', alignItems: 'center', background: 'linear-gradient(135deg, #111827, #312e81)' }}>
      <div style={{ transform: `scale(${scale})`, textAlign: 'center', color: 'white' }}>
        <div style={{ fontSize: 28, letterSpacing: 8, color: '#67e8f9', fontWeight: 700 }}>VIDEOLAB</div>
        <div style={{ marginTop: 20, fontSize: 76, fontWeight: 900 }}>MOVIE KOMBAT</div>
        <div style={{ marginTop: 22, fontSize: 26, color: '#c4b5fd' }}>Find your next favorite film</div>
      </div>
    </AbsoluteFill>
  );
};
