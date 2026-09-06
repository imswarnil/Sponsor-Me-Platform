import 'server-only';
import { createClient } from '@supabase/supabase-js';

/** Service-role client — SERVER ONLY. Bypasses RLS; never import into client bundles. */
export function createAdminClient() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}
