import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, isServerSupabaseConfigured } from '@/lib/supabase/server';
import { fallbackStore } from '@/lib/supabase/fallback-data';
import { isAuthenticatedAdmin } from '@/lib/auth/admin';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAuth = await isAuthenticatedAdmin();
    if (!isAuth) {
      return NextResponse.json({ error: 'Akses ditolak. Sesi admin diperlukan.' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { status } = body;

    if (!['pending', 'reviewed', 'resolved', 'dismissed'].includes(status)) {
      return NextResponse.json({ error: 'Status laporan tidak valid' }, { status: 400 });
    }

    if (!isServerSupabaseConfigured) {
      const updated = fallbackStore.updateReportStatus(id, status);
      return NextResponse.json({ success: true, data: updated, isFallback: true });
    }

    const supabase = createServerClient()!;
    const { data, error } = await supabase
      .from('reports')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase update report error:', error);
      return NextResponse.json({ error: 'Gagal memperbarui status laporan' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data, isFallback: false });
  } catch (err: any) {
    console.error('PATCH /admin/reports/[id] error:', err);
    return NextResponse.json({ error: 'Terjadi kesalahan sistem' }, { status: 500 });
  }
}
