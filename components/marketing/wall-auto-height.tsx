'use client';

import * as React from 'react';

/**
 * Reports the wall's rendered height to the embedding page.
 *
 * An iframe cannot size itself to its content, and the host cannot measure
 * across origins — so the frame has to volunteer the number. public/wall.js
 * listens for exactly this message and checks the origin before believing it.
 *
 * A ResizeObserver rather than a one-shot measurement: avatars load after the
 * first paint, and a wall that settles two rows taller would otherwise be
 * clipped.
 */
export function WallAutoHeight({ layout }: { layout: string }) {
  React.useEffect(() => {
    if (window.parent === window) return;

    const post = () => {
      const height = Math.ceil(document.documentElement.scrollHeight);
      // The parent origin is unknown and varies per embedder; wall.js filters
      // on ITS side by comparing against the script's own origin.
      window.parent.postMessage({ type: 'sponsor-wall-height', layout, height }, '*');
    };

    post();
    const ro = new ResizeObserver(post);
    ro.observe(document.documentElement);
    return () => ro.disconnect();
  }, [layout]);

  return null;
}
