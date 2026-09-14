import { notFound } from 'next/navigation';

import { AdEmpty, AdRender } from '@/components/ad-render';
import { Board } from '@/components/leaderboard';
import { EmbedHeight } from '@/components/embed-height';
import { formatPaise } from '@/lib/money';
import { site } from '@/lib/site';
import { askFor, contendersFor, slotByPublicId, winnerFor } from '@/lib/queries';
import { recordView, recordViews } from '@/lib/track';

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

/**
 * THE HOST CHOOSES THE THEME, not this app and not the reader's session.
 *
 * `data-theme` on the script tag arrives here as `?theme=`. Left off, the unit
 * follows the reader's own system setting, which is right most of the time; a
 * site that is always dark (or always light) pins it and stops guessing.
 *
 * Whitelisted rather than passed through: this value lands in an HTML
 * attribute, and the set of legal schemes is three words long.
 */
function scheme(value: string | undefined): 'light' | 'dark' | 'system' {
  return value === 'light' || value === 'dark' ? value : 'system';
}

export default async function Embed({
  params,
  searchParams
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ view?: string; theme?: string }>;
}) {
  const [{ slug }, { view, theme }] = await Promise.all([params, searchParams]);
  const slot = await slotByPublicId(slug);
  if (!slot || !slot.active) notFound();

  const colorScheme = scheme(theme);

  /**
   * TWO THINGS CAN BE EMBEDDED, and they are different products.
   *
   *   default      the winning ad — one unit, the thing the slot sells.
   *   ?view=board  the whole leaderboard, so a host page can show the race.
   *
   * The board counts a view for EVERY brand on it, because every brand is
   * genuinely on screen. The single unit counts one, for the one that served.
   */
  if (view === 'board' || view === 'leaderboard') {
    const rows = await contendersFor(slot.id, 25);
    if (rows.length) {
      try {
        await recordViews(rows.map((r) => r.id));
      } catch {
        /* the board renders either way */
      }
    }
    const ask = await askFor(slot);
    return (
      <div className="sp-embed flex flex-1 flex-col p-2" data-color-scheme={colorScheme}>
        <Board rows={rows} base={site.self} ask={ask} view="list" />
        <EmbedHeight slot={slot.publicId} />
      </div>
    );
  }

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
    <div className="sp-embed flex flex-1 flex-col p-1" data-color-scheme={colorScheme}>
      {winner ? (
        <AdRender ad={winner} base={site.self} shape={slot.shape} />
      ) : (
        <AdEmpty ask={formatPaise(ask)} kind={slot.kind} slug={slot.publicId} base={site.self} />
      )}
      <EmbedHeight slot={slot.publicId} />
    </div>
  );
}
