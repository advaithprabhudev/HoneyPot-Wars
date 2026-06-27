import Link from 'next/link';
import { Shell } from '@/components/Shell';
import { SignOutButton } from '@/components/SignOutButton';
import { requireAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { isAdminEmail } from '@/config/env';
import { C } from '@/lib/theme';
import type { Profile, SessionRequest, Report } from '@/lib/types';

const navCard = (color: string): React.CSSProperties => ({
  flex: '1', minWidth: '200px', border: `2px solid ${color}`, padding: '18px',
  textDecoration: 'none', color: C.text,
});

export default async function AdminHome() {
  await requireAdmin();
  const supabase = createClient();

  const [{ data: profiles }, { data: pending }, { data: reports }] = await Promise.all([
    supabase.from('profiles').select('*').order('created_at', { ascending: false }).returns<Profile[]>(),
    supabase.from('session_requests').select('id').eq('status', 'pending').returns<Pick<SessionRequest, 'id'>[]>(),
    supabase.from('reports').select('id').returns<Pick<Report, 'id'>[]>(),
  ]);

  // Admins are not clients — exclude them from the client list.
  const clients = (profiles ?? []).filter((p) => !isAdminEmail(p.email));

  return (
    <Shell title="ADMIN CONSOLE" subtitle="HONEYPOT WARS CONTROL PANEL" maxWidth="100%" right={<SignOutButton />}>
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '24px' }}>
        <Link href="/admin/requests" style={navCard(C.gold)}>
          <div className="font-press" style={{ fontSize: '24px', color: C.gold }}>{pending?.length ?? 0}</div>
          <div style={{ fontSize: '17px', letterSpacing: '2px', marginTop: '8px' }}>PENDING REQUESTS →</div>
        </Link>
        <Link href="/admin/users" style={navCard(C.cyan)}>
          <div className="font-press" style={{ fontSize: '24px', color: C.cyan }}>{clients.length}</div>
          <div style={{ fontSize: '17px', letterSpacing: '2px', marginTop: '8px' }}>ALL USERS →</div>
        </Link>
        <Link href="/admin/reports" style={navCard(C.gold)}>
          <div className="font-press" style={{ fontSize: '24px', color: C.gold }}>{reports?.length ?? 0}</div>
          <div style={{ fontSize: '17px', letterSpacing: '2px', marginTop: '8px' }}>ALL REPORTS →</div>
        </Link>
        <Link href="/admin/reviews" style={navCard(C.cyan)}>
          <div className="font-press" style={{ fontSize: '24px', color: C.cyan }}>✎</div>
          <div style={{ fontSize: '17px', letterSpacing: '2px', marginTop: '8px' }}>POST REVIEWS →</div>
        </Link>
      </div>

      <div style={{ border: `2px solid ${C.gold}`, padding: '18px' }}>
        <div style={{ fontSize: '18px', letterSpacing: '2px', marginBottom: '12px' }}>CLIENTS</div>
        {clients.length > 0 ? (
          <ul style={{ listStyle: 'none', padding: '0', margin: '0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {clients.map((c) => (
              <li key={c.id} style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${C.panel}`, paddingBottom: '10px' }}>
                <span style={{ fontSize: '20px' }}>
                  <span style={{ color: C.gold }}>{(c.company_name || '—').toUpperCase()}</span>{' '}
                  <span style={{ color: C.text, opacity: 0.7 }}>{c.email}</span>{' '}
                  <span style={{ color: c.account_status === 'active' ? C.green : C.gold, fontSize: '16px' }}>[{c.account_status}]</span>
                </span>
                <Link href={`/admin/clients/${c.id}`} style={{ color: C.cyan, fontSize: '18px', letterSpacing: '1px' }}>MANAGE →</Link>
              </li>
            ))}
          </ul>
        ) : (
          <p style={{ fontSize: '20px', margin: '0' }}>NO CLIENTS YET.</p>
        )}
      </div>
    </Shell>
  );
}
