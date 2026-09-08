import { SponsorBoard } from '@/components/ad-unit';
import { EmbedHeight } from '@/components/embed-height';
import { boardTop, minimumToLead } from '@/lib/queries';
import { recordViews } from '@/lib/track';
import { site } from '@/lib/site';

/**
 * THE EMBEDDED WIDGET — /embed/board
 *
 * What loads inside the iframe on the creator's sites. Rendered on the server,
 * so a reader with JavaScript disabled still sees the ads, and there is no
 * client bundle running on somebody else's page.
 *
 * THIS PAGE MUST NOT KNOW WHO IS LOOKING AT IT. `frame-ancestors *` in
 * next.config.ts means any site may frame it, and a page that both reads a
 * session and can be framed by anyone is a clickjacking surface. So: no
 * session, no cookies, no `getViewer()`. Public data only, always.
 *
 * WHAT IT DOES NOT COLLECT: no IP, no user agent, no cookie, no visitor id.
 * The counter in lib/track.ts is per day per ad, and that is the whole of the
 * analytics. The creator's readers did not agree to be profiled because
 * somebody bought an ad.
 */

export const dynamic = 'force-dynamic';

/** Never indexed: the widget is a fragment, and its content lives on the real pages. */
export const metadata = { robots: { index: false, follow: false } };

export default async function EmbedBoard({
  searchParams
}: {
  searchParams: Promise<{ format?: string }>;
}) {
  const { format } = await searchParams;
  const [{ top }, minimum] = await Promise.all([boardTop(), minimumToLead(null)]);

  /**
   * Count the impression. Best-effort and deliberately not awaited into the
   * render path's critical section — a counter that fails must never be the
   * reason an ad does not appear on somebody else's site.
   */
  if (top.length) {
    try {
      await recordViews(
        top.map((b) => ({ placement: 'bid' as const, refId: b.id, profileId: b.profileId }))
      );
    } catch {
      /* the ads render either way */
    }
  }

  // A vertical rail stacks; everything else uses the standard split.
  const stacked = format === 'sky' || format === 'rect';

  return (
    <div className="embed-root p-3">
      {/* A rail is one column wide; forcing the split into it would give three
          unreadable columns. The override is inline because it depends on a
          query parameter, which no stylesheet can see. */}
      {stacked ? <style>{`.board-split{grid-template-columns:1fr}`}</style> : null}
      <SponsorBoard top={top} minimum={minimum} baseUrl={site.self} />
      <EmbedHeight />
    </div>
  );
}
