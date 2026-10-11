import { createReadStream } from 'fs';
import fs from 'fs/promises';
import path from 'path';
import { Readable } from 'stream';
import { NextRequest, NextResponse } from 'next/server';
import { getMediaById, mediaRoot } from '@/lib/admin/library-store';

const HOST_MEDIA_PREFIX = '/home/priyanka/pixilens-smugmug-admin/data/media';
const VIDEO_FALLBACK_HOST = 'https://smugmug.pixilens.online';

function resolveLocalPath(localPath: string): string {
  if (localPath.startsWith(HOST_MEDIA_PREFIX)) {
    return path.join(mediaRoot(), localPath.slice(HOST_MEDIA_PREFIX.length));
  }
  return localPath;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const found = await getMediaById(id);
  const media = found?.provider === 'local' ? found : null;
  if (!media?.localPath) return new NextResponse('Not found', { status: 404 });

  const filePath = resolveLocalPath(media.localPath);
  let size: number;
  try {
    size = (await fs.stat(filePath)).size;
  } catch {
    return NextResponse.redirect(`${VIDEO_FALLBACK_HOST}/api/media/${id}`, 302);
  }

  const headers: Record<string, string> = {
    'Content-Type': media.mimeType,
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'public, max-age=86400',
    'Content-Disposition': `inline; filename="${media.fileName.replaceAll('"', '')}"`,
  };

  // Browsers (Safari/iOS in particular) require byte-range support to play video.
  const match = /^bytes=(\d*)-(\d*)$/.exec(request.headers.get('range') || '');
  if (match && (match[1] || match[2])) {
    let start = match[1] ? Number(match[1]) : size - Number(match[2]);
    let end = match[1] && match[2] ? Number(match[2]) : size - 1;
    start = Math.max(0, start);
    end = Math.min(end, size - 1);
    if (start > end) {
      return new NextResponse(null, { status: 416, headers: { 'Content-Range': `bytes */${size}` } });
    }
    const stream = createReadStream(filePath, { start, end });
    return new NextResponse(Readable.toWeb(stream) as ReadableStream, {
      status: 206,
      headers: { ...headers, 'Content-Range': `bytes ${start}-${end}/${size}`, 'Content-Length': String(end - start + 1) },
    });
  }

  const stream = createReadStream(filePath);
  return new NextResponse(Readable.toWeb(stream) as ReadableStream, {
    headers: { ...headers, 'Content-Length': String(size) },
  });
}
