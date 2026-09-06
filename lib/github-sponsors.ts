import 'server-only';

/**
 * GitHub Sponsors, read-only.
 *
 * The second way someone can sponsor this work: the on-platform placements in
 * `bms_slot` are the first, and GitHub Sponsors is the recurring, no-negotiation
 * one for people who just want to chip in. This module only *reads* — nothing
 * here writes to the database, and a GitHub sponsor is not a `bms_*` row. The
 * two lists sit side by side on the page and stay separate underneath.
 *
 * Everything degrades to `null` rather than throwing or inventing: no token, a
 * revoked token, a rate limit, or GitHub being down all render as "the section
 * isn't there", never as a zero or a placeholder figure. That is the same rule
 * as CLAUDE.md §4's "no audience figures anywhere" — a number on this site is
 * either real or absent.
 *
 * Needs `GITHUB_TOKEN` (classic PAT or fine-grained, scope `read:user`) and
 * `GITHUB_LOGIN`. The token is server-only; it must never reach the browser.
 */

const ENDPOINT = 'https://api.github.com/graphql';

/** Long enough that a page load never waits on GitHub, short enough to feel live. */
const REVALIDATE_SECONDS = 900;

export type SponsorTier = {
  name: string;
  monthlyPriceInDollars: number;
  description: string | null;
  isOneTime: boolean;
  isCustomAmount: boolean;
};

export type Sponsor = {
  login: string;
  name: string | null;
  avatarUrl: string;
  url: string;
};

export type SponsorsListing = {
  login: string;
  profileUrl: string;
  avatarUrl: string;
  /** Where to send someone who wants to sponsor. */
  sponsorUrl: string;
  shortDescription: string | null;
  goal: { title: string; percentComplete: number } | null;
  tiers: SponsorTier[];
  sponsors: Sponsor[];
  sponsorCount: number;
};

const QUERY = `
  query SponsorsListing($login: String!) {
    user(login: $login) {
      login
      url
      avatarUrl
      hasSponsorsListing
      sponsorsListing {
        shortDescription
        isPublic
        activeGoal { title percentComplete }
        tiers(first: 20, orderBy: { field: MONTHLY_PRICE_IN_CENTS, direction: ASC }) {
          nodes {
            name
            monthlyPriceInDollars
            description
            isOneTime
            isCustomAmount
          }
        }
      }
      sponsors(first: 30) {
        totalCount
        nodes {
          __typename
          ... on User { login name avatarUrl url }
          ... on Organization { login name avatarUrl url }
        }
      }
    }
  }
`;

type GraphQLResponse = {
  data?: {
    user?: {
      login: string;
      url: string;
      avatarUrl: string;
      hasSponsorsListing: boolean;
      sponsorsListing: {
        shortDescription: string | null;
        isPublic: boolean;
        activeGoal: { title: string; percentComplete: number } | null;
        tiers: { nodes: (SponsorTier | null)[] };
      } | null;
      sponsors: { totalCount: number; nodes: (Sponsor | null)[] };
    } | null;
  };
  errors?: { message: string }[];
};

/**
 * The listing, or `null` if it can't be read or doesn't exist.
 *
 * A `null` here is not an error condition to surface — every caller treats it
 * as "don't render this section".
 */
export async function getGitHubSponsors(): Promise<SponsorsListing | null> {
  const token = process.env.GITHUB_TOKEN;
  const login = process.env.GITHUB_LOGIN;
  if (!token || !login) return null;

  let payload: GraphQLResponse;
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        // GitHub rejects GraphQL requests without one.
        'User-Agent': 'sponsor.imswarnil.com'
      },
      body: JSON.stringify({ query: QUERY, variables: { login } }),
      next: { revalidate: REVALIDATE_SECONDS }
    });
    if (!res.ok) return null;
    payload = (await res.json()) as GraphQLResponse;
  } catch {
    // Network failure, DNS, timeout — the page renders without the section.
    return null;
  }

  if (payload.errors?.length) return null;

  const user = payload.data?.user;
  if (!user || !user.hasSponsorsListing) return null;

  const listing = user.sponsorsListing;
  // A listing that exists but isn't public is not ours to advertise.
  if (!listing || !listing.isPublic) return null;

  return {
    login: user.login,
    profileUrl: user.url,
    avatarUrl: user.avatarUrl,
    sponsorUrl: `https://github.com/sponsors/${user.login}`,
    shortDescription: listing.shortDescription,
    goal: listing.activeGoal,
    tiers: (listing.tiers.nodes ?? []).filter((t): t is SponsorTier => t !== null),
    // Private sponsors come back as null nodes — dropping them is the point.
    sponsors: (user.sponsors.nodes ?? []).filter((s): s is Sponsor => s !== null && !!s.login),
    sponsorCount: user.sponsors.totalCount
  };
}
