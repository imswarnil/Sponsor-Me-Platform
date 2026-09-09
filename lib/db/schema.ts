import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  unique,
  uuid
} from 'drizzle-orm/pg-core';

/**
 * SPONSOR ME — the schema.
 *
 * MONEY IS ALWAYS `integer` PAISE. Never a float. See lib/money.ts.
 *
 * THE ONE IDEA THIS SCHEMA IS BUILT ON: a slot has a **kind**, and everything
 * else follows from it.
 *
 *   kind = 'fixed'   Somebody buys it. Their ad serves. Done.
 *   kind = 'bid'     Everybody bids. The highest bid serves; the rest are
 *                    visible on the leaderboard, waiting to overtake.
 *
 * Both kinds are the same table, sell the same ad formats, and share the same
 * embed. Only *who gets served* differs, and that is one `ORDER BY`. Modelling
 * them as two separate products would mean two of everything — two tables, two
 * embeds, two dashboards — to express one branch.
 */

/* ── Who ────────────────────────────────────────────────────────────────── */

export const profiles = pgTable('sm_profile', {
  /** Same id as the auth user. `.notNull()` is stated because drizzle-kit's
   *  diff does not infer it from `.primaryKey()`. */
  id: uuid('id').primaryKey().notNull(),
  email: text('email'),
  name: text('name').notNull().default(''),
  /** The name shown on their ad and on the leaderboard. */
  brand: text('brand'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

/* ── What is for sale ───────────────────────────────────────────────────── */

export const slots = pgTable(
  'sm_slot',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    /** What appears in the embed snippet. Never expose the uuid. */
    publicId: text('public_id').notNull().unique(),

    name: text('name').notNull(),
    blurb: text('blurb').notNull().default(''),

    /** 'fixed' | 'bid' — see the note at the top of this file. */
    kind: text('kind').notNull().default('fixed'),

    /** 'card' | 'banner' | 'rail' — the shape the unit is drawn at. */
    shape: text('shape').notNull().default('card'),

    /**
     * fixed: the asking price, per month.
     * bid:   the floor — the smallest bid that gets on the board at all.
     */
    pricePaise: integer('price_paise').notNull(),

    /** bid only: how much you must beat the leader by. Stops one-paisa wars. */
    stepPaise: integer('step_paise').notNull().default(10_000),

    /** Where it actually renders, for the preview. Real URL or null. */
    previewUrl: text('preview_url'),

    active: boolean('active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
  },
  (t) => [index('sm_slot_live_idx').on(t.active, t.kind)]
);

/* ── The ads ────────────────────────────────────────────────────────────── */

/**
 * One row per ad. On a `fixed` slot the paid one serves; on a `bid` slot the
 * highest-paying one serves and the rest are the leaderboard.
 *
 * `amountPaise` is a LIFETIME total on a bid slot — paying again adds to it,
 * which is how you climb, and it means nobody is ever refunded when overtaken.
 *
 * The creative is stored here rather than on the profile because one sponsor
 * may run different ads in different slots at the same time.
 */
export const ads = pgTable(
  'sm_ad',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    slotId: uuid('slot_id')
      .notNull()
      .references(() => slots.id, { onDelete: 'cascade' }),
    profileId: uuid('profile_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),

    /** 'card' | 'video' | 'image' | 'html' — what the unit draws. */
    format: text('format').notNull().default('card'),

    brand: text('brand').notNull().default(''),
    /** What they do, in a word or two — "Design tool", "Course", "Newsletter".
     *  The leaderboard shows it beside the site, so a reader can tell what a
     *  name is before clicking it. */
    tag: text('tag'),
    /** A square brand mark for the leaderboard. Distinct from `imageUrl`,
     *  which is the ad's own artwork: a wide screenshot makes a poor avatar
     *  and a logo makes a poor banner, so they are two fields. */
    logoUrl: text('logo_url'),
    headline: text('headline').notNull().default(''),
    body: text('body').notNull().default(''),
    url: text('url'),
    imageUrl: text('image_url'),
    videoUrl: text('video_url'),
    ctaLabel: text('cta_label'),
    /**
     * `format = 'html'` only. Rendered inside a SANDBOXED iframe with no
     * same-origin access, never injected into a page — see lib/render.ts. A
     * sponsor's raw HTML on the creator's own origin would be a stored XSS
     * with a price list.
     */
    html: text('html'),

    /** Lifetime paid, in paise. Only ever incremented, and only by a webhook. */
    amountPaise: integer('amount_paise').notNull().default(0),

    /**
     * A HOUSE AD — the creator's own work, filling inventory nobody has bought.
     *
     * It costs nothing and is worth nothing: it never appears in earnings, and
     * `contendersFor()` sorts it BELOW every paying ad, so the instant a real
     * sponsor pays, they take the spot and the house ad steps aside. An empty
     * slot showing the creator's own project is better than an empty slot; a
     * house ad that outranked a paying customer would be fraud.
     */
    isHouse: boolean('is_house').notNull().default(false),

    /**
     * draft    — being written, never served
     * pending  — paid, waiting for the creator to approve it
     * live     — approved; serves if it wins its slot
     * rejected — refused
     */
    status: text('status').notNull().default('draft'),
    reviewNote: text('review_note'),

    /** Ties on a bid slot break by who got there first. */
    firstPaidAt: timestamp('first_paid_at', { withTimezone: true }),
    /** fixed slots only: when the run ends. Null on a bid slot — a bid never expires. */
    endsAt: timestamp('ends_at', { withTimezone: true }),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (t) => [
    // The leaderboard's index: highest first, oldest wins a tie.
    index('sm_ad_rank_idx').on(t.slotId, t.amountPaise.desc(), t.firstPaidAt),
    index('sm_ad_mine_idx').on(t.profileId)
  ]
);

/* ── Money ──────────────────────────────────────────────────────────────── */

/**
 * Append-only. `dodoPaymentId` is UNIQUE and that uniqueness IS the
 * idempotency: a provider redelivers webhooks, and the database — not a code
 * path someone might change — is what makes the second delivery a no-op.
 */
export const payments = pgTable(
  'sm_payment',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    profileId: uuid('profile_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    adId: uuid('ad_id').references(() => ads.id, { onDelete: 'set null' }),

    amountPaise: integer('amount_paise').notNull(),
    currency: text('currency').notNull().default('INR'),

    dodoSessionId: text('dodo_session_id'),
    dodoPaymentId: text('dodo_payment_id').unique(),

    /** pending → paid | failed. Nothing serves on anything but `paid`. */
    status: text('status').notNull().default('pending'),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    paidAt: timestamp('paid_at', { withTimezone: true })
  },
  (t) => [index('sm_payment_mine_idx').on(t.profileId, t.createdAt.desc())]
);

/* ── Counting ───────────────────────────────────────────────────────────── */

/**
 * Views and clicks per ad per day. Not one row per impression — an ad that
 * works makes millions of those and nobody asks a question that needs them
 * individually.
 *
 * Nothing about the reader is stored. No IP, no user agent, no cookie, no
 * visitor id. A counter is all a sponsor was sold.
 */
export const stats = pgTable(
  'sm_stat',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    adId: uuid('ad_id')
      .notNull()
      .references(() => ads.id, { onDelete: 'cascade' }),
    day: text('day').notNull(),
    views: integer('views').notNull().default(0),
    clicks: integer('clicks').notNull().default(0)
  },
  (t) => [
    /**
     * UNIQUE, not just an index: the counter is written with
     * `INSERT ... ON CONFLICT DO UPDATE SET views = views + 1`, and that
     * statement needs a real constraint to conflict against. Without it every
     * impression inserts a new row and the totals silently multiply.
     */
    unique('sm_stat_unique').on(t.adId, t.day),
    index('sm_stat_ad_idx').on(t.adId, t.day)
  ]
);

/* ── Activity ───────────────────────────────────────────────────────────── */

/**
 * The public record of what has happened: somebody bid, somebody's ad went
 * live. Append-only and never edited — it is the homepage's ticker and the
 * studio's audit trail at once, and those two only agree because there is one
 * table rather than two.
 *
 * `actor` is denormalised on purpose: the feed must still read correctly after
 * a sponsor deletes their account and the join goes null.
 */
export const activity = pgTable(
  'sm_activity',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    /** 'paid' | 'live' | 'outbid' */
    kind: text('kind').notNull(),
    actor: text('actor').notNull().default(''),
    slotName: text('slot_name').notNull().default(''),
    amountPaise: integer('amount_paise'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
  },
  (t) => [index('sm_activity_recent_idx').on(t.createdAt.desc())]
);

export type Profile = typeof profiles.$inferSelect;
export type Slot = typeof slots.$inferSelect;
export type Ad = typeof ads.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type Stat = typeof stats.$inferSelect;
export type Activity = typeof activity.$inferSelect;
