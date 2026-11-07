import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';

export const Caption: React.FC<{ text: string; frames: number }> = ({ text, frames }) => {
  const frame = useCurrentFrame();
  const fadeOutStart = Math.max(9, frames - 10);
  const opacity = interpolate(frame, [0, 8, fadeOutStart, frames], [0, 1, 1, 0], { extrapolateRight: 'clamp' });
  return (
    <AbsoluteFill style={{ opacity, justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 42, pointerEvents: 'none' }}>
      <div style={{ background: 'rgba(11,16,32,.88)', border: '2px solid #67e8f9', borderRadius: 14, color: 'white', padding: '12px 24px', fontSize: 28, fontWeight: 700, boxShadow: '0 8px 30px rgba(0,0,0,.35)' }}>
        {text}
      </div>
    </AbsoluteFill>
  );
};
