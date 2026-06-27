import Link from 'next/link';
import { Shell } from '@/components/Shell';
import { SignOutButton } from '@/components/SignOutButton';
import { requireAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { C } from '@/lib/theme';
import type { Report, Profile } from '@/lib/types';

type ReportRow = Report & { profiles: Pick<Profile, 'company_name' | 'email'> | null };

function fmt(d: string) {
  return new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export default async function AdminAllReports() {
  await requireAdmin();
  const supabase = createClient();
  const { data: reports } = await supabase
    .from('reports')
    .select('*, profiles(company_name, email)')
    .order('created_at', { ascending: false })
    .returns<ReportRow[]>();

  return (
    <Shell title="ALL POSTED REPORTS" subtitle={`${reports?.length ?? 0} TOTAL`} maxWidth="100%" right={<SignOutButton />}>
      <Link href="/admin" style={{ color: C.cyan, fontSize: '18px' }}>← BACK TO CONSOLE</Link>
      <div style={{ marginTop: '18px', border: `2px solid ${C.gold}`, padding: '18px' }}>
        {reports && reports.length > 0 ? (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {reports.map((r) => (
              <li key={r.id} style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${C.panel}`, paddingBottom: '12px' }}>
                <span style={{ fontSize: '20px', lineHeight: '1.5' }}>
                  <span style={{ color: C.gold }}>[{r.report_type.toUpperCase()}]</span> {r.title}
                  <span style={{ opacity: 0.7, fontSize: '17px' }}> · {(r.profiles?.company_name || r.profiles?.email || '—')}</span>
                  <span style={{ opacity: 0.5, fontSize: '15px' }}> · {fmt(r.created_at)}</span>
                </span>
                <a href={`/api/reports/download?id=${r.id}`} style={{ color: C.cyan, fontSize: '20px' }}>⬇ DOWNLOAD</a>
              </li>
            ))}
          </ul>
        ) : (
          <p style={{ fontSize: '20px', margin: 0 }}>NO REPORTS POSTED YET.</p>
        )}
      </div>
    </Shell>
  );
}
