import type { Config } from 'drizzle-kit';

/**
 * Schema is pushed over the UNPOOLED Neon connection.
 *
 * DDL through a pooler is a good way to get a migration half-applied: the
 * pooler can hand successive statements to different backends, so a
 * transaction is not necessarily a transaction. Schema work wants one real
 * session, start to finish.
 *
 * `schemaFilter` keeps drizzle-kit inside `public`. Neon Auth provisions and
 * migrates `neon_auth` itself; without this, a push would notice those tables,
 * decide we did not declare them, and offer to drop them.
 */
export default {
  schema: './lib/proto/schema.ts',
  out: './lib/proto/migrations',
  dialect: 'postgresql',
  schemaFilter: ['public'],
  dbCredentials: {
    url: process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL!
  }
} satisfies Config;
