'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { and, desc, eq, ne, sql } from 'drizzle-orm';
import { z } from 'zod';

import { db } from './db';
import { notifications, offers, profiles, slots, sponsorshipHistory, txns } from './schema';
import { getCurrentUserId } from './queries';
import { requireCreator } from './roles';
import { toChannel } from '@/lib/channels';

/**
 * OFFERS — "make an offer, I decide"
 * ==================================
 *
 * Not an auction. Anyone may propose a price and a run; the creator accepts one
 * or declines it. There is no deadline and no automatic winner, because the
 * final say over who appears on a personal site belongs to the person whose
 * site it is — which is exactly what an auction gives away.
 *
 * Browsing and composing an offer need no account. The sign-in wall sits at the
 * moment of submission, which is the first point where the answer has to be
 * attached to a person who can be paid, notified and held to it.
 */

const httpUrl = z
  .string()
  .trim()
  .url()
  .refine((u) => /^https?:\/\//i.test(u), 'Only http(s) links are stored.');

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'invalid date');

const offerSchema = z.object({
  publicId: z.string().trim().min(1).max(40),
  pricePoints: z.coerce.number().int().min(1).max(1_000_000),
  startDate: isoDate,
  endDate: isoDate,
  message: z.union([z.string().trim().max(500), z.literal('')]).optional(),
  headline: z.string().trim().min(1).max(80),
  imageUrl: z.union([httpUrl, z.literal('')]).optional(),
  linkUrl: httpUrl,
  ctaLabel: z.union([z.string().trim().max(24), z.literal('')]).optional()
});

function atUtcMidnight(day: string) {
  return new Date(`${day}T00:00:00.000Z`);
}

function daysBetween(start: Date, end: Date) {
  return Math.round((end.getTime() - start.getTime()) / 86_400_000);
}

export async function makeOffer(formData: FormData) {
  const publicIdRaw = String(formData.get('publicId') || '');
  const uid = await getCurrentUserId();

  // The wall is here and nowhere earlier: everything up to this point — the
  // catalogue, the slot page, filling this form in — is open to anyone.
  if (!uid) redirect(`/login?next=/s/${encodeURIComponent(publicIdRaw)}`);

  const parsed = offerSchema.safeParse({
    publicId: formData.get('publicId'),
    pricePoints: formData.get('pricePoints'),
    startDate: formData.get('startDate'),
    endDate: formData.get('endDate'),
    message: formData.get('message') || '',
    headline: formData.get('headline'),
    imageUrl: formData.get('imageUrl') || '',
    linkUrl: formData.get('linkUrl'),
    ctaLabel: formData.get('ctaLabel') || ''
  });
  if (!parsed.success) redirect(`/s/${encodeURIComponent(publicIdRaw)}?e=invalid`);
  const d = parsed.data;

  const slotRows = await db.select().from(slots).where(eq(slots.publicId, d.publicId)).limit(1);
  const slot = slotRows[0];
  if (!slot || slot.archived) redirect('/placements');
  if (slot.ownerId === uid) redirect(`/s/${d.publicId}?e=own`);

  const start = atUtcMidnight(d.startDate);
  const end = atUtcMidnight(d.endDate);
  const today = atUtcMidnight(new Date().toISOString().slice(0, 10));
  const days = daysBetween(start, end);
  if (start.getTime() < today.getTime() || days < 3 || days > 90) {
    redirect(`/s/${d.publicId}?e=dates`);
  }

  // An offer is a promise to pay. Checking the balance now means an accepted
  // offer cannot fail at the moment the creator clicks accept.
  const meRows = await db.select().from(profiles).where(eq(profiles.id, uid)).limit(1);
  if (!meRows[0] || meRows[0].points < d.pricePoints) {
    redirect(`/s/${d.publicId}?e=insufficient`);
  }

  await db.insert(offers).values({
    slotId: slot.id,
    sponsorId: uid,
    pricePoints: d.pricePoints,
    startDate: start,
    endDate: end,
    message: d.message || null,
    adHeadline: d.headline,
    adImageUrl: d.imageUrl || null,
    adLinkUrl: d.linkUrl,
    adCtaLabel: d.ctaLabel || null
  });

  await db.insert(notifications).values({
    userId: slot.ownerId,
    type: 'offer',
    title: `New offer on "${slot.name}"`,
    body: `${meRows[0].name || 'Someone'} offered ${d.pricePoints} pts for ${days} days.`,
    href: '/studio/offers'
  });

  revalidatePath('/studio/offers');
  revalidatePath(`/s/${d.publicId}`);
  redirect(`/sponsor?offered=${encodeURIComponent(d.publicId)}`);
}

/**
 * Accept an offer: move the points, book the slot, write the ledger row, and
 * decline every other pending offer on that slot in the same transaction.
 *
 * All of it or none of it. A half-applied acceptance — points taken but the
 * slot not booked, or two offers both "accepted" — is the failure that actually
 * costs someone money.
 */
export async function acceptOffer(formData: FormData) {
  const me = await requireCreator('/studio/offers');
  const offerId = String(formData.get('offerId') || '');

  const rows = await db.select().from(offers).where(eq(offers.id, offerId)).limit(1);
  const offer = rows[0];
  if (!offer || offer.status !== 'pending') redirect('/studio/offers?e=gone');

  const slotRows = await db.select().from(slots).where(eq(slots.id, offer.slotId)).limit(1);
  const slot = slotRows[0];
  if (!slot || slot.ownerId !== me.id) redirect('/studio/offers');
  if (slot.status === 'sponsored') redirect('/studio/offers?e=taken');

  const sponsorRows = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, offer.sponsorId))
    .limit(1);
  const sponsor = sponsorRows[0];
  // Balances move between an offer and its acceptance. Re-check rather than
  // trusting the check made when it was submitted.
  if (!sponsor || sponsor.points < offer.pricePoints) redirect('/studio/offers?e=insufficient');

  const days = daysBetween(offer.startDate, offer.endDate);

  await db.transaction(async (tx) => {
    await tx
      .update(profiles)
      .set({ points: sql`${profiles.points} - ${offer.pricePoints}` })
      .where(eq(profiles.id, offer.sponsorId));
    await tx
      .update(profiles)
      .set({ points: sql`${profiles.points} + ${offer.pricePoints}` })
      .where(eq(profiles.id, slot.ownerId));
    await tx.insert(txns).values({
      slotId: slot.id,
      fromId: offer.sponsorId,
      toId: slot.ownerId,
      amount: offer.pricePoints
    });

    await tx
      .update(slots)
      .set({
        status: 'sponsored',
        sponsorId: offer.sponsorId,
        adHeadline: offer.adHeadline,
        adImageUrl: offer.adImageUrl,
        adLinkUrl: offer.adLinkUrl,
        adCtaLabel: offer.adCtaLabel,
        sponsoredWeeks: Math.max(1, Math.round(days / 7)),
        sponsoredStart: offer.startDate,
        sponsoredUntil: offer.endDate
      })
      .where(eq(slots.id, slot.id));

    await tx.insert(sponsorshipHistory).values({
      slotId: slot.id,
      ownerId: slot.ownerId,
      sponsorId: offer.sponsorId,
      slotName: slot.name,
      channel: toChannel(slot.placement).key,
      headline: offer.adHeadline ?? '',
      imageUrl: offer.adImageUrl,
      linkUrl: offer.adLinkUrl ?? '',
      ctaLabel: offer.adCtaLabel,
      brief: null,
      socials: null,
      amount: offer.pricePoints,
      startAt: offer.startDate,
      endAt: offer.endDate
    });

    await tx
      .update(offers)
      .set({ status: 'accepted', decidedAt: new Date() })
      .where(eq(offers.id, offer.id));

    // The slot is gone; every other bid on it is answered by that fact.
    await tx
      .update(offers)
      .set({ status: 'declined', decidedAt: new Date() })
      .where(
        and(eq(offers.slotId, slot.id), eq(offers.status, 'pending'), ne(offers.id, offer.id))
      );

    await tx.insert(notifications).values({
      userId: offer.sponsorId,
      type: 'sponsored',
      title: `Your offer on "${slot.name}" was accepted`,
      body: `${offer.pricePoints} pts for ${days} days. It's live.`,
      href: '/sponsor'
    });
  });

  revalidatePath('/studio/offers');
  revalidatePath('/studio');
  revalidatePath('/placements');
  redirect('/studio/offers?ok=accepted');
}

export async function declineOffer(formData: FormData) {
  const me = await requireCreator('/studio/offers');
  const offerId = String(formData.get('offerId') || '');

  const rows = await db.select().from(offers).where(eq(offers.id, offerId)).limit(1);
  const offer = rows[0];
  if (!offer || offer.status !== 'pending') redirect('/studio/offers');

  const slotRows = await db.select().from(slots).where(eq(slots.id, offer.slotId)).limit(1);
  if (!slotRows[0] || slotRows[0].ownerId !== me.id) redirect('/studio/offers');

  await db
    .update(offers)
    .set({ status: 'declined', decidedAt: new Date() })
    .where(eq(offers.id, offer.id));

  await db.insert(notifications).values({
    userId: offer.sponsorId,
    type: 'system',
    title: `Your offer on "${slotRows[0].name}" wasn't taken up`,
    body: 'The placement is still open — you can make another offer.',
    href: `/s/${slotRows[0].publicId}`
  });

  revalidatePath('/studio/offers');
  redirect('/studio/offers?ok=declined');
}

/** A sponsor withdrawing their own pending offer. */
export async function withdrawOffer(formData: FormData) {
  const uid = await getCurrentUserId();
  if (!uid) redirect('/login?next=/sponsor');
  const offerId = String(formData.get('offerId') || '');

  await db
    .update(offers)
    .set({ status: 'withdrawn', decidedAt: new Date() })
    .where(and(eq(offers.id, offerId), eq(offers.sponsorId, uid), eq(offers.status, 'pending')));

  revalidatePath('/sponsor');
  redirect('/sponsor?ok=withdrawn');
}
