import Link from 'next/link';
import { Shell } from '@/components/Shell';
import { SignOutButton } from '@/components/SignOutButton';
import { AdminReviewForm } from '@/components/AdminReviewForm';
import { requireAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { C } from '@/lib/theme';
import type { SessionRequest, Profile, Review } from '@/lib/types';

type CheckRow = SessionRequest & {
  profiles: Pick<Profile, 'company_name' | 'email'> | null;
  reviews: Review[] | null;
};

function fmt(d: string) {
  return new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export default async function AdminReviews() {
  await requireAdmin();
  const supabase = createClient();
  const { data: checks } = await supabase
    .from('session_requests')
    .select('*, profiles(company_name, email), reviews(*)')
    .order('requested_at', { ascending: false })
    .returns<CheckRow[]>();

  return (
    <Shell title="POST REVIEWS" subtitle="WRITE A VERDICT ON A CLIENT CHECK" maxWidth="100%" right={<SignOutButton />}>
      <Link href="/admin" style={{ color: C.cyan, fontSize: '18px' }}>← BACK TO CONSOLE</Link>
      <div style={{ marginTop: '18px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {checks && checks.length > 0 ? (
          checks.map((c) => (
            <div key={c.id} style={{ border: `2px solid ${C.gold}`, padding: '16px' }}>
              <div style={{ fontSize: '20px', lineHeight: '1.5' }}>
                <span style={{ color: C.gold }}>{(c.profiles?.company_name || '—').toUpperCase()}</span>{' '}
                <span style={{ opacity: 0.7 }}>{c.profiles?.email}</span>
              </div>
              <div style={{ fontSize: '19px' }}>CHECK: <span style={{ color: C.cyan }}>{c.repo_url}</span> · {fmt(c.requested_at)} · {c.status.toUpperCase()}</div>

              {c.reviews && c.reviews.length > 0 && (
                <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {c.reviews.map((rv) => (
                    <div key={rv.id} style={{ background: C.panel, borderLeft: `3px solid ${C.gold}`, padding: '8px 12px' }}>
                      {rv.verdict && <span className="font-press" style={{ fontSize: '10px', color: C.gold }}>{rv.verdict.toUpperCase()} · </span>}
                      <span style={{ fontSize: '18px' }}>{rv.body}</span>
                    </div>
                  ))}
                </div>
              )}

              <AdminReviewForm accountId={c.account_id} sessionRequestId={c.id} />
            </div>
          ))
        ) : (
          <p style={{ fontSize: '20px' }}>NO CHECKS TO REVIEW YET.</p>
        )}
      </div>
    </Shell>
  );
}
