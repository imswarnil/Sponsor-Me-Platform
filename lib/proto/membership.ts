'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { eq, sql } from 'drizzle-orm';
import { z } from 'zod';

import { db } from './db';
import { members, notifications, profiles, txns } from './schema';
import { getCurrentUserId } from './queries';
import { getCreatorId } from './roles';
import {
  getSponsorTier,
  grantGhostMembership,
  revokeGhostMembership,
  ghostAvatarFor
} from '@/lib/ghost-members';

/**
 * MEMBERSHIP — the fixed-price way to back the work
 * =================================================
 *
 * Distinct from buying a placement. A placement is a specific spot for a
 * specific run, negotiated. A membership is one fixed amount, and what you get
 * is a face on the public sponsor wall — plus a real paid membership on
 * imswarnil.com, because the two should not be separate things to keep track of.
 *
 * The Ghost mirror is best-effort by design (lib/ghost-members.ts): a member row
 * is written here whether or not Ghost answers, and `ghostMemberId` stays null
 * until a later call succeeds. Refusing someone's payment because a blog is
 * unreachable would be the worse failure.
 *
 * Payment is still points. The whole money step is `chargeForMembership` below,
 * so swapping in a real processor touches one function.
 */

/** One month. Memberships renew monthly, matching the Ghost tier's period. */
const PERIOD_DAYS = 30;

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

function cleanHandle(raw: string | undefined) {
  if (!raw) return null;
  const h = raw.replace(/^@/, '').trim();
  return h || null;
}

/**
 * Move the money for one period.
 *
 * The entire payment step, isolated on purpose: today it debits points, and
 * when Dodo lands this is the only place that changes. Returns false when the
 * member cannot afford it, so callers never half-complete a join.
 */
async function chargeForMembership(uid: string, amount: number): Promise<boolean> {
  const creatorId = await getCreatorId();
  const rows = await db.select().from(profiles).where(eq(profiles.id, uid)).limit(1);
  if (!rows[0] || rows[0].points < amount) return false;

  await db.transaction(async (tx) => {
    await tx
      .update(profiles)
      .set({ points: sql`${profiles.points} - ${amount}` })
      .where(eq(profiles.id, uid));
    if (creatorId) {
      await tx
        .update(profiles)
        .set({ points: sql`${profiles.points} + ${amount}` })
        .where(eq(profiles.id, creatorId));
      await tx.insert(txns).values({ slotId: null, fromId: uid, toId: creatorId, amount });
    }
  });
  return true;
}

/**
 * Join as a member, or renew an existing membership.
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

  const tier = await getSponsorTier();
  // Without Ghost we do not know the price, and inventing one would be charging
  // an amount nobody agreed to.
  if (!tier || tier.monthlyPrice == null) redirect('/members/join?e=unavailable');

  // Ghost holds money in the smallest unit; points are whole. ₹2000 → 2000 pts.
  const price = Math.round(tier.monthlyPrice / 100);

  const meRows = await db.select().from(profiles).where(eq(profiles.id, uid)).limit(1);
  const me = meRows[0];
  if (!me) redirect('/login?next=/members/join');

  const paid = await chargeForMembership(uid, price);
  if (!paid) redirect('/members/join?e=insufficient');

  const renewsAt = new Date(Date.now() + PERIOD_DAYS * 86_400_000);
  const d = parsed.data;

  // Ghost's own avatar (Gravatar-derived) beats an empty circle when the member
  // gives us no image of their own.
  const avatar = d.avatarUrl || (me.email ? await ghostAvatarFor(me.email) : null);

  const ghostId = me.email ? await grantGhostMembership(me.email, d.displayName) : null;

  const values = {
    displayName: d.displayName,
    avatarUrl: avatar || null,
    instagramHandle: cleanHandle(d.instagramHandle),
    blurb: d.blurb || null,
    linkUrl: d.linkUrl || null,
    tierName: tier.name,
    pricePoints: price,
    status: 'active',
    ghostMemberId: ghostId,
    renewsAt
  };

  await db
    .insert(members)
    .values({ profileId: uid, ...values })
    .onConflictDoUpdate({ target: members.profileId, set: values });

  const creatorId = await getCreatorId();
  if (creatorId) {
    await db.insert(notifications).values({
      userId: creatorId,
      type: 'system',
      title: `New member: ${d.displayName}`,
      body: `${tier.name} · ${price} pts. They're on the sponsor wall.`,
      href: '/studio/members'
    });
  }

  revalidatePath('/members');
  revalidatePath('/studio/members');
  redirect('/members?joined=1');
}

/** Edit how you appear on the wall. No payment, no Ghost change. */
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

  revalidatePath('/members');
  revalidatePath('/sponsor/membership');
  redirect('/sponsor/membership?ok=1');
}

/**
 * Stop a membership: off the wall here, back to `free` on Ghost.
 *
 * The Ghost member is not deleted — they may have subscribed to the newsletter
 * on their own, and lapsing a sponsorship is no reason to erase someone from a
 * mailing list.
 */
export async function cancelMembership() {
  const uid = await getCurrentUserId();
  if (!uid) redirect('/login?next=/sponsor');

  const rows = await db.select().from(members).where(eq(members.profileId, uid)).limit(1);
  const m = rows[0];
  if (!m) redirect('/sponsor/membership');

  const meRows = await db.select().from(profiles).where(eq(profiles.id, uid)).limit(1);
  if (m.ghostMemberId && meRows[0]?.email) {
    await revokeGhostMembership(m.ghostMemberId, meRows[0].email);
  }

  await db.update(members).set({ status: 'lapsed' }).where(eq(members.profileId, uid));

  revalidatePath('/members');
  revalidatePath('/sponsor/membership');
  redirect('/sponsor/membership?cancelled=1');
}
