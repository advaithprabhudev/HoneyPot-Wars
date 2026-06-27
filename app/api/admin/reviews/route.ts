import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { verifyAdmin } from '@/lib/admin-guard';
import { createAdminClient } from '@/lib/supabase/admin';

const bodySchema = z.object({
  accountId: z.string().uuid(),
  sessionRequestId: z.string().uuid().optional().nullable(),
  body: z.string().min(1).max(4000),
  verdict: z.string().max(80).optional().nullable(),
});

// Post a written review on a client's check. Admin-only, server-side, service role.
export async function POST(request: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  const { accountId, sessionRequestId, body, verdict } = parsed.data;

  const db = createAdminClient();
  const { error } = await db.from('reviews').insert({
    account_id: accountId,
    session_request_id: sessionRequestId ?? null,
    body,
    verdict: verdict || null,
    created_by: admin.userId,
  });
  if (error) return NextResponse.json({ error: 'Could not save review' }, { status: 500 });

  return NextResponse.json({ ok: true });
}
