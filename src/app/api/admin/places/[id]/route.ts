import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, isServerSupabaseConfigured } from '@/lib/supabase/server';
import { fallbackStore } from '@/lib/supabase/fallback-data';
import { isAuthenticatedAdmin } from '@/lib/auth/admin';
import { AdminPlaceStatusSchema } from '@/lib/validations/place';

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

    const parsed = AdminPlaceStatusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Status tidak valid', details: parsed.error.format() }, { status: 400 });
    }

    const { status } = parsed.data;

    if (!isServerSupabaseConfigured) {
      const updated = fallbackStore.updatePlaceStatus(id, status);
      if (!updated) {
        return NextResponse.json({ error: 'Tempat makan tidak ditemukan' }, { status: 404 });
      }
      return NextResponse.json({ success: true, data: updated, isFallback: true });
    }

    const supabase = createServerClient()!;
    const { data, error } = await supabase
      .from('places')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase update place status error:', error);
      return NextResponse.json({ error: 'Gagal memperbarui status' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data, isFallback: false });
  } catch (err: any) {
    console.error('PATCH /admin/places/[id] error:', err);
    return NextResponse.json({ error: 'Terjadi kesalahan sistem' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAuth = await isAuthenticatedAdmin();
    if (!isAuth) {
      return NextResponse.json({ error: 'Akses ditolak. Sesi admin diperlukan.' }, { status: 401 });
    }

    const { id } = await params;

    if (!isServerSupabaseConfigured) {
      const success = fallbackStore.deletePlace(id);
      return NextResponse.json({ success, isFallback: true });
    }

    const supabase = createServerClient()!;
    const { error } = await supabase.from('places').delete().eq('id', id);

    if (error) {
      console.error('Supabase delete place error:', error);
      return NextResponse.json({ error: 'Gagal menghapus tempat' }, { status: 500 });
    }

    return NextResponse.json({ success: true, isFallback: false });
  } catch (err: any) {
    console.error('DELETE /admin/places/[id] error:', err);
    return NextResponse.json({ error: 'Terjadi kesalahan sistem' }, { status: 500 });
  }
}
