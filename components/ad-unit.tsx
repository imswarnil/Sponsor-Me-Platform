import { formatPaise } from '@/lib/money';
import { youTubeThumb } from '@/lib/creative';
import { site } from '@/lib/site';
import type { RankedBid } from '@/lib/queries';

/**
 * THE AD UNIT — what a reader on one of the creator's sites actually sees.
 *
 * Built entirely from the design system's `.ad` layer, and that layer's rules
 * are not decoration:
 *
 *   · `.ad__label` is REQUIRED on every unit. A sponsored block that looks
 *     like an editorial card is a card that lies. The label is the same size
 *     as the page's other labels, because a disclosure smaller than the
 *     surrounding text is a disclosure designed not to be read.
 *   · The slot reserves its height before anything loads, so the host page
 *     never shifts underneath the reader.
 *   · Rank one is drawn large, two and three small and equal to each other —
 *     the whole point of the board is that there is one winner.
 *
 * Every link leaves through /api/click, which counts the click and then reads
 * the destination out of the database. The sponsor's URL is never placed in a
 * query string, because a redirector that forwards to its own parameters is an
 * open redirect on the creator's domain.
 */

function clickHref(bid: RankedBid) {
  return `/api/click?p=bid&id=${encodeURIComponent(bid.id)}`;
}

/** The image a creative should show, whatever kind it is. */
function artwork(bid: RankedBid): string | null {
  if (bid.imageUrl) return bid.imageUrl;
  if (bid.kind === 'video') return youTubeThumb(bid.videoUrl ?? bid.url);
  return null;
}

/** Rank one. The big unit. */
export function AdLarge({ bid, baseUrl = '' }: { bid: RankedBid; baseUrl?: string }) {
  const img = artwork(bid);

  return (
    <div className="ad ad-sponsored ad-first" data-ad-state="loaded">
      <p className="ad__label">
        <span>Sponsored</span>
        <span>{site.name}</span>
      </p>

      {/* The rank, on the unit itself. On a host page there is no leaderboard
          beside this to explain what "first" means, so the unit carries it. */}
      <span className="medal medal-1 ad__rank">1</span>

      <a
        className="ad__unit"
        href={`${baseUrl}${clickHref(bid)}`}
        target="_blank"
        rel="nofollow sponsored noopener"
      >
        {img ? (
          <div className="ad__thumb">
            {/* A plain <img>: this markup is rendered inside an iframe on
                somebody else's site, where next/image's loader and its origin
                do not exist. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img} alt="" loading="lazy" decoding="async" />
          </div>
        ) : null}

        <div className="ad__body">
          <p className="ad__title">{bid.headline}</p>
          {bid.body ? <p className="t-small t-muted t-clamp-2 m-0">{bid.body}</p> : null}
          <span className="ad__brand">
            <span className="dot dot-accent" aria-hidden />
            {bid.brand}
          </span>
        </div>

        {bid.ctaLabel ? <span className="btn btn-sm btn-primary ad__cta">{bid.ctaLabel}</span> : null}
      </a>
    </div>
  );
}

/** Ranks two and three. Small, and identical to each other. */
export function AdSmall({
  bid,
  baseUrl = ''
}: {
  bid: RankedBid;
  baseUrl?: string;
}) {
  const img = artwork(bid);

  return (
    <div className="ad ad-affiliate" data-ad-state="loaded">
      <p className="ad__label">
        <span>Sponsored</span>
        <span className={`medal medal-${bid.rank} medal-sm`}>{bid.rank}</span>
      </p>

      <a
        className="ad__unit"
        href={`${baseUrl}${clickHref(bid)}`}
        target="_blank"
        rel="nofollow sponsored noopener"
      >
        {/* No artwork means no thumb element at all. An empty `.ad__thumb`
            renders as a grey square, which reads as a broken image rather than
            as a deliberately text-only ad. */}
        {img ? (
          <div className="ad__thumb">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img} alt="" loading="lazy" decoding="async" />
          </div>
        ) : null}

        <div className="ad__body">
          <p className="ad__title">{bid.headline}</p>
          <span className="ad__brand truncate-1">{bid.brand}</span>
        </div>
      </a>
    </div>
  );
}

/**
 * The empty slot.
 *
 * Rendered when nobody holds a rank yet, and it is the most valuable unit on
 * the board rather than a fallback: an empty ad space that says what it costs
 * and where to buy it is how the first sponsor arrives. The design system's
 * `idle` state draws exactly this — a labelled, correctly-sized dashed box —
 * so the host page reserves the same height whether or not anything sold.
 */
export function AdEmpty({
  rank,
  minimum,
  baseUrl = ''
}: {
  rank: number;
  minimum: number;
  baseUrl?: string;
}) {
  return (
    <div className="ad ad-rect" data-ad-state="idle">
      <p className="ad__label">
        <span>Sponsor slot · #{rank}</span>
      </p>
      <a
        className="ad__slot t-no-underline"
        href={`${baseUrl || site.self}/?from=widget`}
        target="_blank"
        rel="noopener"
      >
        <p className="ad__note">
          This spot is open.
          <br />
          <strong className="t-default">{formatPaise(minimum)}</strong> takes it.
        </p>
      </a>
    </div>
  );
}

/**
 * THE BOARD — one large, two small, and a way in.
 *
 * `baseUrl` is set when this renders inside the embedded widget, where a
 * root-relative href would resolve against the *host* site rather than this
 * platform. On this platform's own pages it is empty and the links stay
 * relative.
 */
export function SponsorBoard({
  top,
  minimum,
  baseUrl = '',
  showFooter = true
}: {
  top: RankedBid[];
  minimum: number;
  baseUrl?: string;
  showFooter?: boolean;
}) {
  const [first, ...rest] = top;

  return (
    <div className="stack stack-sm">
      <div className={`board ${rest.length || !first ? 'board-split' : ''}`}>
        {first ? (
          <AdLarge bid={first} baseUrl={baseUrl} />
        ) : (
          <AdEmpty rank={1} minimum={minimum} baseUrl={baseUrl} />
        )}

        {/* Two and three always occupy their column, sold or not — a board
            that shrinks when nobody bought #3 tells every visitor that #3 is
            not worth buying. */}
        <div className="board__minors">
          {[2, 3].map((rank) => {
            const bid = rest.find((b) => b.rank === rank);
            return bid ? (
              <AdSmall key={rank} bid={bid} baseUrl={baseUrl} />
            ) : (
              <AdEmpty key={rank} rank={rank} minimum={minimum} baseUrl={baseUrl} />
            );
          })}
        </div>
      </div>

      {showFooter ? (
        <p className="t-fine t-faint text-center m-0">
          <a
            href={`${baseUrl || site.self}/?from=widget`}
            target="_blank"
            rel="noopener"
            className="t-no-underline"
          >
            Want the top spot? Outbid from {formatPaise(minimum)} →
          </a>
        </p>
      ) : null}
    </div>
  );
}
