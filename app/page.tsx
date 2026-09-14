import Link from 'next/link';

import { Footer, Header } from '@/components/chrome';
import { Container, Empty, Section, SectionHead, Stat } from '@/components/layout';
import { AdEmpty, AdRender } from '@/components/ad-render';
import { Analytics, EmptyAnalytics } from '@/components/analytics';
import { BidSimulator } from '@/components/bid-simulator';
import { Board } from '@/components/leaderboard';
import { ActivityFeed } from '@/components/activity';
import { Faq } from '@/components/faq';
import { HeroShowcase } from '@/components/hero-showcase';
import { Reveal } from '@/components/reveal';
import {
  ArrowRight,
  Ban,
  Bookmark,
  Check,
  Cursor,
  Eye,
  Sparkles,
  Trophy
} from '@/components/icons';
import { formatPaise } from '@/lib/money';
import { FORMATS, SHAPES, site } from '@/lib/site';
import { dailyOverall, recentActivity, slotsWithState, statsOverall } from '@/lib/queries';

/**
 * THE HOMEPAGE — the whole pitch, stacked, in the order a sponsor asks it.
 *
 *   1  what is this           the unit, in the fold, at its real size
 *   2  which kind do I want   fixed against bid, side by side
 *   3  what would it cost     the live board, and a simulator on it
 *   4  what else is for sale  the fixed slots
 *   5  how does it work       four steps, each one shown
 *   6  what will I see        the real analytics panel
 *   7  what are the rules     included / never, then the FAQ
 *   8  is anyone doing it     the activity feed, and the sign-up
 *
 * NOTHING ON THIS PAGE IS INVENTED. Every figure comes out of the database and
 * every section that has no data says so instead of drawing a zero: the board
 * says the board is empty, the analytics panel says nothing has been counted.
 * A homepage that fakes an audience to look busy is selling something that
 * does not exist.
 */
export const dynamic = 'force-dynamic';

export default async function Home() {
  const [slots, stats, activity, daily] = await Promise.all([
    slotsWithState(true),
    statsOverall(),
    recentActivity(7),
    dailyOverall(30)
  ]);

  const bid = slots.filter((s) => s.slot.kind === 'bid');
  const fixed = slots.filter((s) => s.slot.kind === 'fixed');

  /* The unit shown in the fold: whatever is genuinely serving. A bid slot
     first, because its winner is the most-contested spot on the network. */
  const featured = bid.find((s) => s.winner) ?? fixed.find((s) => s.winner) ?? bid[0] ?? fixed[0];

  return (
    <>
      <Header />

      <main>
        {/* ── 1 · HERO ──────────────────────────────────────────────────── */}
        <div className="relative overflow-hidden">
          {/* The page's centre of gravity: rings from a point, a soft accent
              bloom over them, both dissolving downward so the section ends
              without an edge. */}
          <div className="sp-backdrop" aria-hidden>
            <div className="sp-rings sp-fade-b absolute inset-0 opacity-70" />
            <div className="sp-glow absolute inset-0" />
          </div>

          <Container wide className="sp-fore pb-16 pt-14 sm:pb-24 sm:pt-20">
            <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-14">
              <div className="lg:col-span-6">
                <p className="sp-eyebrow sp-eyebrow-accent">{site.ownerLabel} · advertising</p>
                <h1 className="sp-display mt-5 max-w-[17ch]">
                  Get your thing in front of my people.
                </h1>
                <p className="sp-lead mt-6 max-w-md">
                  Buy a spot outright, or race for the top of a bid slot. One tag, and it
                  serves everywhere I publish.
                </p>

                <div className="mt-9 flex flex-wrap items-center gap-3">
                  <Link href="#board" className="sp-btn sp-btn-lg">
                    See the board
                    <ArrowRight />
                  </Link>
                  <Link href="/signup" className="sp-btn sp-btn-outline sp-btn-lg">
                    Make an account
                  </Link>
                </div>

                {/* Real measurements only. A figure with nothing behind it is
                    not rendered at all — never a zero dressed as a number. */}
                <ul className="mt-10 flex flex-wrap items-baseline gap-x-8 gap-y-3 text-small">
                  <Inline label={slots.length === 1 ? 'slot' : 'slots'} value={slots.length} />
                  {stats.views > 0 ? (
                    <Inline label="ad views" value={stats.views.toLocaleString('en-IN')} />
                  ) : null}
                  {stats.clicks > 0 ? (
                    <Inline label="clicks" value={stats.clicks.toLocaleString('en-IN')} />
                  ) : null}
                </ul>
              </div>

              {/* The product, in the fold, at the sizes it really ships in. */}
              {featured ? (
                <div className="lg:col-span-6">
                  <HeroShowcase
                    ad={featured.winner}
                    slotShape={featured.slot.shape}
                    slotName={featured.slot.name}
                    slug={featured.slot.publicId}
                    ask={formatPaise(featured.askPaise)}
                  />
                </div>
              ) : null}
            </div>
          </Container>
        </div>

        {/* ── TICKER ────────────────────────────────────────────────────── */}
        <div className="sp-marquee py-3">
          <div className="sp-fade-x flex w-max animate-marquee gap-10 whitespace-nowrap">
            {[0, 1].map((copy) => (
              <div key={copy} className="flex gap-10" aria-hidden={copy === 1}>
                {[
                  'no ad network',
                  'no tracking',
                  'no cold emails',
                  'you pay the creator',
                  'one tag',
                  'every ad reviewed'
                ].map((word) => (
                  <span key={word} className="text-small font-medium">
                    {word} <span className="text-accent">/</span>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* ── 2 · THE TWO KINDS ─────────────────────────────────────────── */}
        <Section wide id="kinds" rule={false} pattern="dots">
          <SectionHead
            eyebrow="Two ways to buy"
            title="Pay once for a month, or race for the top"
            lead="This is the only decision that changes anything. Everything after it — the formats, the tag, the review, the counting — is identical."
          />

          <div className="grid gap-4 lg:grid-cols-2">
            <Reveal className="h-full">
              <Kind
                icon={<Bookmark className="size-5" />}
                name="Fixed"
                claim="One price. It is yours."
                points={[
                  'You pay per month, up front. Nobody can outbid you.',
                  'The slot is off the market for your whole term.',
                  'Longer terms are cheaper — 3 months saves 10%, 6 saves 20%.'
                ]}
                foot={
                  fixed.length
                    ? `${fixed.length} fixed ${fixed.length === 1 ? 'slot' : 'slots'} for sale`
                    : 'No fixed slots for sale right now'
                }
                href="#slots"
                cta="See the fixed slots"
              />
            </Reveal>

            <Reveal className="h-full" delay={90}>
              <Kind
                gold
                icon={<Trophy className="size-5" />}
                name="Bid"
                claim="Highest bid serves. Everyone else waits."
                points={[
                  'Your bid is a lifetime total — paying again adds to it, and that is how you climb.',
                  'Every bidder stays visible on the public board, not just the winner.',
                  'Nobody is refunded for being overtaken. That is what makes the board mean something.'
                ]}
                foot={
                  bid[0]
                    ? `First place costs ${formatPaise(bid[0].askPaise)} right now`
                    : 'No bid slot open right now'
                }
                href="#board"
                cta="See the race"
              />
            </Reveal>
          </div>
        </Section>

        {/* ── 3 · THE RACE ──────────────────────────────────────────────── */}
        {bid.map(({ slot, contenders, askPaise }) => (
          <Section wide key={slot.id} id="board">
            <SectionHead
              accent
              eyebrow="Bid slot · the race"
              title={slot.name}
              lead="Everybody's bid is public. The top one serves on every site in the network; the rest are right behind it, waiting to overtake."
              action={
                <Link href={`/slot/${slot.publicId}`} className="sp-btn">
                  Take first — {formatPaise(askPaise)}
                </Link>
              }
            />

            <div className="grid gap-10 lg:grid-cols-12 lg:gap-8">
              {/* Eight columns, not seven: at 1280px that is ~800px, which is
                  what the podium's own container query needs before it will
                  lay three cards abreast. Below that it stacks — correct, but
                  a stacked podium is a list with extra steps. */}
              <div className="lg:col-span-8">
                <Board rows={contenders} ask={askPaise} />
              </div>

              {/* The board answers "who is winning". This answers "what would
                  it take", which is the question a sponsor actually has. */}
              <div className="lg:col-span-4">
                <BidSimulator
                  rows={contenders}
                  slug={slot.publicId}
                  floorPaise={slot.pricePaise}
                  stepPaise={slot.stepPaise}
                  askPaise={askPaise}
                />
              </div>
            </div>
          </Section>
        ))}

        {/* ── 4 · FIXED SLOTS ───────────────────────────────────────────── */}
        <Section wide id="slots">
          <SectionHead
            eyebrow="Fixed slots"
            title="Buy a spot outright"
            lead="A named position, priced per month. No bidding, no overtaking."
          />

          {fixed.length ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {fixed.map(({ slot, winner, askPaise }, i) => (
                <Reveal key={slot.id} delay={i * 70} className="h-full">
                  <Link
                    href={`/slot/${slot.publicId}`}
                    className="sp-card sp-lift relative flex h-full flex-col overflow-hidden p-6"
                  >
                    {!winner ? (
                      <div className="sp-backdrop sp-stripes sp-fade-t opacity-60" aria-hidden />
                    ) : null}

                    <div className="sp-fore flex flex-1 flex-col">
                      <div className="flex items-center justify-between gap-2">
                        <span className="sp-badge sp-badge-quiet">
                          <Bookmark />
                          {SHAPES[slot.shape as keyof typeof SHAPES]?.label ?? slot.shape}
                        </span>
                        <span className={`sp-badge ${winner ? '' : 'sp-badge-accent'}`}>
                          {winner ? 'Taken' : 'Open'}
                        </span>
                      </div>

                      <p className="sp-h3 mt-6 font-semibold">{slot.name}</p>
                      {slot.blurb ? (
                        <p className="mt-2 line-clamp-2 text-small text-secondary">
                          {slot.blurb}
                        </p>
                      ) : null}

                      <p className="sp-num mt-auto pt-8 text-3xl font-semibold text-title">
                        {formatPaise(askPaise)}
                        <span className="ml-1.5 text-small font-normal text-secondary">/mo</span>
                      </p>
                    </div>
                  </Link>
                </Reveal>
              ))}
            </div>
          ) : (
            <Empty
              icon={<Bookmark className="size-7" />}
              title="Nothing for sale yet"
              lead="Fixed slots will show up here the moment there are any."
            />
          )}
        </Section>

        {/* ── 5 · HOW IT WORKS ──────────────────────────────────────────── */}
        <Section wide id="how" pattern="dots">
          <SectionHead
            eyebrow="How it works"
            title="Four steps, and what each one produces"
            lead="Every step below is followed by the thing it actually makes."
          />

          <ol className="grid gap-4 sm:grid-cols-2">
            {[
              {
                n: '01',
                t: 'Pick a slot',
                d: 'A bid slot you race for, or a fixed one you buy outright for a month.',
                show: (
                  <div className="flex flex-wrap gap-2">
                    <span className="sp-badge sp-badge-gold">
                      <Trophy />
                      Bid · race for first
                    </span>
                    <span className="sp-badge sp-badge-quiet">
                      <Bookmark />
                      Fixed · one price
                    </span>
                  </div>
                )
              },
              {
                n: '02',
                t: 'Write the ad',
                d: 'Four formats, and you write it before you pay — so you can see exactly what you are buying.',
                show: (
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(FORMATS).map(([k, f]) => (
                      <span key={k} className="sp-badge sp-badge-quiet">
                        {f.label}
                      </span>
                    ))}
                  </div>
                )
              },
              {
                n: '03',
                t: 'Pay, and get approved',
                d: 'Nothing runs on money alone — every creative is reviewed before it serves, and you are told why if it is refused.',
                show: (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="sp-badge sp-badge-quiet">draft</span>
                    <ArrowRight className="size-4 text-mute" />
                    <span className="sp-badge sp-badge-gold">paid</span>
                    <ArrowRight className="size-4 text-mute" />
                    <span className="sp-badge sp-badge-success">live</span>
                  </div>
                )
              },
              {
                n: '04',
                t: 'It serves, and you watch it',
                d: 'One tag, on every page it sits on. Views and clicks counted per day — nothing about the reader stored.',
                show: (
                  <code className="sp-code">
                    &lt;script src=&quot;…/sponsor.js&quot; data-slot=&quot;top-spot&quot;&gt;
                  </code>
                )
              }
            ].map((step, i) => (
              <li key={step.n}>
                <Reveal delay={i * 70}>
                  <div className="sp-card flex h-full flex-col gap-4 p-6 sm:flex-row sm:gap-6">
                    <span className="sp-ordinal shrink-0" aria-hidden>
                      {step.n}
                    </span>
                    <div>
                      <p className="sp-h3 font-semibold">{step.t}</p>
                      <p className="mt-2.5 max-w-md text-small leading-relaxed text-secondary">
                        {step.d}
                      </p>
                      {/* The step, shown rather than only described. */}
                      <div className="mt-5">{step.show}</div>
                    </div>
                  </div>
                </Reveal>
              </li>
            ))}
          </ol>
        </Section>

        {/* ── 6 · WHAT YOU SEE ──────────────────────────────────────────── */}
        <Section wide id="numbers">
          <SectionHead
            eyebrow="What you see"
            title="Small numbers, and all of them true"
            lead="This is the real panel, with the real platform figures in it — the same chart you get for your own ad. No modelled reach, no estimated impressions."
          />

          {stats.views > 0 ? (
            <div className="grid gap-4 lg:grid-cols-12">
              <div className="lg:col-span-8">
                <Analytics
                  series={daily}
                  title="Everything serving on the network"
                  lead="Every ad, every slot, by day."
                />
              </div>
              <div className="grid content-start gap-4 lg:col-span-4">
                <Stat value={stats.views.toLocaleString('en-IN')} label="views counted" />
                <Stat value={stats.clicks.toLocaleString('en-IN')} label="clicks counted" />
                <Stat
                  gold
                  value={`${((stats.clicks / stats.views) * 100).toFixed(1)}%`}
                  label="click rate"
                />
                <div className="sp-callout">
                  A view is one render of your unit. A click is one hop through the
                  redirect. There is no third number, because there is no third thing
                  being measured.
                </div>
              </div>
            </div>
          ) : (
            <EmptyAnalytics
              lead="Nothing has served yet, so there is nothing to chart. The first ad on the network starts this the day it goes live — and until then this says so rather than drawing an empty graph."
            />
          )}
        </Section>

        {/* ── 7 · THE DEAL ──────────────────────────────────────────────── */}
        <Section wide className="sp-plane" rule={false}>
          <SectionHead
            eyebrow="The deal"
            title="What you get, and what I will not do"
            lead="The second list is the more useful one."
          />

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="sp-panel p-7 sm:p-9">
              <p className="sp-badge sp-badge-success">
                <Check />
                Included
              </p>
              <ul className="sp-rows mt-6">
                {[
                  ['A labelled ad unit on every page the tag sits on', <Eye key="i" />],
                  ['Views and clicks per day, for your ad alone', <Cursor key="i" />],
                  ['Your own HTML, sandboxed — styles yes, scripts no', <Sparkles key="i" />],
                  ['A public position on the board, whether or not you are first', <Trophy key="i" />],
                  ['Your creative reviewed by a person before it serves', <Check key="i" />]
                ].map(([text, icon]) => (
                  <li key={String(text)} className="flex items-start gap-3 py-3.5">
                    <span className="mt-0.5 shrink-0 text-success [&>svg]:size-4">{icon}</span>
                    <span className="text-small text-body">{text}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="sp-panel p-7 sm:p-9">
              <p className="sp-badge sp-badge-error">
                <Ban />
                Never
              </p>
              <ul className="sp-rows mt-6">
                {[
                  'No cookies, IP logging, user agents or visitor ids — for you or for the reader.',
                  'No ad network, no resale, no third-party scripts on the page.',
                  'No estimated reach, modelled impressions or rounded-up numbers.',
                  'No refund for being overtaken on a bid slot — said here, not at a checkout.',
                  'No ad served on money alone: approval is a person, every time.'
                ].map((text) => (
                  <li key={text} className="flex items-start gap-3 py-3.5">
                    <Ban className="mt-0.5 size-4 shrink-0 text-error" />
                    <span className="text-small text-body">{text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Section>

        {/* ── 7b · FAQ ──────────────────────────────────────────────────── */}
        <Section wide id="faq">
          <SectionHead
            eyebrow="Questions"
            title="The rules, in full"
            lead="Including the ones that are not in my favour."
          />
          <Faq />
        </Section>

        {/* ── 8 · ACTIVITY & SIGN-UP ────────────────────────────────────── */}
        <Section wide className="sp-plane" rule={false}>
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-7">
              <SectionHead
                eyebrow="Live"
                title="What's happening"
                lead="Real events only — a row here exists because money moved or an ad went live."
              />
              <ActivityFeed rows={activity} />
            </div>

            <div className="lg:col-span-5">
              <div className="sp-panel relative overflow-hidden p-7 sm:p-9">
                <div className="sp-backdrop sp-glow-gold" aria-hidden />
                <div className="sp-fore">
                  <p className="sp-eyebrow sp-eyebrow-accent">Ready</p>
                  <p className="sp-h2 mt-4">Put your thing on the board.</p>
                  <p className="mt-3 text-small text-secondary">
                    Takes an email and a password. You write the ad before you pay for it, and
                    you can see it at full size first.
                  </p>
                  <Link href="/signup" className="sp-btn sp-btn-block sp-btn-lg mt-7">
                    Start now
                    <ArrowRight />
                  </Link>
                  <Link
                    href="/signin"
                    className="mt-4 block text-center text-small text-secondary transition-colors hover:text-title"
                  >
                    I already have an account
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </Section>
      </main>

      <Footer />
    </>
  );
}

/** A figure on one line, for the hero. */
function Inline({ label, value }: { label: string; value: string | number }) {
  return (
    <li className="flex items-baseline gap-2">
      <span className="sp-num text-lg font-semibold text-title">{value}</span>
      <span className="text-secondary">{label}</span>
    </li>
  );
}

/** One of the two kinds of slot, explained as a whole proposition. */
function Kind({
  icon,
  name,
  claim,
  points,
  foot,
  href,
  cta,
  gold = false
}: {
  icon: React.ReactNode;
  name: string;
  claim: string;
  points: string[];
  foot: string;
  href: string;
  cta: string;
  gold?: boolean;
}) {
  return (
    <div
      className={`relative flex h-full flex-col overflow-hidden rounded-frame p-7 sm:p-9 ${
        gold ? 'bg-gold-soft' : 'bg-surface-100'
      }`}
    >
      {gold ? <div className="sp-backdrop sp-glow-gold" aria-hidden /> : null}

      <div className="sp-fore flex flex-1 flex-col">
        <div className="flex items-center gap-3">
          <span
            className={`grid size-10 place-items-center rounded-full ${
              gold ? 'bg-gold-fill text-plain-black' : 'bg-surface-300 text-title'
            }`}
          >
            {icon}
          </span>
          <span className={`sp-h3 font-semibold ${gold ? 'text-gold' : ''}`}>{name}</span>
        </div>

        <p className="sp-h2 mt-6 max-w-[22ch]">{claim}</p>

        <ul className="mt-7 flex flex-col gap-3.5">
          {points.map((p) => (
            <li key={p} className="flex items-start gap-3">
              <Check
                className={`mt-0.5 size-4 shrink-0 ${gold ? 'text-gold' : 'text-secondary'}`}
              />
              <span className="text-small leading-relaxed text-body">{p}</span>
            </li>
          ))}
        </ul>

        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-8">
          <p className="sp-num text-tiny text-secondary">{foot}</p>
          <Link
            href={href}
            className={`sp-btn sp-btn-sm ${gold ? '' : 'sp-btn-outline'}`}
          >
            {cta}
            <ArrowRight />
          </Link>
        </div>
      </div>
    </div>
  );
}
