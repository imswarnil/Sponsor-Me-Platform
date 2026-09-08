
import { EmbedSnippet } from '@/components/embed-snippet';
import { NewSlotForm } from '@/components/new-slot-form';
import { SlotControls } from '@/components/slot-controls';
import { ReviewList } from '@/components/review-list';
import { StudioInbox } from '@/components/studio-inbox';
import { Figure, MeterRow, MoneyFigure, ctr } from '@/components/stats';
import { ActivityFeed, RelativeTime } from '@/components/marketing';
import { SignOutButton } from '@/components/sign-out-button';
import { formatPaise } from '@/lib/money';
import { slotFormatByKey } from '@/lib/site';
import { creatorEmailConfigured, requireCreator } from '@/lib/roles';
import {
  allSponsors,
  allThreads,
  earnings,
  listSlots,
  pendingReview,
  recentActivity,
  recentPayments,
  statsBySlot,
  statsOverall
} from '@/lib/queries';

/**
 * THE STUDIO — the creator's whole admin, on one page.
 *
 * Inventory, moderation, money, sponsors and the inbox. It is one page for the
 * same reason the sponsor's dashboard is: the question being asked is "what is
 * happening", and that answer should not be spread across five navigations.
 */
export const metadata = { title: 'Studio' };

export default async function StudioPage() {
  const viewer = await requireCreator();

  const [slots, money, stats, perSlot, review, sponsors, threads, payments, activity] =
    await Promise.all([
      listSlots(),
      earnings(),
      statsOverall(30),
      statsBySlot(30),
      pendingReview(),
      allSponsors(),
      allThreads(),
      recentPayments(10),
      recentActivity(15, false)
    ]);

  const viewsBySlot = new Map(perSlot.map((row) => [row.refId, row]));
  const clickRate = ctr(stats.views, stats.clicks);
  const pendingCount = review.bids.length + review.bookings.length;

  return (
    <div className="section">
      <div className="container stack stack-lg">
        <header className="page-head page-head-sm page-head-split">
          <div className="page-head__main">
            <p className="page-head__eyebrow">Studio</p>
            <h1 className="page-head__title">{viewer.name || 'Your platform'}</h1>
            <p className="page-head__meta t-fine t-faint">{viewer.email}</p>
          </div>
          <div className="page-head__actions">
            <SignOutButton />
          </div>
        </header>

        {/*
          Without CREATOR_EMAIL set, `getCreator()` falls back to the oldest
          account — and that fallback GRANTS ADMIN. It is correct for a fresh
          local install and dangerous in production, so the studio says so
          rather than leaving it to be discovered.
        */}
        {!creatorEmailConfigured() ? (
          <div className="alert alert-warning" role="alert">
            <div className="alert__content">
              <p className="alert__title">CREATOR_EMAIL is not set</p>
              <p className="alert__body t-small">
                Admin is currently granted to the oldest account in the database, which is this one
                by accident rather than by configuration. Set <code className="code">CREATOR_EMAIL</code>{' '}
                in the environment before this is public.
              </p>
            </div>
          </div>
        ) : null}

        {/* ── Money ────────────────────────────────────────────────────── */}
        <section className="figures">
          <MoneyFigure label="Collected, all time" paise={money.total} accent />
          <MoneyFigure label="This month" paise={money.thisMonth} />
          <Figure label="Payments" value={money.count} />
          <Figure label="Ad views · 30d" value={stats.views.toLocaleString('en-IN')} />
          <Figure label="Clicks · 30d" value={stats.clicks.toLocaleString('en-IN')} />
          {clickRate ? <Figure label="Click rate" value={clickRate} /> : null}
        </section>

        {/* ── Waiting on you ───────────────────────────────────────────── */}
        <section>
          <header className="sec sec-rule">
            <div className="sec__text">
              <h2 className="sec__title">
                Waiting on you{pendingCount ? ` (${pendingCount})` : ''}
              </h2>
              <p className="sec__lead">
                Nothing runs on your sites until you approve it — money alone never puts an ad on
                the board.
              </p>
            </div>
          </header>
          <ReviewList bids={review.bids} bookings={review.bookings} />
        </section>

        {/* ── Inventory ────────────────────────────────────────────────── */}
        <section>
          <header className="sec sec-rule">
            <div className="sec__text">
              <h2 className="sec__title">Ad slots</h2>
              <p className="sec__lead">
                A named position you sell by the month. The board runs everywhere regardless — a
                slot is for a fixed spot on one site.
              </p>
            </div>
          </header>

          <div className="row gy-5">
            <div className="col-12 col-lg-7">
              {slots.length ? (
                <div className="stack stack-sm">
                  {slots.map((slot) => {
                    const s = viewsBySlot.get(slot.id);
                    return (
                      <div key={slot.id} className="card card-compact">
                        <div className="card__body stack stack-sm">
                          <div className="cluster cluster-between">
                            <div className="truncate-1">
                              <p className="card__title truncate-1">{slot.name}</p>
                              <p className="card__meta t-fine t-faint">
                                {slotFormatByKey(slot.format).label} ·{' '}
                                {formatPaise(slot.pricePaise)}/month
                                {s ? ` · ${s.views.toLocaleString('en-IN')} views, ${s.clicks} clicks` : ''}
                              </p>
                            </div>
                            <span
                              className={`badge badge-${slot.active ? 'success' : 'quiet'} badge-dot`}
                            >
                              {slot.active ? 'live' : 'paused'}
                            </span>
                          </div>
                          <EmbedSnippet slot={slot} />
                          <SlotControls slotId={slot.id} active={slot.active} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="empty">
                  <div className="empty__body">
                    <p className="empty__title">No slots yet</p>
                    <p className="t-small t-muted">Create one and you get an embed snippet for it.</p>
                  </div>
                </div>
              )}
            </div>

            <div className="col-12 col-lg-5">
              <div className="card">
                <div className="card__body">
                  <p className="card__kicker">New slot</p>
                  <NewSlotForm />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── The board's own embed ────────────────────────────────────── */}
        <section>
          <header className="sec sec-rule">
            <div className="sec__text">
              <h2 className="sec__title">The SponsorBid widget</h2>
              <p className="sec__lead">
                One tag, on every site. Renders the top three — first large, second and third small
                — and links back here to outbid.
              </p>
            </div>
          </header>
          <EmbedSnippet />
        </section>

        {/* ── Sponsors ─────────────────────────────────────────────────── */}
        <section>
          <header className="sec sec-rule">
            <div className="sec__text">
              <h2 className="sec__title">Sponsors ({sponsors.length})</h2>
            </div>
          </header>

          {sponsors.length ? (
            <div className="table-scroll">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Who</th>
                    <th>On the board</th>
                    <th className="table__num">Paid, total</th>
                    <th>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {sponsors.map(({ profile, bid, paid }) => (
                    <tr key={profile.id}>
                      <td>
                        <span className="t-default">{profile.brand || profile.name || '—'}</span>
                        <br />
                        <span className="t-fine t-faint">{profile.email}</span>
                      </td>
                      <td>
                        {bid && bid.amountPaise > 0 ? (
                          <span className="t-data-sm">{formatPaise(bid.amountPaise)}</span>
                        ) : (
                          <span className="t-faint">—</span>
                        )}
                      </td>
                      <td className="table__num live-figure">{formatPaise(paid)}</td>
                      <td className="t-fine t-faint">
                        <RelativeTime date={profile.createdAt} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="t-small t-muted">Nobody has signed up yet.</p>
          )}
        </section>

        {/* ── Inbox + activity ─────────────────────────────────────────── */}
        <section className="row gy-6">
          <div className="col-12 col-lg-6">
            <header className="sec sec-rule">
              <div className="sec__text">
                <h2 className="sec__title">Inbox</h2>
              </div>
            </header>
            <StudioInbox threads={threads} />
          </div>

          <div className="col-12 col-lg-6">
            <header className="sec sec-rule">
              <div className="sec__text">
                <h2 className="sec__title">Everything that happened</h2>
              </div>
            </header>
            <ActivityFeed rows={activity} />

            {payments.length ? (
              <div className="mt-6">
                <p className="eyebrow">Recent payments</p>
                <table className="table table-compact">
                  <tbody>
                    {payments.map(({ payment, profile }) => (
                      <tr key={payment.id}>
                        <td className="t-small truncate-1">{profile.brand || profile.name}</td>
                        <td className="t-fine t-faint">{payment.kind}</td>
                        <td className="table__num live-figure">
                          {formatPaise(payment.amountPaise)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}
