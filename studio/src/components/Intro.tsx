import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';

export const Intro: React.FC<{ title: string; subtitle: string; frames: number }> = ({ title, subtitle, frames }) => {
  const frame = useCurrentFrame();
  const fade = Math.min(18, Math.floor(frames / 4));
  const opacity = interpolate(frame, [0, fade, frames - fade, frames], [0, 1, 1, 0], { extrapolateRight: 'clamp' });
  const scale = interpolate(frame, [0, frames], [0.92, 1], { extrapolateRight: 'clamp' });
  return (
    <AbsoluteFill style={{ opacity, justifyContent: 'center', alignItems: 'center', background: 'linear-gradient(135deg, #111827, #312e81)' }}>
      <div style={{ transform: `scale(${scale})`, textAlign: 'center', color: 'white' }}>
        <div style={{ fontSize: 76, fontWeight: 900 }}>{title.toUpperCase()}</div>
        <div style={{ marginTop: 22, fontSize: 26, color: '#c4b5fd' }}>{subtitle}</div>
      </div>
    </AbsoluteFill>
  );
};
