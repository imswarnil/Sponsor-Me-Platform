import { Footer, Header } from '@/components/chrome';
import { Container, Empty, Stat } from '@/components/layout';
import { AdRender } from '@/components/ad-render';
import { SignOut } from '@/components/sign-out';
import { NewSlot, ReviewControls, SlotControls, SlotTag } from '@/components/slot-admin';
import { Analytics, EmptyAnalytics } from '@/components/analytics';
import { Meter, Sparkline } from '@/components/charts';
import { Bookmark, Check, External, Trophy } from '@/components/icons';
import { formatPaise } from '@/lib/money';
import { SHAPES } from '@/lib/site';
import { creatorEmailConfigured, requireCreator } from '@/lib/roles';
import {
  allSponsors,
  dailyOverall,
  earnings,
  pendingReview,
  perSlotStats,
  slotsWithState,
  statsOverall
} from '@/lib/queries';
import type { Ad } from '@/lib/db/schema';

/**
 * THE STUDIO — make slots, get tags, approve ads, see the money.
 *
 * One page, because the question being asked is "what is happening", and that
 * answer should not be spread across five navigations.
 */
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Studio' };

export default async function Studio() {
  const viewer = await requireCreator();
  const [slots, money, stats, queue, sponsors, daily, perSlot] = await Promise.all([
    slotsWithState(false),
    earnings(),
    statsOverall(),
    pendingReview(),
    allSponsors(),
    dailyOverall(30),
    perSlotStats(30)
  ]);

  /* The busiest slot sets the scale every other slot's bar is read against —
     a per-row bar scaled to its own value would make every row look equal. */
  const busiest = Math.max(...perSlot.map((r) => r.views), 1);

  return (
    <>
      <Header />

      <main className="min-h-[60vh]">
        <Container wide className="pb-20 pt-10">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="sp-eyebrow">Studio</p>
              <h1 className="sp-h1 mt-3">{viewer.name || 'Your slots'}</h1>
              <p className="mt-1.5 text-small text-secondary">{viewer.email}</p>
            </div>
            <SignOut />
          </div>

          {/*
            Without CREATOR_EMAIL set, admin falls back to the oldest account —
            correct for a fresh local install, dangerous in production. Said out
            loud rather than left to be discovered.
          */}
          {!creatorEmailConfigured() ? (
            <div className="sp-callout sp-callout-gold mt-8 max-w-xl">
              <p className="font-semibold text-gold">CREATOR_EMAIL is not set</p>
              <p className="mt-1 text-secondary">
                Admin is currently granted to the oldest account in the database — this one by
                accident, not by configuration. Set it before this is public.
              </p>
            </div>
          ) : null}

          {/* ── Money ─────────────────────────────────────────────────── */}
          <div className="mt-8 flex flex-wrap gap-3">
            <Stat gold value={formatPaise(money.total)} label="collected" />
            <Stat value={money.count} label="payments" />
            {stats.views > 0 ? (
              <Stat value={stats.views.toLocaleString('en-IN')} label="views" />
            ) : null}
            {stats.clicks > 0 ? (
              <Stat value={stats.clicks.toLocaleString('en-IN')} label="clicks" />
            ) : null}
            <Stat value={sponsors.length} label="sponsors" />
          </div>

          {/* ── Performance ───────────────────────────────────────────────
              The studio used to show platform totals and stop there, so the
              one question a creator actually has — "which slot is worth
              anything?" — had no answer on the page that sells them. */}
          <section className="mt-16">
            <h2 className="sp-h2">Performance</h2>
            <p className="mt-2 text-small text-secondary">
              Counted per ad per day. Nothing about any reader is stored, so this is the
              whole of what exists.
            </p>

            <div className="mt-7">
              {stats.views > 0 ? (
                <Analytics
                  series={daily}
                  title="Everything you serve"
                  lead="Every ad in every slot, by day."
                />
              ) : (
                <EmptyAnalytics lead="No ad has served yet. The first approved ad starts this the day it goes live." />
              )}
            </div>

            {/* Per slot, which is where a creator decides what to build next. */}
            {perSlot.length ? (
              <div className="mt-4 overflow-hidden rounded-frame bg-surface-100">
                <p className="sp-h4 px-6 pb-1 pt-6 font-semibold sm:px-8">By slot</p>
                <p className="px-6 pb-4 text-tiny text-secondary sm:px-8">
                  Last 30 days. Revenue is every payment ever collected against the slot.
                </p>
                <div className="overflow-x-auto px-3 pb-4 sm:px-5">
                  <table className="sp-table">
                    <thead>
                      <tr>
                        <th>Slot</th>
                        <th>30 days</th>
                        <th className="text-end">Views</th>
                        <th className="text-end">Clicks</th>
                        <th className="text-end">Rate</th>
                        <th className="text-end">Collected</th>
                      </tr>
                    </thead>
                    <tbody>
                      {perSlot.map((row) => (
                        <tr key={row.slotId}>
                          <td>
                            <div className="flex items-center gap-2">
                              <span
                                className={`sp-badge ${row.kind === 'bid' ? 'sp-badge-gold' : 'sp-badge-quiet'}`}
                              >
                                {row.kind === 'bid' ? <Trophy /> : <Bookmark />}
                                {row.kind === 'bid' ? 'Bid' : 'Buy'}
                              </span>
                              <span className="font-semibold text-title">{row.name}</span>
                              {!row.active ? (
                                <span className="sp-badge sp-badge-quiet">Paused</span>
                              ) : null}
                            </div>
                            <div className="mt-2 max-w-[10rem]">
                              <Meter value={row.views} max={busiest} />
                            </div>
                          </td>
                          <td>
                            {/* Nothing is drawn for a flat-zero series: a line
                                along the floor implies a measurement. */}
                            <span className="block text-secondary">
                              <Sparkline series={row.series} className="h-7 w-24" />
                            </span>
                          </td>
                          <td className="sp-num text-end font-semibold text-title">
                            {row.views ? row.views.toLocaleString('en-IN') : '—'}
                          </td>
                          <td className="sp-num text-end">
                            {row.clicks ? row.clicks.toLocaleString('en-IN') : '—'}
                          </td>
                          <td className="sp-num text-end">
                            {row.views > 0 ? `${((row.clicks / row.views) * 100).toFixed(1)}%` : '—'}
                          </td>
                          <td className="sp-num text-end font-semibold text-title">
                            {row.paid ? formatPaise(row.paid) : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}
          </section>

          {/* ── Waiting on you ────────────────────────────────────────── */}
          <section className="mt-16">
            <div className="flex flex-wrap items-baseline gap-3">
              <h2 className="sp-h2">Waiting on you</h2>
              {queue.length ? (
                <span className="sp-badge sp-badge-accent sp-num">{queue.length}</span>
              ) : null}
            </div>
            <p className="mt-2 text-small text-secondary">
              Paid, but nothing runs on your sites until you approve it.
            </p>

            {queue.length ? (
              <div className="mt-7 grid gap-4 lg:grid-cols-2">
                {queue.map(({ ad, slot, profile }) => (
                  <div key={ad.id} className="sp-card sp-card-frame p-6">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-small font-semibold text-title">
                          {slot.name}
                        </p>
                        <p className="mt-0.5 truncate text-tiny text-secondary">
                          {profile.brand || profile.name || profile.email}
                        </p>
                      </div>
                      <span className="sp-num shrink-0 text-small font-semibold text-gold">
                        {formatPaise(ad.amountPaise)}
                      </span>
                    </div>

                    <div className="my-5 min-h-[200px]">
                      {/* The real unit — approving a description of an ad is
                          not the same as approving the ad. */}
                      <AdRender ad={toLiveShape(ad)} shape={slot.shape} />
                    </div>

                    {ad.url ? (
                      <p className="mb-4 flex min-w-0 items-center gap-1.5 text-tiny text-secondary">
                        <External className="size-3.5 shrink-0" />
                        {/* noreferrer as well: opening an unreviewed link should
                            not hand that site a referrer from this admin page. */}
                        <a
                          href={ad.url}
                          target="_blank"
                          rel="noopener noreferrer nofollow"
                          className="sp-link truncate font-mono"
                        >
                          {ad.url}
                        </a>
                      </p>
                    ) : null}

                    <ReviewControls adId={ad.id} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-7">
                <Empty
                  icon={<Check className="size-7" />}
                  title="All clear"
                  lead="Nothing is waiting on you."
                />
              </div>
            )}
          </section>

          {/* ── Slots ─────────────────────────────────────────────────── */}
          <section className="mt-16 grid gap-10 lg:grid-cols-12 lg:gap-14">
            <div className="lg:col-span-7">
              <h2 className="sp-h2">Your slots</h2>
              <p className="mt-2 text-small text-secondary">
                Make one, paste the tag, and it starts selling itself.
              </p>

              {slots.length ? (
                <div className="mt-7 flex flex-col gap-4">
                  {slots.map(({ slot, winner, contenders, askPaise }) => (
                    <div key={slot.id} className="sp-card sp-card-frame p-6">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`sp-badge ${slot.kind === 'bid' ? 'sp-badge-gold' : 'sp-badge-quiet'}`}
                            >
                              {slot.kind === 'bid' ? <Trophy /> : <Bookmark />}
                              {slot.kind === 'bid' ? 'Bid' : 'Buy'}
                            </span>
                            <span
                              className={`sp-badge ${slot.active ? 'sp-badge-success' : 'sp-badge-quiet'}`}
                            >
                              {slot.active ? 'Live' : 'Paused'}
                            </span>
                          </div>
                          <p className="sp-h3 mt-3 font-semibold">{slot.name}</p>
                          <p className="mt-1 text-tiny text-secondary">
                            {SHAPES[slot.shape as keyof typeof SHAPES]?.label ?? slot.shape} ·{' '}
                            <span className="sp-num">{formatPaise(askPaise)}</span>
                            {slot.kind === 'bid' ? ' to lead' : ' / month'} · {contenders.length}{' '}
                            in the running
                          </p>
                        </div>
                        <SlotControls slotId={slot.id} active={slot.active} />
                      </div>

                      {winner ? (
                        <p className="mt-4 text-tiny text-secondary">
                          Serving:{' '}
                          <strong className="font-semibold text-title">{winner.brand}</strong>
                        </p>
                      ) : null}

                      <div className="mt-6">
                        <SlotTag slot={slot} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-7">
                  <Empty title="No slots yet" lead="Make your first one on the right." />
                </div>
              )}
            </div>

            <div className="lg:col-span-5">
              <NewSlot />
            </div>
          </section>

          {/* ── Sponsors ──────────────────────────────────────────────── */}
          {sponsors.length ? (
            <section className="mt-16">
              <h2 className="sp-h2">Sponsors</h2>
              <div className="mt-7 overflow-hidden rounded-frame bg-surface-100">
                <div className="overflow-x-auto px-3 py-4 sm:px-5">
                  <table className="sp-table">
                    <thead>
                      <tr>
                        <th>Who</th>
                        <th>Ads</th>
                        <th className="text-end">Paid</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sponsors.map(({ profile, paid, adCount }) => (
                        <tr key={profile.id}>
                          <td>
                            <span className="font-semibold text-title">
                              {profile.brand || profile.name || '—'}
                            </span>
                            <br />
                            <span className="text-tiny text-secondary">{profile.email}</span>
                          </td>
                          <td className="sp-num">{adCount}</td>
                          <td className="sp-num text-end font-semibold text-title">
                            {formatPaise(paid)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          ) : null}
        </Container>
      </main>

      <Footer />
    </>
  );
}

/** The ad row, in the shape `AdRender` reads. */
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
