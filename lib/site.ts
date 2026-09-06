export const site = {
  name: 'Advertise With Me',
  /** Whose work this platform exists to fund. */
  creator: 'Swarnil',
  creatorFull: 'Swarnil Singhai',
  tagline: 'Back the work, not the ad network.',
  description:
    'Advertise with me directly — a video, a newsletter issue, a post, or a month across everything. No ad network, no middleman, no tracking cookies.',
  url: 'https://imswarnil.com',
  /** The main site this platform belongs to — the navbar's way back. */
  owner: 'https://imswarnil.com',
  ownerLabel: 'imswarnil.com',
  blog: 'https://imswarnil.com/travel',
  github: 'https://github.com/imswarnil'
} as const;

/**
 * The surfaces a sponsor can actually appear on.
 *
 * `href` is the public home of that channel — leave it `null` and the UI simply
 * renders the channel without a link rather than a dead one. Fill these in as
 * the channels go live; nothing else needs to change.
 */
export type Channel = {
  key: string;
  label: string;
  /** lucide-react icon name, resolved in components/marketing/channel-icon.tsx */
  icon: string;
  /** What the channel is, in the creator's own voice. */
  blurb: string;
  /** What a sponsor actually gets on this surface. */
  placement: string;
  href: string | null;
  /** Not yet accepting sponsors — shown, but marked. */
  soon?: boolean;
};

export const channels: Channel[] = [
  {
    key: 'youtube',
    label: 'YouTube',
    icon: 'Youtube',
    blurb: 'Long-form videos on building things, travel and the occasional teardown.',
    placement: 'A read-out mention in the video, plus a link in the description.',
    href: null
  },
  {
    key: 'newsletter',
    label: 'Newsletter',
    icon: 'Mail',
    blurb: 'A written issue that lands in inboxes, not in a feed.',
    placement: 'A sponsored block inside an issue, written to read like the rest of it.',
    href: null
  },
  {
    key: 'blog',
    label: 'Blog',
    icon: 'PenLine',
    blurb: 'Essays and travelogues on imswarnil.com.',
    placement: 'The sidebar slot on every post — the one this whole platform serves.',
    href: site.blog
  },
  {
    key: 'instagram',
    label: 'Instagram',
    icon: 'Instagram',
    blurb: 'Photos and short-form from wherever I happen to be.',
    placement: 'A story mention or a post, credited plainly as sponsored.',
    href: null
  },
  {
    key: 'open-source',
    label: 'Open source',
    icon: 'Github',
    blurb: 'Projects I maintain in public, including the design system this site runs on.',
    placement: "A logo and link in the project's README and docs.",
    href: site.github
  }
];

/** Public nav. Single-tenant: everything here is about sponsoring the creator. */
export const marketingNav = [
  { label: 'The work', href: '/#channels' },
  { label: 'Placements', href: '/placements' },
  { label: 'How it works', href: '/how-it-works' }
] as const;

