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
    const status = searchParams.get('status') || 'pending'; // Default admin view: pending

    if (!isServerSupabaseConfigured) {
      const places = fallbackStore.getPlaces({ status });
      return NextResponse.json({
        data: places,
        isFallback: true,
      });
    }

    const supabase = createServerClient()!;
    let query = supabase
      .from('places')
      .select('*, photos:place_photos(*)')
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Admin places query error:', error);
      return NextResponse.json({ error: 'Gagal mengambil data rekomendasi' }, { status: 500 });
    }

    const formatted = (data || []).map((place: any) => {
      const photos = (place.photos || []).map((photo: any) => {
        let url = photo.storage_path;
        if (!url.startsWith('http')) {
          const { data: pubData } = supabase.storage.from('place-photos').getPublicUrl(photo.storage_path);
          url = pubData?.publicUrl || photo.storage_path;
        }
        return { ...photo, url };
      });
      return { ...place, photos };
    });

    return NextResponse.json({
      data: formatted,
      isFallback: false,
    });
  } catch (err: any) {
    console.error('GET /admin/places error:', err);
    return NextResponse.json({ error: 'Terjadi kesalahan sistem' }, { status: 500 });
  }
}
