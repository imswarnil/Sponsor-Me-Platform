import { ImageResponse } from 'next/og';

export const size = { width: 512, height: 512 };
export const contentType = 'image/png';

/**
 * Matches the vendored `.logo-s` mark (app/creator/09-logo.css): a dark rounded-square
 * tile, a bold "S", and the signature dot at 1 o'clock (30° off vertical, orbiting the
 * S's center) — not centered, not at 12 or 2, per that file's own explanation of why.
 * Satori (next/og's renderer) has no CSS support at all, so the trig that file expresses
 * as `sin()`/`cos()` custom properties is computed here in JS instead and hardcoded as
 * inline styles — the render itself has no other option.
 */
const ORBIT = 150; // px, ~0.5em relative to the ~300px "S"
const ANGLE = (30 * Math.PI) / 180;
const DOT = 66;
const CENTER = size.width / 2;
const dotLeft = CENTER + ORBIT * Math.sin(ANGLE) - DOT / 2;
const dotTop = CENTER - ORBIT * Math.cos(ANGLE) - DOT / 2;

export default function Icon() {
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
          background: '#101017',
          borderRadius: 96
        }}
      >
        <span
          style={{
            fontSize: 300,
            fontWeight: 700,
            color: '#f8f8fa',
            fontFamily: 'sans-serif'
          }}
        >
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
