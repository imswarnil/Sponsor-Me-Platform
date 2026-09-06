/**
 * Applies hand-written SQL that drizzle-kit cannot generate.
 *
 * Everything in drizzle/manual/ targets `neon_auth`, which Neon provisions and
 * which drizzle-kit is deliberately kept away from (see drizzle.proto.config.ts).
 * Each file is idempotent, so this is safe to re-run after every push.
 *
 *   node scripts/apply-sql.mjs drizzle/manual/*.sql
 */
import { readFileSync } from 'node:fs';
import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';

config({ path: '.env' });

const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
if (!url) {
  console.error('Missing DATABASE_URL — see .env.example.');
  process.exit(1);
}

const files = process.argv.slice(2);
if (!files.length) {
  console.error('usage: node scripts/apply-sql.mjs <file.sql> [...]');
  process.exit(1);
}

const sql = neon(url);
for (const file of files) {
  try {
    // `query` rather than the tagged template: these are whole statements from
    // a trusted file on disk, not interpolated input.
    await sql.query(readFileSync(file, 'utf8'));
    console.log(`✓ applied ${file}`);
  } catch (err) {
    console.error(`✗ ${file}: ${err.message}`);
    process.exit(1);
  }
}
