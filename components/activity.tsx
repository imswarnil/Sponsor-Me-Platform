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

const COPY: Record<string, { verb: string; short: string }> = {
  paid: { verb: 'paid for', short: 'paid' },
  live: { verb: 'went live on', short: 'live' },
  outbid: { verb: 'took the top of', short: 'outbid' }
};

export function ActivityFeed({ rows }: { rows: Activity[] }) {
  if (!rows.length) {
    return (
      <div className="border border-dashed border-ink-300 p-8 text-center">
        <p className="label">Feed</p>
        <p className="mt-2 font-semibold">Nothing yet</p>
        <p className="text-sm text-ink-600">
          The first thing here will be somebody taking a slot.
        </p>
      </div>
    );
  }

  return (
    <ul className="border-t border-ink-200">
      {rows.map((row) => {
        const copy = COPY[row.kind] ?? { verb: row.kind, short: row.kind };
        return (
          <li
            key={row.id}
            className="flex items-center gap-4 border-b border-ink-200 py-3"
          >
            <span className="label w-16 shrink-0">{copy.short}</span>

            <p className="min-w-0 flex-1 truncate text-sm">
              <strong className="font-semibold">{row.actor || 'Someone'}</strong>{' '}
              <span className="text-ink-500">{copy.verb}</span>{' '}
              <span className="text-ink-700">{row.slotName || 'a slot'}</span>
            </p>

            {row.amountPaise ? (
              <span className="tnum shrink-0 text-sm font-semibold">
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
    <time dateTime={then.toISOString()} className="label shrink-0">
      {label}
    </time>
  );
}
