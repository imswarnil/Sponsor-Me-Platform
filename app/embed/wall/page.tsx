import { SponsorWall, type WallLayout } from '@/components/marketing/sponsor-wall';
import { WallAutoHeight } from '@/components/marketing/wall-auto-height';
import { getActiveWallMembers } from '@/lib/proto/member-queries';

/**
 * The embeddable sponsor wall.
 *
 * Served in an iframe on other people's pages by public/wall.js, which is why
 * this route is exempted from the app's `frame-ancestors 'self'` header (see
 * next.config.ts — the exemption already covers everything under /embed).
 *
 * Reads nothing about the viewer and renders no interactivity, so there is no
 * session to leak and nothing to trust: it draws faces and links out. Same
 * order as everywhere else — highest bid first — so a spot travels with its
 * rank to every site this is on.
 */
export const dynamic = 'force-dynamic';

const LAYOUTS: WallLayout[] = ['sidebar', 'inline', 'full'];

export default async function WallEmbed({
  searchParams
}: {
  searchParams: Promise<{ layout?: string; limit?: string; heading?: string }>;
}) {
  const sp = await searchParams;
  const layout = LAYOUTS.includes(sp.layout as WallLayout)
    ? (sp.layout as WallLayout)
    : 'inline';

  // Clamped: the limit arrives from a query string on somebody else's page.
  const limit = Math.min(Math.max(parseInt(sp.limit ?? '60', 10) || 60, 1), 200);

  const members = await getActiveWallMembers(limit);

  return (
    <div className="bg-canvas p-3">
      <WallAutoHeight layout={layout} />
      <SponsorWall
        members={members}
        layout={layout}
        heading={sp.heading ? sp.heading.slice(0, 60) : undefined}
      />
    </div>
  );
}
