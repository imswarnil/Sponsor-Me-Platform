import { formatPaise } from '@/lib/money';
import type { Activity } from '@/lib/db/schema';

/**
 * WHAT HAS BEEN HAPPENING.
 *
 * Real events only — a row exists because money moved or an ad went live, and
 * there is no filler. An empty feed says so rather than inventing motion.
 *
 * Times are rendered on the server, so they say "3d ago" rather than a
 * live-ticking "2 minutes ago" that would be wrong the moment the page is
 * cached. Anything inside an hour reads as "just now" for the same reason.
 */

const COPY: Record<string, { verb: string; emoji: string }> = {
  paid: { verb: 'paid for', emoji: '💸' },
  live: { verb: 'went live on', emoji: '🚀' },
  outbid: { verb: 'took the top of', emoji: '🏆' }
};

export function ActivityFeed({ rows }: { rows: Activity[] }) {
  if (!rows.length) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-ink-300 bg-white p-8 text-center">
        <p className="text-3xl">🌱</p>
        <p className="mt-2 font-black">Nothing yet</p>
        <p className="text-sm text-ink-600">
          The first thing that happens here will be somebody buying a slot.
        </p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {rows.map((row) => {
        const copy = COPY[row.kind] ?? { verb: row.kind, emoji: '•' };
        return (
          <li key={row.id} className="card-pop flex items-center gap-3 p-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border-2 border-ink-900 bg-ink-50 text-base">
              {copy.emoji}
            </span>

            <p className="min-w-0 flex-1 truncate text-sm">
              <strong className="font-black">{row.actor || 'Someone'}</strong>{' '}
              <span className="text-ink-600">{copy.verb}</span>{' '}
              <strong className="font-bold">{row.slotName || 'a slot'}</strong>
            </p>

            {row.amountPaise ? (
              <span className="tnum shrink-0 text-sm font-black">
                {formatPaise(row.amountPaise)}
              </span>
            ) : null}

            <Ago date={row.createdAt} />
          </li>
        );
      })}
    </ul>
  );
}

function Ago({ date }: { date: Date | string }) {
  const then = new Date(date);
  const hours = Math.floor((Date.now() - then.getTime()) / 3_600_000);

  let label: string;
  if (hours < 1) label = 'just now';
  else if (hours < 24) label = `${hours}h`;
  else if (hours < 24 * 30) label = `${Math.floor(hours / 24)}d`;
  else label = then.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });

  return (
    <time dateTime={then.toISOString()} className="shrink-0 text-xs text-ink-400">
      {label}
    </time>
  );
}
