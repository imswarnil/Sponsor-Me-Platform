'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Paint when it is nearly on screen, and never again.
 *
 * WHY THIS IS SAFE TO USE ON REAL CONTENT. The element is in the document and
 * in the accessibility tree from the first render — this withholds opacity,
 * not existence. And it can only ever fail OPEN: reduced motion and
 * `scripting: none` both force it visible in CSS, so a reader with no
 * JavaScript sees a normal page rather than a blank one.
 *
 * `disconnect()` after the first hit, because an element that has arrived has
 * nothing left to report and a page of live observers costs something on every
 * scroll.
 */
export function Reveal({
  children,
  delay = 0,
  className = ''
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        /**
         * INTERSECTING, **OR ALREADY PAST**.
         *
         * The second half is not a nicety. An observer only reports elements
         * that cross its line, so anything the viewport jumps OVER is never
         * reported as intersecting and stays at `opacity: 0` for the life of
         * the page. That is not a corner case here: every link in the menu is
         * an anchor, so arriving at `/#faq` used to blank every section above
         * it — as does a browser restoring a scroll position on reload.
         *
         * `boundingClientRect.top < 0` means the element is above the
         * viewport, i.e. the reader has already gone past it, and there is
         * nothing left to reveal.
         */
        if (entries.some((e) => e.isIntersecting || e.boundingClientRect.top < 0)) {
          setShown(true);
          observer.disconnect();
        }
      },
      { rootMargin: '0px 0px -10% 0px' }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`sp-reveal ${className}`}
      data-shown={shown}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}
