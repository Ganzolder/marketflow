import { NextRequest, NextResponse } from 'next/server';
import { getCookieName } from '@/lib/auth';

function clearAndRespond(request: NextRequest, redirect: boolean) {
  const res = redirect
    ? NextResponse.redirect(new URL('/login', request.url))
    : NextResponse.json({ ok: true });
  res.cookies.set(getCookieName(), '', { maxAge: 0, path: '/' });
  return res;
}

export async function POST(request: NextRequest) {
  return clearAndRespond(request, false);
}

export async function GET(request: NextRequest) {
  return clearAndRespond(request, true);
}
