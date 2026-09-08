import { slotFormatByKey } from '@/lib/site';
import type { Slot } from '@/lib/db/schema';

/**
 * THE LIVE PREVIEW — the real page, in a frame, scaled down.
 *
 * The most important element on the booking page. A sponsor about to pay for a
 * position should be looking at the actual page it appears on, at desktop
 * width, as it is right now — not at a screenshot that was true once, and not
 * at an artist's impression.
 *
 * WHY `transform: scale` AND NOT A NARROW IFRAME. An iframe 500px wide makes
 * the site inside it render its MOBILE layout, which is a different page from
 * the one being sold. The frame is laid out at 1280px and then scaled, so what
 * is on screen is the desktop design, shrunk.
 *
 * The sandbox is as tight as a preview can be: `allow-scripts` only, so the
 * page renders as it really does, but with no forms, no top-level navigation
 * and no same-origin access. `pointer-events: none` in the CSS means it cannot
 * be interacted with at all — this is a picture that happens to be live, and a
 * frame somebody could click around inside would be a browser-in-a-browser
 * nobody asked for.
 */
export function SlotPreview({ slot }: { slot: Slot }) {
  const format = slotFormatByKey(slot.format);

  if (!slot.previewUrl) {
    return (
      <div className="ad" data-ad-state="idle">
        <p className="ad__label">
          <span>Where it renders · {format.label}</span>
        </p>
        <div className="ad__slot" style={{ minBlockSize: '14rem' }}>
          <p className="ad__note">
            No preview page has been set for this slot yet.
            <br />
            It is a {format.label.toLowerCase()} at {format.size}.
          </p>
        </div>
      </div>
    );
  }

  return (
    <figure className="figure m-0">
      <div className="preview">
        <span className="preview__tag badge badge-quiet badge-sm">
          Live page · {new URL(slot.previewUrl).hostname}
        </span>
        <iframe
          className="preview__frame"
          src={slot.previewUrl}
          title={`Preview of ${slot.name}`}
          loading="lazy"
          referrerPolicy="no-referrer"
          sandbox="allow-scripts"
        />
      </div>
      <figcaption className="figure__caption t-fine t-faint">
        The real page, live, at desktop width. Your ad renders as a {format.label.toLowerCase()} (
        {format.size}) on it.
      </figcaption>
    </figure>
  );
}
