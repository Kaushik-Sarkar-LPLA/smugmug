import { NextRequest, NextResponse } from 'next/server';
import { setSessionCookie, verifyPassword } from '@/lib/admin/auth';

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const username = String(form.get('username') || '');
  const password = String(form.get('password') || '');
  const expectedUsername = process.env.ADMIN_USERNAME || 'admin';

  if (username !== expectedUsername || !verifyPassword(password)) {
    return NextResponse.redirect(new URL('/admin/login?error=1', request.url), 303);
  }

  const next = String(form.get('next') || '/admin');
  const response = NextResponse.redirect(new URL(next.startsWith('/admin') ? next : '/admin', request.url), 303);
  setSessionCookie(response, username);
  return response;
}
