import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, isServerSupabaseConfigured } from '@/lib/supabase/server';
import { fallbackStore } from '@/lib/supabase/fallback-data';
import { isAuthenticatedAdmin } from '@/lib/auth/admin';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const isAdmin = await isAuthenticatedAdmin();

    if (!isServerSupabaseConfigured) {
      const place = fallbackStore.getPlaceBySlug(slug, isAdmin);
      if (!place) {
        return NextResponse.json({ error: 'Tempat makan tidak ditemukan' }, { status: 404 });
      }

      // Fetch related recommendations (same category or recent)
      const related = fallbackStore
        .getPlaces({ category: place.category })
        .filter((p) => p.id !== place.id)
        .slice(0, 3);

      return NextResponse.json({
        data: place,
        related,
        isFallback: true,
      });
    }

    const supabase = createServerClient()!;
    let query = supabase
      .from('places')
      .select('*, photos:place_photos(*)')
      .eq('slug', slug);

    if (!isAdmin) {
      query = query.eq('status', 'published');
    }

    const { data: place, error } = await query.maybeSingle();

    if (error || !place) {
      return NextResponse.json({ error: 'Tempat makan tidak ditemukan' }, { status: 404 });
    }

    // Attach public URLs to photos
    const photos = (place.photos || []).map((photo: any) => {
      let url = photo.storage_path;
      if (!url.startsWith('http')) {
        const { data: pubData } = supabase.storage.from('place-photos').getPublicUrl(photo.storage_path);
        url = pubData?.publicUrl || photo.storage_path;
      }
      return { ...photo, url };
    });

    const formattedPlace = { ...place, photos };

    // Fetch related places
    const { data: relatedData } = await supabase
      .from('places')
      .select('*, photos:place_photos(*)')
      .eq('status', 'published')
      .eq('category', place.category)
      .neq('id', place.id)
      .limit(3);

    const related = (relatedData || []).map((rel: any) => {
      const relPhotos = (rel.photos || []).map((photo: any) => {
        let url = photo.storage_path;
        if (!url.startsWith('http')) {
          const { data: pubData } = supabase.storage.from('place-photos').getPublicUrl(photo.storage_path);
          url = pubData?.publicUrl || photo.storage_path;
        }
        return { ...photo, url };
      });
      return { ...rel, photos: relPhotos };
    });

    return NextResponse.json({
      data: formattedPlace,
      related,
      isFallback: false,
    });
  } catch (err: any) {
    console.error('GET /places/[slug] error:', err);
    return NextResponse.json({ error: 'Gagal mengambil informasi tempat' }, { status: 500 });
  }
}
