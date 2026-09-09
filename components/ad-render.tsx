import { site } from '@/lib/site';
import { youTubeThumb } from '@/lib/creative';
import type { LiveAd } from '@/lib/queries';

/**
 * THE AD, AS A READER SEES IT.
 *
 * Four formats, one component. Every one of them:
 *   · carries a visible "Ad" label — a paid unit that looks like content is a
 *     unit that lies, and no revenue makes that a design decision;
 *   · leaves through /api/go, which counts the click and then reads the
 *     destination out of the database. The sponsor's URL is never in the query
 *     string, because a redirector that forwards to its own parameters is an
 *     open redirect on the creator's own domain.
 *
 * `base` is set when this renders inside the embed on somebody else's site,
 * where a root-relative href would resolve against the HOST rather than here.
 */
export function AdRender({
  ad,
  base = '',
  shape = 'card'
}: {
  ad: LiveAd;
  base?: string;
  shape?: string;
}) {
  const href = `${base}/api/go?ad=${encodeURIComponent(ad.id)}`;
  const banner = shape === 'banner';

  return (
    <div className="group relative h-full">
      {/* A house ad says so. Labelling the creator's own project as "Ad" would
          be technically true and misleading — the disclosure exists to tell a
          reader who paid, and here nobody did. */}
      <span
        className={`absolute -top-2 left-3 z-10 rounded-full border-2 border-ink-900 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ink-900 ${
          ad.isHouse ? 'bg-mint-300' : 'bg-craft-300'
        }`}
      >
        {ad.isHouse ? 'Our own' : 'Ad'}
      </span>

      <a
        href={href}
        target="_blank"
        rel="nofollow sponsored noopener"
        className="card-pop card-lift block h-full overflow-hidden no-underline"
      >
        <Body ad={ad} banner={banner} />
      </a>
    </div>
  );
}

function Body({ ad, banner }: { ad: LiveAd; banner: boolean }) {
  /**
   * HTML from a sponsor never touches this origin's DOM. It goes into a
   * sandboxed srcDoc iframe: no scripts, no same-origin, no forms, no
   * navigation. Injecting it directly — even "just for trusted sponsors" —
   * would be a stored XSS with a price list attached.
   */
  if (ad.format === 'html' && ad.html) {
    return (
      <iframe
        title={`${ad.brand} — sponsored`}
        srcDoc={ad.html}
        sandbox=""
        referrerPolicy="no-referrer"
        className="h-full w-full border-0 bg-white"
        style={{ minHeight: banner ? 100 : 220 }}
      />
    );
  }

  if (ad.format === 'image' && ad.imageUrl) {
    return (
      <div className="flex h-full flex-col">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={ad.imageUrl}
          alt={ad.headline || ad.brand}
          loading="lazy"
          decoding="async"
          className="h-full w-full flex-1 object-cover"
        />
        <p className="border-t-2 border-ink-900 bg-ink-50 px-3 py-1.5 text-xs font-semibold text-ink-700">
          {ad.brand}
        </p>
      </div>
    );
  }

  if (ad.format === 'video') {
    const thumb = youTubeThumb(ad.videoUrl ?? ad.url);
    return (
      <div className="flex h-full flex-col">
        <div className="relative flex-1 bg-ink-900">
          {thumb ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={thumb}
              alt=""
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover opacity-90"
            />
          ) : null}
          {/* A play affordance, not a player. Embedding YouTube's iframe on
              every page of the network would be a tracking surface and a
              performance cost the creator did not agree to sell. */}
          <span className="absolute inset-0 grid place-items-center">
            <span className="grid h-12 w-12 place-items-center rounded-full border-2 border-ink-900 bg-white text-lg shadow-[3px_3px_0_0_var(--color-ink-900)]">
              ▶
            </span>
          </span>
        </div>
        <div className="border-t-2 border-ink-900 px-3 py-2">
          <p className="line-clamp-2 text-sm font-bold leading-snug">{ad.headline}</p>
          <p className="text-xs text-ink-600">{ad.brand}</p>
        </div>
      </div>
    );
  }

  // 'card' — the default, and the fallback for a format missing its media.
  return (
    <div className={`flex h-full gap-3 p-4 ${banner ? 'items-center' : 'flex-col'}`}>
      {ad.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={ad.imageUrl}
          alt=""
          loading="lazy"
          decoding="async"
          className={
            banner
              ? 'h-14 w-14 shrink-0 rounded-xl border-2 border-ink-900 object-cover'
              : 'h-24 w-full rounded-xl border-2 border-ink-900 object-cover'
          }
        />
      ) : null}

      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-[15px] font-bold leading-snug text-ink-900">
          {ad.headline}
        </p>
        {ad.body && !banner ? (
          <p className="mt-1 line-clamp-2 text-sm text-ink-600">{ad.body}</p>
        ) : null}
        <p className="mt-1 truncate text-xs font-semibold text-ink-500">{ad.brand}</p>
      </div>

      {ad.ctaLabel ? (
        <span
          className={`btn-pop shrink-0 bg-signal-500 text-sm text-white ${banner ? '' : 'w-full'}`}
        >
          {ad.ctaLabel}
        </span>
      ) : null}
    </div>
  );
}

/**
 * The empty unit — and the most valuable one on the page, not a fallback. An
 * empty slot that says what it costs and where to buy it is how the first
 * sponsor arrives. It reserves the same height as a filled one, so the host
 * page does not move when it sells.
 */
export function AdEmpty({
  ask,
  kind,
  slug,
  base = ''
}: {
  ask: string;
  kind: string;
  slug: string;
  base?: string;
}) {
  return (
    <a
      href={`${base || site.self}/slot/${slug}`}
      target="_blank"
      rel="noopener"
      className="group flex h-full min-h-[180px] flex-col items-center justify-center gap-2
                 rounded-2xl border-2 border-dashed border-ink-300 bg-ink-50 p-4 text-center
                 no-underline transition hover:border-ink-900 hover:bg-craft-50"
    >
      <span className="text-2xl">{kind === 'bid' ? '🏆' : '✨'}</span>
      <p className="text-sm font-bold text-ink-900">
        {kind === 'bid' ? 'Top spot is open' : 'This spot is open'}
      </p>
      <p className="text-xs text-ink-600">
        <strong className="text-ink-900">{ask}</strong> takes it
      </p>
    </a>
  );
}
