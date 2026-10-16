import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, isServerSupabaseConfigured } from '@/lib/supabase/server';
import { fallbackStore } from '@/lib/supabase/fallback-data';
import { PlaceSubmissionSchema } from '@/lib/validations/place';
import { generateSlug } from '@/lib/utils/slug';
import { isAuthenticatedAdmin } from '@/lib/auth/admin';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q') || '';
    const category = searchParams.get('category') || '';
    const price_range = searchParams.get('price_range') || '';
    const sort = searchParams.get('sort') || 'newest';
    const userLat = searchParams.get('lat') ? parseFloat(searchParams.get('lat')!) : undefined;
    const userLng = searchParams.get('lng') ? parseFloat(searchParams.get('lng')!) : undefined;
    
    // Check if requester is admin asking for all or specific status
    const requestedStatus = searchParams.get('status');
    let statusFilter = 'published';
    if (requestedStatus && requestedStatus !== 'published') {
      const isAdmin = await isAuthenticatedAdmin();
      if (isAdmin) {
        statusFilter = requestedStatus;
      }
    }

    if (!isServerSupabaseConfigured) {
      // Use fallback store
      const places = fallbackStore.getPlaces({
        q,
        category,
        price_range,
        sort,
        userLat,
        userLng,
        status: statusFilter,
      });

      return NextResponse.json({
        data: places,
        isFallback: true,
      });
    }

    const supabase = createServerClient()!;
    let query = supabase
      .from('places')
      .select('*, photos:place_photos(*)')
      .eq('status', statusFilter);

    if (category && category !== 'all') {
      query = query.eq('category', category);
    }

    if (price_range && price_range !== 'all') {
      query = query.eq('price_range', price_range);
    }

    if (q) {
      query = query.or(`name.ilike.%${q}%,featured_food.ilike.%${q}%,address_text.ilike.%${q}%,description.ilike.%${q}%`);
    }

    if (sort === 'oldest') {
      query = query.order('created_at', { ascending: true });
    } else if (sort === 'name_asc') {
      query = query.order('name', { ascending: true });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    const { data, error } = await query;

    if (error) {
      console.error('Supabase query error:', error);
      // Fallback gracefully on query error
      const places = fallbackStore.getPlaces({ q, category, price_range, sort, userLat, userLng, status: statusFilter });
      return NextResponse.json({ data: places, isFallback: true });
    }

    // Attach public URLs to photos if needed
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
    console.error('API /places error:', err);
    return NextResponse.json({ error: 'Gagal memuat rekomendasi tempat makan' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 1. Zod Validation & Honeypot Check
    const parsed = PlaceSubmissionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Data formulir tidak valid', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Honeypot check: If bot filled the hidden honeypot, reject silently
    if (data.website_honeypot && data.website_honeypot.trim().length > 0) {
      return NextResponse.json({ success: true, message: 'Diterima' });
    }

    // 2. Generate slug
    const slug = generateSlug(data.name, data.address_text);

    // 3. Prepare place record (Auto-publish immediately so recommendations appear on map right away)
    const placeRecord = {
      slug,
      name: data.name,
      featured_food: data.featured_food,
      category: data.category,
      description: data.description,
      price_min: data.price_min || null,
      price_max: data.price_max || null,
      price_range: data.price_range,
      address_text: data.address_text,
      latitude: data.latitude,
      longitude: data.longitude,
      contributor_name: data.is_anonymous ? null : (data.contributor_name || null),
      is_anonymous: data.is_anonymous,
      status: 'published' as const,
    };

    // 4. Save to Database or Fallback Store
    if (!isServerSupabaseConfigured) {
      const saved = fallbackStore.addPlace({
        ...placeRecord,
        photos: data.photos.map((p, idx) => ({
          id: crypto.randomUUID(),
          place_id: '',
          storage_path: p,
          url: p,
          alt_text: data.name,
          sort_order: idx,
          created_at: new Date().toISOString(),
        })),
      });

      return NextResponse.json({
        success: true,
        message: 'Rekomendasi berhasil ditambahkan dan langsung tayang di peta.',
        data: saved,
        isFallback: true,
      });
    }

    const supabase = createServerClient()!;
    const { data: insertedPlace, error: insertError } = await supabase
      .from('places')
      .insert([placeRecord])
      .select()
      .single();

    if (insertError) {
      console.error('Supabase place insert error:', insertError);
      return NextResponse.json(
        { error: 'Gagal menyimpan rekomendasi ke database' },
        { status: 500 }
      );
    }

    // Insert photos
    if (data.photos && data.photos.length > 0) {
      const photosToInsert = data.photos.map((storagePath, idx) => ({
        place_id: insertedPlace.id,
        storage_path: storagePath,
        alt_text: `${data.name} - ${data.featured_food}`,
        sort_order: idx,
      }));

      const { error: photoError } = await supabase
        .from('place_photos')
        .insert(photosToInsert);

      if (photoError) {
        console.warn('Failed to insert photos records:', photoError);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Rekomendasi berhasil ditambahkan dan langsung tayang di peta.',
      data: insertedPlace,
      isFallback: false,
    });
  } catch (err: any) {
    console.error('POST /places error:', err);
    return NextResponse.json(
      { error: 'Terjadi kesalahan sistem saat memproses rekomendasi' },
      { status: 500 }
    );
  }
}
