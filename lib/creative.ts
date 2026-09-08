import { z } from 'zod';
import type { AdKind } from '@/lib/site';

/**
 * WHAT A SPONSOR IS ALLOWED TO PUT IN FRONT OF THE AUDIENCE.
 *
 * One schema, used by both products — a bid's creative and a booking's
 * creative are the same shape, so they get the same validation rather than two
 * copies that drift.
 *
 * THE URL RULE IS THE IMPORTANT ONE. Every link a sponsor supplies is
 * eventually rendered into an `href` on the creator's own sites. `javascript:`
 * in an href executes on whatever page the ad is embedded in; `data:` can
 * carry a whole HTML document. Both are blocked here, at the only door, by
 * parsing the URL and checking the protocol against an allowlist — never by
 * pattern-matching the string, which loses to `java\tscript:` and to casing.
 */

const HTTP_ONLY = new Set(['http:', 'https:']);

export function safeUrl(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return null;
  }
  if (!HTTP_ONLY.has(parsed.protocol)) return null;
  return parsed.toString();
}

/** A zod field for an optional sponsor-supplied link. */
const optionalUrl = z
  .string()
  .trim()
  .max(2048)
  .optional()
  .transform((v) => (v ? safeUrl(v) : null))
  .refine((v) => v === null || typeof v === 'string', {
    message: 'Links must start with http:// or https://'
  });

/**
 * A required link, with the same protocol rule. Written as its own field
 * rather than `optionalUrl.refine(Boolean)` so the message a sponsor sees says
 * which of the two things went wrong.
 */
const requiredUrl = z
  .string()
  .trim()
  .min(1, 'Where should this ad send people?')
  .max(2048)
  .transform((v) => safeUrl(v))
  .refine((v): v is string => v !== null, {
    message: 'Links must start with http:// or https://'
  });

export const adKindSchema = z.enum(['link', 'video', 'instagram', 'product', 'course']);

/**
 * Lengths are capped because the ad unit reserves a fixed height (the design
 * system's `--ad-h`), and a 400-character headline does not overflow gracefully
 * — it pushes the host site's layout around, which is precisely what the ad
 * layer exists to prevent.
 */
export const creativeSchema = z.object({
  kind: adKindSchema,
  brand: z.string().trim().min(1, 'Who is this ad for?').max(40),
  headline: z.string().trim().min(1, 'The ad needs a headline.').max(80),
  body: z.string().trim().max(140).default(''),
  url: requiredUrl,
  imageUrl: optionalUrl,
  videoUrl: optionalUrl,
  priceLabel: z.string().trim().max(24).optional().nullable(),
  ctaLabel: z.string().trim().max(24).optional().nullable()
});

export type Creative = z.infer<typeof creativeSchema>;

/** Parse a creative out of a FormData, returning either the value or a message. */
export function parseCreative(form: FormData):
  | { ok: true; value: Creative }
  | { ok: false; error: string } {
  const parsed = creativeSchema.safeParse({
    kind: form.get('kind') ?? 'link',
    brand: form.get('brand') ?? '',
    headline: form.get('headline') ?? '',
    body: form.get('body') ?? '',
    url: form.get('url') ?? '',
    imageUrl: form.get('imageUrl') ?? undefined,
    videoUrl: form.get('videoUrl') ?? undefined,
    priceLabel: form.get('priceLabel') ?? null,
    ctaLabel: form.get('ctaLabel') ?? null
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  return { ok: true, value: parsed.data };
}

/**
 * A YouTube video id, or null.
 *
 * The ad unit embeds a thumbnail rather than an iframe — a third-party iframe
 * on every page of the network is a tracking surface and a performance cost
 * the creator did not agree to sell. So all that is needed is the id, and
 * anything that is not recognisably a YouTube URL simply yields null and the
 * unit falls back to rendering as a link.
 */
export function youTubeId(url: string | null): string | null {
  if (!url) return null;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  const host = parsed.hostname.replace(/^www\./, '');
  if (host === 'youtu.be') {
    const id = parsed.pathname.slice(1);
    return /^[\w-]{11}$/.test(id) ? id : null;
  }
  if (host === 'youtube.com' || host === 'm.youtube.com') {
    const v = parsed.searchParams.get('v');
    if (v && /^[\w-]{11}$/.test(v)) return v;
    const embed = parsed.pathname.match(/^\/(?:embed|shorts)\/([\w-]{11})$/);
    if (embed) return embed[1];
  }
  return null;
}

/** The still for a video creative, straight from YouTube's image CDN. */
export function youTubeThumb(url: string | null): string | null {
  const id = youTubeId(url);
  return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null;
}

export function kindLabel(kind: string): string {
  const map: Record<AdKind, string> = {
    link: 'Link',
    video: 'Video',
    instagram: 'Instagram',
    product: 'Product',
    course: 'Course'
  };
  return map[kind as AdKind] ?? 'Link';
}
