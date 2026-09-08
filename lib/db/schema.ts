import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
  uuid
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

/**
 * THE SCHEMA. Owned by Drizzle, pushed with `npm run db:push`.
 *
 * MONEY IS ALWAYS `integer` PAISE. Never numeric, never a float, never rupees.
 * See lib/money.ts for why, and for the only two functions allowed to turn one
 * into the other.
 *
 * RANK IS NEVER STORED. A sponsor's position on the leaderboard is
 * `ORDER BY amountPaise DESC, firstPaidAt ASC` and nothing else. A stored rank
 * is a cache of a single ORDER BY that four different code paths would have to
 * remember to invalidate, and the first one that forgets silently sells the
 * top spot twice.
 *
 * Table prefix `sb_` (SponsorBid). The old `bms_*` tables are from the
 * platform this replaced and are dropped by scripts/drop-legacy.sql.
 */

/* ── Identity ───────────────────────────────────────────────────────────── */

/**
 * One row per account. `id` is a genuine foreign key to `neon_auth.user.id`,
 * enforced by Postgres — the constraint lives in drizzle/manual/ because
 * drizzle-kit must never touch the schema Neon provisions (see neon-auth.ts).
 *
 * There is no `role` column, deliberately. The creator is whoever matches
 * `CREATOR_EMAIL` in the environment (lib/roles.ts), so admin cannot be
 * granted by a stray UPDATE — it takes a deploy.
 */
export const profiles = pgTable('sb_profile', {
  /**
   * `.notNull()` is redundant to Postgres — a primary key is already NOT NULL —
   * but drizzle-kit's diff does not infer it, so without it every `push` emits
   * `ALTER COLUMN id DROP NOT NULL` and dies with 42P16, "column id is in a
   * primary key". Stating it keeps `db:push` idempotent.
   */
  id: uuid('id').primaryKey().notNull(),
  email: text('email'),
  name: text('name').notNull().default(''),
  /** Shown beside their ad and on the leaderboard. Their brand, not their name. */
  brand: text('brand'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

/* ── Product 1 · SponsorBid, the lifetime leaderboard ───────────────────── */

/**
 * One row per sponsor on the board. `amountPaise` is their LIFETIME total:
 * paying again adds to it, which is how a sponsor climbs. Because a rank is
 * only ever added to and never taken away, no outbid ever needs a refund —
 * which is the entire reason the model was chosen.
 *
 * `firstPaidAt` breaks ties, so of two equal bids the one that arrived first
 * ranks higher. Without it, equal bids reorder themselves at random between
 * page loads.
 */
export const bids = pgTable(
  'sb_bid',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    profileId: uuid('profile_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' })
      .unique(),

    /** Lifetime total paid, in paise. Only ever incremented, by a paid webhook. */
    amountPaise: integer('amount_paise').notNull().default(0),

    /* The creative. Nothing renders until `approved` — see lib/roles.ts. */
    kind: text('kind').notNull().default('link'),
    brand: text('brand').notNull().default(''),
    headline: text('headline').notNull().default(''),
    body: text('body').notNull().default(''),
    url: text('url'),
    imageUrl: text('image_url'),
    videoUrl: text('video_url'),
    priceLabel: text('price_label'),
    ctaLabel: text('cta_label'),

    /** pending → approved | rejected. The creator moderates every creative. */
    status: text('status').notNull().default('pending'),
    reviewNote: text('review_note'),

    firstPaidAt: timestamp('first_paid_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (t) => [index('sb_bid_rank_idx').on(t.amountPaise.desc(), t.firstPaidAt)]
);

/* ── Product 2 · Slots, the bookable inventory ──────────────────────────── */

/**
 * An ad space the creator owns and sells. `publicId` is what appears in the
 * embed snippet, so it is the id that leaves the building — never expose the
 * uuid.
 *
 * `previewUrl` is the real page a sponsor is shown in an iframe before they
 * pay, so "where does my ad actually go" has a truthful answer instead of a
 * mockup. `monthlyViews` is a real measured number or NULL; a NULL renders as
 * nothing at all rather than as a zero or an invented figure.
 */
export const slots = pgTable(
  'sb_slot',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    publicId: text('public_id').notNull().unique(),
    name: text('name').notNull(),
    /** Which property it lives on — a key from lib/site.ts `properties`. */
    property: text('property'),
    /** A key from lib/site.ts `slotFormats`. Decides the reserved size. */
    format: text('format').notNull().default('rect'),
    description: text('description').notNull().default(''),
    /** The live page a sponsor previews in an iframe before booking. */
    previewUrl: text('preview_url'),
    /** Per month, in paise. */
    pricePaise: integer('price_paise').notNull(),
    /** Measured, or NULL. Never a guess. */
    monthlyViews: integer('monthly_views'),
    active: boolean('active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
  },
  (t) => [index('sb_slot_active_idx').on(t.active)]
);

/**
 * One brand holding one slot for one window.
 *
 * Bookings queue rather than compete: the next open start is the latest
 * `endsAt` among this slot's live and upcoming bookings. Overlap is prevented
 * in lib/queries.ts at booking time AND by a database constraint applied in
 * drizzle/manual/ — the check has to exist in the database, because two
 * checkouts completing in the same second would both pass an application-level
 * test and both write.
 *
 * The creative is stored on the booking, not on the profile: a brand may run
 * one thing in March and another in April, and last month's ad must not
 * silently change when they edit the next one.
 */
export const bookings = pgTable(
  'sb_booking',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    slotId: uuid('slot_id')
      .notNull()
      .references(() => slots.id, { onDelete: 'cascade' }),
    profileId: uuid('profile_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),

    startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
    endsAt: timestamp('ends_at', { withTimezone: true }).notNull(),
    months: integer('months').notNull(),
    amountPaise: integer('amount_paise').notNull(),

    /* The creative, same vocabulary as a bid's. */
    kind: text('kind').notNull().default('link'),
    brand: text('brand').notNull().default(''),
    headline: text('headline').notNull().default(''),
    body: text('body').notNull().default(''),
    url: text('url'),
    imageUrl: text('image_url'),
    videoUrl: text('video_url'),
    priceLabel: text('price_label'),
    ctaLabel: text('cta_label'),

    /**
     * pending  — checkout started, nothing paid, holds no inventory
     * paid     — money confirmed by webhook; HOLDS THE WINDOW
     * rejected — creative refused by the creator
     * cancelled— abandoned checkout, swept up later
     */
    status: text('status').notNull().default('pending'),

    /**
     * Approval is a SEPARATE axis from payment, and deliberately not another
     * `status` value.
     *
     * Paying holds the window — that is what the money bought, and the
     * EXCLUSION constraint in drizzle/manual/002 is scoped to `status = 'paid'`
     * to enforce it. Approval decides whether the creative RENDERS. Folding
     * the two into one column would mean an approved booking leaving the
     * `paid` state, and the moment it did, the constraint would stop guarding
     * its window and the slot could be sold twice.
     */
    approvedAt: timestamp('approved_at', { withTimezone: true }),
    reviewNote: text('review_note'),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    paidAt: timestamp('paid_at', { withTimezone: true })
  },
  (t) => [
    index('sb_booking_slot_window_idx').on(t.slotId, t.startsAt, t.endsAt),
    index('sb_booking_profile_idx').on(t.profileId)
  ]
);

/* ── The ledger ─────────────────────────────────────────────────────────── */

/**
 * Append-only. Every payment this platform has ever seen, whatever it was for.
 *
 * `dodoPaymentId` is UNIQUE and that uniqueness is the idempotency key: a
 * payment provider will deliver the same webhook more than once, and the
 * database — not a code path someone might change — is what makes the second
 * delivery a no-op. Crediting a bid twice because a webhook retried is the
 * exact failure this column exists to make impossible.
 */
export const payments = pgTable(
  'sb_payment',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    profileId: uuid('profile_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),

    /** 'bid' | 'booking' — what this money bought. */
    kind: text('kind').notNull(),
    /** The bid id or the booking id this payment fulfils. */
    refId: uuid('ref_id'),

    amountPaise: integer('amount_paise').notNull(),
    currency: text('currency').notNull().default('INR'),

    dodoSessionId: text('dodo_session_id'),
    /** The idempotency key. Unique, nullable until the webhook names it. */
    dodoPaymentId: text('dodo_payment_id').unique(),

    /** pending → paid | failed. Nothing goes live on anything but `paid`. */
    status: text('status').notNull().default('pending'),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    paidAt: timestamp('paid_at', { withTimezone: true })
  },
  (t) => [index('sb_payment_profile_idx').on(t.profileId, t.createdAt.desc())]
);

/* ── Analytics ──────────────────────────────────────────────────────────── */

/**
 * Views and clicks, rolled up per day.
 *
 * A row per impression would be the obvious design and the wrong one: an ad
 * that works generates millions of them, and nobody ever asks a question that
 * needs one. Everything the dashboards draw — today, the last 30 days, a
 * sparkline, a per-slot split — is a sum over this table, and it stays small
 * enough to query without an index scan becoming the product's slowest page.
 *
 * `placement` is 'bid' or 'slot'; `refId` is the bid or slot it happened on.
 */
export const events = pgTable(
  'sb_event',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    day: date('day').notNull(),
    placement: text('placement').notNull(),
    refId: uuid('ref_id').notNull(),
    /** Whose ad it was, so a sponsor can be shown only their own numbers. */
    profileId: uuid('profile_id').references(() => profiles.id, { onDelete: 'cascade' }),
    views: integer('views').notNull().default(0),
    clicks: integer('clicks').notNull().default(0)
  },
  (t) => [
    unique('sb_event_unique').on(t.day, t.placement, t.refId, t.profileId),
    index('sb_event_profile_idx').on(t.profileId, t.day.desc())
  ]
);

/* ── Messages ───────────────────────────────────────────────────────────── */

/**
 * One conversation per sponsor, with the creator. Not a general inbox: this
 * platform has exactly two kinds of person in it, so a thread is fully
 * identified by which sponsor it belongs to, and `fromCreator` says which way
 * a given message went.
 */
export const messages = pgTable(
  'sb_message',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    /** The sponsor side of the conversation — the thread key. */
    profileId: uuid('profile_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    fromCreator: boolean('from_creator').notNull().default(false),
    body: text('body').notNull(),
    readAt: timestamp('read_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
  },
  (t) => [index('sb_message_thread_idx').on(t.profileId, t.createdAt.desc())]
);

/* ── Activity ───────────────────────────────────────────────────────────── */

/**
 * The public record of everything that happens: a bid placed, a rank taken, a
 * slot booked, a creative approved. Append-only and never edited — it is the
 * homepage's live ticker and the studio's audit trail at the same time, and
 * those two only agree because there is one table rather than two.
 */
export const activity = pgTable(
  'sb_activity',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    kind: text('kind').notNull(),
    profileId: uuid('profile_id').references(() => profiles.id, { onDelete: 'set null' }),
    /** Denormalised on purpose: the feed must still read correctly after a
     *  sponsor deletes their account and the join goes null. */
    actor: text('actor').notNull().default(''),
    amountPaise: integer('amount_paise'),
    meta: jsonb('meta').$type<Record<string, unknown>>().default(sql`'{}'::jsonb`),
    /** Shown on the public homepage ticker. Anything private stays false. */
    publicFeed: boolean('public_feed').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
  },
  (t) => [index('sb_activity_recent_idx').on(t.createdAt.desc())]
);

export type Profile = typeof profiles.$inferSelect;
export type Bid = typeof bids.$inferSelect;
export type Slot = typeof slots.$inferSelect;
export type Booking = typeof bookings.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type EventRow = typeof events.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type Activity = typeof activity.$inferSelect;
