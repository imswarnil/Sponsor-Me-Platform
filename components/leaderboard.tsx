'use client';

import { useState } from 'react';

import { External, Globe, TagIcon, Trophy } from '@/components/icons';
import { formatPaise } from '@/lib/money';
import type { LiveAd } from '@/lib/queries';

/**
 * THE BOARD — where a brand promotes itself.
 *
 * Every entry is an ADVERT, not a table row: a mark, the brand, what they do,
 * and a button that goes somewhere. Rank and amount are context around that,
 * not the subject. A sponsor is paying to be seen, so the entry has to be
 * worth being seen in.
 *
 * TWO VIEWS, and the reader picks:
 *
 *   PODIUM  first, second and third at three real heights, so the gap is
 *           visible before a figure has been read. The showcase.
 *   LIST    everybody at equal weight, compact, for comparing.
 *
 * RESPONSIVE BY CONTAINER, NOT VIEWPORT. This renders inside an iframe that
 * might be 300px in a sidebar or 900px in an article, and inside an iframe the
 * viewport IS the iframe — but the same component also renders on this site's
 * own wide pages. Every size step below is `@`-prefixed so it reads the box it
 * is actually in, which is the only thing true in both places.
 *
 * COLOUR MEANS A THING. Gold is rank one, here and nowhere else. Second and
 * third are tone steps on the neutral ladder, not two more hues.
 */

/** The site, without the noise. `linear.app`, not `https://linear.app/`. */
function host(url: string | null): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}

function clickHref(ad: LiveAd, base: string) {
  return `${base}/api/go?ad=${encodeURIComponent(ad.id)}`;
}

/* ── Pieces ───────────────────────────────────────────────────────────────── */

/**
 * The brand mark: a circle. A supplied logo, or the initial on a tinted disc —
 * never an empty square, which reads as a broken image rather than "no logo".
 */
function Mark({ ad, size = '' }: { ad: LiveAd; size?: 'sp-mark-sm' | 'sp-mark-lg' | '' }) {
  return (
    <span className={`sp-mark ${size}`}>
      <span>{(ad.brand || '?').slice(0, 1)}</span>
      {ad.logoUrl ? (
        /* Sits on top of the initial. `onError` REMOVES it rather than leaving
           it transparent: it carries a white backing, so a logo that 404s
           would otherwise paint a blank disc over the fallback — which is
           exactly what a missing logo looked like before this line existed. */
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={ad.logoUrl}
          alt=""
          loading="lazy"
          decoding="async"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
      ) : null}
    </span>
  );
}

/** The rank disc. One is gold; the rest are steps on the neutral ladder. */
function Rank({ n }: { n: number }) {
  return (
    <span
      className={`sp-num grid size-6 shrink-0 place-items-center rounded-full text-tiny font-semibold ${
        n === 1
          ? 'bg-gold-soft text-gold'
          : n === 2
            ? 'bg-surface-300 text-title'
            : 'bg-surface-200 text-secondary'
      }`}
    >
      {n}
    </span>
  );
}

/** What they do, so a reader can tell what a name IS before clicking it. */
function Category({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-tiny text-secondary">
      <TagIcon className="size-3.5 shrink-0" />
      <span className="truncate">{children}</span>
    </span>
  );
}

function Site({ url }: { url: string | null }) {
  const h = host(url);
  if (!h) return null;
  return (
    <span className="inline-flex items-center gap-1.5 text-tiny text-secondary">
      <Globe className="size-3.5 shrink-0" />
      <span className="truncate font-mono">{h}</span>
    </span>
  );
}

/* ── Podium ───────────────────────────────────────────────────────────────── */

/**
 * Podium bars are sized by the ACTUAL amount, not by three fixed heights.
 *
 * Fixed heights made every board draw the same picture — a runaway leader and
 * three near-equal bids looked identical, which is the one thing a podium
 * exists to tell apart. The tallest bar is the leader and the others are their
 * true fraction of it, so the shape of the race is the shape on screen.
 *
 * `MIN` keeps third place visible when it is a rounding error of first.
 */
const STEP_MAX = 176;
const STEP_MIN = 38;

/**
 * The bar is FILLED, and only first place is gold.
 *
 * A pale tint with a grey numeral read as an empty placeholder rather than a
 * result — the eye had nothing to land on. A solid bar with its own figure
 * inside it is a chart; an outlined box with a number floating in it is a box.
 *
 * `order` puts second on the left and first in the middle, the way a podium
 * actually stands — but only once there is room for three abreast.
 *
 * The three fills are gold, `mute` and `background-300` — a descending ladder
 * with real gaps in it. Two adjacent background steps looked like one colour
 * and a mistake: third place's bar was a step off the card it sat on, so the
 * only thing distinguishing second from third was the numeral. `ink` is
 * `text-title` on both neutral bars rather than a fixed black or white,
 * because those bars invert with the theme and a fixed ink would go
 * unreadable in one of them.
 */
const STEP = [
  { order: '@2xl:order-2', card: 'bg-gold-soft', bar: 'bg-gold-fill', ink: 'text-plain-black' },
  { order: '@2xl:order-1', card: 'bg-surface-100', bar: 'bg-mute', ink: 'text-title' },
  { order: '@2xl:order-3', card: 'bg-surface-100', bar: 'bg-surface-300', ink: 'text-title' }
];

function Podium({ rows, base }: { rows: LiveAd[]; base: string }) {
  const top = Math.max(rows[0]?.amountPaise ?? 1, 1);

  return (
    <div className="grid grid-cols-1 gap-3 @2xl:grid-cols-3">
      {rows.slice(0, 3).map((ad, i) => {
        const step = STEP[i];
        const height = Math.max(STEP_MIN, Math.round((ad.amountPaise / top) * STEP_MAX));
        const share = Math.round((ad.amountPaise / top) * 100);

        return (
          <div
            key={ad.id}
            className={`flex flex-col overflow-hidden rounded-panel ${step.card} ${step.order}`}
          >
            <div className="flex flex-col p-5 @lg:p-6">
              <div className="flex items-center gap-2">
                {i === 0 ? (
                  <span className="sp-badge sp-badge-gold">
                    <Trophy />
                    First
                  </span>
                ) : (
                  <Rank n={i + 1} />
                )}
                {ad.isHouse ? <span className="sp-badge sp-badge-quiet">House</span> : null}
                <span className="sp-num ml-auto text-small font-semibold text-title">
                  {ad.isHouse ? '—' : formatPaise(ad.amountPaise)}
                </span>
              </div>

              {/* The mark sits ABOVE the name rather than beside it. Three
                  podium columns inside a deliberately narrow board are ~250px
                  each, and a side-by-side mark leaves the brand two words
                  wide. Stacking makes the column taller and the name legible,
                  which is the trade this board wants. */}
              <div className="mt-5">
                <Mark ad={ad} size="sp-mark-lg" />
                <p className="sp-h3 mt-4 truncate font-semibold">{ad.brand}</p>
                <div className="mt-2 flex flex-col items-start gap-1.5">
                  <Site url={ad.url} />
                  {ad.tag ? <Category>{ad.tag}</Category> : null}
                </div>
              </div>

              {ad.headline ? (
                <p className="mt-4 line-clamp-3 text-small leading-relaxed text-secondary">
                  {ad.headline}
                </p>
              ) : null}

              <a
                href={clickHref(ad, base)}
                target="_blank"
                rel="nofollow sponsored noopener"
                className={`sp-btn sp-btn-block mt-6 ${i === 0 ? '' : 'sp-btn-outline'}`}
              >
                {ad.ctaLabel || 'Visit'}
                <External />
              </a>
            </div>

            {/* THE BAR. Height is the amount; the fill is solid so it reads as
                a measured quantity rather than an empty frame. Every card is a
                stretched grid item and the bar is its last child, so all three
                bars sit on one floor — that shared baseline is what makes this
                a podium instead of three unrelated blocks.

                The share is printed inside, because "62% of the leader" is the
                fact a bidder is actually looking for. */}
            <div className="mt-auto flex flex-col justify-end px-5 @lg:px-6">
              <div
                className={`sp-num flex origin-bottom animate-grow flex-col items-center justify-end gap-0.5 rounded-t-media ${step.bar}`}
                style={{ height, animationDelay: `${i * 90}ms` }}
              >
                <span className={`text-3xl font-semibold leading-none ${step.ink}`}>{i + 1}</span>
                <span className={`pb-2 font-mono text-[10px] ${step.ink} opacity-70`}>
                  {share}%
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Rows ─────────────────────────────────────────────────────────────────── */

function Row({
  ad,
  rank,
  top,
  mine,
  base
}: {
  ad: LiveAd;
  rank: number;
  top: number;
  mine: boolean;
  base: string;
}) {
  const share = Math.max(3, (ad.amountPaise / top) * 100);

  return (
    <li className={`relative overflow-hidden ${mine ? 'bg-accent-soft' : ''}`}>
      {/* The gap as a picture rather than as arithmetic: the width of this is
          the row's share of the leader's total.

          `surface-200` and not `surface-100`: the board renders on a tinted
          section too, and a bar the same tone as the plane behind the page
          inverts the reading — the FILLED part disappears and the empty part
          looks like a white block sitting in the row. */}
      <span
        aria-hidden
        className={`absolute inset-y-0 left-0 ${mine ? 'bg-accent/15' : 'bg-surface-200'}`}
        style={{ width: `${share}%` }}
      />

      {/* Generous padding, so a row is a place to look and not a table cell. */}
      <div className="relative z-10 flex items-center gap-3.5 px-4 py-4 @lg:gap-5 @lg:px-6 @lg:py-5">
        <Rank n={rank} />
        <Mark ad={ad} />

        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 truncate font-semibold text-title">
            <span className="truncate">{ad.brand}</span>
            {ad.isHouse ? <span className="sp-badge sp-badge-quiet">House</span> : null}
          </p>
          <div className="mt-1 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
            <Site url={ad.url} />
            {ad.tag ? <Category>{ad.tag}</Category> : null}
          </div>
        </div>

        {/* The amount hides first when the box is narrow: in a 300px sidebar
            the brand and the button are what matter, not the ledger. */}
        <span className="sp-num hidden shrink-0 text-small font-semibold text-title @md:block">
          {ad.isHouse ? '—' : formatPaise(ad.amountPaise)}
        </span>

        <a
          href={clickHref(ad, base)}
          target="_blank"
          rel="nofollow sponsored noopener"
          className="sp-btn sp-btn-soft sp-btn-sm hidden shrink-0 @sm:inline-flex"
        >
          {ad.ctaLabel || 'Visit'}
        </a>
      </div>
    </li>
  );
}

/* ── The board ────────────────────────────────────────────────────────────── */

export function Board({
  rows,
  mineId,
  base = '',
  view: initial = 'podium',
  showToggle = true,
  ask
}: {
  rows: LiveAd[];
  mineId?: string | null;
  base?: string;
  view?: 'podium' | 'list';
  showToggle?: boolean;
  ask?: number;
}) {
  const [view, setView] = useState<'podium' | 'list'>(initial);

  /* Nothing invented. An empty board says it is empty and says what it costs
     to be the first thing on it, which is how the first sponsor arrives. */
  if (!rows.length) {
    return (
      <div className="sp-card sp-card-frame flex flex-col items-center gap-2 px-6 py-14 text-center">
        <Trophy className="size-7 text-mute" />
        <p className="sp-h4 mt-1 font-semibold">Nobody is racing yet</p>
        {ask ? (
          <p className="max-w-xs text-small text-secondary">
            The first bid takes first place — from{' '}
            <strong className="font-semibold text-title">{formatPaise(ask)}</strong>.
          </p>
        ) : null}
      </div>
    );
  }

  const top = Math.max(rows[0].amountPaise, 1);
  const rest = view === 'podium' ? rows.slice(3) : rows;

  return (
    <div className="@container w-full">
      {showToggle ? (
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="text-small text-secondary">
            <span className="sp-num font-semibold text-title">{rows.length}</span>{' '}
            {rows.length === 1 ? 'sponsor' : 'sponsors'}
          </p>
          <div className="sp-seg" role="group" aria-label="Board view">
            {(['podium', 'list'] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                aria-pressed={view === v}
                className="sp-seg-item capitalize"
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {view === 'podium' ? <Podium rows={rows} base={base} /> : null}

      {rest.length ? (
        <ul
          className={`sp-rows overflow-hidden rounded-panel bg-surface ${
            view === 'podium' ? 'mt-3 sp-outline' : 'sp-outline'
          }`}
        >
          {rest.map((ad, i) => (
            <Row
              key={ad.id}
              ad={ad}
              rank={view === 'podium' ? i + 4 : i + 1}
              top={top}
              mine={ad.profileId === mineId}
              base={base}
            />
          ))}
        </ul>
      ) : null}
    </div>
  );
}
