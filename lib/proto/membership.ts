'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { eq, sql } from 'drizzle-orm';
import { z } from 'zod';

import { db } from './db';
import { members, notifications, profiles, txns } from './schema';
import { getCurrentUserId } from './queries';
import { getCreatorId } from './roles';
import { membership as cfg } from '@/lib/site';
import { formatAmount } from '@/lib/money';

/**
 * MEMBERSHIP — bid once, hold the spot until someone bids more
 * ============================================================
 *
 * Distinct from buying a placement. A placement is a specific spot for a
 * specific run, negotiated. A spot on the wall is a one-time bid from a floor
 * (lib/site.ts `membership.minPoints`): the wall is ordered by bid, highest
 * first, with a 1st/2nd/3rd podium and bigger cards at the top. A spot never
 * expires and never renews — it is yours for good until someone outbids you,
 * and `raiseBid` is how you move up. That is the whole game, and /members
 * says so in as many words.
 *
 * Membership is this site's own thing. It used to mirror into a comped Ghost
 * tier and read its price from there; Ghost is an independent platform now
 * (CLAUDE.md §0) — nobody's spot here depends on a blog answering.
 *
 * Payment is still preview credit (1 = ₹1, lib/money.ts). The whole money step
 * is `charge` below, so swapping in Dodo Payments touches one function.
 */

const profileSchema = z.object({
  displayName: z.string().trim().min(1, 'A name is needed.').max(60),
  // Stored without the @; accept it typed either way.
  instagramHandle: z
    .union([
      z
        .string()
        .trim()
        .regex(/^@?[A-Za-z0-9._]{1,30}$/, 'That is not an Instagram handle.'),
      z.literal('')
    ])
    .optional(),
  blurb: z.union([z.string().trim().max(80), z.literal('')]).optional(),
  linkUrl: z
    .union([
      z
        .string()
        .trim()
        .url()
        .refine((u) => /^https?:\/\//i.test(u), 'Only http(s) links.'),
      z.literal('')
    ])
    .optional(),
  avatarUrl: z
    .union([
      z
        .string()
        .trim()
        .url()
        .refine((u) => /^https?:\/\//i.test(u), 'Only http(s) links.'),
      z.literal('')
    ])
    .optional()
});

/** A bid: whole rupees, at or above the floor, below a ceiling that only
 *  exists so a typo cannot drain a balance in one click. */
const bidSchema = z.coerce.number().int().min(cfg.minPoints).max(cfg.maxPoints);

function cleanHandle(raw: string | undefined) {
  if (!raw) return null;
  const h = raw.replace(/^@/, '').trim();
  return h || null;
}

/**
 * Move the money.
 *
 * The entire payment step, isolated on purpose: today it debits preview
 * credit, and when Dodo lands this is the only place that changes. Returns
 * false when the member cannot afford it, so callers never half-complete.
 */
async function charge(uid: string, amount: number): Promise<boolean> {
  const creatorId = await getCreatorId();
  const rows = await db.select().from(profiles).where(eq(profiles.id, uid)).limit(1);
  if (!rows[0] || rows[0].points < amount) return false;

  // One HTTP round-trip, one server-side transaction. The Neon HTTP driver has
  // no `db.transaction` (no session to hold it open) — `batch` is its atomic
  // unit, so all of this lands or none of it does.
  const debit = db
    .update(profiles)
    .set({ points: sql`${profiles.points} - ${amount}` })
    .where(eq(profiles.id, uid));
  if (creatorId) {
    await db.batch([
      debit,
      db
        .update(profiles)
        .set({ points: sql`${profiles.points} + ${amount}` })
        .where(eq(profiles.id, creatorId)),
      db.insert(txns).values({ slotId: null, fromId: uid, toId: creatorId, amount })
    ]);
  } else {
    await debit;
  }
  return true;
}

async function notifyCreator(title: string, body: string) {
  const creatorId = await getCreatorId();
  if (!creatorId) return;
  await db.insert(notifications).values({
    userId: creatorId,
    type: 'system',
    title,
    body,
    href: '/studio/members'
  });
}

function revalidateWall() {
  // Every surface that draws the wall or its totals. /embed/wall is
  // force-dynamic and needs nothing.
  revalidatePath('/');
  revalidatePath('/members');
  revalidatePath('/studio/members');
  revalidatePath('/sponsor/membership');
}

/**
 * Take a spot on the wall, or retake one after leaving.
 *
 * Anyone can read the members page and fill this in; the sign-in wall is here,
 * at the point of paying — the same rule the offer flow follows.
 */
export async function joinAsMember(formData: FormData) {
  const uid = await getCurrentUserId();
  if (!uid) redirect('/login?next=/members/join');

  const parsed = profileSchema.safeParse({
    displayName: formData.get('displayName'),
    instagramHandle: formData.get('instagramHandle') || '',
    blurb: formData.get('blurb') || '',
    linkUrl: formData.get('linkUrl') || '',
    avatarUrl: formData.get('avatarUrl') || ''
  });
  if (!parsed.success) redirect('/members/join?e=invalid');

  const bid = bidSchema.safeParse(formData.get('amount'));
  if (!bid.success) redirect('/members/join?e=amount');

  const paid = await charge(uid, bid.data);
  if (!paid) redirect('/members/join?e=insufficient');

  const d = parsed.data;
  const values = {
    displayName: d.displayName,
    avatarUrl: d.avatarUrl || null,
    instagramHandle: cleanHandle(d.instagramHandle),
    blurb: d.blurb || null,
    linkUrl: d.linkUrl || null,
    tierName: 'Member',
    pricePoints: bid.data,
    status: 'active',
    // A retaken spot is a fresh arrival for the tie-break.
    startedAt: new Date()
  };

  await db
    .insert(members)
    .values({ profileId: uid, ...values })
    .onConflictDoUpdate({ target: members.profileId, set: values });

  await notifyCreator(
    `New bid: ${d.displayName}`,
    `${formatAmount(bid.data)}. They're on the sponsor wall.`
  );

  revalidateWall();
  redirect('/members?joined=1');
}

/**
 * Bid more — the move-up action.
 *
 * Charges the difference now; the new bid is what holds the spot from here
 * on. Only ever upward: lowering is leaving and rebidding, which keeps "who is
 * above whom" a question with exactly one answer. Arrival order is kept, so
 * bidding more never costs you a tie-break you already had.
 */
export async function raiseBid(formData: FormData) {
  const uid = await getCurrentUserId();
  if (!uid) redirect('/login?next=/sponsor/membership');

  const rows = await db.select().from(members).where(eq(members.profileId, uid)).limit(1);
  const m = rows[0];
  if (!m || m.status !== 'active') redirect('/sponsor/membership');

  const next = bidSchema.safeParse(formData.get('amount'));
  if (!next.success) redirect('/sponsor/membership?e=amount');
  if (next.data <= m.pricePoints) redirect('/sponsor/membership?e=notHigher');

  const paid = await charge(uid, next.data - m.pricePoints);
  if (!paid) redirect('/sponsor/membership?e=insufficient');

  // A raise is a new bid, so it takes a new timestamp: a tie goes to whoever
  // bid that amount first, and `rankForAmount` promises exactly that.
  await db
    .update(members)
    .set({ pricePoints: next.data, startedAt: new Date() })
    .where(eq(members.profileId, uid));

  await notifyCreator(
    `${m.displayName} bid more`,
    `Now ${formatAmount(next.data)}, from ${formatAmount(m.pricePoints)}.`
  );

  revalidateWall();
  redirect('/sponsor/membership?raised=1');
}

/** Edit how you appear on the wall. No payment. */
export async function updateMemberProfile(formData: FormData) {
  const uid = await getCurrentUserId();
  if (!uid) redirect('/login?next=/sponsor');

  const parsed = profileSchema.safeParse({
    displayName: formData.get('displayName'),
    instagramHandle: formData.get('instagramHandle') || '',
    blurb: formData.get('blurb') || '',
    linkUrl: formData.get('linkUrl') || '',
    avatarUrl: formData.get('avatarUrl') || ''
  });
  if (!parsed.success) redirect('/sponsor/membership?e=invalid');
  const d = parsed.data;

  await db
    .update(members)
    .set({
      displayName: d.displayName,
      instagramHandle: cleanHandle(d.instagramHandle),
      blurb: d.blurb || null,
      linkUrl: d.linkUrl || null,
      avatarUrl: d.avatarUrl || null
    })
    .where(eq(members.profileId, uid));

  revalidateWall();
  redirect('/sponsor/membership?ok=1');
}

/** Leave the wall. Rebidding later is a fresh bid at whatever amount. */
export async function leaveWall() {
  const uid = await getCurrentUserId();
  if (!uid) redirect('/login?next=/sponsor');

  await db.update(members).set({ status: 'lapsed' }).where(eq(members.profileId, uid));

  revalidateWall();
  redirect('/sponsor/membership?left=1');
}
