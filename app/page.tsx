import Link from 'next/link';

import { Footer, Header } from '@/components/chrome';
import { AdEmpty, AdRender } from '@/components/ad-render';
import { Leaderboard } from '@/components/leaderboard';
import { formatPaise } from '@/lib/money';
import { FORMATS, SHAPES, site } from '@/lib/site';
import { slotsWithState, statsOverall } from '@/lib/queries';

/**
 * THE HOMEPAGE — the whole public product, in sections.
 *
 * Each section is one idea with one colour and as few words as it can survive
 * on. Somebody deciding whether to sponsor needs to SEE the thing, not read
 * about it, so the live slots are the hero rather than a paragraph explaining
 * that live slots exist.
 */
export const dynamic = 'force-dynamic';

export default async function Home() {
  const [slots, stats] = await Promise.all([slotsWithState(true), statsOverall()]);

  const bidSlots = slots.filter((s) => s.slot.kind === 'bid');
  const fixedSlots = slots.filter((s) => s.slot.kind === 'fixed');

  return (
    <>
      <Header />

      {/* ═══ HERO ═══════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden border-b-2 border-ink-900 bg-signal-50">
        {/* Floating confetti. Decorative and hidden from assistive tech. */}
        <span
          aria-hidden
          className="absolute left-[8%] top-16 hidden h-16 w-16 rotate-12 rounded-2xl border-2 border-ink-900 bg-teal-400 opacity-80 animate-float md:block"
        />
        <span
          aria-hidden
          className="absolute right-[10%] top-24 hidden h-12 w-12 -rotate-12 rounded-full border-2 border-ink-900 bg-iris-400 opacity-80 animate-float md:block"
          style={{ animationDelay: '1.2s' }}
        />
        <span
          aria-hidden
          className="absolute bottom-10 left-[18%] hidden h-10 w-10 rotate-45 rounded-lg border-2 border-ink-900 bg-craft-400 opacity-80 animate-float lg:block"
          style={{ animationDelay: '2.4s' }}
        />

        <div className="relative mx-auto max-w-4xl px-4 py-20 text-center sm:py-28">
          <span className="sticker -rotate-2 bg-craft-300">One tag. That&rsquo;s it.</span>

          <h1 className="mt-6 text-5xl font-black leading-[0.95] tracking-tight sm:text-7xl">
            Get your thing
            <br />
            in front of{' '}
            <span className="relative inline-block">
              <span className="relative z-10">my people</span>
              <span
                aria-hidden
                className="absolute inset-x-0 bottom-1 z-0 h-4 -rotate-1 bg-signal-300"
              />
            </span>
          </h1>

          <p className="mx-auto mt-5 max-w-md text-lg text-ink-700">
            Buy a spot outright, or fight for the top of a bid slot.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="#slots" className="btn-pop bg-signal-500 text-white">
              See what&rsquo;s open →
            </Link>
            <Link href="/signup" className="btn-pop bg-white">
              Make an account
            </Link>
          </div>

          {/* Only real measurements. A metric with nothing behind it is not
              rendered at all — never a zero dressed up as a number. */}
          {stats.views > 0 || slots.length > 0 ? (
            <div className="mt-12 flex flex-wrap justify-center gap-3">
              {slots.length > 0 ? (
                <Figure value={slots.length} label="slots" tone="bg-teal-100" />
              ) : null}
              {stats.views > 0 ? (
                <Figure
                  value={stats.views.toLocaleString('en-IN')}
                  label="ad views"
                  tone="bg-iris-100"
                />
              ) : null}
              {stats.clicks > 0 ? (
                <Figure
                  value={stats.clicks.toLocaleString('en-IN')}
                  label="clicks"
                  tone="bg-mint-100"
                />
              ) : null}
            </div>
          ) : null}
        </div>
      </section>

      {/* ═══ MARQUEE ════════════════════════════════════════════════════ */}
      <div className="overflow-hidden border-b-2 border-ink-900 bg-ink-900 py-3">
        <div className="flex w-max animate-marquee gap-8 whitespace-nowrap">
          {[0, 1].map((copy) => (
            <div key={copy} className="flex gap-8" aria-hidden={copy === 1}>
              {['no ad network', 'no tracking', 'no cold emails', 'you pay the creator', 'paste one tag'].map(
                (word) => (
                  <span
                    key={word}
                    className="text-sm font-black uppercase tracking-widest text-ink-0"
                  >
                    {word} <span className="text-signal-500">✦</span>
                  </span>
                )
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ═══ THE BID SLOTS ══════════════════════════════════════════════ */}
      {bidSlots.length ? (
        <section className="border-b-2 border-ink-900 bg-craft-50 px-4 py-16">
          <div className="mx-auto max-w-6xl">
            <SectionHead
              sticker="🏆 The fun one"
              stickerTone="bg-craft-300"
              title="Bid slots"
              lead="Highest bid serves. Everyone else is right there, waiting for you to slip."
            />

            <div className="mt-10 flex flex-col gap-12">
              {bidSlots.map(({ slot, winner, contenders, askPaise }) => (
                <div key={slot.id} className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
                  {/* What is serving right now */}
                  <div>
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <p className="text-sm font-black uppercase tracking-wide">
                        {slot.name}
                      </p>
                      <span className="sticker rotate-1 bg-white text-[10px]">
                        {SHAPES[slot.shape as keyof typeof SHAPES]?.label ?? slot.shape}
                      </span>
                    </div>

                    <div className="h-[260px]">
                      {winner ? (
                        <AdRender ad={winner} shape={slot.shape} />
                      ) : (
                        <AdEmpty
                          ask={formatPaise(askPaise)}
                          kind="bid"
                          slug={slot.publicId}
                        />
                      )}
                    </div>

                    <Link
                      href={`/slot/${slot.publicId}`}
                      className="btn-pop mt-4 w-full bg-craft-400"
                    >
                      Take the crown — {formatPaise(askPaise)}
                    </Link>
                  </div>

                  {/* The queue behind it */}
                  <div>
                    <p className="mb-3 text-sm font-black uppercase tracking-wide text-ink-600">
                      In the running ({contenders.length})
                    </p>
                    <Leaderboard rows={contenders} askPaise={askPaise} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* ═══ THE FIXED SLOTS ════════════════════════════════════════════ */}
      <section id="slots" className="border-b-2 border-ink-900 bg-teal-50 px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <SectionHead
            sticker="✨ Just buy it"
            stickerTone="bg-teal-300"
            title="Open slots"
            lead="Pick one, write the ad, pay. It goes up as soon as I approve it."
          />

          {fixedSlots.length ? (
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {fixedSlots.map(({ slot, winner, askPaise }) => (
                <Link
                  key={slot.id}
                  href={`/slot/${slot.publicId}`}
                  className="card-pop card-lift flex flex-col gap-3 p-5 no-underline"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-lg font-black leading-tight">{slot.name}</p>
                    <span
                      className={`sticker shrink-0 text-[10px] ${
                        winner ? 'bg-ink-200' : 'bg-mint-300'
                      }`}
                    >
                      {winner ? 'Taken' : 'Open'}
                    </span>
                  </div>

                  {slot.blurb ? (
                    <p className="line-clamp-2 text-sm text-ink-600">{slot.blurb}</p>
                  ) : null}

                  <div className="mt-auto flex items-end justify-between gap-2 border-t-2 border-dashed border-ink-200 pt-3">
                    <span>
                      <span className="tnum block text-2xl font-black">
                        {formatPaise(askPaise)}
                      </span>
                      <span className="text-xs text-ink-500">per month</span>
                    </span>
                    <span className="text-xs font-bold text-ink-500">
                      {SHAPES[slot.shape as keyof typeof SHAPES]?.label ?? slot.shape}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="mt-10 rounded-2xl border-2 border-dashed border-ink-300 bg-white p-12 text-center">
              <p className="text-4xl">🪧</p>
              <p className="mt-3 text-lg font-black">No slots yet</p>
              <p className="text-sm text-ink-600">{site.creator} hasn&rsquo;t opened any.</p>
            </div>
          )}
        </div>
      </section>

      {/* ═══ FORMATS ════════════════════════════════════════════════════ */}
      <section className="border-b-2 border-ink-900 bg-iris-50 px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <SectionHead
            sticker="🎨 Your call"
            stickerTone="bg-iris-300"
            title="Ads can be anything"
            lead="Same slot, four ways to fill it."
          />

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Object.entries(FORMATS).map(([key, f], i) => (
              <div
                key={key}
                className="card-pop p-5"
                style={{ transform: `rotate(${(i % 2 ? 1 : -1) * 0.8}deg)` }}
              >
                <p className="text-3xl">{f.emoji}</p>
                <p className="mt-2 text-lg font-black">{f.label}</p>
                <p className="text-sm text-ink-600">{f.note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ HOW ════════════════════════════════════════════════════════ */}
      <section className="border-b-2 border-ink-900 bg-mint-50 px-4 py-16">
        <div className="mx-auto max-w-4xl">
          <SectionHead sticker="⚡ Quick" stickerTone="bg-mint-300" title="Three steps" />

          <ol className="mt-10 grid gap-4 sm:grid-cols-3">
            {[
              { n: '1', t: 'Pick a slot', d: 'Buy it, or bid on it.' },
              { n: '2', t: 'Write the ad', d: 'Card, image, video or your own HTML.' },
              { n: '3', t: 'It serves', d: 'Live across the network once approved.' }
            ].map((step) => (
              <li key={step.n} className="card-pop p-5">
                <span className="grid h-10 w-10 place-items-center rounded-full border-2 border-ink-900 bg-signal-500 text-lg font-black text-white">
                  {step.n}
                </span>
                <p className="mt-3 text-lg font-black">{step.t}</p>
                <p className="text-sm text-ink-600">{step.d}</p>
              </li>
            ))}
          </ol>

          <div className="card-pop card-pop-lg mt-12 bg-ink-900 p-8 text-center">
            <p className="text-3xl font-black text-white sm:text-4xl">Ready?</p>
            <p className="mt-2 text-ink-300">Takes an email and a password.</p>
            <Link href="/signup" className="btn-pop mt-6 bg-signal-500 text-white">
              Start now →
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}

function SectionHead({
  sticker,
  stickerTone,
  title,
  lead
}: {
  sticker: string;
  stickerTone: string;
  title: string;
  lead?: string;
}) {
  return (
    <div className="max-w-xl">
      <span className={`sticker -rotate-1 ${stickerTone}`}>{sticker}</span>
      <h2 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">{title}</h2>
      {lead ? <p className="mt-2 text-lg text-ink-700">{lead}</p> : null}
    </div>
  );
}

function Figure({
  value,
  label,
  tone
}: {
  value: string | number;
  label: string;
  tone: string;
}) {
  return (
    <div className={`card-pop px-5 py-3 ${tone}`}>
      <p className="tnum text-2xl font-black leading-none">{value}</p>
      <p className="text-xs font-bold uppercase tracking-wide text-ink-600">{label}</p>
    </div>
  );
}
