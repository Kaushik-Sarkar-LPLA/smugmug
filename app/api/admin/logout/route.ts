import { NextRequest, NextResponse } from 'next/server';
import { clearSessionCookie } from '@/lib/admin/auth';

export async function POST(request: NextRequest) {
  const forwardedHost = request.headers.get('x-forwarded-host') || request.headers.get('host') || request.nextUrl.host;
  const isLocal = forwardedHost.includes('localhost') || forwardedHost.includes('127.0.0.1') || forwardedHost.includes('192.168.') || forwardedHost.includes('10.0.');
  const forwardedProto = isLocal ? 'http' : 'https';
  const redirectUrl = new URL(`${forwardedProto}://${forwardedHost}/admin/login`);
  const response = NextResponse.redirect(redirectUrl, 303);
  clearSessionCookie(response);
  return response;
}
