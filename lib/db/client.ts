import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';

/**
 * Neon over HTTP.
 *
 * The serverless driver speaks Neon's HTTP endpoint rather than holding a TCP
 * connection, which is what makes it safe in a per-request server component:
 * there is no pool to exhaust and nothing to keep warm between invocations.
 *
 * `DATABASE_URL` is the POOLED endpoint (`-pooler` in the host). The unpooled
 * one is only for schema work — see drizzle.config.ts — and for the seed
 * script, which needs a real session.
 *
 * This replaces the postgres.js client that talked to Supabase's transaction
 * pooler. The `prepare: false` workaround that came with it is gone; HTTP has
 * no prepared statements to disable.
 *
 * ── Why the connection is lazy ──────────────────────────────────────────────
 * Reading the environment at module scope — as this file used to — makes
 * `next build` require a database. The build imports every route module to
 * collect page data, so a top-level `throw new Error('DATABASE_URL is not
 * set')` aborts the whole build with "Failed to collect page data for
 * /embed/bid", which names a route that has nothing to do with the
 * problem.
 *
 * Building should never need credentials; serving should. The proxy defers the
 * connection to the first actual query, so a missing variable surfaces on a
 * request, saying which variable it is. Same reasoning as lib/auth/server.ts.
 */

type Db = ReturnType<typeof drizzle<typeof schema>>;

let instance: Db | undefined;

function client(): Db {
  if (!instance) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error(
        'DATABASE_URL is not set. Copy .env.example to .env and fill in the Neon ' +
          'connection string — see CLAUDE.md §7.'
      );
    }
    instance = drizzle(neon(url), { schema });
  }
  return instance;
}

/**
 * Looks and behaves exactly like the drizzle instance; simply connects on the
 * first property touched rather than at import.
 */
export const db = new Proxy({} as Db, {
  get(_target, prop, receiver) {
    return Reflect.get(client(), prop, receiver);
  }
});

export { schema };
