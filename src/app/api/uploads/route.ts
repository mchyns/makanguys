import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, isServerSupabaseConfigured } from '@/lib/supabase/server';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'Tidak ada berkas foto yang diunggah' }, { status: 400 });
    }

    if (files.length > 5) {
      return NextResponse.json({ error: 'Maksimal 5 foto per rekomendasi tempat' }, { status: 400 });
    }

    // Validate each file
    for (const file of files) {
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        return NextResponse.json(
          { error: `Format file ${file.name} tidak didukung. Harap gunakan format JPEG, PNG, atau WebP.` },
          { status: 400 }
        );
      }

      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `Ukuran file ${file.name} (${(file.size / 1024 / 1024).toFixed(1)} MB) melebihi batas maksimal 5 MB.` },
          { status: 400 }
        );
      }
    }

    // Upload files
    const uploadedPaths: string[] = [];

    if (!isServerSupabaseConfigured) {
      // In local development / fallback mode without Supabase storage credentials:
      // Convert to base64 Data URLs so preview & submission continue seamlessly!
      for (const file of files) {
        const buffer = await file.arrayBuffer();
        const base64 = Buffer.from(buffer).toString('base64');
        const dataUrl = `data:${file.type};base64,${base64}`;
        uploadedPaths.push(dataUrl);
      }

      return NextResponse.json({
        success: true,
        paths: uploadedPaths,
        isFallback: true,
      });
    }

    const supabase = createServerClient()!;

    for (const file of files) {
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      const ext = file.type === 'image/jpeg' ? 'jpg' : file.type === 'image/png' ? 'png' : 'webp';
      const fileName = `places/${Date.now()}-${crypto.randomUUID()}.${ext}`;

      const { data, error } = await supabase.storage
        .from('place-photos')
        .upload(fileName, bytes, {
          contentType: file.type,
          upsert: false,
        });

      if (error) {
        console.error('Supabase storage upload error:', error);
        return NextResponse.json(
          { error: `Gagal mengunggah foto ${file.name} ke server penyimpanan.` },
          { status: 500 }
        );
      }

      const { data: publicUrlData } = supabase.storage
        .from('place-photos')
        .getPublicUrl(data.path);

      uploadedPaths.push(publicUrlData.publicUrl || data.path);
    }

    return NextResponse.json({
      success: true,
      paths: uploadedPaths,
      isFallback: false,
    });
  } catch (err: any) {
    console.error('POST /uploads error:', err);
    return NextResponse.json(
      { error: 'Terjadi kesalahan sistem saat mengunggah foto' },
      { status: 500 }
    );
  }
}
