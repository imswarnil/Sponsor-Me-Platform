import { Instagram } from 'lucide-react';
import type { WallMember } from '@/lib/proto/member-queries';

/**
 * THE SPONSOR WALL
 * ================
 *
 * Every active member, as a face. One component, three shapes:
 *
 *   sidebar  a narrow column — avatars stacked, made to sit beside content
 *   inline   a horizontal band of avatars, for dropping mid-page
 *   full     the full grid, name and line under each face
 *
 * The layout is the only thing that changes: the same people, the same links,
 * the same order. Ordered by when they joined — earliest first, so backing the
 * work sooner is worth something, and nobody has to wonder why they moved.
 *
 * Rendered by /members and by /embed/wall, which is what the embeddable iframe
 * serves. That means this markup runs on other people's sites, so it carries no
 * interactivity and no script: an embed that can only draw is an embed nobody
 * has to trust.
 */

export type WallLayout = 'sidebar' | 'inline' | 'full';

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

const SIZES: Record<WallLayout, { px: number; cls: string }> = {
  sidebar: { px: 40, cls: 'size-10' },
  inline: { px: 44, cls: 'size-11' },
  full: { px: 64, cls: 'size-16' }
};

function Avatar({ m, layout }: { m: WallMember; layout: WallLayout }) {
  const size = SIZES[layout];
  return m.avatarUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={m.avatarUrl}
      alt=""
      width={size.px}
      height={size.px}
      loading="lazy"
      className={`${size.cls} shrink-0 rounded-full border border-line-subtle object-cover`}
    />
  ) : (
    <span
      aria-hidden="true"
      className={`${size.cls} grid shrink-0 place-items-center rounded-full border border-line-subtle bg-pop-soft font-label text-xs font-semibold text-pop-soft-foreground`}
    >
      {initialsOf(m.displayName)}
    </span>
  );
}

/**
 * One face.
 *
 * `rank` is the member's place on the wall — position in the list, which is
 * join order (earliest first). It is not a new query and not a score: the
 * order was always meaningful, this just says so out loud. Set in the wall's
 * own numerals — Inter, small, tabular — because the design system reserves
 * mono for code, so a mono count would be a bug (CLAUDE.md §4).
 */
function Face({ m, layout, rank }: { m: WallMember; layout: WallLayout; rank: number }) {
  const href = hrefFor(m);
  const handle = m.instagramHandle ? `@${m.instagramHandle}` : null;

  const sampleTag = m.isSample ? (
    <span className="rounded-pill border border-line-subtle px-1.5 font-label text-2xs uppercase tracking-slate text-faint">
      Sample
    </span>
  ) : null;

  const body =
    layout === 'full' ? (
      /* A card rather than a bare avatar: the wall is the page's proof, and
         proof reads better with an edge around it. Lifts a hair on hover so a
         linked face feels like one. */
      <div className="relative flex h-full flex-col items-center gap-3 rounded-card border border-border bg-surface p-5 text-center transition-all duration-200 ease-out group-hover:-translate-y-0.5 group-hover:border-line-strong group-hover:shadow-lg group-hover:shadow-black/[0.04]">
        <span className="absolute left-3.5 top-3 font-label text-2xs tabular-nums text-faint">
          {String(rank).padStart(2, '0')}
        </span>
        <Avatar m={m} layout={layout} />
        <div className="min-w-0 w-full">
          <p className="truncate text-sm font-semibold">{m.displayName}</p>
          {sampleTag ? <p className="mt-1.5">{sampleTag}</p> : null}
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
    ) : layout === 'sidebar' ? (
      <div className="flex items-center gap-3 rounded-control p-2 transition-colors group-hover:bg-sunken">
        <Avatar m={m} layout={layout} />
        <div className="min-w-0">
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
      </div>
    ) : (
      /* inline: an overlapping stack, the way a row of faces is normally
         drawn. The ring is the page's own background, so each face cuts a
         clean edge out of the one behind it, and hovering brings one to the
         front instead of just fading it. */
      <span className="relative block transition-transform duration-200 ease-out group-hover:-translate-y-0.5">
        <span className="block rounded-full ring-2 ring-canvas">
          <Avatar m={m} layout={layout} />
        </span>
      </span>
    );

  const title = [m.displayName, m.blurb, handle, m.isSample ? '(sample data)' : null]
    .filter(Boolean)
    .join(' · ');

  const shell = layout === 'inline' ? 'group relative hover:z-10' : 'group block h-full';

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
      className={`${shell} rounded-card outline-none focus-visible:ring-2 focus-visible:ring-pop`}
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
        No members yet — the wall fills up as people join.
      </p>
    );
  }

  const container =
    layout === 'full'
      ? 'grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4'
      : layout === 'sidebar'
        ? 'flex flex-col gap-1'
        : // Overlapping stack — the negative margin is what makes it one row of
          // faces rather than a scattering of circles.
          'flex flex-wrap items-center -space-x-2';

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
