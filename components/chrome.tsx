import Link from 'next/link';

import { getViewer, homeFor } from '@/lib/roles';
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
    <header className="sticky top-0 z-50 border-b-2 border-ink-900 bg-ink-0/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="group flex items-center gap-2 no-underline">
          <span className="grid h-9 w-9 place-items-center rounded-xl border-2 border-ink-900 bg-signal-500 text-lg shadow-[3px_3px_0_0_var(--color-ink-900)] transition group-hover:rotate-6">
            👋
          </span>
          <span className="text-lg font-black tracking-tight text-ink-900">
            Sponsor<span className="text-signal-500">&nbsp;Me</span>
          </span>
        </Link>

        {viewer ? (
          <Link
            href={homeFor(viewer.role)}
            className="btn-pop bg-white text-sm"
            title={viewer.email ?? undefined}
          >
            <span className="grid h-5 w-5 place-items-center rounded-full bg-iris-500 text-[10px] font-black text-white">
              {(viewer.brand || viewer.name || '?').slice(0, 1).toUpperCase()}
            </span>
            <span className="hidden sm:inline">
              {viewer.role === 'creator' ? 'Studio' : 'My ads'}
            </span>
          </Link>
        ) : (
          <div className="flex items-center gap-2">
            <Link href="/signin" className="hidden px-3 text-sm font-semibold sm:block">
              Sign in
            </Link>
            <Link href="/signup" className="btn-pop bg-signal-500 text-sm text-white">
              Get started
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="border-t-2 border-ink-900 bg-ink-900 px-4 py-10 text-ink-200">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-2xl font-black text-white">
            Sponsor<span className="text-signal-400">&nbsp;Me</span>
          </p>
          <p className="mt-1 max-w-sm text-sm text-ink-400">
            Ads are labelled as ads. Readers are never tracked — no cookies, no
            fingerprinting, no third-party scripts.
          </p>
        </div>
        <div className="flex gap-5 text-sm">
          <a href={site.owner} className="hover:text-white">
            {site.ownerLabel}
          </a>
          <a href={site.github} className="hover:text-white">
            GitHub
          </a>
          <Link href="/signin" className="hover:text-white">
            Sign in
          </Link>
        </div>
      </div>
    </footer>
  );
}
