import { formatPaise } from '@/lib/money';
import type { Activity } from '@/lib/db/schema';

/**
 * WHAT HAS BEEN HAPPENING.
 *
 * Real events only — a row exists because money moved or an ad went live, and
 * there is no filler. An empty feed says so rather than inventing motion.
 *
 * Times are rendered on the server, so they say "3d" rather than a
 * live-ticking "2 minutes ago" that would be wrong the moment the page is
 * cached. Anything inside an hour reads as "just now" for the same reason.
 */

const COPY: Record<string, { verb: string; short: string; tone: string }> = {
  paid: { verb: 'paid for', short: 'Paid', tone: 'sp-badge-success' },
  live: { verb: 'went live on', short: 'Live', tone: 'sp-badge-accent' },
  outbid: { verb: 'took the top of', short: 'Outbid', tone: 'sp-badge-gold' }
};

export function ActivityFeed({ rows }: { rows: Activity[] }) {
  if (!rows.length) {
    return (
      /* `sp-panel` and not `sp-card`: the feed renders on a tinted section, and
         a tinted card on a tinted plane is the same tone twice. A bordered
         white panel reads on either background. */
      <div className="sp-panel px-6 py-12 text-center">
        <p className="sp-h4 font-semibold">Nothing yet</p>
        <p className="mt-1 text-small text-secondary">
          The first thing here will be somebody taking a slot.
        </p>
      </div>
    );
  }

  return (
    <ul className="sp-rows">
      {rows.map((row) => {
        const copy = COPY[row.kind] ?? { verb: row.kind, short: row.kind, tone: 'sp-badge-quiet' };
        return (
          <li key={row.id} className="flex items-center gap-4 py-4">
            <span className={`sp-badge ${copy.tone} w-[4.5rem] justify-center`}>{copy.short}</span>

            <p className="min-w-0 flex-1 truncate text-small">
              <strong className="font-semibold text-title">{row.actor || 'Someone'}</strong>{' '}
              <span className="text-secondary">{copy.verb}</span>{' '}
              <span className="text-body">{row.slotName || 'a slot'}</span>
            </p>

            {row.amountPaise ? (
              <span className="sp-num shrink-0 text-small font-semibold text-title">
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
    <time dateTime={then.toISOString()} className="sp-num shrink-0 text-tiny text-mute">
      {label}
    </time>
  );
}
