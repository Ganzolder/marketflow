import { NextRequest, NextResponse } from 'next/server';
import { signSession, getCookieName, getSessionMaxAge } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const username = typeof body.username === 'string' ? body.username.trim() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    const adminUser = process.env.ADMIN_USERNAME ?? '';
    const adminPass = process.env.ADMIN_PASSWORD ?? '';
    if (!adminUser || !adminPass) {
      return NextResponse.json({ error: 'Сервер не настроен для входа' }, { status: 500 });
    }
    if (username !== adminUser || password !== adminPass) {
      return NextResponse.json({ error: 'Неверный логин или пароль' }, { status: 401 });
    }
    const token = signSession(username);
    const cookieName = getCookieName();
    const maxAge = getSessionMaxAge();
    const res = NextResponse.json({ ok: true });
    res.cookies.set(cookieName, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge,
      path: '/',
    });
    return res;
  } catch (e) {
    return NextResponse.json({ error: 'Ошибка входа' }, { status: 500 });
  }
}
