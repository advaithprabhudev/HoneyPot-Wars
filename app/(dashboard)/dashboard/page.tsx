import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Shell, buttonStyle } from '@/components/Shell';
import { SignOutButton } from '@/components/SignOutButton';
import { requireUser, isAdminUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { C } from '@/lib/theme';
import type { Profile, SessionRequest, Report, Review } from '@/lib/types';

type CheckRow = SessionRequest & { reviews: Review[] | null };

const STATUS_COLOR: Record<string, string> = {
  pending: C.gold,
  approved: C.green,
  rejected: C.red,
  active: C.green,
  suspended: C.red,
};

function fmt(d: string) {
  return new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export default async function DashboardPage() {
  const user = await requireUser();
  // Admin-only identity: admins use /admin, never the client home (defense in depth).
  if (isAdminUser(user)) redirect('/admin');

  const supabase = createClient();
  const [{ data: profile }, { data: checks }, { data: reports }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).maybeSingle<Profile>(),
    supabase
      .from('session_requests')
      .select('*, reviews(*)')
      .eq('account_id', user.id)
      .order('requested_at', { ascending: false })
      .returns<CheckRow[]>(),
    supabase.from('reports').select('*').eq('account_id', user.id).order('created_at', { ascending: false }).returns<Report[]>(),
  ]);

  const hasPending = (checks ?? []).some((c) => c.status === 'pending');

  return (
    <Shell
      title={`WELCOME, ${(profile?.company_name || user.email || 'OPERATOR').toUpperCase()}`}
      subtitle="YOUR COVERAGE DASHBOARD"
      maxWidth="900px"
      right={<SignOutButton />}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Account status + new-check CTA */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', justifyContent: 'space-between', border: `2px solid ${C.gold}`, padding: '18px' }}>
          <div>
            <div style={{ fontSize: '18px', letterSpacing: '2px', marginBottom: '8px' }}>ACCOUNT STATUS</div>
            <div className="font-press" style={{ fontSize: '14px', color: STATUS_COLOR[profile?.account_status ?? 'pending'] ?? C.text, letterSpacing: '1px' }}>
              {(profile?.account_status ?? 'pending').toUpperCase()}
            </div>
          </div>
          {!hasPending && <Link href="/request-session" style={buttonStyle}>▓▓ REQUEST A CHECK ▓▓</Link>}
        </div>

        {/* Past checks (history) with any admin reviews attached */}
        <div style={{ border: `2px solid ${C.cyan}`, padding: '18px' }}>
          <div style={{ fontSize: '18px', letterSpacing: '2px', marginBottom: '12px' }}>YOUR CHECKS</div>
          {checks && checks.length > 0 ? (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {checks.map((c) => (
                <li key={c.id} style={{ borderBottom: `1px solid ${C.panel}`, paddingBottom: '14px' }}>
                  <div style={{ fontSize: '20px', lineHeight: '1.5' }}>
                    <span style={{ color: C.cyan }}>{c.repo_url}</span>
                  </div>
                  <div style={{ fontSize: '18px', lineHeight: '1.5' }}>
                    {fmt(c.requested_at)} · STATUS:{' '}
                    <span className="font-press" style={{ fontSize: '10px', color: STATUS_COLOR[c.status] ?? C.text }}>{c.status.toUpperCase()}</span>
                  </div>
                  {c.reviews && c.reviews.length > 0 && (
                    <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {c.reviews.map((rv) => (
                        <div key={rv.id} style={{ background: C.panel, borderLeft: `3px solid ${C.gold}`, padding: '10px 12px' }}>
                          {rv.verdict && <div className="font-press" style={{ fontSize: '10px', color: C.gold, marginBottom: '6px' }}>{rv.verdict.toUpperCase()}</div>}
                          <div style={{ fontSize: '19px', lineHeight: '1.45' }}>{rv.body}</div>
                          <div style={{ fontSize: '15px', color: C.cyan, marginTop: '6px' }}>— HONEYPOT WARS · {fmt(rv.created_at)}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <div>
              <p style={{ fontSize: '20px', margin: '0 0 14px' }}>NO CHECKS YET.</p>
              <Link href="/request-session" style={buttonStyle}>▓▓ REQUEST YOUR FIRST CHECK ▓▓</Link>
            </div>
          )}
        </div>

        {/* Reports — downloadable */}
        <div style={{ border: `2px solid ${C.gold}`, padding: '18px' }}>
          <div style={{ fontSize: '18px', letterSpacing: '2px', marginBottom: '12px' }}>YOUR REPORTS</div>
          {reports && reports.length > 0 ? (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {reports.map((r) => (
                <li key={r.id} style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${C.panel}`, paddingBottom: '12px' }}>
                  <span style={{ fontSize: '20px' }}>
                    <span style={{ color: C.gold }}>[{r.report_type.toUpperCase()}]</span> {r.title}
                    <span style={{ color: C.text, opacity: 0.6, fontSize: '16px' }}> · {fmt(r.created_at)}</span>
                  </span>
                  <a href={`/api/reports/download?id=${r.id}`} style={{ color: C.cyan, fontSize: '20px', letterSpacing: '1px' }}>⬇ DOWNLOAD</a>
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ fontSize: '20px', margin: 0 }}>NO REPORTS YET. THEY&apos;LL APPEAR HERE ONCE YOUR ASSESSMENT IS COMPLETE.</p>
          )}
        </div>
      </div>
    </Shell>
  );
}
