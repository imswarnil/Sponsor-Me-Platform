import 'server-only';
import { SignJWT } from 'jose';

/**
 * MEMBERSHIP, MIRRORED INTO GHOST
 * ===============================
 *
 * A member who backs the work here becomes a real member on imswarnil.com, and
 * stops being one when they stop paying. One payment, one membership — rather
 * than a supporter list on this site that the blog knows nothing about.
 *
 * The mechanism is Ghost's **comped tier**: we attach a paid tier to the member
 * without Stripe, which Ghost reports as `status: "comped"`. That is the honest
 * shape while payment here is still points — no money has moved through Ghost,
 * so claiming a Stripe subscription would be a lie in their dashboard. When
 * real payment lands, the same call sites swap comping for a subscription and
 * nothing else changes.
 *
 * Verified against the live install: creating a member with `tiers: [{id}]`
 * yields `status=comped`, and clearing `tiers` returns them to `free`.
 *
 * Every member we touch carries the `sponsor-platform` label, so anything this
 * app created can be found — and undone — without guessing.
 */

const LABEL = { name: 'sponsor-platform', slug: 'sponsor-platform' };

/** Which Ghost tier a membership mirrors. The site has one named "Sponsor". */
const TIER_NAME = process.env.GHOST_SPONSOR_TIER?.trim() || 'Sponsor';

export type GhostTier = {
  id: string;
  name: string;
  /** Ghost stores money in the smallest unit — paise for INR. */
  monthlyPrice: number | null;
  yearlyPrice: number | null;
  currency: string | null;
};

async function adminToken(): Promise<string | null> {
  const key = process.env.GHOST_ADMIN_API_KEY;
  if (!key || !key.includes(':')) return null;
  const [id, secret] = key.split(':');
  return new SignJWT({})
    .setProtectedHeader({ alg: 'HS256', kid: id, typ: 'JWT' })
    .setIssuedAt()
    .setExpirationTime('5m')
    .setAudience('/admin/')
    .sign(Buffer.from(secret, 'hex'));
}

/**
 * Every call returns null on failure rather than throwing.
 *
 * Ghost being down must never take this site down or block a payment: a member
 * row is created here either way and the mirror is retried. The alternative —
 * refusing someone's money because a blog is unreachable — is worse than a
 * membership that shows up on imswarnil.com a few minutes late.
 */
async function admin<T>(path: string, init?: RequestInit): Promise<T | null> {
  const base = process.env.GHOST_API_URL;
  const token = await adminToken();
  if (!base || !token) return null;

  try {
    const res = await fetch(`${base}/ghost/api/admin/${path}`, {
      ...init,
      headers: {
        Authorization: `Ghost ${token}`,
        'Accept-Version': 'v5.0',
        'content-type': 'application/json',
        ...(init?.headers ?? {})
      },
      cache: 'no-store'
    });
    if (!res.ok) return null;
    if (res.status === 204) return {} as T;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

type TiersResponse = {
  tiers: {
    id: string;
    name: string;
    type: string;
    active: boolean;
    monthly_price: number | null;
    yearly_price: number | null;
    currency: string | null;
  }[];
};

/** The tier a membership costs, read live from Ghost. Null if unreachable. */
export async function getSponsorTier(): Promise<GhostTier | null> {
  const data = await admin<TiersResponse>('tiers/?limit=all&include=monthly_price,yearly_price');
  if (!data) return null;

  const tier =
    data.tiers.find((t) => t.type === 'paid' && t.active && t.name === TIER_NAME) ??
    // Falling back to the cheapest active paid tier keeps the page working if
    // the tier is renamed in Ghost, rather than showing nothing.
    data.tiers
      .filter((t) => t.type === 'paid' && t.active)
      .sort((a, b) => (a.monthly_price ?? 0) - (b.monthly_price ?? 0))[0];

  if (!tier) return null;
  return {
    id: tier.id,
    name: tier.name,
    monthlyPrice: tier.monthly_price,
    yearlyPrice: tier.yearly_price,
    currency: tier.currency
  };
}

type MembersResponse = {
  members: { id: string; email: string; name: string | null; avatar_image: string | null; status: string }[];
};

/** The Ghost member with this email, if there is one. */
export async function findGhostMember(email: string) {
  const q = encodeURIComponent(`email:'${email.replace(/'/g, "\\'")}'`);
  const data = await admin<MembersResponse>(`members/?limit=1&filter=${q}&include=tiers`);
  return data?.members?.[0] ?? null;
}

/**
 * Make this person a comped member of the sponsor tier, creating them on Ghost
 * if they are new. Returns the Ghost member id, or null if Ghost was unreachable.
 *
 * Safe to call repeatedly — an existing member is updated, not duplicated.
 */
export async function grantGhostMembership(
  email: string,
  name: string
): Promise<string | null> {
  const tier = await getSponsorTier();
  if (!tier) return null;

  const existing = await findGhostMember(email);

  if (existing) {
    const updated = await admin<MembersResponse>(`members/${existing.id}/`, {
      method: 'PUT',
      body: JSON.stringify({ members: [{ email, tiers: [{ id: tier.id }], labels: [LABEL] }] })
    });
    return updated?.members?.[0]?.id ?? existing.id;
  }

  const created = await admin<MembersResponse>('members/', {
    method: 'POST',
    body: JSON.stringify({
      members: [{ email, name, tiers: [{ id: tier.id }], labels: [LABEL] }]
    })
  });
  return created?.members?.[0]?.id ?? null;
}

/**
 * End the mirrored membership: clear the tiers, which returns them to `free`.
 *
 * Deliberately does NOT delete the Ghost member. They may have subscribed to
 * the newsletter independently, and lapsing a sponsorship is no reason to erase
 * someone from the mailing list.
 */
export async function revokeGhostMembership(ghostMemberId: string, email: string) {
  await admin(`members/${ghostMemberId}/`, {
    method: 'PUT',
    body: JSON.stringify({ members: [{ email, tiers: [] }] })
  });
}

/** Ghost's avatar for this address — Gravatar-derived, so often present. */
export async function ghostAvatarFor(email: string): Promise<string | null> {
  const m = await findGhostMember(email);
  return m?.avatar_image ?? null;
}

/** Rupees (or whatever Ghost's currency is) from its smallest unit. */
export function formatTierPrice(tier: GhostTier): string {
  if (tier.monthlyPrice == null) return '';
  const major = tier.monthlyPrice / 100;
  const symbol = tier.currency === 'INR' ? '₹' : (tier.currency ?? '').toUpperCase() + ' ';
  return `${symbol}${major.toLocaleString()}`;
}
