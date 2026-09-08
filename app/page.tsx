import Link from 'next/link';

import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { SponsorBoard } from '@/components/ad-unit';
import { SlotCard } from '@/components/slot-card';
import {
  ActivityFeed,
  Advantages,
  HowItWorks,
  Ladder,
  Podium,
  Network,
  Sec
} from '@/components/marketing';
import { Figure } from '@/components/stats';
import { formatPaise } from '@/lib/money';
import { bidRules, properties, site } from '@/lib/site';
import {
  countBidders,
  minimumToLead,
  rankedBids,
  recentActivity,
  slotsWithAvailability,
  statsOverall
} from '@/lib/queries';

/**
 * THE HOMEPAGE — and very nearly the whole public product.
 *
 * There is no separate pricing page, no /how-it-works, no /network. Somebody
 * deciding whether to sponsor needs the board, the price, the proof and the
 * button in one scroll; splitting those across four routes only adds places
 * for them to leave.
 *
 * Every number on this page is read from the database in this render. Nothing
 * is estimated, and anything that cannot be read renders as absent — see
 * components/marketing.tsx.
 */

// Reads live figures and the session in the header, so it can never be static.
export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [board, minimum, bidderCount, slots, activity, stats] = await Promise.all([
    rankedBids(12),
    minimumToLead(null),
    countBidders(),
    slotsWithAvailability(),
    recentActivity(8),
    statsOverall(30)
  ]);

  const top = board.slice(0, bidRules.rendered);
  const liveProperties = properties.filter((p) => p.live).length;

  return (
    <>
      <SiteHeader />

      <main>
        {/* ── The pitch, and the board it is talking about ───────────────── */}
        <section className="section section-tight">
          <div className="container">
            <div className="row gy-6 a-center">
              <div className="col-12 col-lg-5">
                <div className="stack">
                  <p className="eyebrow">Sponsor {site.creatorFull}</p>
                  <h1 className="t-h1 t-balance">Put yourself in front of my audience.</h1>
                  <p className="t-lead t-measure-lead">
                    One board, running across {liveProperties} sites I build and maintain. The
                    highest bid renders large. Second and third render beside it. Pay more than the
                    person above you and you take their place.
                  </p>

                  <div className="cluster">
                    <Link href="/signup" className="btn btn-lg btn-primary">
                      Take the top spot — {formatPaise(minimum)}
                    </Link>
                    <a href="#slots" className="btn btn-lg btn-outline">
                      Or book a slot
                    </a>
                  </div>

                  {/* Real measurements only. A metric with nothing behind it
                      is simply not rendered. */}
                  <div className="figures">
                    {bidderCount > 0 ? (
                      <Figure
                        value={bidderCount}
                        label={bidderCount === 1 ? 'Sponsor bidding' : 'Sponsors bidding'}
                      />
                    ) : null}
                    {stats.views > 0 ? (
                      <Figure value={stats.views.toLocaleString('en-IN')} label="Ad views · 30d" />
                    ) : null}
                    {stats.clicks > 0 ? (
                      <Figure value={stats.clicks.toLocaleString('en-IN')} label="Clicks · 30d" />
                    ) : null}
                    <Figure value={liveProperties} label="Sites in the network" />
                  </div>
                </div>
              </div>

              <div className="col-12 col-lg-7">
                {/* The live board, exactly as it renders on the network — not a
                    picture of it. What you are looking at is what you are
                    buying into. */}
                <div className="card card-sunken card-roomy">
                  <p className="ad__label mb-3">
                    <span>Live right now · every site</span>
                    <span className="badge badge-live badge-dot">Live</span>
                  </p>
                  <SponsorBoard top={top} minimum={minimum} showFooter={false} />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── The leaderboard ────────────────────────────────────────────── */}
        <section className="section section-sunken" id="leaderboard">
          <div className="container">
            <Sec
              eyebrow="The board"
              title="Everyone who is on it"
              lead={`Ranked by what they have paid, in total, ever. A rank never expires — it is held until somebody pays more. The step to overtake is ${formatPaise(bidRules.step)}.`}
            />
            {/* The podium first — the shape of the race — then the ladder,
                which is the same information with the gaps drawn to scale. */}
            <Podium rows={board} />

            <div className="row gy-6 mt-8">
              <div className="col-12 col-lg-7">
                <Ladder rows={board} total={bidderCount} />
              </div>
              <div className="col-12 col-lg-5">
                <div className="card card-quiet">
                  <div className="card__body stack stack-sm">
                    <p className="card__kicker">What it costs today</p>
                    <p className="headline-figure headline-figure-accent">
                      {formatPaise(minimum)}
                    </p>
                    <p className="t-small t-muted">
                      to take first place right now. Bid less and you land wherever that amount puts
                      you — every rank on the board is for sale, not just the top one.
                    </p>
                    <Link href="/signup" className="btn btn-primary btn-block">
                      Place a bid
                    </Link>
                    <p className="t-fine t-faint m-0">
                      Paid once. Never renews. Refunds are not part of the model — you keep the rank
                      until somebody outbids you.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Bookable slots ─────────────────────────────────────────────── */}
        <section className="section" id="slots">
          <div className="container">
            <Sec
              eyebrow="Or book a slot"
              title="A fixed spot, for a fixed time"
              lead="A named position on one site, priced per month. See the real page before you pay. If somebody has it, you book the window after theirs."
            />
            {slots.length ? (
              <div className="row gy-5">
                {slots.map(({ slot, live, availableFrom }) => (
                  <div key={slot.id} className="col-12 col-sm-6 col-lg-4">
                    <SlotCard slot={slot} live={live} availableFrom={availableFrom} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty">
                <div className="empty__body">
                  <p className="empty__title">No slots are for sale yet</p>
                  <p className="t-small t-muted">
                    The board above is open in the meantime — it runs everywhere.
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ── Why ────────────────────────────────────────────────────────── */}
        <section className="section section-sunken">
          <div className="container">
            <Sec eyebrow="Why here" title="What you actually get" />
            <Advantages />
          </div>
        </section>

        {/* ── Network + how + activity ───────────────────────────────────── */}
        <section className="section">
          <div className="container">
            <div className="row gy-8">
              <div className="col-12 col-lg-7">
                <Sec eyebrow="The network" title={`${liveProperties} sites, one placement`} />
                <Network />
              </div>
              <div className="col-12 col-lg-5">
                <Sec eyebrow="How it works" title="Four steps" />
                <HowItWorks minimum={minimum} />
              </div>
            </div>
          </div>
        </section>

        <section className="section section-tight section-sunken">
          <div className="container">
            <div className="row gy-6">
              <div className="col-12 col-lg-7">
                <Sec eyebrow="Activity" title="What has been happening" />
                <ActivityFeed rows={activity} />
              </div>
              <div className="col-12 col-lg-5">
                <div className="cta cta-boxed">
                  <div className="cta__body">
                    <p className="cta__kicker">Ready</p>
                    <h2 className="cta__title">Take the top spot</h2>
                    <p className="t-small t-muted">
                      {formatPaise(minimum)} puts you first across the whole network today.
                    </p>
                  </div>
                  <div className="cta__actions">
                    <Link href="/signup" className="btn btn-primary">
                      Get started
                    </Link>
                    <Link href="/signin" className="btn btn-quiet">
                      Sign in
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
