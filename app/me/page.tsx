import Link from 'next/link';

import { Footer, Header } from '@/components/chrome';
import { Container, Empty, Stat } from '@/components/layout';
import { AdRender } from '@/components/ad-render';
import { SignOut } from '@/components/sign-out';
import { Analytics, EmptyAnalytics } from '@/components/analytics';
import { Meter, Sparkline } from '@/components/charts';
import { ArrowRight, Bookmark, Trophy } from '@/components/icons';
import { formatPaise } from '@/lib/money';
import { requireSponsor } from '@/lib/roles';
import {
  dailyForAd,
  dailyForProfile,
  myAds,
  myPayments,
  standingFor,
  statsForAd,
  statsForProfile
} from '@/lib/queries';
import type { Ad } from '@/lib/db/schema';

/**
 * THE SPONSOR'S PAGE — every ad they run, on one screen.
 *
 * One card per ad: what it looks like, where it stands, what it has cost, and
 * how it is doing. Splitting those across routes would mean four navigations
 * to answer "is it working", which is the only question anybody opens this
 * page to ask.
 */
export const dynamic = 'force-dynamic';
export const metadata = { title: 'My ads' };

export default async function MyAds({
  searchParams
}: {
  searchParams: Promise<{ paid?: string }>;
}) {
  const viewer = await requireSponsor();
  const [{ paid }, rows, totals, payments, daily] = await Promise.all([
    searchParams,
    myAds(viewer.id),
    statsForProfile(viewer.id),
    myPayments(viewer.id),
    dailyForProfile(viewer.id, 30)
  ]);

  const detailed = await Promise.all(
    rows.map(async ({ ad, slot }) => ({
      ad,
      slot,
      standing: ad.status === 'live' ? await standingFor(ad.id) : null,
      stats: await statsForAd(ad.id),
      series: await dailyForAd(ad.id, 30)
    }))
  );

  return (
    <>
      <Header />

      <main className="min-h-[60vh]">
        <Container className="pb-20 pt-10">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="sp-eyebrow">Your stuff</p>
              <h1 className="sp-h1 mt-3">{viewer.brand || viewer.name || 'My ads'}</h1>
              <p className="mt-1.5 text-small text-secondary">{viewer.email}</p>
            </div>
            <SignOut />
          </div>

          {/*
            A payment redirect proves nothing. The ad goes live when the signed
            webhook lands — usually seconds later, but not guaranteed to have
            happened by the time this page renders. So this says what is true.
          */}
          {paid ? (
            <div className="sp-callout sp-callout-success mt-8 max-w-xl">
              <p className="font-semibold text-success">Checkout finished</p>
              <p className="mt-1 text-secondary">
                The payment is being confirmed. Your ad updates the moment it lands — reload in
                a few seconds.
              </p>
            </div>
          ) : null}

          {/* Only real measurements. */}
          {totals.views > 0 ? (
            <div className="mt-8 flex flex-wrap gap-3">
              <Stat value={totals.views.toLocaleString('en-IN')} label="views" />
              <Stat value={totals.clicks.toLocaleString('en-IN')} label="clicks" />
              <Stat
                gold
                value={`${((totals.clicks / totals.views) * 100).toFixed(1)}%`}
                label="click rate"
              />
            </div>
          ) : null}

          {/* THE PANEL, not a row of numbers. A sponsor's question is "is it
              working", and a total with no shape to it cannot answer that. */}
          {detailed.length ? (
            <div className="mt-8">
              {totals.views > 0 ? (
                <Analytics
                  series={daily}
                  title="All your ads"
                  lead="Every ad you run, by day."
                />
              ) : (
                <EmptyAnalytics lead="Nothing has been counted yet. Numbers appear the first day an approved ad is shown." />
              )}
            </div>
          ) : null}

          {detailed.length ? (
            <div className="mt-12 flex flex-col gap-5">
              {detailed.map(({ ad, slot, standing, stats, series }) => {
                const ended = hasEnded(ad);
                return (
                  <div key={ad.id} className="sp-card sp-card-frame p-6 sm:p-8">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`sp-badge ${slot.kind === 'bid' ? 'sp-badge-gold' : 'sp-badge-quiet'}`}
                          >
                            {slot.kind === 'bid' ? <Trophy /> : <Bookmark />}
                            {slot.kind === 'bid' ? 'Bid' : 'Bought'}
                          </span>
                          <Status status={ad.status} ended={ended} />
                        </div>
                        <p className="sp-h3 mt-3 font-semibold">{slot.name}</p>
                      </div>

                      <Link href={`/slot/${slot.publicId}`} className="sp-btn sp-btn-soft sp-btn-sm">
                        {slot.kind === 'bid' ? 'Bid more' : 'Manage'}
                      </Link>
                    </div>

                    {ad.reviewNote && ad.status === 'rejected' ? (
                      <p className="sp-callout sp-callout-error mt-5">
                        <strong className="font-semibold text-error">Not approved:</strong>{' '}
                        {ad.reviewNote}
                      </p>
                    ) : null}

                    {/* An ad past its end date has stopped serving. `/me` used
                        to render it identically to a running one, which read
                        as "still live" — so the run says so, out loud. */}
                    {ended ? (
                      <p className="sp-callout mt-5">
                        This run has ended, so the ad is no longer serving. Buy the slot again
                        to put it back.
                      </p>
                    ) : null}

                    <div className="mt-6 grid gap-6 md:grid-cols-2">
                      <div>
                        <p className="sp-eyebrow">How it looks</p>
                        <div className="mt-4 min-h-[200px]">
                          <AdRender ad={toLiveShape(ad)} shape={slot.shape} />
                        </div>
                      </div>

                      <dl className="sp-rows self-start">
                        <Line label="Paid, in total" value={formatPaise(ad.amountPaise)} />
                        {standing ? (
                          <>
                            <Line
                              label="Position"
                              value={`#${standing.rank} of ${standing.total}`}
                              gold={standing.rank === 1}
                            />
                            {standing.toLead > 0 ? (
                              <>
                                <Line
                                  label="To take the top"
                                  value={`+ ${formatPaise(standing.toLead)}`}
                                />
                                {/* How far behind, as a picture. "#3 of 4" and
                                    "₹400 short" are the same rank and two
                                    completely different situations. */}
                                <div className="py-3.5">
                                  <Meter
                                    value={ad.amountPaise}
                                    max={ad.amountPaise + standing.toLead}
                                  />
                                </div>
                              </>
                            ) : null}
                          </>
                        ) : null}
                        {ad.endsAt ? (
                          <Line
                            label={ended ? 'Ran until' : 'Runs until'}
                            value={new Date(ad.endsAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          />
                        ) : null}

                        {stats.views > 0 ? (
                          <>
                            <Line label="Views" value={stats.views.toLocaleString('en-IN')} />
                            <Line label="Clicks" value={stats.clicks.toLocaleString('en-IN')} />
                            <Line
                              label="Click rate"
                              value={`${((stats.clicks / stats.views) * 100).toFixed(1)}%`}
                            />
                            {/* The shape of the last 30 days, at the size of a
                                word. The full chart is the panel above; this is
                                only here to say "rising" or "flat". */}
                            <div className="flex items-center justify-between gap-4 py-3.5">
                              <span className="text-small text-secondary">Last 30 days</span>
                              <span className="text-title">
                                <Sparkline series={series} className="h-8 w-28" />
                              </span>
                            </div>
                          </>
                        ) : (
                          <div className="pt-4 text-small text-secondary">
                            No views counted yet — numbers appear the first time it is shown.
                          </div>
                        )}
                      </dl>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="mt-12">
              <Empty
                title="No ads yet"
                lead="Pick a slot and write one. You can see exactly what you are buying before you pay."
                action={
                  <Link href="/#slots" className="sp-btn">
                    Browse slots
                    <ArrowRight />
                  </Link>
                }
              />
            </div>
          )}

          {payments.length ? (
            <div className="mt-10 overflow-hidden rounded-frame bg-surface-100">
              <p className="sp-h4 px-6 pb-2 pt-6 font-semibold sm:px-8">Payments</p>
              <div className="overflow-x-auto px-3 pb-4 sm:px-5">
                <table className="sp-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Status</th>
                      <th className="text-end">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p) => (
                      <tr key={p.id}>
                        <td className="text-secondary">
                          {new Date(p.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </td>
                        <td>
                          <span
                            className={`sp-badge ${
                              p.status === 'paid'
                                ? 'sp-badge-success'
                                : p.status === 'failed'
                                  ? 'sp-badge-error'
                                  : 'sp-badge-quiet'
                            }`}
                          >
                            {p.status}
                          </span>
                        </td>
                        <td className="sp-num text-end font-semibold text-title">
                          {formatPaise(p.amountPaise)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </Container>
      </main>

      <Footer />
    </>
  );
}

/** A fixed run whose term is up. `contendersFor()` already stops serving it. */
function hasEnded(ad: Ad): boolean {
  return Boolean(ad.endsAt && new Date(ad.endsAt).getTime() < Date.now());
}

/** The ad row, in the shape `AdRender` reads. Rank is 1: it is their own ad. */
function toLiveShape(ad: Ad) {
  return {
    id: ad.id,
    slotId: ad.slotId,
    profileId: ad.profileId,
    rank: 1,
    format: ad.format,
    brand: ad.brand,
    tag: ad.tag,
    logoUrl: ad.logoUrl,
    headline: ad.headline,
    body: ad.body,
    url: ad.url,
    imageUrl: ad.imageUrl,
    videoUrl: ad.videoUrl,
    ctaLabel: ad.ctaLabel,
    html: ad.html,
    amountPaise: ad.amountPaise,
    isHouse: ad.isHouse
  };
}

function Line({ label, value, gold }: { label: string; value: string; gold?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-3.5">
      <dt className="text-small text-secondary">{label}</dt>
      <dd className={`sp-num font-semibold ${gold ? 'text-gold' : 'text-title'}`}>{value}</dd>
    </div>
  );
}

function Status({ status, ended }: { status: string; ended: boolean }) {
  if (ended) return <span className="sp-badge sp-badge-quiet">Ended</span>;

  const [tone, label] =
    status === 'live'
      ? ['sp-badge-success', 'Live']
      : status === 'pending'
        ? ['sp-badge-gold', 'In review']
        : status === 'rejected'
          ? ['sp-badge-error', 'Rejected']
          : ['sp-badge-quiet', 'Draft'];

  return <span className={`sp-badge ${tone}`}>{label}</span>;
}
