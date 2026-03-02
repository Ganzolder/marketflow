import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getCookieName } from '@/lib/auth';
import { verifySessionEdge } from '@/lib/auth-edge';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const cookieName = getCookieName();
  const token = request.cookies.get(cookieName)?.value;
  const secret = process.env.SESSION_SECRET;

  if (pathname === '/login' || pathname.startsWith('/api/auth/')) {
    if (token && secret && pathname === '/login') {
      const valid = await verifySessionEdge(token, secret);
      if (valid) return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  if (!token || token.length < 10 || !secret) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }
  const valid = await verifySessionEdge(token, secret);
  if (!valid) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
