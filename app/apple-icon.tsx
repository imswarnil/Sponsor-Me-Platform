import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

// See app/icon.tsx for why this trig is computed here instead of expressed as CSS —
// same mark, scaled down (iOS applies its own rounding mask, so no borderRadius here).
const ORBIT = 52;
const ANGLE = (30 * Math.PI) / 180;
const DOT = 24;
const CENTER = size.width / 2;
const dotLeft = CENTER + ORBIT * Math.sin(ANGLE) - DOT / 2;
const dotTop = CENTER - ORBIT * Math.cos(ANGLE) - DOT / 2;

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#101017'
        }}
      >
        <span style={{ fontSize: 108, fontWeight: 700, color: '#f8f8fa', fontFamily: 'sans-serif' }}>
          S
        </span>
        <div
          style={{
            position: 'absolute',
            top: dotTop,
            left: dotLeft,
            width: DOT,
            height: DOT,
            borderRadius: '50%',
            background: '#f04e2e'
          }}
        />
      </div>
    ),
    { ...size }
  );
}
