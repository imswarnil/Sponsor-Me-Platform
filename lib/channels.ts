/**
 * The surfaces a placement can run on.
 *
 * These keys are stored in `bms_slot.placement` — the column already existed and
 * already meant "where this goes", so the channel needs no migration. Rows
 * created before channels existed hold the legacy value `sidebar`, which
 * `toChannel()` maps to `blog` (the sidebar slot has always been the blog's).
 */
export const CHANNEL_KEYS = [
  'blog',
  'youtube',
  'newsletter',
  'instagram',
  'open-source',
  'ambassador'
] as const;

export type ChannelKey = (typeof CHANNEL_KEYS)[number];

export type ChannelSpec = {
  key: ChannelKey;
  label: string;
  /** lucide-react icon name — see components/marketing/channel-icon.tsx */
  icon: string;
  /** What a sponsor gets on this surface. */
  placement: string;
  /**
   * What the buyer is really buying for one week. Everything is priced per
   * week and runs for a whole number of weeks — the mechanic is the same
   * everywhere, only the promise differs.
   */
  unit: string;
  /**
   * Whether this channel serves through the embeddable widget. Only an
   * embeddable channel gets a script snippet, a size, and live view/click
   * counts; the rest are placed by hand and have no automatic telemetry.
   */
  embeddable: boolean;
};

export const CHANNELS: Record<ChannelKey, ChannelSpec> = {
  blog: {
    key: 'blog',
    label: 'Blog',
    icon: 'PenLine',
    placement: 'The sidebar slot on every post.',
    unit: 'Runs on every post published that week.',
    embeddable: true
  },
  youtube: {
    key: 'youtube',
    label: 'YouTube',
    icon: 'Youtube',
    placement: 'A read-out mention in the video, plus a link in the description.',
    unit: 'Covers any video that ships that week.',
    embeddable: false
  },
  newsletter: {
    key: 'newsletter',
    label: 'Newsletter',
    icon: 'Mail',
    placement: 'A sponsored block inside an issue, written to read like the rest of it.',
    unit: 'Covers any issue that ships that week.',
    embeddable: false
  },
  instagram: {
    key: 'instagram',
    label: 'Instagram',
    icon: 'Instagram',
    placement: 'A story mention or a post, credited plainly as sponsored.',
    unit: 'One story or post that week.',
    embeddable: false
  },
  'open-source': {
    key: 'open-source',
    label: 'Open source',
    icon: 'Github',
    placement: "A logo and link in the project's README and docs.",
    unit: 'Listed for the whole week.',
    embeddable: false
  },
  ambassador: {
    key: 'ambassador',
    label: 'Ambassador',
    icon: 'Megaphone',
    placement:
      'A shout-out for me on your own Instagram, LinkedIn, X, or Facebook — your words, your account, no ad design needed.',
    unit: 'One post or story, credited plainly as sponsoring me.',
    embeddable: false
  }
};

export const CHANNEL_LIST: ChannelSpec[] = CHANNEL_KEYS.map((k) => CHANNELS[k]);

/**
 * Read a stored `placement` value as a channel. Unknown and legacy values fall
 * back to `blog` rather than throwing — a row written by an older build must
 * never take a page down.
 */
export function toChannel(placement: string | null | undefined): ChannelSpec {
  if (!placement) return CHANNELS.blog;
  const key = placement.toLowerCase();
  if (key in CHANNELS) return CHANNELS[key as ChannelKey];
  return CHANNELS.blog; // legacy 'sidebar', and anything else unrecognised
}

export function isChannelKey(value: unknown): value is ChannelKey {
  return typeof value === 'string' && (CHANNEL_KEYS as readonly string[]).includes(value);
}
