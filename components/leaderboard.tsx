'use client';

import { useState } from 'react';

import { formatPaise } from '@/lib/money';
import type { LiveAd } from '@/lib/queries';

/**
 * THE BOARD — where a brand promotes itself.
 *
 * Every entry is an ADVERT, not a table row: a logo, the brand, what they do,
 * and a button that goes somewhere. The rank and the amount are context around
 * that, not the subject. A sponsor is paying to be seen, so the entry has to
 * be worth being seen in.
 *
 * TWO VIEWS, and the reader picks:
 *
 *   PODIUM  first, second and third at three physical heights, so the gap is
 *           visible before a figure is read. The showcase view.
 *   LIST    everybody at equal weight, compact, for comparing.
 *
 * RESPONSIVE BY CONTAINER, NOT VIEWPORT. This renders inside an iframe that
 * might be 300px in a sidebar or 900px in an article, and the viewport inside
 * an iframe is the iframe — but the same component also renders on this site's
 * own wide pages. `@container` queries make it respond to the box it is
 * actually in, which is the only thing that is true in both places.
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
 * The brand mark. A supplied logo, or the initial on a tinted tile — never an
 * empty square, which reads as a broken image rather than as "no logo".
 */
function Logo({ ad, size = 'md' }: { ad: LiveAd; size?: 'sm' | 'md' | 'lg' }) {
  const px = size === 'lg' ? 'h-14 w-14' : size === 'sm' ? 'h-9 w-9' : 'h-11 w-11';
  const text = size === 'lg' ? 'text-xl' : size === 'sm' ? 'text-sm' : 'text-base';

  return (
    <span
      className={`${px} relative grid shrink-0 place-items-center overflow-hidden border border-ink-200 bg-ink-50`}
    >
      <span className={`${text} font-semibold text-ink-400`}>
        {(ad.brand || '?').slice(0, 1).toUpperCase()}
      </span>
      {ad.logoUrl ? (
        /* Sits on top of the initial. `onError` REMOVES it rather than leaving
           it transparent: it carries `bg-white`, so a logo that 404s would
           otherwise paint a blank square over the fallback — which is exactly
           what a missing logo looked like before this line existed. */
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={ad.logoUrl}
          alt=""
          loading="lazy"
          decoding="async"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
          className="absolute inset-0 h-full w-full bg-white object-contain p-1"
        />
      ) : null}
    </span>
  );
}

function Rank({ n, big }: { n: number; big?: boolean }) {
  const gold = n === 1;
  return (
    <span
      className={`grid shrink-0 place-items-center border font-semibold tabular-nums ${
        big ? 'h-8 w-8 text-sm' : 'h-6 w-6 text-xs'
      } ${
        gold
          ? 'border-craft-400 bg-craft-100 text-craft-600'
          : n === 2
            ? 'border-ink-300 bg-ink-100 text-ink-600'
            : n === 3
              ? 'border-craft-200 bg-craft-50 text-craft-600'
              : 'border-ink-200 bg-white text-ink-400'
      }`}
    >
      {n}
    </span>
  );
}

/** What they do, with a small mark so it reads as a category not a label. */
function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="tag text-ink-500">
      <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M20.6 13.4 12 4.8H4.8V12l8.6 8.6z" strokeLinejoin="round" />
        <circle cx="8.5" cy="8.5" r="1.2" fill="currentColor" stroke="none" />
      </svg>
      {children}
    </span>
  );
}

function Site({ url }: { url: string | null }) {
  const h = host(url);
  if (!h) return null;
  return (
    <span className="inline-flex items-center gap-1 font-mono text-xs text-ink-500">
      <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3c2.5 2.7 2.5 15.3 0 18M12 3c-2.5 2.7-2.5 15.3 0 18" />
      </svg>
      {h}
    </span>
  );
}

/* ── Podium ───────────────────────────────────────────────────────────────── */

/**
 * Podium steps are sized by the ACTUAL amount, not by three fixed heights.
 *
 * Fixed heights made every board look identical — a runaway leader and three
 * near-equal bids drew exactly the same picture, which is the one thing the
 * podium exists to distinguish. Now the tallest step is the leader and the
 * others are their true fraction of it, so the shape of the race is the shape
 * on screen.
 *
 * `MIN` keeps third place visible when it is a rounding error of first.
 */
const STEP_MAX = 200;
const STEP_MIN = 34;

const STEP = [
  { order: '@2xl:order-2', tint: 'border-craft-400 bg-craft-100', numeral: 'text-craft-500' },
  { order: '@2xl:order-1', tint: 'border-ink-300 bg-ink-100', numeral: 'text-ink-400' },
  { order: '@2xl:order-3', tint: 'border-ink-200 bg-ink-50', numeral: 'text-ink-300' }
];

function Podium({ rows, base }: { rows: LiveAd[]; base: string }) {
  const top = Math.max(rows[0]?.amountPaise ?? 1, 1);

  return (
    <div className="grid grid-cols-1 gap-px bg-ink-200 @2xl:grid-cols-3">
      {rows.slice(0, 3).map((ad, i) => {
        const step = STEP[i];
        const height = Math.max(STEP_MIN, Math.round((ad.amountPaise / top) * STEP_MAX));
        return (
          <div
            key={ad.id}
            className={`flex flex-col justify-between bg-white p-6 @lg:p-7 ${step.order}`}
          >
            <div className="flex items-center gap-3">
              <Rank n={i + 1} big />
              {ad.isHouse ? <span className="label">house</span> : null}
              <span className="tnum ml-auto text-sm font-semibold text-ink-700">
                {ad.isHouse ? '—' : formatPaise(ad.amountPaise)}
              </span>
            </div>

            {/* The logo sits ABOVE the name rather than beside it. Three
                podium columns inside a deliberately narrow board are ~250px
                each, and a side-by-side logo leaves the brand two words wide.
                Stacking makes the column taller and the name legible, which is
                the trade this board wants. */}
            <div className="mt-5">
              <Logo ad={ad} size="lg" />
              <p className="mt-3 truncate text-lg font-semibold tracking-tight @lg:text-xl">
                {ad.brand}
              </p>
              <div className="mt-1.5 flex flex-col items-start gap-1.5">
                <Site url={ad.url} />
                {ad.tag ? <Tag>{ad.tag}</Tag> : null}
              </div>
            </div>

            {ad.headline ? (
              <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-ink-600">
                {ad.headline}
              </p>
            ) : null}

            <a
              href={clickHref(ad, base)}
              target="_blank"
              rel="nofollow sponsored noopener"
              className={`btn mt-5 w-full no-underline ${i === 0 ? 'btn-primary' : 'btn-quiet'}`}
            >
              {ad.ctaLabel || 'Visit'}
            </a>

            {/* The step. Its height IS the amount — see the note on STEP_MAX.
                The three are bottom-aligned by the grid, so the difference
                reads as a podium rather than as three unrelated blocks. */}
            <div
              className={`mt-6 flex origin-bottom items-end justify-center border ${step.tint} animate-grow`}
              style={{ height, animationDelay: `${i * 90}ms` }}
            >
              <span className={`tnum pb-2 text-4xl font-semibold ${step.numeral}`}>{i + 1}</span>
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
    <li
      className={`relative border-b border-ink-200 ${mine ? 'bg-signal-50' : 'bg-white'}`}
    >
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 bg-ink-50"
        style={{ width: `${share}%` }}
      />

      {/* Generous padding so a row is a place to look, not a table cell. */}
      <div className="relative z-10 flex items-center gap-4 px-5 py-5 @lg:gap-5 @lg:px-7 @lg:py-6">
        <Rank n={rank} />
        <Logo ad={ad} />

        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">
            {ad.brand}
            {ad.isHouse ? <span className="label ml-2">house</span> : null}
          </p>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1">
            <Site url={ad.url} />
            {ad.tag ? <Tag>{ad.tag}</Tag> : null}
          </div>
        </div>

        {/* The amount hides first when the box is narrow: in a 300px sidebar
            the brand and the button are what matter, not the ledger. */}
        <span className="tnum hidden shrink-0 text-sm font-semibold @md:block">
          {ad.isHouse ? '—' : formatPaise(ad.amountPaise)}
        </span>

        <a
          href={clickHref(ad, base)}
          target="_blank"
          rel="nofollow sponsored noopener"
          className="btn btn-quiet btn-sm hidden shrink-0 no-underline @sm:inline-flex"
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

  if (!rows.length) {
    return (
      <div className="panel p-10 text-center">
        <p className="label">The board is open</p>
        <p className="mt-3 text-lg font-semibold">Nobody is racing yet</p>
        {ask ? (
          <p className="mt-1 text-sm text-ink-600">
            First bid takes first place — from{' '}
            <strong className="text-ink-900">{formatPaise(ask)}</strong>.
          </p>
        ) : null}
      </div>
    );
  }

  const top = Math.max(rows[0].amountPaise, 1);
  const rest = view === 'podium' ? rows.slice(3) : rows;

  return (
    /* `@container` is what makes this work in a 300px sidebar and on a wide
       page from the same markup — every size step below is `@`-prefixed, so it
       reads the box it is in rather than the viewport. */
    <div className="@container mx-auto w-full max-w-3xl">
      {showToggle ? (
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="label">
            {rows.length} {rows.length === 1 ? 'sponsor' : 'sponsors'}
          </p>
          <div className="flex border border-ink-200" role="group" aria-label="Board view">
            {(['podium', 'list'] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                aria-pressed={view === v}
                className={`label px-3 py-1.5 transition ${
                  view === v ? 'bg-ink-900 text-white' : 'bg-white hover:bg-ink-50'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="border border-ink-200">
        {view === 'podium' ? <Podium rows={rows} base={base} /> : null}

        {rest.length ? (
          <ul className={view === 'podium' ? 'border-t border-ink-200' : ''}>
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
    </div>
  );
}
