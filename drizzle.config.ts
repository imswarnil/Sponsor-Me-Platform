import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

/**
 * Schema work runs over the UNPOOLED connection: drizzle-kit needs a real
 * session (advisory locks, DDL in one transaction), which the pooled endpoint
 * cannot give it. The app itself uses the pooled URL over HTTP — lib/db/client.ts.
 *
 * `schemaFilter` keeps drizzle-kit inside `public`. Neon provisions and
 * migrates `neon_auth` itself, and a push that decided our schema file is the
 * truth about those tables would try to drop them.
 */
export default defineConfig({
  schema: './lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  schemaFilter: ['public'],
  dbCredentials: {
    url: process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL || ''
  }
});
