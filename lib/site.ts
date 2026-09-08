/**
 * THE ONE PLACE THIS PLATFORM IS CONFIGURED.
 *
 * Single-tenant by design: one creator, one audience, one platform. Nothing
 * here is seed data for somebody else's install — never generalise it.
 *
 * TWO PRODUCTS, and keeping them distinct is the whole architecture:
 *
 *   SPONSORBID   A lifetime leaderboard, outbid-style. Highest amount is #1
 *                and renders large; #2 and #3 render as small cards beside it.
 *                Pay more, move up. A rank never expires and is never
 *                refunded — it is held until somebody outbids it.
 *
 *   SLOTS        Bookable inventory with a calendar. The creator makes a slot,
 *                prices it per month, and a brand books a window. When a slot
 *                is taken the next brand books the next open window rather
 *                than fighting over the current one.
 */

export const site = {
  name: 'SponsorBid',
  self: 'https://sponsor.imswarnil.com',
  creator: 'Swarnil',
  creatorFull: 'Swarnil Singhai',
  owner: 'https://imswarnil.com',
  ownerLabel: 'imswarnil.com',
  github: 'https://github.com/imswarnil',
  tagline: 'Put yourself in front of my audience.',
  description:
    'Bid for the top spot across everything I build, or book a slot on one site for a month. Live page views, live clicks, no ad network in the middle.'
} as const;

/**
 * CURRENCY — declared once.
 *
 * Every amount in this codebase is integer paise (lib/money.ts). Moving to
 * another currency means changing these two lines and the formatter, and
 * nothing else: no price is written down anywhere but here and the database.
 */
export const CURRENCY = 'INR' as const;

/**
 * THE BID LADDER — SponsorBid only.
 *
 * In paise. A bid is a lifetime total: pay again and it adds to what you have
 * already paid, which is how you climb. Because nothing is ever taken away,
 * nothing ever has to be refunded.
 */
export const bidRules = {
  /** The smallest total that gets you onto the board at all. ₹500. */
  floor: 50_000,
  /**
   * You must beat the rank above by at least this much to take it. Without a
   * step, two brands trade first place one paisa at a time, forever. ₹100.
   */
  step: 10_000,
  /** A sanity ceiling on any single payment. ₹5,00,000. */
  max: 50_000_000,
  /** Ranks that render as creative. 1 large, 2 and 3 small. The rest is a list. */
  rendered: 3
} as const;

/** Durations a slot can be booked for. Months, and the price is per month. */
export const bookingTerms = [
  { months: 1, label: '1 month' },
  { months: 3, label: '3 months' },
  { months: 6, label: '6 months' },
  { months: 12, label: '12 months' }
] as const;

/** A slot cannot be booked further out than this. Keeps the queue honest. */
export const MAX_BOOKING_MONTHS_AHEAD = 12;

/**
 * THE NETWORK — every surface an ad can run on.
 *
 * `live` means the host resolves today. A property that is not live is still
 * listed, because it is real and it is coming, but it is never rendered as a
 * link and never counted toward a reach figure.
 */
export type Property = {
  key: string;
  host: string;
  label: string;
  what: string;
  live: boolean;
};

export const properties: Property[] = [
  { key: 'imswarnil',    host: 'imswarnil.com',              label: 'imswarnil.com',           what: 'The personal site — essays, travel, teardowns.',      live: true },
  { key: 'design',       host: 'design.imswarnil.com',       label: 'Swarnil Design',          what: 'An open-source CSS design system and its docs.',      live: true },
  { key: 'crmanalytics', host: 'crmanalytics.imswarnil.com', label: 'CRM Analytics Academy',   what: 'A free Salesforce CRM Analytics course.',             live: true },
  { key: 'jobseekers',   host: 'jobseekers.imswarnil.com',   label: 'Job Seekers Guide',       what: 'Read by people in the middle of a job hunt.',         live: true },
  { key: 'salesforce',   host: 'salesforce.imswarnil.com',   label: 'Passport Seva Salesforce',what: 'A public Salesforce case study.',                     live: true },
  { key: 'trailblazer',  host: 'trailblazer.imswarnil.com',  label: 'Trailblazer Theme',       what: 'An open-source Jekyll theme for Salesforce writers.', live: true },
  { key: 'nac',          host: 'nac.imswarnil.com',          label: 'No AI Content',           what: 'A mark for human-written work.',                      live: true },
  { key: 'icons',        host: 'icons.imswarnil.com',        label: 'Swarnil Icons',           what: 'An open-source icon set.',                            live: true },
  { key: 'dev',          host: 'dev.imswarnil.com',          label: 'dev.imswarnil.com',       what: 'The older personal site, still linked to.',           live: true },
  { key: 'links',        host: 'links.imswarnil.com',        label: 'Links',                   what: 'The link-in-bio page.',                               live: false },
  { key: 'github',       host: 'github.com/imswarnil',       label: 'GitHub profile',          what: 'The profile README and every repo it lists.',         live: true }
];

export function propertyByKey(key: string | null | undefined): Property | null {
  if (!key) return null;
  return properties.find((p) => p.key === key) ?? null;
}

/**
 * WHAT A SPONSOR CAN PROMOTE.
 *
 * This changes what the ad unit draws, never where it runs. Every kind runs
 * everywhere.
 */
export type AdKind = 'link' | 'video' | 'instagram' | 'product' | 'course';

export const adKinds: { key: AdKind; label: string; blurb: string }[] = [
  { key: 'link',      label: 'A link',     blurb: 'A headline, a line of copy, a button. The plainest unit.' },
  { key: 'video',     label: 'A video',    blurb: 'A YouTube video, with its thumbnail and a play affordance.' },
  { key: 'instagram', label: 'Instagram',  blurb: 'Send people to a post or a profile.' },
  { key: 'product',   label: 'A product',  blurb: 'A product shot, a price, a buy button.' },
  { key: 'course',    label: 'A course',   blurb: 'A course, what it teaches, where to enrol.' }
];

/** The shape a slot renders in. Drives the ad classes and the reserved height. */
export type SlotFormat = 'rect' | 'leader' | 'sky' | 'inline' | 'card';

export const slotFormats: { key: SlotFormat; label: string; size: string; note: string }[] = [
  { key: 'rect',   label: 'Rectangle',   size: '300 × 250', note: 'A sidebar or in-article block.' },
  { key: 'leader', label: 'Leaderboard', size: '728 × 90',  note: 'A wide banner above or below the content.' },
  { key: 'sky',    label: 'Skyscraper',  size: '300 × 600', note: 'A tall rail.' },
  { key: 'inline', label: 'Inline',      size: 'fluid',     note: 'Flows with the text column, whatever width it is given.' },
  { key: 'card',   label: 'Card',        size: 'fluid',     note: 'A native card that sits with the host site.' }
];

export function slotFormatByKey(key: string): (typeof slotFormats)[number] {
  return slotFormats.find((f) => f.key === key) ?? slotFormats[0];
}
