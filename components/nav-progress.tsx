'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

/**
 * A 2px accent rule along the top edge that appears the moment a same-origin
 * link is clicked and finishes when the new route has rendered.
 *
 * Every page here is `force-dynamic` and reads Neon per request, so a click
 * is followed by a real round-trip. Between the click and the segment's
 * `loading.tsx` taking over, nothing on screen changes — this is what fills
 * that gap. It listens at the document level rather than wrapping `Link`, so
 * every anchor in the app (nav, cards, footer, console sidebars) gets it
 * without being touched. Zero dependencies; the only state is a width.
 */
export function NavProgress() {
  return (
    <Suspense fallback={null}>
      <Bar />
    </Suspense>
  );
}

function Bar() {
  const pathname = usePathname();
  const search = useSearchParams();
  const [width, setWidth] = useState(0);
  const [visible, setVisible] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const started = useRef<string | null>(null);

  // Start on any click that will become a client-side navigation.
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (e.defaultPrevented || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest('a');
      if (!a || a.target === '_blank' || a.hasAttribute('download')) return;
      const href = a.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('mailto:')) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin) return;
      const next = url.pathname + url.search;
      if (next === location.pathname + location.search) return;
      started.current = next;
      begin();
    }
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  });

  // Finish when the route actually changed.
  useEffect(() => {
    if (started.current !== null) finish();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, search]);

  function begin() {
    if (timer.current) clearInterval(timer.current);
    setVisible(true);
    setWidth(12);
    // Creep towards 85% — quick at first, slowing down — so a long request
    // still reads as "working" without ever pretending to be done.
    timer.current = setInterval(() => {
      setWidth((w) => (w < 85 ? w + (85 - w) * 0.12 : w));
    }, 120);
  }

  function finish() {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    started.current = null;
    setWidth(100);
    setTimeout(() => {
      setVisible(false);
      setWidth(0);
    }, 220);
  }

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-[calc(var(--z-nav)+1)] h-0.5"
      style={{ opacity: visible ? 1 : 0, transition: 'opacity 200ms ease' }}
    >
      <div
        className="h-full bg-pop"
        style={{
          width: `${width}%`,
          transition: width === 0 ? 'none' : 'width 200ms ease-out',
          boxShadow: '0 0 8px var(--accent)'
        }}
      />
    </div>
  );
}
