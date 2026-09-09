import { formatPaise } from '@/lib/money';
import type { LiveAd } from '@/lib/queries';

/**
 * THE RACE.
 *
 * Two halves, and they say the same thing twice on purpose:
 *
 *   THE PODIUM — first, second, third, drawn at three physical heights. The
 *   height difference is the whole point: it says "there is a gap, and roughly
 *   this big" before a single figure has been read. Second is on the left and
 *   third on the right, the way a podium actually stands.
 *
 *   THE FIELD — everybody, in order, with a bar whose width is their share of
 *   the leader's. The gap becomes a picture instead of arithmetic.
 *
 * Each entry carries what a reader actually needs to decide whether to click:
 * the brand, its WEBSITE, and a TAG saying what it does. "Linear" means
 * nothing on its own; "linear.app · Issue tracker" means something.
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

/* Podium heights. First is tallest; second and third are deliberately close to
   each other, because the interesting gap is between first and the rest. */
const STEP = [
  {
    h: 'h-40',
    order: 'md:order-2',
    ring: 'border-craft-400 bg-craft-100',
    badge: 'bg-craft-400 text-ink-900',
    numeral: 'text-craft-600',
    medal: '1st'
  },
  {
    h: 'h-28',
    order: 'md:order-1',
    ring: 'border-ink-300 bg-ink-100',
    badge: 'bg-ink-300 text-ink-900',
    numeral: 'text-ink-400',
    medal: '2nd'
  },
  {
    h: 'h-24',
    order: 'md:order-3',
    ring: 'border-ink-200 bg-ink-50',
    badge: 'bg-ink-200 text-ink-700',
    numeral: 'text-ink-300',
    medal: '3rd'
  }
];

export function Podium({ rows }: { rows: LiveAd[] }) {
  if (!rows.length) return null;
  const top = rows.slice(0, 3);

  return (
    <div className="grid grid-cols-1 gap-px border border-ink-200 bg-ink-200 md:grid-cols-3">
      {top.map((row, i) => {
        const step = STEP[i];
        const site = host(row.url);

        return (
          <div
            key={row.id}
            className={`flex flex-col justify-end bg-white p-5 ${step.order}`}
          >
            <div className="flex items-center gap-2">
              <span className={`label px-1.5 py-0.5 text-ink-900 ${step.badge}`}>
                {step.medal}
              </span>
              {row.isHouse ? <span className="label">house</span> : null}
            </div>

            <p className="mt-3 truncate text-xl font-semibold tracking-tight">{row.brand}</p>

            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
              {site ? <span className="font-mono text-xs text-ink-500">{site}</span> : null}
              {row.tag ? <span className="tag text-ink-500">{row.tag}</span> : null}
            </div>

            <p className="tnum mt-4 text-2xl font-semibold">
              {row.isHouse ? '—' : formatPaise(row.amountPaise)}
            </p>

            {/* The step itself, carrying its own numeral. Without the figure
                inside it, a bare tinted rectangle reads as a broken image
                rather than as a place on a podium. Scaled from the bottom, so
                it grows out of the floor instead of dropping in. */}
            <div
              className={`mt-4 flex origin-bottom items-end justify-center border ${step.h} ${step.ring} animate-grow`}
              style={{ animationDelay: `${i * 90}ms` }}
            >
              <span className={`tnum pb-2 text-4xl font-semibold ${step.numeral}`}>
                {i + 1}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Everybody, in order, with the gap drawn to scale. */
export function Field({
  rows,
  mineId,
  from = 0
}: {
  rows: LiveAd[];
  mineId?: string | null;
  from?: number;
}) {
  const shown = rows.slice(from);
  if (!shown.length) return null;

  // The leader sets the scale, even when the list starts further down.
  const top = Math.max(rows[0]?.amountPaise ?? 1, 1);

  return (
    <ol className="border-x border-t border-ink-200">
      {shown.map((row, i) => {
        const rank = from + i + 1;
        const mine = row.profileId === mineId;
        const site = host(row.url);
        const share = Math.max(3, (row.amountPaise / top) * 100);

        return (
          <li
            key={row.id}
            className={`relative flex items-center gap-4 border-b border-ink-200 px-4 py-3 ${
              mine ? 'bg-signal-50' : 'bg-white'
            }`}
          >
            <span
              aria-hidden
              className="absolute inset-y-0 left-0 bg-ink-50"
              style={{ width: `${share}%` }}
            />

            <span className="tnum relative z-10 w-6 shrink-0 font-mono text-sm text-ink-400">
              {rank}
            </span>

            <div className="relative z-10 min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">
                {row.brand}
                {row.isHouse ? <span className="label ml-2">house</span> : null}
              </p>
              <div className="flex flex-wrap items-center gap-x-2">
                {site ? <span className="font-mono text-xs text-ink-500">{site}</span> : null}
                {row.tag ? <span className="text-xs text-ink-400">· {row.tag}</span> : null}
              </div>
            </div>

            <span className="tnum relative z-10 shrink-0 text-sm font-semibold">
              {row.isHouse ? '—' : formatPaise(row.amountPaise)}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

/** Nothing on the board yet. */
export function EmptyBoard({ ask }: { ask?: number }) {
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
