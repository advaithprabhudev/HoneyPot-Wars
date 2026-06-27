import Link from 'next/link';
import { Shell } from '@/components/Shell';
import { SignOutButton } from '@/components/SignOutButton';
import { RequestActions } from '@/components/RequestActions';
import { requireAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { C } from '@/lib/theme';
import type { SessionRequest, Profile } from '@/lib/types';

type RequestRow = SessionRequest & { profiles: Pick<Profile, 'company_name' | 'email'> | null };

export default async function AdminRequests() {
  await requireAdmin();
  const supabase = createClient();
  const { data: requests } = await supabase
    .from('session_requests')
    .select('*, profiles(company_name, email)')
    .order('requested_at', { ascending: false })
    .returns<RequestRow[]>();

  return (
    <Shell title="SESSION REQUESTS" subtitle="REVIEW & APPROVE" maxWidth="100%" right={<SignOutButton />}>
      <Link href="/admin" style={{ color: C.cyan, fontSize: '18px' }}>← BACK TO CONSOLE</Link>
      <div style={{ marginTop: '18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {requests && requests.length > 0 ? (
          requests.map((r) => (
            <div key={r.id} style={{ border: `2px solid ${r.status === 'pending' ? C.gold : C.panel}`, padding: '16px' }}>
              <div style={{ fontSize: '20px', lineHeight: '1.5' }}>
                <span style={{ color: C.gold }}>{(r.profiles?.company_name || '—').toUpperCase()}</span>{' '}
                <span style={{ opacity: 0.7 }}>{r.profiles?.email}</span>
              </div>
              <div style={{ fontSize: '19px' }}>REPO: <span style={{ color: C.cyan }}>{r.repo_url}</span></div>
              {r.deployment_url && <div style={{ fontSize: '19px' }}>URL: <span style={{ color: C.cyan }}>{r.deployment_url}</span></div>}
              {r.notes && <div style={{ fontSize: '18px', opacity: 0.85 }}>NOTES: {r.notes}</div>}
              <div style={{ fontSize: '18px', margin: '6px 0 12px' }}>
                STATUS: <span style={{ color: r.status === 'approved' ? C.green : r.status === 'rejected' ? C.red : C.gold }}>{r.status.toUpperCase()}</span>
                {' · '}CONSENT: <span style={{ color: r.consent_signed ? C.green : C.red }}>{r.consent_signed ? 'SIGNED' : 'NO'}</span>
              </div>
              {r.status === 'pending' && <RequestActions requestId={r.id} />}
            </div>
          ))
        ) : (
          <p style={{ fontSize: '20px' }}>NO REQUESTS YET.</p>
        )}
      </div>
    </Shell>
  );
}
