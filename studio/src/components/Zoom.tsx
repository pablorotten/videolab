import React from 'react';
import { AbsoluteFill, interpolate } from 'remotion';

export const Zoom: React.FC<{ videoFrame: number; children: React.ReactNode }> = ({ videoFrame, children }) => {
  const scale = interpolate(videoFrame, [0, 240, 500, 900, 1250, 1700, 1824], [1, 1.04, 1.02, 1.08, 1.02, 1.06, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const x = interpolate(videoFrame, [0, 500, 900, 1250, 1824], [0, -8, 10, -6, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return <AbsoluteFill style={{ overflow: 'hidden' }}><div style={{ width: '100%', height: '100%', transform: `translateX(${x}px) scale(${scale})` }}>{children}</div></AbsoluteFill>;
};
