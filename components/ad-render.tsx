import { ArrowRight, Play } from '@/components/icons';
import { site } from '@/lib/site';
import { youTubeThumb } from '@/lib/creative';
import type { LiveAd } from '@/lib/queries';

/**
 * THE AD, AS A READER SEES IT.
 *
 * Four formats, one component. Every one of them:
 *   · carries a visible "Ad" label — a paid unit that looks like content is a
 *     unit that lies, and no amount of revenue makes that a design decision;
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
    <div className="relative h-full">
      {/* A house ad says so. Labelling the creator's own project as "Ad" would
          be technically true and misleading — the disclosure exists to tell a
          reader who paid, and here nobody did. */}
      <span className="sp-badge sp-badge-solid absolute right-3 top-3 z-10 opacity-85">
        {ad.isHouse ? 'House' : 'Ad'}
      </span>

      <a
        href={href}
        target="_blank"
        rel="nofollow sponsored noopener"
        className="sp-card sp-lift block h-full overflow-hidden"
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
        className="h-full w-full bg-surface"
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
        <p className="px-4 py-3 text-small font-semibold text-title">{ad.brand}</p>
      </div>
    );
  }

  if (ad.format === 'video') {
    const thumb = youTubeThumb(ad.videoUrl ?? ad.url);
    return (
      <div className="flex h-full flex-col">
        <div className="relative flex-1 bg-surface-300">
          {thumb ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={thumb}
              alt=""
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover"
            />
          ) : null}
          {/* A play affordance, not a player. Embedding YouTube's iframe on
              every page of the network would be a tracking surface and a
              performance cost the creator never agreed to sell. */}
          <span className="absolute inset-0 grid place-items-center">
            <span className="grid size-12 place-items-center rounded-full bg-surface/90 backdrop-blur">
              <Play className="size-4 translate-x-px text-title" />
            </span>
          </span>
        </div>
        <div className="px-4 py-3">
          <p className="line-clamp-2 text-small font-semibold leading-snug text-title">
            {ad.headline}
          </p>
          <p className="mt-0.5 text-tiny text-secondary">{ad.brand}</p>
        </div>
      </div>
    );
  }

  // 'card' — the default, and the fallback for a format missing its media.
  return (
    <div className={`flex h-full gap-4 p-5 ${banner ? 'items-center' : 'flex-col'}`}>
      {ad.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={ad.imageUrl}
          alt=""
          loading="lazy"
          decoding="async"
          className={
            banner
              ? 'size-14 shrink-0 rounded-media object-cover'
              : 'h-24 w-full rounded-media object-cover'
          }
        />
      ) : null}

      {/* With no artwork the copy centres in the space instead of sitting at
          the top of it: a 320×300 slot holding one headline and a button read
          as a half-empty box, which is not what the sponsor is paying for. */}
      <div
        className={`min-w-0 flex-1 ${
          ad.imageUrl || banner ? '' : 'flex flex-col justify-center'
        }`}
      >
        <p className="line-clamp-2 text-[15px] font-semibold leading-snug text-title">
          {ad.headline}
        </p>
        {ad.body && !banner ? (
          <p className="mt-1.5 line-clamp-2 text-small text-secondary">{ad.body}</p>
        ) : null}
        <p className="mt-2 flex min-w-0 items-center gap-1.5 text-tiny text-secondary">
          <span className="truncate font-semibold text-title">{ad.brand}</span>
          {ad.tag ? <span className="truncate">· {ad.tag}</span> : null}
        </p>
      </div>

      {ad.ctaLabel ? (
        <span className={`sp-btn sp-btn-sm shrink-0 ${banner ? '' : 'sp-btn-block'}`}>
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
                 rounded-panel bg-surface-100 p-5 text-center transition-colors
                 hover:bg-accent-soft"
    >
      <p className="sp-eyebrow">{kind === 'bid' ? 'First place' : 'This spot'}</p>
      <p className="sp-h4 font-semibold">Open</p>
      <p className="text-small text-secondary">
        <strong className="font-semibold text-title">{ask}</strong> takes it
      </p>
      <span className="mt-2 inline-flex items-center gap-1.5 text-tiny font-semibold text-accent-ink">
        Take it
        <ArrowRight className="size-3.5" />
      </span>
    </a>
  );
}
