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

/** One face. A link when they gave somewhere to go, plain otherwise. */
function Face({ m, layout }: { m: WallMember; layout: WallLayout }) {
  const href = hrefFor(m);
  const handle = m.instagramHandle ? `@${m.instagramHandle}` : null;

  const body =
    layout === 'full' ? (
      <div className="flex flex-col items-center gap-2 text-center">
        <Avatar m={m} layout={layout} />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{m.displayName}</p>
          {m.isSample ? (
            <p className="mt-1 inline-block rounded-pill border border-line-subtle px-1.5 font-label text-2xs uppercase tracking-slate text-faint">
              Sample
            </p>
          ) : null}
          {m.blurb ? (
            <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{m.blurb}</p>
          ) : null}
          {handle ? (
            <p className="mt-1 inline-flex items-center gap-1 font-label text-2xs uppercase tracking-slate text-subtle">
              <Instagram className="size-3" />
              {handle}
            </p>
          ) : null}
        </div>
      </div>
    ) : layout === 'sidebar' ? (
      <div className="flex items-center gap-3">
        <Avatar m={m} layout={layout} />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{m.displayName}</p>
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
      // inline: the face carries the name as a tooltip so the band stays a band
      <Avatar m={m} layout={layout} />
    );

  const title = [m.displayName, m.blurb, handle].filter(Boolean).join(' · ');

  if (!href) {
    return (
      <div title={title} className="rounded-control">
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
      className="rounded-control outline-none transition-opacity hover:opacity-80 focus-visible:opacity-80"
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
      ? 'grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4'
      : layout === 'sidebar'
        ? 'flex flex-col gap-3'
        : 'flex flex-wrap items-center gap-2';

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
        {members.map((m) => (
          <Face key={m.id} m={m} layout={layout} />
        ))}
      </div>
    </div>
  );
}
