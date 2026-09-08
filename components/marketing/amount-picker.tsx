'use client';

import * as React from 'react';
import { formatAmount } from '@/lib/money';
import { cn } from '@/lib/utils';

/**
 * Choose a monthly amount, and see where it lands you.
 *
 * Presets arrive with the spot each one would take — computed on the server
 * against the real wall (member-queries.ts `rankForAmount`), so "Spot #3" is
 * a fact about right now, not a promise. A custom amount cannot know its spot
 * without a round trip; it gets the one fact that matters instead: what beats
 * the top. Everything the form submits goes through the single hidden input,
 * so the server action only ever reads one field.
 *
 * Used by /members/join (from the floor) and /sponsor/membership (from one
 * above what you already pay).
 */
export function AmountPicker({
  presets,
  min,
  max,
  topAmount,
  defaultAmount,
  name = 'amount'
}: {
  presets: { amount: number; rank: number }[];
  min: number;
  max: number;
  /** The current top of the wall, or 0 when nobody is on it. */
  topAmount: number;
  defaultAmount: number;
  name?: string;
}) {
  const [amount, setAmount] = React.useState(defaultAmount);
  const [custom, setCustom] = React.useState(false);

  const belowMin = amount < min;
  const hint = belowMin
    ? `The minimum is ${formatAmount(min)}.`
    : amount > topAmount
      ? 'That takes the top spot.'
      : topAmount > 0
        ? `Anything above ${formatAmount(topAmount)} takes the top spot.`
        : 'The top spot is open.';

  return (
    <div>
      <input type="hidden" name={name} value={amount} />

      <div className="grid gap-2 sm:grid-cols-3">
        {presets.map((p) => {
          const selected = !custom && amount === p.amount;
          return (
            <button
              key={p.amount}
              type="button"
              aria-pressed={selected}
              onClick={() => {
                setCustom(false);
                setAmount(p.amount);
              }}
              className={cn(
                'rounded-card border p-4 text-left transition-colors',
                selected
                  ? 'border-pop bg-pop-soft'
                  : 'border-border bg-surface hover:border-line-strong'
              )}
            >
              <p className="font-display text-xl font-bold tabular-nums tracking-tight">
                {formatAmount(p.amount)}
              </p>
              <p
                className={cn(
                  'mt-1 font-label text-2xs uppercase tracking-slate',
                  p.rank === 1 ? 'text-signal' : 'text-subtle'
                )}
              >
                {p.rank === 1 ? 'Top spot' : `Spot #${p.rank}`}
              </p>
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
        <label htmlFor={`${name}-custom`} className="text-sm text-muted-foreground">
          Or any amount
        </label>
        <span
          className={cn(
            'flex items-center gap-1 rounded-control border bg-surface px-3',
            custom ? 'border-pop' : 'border-border'
          )}
        >
          <span className="text-sm text-faint">₹</span>
          <input
            id={`${name}-custom`}
            type="number"
            min={min}
            max={max}
            step={100}
            inputMode="numeric"
            placeholder={String(min)}
            value={custom ? amount : ''}
            onChange={(e) => {
              setCustom(true);
              const v = Number(e.target.value);
              setAmount(Number.isFinite(v) ? v : min);
            }}
            className="w-28 bg-transparent py-2 text-sm tabular-nums outline-none"
          />
        </span>
        <p className={cn('text-xs', belowMin ? 'text-destructive' : 'text-muted-foreground')}>
          {hint}
        </p>
      </div>
    </div>
  );
}
