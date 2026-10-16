import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, isServerSupabaseConfigured } from '@/lib/supabase/server';
import { fallbackStore } from '@/lib/supabase/fallback-data';
import { ReportSubmissionSchema } from '@/lib/validations/place';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const parsed = ReportSubmissionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Data laporan tidak lengkap atau tidak valid', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { place_id, reason, description, website_honeypot } = parsed.data;

    if (website_honeypot && website_honeypot.trim().length > 0) {
      return NextResponse.json({ success: true, message: 'Laporan diterima' });
    }

    if (!isServerSupabaseConfigured) {
      const rep = fallbackStore.addReport({
        place_id,
        reason,
        description,
      });

      return NextResponse.json({
        success: true,
        message: 'Terima kasih atas laporan Anda. Tim moderator akan meninjau tempat ini.',
        data: rep,
        isFallback: true,
      });
    }

    const supabase = createServerClient()!;
    const { data, error } = await supabase
      .from('reports')
      .insert([
        {
          place_id,
          reason,
          description: description || '',
          status: 'pending',
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Supabase report error:', error);
      return NextResponse.json({ error: 'Gagal mengirim laporan ke database' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Terima kasih atas laporan Anda. Tim moderator akan meninjau tempat ini.',
      data,
      isFallback: false,
    });
  } catch (err: any) {
    console.error('POST /reports error:', err);
    return NextResponse.json({ error: 'Terjadi kesalahan sistem saat mengirim laporan' }, { status: 500 });
  }
}
