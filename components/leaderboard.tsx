import { formatPaise } from '@/lib/money';
import type { LiveAd } from '@/lib/queries';

/**
 * THE LEADERBOARD — a ranked list, not a grid.
 *
 * A grid says "here are some things, all equally". A leaderboard says "these
 * are in an ORDER, and the order is the point". So this is one column of rows,
 * top to bottom, and three devices carry the ranking:
 *
 *   1. A medal. Gold, silver, bronze — literal, because everybody already
 *      knows how to read one, and the whole page is trying to feel like a
 *      game rather than a spreadsheet.
 *   2. Size. First place is physically bigger than second, second than third.
 *   3. A bar. Each row's fill is its share of the leader's amount, so the GAP
 *      is a picture instead of arithmetic the reader has to do.
 */

const MEDALS = [
  // Gold: the brand's own craft hue. Only rank one ever gets it.
  { ring: 'bg-craft-300 border-ink-900', emoji: '🥇', label: 'Leading' },
  { ring: 'bg-ink-200 border-ink-900', emoji: '🥈', label: '2nd' },
  { ring: 'bg-craft-100 border-ink-900', emoji: '🥉', label: '3rd' }
];

export function Leaderboard({
  rows,
  mineId,
  askPaise
}: {
  rows: LiveAd[];
  mineId?: string | null;
  askPaise?: number;
}) {
  if (!rows.length) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-ink-300 bg-white p-10 text-center">
        <p className="text-4xl">🏆</p>
        <p className="mt-3 text-lg font-black">Nobody has bid yet</p>
        <p className="text-sm text-ink-600">
          {askPaise ? (
            <>
              First bid takes the crown — from{' '}
              <strong className="text-ink-900">{formatPaise(askPaise)}</strong>.
            </>
          ) : (
            'First bid takes the crown.'
          )}
        </p>
      </div>
    );
  }

  const top = Math.max(rows[0].amountPaise, 1);

  return (
    <ol className="flex flex-col gap-2">
      {rows.map((row, i) => {
        const medal = MEDALS[i];
        const mine = row.profileId === mineId;
        const share = Math.max(6, (row.amountPaise / top) * 100);

        return (
          <li
            key={row.id}
            className={[
              'relative flex items-center gap-3 overflow-hidden rounded-2xl border-2 border-ink-900 bg-white',
              i === 0 ? 'p-4 shadow-[5px_5px_0_0_var(--color-ink-900)]' : 'p-3',
              i === 1 ? 'shadow-[3px_3px_0_0_var(--color-ink-900)]' : '',
              i > 1 ? 'shadow-[2px_2px_0_0_var(--color-ink-900)]' : '',
              mine ? 'ring-4 ring-signal-200' : ''
            ].join(' ')}
          >
            {/* The gap, drawn. Behind everything, and quiet enough that it is
                never louder than the text on top of it. */}
            <span
              aria-hidden
              className={`absolute inset-y-0 left-0 ${i === 0 ? 'bg-craft-100' : 'bg-ink-50'}`}
              style={{ width: `${share}%` }}
            />

            <span
              className={[
                'relative z-10 grid shrink-0 place-items-center rounded-xl border-2 font-black',
                i === 0 ? 'h-12 w-12 text-2xl' : 'h-9 w-9 text-lg',
                medal ? medal.ring : 'border-ink-300 bg-white text-sm text-ink-500'
              ].join(' ')}
            >
              {medal ? medal.emoji : i + 1}
            </span>

            <div className="relative z-10 min-w-0 flex-1">
              <p
                className={`truncate font-black leading-tight ${i === 0 ? 'text-lg' : 'text-sm'}`}
              >
                {row.brand}
                {row.isHouse ? (
                  <span className="ml-2 align-middle text-[10px] font-bold uppercase tracking-wide text-mint-600">
                    our own
                  </span>
                ) : null}
              </p>
              <p className="truncate text-xs text-ink-600">{row.headline}</p>
            </div>

            <div className="relative z-10 shrink-0 text-right">
              <p className={`tnum font-black ${i === 0 ? 'text-xl' : 'text-sm'}`}>
                {row.isHouse ? '—' : formatPaise(row.amountPaise)}
              </p>
              {mine ? (
                <p className="text-[10px] font-bold uppercase tracking-wide text-signal-600">
                  You
                </p>
              ) : i === 0 ? (
                <p className="text-[10px] font-bold uppercase tracking-wide text-craft-600">
                  Serving
                </p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
