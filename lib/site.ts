export const site = {
  name: 'Sponsor Swarnil',
  /** This platform's own home. Not imswarnil.com — that is `owner` below. */
  self: 'https://sponsor.imswarnil.com',
  /** Whose work this platform exists to fund. */
  creator: 'Swarnil',
  creatorFull: 'Swarnil Singhai',
  tagline: 'Back the work, not the ad network.',
  description:
    'Sponsor my work directly — a placement on any of my sites, or a membership that puts you on the sponsor wall. No ad network, no middleman, no tracking cookies.',
  url: 'https://imswarnil.com',
  /** The main site this platform belongs to — the navbar's way back. */
  owner: 'https://imswarnil.com',
  ownerLabel: 'imswarnil.com',
  blog: 'https://imswarnil.com/travel',
  github: 'https://github.com/imswarnil',
  /** The recurring, no-negotiation door — see CLAUDE.md §10. */
  githubSponsors: 'https://github.com/sponsors/imswarnil',
  /** Routed to the same Worker, but 308s to `self` — see next.config.ts. */
  altHost: 'https://advertise.imswarnil.com'
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

/**
 * Public nav. Single-tenant: everything here is about sponsoring the creator.
 *
 * Ordered as the two doors are ordered everywhere else — the brand's page, then
 * the reader's — with the shared explainer last. "The work" was dropped: it was
 * an in-page anchor that only resolved on the homepage and read as a fifth
 * destination when it was really a scroll.
 */
export const marketingNav = [
  { label: 'Placements', href: '/placements' },
  { label: 'Members', href: '/members' },
  { label: 'How it works', href: '/how-it-works' }
] as const;

/**
 * Membership: bid once, hold the spot until someone bids more.
 *
 * A spot on the wall is a one-time bid from a floor. The wall orders members
 * by bid, highest first, with a 1st/2nd/3rd podium at the top and bigger
 * cards for it; a spot never expires and never renews — it is yours for good
 * until someone outbids you, and you can bid more at any time to move up.
 * That is the whole game, and /members says so in as many words.
 *
 * `minPoints` is the floor bid. It is the old fixed monthly price (the Ghost
 * "Sponsor" tier was ₹2,000), so nobody already on the wall moved when the
 * model changed. 1 point = ₹1 — see lib/money.ts.
 *
 * Membership is this site's own thing. It used to mirror into a comped Ghost
 * tier; Ghost is an independent platform and nobody's spot here depends on it
 * (CLAUDE.md §0). `presets` are the bid form's suggestions; the first is the
 * floor.
 */
export const membership = {
  minPoints: 2000,
  maxPoints: 1_000_000,
  presets: [2000, 5000, 10000]
} as const;

