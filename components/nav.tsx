'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { ArrowRight, Close, Menu } from '@/components/icons';
import { ThemeToggle } from '@/components/theme-toggle';

/**
 * THE MENU.
 *
 * Two behaviours, one component:
 *
 *   WIDE    the sections inline, with a dot under whichever one is on screen.
 *   NARROW  a sheet, because five links do not fit beside a wordmark and an
 *           account button, and shrinking them until they do is how a header
 *           becomes unreadable.
 *
 * THE DOT IS AN OBSERVER, NOT A SCROLL HANDLER. A `scroll` listener that
 * measures offsets runs on every frame and fights the browser; an
 * IntersectionObserver is told once which elements matter and then says
 * nothing until one of them crosses the line.
 *
 * The links are given rather than hardcoded here, because they point at
 * sections of the homepage — a page this component should not have to know
 * the shape of.
 */
export type NavLink = { href: string; label: string; id?: string };

export function SiteNav({
  links,
  account
}: {
  links: NavLink[];
  account: { href: string; label: string } | null;
}) {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<string | null>(null);

  /* Which section is on screen. Only the ids that actually exist on this page
     are observed, so the same link list is safe on /me and /studio, where
     none of them do. */
  useEffect(() => {
    const ids = links.map((l) => l.id).filter((id): id is string => Boolean(id));
    const nodes = ids
      .map((id) => document.getElementById(id))
      .filter((n): n is HTMLElement => Boolean(n));
    if (!nodes.length) return;

    const seen = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) seen.add(entry.target.id);
          else seen.delete(entry.target.id);
        }
        /* The topmost visible one wins, so scrolling down does not leave the
           mark on a section that has only just left the viewport. */
        setCurrent(ids.find((id) => seen.has(id)) ?? null);
      },
      /* A band across the middle of the viewport: a section counts as "here"
         when it is being read, not when its first pixel appears. */
      { rootMargin: '-45% 0px -45% 0px' }
    );

    for (const node of nodes) observer.observe(node);
    return () => observer.disconnect();
  }, [links]);

  /* Escape closes the sheet, and a resize past the breakpoint closes it too —
     otherwise it stays mounted, invisible, holding focus. */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const wide = window.matchMedia('(min-width: 64rem)');
    const onWide = () => wide.matches && setOpen(false);
    window.addEventListener('keydown', onKey);
    wide.addEventListener('change', onWide);
    return () => {
      window.removeEventListener('keydown', onKey);
      wide.removeEventListener('change', onWide);
    };
  }, [open]);

  return (
    <>
      <nav className="hidden items-center lg:flex" aria-label="Sections">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="sp-nav-link"
            aria-current={l.id && current === l.id ? 'true' : undefined}
          >
            {l.label}
          </Link>
        ))}
      </nav>

      <div className="flex items-center gap-2">
        <ThemeToggle />

        {account ? (
          <Link href={account.href} className="sp-btn sp-btn-soft sp-btn-sm">
            {account.label}
          </Link>
        ) : (
          <>
            <Link href="/signin" className="sp-btn sp-btn-quiet sp-btn-sm hidden sm:inline-flex">
              Sign in
            </Link>
            <Link href="/signup" className="sp-btn sp-btn-sm">
              Get started
            </Link>
          </>
        )}

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="sp-btn sp-btn-quiet sp-btn-sm sp-btn-icon lg:hidden"
          aria-expanded={open}
          aria-controls="sp-menu"
          aria-label={open ? 'Close menu' : 'Open menu'}
        >
          {open ? <Close /> : <Menu />}
        </button>
      </div>

      {open ? (
        <div id="sp-menu" className="sp-sheet lg:hidden">
          <ul>
            {links.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="sp-sheet-link" onClick={() => setOpen(false)}>
                  {l.label}
                  <ArrowRight className="size-4 text-mute" />
                </Link>
              </li>
            ))}
          </ul>

          {!account ? (
            <Link
              href="/signin"
              onClick={() => setOpen(false)}
              className="sp-btn sp-btn-soft sp-btn-block mt-6"
            >
              Sign in
            </Link>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
