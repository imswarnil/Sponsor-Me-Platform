'use client';

import { useEffect, useState } from 'react';

/**
 * Writes `data-theme` on <html> and remembers the choice.
 *
 * Three states, not two: light, dark, and *no choice*, which is the default and
 * lets the design system's own `prefers-color-scheme` block decide. Cycling
 * through all three is deliberate — a two-way toggle traps someone who wanted
 * to follow their system back into a manual choice forever.
 *
 * The pre-paint script in app/layout.tsx applies the stored value before first
 * paint; this component only has to keep them in step afterwards.
 */
type Theme = 'light' | 'dark' | null;

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('theme');
      setTheme(stored === 'dark' || stored === 'light' ? stored : null);
    } catch {
      /* private mode, blocked storage — the default is the right fallback */
    }
    setReady(true);
  }, []);

  function cycle() {
    const next: Theme = theme === null ? 'dark' : theme === 'dark' ? 'light' : null;
    setTheme(next);
    const root = document.documentElement;
    if (next === null) {
      root.removeAttribute('data-theme');
    } else {
      root.setAttribute('data-theme', next);
    }
    try {
      if (next === null) localStorage.removeItem('theme');
      else localStorage.setItem('theme', next);
    } catch {
      /* the attribute is already set; persistence is the optional half */
    }
  }

  const label =
    theme === null ? 'Theme: follow system' : theme === 'dark' ? 'Theme: dark' : 'Theme: light';

  return (
    <button
      type="button"
      onClick={cycle}
      className="btn btn-sm btn-icon btn-quiet"
      aria-label={label}
      title={label}
      // Renders inert until the stored value is known, so the icon cannot flash
      // the wrong state on hydration.
      suppressHydrationWarning
    >
      {!ready || theme === null ? <AutoIcon /> : theme === 'dark' ? <MoonIcon /> : <SunIcon />}
    </button>
  );
}

const svg = {
  className: 'icon icon-sm',
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true
};

function SunIcon() {
  return (
    <svg {...svg}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg {...svg}>
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
    </svg>
  );
}

function AutoIcon() {
  return (
    <svg {...svg}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3v18" />
      <path d="M12 3a9 9 0 0 1 0 18Z" fill="currentColor" stroke="none" />
    </svg>
  );
}
