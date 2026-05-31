import { NextRequest, NextResponse } from 'next/server';
import { resolveLegacySmugmugPath } from '@/lib/smugmug-redirect';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ smugmugPath: string[] }> };

/** 301/308 redirect old SmugMug gallery, folder, and photo URLs to the new site routes. */
export async function GET(request: NextRequest, { params }: RouteContext) {
  const { smugmugPath } = await params;
  const legacyPath = `/${smugmugPath.join('/')}`;
  const destination = await resolveLegacySmugmugPath(legacyPath);
  if (!destination) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  const redirectUrl = new URL(destination, request.nextUrl);
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
  const proto = request.headers.get('x-forwarded-proto') || redirectUrl.protocol.replace(':', '');
  if (host) {
    redirectUrl.protocol = `${proto}:`;
    redirectUrl.host = host.split(',')[0].trim();
  }
  return NextResponse.redirect(redirectUrl, 308);
}

export async function HEAD(request: NextRequest, context: RouteContext) {
  return GET(request, context);
}
