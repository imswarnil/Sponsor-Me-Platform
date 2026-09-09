/**
 * SPONSOR ME — the one place this app is configured.
 *
 * Single creator, single audience. Nothing here is seed data for anybody
 * else's install.
 */

export const site = {
  name: 'Sponsor Me',
  self: 'https://sponsor.imswarnil.com',
  creator: 'Swarnil',
  creatorFull: 'Swarnil Singhai',
  owner: 'https://imswarnil.com',
  ownerLabel: 'imswarnil.com',
  github: 'https://github.com/imswarnil',
  tagline: 'Get your thing in front of my people.',
  description:
    'Buy an ad slot on my sites, or fight for the top of a bid slot. Paste one tag, and it serves.'
} as const;

/** Every amount in this codebase is integer paise (lib/money.ts). */
export const CURRENCY = 'INR' as const;

/**
 * THE TWO KINDS OF SLOT. This is the whole product.
 *
 * A slot's `kind` decides who gets served, and nothing else about it changes.
 */
export const SLOT_KINDS = {
  fixed: {
    label: 'Buy it',
    tagline: 'One price. It is yours.',
    // Playful colour per kind, so the two are never confused at a glance.
    tone: 'teal'
  },
  bid: {
    label: 'Bid for it',
    tagline: 'Highest bid serves. Everyone else waits.',
    tone: 'craft'
  }
} as const;

export type SlotKind = keyof typeof SLOT_KINDS;

/** The shape a slot is drawn at, and the height the host page reserves. */
export const SHAPES = {
  card:   { label: 'Card',   w: 320, h: 300, note: 'A sidebar block.' },
  banner: { label: 'Banner', w: 728, h: 120, note: 'Wide, above or below content.' },
  rail:   { label: 'Rail',   w: 300, h: 600, note: 'A tall column.' }
} as const;

export type Shape = keyof typeof SHAPES;

/** What an ad can be made of. */
export const FORMATS = {
  card:  { label: 'Card',  emoji: '🃏', note: 'Headline, a line, a button.' },
  image: { label: 'Image', emoji: '🖼️', note: 'One image, linked.' },
  video: { label: 'Video', emoji: '📺', note: 'A YouTube video.' },
  html:  { label: 'HTML',  emoji: '⚡', note: 'Your own markup, sandboxed.' }
} as const;

export type Format = keyof typeof FORMATS;

/** How long a fixed slot is bought for. */
export type Term = { months: number; label: string; off?: string };

export const TERMS: Term[] = [
  { months: 1, label: '1 month' },
  { months: 3, label: '3 months', off: 'save 10%' },
  { months: 6, label: '6 months', off: 'save 20%' }
];

/** Multiplier per term. Longer is cheaper, and it is stated in one place. */
export function termPrice(pricePaise: number, months: number): number {
  const discount = months >= 6 ? 0.8 : months >= 3 ? 0.9 : 1;
  return Math.round(pricePaise * months * discount);
}
