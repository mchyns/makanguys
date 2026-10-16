import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, isServerSupabaseConfigured } from '@/lib/supabase/server';
import { fallbackStore } from '@/lib/supabase/fallback-data';
import { isAuthenticatedAdmin } from '@/lib/auth/admin';

export async function GET(req: NextRequest) {
  try {
    const isAuth = await isAuthenticatedAdmin();
    if (!isAuth) {
      return NextResponse.json({ error: 'Akses ditolak. Sesi admin diperlukan.' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'pending';

    if (!isServerSupabaseConfigured) {
      const reports = fallbackStore.getReports(status);
      return NextResponse.json({ data: reports, isFallback: true });
    }

    const supabase = createServerClient()!;
    let query = supabase
      .from('reports')
      .select('*, place:places(*)')
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Supabase reports error:', error);
      return NextResponse.json({ error: 'Gagal mengambil data laporan' }, { status: 500 });
    }

    return NextResponse.json({ data: data || [], isFallback: false });
  } catch (err: any) {
    console.error('GET /admin/reports error:', err);
    return NextResponse.json({ error: 'Terjadi kesalahan sistem' }, { status: 500 });
  }
}
