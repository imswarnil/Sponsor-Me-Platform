import { boolean, pgSchema, text, timestamp, uuid } from 'drizzle-orm/pg-core';

/**
 * NEON-MANAGED IDENTITY
 * =====================
 *
 * Neon Auth is Better Auth, hosted by Neon, writing into a `neon_auth` schema
 * **inside our own database**. That is better than it sounds: users and
 * sessions are real rows we can join against, not records behind someone
 * else's API — so `bms_profile.id` is a genuine foreign key.
 *
 * Neon provisions and migrates these tables. We declare only what we read, and
 * never create, alter or drop them.
 *
 * This module is deliberately **not** re-exported from `schema.ts`: drizzle-kit
 * generates DDL for every table reachable from the configured entrypoint, and a
 * migration containing `CREATE SCHEMA "neon_auth"` would collide with Neon's
 * own provisioning. Keeping it unreachable makes that impossible rather than
 * merely discouraged. (`schemaFilter` in drizzle.proto.config.ts covers
 * introspection and push, not generate.)
 *
 * Column names are camelCase in the database because Better Auth created them
 * that way — quoted identifiers, so they must be spelled exactly.
 */
export const neonAuth = pgSchema('neon_auth');

export const authUser = neonAuth.table('user', {
  id: uuid('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  emailVerified: boolean('emailVerified').notNull(),
  image: text('image'),
  createdAt: timestamp('createdAt', { withTimezone: true }).notNull(),
  updatedAt: timestamp('updatedAt', { withTimezone: true }).notNull()
});

export type AuthUser = typeof authUser.$inferSelect;
