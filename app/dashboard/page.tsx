import Link from 'next/link';

import { ActionForm, CreativeFields, SubmitButton } from '@/components/forms';
import { BidForm } from '@/components/bid-form';
import { MessageThread } from '@/components/message-thread';
import { BookingCreative, BrandForm } from '@/components/booking-creative';
import { Chart, Figure, ctr } from '@/components/stats';
import { RelativeTime } from '@/components/marketing';
import { SignOutButton } from '@/components/sign-out-button';
import { saveBidCreativeAction } from '@/lib/actions';
import { formatPaise } from '@/lib/money';
import { bidRules } from '@/lib/site';
import { requireSponsor } from '@/lib/roles';
import {
  minimumToLead,
  myBid,
  myBookings,
  myPayments,
  myStanding,
  statsForProfile,
  threadFor
} from '@/lib/queries';

/**
 * THE SPONSOR'S DASHBOARD — one page.
 *
 * Their rank, their ad, their numbers, their bookings, their receipts and
 * their conversation with the creator. Splitting six sections across six
 * routes would mean six navigations to answer "is it working", which is the
 * only question anybody opens this page to ask.
 */
export const metadata = { title: 'Your dashboard' };

export default async function DashboardPage({
  searchParams
}: {
  searchParams: Promise<{ paid?: string }>;
}) {
  const viewer = await requireSponsor();
  const [{ paid }, bid, standing, minimum, stats, bookings, payments, thread] = await Promise.all([
    searchParams,
    myBid(viewer.id),
    myStanding(viewer.id),
    minimumToLead(viewer.id),
    statsForProfile(viewer.id, 30),
    myBookings(viewer.id),
    myPayments(viewer.id),
    threadFor(viewer.id)
  ]);

  const clickRate = ctr(stats.views, stats.clicks);
  const hasCreative = Boolean(bid?.headline);

  return (
    <div className="section">
      <div className="container stack stack-lg">
        <header className="page-head page-head-sm page-head-split">
          <div className="page-head__main">
            <p className="page-head__eyebrow">Sponsor</p>
            <h1 className="page-head__title">{viewer.brand || viewer.name || 'Your dashboard'}</h1>
            <p className="page-head__meta t-fine t-faint">{viewer.email}</p>
          </div>
          <div className="page-head__actions">
            <SignOutButton />
          </div>
        </header>

        {/*
          A payment redirect proves nothing — the ad goes live when the signed
          webhook lands, which is usually seconds later but is not guaranteed
          to have happened by the time this page renders. So this says what is
          actually true rather than "paid".
        */}
        {paid ? (
          <div className="alert alert-info" role="status">
            <div className="alert__content">
              <p className="alert__title">Checkout finished</p>
              <p className="alert__body t-small">
                Your payment is being confirmed by the payment provider. Your rank updates the
                moment it lands — usually within a few seconds. Reload to check.
              </p>
            </div>
          </div>
        ) : null}

        {/* ── Standing ─────────────────────────────────────────────────── */}
        <section className="row gy-5">
          <div className="col-12 col-lg-7">
            <div className="card card-roomy">
              <div className="card__body stack stack-sm">
                <p className="card__kicker">Your position</p>

                {standing ? (
                  <>
                    <div className="cluster cluster-baseline">
                      <span className={`medal medal-lg medal-${Math.min(standing.rank, 4)}`}>
                        {standing.rank}
                      </span>
                      <span className="headline-figure">
                        {formatPaise(standing.bid.amountPaise)}
                      </span>
                      <span className="t-small t-muted">paid in total</span>
                    </div>

                    {standing.toOvertake === null ? (
                      <p className="t-small t-muted m-0">
                        You are first. You hold it until somebody pays more — there is no renewal
                        and no expiry.
                      </p>
                    ) : (
                      <p className="t-small t-muted m-0">
                        {formatPaise(standing.toOvertake)} more takes rank {standing.rank - 1}.
                      </p>
                    )}
                  </>
                ) : bid && bid.status === 'pending' && bid.amountPaise > 0 ? (
                  <p className="t-small t-muted m-0">
                    Paid, and waiting on review before it appears on the board.
                  </p>
                ) : (
                  <p className="t-small t-muted m-0">
                    You are not on the board yet. {formatPaise(minimum)} takes first place today.
                  </p>
                )}

                {bid?.status === 'rejected' ? (
                  <div className="alert alert-danger alert-inline">
                    <p className="alert__body">
                      This creative was not approved
                      {bid.reviewNote ? `: ${bid.reviewNote}` : '.'} Edit it below and it goes back
                      for review — your rank and what you have paid are untouched.
                    </p>
                  </div>
                ) : null}

                <BidForm
                  minimum={minimum}
                  step={bidRules.step}
                  floor={bidRules.floor}
                  disabled={!hasCreative}
                />
              </div>
            </div>
          </div>

          {/* ── Numbers ────────────────────────────────────────────────── */}
          <div className="col-12 col-lg-5">
            <div className="card card-roomy">
              <div className="card__body stack stack-sm">
                <p className="card__kicker">Last 30 days</p>

                {stats.views > 0 ? (
                  <>
                    <div className="figures">
                      <Figure label="Views" value={stats.views.toLocaleString('en-IN')} />
                      <Figure label="Clicks" value={stats.clicks.toLocaleString('en-IN')} />
                      {clickRate ? <Figure label="Click rate" value={clickRate} accent /> : null}
                    </div>
                    <Chart series={stats.series} />
                    <p className="t-fine t-faint m-0">
                      Counted per day, per ad. No cookies and no visitor tracking — which is why
                      these are impressions, not people.
                    </p>
                  </>
                ) : (
                  <p className="t-small t-muted m-0">
                    Nothing counted yet. Numbers appear here the first time your ad is shown.
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ── The ad ───────────────────────────────────────────────────── */}
        <section>
          <header className="sec sec-rule">
            <div className="sec__text">
              <h2 className="sec__title">Your ad</h2>
              <p className="sec__lead">
                This is what runs across the network. Editing sends it back for review; your rank
                and your total are not affected.
              </p>
            </div>
            {bid ? (
              <div className="sec__actions">
                <span
                  className={`badge ${
                    bid.status === 'approved'
                      ? 'badge-success'
                      : bid.status === 'rejected'
                        ? 'badge-danger'
                        : 'badge-warning'
                  } badge-dot`}
                >
                  {bid.status}
                </span>
              </div>
            ) : null}
          </header>

          <div className="card">
            <div className="card__body">
              <ActionForm action={saveBidCreativeAction}>
                <CreativeFields defaults={bid ?? undefined} />
                <div className="form__actions">
                  <SubmitButton label="Save ad" />
                </div>
              </ActionForm>
            </div>
          </div>
        </section>

        {/* ── Bookings ─────────────────────────────────────────────────── */}
        <section>
          <header className="sec sec-rule">
            <div className="sec__text">
              <h2 className="sec__title">Your slots</h2>
            </div>
            <div className="sec__actions">
              <Link href="/#slots" className="btn btn-sm btn-outline">
                Book another
              </Link>
            </div>
          </header>

          {bookings.length ? (
            <div className="stack stack-sm">
            <div className="table-scroll">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Slot</th>
                    <th>Window</th>
                    <th className="table__num">Paid</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map(({ booking, slot }) => (
                    <tr key={booking.id}>
                      <td>{slot.name}</td>
                      <td className="t-small t-muted">
                        {booking.startsAt.toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short'
                        })}
                        {' → '}
                        {booking.endsAt.toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="table__num live-figure">{formatPaise(booking.amountPaise)}</td>
                      <td>
                        <span
                          className={`badge badge-${booking.status === 'paid' ? 'success' : 'quiet'} badge-dot`}
                        >
                          {booking.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* One editor per booking. Last month's ad must not silently change
                when this month's is edited, which is why the creative lives on
                the booking rather than on the profile. */}
            {bookings
              .filter(({ booking }) => booking.status === 'paid')
              .map(({ booking, slot }) => (
                <BookingCreative key={booking.id} booking={booking} slotName={slot.name} />
              ))}
            </div>
          ) : (
            <div className="empty">
              <div className="empty__body">
                <p className="empty__title">No slots booked</p>
                <p className="t-small t-muted">
                  The board runs everywhere already — a slot is a fixed position on one site.
                </p>
              </div>
            </div>
          )}
        </section>

        {/* ── Money + messages ─────────────────────────────────────────── */}
        <section className="row gy-6">
          <div className="col-12 col-lg-6">
            <header className="sec sec-rule">
              <div className="sec__text">
                <h2 className="sec__title">Payments</h2>
              </div>
            </header>

            {payments.length ? (
              <table className="table table-compact">
                <tbody>
                  {payments.map((payment) => (
                    <tr key={payment.id}>
                      <td className="t-small">{payment.kind === 'bid' ? 'Bid' : 'Slot booking'}</td>
                      <td className="t-fine t-faint">
                        <RelativeTime date={payment.paidAt ?? payment.createdAt} />
                      </td>
                      <td>
                        <span
                          className={`badge badge-sm badge-${
                            payment.status === 'paid'
                              ? 'success'
                              : payment.status === 'failed'
                                ? 'danger'
                                : 'quiet'
                          }`}
                        >
                          {payment.status}
                        </span>
                      </td>
                      <td className="table__num live-figure">{formatPaise(payment.amountPaise)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="t-small t-muted">No payments yet.</p>
            )}
          </div>

          <div className="col-12 col-lg-6">
            <header className="sec sec-rule">
              <div className="sec__text">
                <h2 className="sec__title">Messages</h2>
                <p className="sec__lead">Straight to the creator. No ticket queue.</p>
              </div>
            </header>
            <MessageThread messages={thread} selfIsCreator={false} />
          </div>
        </section>

        {/* ── Who you are ──────────────────────────────────────────────── */}
        <section>
          <header className="sec sec-rule">
            <div className="sec__text">
              <h2 className="sec__title">Your details</h2>
            </div>
          </header>
          <div className="card">
            <div className="card__body">
              <BrandForm name={viewer.name} brand={viewer.brand} />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
