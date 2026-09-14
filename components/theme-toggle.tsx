'use client';

import { useEffect, useState } from 'react';

import { Monitor, Moon, Sun } from '@/components/icons';

/**
 * LIGHT / DARK / SYSTEM, in one button.
 *
 * The design system carries a full dark theme in `--sponsor-*` tokens, so this
 * control writes exactly one attribute — `data-color-scheme` on the root — and
 * every colour in the app follows. No component has a dark-mode branch, and
 * this file is the only place that knows the preference exists.
 *
 * THREE STATES, NOT TWO. "System" is a real answer: a reader whose laptop
 * flips at sunset wants the site to flip with it, and a two-state switch
 * silently takes that away the first time it is touched.
 *
 * The stored value is read back in an effect rather than during render — the
 * server cannot know it, so rendering it would be a hydration mismatch. The
 * inline script in the layout is what stops the flash; this only keeps the
 * icon honest.
 */
export const SCHEME_KEY = 'sponsor-color-scheme';

type Scheme = 'light' | 'dark' | 'system';

const NEXT: Record<Scheme, Scheme> = { light: 'dark', dark: 'system', system: 'light' };

const COPY: Record<Scheme, { label: string; icon: React.ReactNode }> = {
  light: { label: 'Light', icon: <Sun /> },
  dark: { label: 'Dark', icon: <Moon /> },
  system: { label: 'System', icon: <Monitor /> }
};

export function ThemeToggle() {
  const [scheme, setScheme] = useState<Scheme>('system');

  useEffect(() => {
    try {
      const saved = localStorage.getItem(SCHEME_KEY);
      if (saved === 'light' || saved === 'dark' || saved === 'system') setScheme(saved);
    } catch {
      /* storage blocked — the attribute the layout wrote already stands */
    }
  }, []);

  function pick(next: Scheme) {
    setScheme(next);
    document.documentElement.dataset.colorScheme = next;
    try {
      localStorage.setItem(SCHEME_KEY, next);
    } catch {
      /* the choice still applies for this page */
    }
  }

  const current = COPY[scheme];

  return (
    <button
      type="button"
      onClick={() => pick(NEXT[scheme])}
      className="sp-btn sp-btn-quiet sp-btn-sm sp-btn-icon"
      /* The label says the state AND what pressing does, because an icon that
         means "you are in dark mode" and an icon that means "go dark" are the
         same picture. */
      title={`Theme: ${current.label} — switch to ${COPY[NEXT[scheme]].label.toLowerCase()}`}
      aria-label={`Theme: ${current.label}. Switch to ${COPY[NEXT[scheme]].label.toLowerCase()}.`}
    >
      {current.icon}
    </button>
  );
}
