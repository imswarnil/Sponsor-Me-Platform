'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

import { Meter } from '@/components/charts';
import { ArrowRight, Trophy } from '@/components/icons';
import { formatPaise } from '@/lib/money';
import type { LiveAd } from '@/lib/queries';

/**
 * "WHAT WOULD IT TAKE?" — the question every sponsor has, answered before
 * they make an account.
 *
 * Type an amount and it says where that amount lands on the real board, who
 * it passes, and what is still above it. Nobody should have to sign up,
 * write a creative and reach a checkout to find out they are ₹500 short.
 *
 * THIS IS A PREVIEW AND SAYS SO. The server recomputes the ask from the slot
 * row and the live board inside the same call that creates the checkout, so
 * what is shown here can go stale the moment somebody else bids — which is
 * exactly why it is labelled rather than treated as a quote.
 *
 * THE TIE RULE IS THE SAME ONE THE DATABASE USES: `amount DESC, first_paid_at
 * ASC`. An equal bid does NOT take the position — the incumbent got there
 * first — so matching the leader exactly leaves you second, and this says so
 * instead of flattering the number.
 */
export function BidSimulator({
  rows,
  slug,
  floorPaise,
  stepPaise,
  askPaise
}: {
  rows: LiveAd[];
  slug: string;
  floorPaise: number;
  stepPaise: number;
  askPaise: number;
}) {
  const [rupees, setRupees] = useState(Math.ceil(askPaise / 100));
  const mine = Math.max(0, Math.round(rupees)) * 100;

  /* House ads are not competition: they are unsold inventory wearing the
     creator's own project, and `contendersFor()` already sorts them below
     every paying ad. */
  const paying = useMemo(() => rows.filter((r) => !r.isHouse), [rows]);

  const leader = paying[0] ?? null;
  /* `>=` and not `>`: an equal amount loses the tie to whoever paid first. */
  const ahead = paying.filter((r) => r.amountPaise >= mine);
  const rank = ahead.length + 1;
  const passed = paying.length - ahead.length;
  const above = ahead[ahead.length - 1] ?? null;
  const below = paying[ahead.length] ?? null;

  const toLead = leader ? Math.max(0, leader.amountPaise + stepPaise - mine) : 0;
  const first = rank === 1;
  const ceiling = Math.max(leader?.amountPaise ?? 0, mine, 1);

  const presets = [
    { label: 'Floor', value: Math.ceil(floorPaise / 100) },
    { label: 'Take first', value: Math.ceil(askPaise / 100) },
    { label: 'Comfortable', value: Math.ceil((askPaise * 2) / 100) }
  ];

  return (
    <div className="sp-panel overflow-hidden">
      <div className="p-6 sm:p-8">
        <p className="sp-eyebrow sp-eyebrow-accent">Try it</p>
        <p className="sp-h3 mt-3 font-semibold">What would it take?</p>
        <p className="mt-2 text-small text-secondary">
          Put in an amount. This is the real board, so this is where you would land.
        </p>

        <label className="sp-flabel mt-7" htmlFor="sim-amount">
          Your bid
        </label>
        <div className="sp-money">
          <span className="text-2xl font-normal text-mute">₹</span>
          <input
            id="sim-amount"
            type="number"
            inputMode="numeric"
            min={0}
            step={100}
            value={rupees}
            onChange={(e) => setRupees(Number(e.target.value) || 0)}
              /* A mouse wheel over a focused number input silently
                 rewrites it in Chrome, and this one is an amount of money.
                 Blurring on wheel keeps the page scrolling and the figure
                 still — the arrows and the keyboard still work. */
              onWheel={(e) => e.currentTarget.blur()}
          />
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {presets.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => setRupees(p.value)}
              aria-pressed={rupees === p.value}
              className="sp-btn sp-btn-soft sp-btn-sm"
            >
              {p.label}
              <span className="sp-num text-mute">₹{p.value.toLocaleString('en-IN')}</span>
            </button>
          ))}
        </div>
      </div>

      {/* THE ANSWER. Its own plane, because it is the output of the control
          above rather than more of the control. */}
      <div className={`border-t border-line p-6 sm:p-8 ${first ? 'bg-gold-soft' : 'bg-surface-100'}`}>
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <div className="flex items-center gap-3">
            {first ? <Trophy className="size-6 text-gold" /> : null}
            <p className={`sp-num text-3xl font-semibold ${first ? 'text-gold' : 'text-title'}`}>
              #{rank}
            </p>
            {/* Everybody paying, PLUS you: the viewer is not on the board
                yet, so the field they would join is one larger than it is
                now. House ads are not in it — they are unsold inventory, not
                competition. */}
            <p className="text-small text-secondary">of {paying.length + 1}</p>
          </div>

          {first ? (
            <span className="sp-badge sp-badge-gold">
              <Trophy />
              You would be serving
            </span>
          ) : (
            <span className="sp-badge">
              <span className="sp-num">+{formatPaise(toLead)}</span> to lead
            </span>
          )}
        </div>

        <div className="mt-5">
          <Meter value={mine} max={ceiling} tone={first ? 'sp-track-fill-gold' : ''} />
          <p className="mt-2 flex items-center justify-between text-tiny text-secondary">
            <span>
              Your bid:{' '}
              <span className="sp-num font-semibold text-title">{formatPaise(mine)}</span>
            </span>
            {leader ? (
              <span>
                Leader:{' '}
                <span className="sp-num font-semibold text-title">
                  {formatPaise(leader.amountPaise)}
                </span>
              </span>
            ) : null}
          </p>
        </div>

        {/* The neighbours, so a rank is a place among named brands rather than
            an abstract number. */}
        {above || below ? (
          <ul className="sp-rows mt-6">
            {above ? <Neighbour ad={above} position={rank - 1} /> : null}
            <li className="flex items-center gap-3 py-3">
              <span
                className={`sp-num grid size-6 shrink-0 place-items-center rounded-full text-tiny font-semibold ${
                  first ? 'bg-gold-fill text-plain-black' : 'bg-accent text-accent-fg'
                }`}
              >
                {rank}
              </span>
              <span className="flex-1 text-small font-semibold text-title">You</span>
              <span className="sp-num text-small font-semibold text-title">
                {formatPaise(mine)}
              </span>
            </li>
            {below ? <Neighbour ad={below} position={rank + 1} /> : null}
          </ul>
        ) : null}

        {passed > 0 && !first ? (
          <p className="mt-4 text-tiny text-secondary">
            That passes {passed} {passed === 1 ? 'sponsor' : 'sponsors'} already on the board.
          </p>
        ) : null}

        {mine < floorPaise ? (
          <p className="sp-callout sp-callout-error mt-5">
            Below the floor — the smallest bid this slot accepts is{' '}
            <strong className="font-semibold">{formatPaise(floorPaise)}</strong>.
          </p>
        ) : null}

        <Link href={`/slot/${slug}`} className="sp-btn sp-btn-block sp-btn-lg mt-6">
          {first ? 'Take first place' : `Bid ${formatPaise(mine)}`}
          <ArrowRight />
        </Link>

        <p className="sp-hint">
          A preview, not a quote: a bid is a lifetime total, and the server prices yours
          against the live board when you check out.
        </p>
      </div>
    </div>
  );
}

function Neighbour({ ad, position }: { ad: LiveAd; position: number }) {
  return (
    <li className="flex items-center gap-3 py-3 opacity-70">
      <span className="sp-num grid size-6 shrink-0 place-items-center rounded-full bg-surface-200 text-tiny font-semibold text-secondary">
        {position}
      </span>
      <span className="min-w-0 flex-1 truncate text-small text-body">{ad.brand}</span>
      <span className="sp-num shrink-0 text-small text-secondary">
        {formatPaise(ad.amountPaise)}
      </span>
    </li>
  );
}
