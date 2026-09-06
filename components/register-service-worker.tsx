'use client';

import { useEffect } from 'react';

/** Registers the no-op service worker so the app meets PWA installability
 *  heuristics. Mounted once in the root layout. */
export function RegisterServiceWorker() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // Installability is a nice-to-have, not load-bearing — fail quietly.
      });
    }
  }, []);
  return null;
}
