import { NextRequest, NextResponse } from 'next/server';
import { clearSessionCookie } from '@/lib/admin/auth';

export async function POST(request: NextRequest) {
  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = '/admin/login';
  redirectUrl.search = '';
  const response = NextResponse.redirect(redirectUrl, 303);
  clearSessionCookie(response);
  return response;
}
