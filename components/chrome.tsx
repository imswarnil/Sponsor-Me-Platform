import Link from 'next/link';

import { getViewer, homeFor } from '@/lib/roles';
import { isDodoConfigured, isLiveMode } from '@/lib/dodo';
import { site } from '@/lib/site';

/**
 * THE WHOLE NAVIGATION: a wordmark and one control.
 *
 * There is nowhere else to go — the homepage is the product. A menu of links
 * to sections of one page is furniture, not navigation.
 *
 * It reads the session, so every route that renders it must be dynamic.
 */
export async function Header() {
  const viewer = await getViewer();

  return (
    <header className="sticky top-0 z-40 border-b border-ink-200 bg-ink-0/90 backdrop-blur">
      <div className="bay flex items-center justify-between py-3">
        <Link href="/" className="flex items-baseline gap-2 no-underline">
          <span className="text-lg font-semibold tracking-tight text-ink-900">
            Sponsor<span className="text-signal-500">Me</span>
          </span>
          <span className="label hidden sm:inline">{site.ownerLabel}</span>
        </Link>

        {viewer ? (
          <Link href={homeFor(viewer.role)} className="btn btn-sm btn-quiet">
            {viewer.role === 'creator' ? 'Studio' : 'My ads'}
          </Link>
        ) : (
          <div className="flex items-center gap-2">
            <Link href="/signin" className="label hidden px-2 hover:text-ink-900 sm:block">
              Sign in
            </Link>
            <Link href="/signup" className="btn btn-sm btn-primary">
              Get started
            </Link>
          </div>
        )}
      </div>
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
export function Footer() {
  const testMode = isDodoConfigured() && !isLiveMode();

  return (
    <footer className="band mt-24 bg-ink-0">
      <div className="bay py-12">
        {testMode ? (
          <div className="mb-10 border-l-2 border-craft-500 bg-craft-50 py-3 pl-4">
            <p className="label label-accent text-craft-600">Test mode — no money moves</p>
            <p className="mt-1 max-w-lg text-sm text-ink-600">
              Checkouts complete and slots update, but no card is charged and nothing is owed.
              This notice disappears when the platform goes live.
            </p>
          </div>
        ) : null}

        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-lg font-semibold tracking-tight">
              Sponsor<span className="text-signal-500">Me</span>
            </p>
            <p className="mt-1 max-w-sm text-sm text-ink-500">
              Ads are labelled as ads. Readers are never tracked — no cookies, no
              fingerprinting, no third-party scripts.
            </p>
          </div>
          <div className="label flex gap-5">
            <a href={site.owner} className="hover:text-ink-900">
              {site.ownerLabel}
            </a>
            <a href={site.github} className="hover:text-ink-900">
              GitHub
            </a>
            <Link href="/signin" className="hover:text-ink-900">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
