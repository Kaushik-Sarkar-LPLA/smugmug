import { NextRequest, NextResponse } from 'next/server';
import { clearSessionCookie } from '@/lib/admin/auth';

export async function POST(request: NextRequest) {
  const forwardedProto = 'https';
  const forwardedHost = request.headers.get('x-forwarded-host') || request.headers.get('host') || request.nextUrl.host;
  const redirectUrl = new URL(`${forwardedProto}://${forwardedHost}/admin/login`);
  const response = NextResponse.redirect(redirectUrl, 303);
  clearSessionCookie(response);
  return response;
}
