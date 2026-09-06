'use client';

import * as React from 'react';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';

/** Writes the design system's own contract — an explicit `data-theme` on the
 *  root element. With no stored choice the attribute is absent and the OS
 *  preference decides, which is what creator/01-color.css expects. */
export function ThemeToggle() {
  const [dark, setDark] = React.useState(false);

  React.useEffect(() => {
    const explicit = document.documentElement.getAttribute('data-theme');
    setDark(
      explicit ? explicit === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches
    );
  }, []);

  function toggle() {
    const next = !dark;
    document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light');
    try {
      localStorage.setItem('theme', next ? 'dark' : 'light');
    } catch {}
    setDark(next);
  }

  return (
    <Button variant="quiet" size="icon" onClick={toggle} aria-label="Toggle theme" aria-pressed={dark}>
      <Sun className={dark ? 'hidden' : 'block'} />
      <Moon className={dark ? 'block' : 'hidden'} />
    </Button>
  );
}
