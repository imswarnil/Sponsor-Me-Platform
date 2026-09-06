import type { Config } from 'drizzle-kit';

// Prototype schema — pushed to Supabase over the DIRECT/session connection (5432).
export default {
  schema: './lib/proto/schema.ts',
  out: './lib/proto/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DIRECT_URL || process.env.DATABASE_URL!
  }
} satisfies Config;
