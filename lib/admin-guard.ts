import { createClient } from '@/lib/supabase/server';
import { isAdminEmail } from '@/config/env';

// Server-side admin verification for API routes. Returns the user id when the
// caller is an authenticated admin, otherwise null. Never trusts client input.
export async function verifyAdmin(): Promise<{ userId: string } | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isAdminEmail(user.email)) return null;
  return { userId: user.id };
}
