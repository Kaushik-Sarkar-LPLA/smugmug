import { NextRequest } from 'next/server';

export function adminRedirectUrl(request: NextRequest, pathname: string) {
  const forwardedHost = request.headers.get('x-forwarded-host') || request.headers.get('host') || request.nextUrl.host;
  const url = new URL(`https://${forwardedHost}`);
  url.pathname = pathname;
  return url;
}
