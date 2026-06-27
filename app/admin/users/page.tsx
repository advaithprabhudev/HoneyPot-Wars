import Link from 'next/link';
import { Shell } from '@/components/Shell';
import { SignOutButton } from '@/components/SignOutButton';
import { requireAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { isAdminEmail } from '@/config/env';
import { C } from '@/lib/theme';
import type { Profile } from '@/lib/types';

function fmt(d: string) {
  return new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export default async function AdminUsers() {
  await requireAdmin();
  const supabase = createClient();
  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })
    .returns<Profile[]>();

  const users = (profiles ?? []).filter((p) => !isAdminEmail(p.email));

  return (
    <Shell title="ALL USERS" subtitle={`${users.length} REGISTERED`} maxWidth="100%" right={<SignOutButton />}>
      <Link href="/admin" style={{ color: C.cyan, fontSize: '18px' }}>← BACK TO CONSOLE</Link>
      <div style={{ marginTop: '18px', border: `2px solid ${C.gold}`, padding: '18px' }}>
        {users.length > 0 ? (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {users.map((u) => (
              <li key={u.id} style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${C.panel}`, paddingBottom: '12px' }}>
                <span style={{ fontSize: '20px', lineHeight: '1.5' }}>
                  <span style={{ color: C.gold }}>{(u.company_name || '—').toUpperCase()}</span>{' '}
                  <span style={{ opacity: 0.7 }}>{u.email}</span>{' '}
                  <span style={{ color: u.account_status === 'active' ? C.green : C.gold, fontSize: '16px' }}>[{u.account_status}]</span>
                  <span style={{ opacity: 0.5, fontSize: '15px' }}> · joined {fmt(u.created_at)}</span>
                </span>
                <Link href={`/admin/clients/${u.id}`} style={{ color: C.cyan, fontSize: '18px' }}>MANAGE →</Link>
              </li>
            ))}
          </ul>
        ) : (
          <p style={{ fontSize: '20px', margin: 0 }}>NO USERS YET.</p>
        )}
      </div>
    </Shell>
  );
}
