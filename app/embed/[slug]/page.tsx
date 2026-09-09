import { notFound } from 'next/navigation';

import { AdEmpty, AdRender } from '@/components/ad-render';
import { EmbedHeight } from '@/components/embed-height';
import { formatPaise } from '@/lib/money';
import { site } from '@/lib/site';
import { askFor, slotByPublicId, winnerFor } from '@/lib/queries';
import { recordView } from '@/lib/track';

/**
 * THE EMBEDDED UNIT — what loads inside the iframe on somebody else's site.
 *
 * Server-rendered, so a reader with JavaScript off still sees the ad and no
 * client bundle runs on the host's page.
 *
 * THIS PAGE MUST NOT KNOW WHO IS LOOKING AT IT. `frame-ancestors *` lets any
 * site frame it, and a page that both reads a session and can be framed by
 * anyone is a clickjacking surface. Public data only, always — no getViewer(),
 * no cookies.
 */
export const dynamic = 'force-dynamic';

/** Never indexed: this is a fragment of the host's page, not a page. */
export const metadata = { robots: { index: false, follow: false } };

export default async function Embed({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const slot = await slotByPublicId(slug);
  if (!slot || !slot.active) notFound();

  const [winner, ask] = await Promise.all([winnerFor(slot.id), askFor(slot)]);

  if (winner) {
    // Best-effort. A counter that fails must never be the reason an ad does
    // not appear on somebody else's site.
    try {
      await recordView(winner.id);
    } catch {
      /* the ad renders either way */
    }
  }

  return (
    <div className="flex flex-1 flex-col p-1">
      {winner ? (
        <AdRender ad={winner} base={site.self} shape={slot.shape} />
      ) : (
        <AdEmpty
          ask={formatPaise(ask)}
          kind={slot.kind}
          slug={slot.publicId}
          base={site.self}
        />
      )}
      <EmbedHeight slot={slot.publicId} />
    </div>
  );
}
