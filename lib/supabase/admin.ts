import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { getPublicEnv, getServerEnv } from '@/config/env';

// Service-role client — bypasses RLS. SERVER-ONLY. Never import into client code
// or a Client Component. Used exclusively by admin API routes after the caller
// has been verified as an admin (CLAUDE.md §A.8 — privileged ops server-side only).
export function createAdminClient() {
  return createSupabaseClient(
    getPublicEnv().NEXT_PUBLIC_SUPABASE_URL,
    getServerEnv().SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: { autoRefreshToken: false, persistSession: false },
    },
  );
}
