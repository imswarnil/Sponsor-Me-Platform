'use client';

import { useEffect } from 'react';

/**
 * Tells the host page how tall the board actually is.
 *
 * The embed script reserves a height from the format before this frame loads,
 * which is what stops the host page shifting. That reservation is a guess
 * though, and a creative with a long headline can need more — so once the real
 * height is known it is posted out, and the script grows the iframe (never
 * shrinks it).
 *
 * `postMessage` is addressed to `'*'` because the host is, by design, any of
 * the creator's sites and this frame does not know which one it is in. That is
 * safe here only because the message carries a single integer and no secret:
 * the receiving side is the part that checks the origin, and it does.
 *
 * A ResizeObserver rather than a one-shot measurement — a web font landing
 * after first paint changes the height, and a board that is 8px too short on
 * every page load is a board with a clipped last line.
 */
export function EmbedHeight() {
  useEffect(() => {
    function post() {
      const height = Math.ceil(document.documentElement.getBoundingClientRect().height);
      window.parent?.postMessage({ type: 'sponsorbid:height', height }, '*');
    }

    post();
    const observer = new ResizeObserver(post);
    observer.observe(document.documentElement);
    return () => observer.disconnect();
  }, []);

  return null;
}
