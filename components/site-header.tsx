import Link from 'next/link';

import { Wordmark } from '@/components/wordmark';
import { ThemeToggle } from '@/components/theme-toggle';
import { getViewer, homeFor } from '@/lib/roles';

/**
 * THE WHOLE NAVIGATION.
 *
 * A wordmark and an account control. There is no nav list, because there is
 * nowhere else to go: the homepage is the product, and everything a signed-in
 * person does happens behind one door. A menu of four links to sections of one
 * page is furniture, not navigation.
 *
 * Reads the session, so every route that renders it must be dynamic. The
 * layouts that include it declare `force-dynamic` — get that wrong and Next
 * prerenders a signed-out header and serves it to everybody.
 */
export async function SiteHeader() {
  const viewer = await getViewer();

  return (
    /* `.navbar` IS the row — it carries its own gutter padding and height, so
       there is no inner wrapper to add. */
    <header className="navbar navbar-bordered navbar-sticky">
      <div className="navbar__brand">
        <Wordmark />
      </div>

      <div className="navbar__actions">
        <ThemeToggle />
        {viewer ? (
          <Link
            href={homeFor(viewer.role)}
            className="btn btn-sm btn-outline"
            title={viewer.email ?? undefined}
          >
            <AccountIcon />
            <span className="d-none d-sm-inline">{viewer.brand || viewer.name || 'Account'}</span>
          </Link>
        ) : (
          <>
            <Link href="/signin" className="btn btn-sm btn-quiet d-none d-sm-iflex">
              Sign in
            </Link>
            <Link href="/signup" className="btn btn-sm btn-primary">
              <AccountIcon />
              <span>Get started</span>
            </Link>
          </>
        )}
      </div>
    </header>
  );
}

/**
 * Drawn inline rather than pulled from an icon package: it is the only icon in
 * the header, and a dependency that ships a thousand glyphs to render one is a
 * bad trade. `currentColor` so it inherits whatever the button is doing.
 */
function AccountIcon() {
  return (
    <svg
      className="icon icon-sm"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
    </svg>
  );
}
