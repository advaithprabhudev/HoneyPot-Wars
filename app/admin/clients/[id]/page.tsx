import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Shell } from '@/components/Shell';
import { SignOutButton } from '@/components/SignOutButton';
import { UploadReportForm } from '@/components/UploadReportForm';
import { requireAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { C } from '@/lib/theme';
import type { Profile, Report, SessionRequest } from '@/lib/types';

export default async function AdminClientPage({ params }: { params: { id: string } }) {
  await requireAdmin();
  const supabase = createClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', params.id)
    .maybeSingle<Profile>();
  if (!profile) notFound();

  const [{ data: requests }, { data: reports }] = await Promise.all([
    supabase.from('session_requests').select('*').eq('account_id', params.id).order('requested_at', { ascending: false }).returns<SessionRequest[]>(),
    supabase.from('reports').select('*').eq('account_id', params.id).order('created_at', { ascending: false }).returns<Report[]>(),
  ]);

  return (
    <Shell title={(profile.company_name || profile.email).toUpperCase()} subtitle={`STATUS: ${profile.account_status.toUpperCase()}`} maxWidth="100%" right={<SignOutButton />}>
      <Link href="/admin" style={{ color: C.cyan, fontSize: '18px' }}>← BACK TO CONSOLE</Link>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px', marginTop: '18px' }}>
        <div style={{ border: `2px solid ${C.gold}`, padding: '18px' }}>
          <div style={{ fontSize: '18px', letterSpacing: '2px', marginBottom: '8px' }}>CLIENT</div>
          <div style={{ fontSize: '20px' }}>EMAIL: {profile.email}</div>
          <div style={{ fontSize: '20px' }}>DOMAIN: {profile.registered_domain || '—'}</div>
        </div>

        <div style={{ border: `2px solid ${C.cyan}`, padding: '18px' }}>
          <div style={{ fontSize: '18px', letterSpacing: '2px', marginBottom: '8px' }}>SESSION REQUESTS</div>
          {requests && requests.length > 0 ? (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {requests.map((r) => (
                <li key={r.id} style={{ fontSize: '19px' }}>
                  <span style={{ color: C.cyan }}>{r.repo_url}</span> — <span style={{ color: r.status === 'approved' ? C.green : r.status === 'rejected' ? C.red : C.gold }}>{r.status.toUpperCase()}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ fontSize: '20px', margin: 0 }}>NO REQUESTS.</p>
          )}
        </div>

        <div style={{ border: `2px solid ${C.gold}`, padding: '18px' }}>
          <div style={{ fontSize: '18px', letterSpacing: '2px', marginBottom: '12px' }}>UPLOAD REPORT</div>
          <UploadReportForm accountId={profile.id} />
        </div>

        <div style={{ border: `2px solid ${C.cyan}`, padding: '18px' }}>
          <div style={{ fontSize: '18px', letterSpacing: '2px', marginBottom: '12px' }}>EXISTING REPORTS</div>
          {reports && reports.length > 0 ? (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {reports.map((r) => (
                <li key={r.id} style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', borderBottom: `1px solid ${C.panel}`, paddingBottom: '10px' }}>
                  <span style={{ fontSize: '20px' }}><span style={{ color: C.gold }}>[{r.report_type.toUpperCase()}]</span> {r.title}</span>
                  <a href={`/api/reports/download?id=${r.id}`} style={{ color: C.cyan, fontSize: '20px' }}>⬇ DOWNLOAD</a>
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ fontSize: '20px', margin: 0 }}>NO REPORTS UPLOADED YET.</p>
          )}
        </div>
      </div>
    </Shell>
  );
}
