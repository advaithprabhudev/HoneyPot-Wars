import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { verifyAdmin } from '@/lib/admin-guard';
import { createAdminClient } from '@/lib/supabase/admin';

const metaSchema = z.object({
  accountId: z.string().uuid(),
  title: z.string().min(1).max(200),
  reportType: z.enum(['technical', 'summary', 'other']),
  sessionRequestId: z.string().uuid().optional().nullable(),
});

const MAX_BYTES = 25 * 1024 * 1024; // 25 MB

// Upload a finished report file for a client. Admin-only, server-side.
export async function POST(request: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const form = await request.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });

  const file = form.get('file');
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: 'A file is required' }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'File exceeds 25 MB limit' }, { status: 400 });
  }

  const parsed = metaSchema.safeParse({
    accountId: form.get('accountId'),
    title: form.get('title'),
    reportType: form.get('reportType'),
    sessionRequestId: form.get('sessionRequestId') || null,
  });
  if (!parsed.success) return NextResponse.json({ error: 'Invalid fields' }, { status: 400 });
  const { accountId, title, reportType, sessionRequestId } = parsed.data;

  const db = createAdminClient();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const storagePath = `${accountId}/${crypto.randomUUID()}-${safeName}`;
  const bytes = new Uint8Array(await file.arrayBuffer());

  const { error: upErr } = await db.storage
    .from('reports')
    .upload(storagePath, bytes, {
      contentType: file.type || 'application/octet-stream',
      upsert: false,
    });
  if (upErr) return NextResponse.json({ error: 'Upload failed' }, { status: 500 });

  const { error: insErr } = await db.from('reports').insert({
    account_id: accountId,
    session_request_id: sessionRequestId ?? null,
    title,
    report_type: reportType,
    storage_path: storagePath,
    file_name: safeName,
    uploaded_by: admin.userId,
  });
  if (insErr) {
    // Roll back the orphaned object if the metadata insert fails.
    await db.storage.from('reports').remove([storagePath]);
    return NextResponse.json({ error: 'Could not save report' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
