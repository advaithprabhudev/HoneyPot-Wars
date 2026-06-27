import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { isAdminEmail } from '@/config/env';
import type { User } from '@supabase/supabase-js';

// Returns the signed-in user or null. Use in Server Components / route handlers.
export async function getUser(): Promise<User | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

// Requires a signed-in user; redirects to /login otherwise.
export async function requireUser(): Promise<User> {
  const user = await getUser();
  if (!user) redirect('/login');
  return user;
}

// Requires an admin user (email allowlist); redirects otherwise.
export async function requireAdmin(): Promise<User> {
  const user = await requireUser();
  if (!isAdminEmail(user.email)) redirect('/dashboard');
  return user;
}

export function isAdminUser(user: User | null): boolean {
  return isAdminEmail(user?.email);
}
