'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { C, PRESS } from '@/lib/theme';

export function SignOutButton() {
  const router = useRouter();
  const supabase = createClient();

  async function signOut() {
    await supabase.auth.signOut();
    router.replace('/');
    router.refresh();
  }

  return (
    <button
      onClick={signOut}
      style={{ fontFamily: PRESS, fontSize: '9px', letterSpacing: '1px', background: C.bg, color: C.cyan, border: `2px solid ${C.cyan}`, padding: '8px 12px', cursor: 'pointer' }}
    >
      LOG OUT
    </button>
  );
}
