import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Report } from '@/lib/types';

// Auth-gated download. RLS guarantees the caller can only read a report row that
// belongs to them (or admins, any). We then mint a short-lived signed URL via the
// service-role client and redirect to it — files are never public.
export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing report id' }, { status: 400 });

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Subject to RLS: returns the row only if owned by the caller or caller is admin.
  const { data: report } = await supabase
    .from('reports')
    .select('*')
    .eq('id', id)
    .maybeSingle<Report>();
  if (!report) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const admin = createAdminClient();
  const { data: signed, error } = await admin.storage
    .from('reports')
    .createSignedUrl(report.storage_path, 60, { download: report.file_name });
  if (error || !signed) {
    return NextResponse.json({ error: 'Could not generate download link' }, { status: 500 });
  }

  return NextResponse.redirect(signed.signedUrl);
}
