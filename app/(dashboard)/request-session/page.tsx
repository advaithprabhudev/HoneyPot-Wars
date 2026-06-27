import Link from 'next/link';
import { Shell } from '@/components/Shell';
import { RequestSessionForm } from '@/components/RequestSessionForm';
import { SignOutButton } from '@/components/SignOutButton';
import { requireUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { C } from '@/lib/theme';
import type { SessionRequest } from '@/lib/types';

export default async function RequestSessionPage() {
  const user = await requireUser();
  const supabase = createClient();
  const { data: pending } = await supabase
    .from('session_requests')
    .select('*')
    .eq('account_id', user.id)
    .eq('status', 'pending')
    .maybeSingle<SessionRequest>();

  return (
    <Shell title="REQUEST A SESSION" subtitle="BOOK YOUR COVERAGE ASSESSMENT" right={<SignOutButton />}>
      {pending ? (
        <div>
          <p style={{ fontSize: '20px', color: C.green, letterSpacing: '1px', lineHeight: '1.5' }}>
            ✓ YOU ALREADY HAVE A PENDING REQUEST. OUR TEAM WILL REVIEW IT AND APPROVE YOUR SESSION.
          </p>
          <Link href="/dashboard" style={{ color: C.cyan, fontSize: '20px' }}>← BACK TO DASHBOARD</Link>
        </div>
      ) : (
        <RequestSessionForm accountId={user.id} />
      )}
    </Shell>
  );
}
