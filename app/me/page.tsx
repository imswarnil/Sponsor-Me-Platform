import Link from 'next/link';

import { Footer, Header } from '@/components/chrome';
import { AdRender } from '@/components/ad-render';
import { SignOut } from '@/components/sign-out';
import { formatPaise } from '@/lib/money';
import { requireSponsor } from '@/lib/roles';
import { myAds, myPayments, standingFor, statsForAd, statsForProfile } from '@/lib/queries';

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
  const [{ paid }, rows, totals, payments] = await Promise.all([
    searchParams,
    myAds(viewer.id),
    statsForProfile(viewer.id),
    myPayments(viewer.id)
  ]);

  const detailed = await Promise.all(
    rows.map(async ({ ad, slot }) => ({
      ad,
      slot,
      standing: ad.status === 'live' ? await standingFor(ad.id) : null,
      stats: await statsForAd(ad.id)
    }))
  );

  return (
    <>
      <Header />

      <main className="min-h-[60vh] bg-iris-50 px-4 py-12">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <span className="sticker -rotate-1 bg-iris-300">Your stuff</span>
              <h1 className="mt-3 text-4xl font-black tracking-tight">
                {viewer.brand || viewer.name || 'My ads'}
              </h1>
              <p className="text-sm text-ink-600">{viewer.email}</p>
            </div>
            <SignOut />
          </div>

          {/*
            A payment redirect proves nothing. The ad goes live when the signed
            webhook lands — usually seconds later, but not guaranteed to have
            happened by the time this page renders. So this says what is true.
          */}
          {paid ? (
            <div className="card-pop mt-6 bg-mint-100 p-5">
              <p className="font-black">Checkout finished 🎉</p>
              <p className="text-sm text-ink-700">
                The payment is being confirmed. Your ad updates the moment it lands — reload in a
                few seconds.
              </p>
            </div>
          ) : null}

          {/* Only real measurements. */}
          {totals.views > 0 ? (
            <div className="mt-6 flex flex-wrap gap-3">
              <Chip value={totals.views.toLocaleString('en-IN')} label="views" tone="bg-white" />
              <Chip value={totals.clicks.toLocaleString('en-IN')} label="clicks" tone="bg-white" />
              {totals.views > 0 ? (
                <Chip
                  value={`${((totals.clicks / totals.views) * 100).toFixed(1)}%`}
                  label="click rate"
                  tone="bg-craft-100"
                />
              ) : null}
            </div>
          ) : null}

          {detailed.length ? (
            <div className="mt-10 flex flex-col gap-6">
              {detailed.map(({ ad, slot, standing, stats }) => (
                <div key={ad.id} className="card-pop card-pop-lg p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`sticker text-[10px] ${
                            slot.kind === 'bid' ? 'bg-craft-300' : 'bg-teal-300'
                          }`}
                        >
                          {slot.kind === 'bid' ? '🏆 Bid' : '✨ Bought'}
                        </span>
                        <StatusPill status={ad.status} />
                      </div>
                      <p className="mt-2 text-xl font-black">{slot.name}</p>
                    </div>

                    <Link href={`/slot/${slot.publicId}`} className="btn-pop bg-white text-sm">
                      {slot.kind === 'bid' ? 'Bid more' : 'Manage'}
                    </Link>
                  </div>

                  {ad.reviewNote && ad.status === 'rejected' ? (
                    <p className="mt-4 rounded-xl border-2 border-signal-500 bg-signal-50 p-3 text-sm">
                      <strong>Not approved:</strong> {ad.reviewNote}
                    </p>
                  ) : null}

                  <div className="mt-5 grid gap-5 md:grid-cols-[1fr_1.2fr]">
                    <div>
                      <p className="mb-2 text-xs font-black uppercase tracking-wide text-ink-500">
                        How it looks
                      </p>
                      <div style={{ minHeight: 200 }}>
                        <AdRender
                          ad={{
                            id: ad.id,
                            slotId: ad.slotId,
                            profileId: ad.profileId,
                            rank: 1,
                            format: ad.format,
                            brand: ad.brand,
                            headline: ad.headline,
                            body: ad.body,
                            url: ad.url,
                            imageUrl: ad.imageUrl,
                            videoUrl: ad.videoUrl,
                            ctaLabel: ad.ctaLabel,
                            html: ad.html,
                            amountPaise: ad.amountPaise,
                            isHouse: ad.isHouse
                          }}
                          shape={slot.shape}
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-3">
                      <Row label="Paid, in total" value={formatPaise(ad.amountPaise)} />
                      {standing ? (
                        <>
                          <Row
                            label="Position"
                            value={`#${standing.rank} of ${standing.total}`}
                            accent={standing.rank === 1}
                          />
                          {standing.toLead > 0 ? (
                            <Row
                              label="To take the top"
                              value={`+ ${formatPaise(standing.toLead)}`}
                            />
                          ) : null}
                        </>
                      ) : null}
                      {ad.endsAt ? (
                        <Row
                          label="Runs until"
                          value={new Date(ad.endsAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        />
                      ) : null}

                      {stats.views > 0 ? (
                        <>
                          <Row label="Views" value={stats.views.toLocaleString('en-IN')} />
                          <Row label="Clicks" value={stats.clicks.toLocaleString('en-IN')} />
                        </>
                      ) : (
                        <p className="text-sm text-ink-500">
                          No views counted yet — numbers appear the first time it is shown.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card-pop mt-10 p-12 text-center">
              <p className="text-5xl">🪄</p>
              <p className="mt-3 text-2xl font-black">No ads yet</p>
              <p className="text-ink-600">Pick a slot and write one.</p>
              <Link href="/#slots" className="btn-pop mt-6 bg-signal-500 text-white">
                Browse slots →
              </Link>
            </div>
          )}

          {payments.length ? (
            <div className="card-pop mt-8 p-6">
              <p className="text-lg font-black">Payments</p>
              <ul className="mt-3 flex flex-col divide-y-2 divide-dashed divide-ink-100">
                {payments.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                    <span className="text-ink-600">
                      {new Date(p.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short'
                      })}
                    </span>
                    <span
                      className={`sticker text-[10px] ${
                        p.status === 'paid'
                          ? 'bg-mint-200'
                          : p.status === 'failed'
                            ? 'bg-signal-200'
                            : 'bg-ink-100'
                      }`}
                    >
                      {p.status}
                    </span>
                    <span className="tnum font-black">{formatPaise(p.amountPaise)}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </main>

      <Footer />
    </>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b-2 border-dashed border-ink-100 pb-2">
      <span className="text-sm text-ink-600">{label}</span>
      <span className={`tnum font-black ${accent ? 'text-craft-600' : ''}`}>{value}</span>
    </div>
  );
}

function Chip({ value, label, tone }: { value: string; label: string; tone: string }) {
  return (
    <div className={`card-pop px-4 py-2 ${tone}`}>
      <p className="tnum text-xl font-black leading-none">{value}</p>
      <p className="text-[11px] font-bold uppercase tracking-wide text-ink-500">{label}</p>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const tone =
    status === 'live'
      ? 'bg-mint-200'
      : status === 'pending'
        ? 'bg-craft-200'
        : status === 'rejected'
          ? 'bg-signal-200'
          : 'bg-ink-100';
  const label =
    status === 'live'
      ? 'Live'
      : status === 'pending'
        ? 'In review'
        : status === 'rejected'
          ? 'Rejected'
          : 'Draft';
  return <span className={`sticker text-[10px] ${tone}`}>{label}</span>;
}
