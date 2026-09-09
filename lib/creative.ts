import { z } from 'zod';

/**
 * WHAT A SPONSOR IS ALLOWED TO SUBMIT.
 *
 * THE URL RULE IS THE IMPORTANT ONE. Every link a sponsor supplies ends up in
 * an `href` on the creator's own sites. `javascript:` in an href executes on
 * whatever page the ad is embedded in and `data:` can carry a whole document,
 * so both are blocked here, at the one door, by PARSING the URL and checking
 * its protocol against an allowlist — never by pattern-matching the string,
 * which loses to `java\tscript:` and to casing.
 */

const HTTP_ONLY = new Set(['http:', 'https:']);

export function safeUrl(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed);
    return HTTP_ONLY.has(parsed.protocol) ? parsed.toString() : null;
  } catch {
    return null;
  }
}

const optionalUrl = z
  .string()
  .trim()
  .max(2048)
  .optional()
  .transform((v) => (v ? safeUrl(v) : null));

const requiredUrl = z
  .string()
  .trim()
  .min(1, 'Where should this send people?')
  .max(2048)
  .transform((v) => safeUrl(v))
  .refine((v): v is string => v !== null, {
    message: 'Links must start with http:// or https://'
  });

/**
 * Lengths are capped because the unit reserves a fixed height on somebody
 * else's page. A 400-character headline does not overflow gracefully — it
 * pushes the host's layout around, which is the whole thing the reserved
 * height exists to prevent.
 *
 * `html` is capped hard as well: it is rendered into a sandboxed iframe, so it
 * cannot execute, but a megabyte of markup in every impression is still a bill
 * the creator pays.
 */
export const creativeSchema = z.object({
  format: z.enum(['card', 'image', 'video', 'html']),
  brand: z.string().trim().min(1, 'Who is this for?').max(40),
  tag: z.string().trim().max(24).optional().nullable(),
  headline: z.string().trim().max(80).default(''),
  body: z.string().trim().max(140).default(''),
  url: requiredUrl,
  imageUrl: optionalUrl,
  videoUrl: optionalUrl,
  ctaLabel: z.string().trim().max(24).optional().nullable(),
  html: z.string().trim().max(8000).optional().nullable()
});

export type Creative = z.infer<typeof creativeSchema>;

export function parseCreative(
  form: FormData
): { ok: true; value: Creative } | { ok: false; error: string } {
  const parsed = creativeSchema.safeParse({
    format: form.get('format') ?? 'card',
    brand: form.get('brand') ?? '',
    tag: form.get('tag') || null,
    headline: form.get('headline') ?? '',
    body: form.get('body') ?? '',
    url: form.get('url') ?? '',
    imageUrl: form.get('imageUrl') || undefined,
    videoUrl: form.get('videoUrl') || undefined,
    ctaLabel: form.get('ctaLabel') || null,
    html: form.get('html') || null
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  // A card with no headline is an empty box on somebody's site.
  if (parsed.data.format !== 'html' && !parsed.data.headline) {
    return { ok: false, error: 'Give it a headline.' };
  }
  if (parsed.data.format === 'html' && !parsed.data.html) {
    return { ok: false, error: 'Paste the HTML you want to run.' };
  }
  if (parsed.data.format === 'image' && !parsed.data.imageUrl) {
    return { ok: false, error: 'An image ad needs an image URL.' };
  }
  if (parsed.data.format === 'video' && !parsed.data.videoUrl) {
    return { ok: false, error: 'A video ad needs a YouTube link.' };
  }

  return { ok: true, value: parsed.data };
}

/**
 * A YouTube video id, or null.
 *
 * Only the id is needed: the unit renders the thumbnail, not the player. A
 * third-party iframe on every page of the network is a tracking surface and a
 * performance cost the creator did not agree to sell.
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
    const m = parsed.pathname.match(/^\/(?:embed|shorts)\/([\w-]{11})$/);
    if (m) return m[1];
  }
  return null;
}

export function youTubeThumb(url: string | null): string | null {
  const id = youTubeId(url);
  return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null;
}
