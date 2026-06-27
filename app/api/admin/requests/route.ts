import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { verifyAdmin } from '@/lib/admin-guard';
import { createAdminClient } from '@/lib/supabase/admin';

const bodySchema = z.object({
  requestId: z.string().uuid(),
  action: z.enum(['approve', 'reject']),
});

// Approve or reject a session request. Admin-only, server-side, via service role.
export async function POST(request: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  const { requestId, action } = parsed.data;

  const db = createAdminClient();
  const status = action === 'approve' ? 'approved' : 'rejected';

  const { data: req, error: updErr } = await db
    .from('session_requests')
    .update({ status, reviewed_at: new Date().toISOString(), reviewed_by: admin.userId })
    .eq('id', requestId)
    .select('account_id')
    .maybeSingle<{ account_id: string }>();
  if (updErr || !req) {
    return NextResponse.json({ error: 'Could not update request' }, { status: 500 });
  }

  // Approving a request activates the client's account.
  if (action === 'approve') {
    const { error: actErr } = await db
      .from('profiles')
      .update({ account_status: 'active' })
      .eq('id', req.account_id);
    if (actErr) return NextResponse.json({ error: 'Could not activate account' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, status });
}
