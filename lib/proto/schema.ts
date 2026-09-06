// App tables. Identity is Supabase Auth (auth.users). Per-user app data (points, role)
// lives in bms_profile, whose id == auth.users.id (populated by a DB trigger on signup).
import { boolean, integer, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const profiles = pgTable('bms_profile', {
  id: uuid('id').primaryKey(), // == auth.users.id
  email: text('email'),
  name: text('name').notNull().default(''),
  points: integer('points').notNull().default(1000),
  role: text('role').notNull().default('both'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

export const slots = pgTable('bms_slot', {
  id: uuid('id').primaryKey().defaultRandom(),
  publicId: text('public_id').notNull().unique(),
  ownerId: uuid('owner_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  width: integer('width').notNull().default(300),
  height: integer('height').notNull().default(250),
  placement: text('placement').notNull().default('sidebar'),
  // Which of my sites this runs on — see lib/properties.ts. Nullable: rows
  // written before properties existed mean "across everything", not a guess.
  property: text('property'),
  pricePoints: integer('price_points').notNull().default(100),
  status: text('status').notNull().default('open'), // open | sponsored
  sponsorId: uuid('sponsor_id').references(() => profiles.id, { onDelete: 'set null' }),
  adHeadline: text('ad_headline'),
  adImageUrl: text('ad_image_url'),
  adLinkUrl: text('ad_link_url'),
  adCtaLabel: text('ad_cta_label'),
  adSocials: jsonb('ad_socials').$type<{ platform: string; url: string }[]>(),
  sponsoredWeeks: integer('sponsored_weeks'),
  sponsoredStart: timestamp('sponsored_start', { withTimezone: true }),
  sponsoredUntil: timestamp('sponsored_until', { withTimezone: true }),
  archived: boolean('archived').notNull().default(false),
  brief: text('brief'),
  previewImageUrl: text('preview_image_url'),
  audience: text('audience'),
  adSpecs: text('ad_specs'),
  discountThresholdDays: integer('discount_threshold_days'),
  discountPercent: integer('discount_percent'),
  adType: text('ad_type'), // banner | video | button | text — visual/preset only, see lib/ad-types.ts
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

export const notifications = pgTable('bms_notification', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  type: text('type').notNull(), // sponsored | expired | system
  title: text('title').notNull(),
  body: text('body'),
  href: text('href'),
  read: boolean('read').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

export const events = pgTable('bms_event', {
  id: uuid('id').primaryKey().defaultRandom(),
  slotId: uuid('slot_id')
    .notNull()
    .references(() => slots.id, { onDelete: 'cascade' }),
  type: text('type').notNull(), // view | click
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

export const txns = pgTable('bms_txn', {
  id: uuid('id').primaryKey().defaultRandom(),
  slotId: uuid('slot_id').references(() => slots.id, { onDelete: 'set null' }),
  fromId: uuid('from_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  toId: uuid('to_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  amount: integer('amount').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

// Append-only record of every sponsorship ever bought. Never mutated by expireStaleSlots() —
// this is what lets "past sponsors" survive a slot's live ad fields being cleared on expiry.
export const sponsorshipHistory = pgTable('bms_sponsorship_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  slotId: uuid('slot_id'), // no FK — must outlive the slot if it's later deleted
  ownerId: uuid('owner_id').references(() => profiles.id, { onDelete: 'set null' }),
  sponsorId: uuid('sponsor_id').references(() => profiles.id, { onDelete: 'set null' }),
  slotName: text('slot_name').notNull(),
  channel: text('channel').notNull(),
  headline: text('headline'),
  imageUrl: text('image_url'),
  linkUrl: text('link_url'),
  ctaLabel: text('cta_label'),
  brief: text('brief'),
  socials: jsonb('socials').$type<{ platform: string; url: string }[]>(),
  amount: integer('amount').notNull(),
  startAt: timestamp('start_at', { withTimezone: true }).notNull(),
  endAt: timestamp('end_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

// Placeholder record of a channel a creator says they run — no credentials, no API
// calls. Exists so the studio has somewhere to list "connected" channels once real
// YouTube/Ghost/etc. integration details are wired in; until then it's just a label.
export const channelConnections = pgTable('bms_channel_connection', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerId: uuid('owner_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  provider: text('provider').notNull(), // youtube | ghost | blog | instagram
  label: text('label').notNull(),
  connected: boolean('connected').notNull().default(false),
  lastSyncedAt: timestamp('last_synced_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

// A conversation between the creator and one advertiser (or prospective advertiser —
// "request something else" starts a thread the same way). Simple and DB-backed, not
// realtime: pages refresh on navigation, new messages notify via bms_notification.
export const threads = pgTable('bms_thread', {
  id: uuid('id').primaryKey().defaultRandom(),
  subject: text('subject').notNull(),
  requesterId: uuid('requester_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  creatorId: uuid('creator_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  type: text('type').notNull().default('general'), // request | general
  status: text('status').notNull().default('active'), // active | archived
  lastMessageAt: timestamp('last_message_at', { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

export const messages = pgTable('bms_message', {
  id: uuid('id').primaryKey().defaultRandom(),
  threadId: uuid('thread_id').notNull(), // no FK cascade needed — threads are never deleted, only archived
  senderId: uuid('sender_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  body: text('body').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

export type Profile = typeof profiles.$inferSelect;
export type Slot = typeof slots.$inferSelect;
export type Txn = typeof txns.$inferSelect;
export type SponsorshipHistory = typeof sponsorshipHistory.$inferSelect;
export type ChannelConnection = typeof channelConnections.$inferSelect;
export type Thread = typeof threads.$inferSelect;
export type Message = typeof messages.$inferSelect;

/**
 * An offer on a placement — the bidding model is "make an offer, I decide".
 *
 * Not an auction: no deadline, no automatic winner. Anyone can propose a price
 * and a date range, and the creator accepts one or declines it. That keeps the
 * final say over who appears on a personal site with the person whose site it
 * is, which an auction deliberately gives up.
 *
 * The creative lives on the offer rather than being collected after acceptance,
 * so accepting is one click and books the slot outright. An accepted offer is
 * the thing `bms_sponsorship_history` records; the losing offers are declined
 * in the same transaction.
 */
export const offers = pgTable('bms_offer', {
  id: uuid('id').primaryKey().defaultRandom(),
  slotId: uuid('slot_id')
    .notNull()
    .references(() => slots.id, { onDelete: 'cascade' }),
  sponsorId: uuid('sponsor_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  /** Total offered for the whole run, not per week — what the sponsor pays. */
  pricePoints: integer('price_points').notNull(),
  startDate: timestamp('start_date', { withTimezone: true }).notNull(),
  endDate: timestamp('end_date', { withTimezone: true }).notNull(),
  /** A note to the creator. Not shown publicly. */
  message: text('message'),
  adHeadline: text('ad_headline'),
  adImageUrl: text('ad_image_url'),
  adLinkUrl: text('ad_link_url'),
  adCtaLabel: text('ad_cta_label'),
  // pending | accepted | declined | withdrawn
  status: text('status').notNull().default('pending'),
  decidedAt: timestamp('decided_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

/**
 * A member — someone who pays a fixed amount to back the work and appears on
 * the public sponsor wall.
 *
 * Distinct from a placement sponsor: a placement buys a specific spot for a
 * specific run, a member simply supports and gets a face on the wall. This is
 * the row the embeddable wall renders from.
 *
 * **Mirrored into Ghost.** While `status` is `active` the person is a comped
 * member of a paid tier on imswarnil.com (see lib/ghost-members.ts), so one
 * payment here means one real membership there. `ghostMemberId` is that link;
 * it is nullable because Ghost being unreachable must never block a join —
 * the sync is retried rather than the payment refused.
 */
export const members = pgTable('bms_member', {
  id: uuid('id').primaryKey().defaultRandom(),
  profileId: uuid('profile_id')
    .notNull()
    .unique()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  /** What the wall shows. Defaults to the profile name, editable by the member. */
  displayName: text('display_name').notNull(),
  avatarUrl: text('avatar_url'),
  /** Stored WITHOUT the leading @ — the UI adds it. */
  instagramHandle: text('instagram_handle'),
  /** The small line shown under the name on the wall. */
  blurb: text('blurb'),
  /** Overrides the Instagram link when set — some people would rather send you elsewhere. */
  linkUrl: text('link_url'),
  /** The Ghost tier this membership mirrors, and what it costs. */
  tierName: text('tier_name').notNull(),
  pricePoints: integer('price_points').notNull(),
  // active | lapsed
  status: text('status').notNull().default('active'),
  ghostMemberId: text('ghost_member_id'),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
  /** When the current paid period runs out. Past this, `expireStaleMembers` lapses it. */
  renewsAt: timestamp('renews_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

export type Offer = typeof offers.$inferSelect;
export type Member = typeof members.$inferSelect;
