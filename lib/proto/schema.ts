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
