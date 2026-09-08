import Link from 'next/link';

import { formatPaise } from '@/lib/money';
import { properties, site } from '@/lib/site';
import type { Activity } from '@/lib/db/schema';
import type { RankedBid } from '@/lib/queries';

/**
 * The homepage's own pieces. Everything here is presentational — the numbers
 * arrive already read from the database, and NOTHING in this file invents one.
 * A figure that could not be read renders as absent, never as a zero and never
 * as a plausible-looking placeholder.
 */

/* ── The leaderboard ────────────────────────────────────────────────────── */

/**
 * THE PODIUM — the top three as a shape before they are read as numbers.
 *
 * First place is centred, taller and the only one carrying the accent. The
 * height difference does the work a sentence would otherwise have to: it says
 * there is a gap, and roughly how big, before anybody has parsed a figure.
 */
export function Podium({ rows }: { rows: RankedBid[] }) {
  if (!rows.length) return null;

  return (
    <div className="podium">
      {rows.slice(0, 3).map((row) => (
        <div key={row.id} className={`podium__step podium__step-${row.rank}`}>
          <span className={`medal medal-${row.rank} ${row.rank === 1 ? 'medal-lg' : ''} podium__medal`}>
            {row.rank}
          </span>
          <p className="podium__brand truncate-1">{row.brand}</p>
          <p className="podium__amount">{formatPaise(row.amountPaise)}</p>
          <p className="podium__note">
            {row.rank === 1 ? 'Holding first' : `Rank ${row.rank}`}
          </p>
        </div>
      ))}
    </div>
  );
}

/**
 * THE LADDER — everybody, with the distance between them drawn.
 *
 * Each rung carries a bar whose width is that bid as a fraction of the top
 * bid. The gap between first and fourth becomes a picture instead of
 * arithmetic the reader has to do, which is the single most useful thing this
 * page can show somebody deciding what to pay.
 */
export function Ladder({
  rows,
  total,
  mineId
}: {
  rows: RankedBid[];
  total: number;
  mineId?: string | null;
}) {
  if (!rows.length) {
    return (
      <div className="empty">
        <div className="empty__body">
          <p className="empty__title">Nobody has bid yet</p>
          <p className="t-small t-muted">The first bid takes first place.</p>
        </div>
      </div>
    );
  }

  // The top bid is the scale. Guarded against zero, which cannot happen —
  // `rankedBids` filters on amount > 0 — but a division that can produce
  // Infinity should not depend on a filter in another file staying true.
  const top = Math.max(rows[0]?.amountPaise ?? 1, 1);

  return (
    <div className="stack stack-sm">
      <ol className="ladder">
        {rows.map((row) => (
          <li
            key={row.id}
            className={`rung ${row.profileId === mineId ? 'rung-mine' : ''}`}
          >
            <span
              className="rung__fill"
              style={{ inlineSize: `${Math.max(4, (row.amountPaise / top) * 100)}%` }}
              aria-hidden
            />
            <span className={`medal medal-${Math.min(row.rank, 4)} medal-sm`}>{row.rank}</span>
            <div className="rung__body">
              <p className="rung__brand">{row.brand}</p>
              <p className="rung__line">{row.headline}</p>
            </div>
            <span className="rung__amount">{formatPaise(row.amountPaise)}</span>
          </li>
        ))}
      </ol>

      {total > rows.length ? (
        <p className="t-fine t-faint m-0">
          and {total - rows.length} more {total - rows.length === 1 ? 'sponsor' : 'sponsors'} below
        </p>
      ) : null}
    </div>
  );
}

/* ── The activity ticker ────────────────────────────────────────────────── */

const ACTIVITY_COPY: Record<string, string> = {
  'bid.paid': 'bid on the board',
  'bid.approved': 'went live on the board',
  'booking.paid': 'booked a slot'
};

export function ActivityFeed({ rows }: { rows: Activity[] }) {
  if (!rows.length) {
    return <p className="t-small t-faint m-0">Nothing has happened yet.</p>;
  }

  return (
    <div>
      {rows.map((row) => (
        <div key={row.id} className="ticker__row">
          <span className="dot dot-accent dot-sm" aria-hidden />
          <span className="t-small f-grow truncate-1">
            <strong className="t-default">{row.actor || 'Someone'}</strong>{' '}
            <span className="t-muted">{ACTIVITY_COPY[row.kind] ?? row.kind}</span>
          </span>
          {row.amountPaise ? (
            <span className="t-data-sm t-faint live-figure">{formatPaise(row.amountPaise)}</span>
          ) : null}
          <RelativeTime date={row.createdAt} />
        </div>
      ))}
    </div>
  );
}

/**
 * A timestamp that is honest about its precision.
 *
 * Rendered on the server, so it says "3 days ago" rather than a live-ticking
 * "2 minutes ago" that would be wrong the moment the page is cached. Anything
 * inside an hour reads as "just now" for the same reason.
 */
export function RelativeTime({ date }: { date: Date | string | null }) {
  if (!date) return null;
  const then = new Date(date);
  const hours = Math.floor((Date.now() - then.getTime()) / 3_600_000);

  let label: string;
  if (hours < 1) label = 'just now';
  else if (hours < 24) label = `${hours}h ago`;
  else if (hours < 24 * 30) label = `${Math.floor(hours / 24)}d ago`;
  else label = then.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });

  return (
    <time dateTime={then.toISOString()} className="t-fine t-faint t-nowrap">
      {label}
    </time>
  );
}

/* ── The network ────────────────────────────────────────────────────────── */

export function Network() {
  const live = properties.filter((p) => p.live);

  return (
    <div className="grid-auto">
      {live.map((property) => (
        <div key={property.key} className="card card-compact card-quiet">
          <div className="card__body">
            <p className="card__title t-small">{property.label}</p>
            <p className="card__excerpt t-fine t-muted">{property.what}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Why bother ─────────────────────────────────────────────────────────── */

/**
 * The argument for buying, stated as things that are true about this platform
 * rather than as adjectives. Each one is a real property of the code in this
 * repo, which is the only kind of claim worth making to somebody who is about
 * to hand over money.
 */
const ADVANTAGES = [
  {
    title: 'One tag, the whole network',
    body: `Your ad runs across every site listed below at once. One placement, not ${properties.filter((p) => p.live).length} negotiations.`
  },
  {
    title: 'You see the real page first',
    body: 'Every slot shows you a live frame of the actual page your ad lands on, before you pay. No mockups.'
  },
  {
    title: 'Numbers you can check',
    body: 'Views and clicks, counted per day, visible in your dashboard the moment they happen. No reach estimates and no invented figures.'
  },
  {
    title: 'No ad network in the middle',
    body: 'You pay the creator. Nobody resells your placement, nobody retargets the audience, and no third-party script goes on the page.'
  },
  {
    title: 'Readers are not tracked',
    body: 'No cookies, no fingerprint, no visitor id — the widget is an iframe that counts a number. That is why people leave it enabled.'
  },
  {
    title: 'Your rank is yours',
    body: 'A bid never expires. Pay once and hold the spot until somebody outbids you — no monthly renewal to forget.'
  }
] as const;

export function Advantages() {
  return (
    <div className="grid-auto">
      {ADVANTAGES.map((item) => (
        <div key={item.title} className="card card-bare">
          <div className="card__body">
            <p className="card__title t-h5">{item.title}</p>
            <p className="card__excerpt t-small t-muted">{item.body}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── How it works ───────────────────────────────────────────────────────── */

export function HowItWorks({ minimum }: { minimum: number }) {
  return (
    <ol className="steps steps-compact">
      <li>
        <p className="steps__title">Make an account</p>
        <p className="steps__body t-small t-muted">
          Email and a password. Nothing else is asked for.
        </p>
      </li>
      <li>
        <p className="steps__title">Write the ad</p>
        <p className="steps__body t-small t-muted">
          A headline, a line of copy, a link. Or a video, a product, a course — whatever you are
          promoting.
        </p>
      </li>
      <li>
        <p className="steps__title">Bid, or book a slot</p>
        <p className="steps__body t-small t-muted">
          {formatPaise(minimum)} takes first place on the board today. A slot is priced per month
          and starts when the current booking ends.
        </p>
      </li>
      <li>
        <p className="steps__title">Watch it run</p>
        <p className="steps__body t-small t-muted">
          {site.creator} reviews the creative, then it goes live across the network and your
          dashboard starts counting.
        </p>
      </li>
    </ol>
  );
}

/* ── A section heading ──────────────────────────────────────────────────── */

export function Sec({
  eyebrow,
  title,
  lead,
  action
}: {
  eyebrow?: string;
  title: string;
  lead?: string;
  action?: { href: string; label: string };
}) {
  return (
    <header className="sec sec-rule">
      <div className="sec__text">
        {eyebrow ? <p className="sec__eyebrow">{eyebrow}</p> : null}
        <h2 className="sec__title">{title}</h2>
        {lead ? <p className="sec__lead">{lead}</p> : null}
      </div>
      {action ? (
        <div className="sec__actions">
          <Link href={action.href} className="btn btn-sm btn-outline">
            {action.label}
          </Link>
        </div>
      ) : null}
    </header>
  );
}
