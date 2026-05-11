import { NextRequest, NextResponse } from 'next/server';
import { clearSessionCookie } from '@/lib/admin/auth';

export async function POST(request: NextRequest) {
  const response = NextResponse.redirect(new URL('/admin/login', request.url), 303);
  clearSessionCookie(response);
  return response;
}
