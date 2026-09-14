import Link from 'next/link';

import { Container } from '@/components/layout';
import { SiteNav, type NavLink } from '@/components/nav';
import { getViewer, homeFor } from '@/lib/roles';
import { isDodoConfigured, isLiveMode } from '@/lib/dodo';
import { site } from '@/lib/site';

/**
 * THE WORDMARK. A dot, a name, and the accent on the half that says what the
 * product does to you rather than what it is.
 */
export function Wordmark({ small = false }: { small?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <span
        aria-hidden
        className="block size-2 shrink-0 rounded-full bg-accent"
      />
      <span
        className={`font-semibold tracking-tight text-title ${small ? 'text-[15px]' : 'text-[17px]'}`}
      >
        Sponsor<span className="text-accent-ink">Me</span>
      </span>
    </span>
  );
}

/**
 * THE SECTIONS OF THE HOMEPAGE, in the order they appear on it.
 *
 * Declared here rather than inside the nav because they are a fact about the
 * page, and the nav's job is to render whatever it is handed and mark whichever
 * one is on screen. On /me and /studio none of these ids exist, and the menu
 * silently marks nothing — which is the right behaviour without a second
 * component to express it.
 */
const SECTIONS: NavLink[] = [
  { href: '/#board', label: 'The board', id: 'board' },
  { href: '/#slots', label: 'Slots', id: 'slots' },
  { href: '/#how', label: 'How it works', id: 'how' },
  { href: '/#numbers', label: 'What you see', id: 'numbers' },
  { href: '/#faq', label: 'FAQ', id: 'faq' }
];

/**
 * THE HEADER: a wordmark, the sections, the theme, and one account control.
 *
 * It reads the session, so every route that renders it must be dynamic.
 */
export async function Header() {
  const viewer = await getViewer();

  return (
    <header
      className="sticky top-0 z-40 border-b border-line bg-surface/85 backdrop-blur-xl"
      style={{ minHeight: 'var(--sponsor-navbar--min-height)' }}
    >
      <Container className="flex h-full items-center justify-between gap-4 py-2.5">
        <Link href="/" aria-label={site.name}>
          <Wordmark />
        </Link>

        <SiteNav
          links={SECTIONS}
          account={
            viewer
              ? {
                  href: homeFor(viewer.role),
                  label: viewer.role === 'creator' ? 'Studio' : 'My ads'
                }
              : null
          }
        />
      </Container>
    </header>
  );
}

/**
 * THE TEST-MODE NOTICE.
 *
 * While payments run against a test key, every page that can take money says
 * so, in plain words, where somebody about to pay will see it. Saying nothing
 * would be taking a card number under a false impression — and the notice
 * disappearing on its own is how anyone can tell the platform went live.
 */
export async function Footer() {
  const testMode = isDodoConfigured() && !isLiveMode();
  /* Reading the session here is why this is async: a "Sign in" link shown to
     somebody who is signed in is a dead end that makes the page look broken.
     Every route rendering the footer is already dynamic for the header. */
  const viewer = await getViewer();

  return (
    <footer className="sp-rule mt-24">
      <Container className="py-14">
        {testMode ? (
          <div className="sp-callout sp-callout-gold mb-12 max-w-xl">
            <p className="font-semibold text-gold">Test mode — no money moves</p>
            <p className="mt-1 text-secondary">
              Checkouts complete and slots update, but no card is charged and nothing is owed.
              This notice disappears when the platform goes live.
            </p>
          </div>
        ) : null}

        <div className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Wordmark />
            <p className="mt-3 max-w-xs text-small leading-relaxed text-secondary">
              Ads are labelled as ads. Readers are never tracked — no cookies, no
              fingerprinting, no third-party scripts.
            </p>
          </div>

          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-small text-secondary">
            <a href={site.owner} className="transition-colors hover:text-title">
              {site.ownerLabel}
            </a>
            <a href={site.github} className="transition-colors hover:text-title">
              GitHub
            </a>
            {viewer ? (
              <Link href={homeFor(viewer.role)} className="transition-colors hover:text-title">
                {viewer.role === 'creator' ? 'Studio' : 'My ads'}
              </Link>
            ) : (
              <Link href="/signin" className="transition-colors hover:text-title">
                Sign in
              </Link>
            )}
          </nav>
        </div>
      </Container>
    </footer>
  );
}
