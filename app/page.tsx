import Link from 'next/link';

import { Footer, Header } from '@/components/chrome';
import { Bay, Band, Head, Rig } from '@/components/rig';
import { AdEmpty, AdRender } from '@/components/ad-render';
import { EmptyBoard, Field, Podium } from '@/components/leaderboard';
import { ActivityFeed } from '@/components/activity';
import { formatPaise } from '@/lib/money';
import { FORMATS, SHAPES, site } from '@/lib/site';
import { recentActivity, slotsWithState, statsOverall } from '@/lib/queries';

/**
 * THE HOMEPAGE — the whole public product, on the grid.
 *
 * Every band is a hairline across the page and a bay of content aligned to the
 * twelve columns behind it. Somebody deciding whether to sponsor should SEE
 * the thing rather than read about it, so the live board is the first thing
 * under the fold and the copy stays out of its way.
 */
export const dynamic = 'force-dynamic';

export default async function Home() {
  const [slots, stats, activity] = await Promise.all([
    slotsWithState(true),
    statsOverall(),
    recentActivity(6)
  ]);

  const bid = slots.filter((s) => s.slot.kind === 'bid');
  const fixed = slots.filter((s) => s.slot.kind === 'fixed');

  return (
    <>
      <Rig />
      <Header />

      <main className="relative z-10">
        {/* ── HERO ──────────────────────────────────────────────────────── */}
        <Bay className="py-20 sm:py-28">
          <div className="grid gap-10 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <p className="label label-accent">{site.ownerLabel} · advertising</p>
              <h1 className="mt-5 text-5xl font-semibold leading-[1.02] tracking-tight sm:text-6xl">
                Get your thing in front of my people.
              </h1>
              <p className="mt-5 max-w-md text-lg text-ink-600">
                Buy a spot outright, or race for the top of a bid slot.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="#board" className="btn btn-primary">
                  See the board
                </Link>
                <Link href="/signup" className="btn btn-quiet">
                  Make an account
                </Link>
              </div>
            </div>

            {/* Real measurements only — a metric with nothing behind it is not
                rendered at all, never a zero dressed up as a number. */}
            <div className="lg:col-span-4 lg:col-start-9">
              <dl className="divide-y divide-ink-200 border-y border-ink-200">
                <Figure label="Slots" value={slots.length} />
                {stats.views > 0 ? (
                  <Figure label="Ad views" value={stats.views.toLocaleString('en-IN')} />
                ) : null}
                {stats.clicks > 0 ? (
                  <Figure label="Clicks" value={stats.clicks.toLocaleString('en-IN')} />
                ) : null}
              </dl>
            </div>
          </div>
        </Bay>

        {/* ── MARQUEE ───────────────────────────────────────────────────── */}
        <div className="band overflow-hidden bg-ink-900 py-2.5">
          <div className="flex w-max animate-marquee gap-10 whitespace-nowrap">
            {[0, 1].map((copy) => (
              <div key={copy} className="flex gap-10" aria-hidden={copy === 1}>
                {['no ad network', 'no tracking', 'no cold emails', 'you pay the creator', 'one tag'].map(
                  (word) => (
                    <span key={word} className="label text-ink-300">
                      {word} <span className="text-signal-500">/</span>
                    </span>
                  )
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── THE RACE ──────────────────────────────────────────────────── */}
        {bid.map(({ slot, winner, contenders, askPaise }) => (
          <Band key={slot.id} id="board" className="py-16">
            <Head
              label="Bid slot · the race"
              title={slot.name}
              lead="Highest bid serves everywhere. Everyone else is right behind it."
              right={
                <Link href={`/slot/${slot.publicId}`} className="btn btn-primary">
                  Take first — {formatPaise(askPaise)}
                </Link>
              }
            />

            {contenders.length ? (
              <>
                <Podium rows={contenders} />
                {contenders.length > 3 ? (
                  <div className="mt-10">
                    <p className="label pb-3">The field</p>
                    <Field rows={contenders} from={3} />
                  </div>
                ) : null}
              </>
            ) : (
              <EmptyBoard ask={askPaise} />
            )}

            {/* What is actually serving, exactly as a reader sees it. */}
            <div className="mt-12 grid gap-6 lg:grid-cols-12">
              <div className="lg:col-span-4">
                <p className="label pb-3">Serving right now</p>
                <div className="min-h-[220px]">
                  {winner ? (
                    <AdRender ad={winner} shape={slot.shape} />
                  ) : (
                    <AdEmpty ask={formatPaise(askPaise)} kind="bid" slug={slot.publicId} />
                  )}
                </div>
              </div>
              <div className="lg:col-span-5 lg:col-start-6">
                <p className="label pb-3">How it works</p>
                <ol className="divide-y divide-ink-200 border-y border-ink-200 text-sm">
                  {[
                    'Write your ad — a card, image, video, or your own HTML.',
                    'Bid whatever you like. Pay more than the leader to take first.',
                    'It serves across the network as soon as it is approved.',
                    'Your rank holds until somebody outbids you.'
                  ].map((line, i) => (
                    <li key={i} className="flex gap-4 py-3">
                      <span className="tnum font-mono text-xs text-ink-400">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span className="text-ink-700">{line}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </Band>
        ))}

        {/* ── FIXED SLOTS ───────────────────────────────────────────────── */}
        <Band id="slots" className="py-16">
          <Head
            label="Fixed slots"
            title="Buy a spot outright"
            lead="A named position on one site, priced per month. No bidding."
          />

          {fixed.length ? (
            <div className="grid grid-cols-1 gap-px border border-ink-200 bg-ink-200 sm:grid-cols-2 lg:grid-cols-3">
              {fixed.map(({ slot, winner, askPaise }) => (
                <Link
                  key={slot.id}
                  href={`/slot/${slot.publicId}`}
                  className="group flex flex-col bg-white p-5 no-underline transition hover:bg-ink-50"
                >
                  <div className="flex items-center justify-between">
                    <span className="label">
                      {SHAPES[slot.shape as keyof typeof SHAPES]?.label ?? slot.shape}
                    </span>
                    <span className={`label ${winner ? '' : 'label-accent'}`}>
                      {winner ? 'Taken' : 'Open'}
                    </span>
                  </div>

                  <p className="mt-4 text-lg font-semibold tracking-tight">{slot.name}</p>
                  {slot.blurb ? (
                    <p className="mt-1 line-clamp-2 text-sm text-ink-600">{slot.blurb}</p>
                  ) : null}

                  <p className="tnum mt-6 text-2xl font-semibold">
                    {formatPaise(askPaise)}
                    <span className="ml-1 text-sm font-normal text-ink-500">/mo</span>
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <div className="panel p-12 text-center">
              <p className="label">Inventory</p>
              <p className="mt-3 text-lg font-semibold">Nothing for sale yet</p>
            </div>
          )}
        </Band>

        {/* ── FORMATS ───────────────────────────────────────────────────── */}
        <Band className="py-16">
          <Head label="Creative" title="An ad can be four things" />
          <div className="grid grid-cols-1 gap-px border border-ink-200 bg-ink-200 sm:grid-cols-2 lg:grid-cols-4">
            {Object.entries(FORMATS).map(([key, f]) => (
              <div key={key} className="bg-white p-5">
                <p className="label">{f.label}</p>
                <p className="mt-3 text-sm text-ink-600">{f.note}</p>
              </div>
            ))}
          </div>
        </Band>

        {/* ── ACTIVITY ──────────────────────────────────────────────────── */}
        <Band className="py-16">
          <div className="grid gap-10 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <Head label="Live" title="What's happening" />
              <ActivityFeed rows={activity} />
            </div>
            <div className="lg:col-span-4 lg:col-start-9">
              <div className="panel p-6">
                <p className="label label-accent">Ready</p>
                <p className="mt-3 text-2xl font-semibold tracking-tight">
                  Put your thing on the board.
                </p>
                <p className="mt-2 text-sm text-ink-600">Takes an email and a password.</p>
                <Link href="/signup" className="btn btn-primary mt-6 w-full">
                  Start now
                </Link>
              </div>
            </div>
          </div>
        </Band>
      </main>

      <Footer />
    </>
  );
}

function Figure({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-baseline justify-between py-3">
      <dt className="label">{label}</dt>
      <dd className="tnum text-2xl font-semibold">{value}</dd>
    </div>
  );
}
