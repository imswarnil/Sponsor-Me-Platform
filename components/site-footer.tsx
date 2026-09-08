import Link from 'next/link';

import { Wordmark } from '@/components/wordmark';
import { isLiveMode, isDodoConfigured } from '@/lib/dodo';
import { site } from '@/lib/site';

/**
 * The footer. Deliberately thin — there is one page, so there is nothing to
 * link to but the creator's own sites and the legal minimum.
 *
 * THE TEST-MODE NOTICE IS THE IMPORTANT PART. While payments run against a
 * test key, every page that can take money says so, in plain words, where
 * somebody about to pay will see it. Saying nothing would be taking a card
 * number under a false impression, and the notice disappearing is exactly how
 * anyone can tell the platform went live.
 */
export function SiteFooter() {
  const testMode = isDodoConfigured() && !isLiveMode();

  return (
    <footer className="footer footer-compact">
      <div className="container">
        {testMode ? (
          <div className="alert alert-warning alert-inline mb-5">
            <div className="alert__content">
              <p className="alert__title">Test mode — no money moves</p>
              <p className="alert__body t-small">
                Payments here run against a payment-provider test key. Checkouts complete and the
                board updates, but no card is charged and nothing is owed. This notice disappears
                when the platform goes live.
              </p>
            </div>
          </div>
        ) : null}

        <div className="footer__top">
          <div className="footer__brand">
            <Wordmark />
            <p className="t-small t-muted t-measure-narrow">{site.description}</p>
          </div>

          <div className="footer__col">
            <p className="footer__head">Platform</p>
            <Link href="/#leaderboard">Leaderboard</Link>
            <Link href="/#slots">Slots</Link>
            <Link href="/signin">Sign in</Link>
            <Link href="/signup">Create an account</Link>
          </div>

          <div className="footer__col">
            <p className="footer__head">{site.creator}</p>
            <a href={site.owner} rel="me">
              {site.ownerLabel}
            </a>
            <a href={site.github} rel="me">
              GitHub
            </a>
          </div>
        </div>

        <div className="footer__bottom">
          <p className="footer__legal t-fine t-faint">
            © {new Date().getFullYear()} {site.creatorFull}. Ads are labelled as ads, and readers
            are not tracked — no cookies, no fingerprinting, no third-party scripts.
          </p>
        </div>
      </div>
    </footer>
  );
}
