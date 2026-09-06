import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
if (!url) throw new Error('DATABASE_URL is not set');

// `prepare: false` is required for Supabase's transaction pooler (port 6543).
const client = postgres(url, { prepare: false });

export const db = drizzle(client, { schema });
export { schema };
