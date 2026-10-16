import { NextRequest, NextResponse } from 'next/server';
import {
  createSessionToken,
  validateAdminPassword,
  isAuthenticatedAdmin,
  ADMIN_COOKIE_NAME,
} from '@/lib/auth/admin';

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();

    if (!password) {
      return NextResponse.json({ error: 'Password wajib diisi' }, { status: 400 });
    }

    const isValid = validateAdminPassword(password);
    if (!isValid) {
      return NextResponse.json({ error: 'Password admin salah' }, { status: 401 });
    }

    const token = createSessionToken();
    const response = NextResponse.json({ success: true, message: 'Autentikasi admin berhasil' });

    response.cookies.set({
      name: ADMIN_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24, // 24 hours
    });

    return response;
  } catch (err: any) {
    console.error('Admin login error:', err);
    return NextResponse.json({ error: 'Terjadi kesalahan saat otentikasi' }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true, message: 'Berhasil logout' });
  response.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return response;
}

export async function GET() {
  const isAuth = await isAuthenticatedAdmin();
  return NextResponse.json({ authenticated: isAuth });
}
