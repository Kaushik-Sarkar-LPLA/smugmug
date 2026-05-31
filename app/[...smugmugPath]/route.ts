import { NextRequest, NextResponse } from 'next/server';
import { resolveLegacySmugmugPath } from '@/lib/smugmug-redirect';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ smugmugPath: string[] }> };

/** 301/308 redirect old SmugMug gallery, folder, and photo URLs to the new site routes. */
function publicOrigin(request: NextRequest) {
  const host = (request.headers.get('x-forwarded-host') || request.headers.get('host') || request.nextUrl.host)
    .split(',')[0]
    .trim();
  const hostname = host.split(':')[0];
  const forwarded = request.headers.get('x-forwarded-proto');
  const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';
  const proto = forwarded || (isLocal ? 'http' : 'https');
  return `${proto}://${hostname}`;
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  const { smugmugPath } = await params;
  const legacyPath = `/${smugmugPath.join('/')}`;
  const destination = await resolveLegacySmugmugPath(legacyPath);
  if (!destination) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return NextResponse.redirect(`${publicOrigin(request)}${destination}`, 308);
}

export async function HEAD(request: NextRequest, context: RouteContext) {
  return GET(request, context);
}
