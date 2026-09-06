/**
 * The sites a placement can run on.
 *
 * A *channel* (lib/channels.ts) is the kind of surface — a sidebar, a video, a
 * README. A *property* is which of my sites it runs on. They are orthogonal:
 * an `open-source` placement on `design.imswarnil.com` and one on
 * `trailblazer.imswarnil.com` are the same kind of thing in two different
 * places, and a sponsor deciding between them cares about the place.
 *
 * Stored in `bms_slot.property`. Nullable on purpose — every row written before
 * properties existed has no property, and `toProperty()` reads that as "across
 * everything" rather than guessing one.
 *
 * `live: false` means the host has no DNS record yet. Such a property is still
 * listed (it is real work, and a sponsor may well want it) but never rendered
 * as a link, because a dead link is worse than no link. Verified against
 * 1.1.1.1 on 2026-09-06 — re-check with `npm run check:hosts` before trusting.
 */

export type PropertyKind = 'site' | 'product' | 'course' | 'open-source' | 'profile';

export type PropertySpec = {
  key: string;
  label: string;
  /** The host it is served from — also how the folder under ~/Swarnil is named. */
  host: string;
  url: string;
  /** What the site is, in one line. */
  blurb: string;
  kind: PropertyKind;
  /** Has a DNS record today. `false` → listed, but not linked. */
  live: boolean;
};

export const PROPERTIES: PropertySpec[] = [
  {
    key: 'imswarnil',
    label: 'imswarnil.com',
    host: 'imswarnil.com',
    url: 'https://imswarnil.com',
    blurb: 'The personal site — essays, travelogues and everything else, on Ghost.',
    kind: 'site',
    live: true
  },
  {
    key: 'design',
    label: 'Design system',
    host: 'design.imswarnil.com',
    url: 'https://design.imswarnil.com',
    blurb: 'Frame & Signal — the open design system every one of these sites is built on.',
    kind: 'open-source',
    live: true
  },
  {
    key: 'theme',
    label: 'Ghost theme',
    host: 'theme.imswarnil.com',
    url: 'https://theme.imswarnil.com',
    blurb: 'A Ghost theme sold as a product, with its own docs site.',
    kind: 'product',
    live: true
  },
  {
    key: 'crmanalytics',
    label: 'CRM Analytics Academy',
    host: 'crmanalytics.imswarnil.com',
    url: 'https://crmanalytics.imswarnil.com',
    blurb: 'A free course on Salesforce CRM Analytics.',
    kind: 'course',
    live: true
  },
  {
    key: 'jobseekers',
    label: "Job Seeker's Guide",
    host: 'jobseekers.imswarnil.com',
    url: 'https://jobseekers.imswarnil.com',
    blurb: 'A guide for people looking for work in the Salesforce ecosystem.',
    kind: 'course',
    live: true
  },
  {
    key: 'salesforce',
    label: 'Passport Seva Kendra',
    host: 'salesforce.imswarnil.com',
    url: 'https://salesforce.imswarnil.com',
    blurb: 'A worked Salesforce build, written up end to end.',
    kind: 'course',
    live: true
  },
  {
    key: 'trailblazer',
    label: 'Trailblazer theme',
    host: 'trailblazer.imswarnil.com',
    url: 'https://trailblazer.imswarnil.com',
    blurb: 'An open-source Jekyll theme for the Salesforce community.',
    kind: 'open-source',
    live: true
  },
  {
    key: 'nac',
    label: 'No AI Content',
    host: 'nac.imswarnil.com',
    url: 'https://nac.imswarnil.com',
    blurb: 'A badge and a standard for work written by a person.',
    kind: 'open-source',
    live: true
  },
  {
    key: 'icons',
    label: 'Icons',
    host: 'icons.imswarnil.com',
    url: 'https://icons.imswarnil.com',
    blurb: 'An open icon set.',
    kind: 'open-source',
    live: true
  },
  {
    key: 'dev',
    label: 'dev.imswarnil.com',
    host: 'dev.imswarnil.com',
    url: 'https://dev.imswarnil.com',
    blurb: 'The older personal site, still up and still linked to.',
    kind: 'site',
    live: true
  },
  {
    key: 'links',
    label: 'Link index',
    host: 'links.imswarnil.com',
    url: 'https://links.imswarnil.com',
    blurb: 'One page linking every site, project and theme.',
    kind: 'site',
    live: false
  },
  {
    key: 'github',
    label: 'GitHub profile',
    host: 'github.com/imswarnil',
    url: 'https://github.com/imswarnil',
    blurb: 'The profile page and every repository behind these sites.',
    kind: 'profile',
    live: true
  }
];

/** Placements that aren't tied to one site — a newsletter issue, a video. */
export const ACROSS_EVERYTHING: PropertySpec = {
  key: 'everywhere',
  label: 'Across everything',
  host: 'imswarnil.com',
  url: 'https://imswarnil.com',
  blurb: 'Not tied to one site — runs wherever the channel does.',
  kind: 'site',
  live: true
};

export const PROPERTY_KEYS = PROPERTIES.map((p) => p.key);

/**
 * Read a stored `property` value. Null, empty and unrecognised all mean "across
 * everything" — a row written by an older build must never take a page down.
 */
export function toProperty(property: string | null | undefined): PropertySpec {
  if (!property) return ACROSS_EVERYTHING;
  return PROPERTIES.find((p) => p.key === property) ?? ACROSS_EVERYTHING;
}

export function isPropertyKey(value: unknown): value is string {
  return typeof value === 'string' && PROPERTY_KEYS.includes(value);
}

/** Only the ones a link can safely point at. */
export const LIVE_PROPERTIES = PROPERTIES.filter((p) => p.live);
