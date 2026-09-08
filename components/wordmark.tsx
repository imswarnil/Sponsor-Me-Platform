import Link from 'next/link';

/**
 * The site title, and the only piece of pure identity on the page.
 *
 * "Sponsor" plain, "Bid" in the accent, a dot on the end. One word carries the
 * colour — the design system's rationed-accent rule applied to the name
 * itself, so the wordmark and the buttons are arguing for the same thing.
 *
 * Styled by `.wordmark` in app/app.css.
 */
export function Wordmark({ href = '/' }: { href?: string }) {
  return (
    <Link href={href} className="wordmark" aria-label="SponsorBid — home">
      <span>Sponsor</span>
      <span className="wordmark__bid">Bid</span>
      <span className="wordmark__dot" aria-hidden />
    </Link>
  );
}
