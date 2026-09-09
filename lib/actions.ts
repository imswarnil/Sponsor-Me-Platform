'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '@/lib/db/client';
import { activity, ads, payments, profiles, slots } from '@/lib/db/schema';
import { requireCreator, requireSponsor } from '@/lib/roles';
import { parseCreative, safeUrl } from '@/lib/creative';
import { createCheckout, isDodoConfigured } from '@/lib/dodo';
import { CURRENCY, site, termPrice } from '@/lib/site';
import { askFor, slotById } from '@/lib/queries';

/**
 * EVERY WRITE.
 *
 * 1. THE SERVER PRICES EVERYTHING. No amount is read from a form. A fixed
 *    slot's total is its own row times a whitelisted term; a bid's minimum is
 *    the live leader plus the step. The browser chooses *what* to buy, never
 *    *for how much*.
 *
 * 2. NOTHING SERVES ON A REDIRECT. Starting a checkout writes a `pending`
 *    payment and nothing else. The ad activates when the signed webhook lands
 *    and at no other moment — a browser arriving at a success URL is not
 *    evidence that money moved.
 *
 * 3. `db.batch`, NEVER `db.transaction`. The neon-http driver throws the
 *    instant a transaction opens. `batch` sends the statements in one request
 *    and Neon commits them together. A batch cannot read mid-way, so every
 *    read and check happens first.
 */

export type ActionState = { error?: string; ok?: string };

const NOT_CONFIGURED =
  'Payments are not set up on this deployment yet. Set DODO_PAYMENTS_KEY_TEST_MODE and DODO_PRODUCT_ID.';

function origin() {
  return process.env.BASE_URL?.replace(/\/$/, '') || site.self;
}

/* ── Writing an ad ──────────────────────────────────────────────────────── */

/**
 * Create or update the ad this sponsor wants to run in a slot.
 *
 * Editing a `live` ad sends it back to `pending`. A sponsor who could edit an
 * approved ad would have a route to putting anything at all in front of the
 * audience: get something mild approved, then swap the copy. The money already
 * paid is untouched — they keep their position while it is re-reviewed.
 */
export async function saveAdAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const viewer = await requireSponsor();

  const slotId = z.string().uuid().safeParse(form.get('slotId'));
  if (!slotId.success) return { error: 'Unknown slot.' };

  const slot = await slotById(slotId.data);
  if (!slot || !slot.active) return { error: 'That slot is not for sale.' };

  const parsed = parseCreative(form);
  if (!parsed.ok) return { error: parsed.error };

  const [existing] = await db
    .select()
    .from(ads)
    .where(and(eq(ads.slotId, slot.id), eq(ads.profileId, viewer.id)))
    .limit(1);

  if (existing) {
    await db
      .update(ads)
      .set({
        ...parsed.value,
        // Paid-for ads go back for review; an unpaid draft stays a draft.
        status: existing.amountPaise > 0 ? 'pending' : 'draft',
        reviewNote: null,
        updatedAt: new Date()
      })
      .where(eq(ads.id, existing.id));
  } else {
    await db.insert(ads).values({
      slotId: slot.id,
      profileId: viewer.id,
      ...parsed.value,
      status: 'draft'
    });
  }

  revalidatePath('/me');
  revalidatePath(`/slot/${slot.publicId}`);
  return { ok: existing?.amountPaise ? 'Saved — back for review.' : 'Saved.' };
}

/* ── Buying / bidding ───────────────────────────────────────────────────── */

const purchase = z.object({
  slotId: z.string().uuid(),
  months: z.coerce.number().int().min(1).max(12).optional(),
  /** Bid slots only: what they typed, in whole rupees. A REQUEST, not a price. */
  rupees: z.coerce.number().int().positive().max(5_000_000).optional()
});

/**
 * Start a checkout.
 *
 * One action for both kinds of slot, because the only thing that differs is
 * how the amount is derived — and both derivations happen here, on the server,
 * from rows read in this same call.
 */
export async function startCheckoutAction(
  _prev: ActionState,
  form: FormData
): Promise<ActionState> {
  const viewer = await requireSponsor();
  if (!isDodoConfigured()) return { error: NOT_CONFIGURED };

  const parsed = purchase.safeParse({
    slotId: form.get('slotId'),
    months: form.get('months') || undefined,
    rupees: form.get('rupees') || undefined
  });
  if (!parsed.success) return { error: 'Something was missing. Try again.' };

  const slot = await slotById(parsed.data.slotId);
  if (!slot || !slot.active) return { error: 'That slot is not for sale.' };

  const [ad] = await db
    .select()
    .from(ads)
    .where(and(eq(ads.slotId, slot.id), eq(ads.profileId, viewer.id)))
    .limit(1);
  if (!ad || !ad.brand) return { error: 'Write your ad first — there is nothing to run yet.' };

  /* THE PRICE. Derived here, from the database, in every branch. */
  let amount: number;
  let months: number | null = null;

  if (slot.kind === 'bid') {
    const ask = await askFor(slot);
    const wanted = (parsed.data.rupees ?? 0) * 100;
    if (wanted < ask) {
      return {
        error: `The top spot needs at least ₹${Math.ceil(ask / 100).toLocaleString('en-IN')} right now.`
      };
    }
    amount = wanted;
  } else {
    months = parsed.data.months ?? 1;
    if (![1, 3, 6].includes(months)) return { error: 'Pick a length.' };
    amount = termPrice(slot.pricePaise, months);
  }

  if (amount <= 0) return { error: 'That slot has no price set.' };

  const [payment] = await db
    .insert(payments)
    .values({
      profileId: viewer.id,
      adId: ad.id,
      amountPaise: amount,
      currency: CURRENCY,
      status: 'pending'
    })
    .returning();

  let url: string | null = null;
  try {
    const session = await createCheckout({
      amountMinorUnits: amount,
      currency: CURRENCY,
      metadata: {
        kind: slot.kind === 'bid' ? 'bid' : 'booking',
        paymentId: payment.id,
        profileId: viewer.id
      },
      returnUrl: `${origin()}/me?paid=1`,
      customerEmail: viewer.email ?? '',
      customerName: viewer.brand || viewer.name || 'Sponsor'
    });
    url = session.checkoutUrl;
    await db
      .update(payments)
      .set({ dodoSessionId: session.sessionId })
      .where(eq(payments.id, payment.id));

    // Remember the term so the webhook can set an end date without re-deriving
    // it from a request that will not exist by then.
    if (months) {
      const endsAt = new Date();
      endsAt.setMonth(endsAt.getMonth() + months);
      await db.update(ads).set({ endsAt }).where(eq(ads.id, ad.id));
    }
  } catch (err) {
    await db.update(payments).set({ status: 'failed' }).where(eq(payments.id, payment.id));
    return { error: err instanceof Error ? err.message : 'Could not start the checkout.' };
  }

  if (!url) return { error: 'The payment provider did not return a checkout link.' };
  redirect(url);
}

/* ── The creator's writes ───────────────────────────────────────────────── */

const slotInput = z.object({
  name: z.string().trim().min(1, 'Give it a name.').max(60),
  blurb: z.string().trim().max(200).default(''),
  kind: z.enum(['fixed', 'bid']),
  shape: z.enum(['card', 'banner', 'rail']),
  priceRupees: z.coerce.number().int().min(1, 'Set a price.').max(5_000_000),
  stepRupees: z.coerce.number().int().min(1).max(100_000).optional()
});

function slugFor(name: string) {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 24);
  return `${base || 'slot'}-${Math.random().toString(36).slice(2, 6)}`;
}

export async function createSlotAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  await requireCreator();

  const parsed = slotInput.safeParse({
    name: form.get('name'),
    blurb: form.get('blurb') ?? '',
    kind: form.get('kind') ?? 'fixed',
    shape: form.get('shape') ?? 'card',
    priceRupees: form.get('priceRupees'),
    stepRupees: form.get('stepRupees') || undefined
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  await db.insert(slots).values({
    publicId: slugFor(parsed.data.name),
    name: parsed.data.name,
    blurb: parsed.data.blurb,
    kind: parsed.data.kind,
    shape: parsed.data.shape,
    pricePaise: parsed.data.priceRupees * 100,
    stepPaise: (parsed.data.stepRupees ?? 100) * 100,
    previewUrl: safeUrl(form.get('previewUrl'))
  });

  revalidatePath('/studio');
  revalidatePath('/');
  return { ok: 'Slot created. Copy the tag and paste it in.' };
}

export async function setSlotActiveAction(slotId: string, active: boolean): Promise<void> {
  await requireCreator();
  await db.update(slots).set({ active }).where(eq(slots.id, slotId));
  revalidatePath('/studio');
  revalidatePath('/');
}

export async function deleteSlotAction(slotId: string): Promise<void> {
  await requireCreator();
  await db.delete(slots).where(eq(slots.id, slotId));
  revalidatePath('/studio');
  revalidatePath('/');
}

/**
 * Approve or reject an ad.
 *
 * Approving is what actually puts it in front of readers — money alone never
 * does, which is why `contendersFor()` filters on `status = 'live'`.
 */
export async function reviewAdAction(
  adId: string,
  decision: 'live' | 'rejected',
  note?: string
): Promise<void> {
  await requireCreator();

  const [row] = await db
    .update(ads)
    .set({ status: decision, reviewNote: note?.trim() || null, updatedAt: new Date() })
    .where(eq(ads.id, adId))
    .returning();

  // Going live is public; a rejection is between the creator and that sponsor.
  if (row && decision === 'live' && !row.isHouse) {
    const [slot] = await db
      .select({ name: slots.name })
      .from(slots)
      .where(eq(slots.id, row.slotId))
      .limit(1);
    await db.insert(activity).values({
      kind: 'live',
      actor: row.brand || 'A sponsor',
      slotName: slot?.name ?? '',
      amountPaise: row.amountPaise
    });
  }

  revalidatePath('/studio');
  revalidatePath('/');
}
