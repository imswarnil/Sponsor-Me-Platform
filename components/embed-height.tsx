'use client';

import { useEffect } from 'react';

/**
 * Tells the host page how tall this unit actually is.
 *
 * The script reserves a height before the frame loads, which is what stops the
 * host page shifting. That reservation is a guess, so once the real height is
 * known it is posted out.
 *
 * A ResizeObserver rather than a one-shot measurement: a web font landing
 * after first paint changes the height, and a unit that is 8px too short on
 * every load has a clipped last line.
 *
 * `postMessage` is addressed to '*' because the host is, by design, any of the
 * creator's sites and this frame does not know which one it is in. That is
 * safe only because the message carries an integer and a slot id, no secret —
 * and the receiving side is the part that checks the origin, which it does.
 */
export function EmbedHeight({ slot }: { slot: string }) {
  useEffect(() => {
    function post() {
      const height = Math.ceil(document.documentElement.getBoundingClientRect().height);
      window.parent?.postMessage({ type: 'sponsorme:height', slot, height }, '*');
    }
    post();
    const observer = new ResizeObserver(post);
    observer.observe(document.documentElement);
    return () => observer.disconnect();
  }, [slot]);

  return null;
}
