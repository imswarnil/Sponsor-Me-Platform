import { Instagram } from 'lucide-react';
import type { WallMember } from '@/lib/proto/member-queries';
import { formatAmount } from '@/lib/money';
import { cn } from '@/lib/utils';

/**
 * THE SPONSOR WALL
 * ================
 *
 * Every member, as a face, ranked by their bid — highest first, with a
 * 1st / 2nd / 3rd podium at the top. That is the whole proposition
 * (lib/site.ts `membership`): bid once, hold the spot until someone bids
 * more; bid more yourself to move up. The order comes from member-queries.ts;
 * this file only draws it and never re-sorts.
 *
 * Three shapes, one set of people in one order:
 *
 *   full     the leaderboard — 1st takes a 2×2 cell with the accent ring,
 *            2nd and 3rd a full card with their place named, the rest a
 *            compact one. The bid is printed on every card.
 *   sidebar  a narrow list, place and bid — for beside content.
 *   inline   an overlapping row of faces, 1st a size up — for mid-page.
 *
 * Rendered by /members, the homepage, and /embed/wall — which is what the
 * embeddable iframe serves. That means this markup runs on other people's
 * sites, so it carries no interactivity and no script: an embed that can only
 * draw is an embed nobody has to trust.
 */

export type WallLayout = 'sidebar' | 'inline' | 'full';

type Tier = 'first' | 'podium' | 'base';

function tierOf(rank: number): Tier {
  return rank === 1 ? 'first' : rank <= 3 ? 'podium' : 'base';
}

/** "1st", "2nd", "3rd" on the podium; "#4" and up for everyone else. */
function placeOf(rank: number): string {
  if (rank === 1) return '1st';
  if (rank === 2) return '2nd';
  if (rank === 3) return '3rd';
  return `#${rank}`;
}

/** Where a member's face should link. Instagram unless they gave a link. */
function hrefFor(m: WallMember): string | null {
  if (m.linkUrl) return m.linkUrl;
  if (m.instagramHandle) return `https://instagram.com/${m.instagramHandle}`;
  return null;
}

function initialsOf(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function Avatar({ m, cls, px, ring }: { m: WallMember; cls: string; px: number; ring?: boolean }) {
  /* The accent ring is the one place the wall spends its accent: 1st, and
     only 1st. 2nd and 3rd are named, not coloured. */
  const ringCls = ring ? 'ring-2 ring-pop ring-offset-2 ring-offset-surface' : '';
  return m.avatarUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={m.avatarUrl}
      alt=""
      width={px}
      height={px}
      loading="lazy"
      className={cn(cls, 'shrink-0 rounded-full border border-line-subtle object-cover', ringCls)}
    />
  ) : (
    <span
      aria-hidden="true"
      className={cn(
        cls,
        'grid shrink-0 place-items-center rounded-full border border-line-subtle bg-pop-soft font-label font-semibold text-pop-soft-foreground',
        px >= 80 ? 'text-lg' : px >= 56 ? 'text-xs' : 'text-2xs',
        ringCls
      )}
    >
      {initialsOf(m.displayName)}
    </span>
  );
}

function SampleTag() {
  return (
    <span className="rounded-pill border border-line-subtle px-1.5 font-label text-2xs uppercase tracking-slate text-faint">
      Sample
    </span>
  );
}

function Bid({ m, size }: { m: WallMember; size: 'lg' | 'md' | 'sm' }) {
  return (
    <p
      className={cn(
        'tabular-nums',
        size === 'lg' && 'font-display text-2xl font-bold tracking-tight',
        size === 'md' && 'text-sm font-semibold',
        size === 'sm' && 'text-xs font-medium'
      )}
    >
      {formatAmount(m.amount)}
    </p>
  );
}

/** One face, drawn for its place. */
function Face({ m, layout, rank }: { m: WallMember; layout: WallLayout; rank: number }) {
  const href = hrefFor(m);
  const handle = m.instagramHandle ? `@${m.instagramHandle}` : null;
  const tier = tierOf(rank);
  const place = placeOf(rank);

  const body =
    layout === 'full' ? (
      tier === 'first' ? (
        /* 1st: a 2×2 cell, the accent ring, the bid set large. This is the
           card everyone else is invited to take. */
        <div className="relative flex h-full flex-col items-center justify-center gap-4 rounded-card border border-pop/40 bg-surface p-7 text-center transition-all duration-200 ease-out group-hover:-translate-y-0.5 group-hover:shadow-lg group-hover:shadow-black/[0.05]">
          <span className="absolute left-4 top-3.5 font-label text-2xs uppercase tracking-slate text-signal">
            1st · Top spot
          </span>
          <Avatar m={m} cls="size-24" px={96} ring />
          <div className="min-w-0 w-full">
            <p className="truncate font-display text-lg font-bold tracking-tight">{m.displayName}</p>
            {m.isSample ? (
              <p className="mt-1.5">
                <SampleTag />
              </p>
            ) : null}
            <div className="mt-2">
              <Bid m={m} size="lg" />
            </div>
            {m.blurb ? (
              <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                {m.blurb}
              </p>
            ) : null}
            {handle ? (
              <p className="mt-3 inline-flex max-w-full items-center gap-1 font-label text-2xs uppercase tracking-slate text-subtle">
                <Instagram className="size-3 shrink-0" />
                <span className="truncate">{handle}</span>
              </p>
            ) : null}
          </div>
        </div>
      ) : tier === 'podium' ? (
        /* 2nd and 3rd: a full card, their place named in the corner. */
        <div className="relative flex h-full flex-col items-center gap-3 rounded-card border border-border bg-surface p-5 text-center transition-all duration-200 ease-out group-hover:-translate-y-0.5 group-hover:border-line-strong group-hover:shadow-lg group-hover:shadow-black/[0.04]">
          <span className="absolute left-3.5 top-3 font-label text-2xs uppercase tracking-slate text-subtle">
            {place}
          </span>
          <Avatar m={m} cls="size-16" px={64} />
          <div className="min-w-0 w-full">
            <p className="truncate text-sm font-semibold">{m.displayName}</p>
            {m.isSample ? (
              <p className="mt-1.5">
                <SampleTag />
              </p>
            ) : null}
            <div className="mt-1.5">
              <Bid m={m} size="md" />
            </div>
            {m.blurb ? (
              <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                {m.blurb}
              </p>
            ) : null}
            {handle ? (
              <p className="mt-2.5 inline-flex max-w-full items-center gap-1 border-t border-line-subtle pt-2.5 font-label text-2xs uppercase tracking-slate text-subtle">
                <Instagram className="size-3 shrink-0" />
                <span className="truncate">{handle}</span>
              </p>
            ) : null}
          </div>
        </div>
      ) : (
        /* Everyone else: a compact card. Still a name, still a bid — a spot
           on the wall is a spot on the wall. */
        <div className="relative flex h-full flex-col items-center gap-2 rounded-card border border-border bg-surface p-4 text-center transition-all duration-200 ease-out group-hover:-translate-y-0.5 group-hover:border-line-strong">
          <span className="absolute left-3 top-2.5 font-label text-2xs tabular-nums text-faint">
            {place}
          </span>
          <Avatar m={m} cls="size-12" px={48} />
          <div className="min-w-0 w-full">
            <p className="truncate text-xs font-semibold">{m.displayName}</p>
            {m.isSample ? (
              <p className="mt-1">
                <SampleTag />
              </p>
            ) : null}
            <div className="mt-1 text-muted-foreground">
              <Bid m={m} size="sm" />
            </div>
          </div>
        </div>
      )
    ) : layout === 'sidebar' ? (
      <div className="flex items-center gap-3 rounded-control p-2 transition-colors group-hover:bg-sunken">
        <span
          className={cn(
            'w-7 shrink-0 font-label text-2xs uppercase tracking-slate tabular-nums',
            tier === 'first' ? 'text-signal' : 'text-faint'
          )}
        >
          {place}
        </span>
        <Avatar m={m} cls="size-9" px={36} ring={tier === 'first'} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">
            {m.displayName}
            {m.isSample ? <span className="ml-1.5 text-faint">· sample</span> : null}
          </p>
          {m.blurb ? (
            <p className="truncate text-xs text-muted-foreground">{m.blurb}</p>
          ) : handle ? (
            <p className="truncate font-label text-2xs uppercase tracking-slate text-subtle">
              {handle}
            </p>
          ) : null}
        </div>
        <span className="shrink-0 text-xs font-medium tabular-nums text-muted-foreground">
          {formatAmount(m.amount)}
        </span>
      </div>
    ) : (
      /* inline: an overlapping stack, the way a row of faces is normally
         drawn. 1st a size up and ringed; the ring is the page's own
         background so each face cuts a clean edge out of the one behind. */
      <span className="relative block transition-transform duration-200 ease-out group-hover:-translate-y-0.5">
        <span className="block rounded-full ring-2 ring-canvas">
          <Avatar
            m={m}
            cls={tier === 'first' ? 'size-12' : 'size-10'}
            px={tier === 'first' ? 48 : 40}
            ring={tier === 'first'}
          />
        </span>
      </span>
    );

  const title = [
    place,
    m.displayName,
    formatAmount(m.amount),
    m.blurb,
    handle,
    m.isSample ? '(sample data)' : null
  ]
    .filter(Boolean)
    .join(' · ');

  const shell = cn(
    'group',
    layout === 'inline' ? 'relative hover:z-10' : 'block h-full',
    layout === 'full' && tier === 'first' && 'sm:col-span-2 sm:row-span-2'
  );

  if (!href) {
    return (
      <div title={title} className={shell}>
        {body}
      </div>
    );
  }

  return (
    <a
      href={href}
      title={title}
      target="_blank"
      rel="noopener noreferrer nofollow"
      className={cn(shell, 'rounded-card outline-none focus-visible:ring-2 focus-visible:ring-pop')}
    >
      {body}
    </a>
  );
}

export function SponsorWall({
  members,
  layout = 'full',
  heading
}: {
  members: WallMember[];
  layout?: WallLayout;
  heading?: string;
}) {
  if (members.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nobody on the wall yet — the top spot is open.
      </p>
    );
  }

  const container =
    layout === 'full'
      ? // grid-flow-dense lets the compact cards backfill around the 2×2 first
        // place instead of leaving a hole beside it.
        'grid grid-flow-dense grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4'
      : layout === 'sidebar'
        ? 'flex flex-col gap-1'
        : 'flex flex-wrap items-center -space-x-2';

  const samples = members.filter((m) => m.isSample).length;

  return (
    <div>
      {heading ? (
        <h2 className="mb-3 font-label text-2xs uppercase tracking-slate text-subtle">
          {heading}
        </h2>
      ) : null}
      {/* Said once for the whole wall as well as per face: a visitor should
          never have to notice a small badge to know what they are looking at. */}
      {samples > 0 ? (
        <p className="mb-5 text-xs text-muted-foreground">
          {samples === members.length
            ? 'Everyone here is sample data while the site is being built — not real members.'
            : `${samples} of these are sample data while the site is being built — not real members.`}
        </p>
      ) : null}
      <div className={container}>
        {members.map((m, i) => (
          <Face key={m.id} m={m} layout={layout} rank={i + 1} />
        ))}
      </div>
    </div>
  );
}
