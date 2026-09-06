/**
 * Ad "format" a creator picks when listing a placement — visual/preset only. It sets
 * sensible default dimensions and shows an advertiser what to prepare; it does NOT change
 * what the embed can actually serve (still only an image or text, see
 * app/embed/[publicId]/page.tsx) — a real video-ad pipeline is a separate, larger project.
 */
export const AD_TYPE_KEYS = ['banner', 'video', 'button', 'text'] as const;
export type AdTypeKey = (typeof AD_TYPE_KEYS)[number];

export type AdTypeSpec = {
  key: AdTypeKey;
  label: string;
  description: string;
  width: number;
  height: number;
  sizeLabel: string;
};

export const AD_TYPES: Record<AdTypeKey, AdTypeSpec> = {
  banner: {
    key: 'banner',
    label: 'Banner',
    description: 'A single image, like a billboard.',
    width: 300,
    height: 250,
    sizeLabel: '300×250'
  },
  video: {
    key: 'video',
    label: 'Video-style',
    description: 'A wide frame, styled like a video thumbnail.',
    width: 560,
    height: 315,
    sizeLabel: '560×315'
  },
  button: {
    key: 'button',
    label: 'Button',
    description: 'A short call-to-action, no image.',
    width: 200,
    height: 50,
    sizeLabel: '200×50'
  },
  text: {
    key: 'text',
    label: 'Text only',
    description: 'A single line, fits inline with content.',
    width: 300,
    height: 100,
    sizeLabel: 'fits inline'
  }
};

export const AD_TYPE_LIST: AdTypeSpec[] = AD_TYPE_KEYS.map((k) => AD_TYPES[k]);

export function isAdTypeKey(value: unknown): value is AdTypeKey {
  return typeof value === 'string' && (AD_TYPE_KEYS as readonly string[]).includes(value);
}
