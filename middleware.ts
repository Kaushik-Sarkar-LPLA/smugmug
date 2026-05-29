import { NextRequest, NextResponse } from 'next/server';

async function verifySession(token?: string) {
  if (!token || !token.includes('.')) return null;
  const secret = process.env.SESSION_SECRET;
  if (!secret) return null;
  const [payload, signature] = token.split('.', 2);
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signed = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  const expected = Buffer.from(signed).toString('base64url');
  if (signature !== expected) return null;
  const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { username: string; expires: number };
  if (!data.username || Date.now() > data.expires) return null;
  return data;
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (!path.startsWith('/admin')) return NextResponse.next();
  if (path === '/admin/login') return NextResponse.next();

  const session = await verifySession(request.cookies.get('pixilens_admin_session')?.value);
  if (session) return NextResponse.next();

  const forwardedProto = request.headers.get('x-forwarded-proto') || (request.nextUrl.protocol === 'https:' ? 'https' : 'http');
  const forwardedHost = request.headers.get('x-forwarded-host') || request.headers.get('host') || request.nextUrl.host;
  const redirectUrl = new URL(`${forwardedProto}://${forwardedHost}/admin/login`);
  redirectUrl.searchParams.set('next', path);
  return NextResponse.redirect(redirectUrl);
}

export const config = {
  matcher: ['/admin/:path*'],
};
