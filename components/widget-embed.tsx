'use client';

import * as React from 'react';

/** Injects the real <script src="/widget.js" data-slot> so the widget executes,
    exactly as it would on an external site. */
export function WidgetEmbed({ slot }: { slot: string }) {
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const el = ref.current;
    if (!el || el.dataset.mounted) return;
    el.dataset.mounted = '1';
    const s = document.createElement('script');
    s.src = window.location.origin + '/widget.js';
    s.setAttribute('data-slot', slot);
    s.async = true;
    el.appendChild(s);
  }, [slot]);

  return <div ref={ref} className="h-[250px] w-[300px]" />;
}
