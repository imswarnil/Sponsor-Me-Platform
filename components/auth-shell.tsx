import Link from 'next/link';

import { Wordmark } from '@/components/wordmark';
import { SponsorBoard } from '@/components/ad-unit';
import { boardTop, minimumToLead } from '@/lib/queries';

/**
 * The frame around every auth page.
 *
 * The live board sits beside the form, which is not decoration: somebody
 * creating an account here is doing it to get onto that board, and showing the
 * real thing — with the real ranks currently held — is the most honest
 * possible argument for finishing the form.
 *
 * It collapses below `lg`, where a form on a phone should be a form.
 */
export async function AuthShell({
  title,
  lead,
  children
}: {
  title: string;
  lead?: string;
  children: React.ReactNode;
}) {
  const [{ top }, minimum] = await Promise.all([boardTop(), minimumToLead(null)]);

  return (
    <div className="section">
      <div className="container">
        <div className="row gy-8 a-center">
          <div className="col-12 col-lg-5">
            <div className="stack">
              <Wordmark />
              <div>
                <h1 className="t-h2">{title}</h1>
                {lead ? <p className="t-lead t-muted">{lead}</p> : null}
              </div>
              {children}
            </div>
          </div>

          <div className="col-12 col-lg-7 d-none d-lg-block">
            <div className="card card-sunken card-roomy">
              <p className="ad__label mb-3">
                <span>The board, right now</span>
                <span className="badge badge-live badge-dot">Live</span>
              </p>
              <SponsorBoard top={top} minimum={minimum} showFooter={false} />
              <p className="t-fine t-faint mt-3 m-0">
                <Link href="/">See the whole leaderboard →</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
