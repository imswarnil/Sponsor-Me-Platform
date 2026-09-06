import 'server-only';
import { and, desc, eq, sql } from 'drizzle-orm';
import { db } from './db';
import { offers, profiles, slots } from './schema';

/**
 * Reads for the offer flow.
 *
 * Deliberately NOT in offers.ts. That file is `'use server'`, which turns every
 * one of its exports into an endpoint the browser can POST to — so a reader
 * living there would be a public API taking an arbitrary id and handing back
 * somebody else's offers. Mutations are actions; reads are server-only imports.
 */

/** What a slot's own asking price works out to for a given run. */
export function askingPriceFor(pricePerWeek: number, days: number) {
  return Math.ceil((pricePerWeek * days) / 7);
}

export async function getPendingOffersForCreator(creatorId: string) {
  return db
    .select({
      offer: offers,
      slot: slots,
      sponsor: profiles
    })
    .from(offers)
    .innerJoin(slots, eq(offers.slotId, slots.id))
    .innerJoin(profiles, eq(offers.sponsorId, profiles.id))
    .where(and(eq(slots.ownerId, creatorId), eq(offers.status, 'pending')))
    .orderBy(desc(offers.pricePoints), desc(offers.createdAt));
}

export async function getOffersBySponsor(sponsorId: string) {
  return db
    .select({ offer: offers, slot: slots })
    .from(offers)
    .innerJoin(slots, eq(offers.slotId, slots.id))
    .where(eq(offers.sponsorId, sponsorId))
    .orderBy(desc(offers.createdAt));
}

/** How many people are currently bidding on a slot — shown publicly. */
export async function countPendingOffers(slotId: string) {
  const rows = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(offers)
    .where(and(eq(offers.slotId, slotId), eq(offers.status, 'pending')));
  return rows[0]?.n ?? 0;
}
