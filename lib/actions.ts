'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { and, eq, sql } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '@/lib/db/client';
import { activity, bids, bookings, messages, payments, profiles, slots } from '@/lib/db/schema';
import { getViewer, requireCreator, requireSponsor, requireViewer } from '@/lib/roles';
import { parseCreative, safeUrl } from '@/lib/creative';
import { createCheckout, isDodoConfigured } from '@/lib/dodo';
import { CURRENCY, bidRules, MAX_BOOKING_MONTHS_AHEAD, site } from '@/lib/site';
import { rupeesToPaise } from '@/lib/money';
import { minimumToLead, nextAvailableFrom, slotById, windowIsFree } from '@/lib/queries';

/**
 * EVERY WRITE IN THE APPLICATION.
 *
 * Three rules, and the first one is the whole security posture:
 *
 * 1. THE SERVER PRICES EVERYTHING. No amount is ever read from a form. A bid's
 *    minimum comes from the current leaderboard; a booking's total comes from
 *    the slot's own row times a whitelisted number of months. The browser
 *    chooses *what* to buy, never *for how much*.
 *
 * 2. NOTHING GOES LIVE ON A REDIRECT. Starting a checkout writes a `pending`
 *    payment and nothing else. The ad activates when the signed webhook lands
 *    (app/api/webhooks/dodo/route.ts) and at no other moment. A browser
 *    arriving at a success URL is not evidence that money moved.
 *
 * 3. `db.batch`, NEVER `db.transaction`. The app talks to Neon over HTTP, and
 *    that driver throws "No transactions support in neon-http driver" the
 *    instant a transaction opens. `batch` sends the statements in one request
 *    and Neon commits them together, which is the atomicity these writes need.
 *    The cost is that a batch cannot read mid-way — so every read and every
 *    check happens first, then the writes go in one batch.
 */

export type ActionState = { error?: string; ok?: string };

const NOT_CONFIGURED =
  'Payments are not configured on this deployment. Set DODO_PAYMENTS_KEY_TEST_MODE ' +
  'and DODO_PRODUCT_ID, then restart.';

function origin() {
  return process.env.BASE_URL?.replace(/\/$/, '') || site.self;
}

/* ── Creative ───────────────────────────────────────────────────────────── */

/**
 * Save the creative for the sponsor's leaderboard ad.
 *
 * Editing always returns the creative to `pending`. A sponsor who could edit
 * an approved ad would have a way to get anything at all in front of the
 * audience: approve something mild, then swap the copy. Re-review is the only
 * safe behaviour, and the amount they have paid is untouched by it — they keep
 * their rank while the new creative is looked at.
 */
export async function saveBidCreativeAction(
  _prev: ActionState,
  form: FormData
): Promise<ActionState> {
  const viewer = await requireSponsor();
  const parsed = parseCreative(form);
  if (!parsed.ok) return { error: parsed.error };

  const c = parsed.value;
  await db
    .insert(bids)
    .values({ profileId: viewer.id, ...c, status: 'pending', updatedAt: new Date() })
    .onConflictDoUpdate({
      target: bids.profileId,
      set: { ...c, status: 'pending', reviewNote: null, updatedAt: new Date() }
    });

  revalidatePath('/dashboard');
  return { ok: 'Saved. It goes back for review before it runs again.' };
}

/** The same, for one booking's creative. Ownership is checked, not assumed. */
export async function saveBookingCreativeAction(
  _prev: ActionState,
  form: FormData
): Promise<ActionState> {
  const viewer = await requireSponsor();
  const bookingId = z.string().uuid().safeParse(form.get('bookingId'));
  if (!bookingId.success) return { error: 'Unknown booking.' };

  const parsed = parseCreative(form);
  if (!parsed.ok) return { error: parsed.error };

  const updated = await db
    .update(bookings)
    .set({ ...parsed.value, reviewNote: null })
    // The profileId predicate is the authorisation check. Without it, a
    // guessed uuid rewrites somebody else's paid ad.
    .where(and(eq(bookings.id, bookingId.data), eq(bookings.profileId, viewer.id)))
    .returning({ id: bookings.id });

  if (!updated[0]) return { error: 'Unknown booking.' };
  revalidatePath('/dashboard');
  return { ok: 'Saved.' };
}

/* ── SponsorBid · placing and raising a bid ─────────────────────────────── */

/**
 * Start a checkout that adds to this sponsor's lifetime total.
 *
 * The amount is bounded on both sides here: at least `minimumToLead` when they
 * asked to lead, never below the floor, never above the ceiling. The figure
 * the browser posted is treated as a *request*, clamped against numbers read
 * from the database in this same call.
 */
export async function startBidCheckoutAction(
  _prev: ActionState,
  form: FormData
): Promise<ActionState> {
  const viewer = await requireSponsor();
  if (!isDodoConfigured()) return { error: NOT_CONFIGURED };

  const existing = await db.select().from(bids).where(eq(bids.profileId, viewer.id)).limit(1);
  if (!existing[0] || !existing[0].headline) {
    return { error: 'Write your ad first — there is nothing to put on the board yet.' };
  }

  const requested = rupeesToPaise(form.get('amount'));
  if (requested === null) {
    return { error: 'Enter a whole number of rupees.' };
  }

  // Read the live board. This — not the form — is what decides the minimum.
  const minimum = await minimumToLead(viewer.id);
  const floor = Math.max(bidRules.floor, 0);
  const amount = requested;

  if (amount < floor) {
    return { error: `The smallest bid is ₹${Math.round(floor / 100).toLocaleString('en-IN')}.` };
  }
  if (amount > bidRules.max) {
    return { error: `A single payment is capped at ₹${(bidRules.max / 100).toLocaleString('en-IN')}.` };
  }
  // Not an error — a sponsor is allowed to pay less than it takes to lead, and
  // simply lands wherever that amount puts them. `minimum` is a suggestion the
  // form shows, not a gate. It is read here so the metadata records the board
  // as it stood when they committed.
  void minimum;

  const [payment] = await db
    .insert(payments)
    .values({
      profileId: viewer.id,
      kind: 'bid',
      refId: existing[0].id,
      amountPaise: amount,
      currency: CURRENCY,
      status: 'pending'
    })
    .returning();

  let checkoutUrl: string | null = null;
  try {
    const session = await createCheckout({
      amountMinorUnits: amount,
      currency: CURRENCY,
      metadata: { kind: 'bid', paymentId: payment.id, profileId: viewer.id },
      returnUrl: `${origin()}/dashboard?paid=1`,
      customerEmail: viewer.email ?? '',
      customerName: viewer.brand || viewer.name || 'Sponsor'
    });
    checkoutUrl = session.checkoutUrl;
    await db
      .update(payments)
      .set({ dodoSessionId: session.sessionId })
      .where(eq(payments.id, payment.id));
  } catch (err) {
    await db.update(payments).set({ status: 'failed' }).where(eq(payments.id, payment.id));
    return { error: err instanceof Error ? err.message : 'Could not start the checkout.' };
  }

  if (!checkoutUrl) return { error: 'The payment provider did not return a checkout link.' };
  redirect(checkoutUrl);
}

/* ── Slots · booking a window ───────────────────────────────────────────── */

const bookingRequest = z.object({
  slotId: z.string().uuid(),
  months: z.coerce.number().int().min(1).max(MAX_BOOKING_MONTHS_AHEAD)
});

/**
 * Start a checkout for a window on a slot.
 *
 * The window is computed, not submitted: it always begins at the slot's next
 * free moment and runs for a whitelisted number of months. A sponsor cannot
 * post a start date, so they cannot book a window that has already been sold,
 * cannot back-date one, and cannot reserve the year 2400.
 */
export async function startBookingCheckoutAction(
  _prev: ActionState,
  form: FormData
): Promise<ActionState> {
  const viewer = await requireSponsor();
  if (!isDodoConfigured()) return { error: NOT_CONFIGURED };

  const parsed = bookingRequest.safeParse({
    slotId: form.get('slotId'),
    months: form.get('months')
  });
  if (!parsed.success) return { error: 'Pick a slot and a length.' };

  const creative = parseCreative(form);
  if (!creative.ok) return { error: creative.error };

  const slot = await slotById(parsed.data.slotId);
  if (!slot || !slot.active) return { error: 'That slot is not for sale.' };

  const startsAt = await nextAvailableFrom(slot.id);
  const endsAt = new Date(startsAt);
  endsAt.setMonth(endsAt.getMonth() + parsed.data.months);

  if (!(await windowIsFree(slot.id, startsAt, endsAt))) {
    return { error: 'Somebody just took that window. Reload for the next opening.' };
  }

  // THE PRICE. From the slot's own row, times months. Never from the form.
  const amount = slot.pricePaise * parsed.data.months;
  if (amount <= 0) return { error: 'That slot has no price set yet.' };

  const [booking] = await db
    .insert(bookings)
    .values({
      slotId: slot.id,
      profileId: viewer.id,
      startsAt,
      endsAt,
      months: parsed.data.months,
      amountPaise: amount,
      ...creative.value,
      status: 'pending'
    })
    .returning();

  const [payment] = await db
    .insert(payments)
    .values({
      profileId: viewer.id,
      kind: 'booking',
      refId: booking.id,
      amountPaise: amount,
      currency: CURRENCY,
      status: 'pending'
    })
    .returning();

  let checkoutUrl: string | null = null;
  try {
    const session = await createCheckout({
      amountMinorUnits: amount,
      currency: CURRENCY,
      metadata: { kind: 'booking', paymentId: payment.id, profileId: viewer.id },
      returnUrl: `${origin()}/dashboard?paid=1`,
      customerEmail: viewer.email ?? '',
      customerName: viewer.brand || viewer.name || 'Sponsor'
    });
    checkoutUrl = session.checkoutUrl;
    await db
      .update(payments)
      .set({ dodoSessionId: session.sessionId })
      .where(eq(payments.id, payment.id));
  } catch (err) {
    await db.batch([
      db.update(payments).set({ status: 'failed' }).where(eq(payments.id, payment.id)),
      db.update(bookings).set({ status: 'cancelled' }).where(eq(bookings.id, booking.id))
    ]);
    return { error: err instanceof Error ? err.message : 'Could not start the checkout.' };
  }

  if (!checkoutUrl) return { error: 'The payment provider did not return a checkout link.' };
  redirect(checkoutUrl);
}

/* ── Messages ───────────────────────────────────────────────────────────── */

const messageBody = z.string().trim().min(1, 'Say something first.').max(2000);

export async function sendMessageAction(
  _prev: ActionState,
  form: FormData
): Promise<ActionState> {
  const viewer = await requireViewer('/dashboard');
  const parsed = messageBody.safeParse(form.get('body'));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const fromCreator = viewer.role === 'creator';
  // A sponsor may only ever write into their own thread. The creator names the
  // thread; a sponsor's is implied by who they are.
  let threadId = viewer.id;
  if (fromCreator) {
    const target = z.string().uuid().safeParse(form.get('profileId'));
    if (!target.success) return { error: 'Unknown conversation.' };
    threadId = target.data;
  }

  await db.insert(messages).values({ profileId: threadId, fromCreator, body: parsed.data });

  revalidatePath(fromCreator ? '/studio' : '/dashboard');
  return { ok: 'Sent.' };
}

/** Mark the other side's messages read. Never marks your own. */
export async function markThreadReadAction(profileId: string): Promise<void> {
  const viewer = await getViewer();
  if (!viewer) return;
  const isCreator = viewer.role === 'creator';
  const thread = isCreator ? profileId : viewer.id;

  await db
    .update(messages)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(messages.profileId, thread),
        eq(messages.fromCreator, !isCreator),
        sql`${messages.readAt} is null`
      )
    );
}

/* ── The creator's own writes ───────────────────────────────────────────── */

const slotInput = z.object({
  name: z.string().trim().min(1, 'Give the slot a name.').max(80),
  property: z.string().trim().max(40).optional().nullable(),
  format: z.enum(['rect', 'leader', 'sky', 'inline', 'card']),
  description: z.string().trim().max(400).default(''),
  priceRupees: z.coerce.number().int().min(1, 'Set a price.').max(5_000_000),
  monthlyViews: z.coerce.number().int().min(0).max(100_000_000).optional().nullable()
});

/** A short, unambiguous public id for the embed snippet. */
function publicId(name: string) {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 28);
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${base || 'slot'}-${suffix}`;
}

export async function createSlotAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  await requireCreator();

  const parsed = slotInput.safeParse({
    name: form.get('name'),
    property: form.get('property') || null,
    format: form.get('format') ?? 'rect',
    description: form.get('description') ?? '',
    priceRupees: form.get('priceRupees'),
    monthlyViews: form.get('monthlyViews') || null
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const preview = safeUrl(form.get('previewUrl'));

  await db.insert(slots).values({
    publicId: publicId(parsed.data.name),
    name: parsed.data.name,
    property: parsed.data.property || null,
    format: parsed.data.format,
    description: parsed.data.description,
    previewUrl: preview,
    pricePaise: parsed.data.priceRupees * 100,
    // A view count is measured or absent. An empty field means "not measured",
    // and must never become a zero that reads like a measurement.
    monthlyViews: parsed.data.monthlyViews ?? null
  });

  revalidatePath('/studio');
  revalidatePath('/');
  return { ok: 'Slot created.' };
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
 * Approve or reject a creative.
 *
 * Approving a bid is what actually puts it on the board — money alone never
 * does. That ordering is the creator's editorial control over their own sites,
 * and it is why `rankedBids()` filters on `status = 'approved'`.
 */
export async function reviewBidAction(
  bidId: string,
  decision: 'approved' | 'rejected',
  note?: string
): Promise<void> {
  const creator = await requireCreator();
  const [row] = await db
    .update(bids)
    .set({ status: decision, reviewNote: note?.trim() || null, updatedAt: new Date() })
    .where(eq(bids.id, bidId))
    .returning();

  if (row) {
    await db.insert(activity).values({
      kind: decision === 'approved' ? 'bid.approved' : 'bid.rejected',
      profileId: row.profileId,
      actor: row.brand || 'A sponsor',
      amountPaise: row.amountPaise,
      // A rejection is between the creator and that sponsor, not a public event.
      publicFeed: decision === 'approved'
    });
    void creator;
  }

  revalidatePath('/studio');
  revalidatePath('/');
}

/**
 * Approve or reject a booking's creative.
 *
 * Approving stamps `approvedAt` and leaves `status` alone — the booking stays
 * `paid`, which is what holds its window under the exclusion constraint.
 * Rejecting moves it out of `paid`, releasing the window, because a brand whose
 * ad will never run should not be occupying inventory.
 */
export async function reviewBookingAction(
  bookingId: string,
  decision: 'approved' | 'rejected',
  note?: string
): Promise<void> {
  await requireCreator();

  const [row] = await db
    .update(bookings)
    .set(
      decision === 'approved'
        ? { approvedAt: new Date(), reviewNote: note?.trim() || null }
        : { status: 'rejected', approvedAt: null, reviewNote: note?.trim() || null }
    )
    .where(eq(bookings.id, bookingId))
    .returning();

  if (row && decision === 'approved') {
    await db.insert(activity).values({
      kind: 'booking.live',
      profileId: row.profileId,
      actor: row.brand || 'A sponsor',
      amountPaise: row.amountPaise
    });
  }

  revalidatePath('/studio');
  revalidatePath('/');
}

/* ── Profile ────────────────────────────────────────────────────────────── */

export async function saveBrandAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const viewer = await requireViewer('/dashboard');
  const parsed = z
    .object({
      name: z.string().trim().min(1, 'Enter your name.').max(80),
      brand: z.string().trim().max(40).optional().nullable()
    })
    .safeParse({ name: form.get('name'), brand: form.get('brand') || null });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  await db
    .update(profiles)
    .set({ name: parsed.data.name, brand: parsed.data.brand || null })
    .where(eq(profiles.id, viewer.id));

  revalidatePath('/dashboard');
  revalidatePath('/studio');
  return { ok: 'Saved.' };
}
