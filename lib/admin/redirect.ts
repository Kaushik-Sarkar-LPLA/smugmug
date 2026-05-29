import { NextRequest } from 'next/server';

export function adminRedirectUrl(request: NextRequest, pathname: string) {
  const forwardedHost = request.headers.get('x-forwarded-host') || request.headers.get('host') || request.nextUrl.host;
  const isLocal = forwardedHost.includes('localhost') || forwardedHost.includes('127.0.0.1') || forwardedHost.includes('192.168.') || forwardedHost.includes('10.0.');
  const proto = isLocal ? 'http' : 'https';
  const url = new URL(`${proto}://${forwardedHost}`);
  url.pathname = pathname;
  return url;
}
