import { NextRequest, NextResponse } from 'next/server';
import { setSessionCookie, verifyPassword } from '@/lib/admin/auth';

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const username = String(form.get('username') || '');
  const password = String(form.get('password') || '');
  const expectedUsername = process.env.ADMIN_USERNAME || 'admin';

  const forwardedHost = request.headers.get('x-forwarded-host') || request.headers.get('host') || request.nextUrl.host;
  const isLocal = forwardedHost.includes('localhost') || forwardedHost.includes('127.0.0.1') || forwardedHost.includes('192.168.') || forwardedHost.includes('10.0.');
  const forwardedProto = isLocal ? 'http' : 'https';
  const baseUrl = `${forwardedProto}://${forwardedHost}`;

  if (username !== expectedUsername || !verifyPassword(password)) {
    return NextResponse.redirect(new URL('/admin/login?error=1', baseUrl), 303);
  }

  const next = String(form.get('next') || '/admin');
  const redirectUrl = new URL(baseUrl);
  redirectUrl.pathname = next.startsWith('/admin') ? next : '/admin';
  const response = NextResponse.redirect(redirectUrl, 303);
  setSessionCookie(response, username);
  return response;
}
