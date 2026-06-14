import fs from 'fs/promises';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';
import { getLibrary, mediaRoot } from '@/lib/admin/library-store';

const HOST_MEDIA_PREFIX = '/home/priyanka/pixilens-smugmug-admin/data/media';
const VIDEO_FALLBACK_HOST = 'https://smugmug.pixilens.online';

function resolveLocalPath(localPath: string): string {
  if (localPath.startsWith(HOST_MEDIA_PREFIX)) {
    return path.join(mediaRoot(), localPath.slice(HOST_MEDIA_PREFIX.length));
  }
  return localPath;
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const store = await getLibrary();
  const media = store.media.find((item) => item.id === id && item.provider === 'local');
  if (!media?.localPath) return new NextResponse('Not found', { status: 404 });

  const filePath = resolveLocalPath(media.localPath);
  try {
    await fs.access(filePath);
    const stat = await fs.stat(filePath);
    const file = await fs.readFile(filePath);
    return new NextResponse(file, {
      headers: {
        'Content-Type': media.mimeType,
        'Content-Length': String(stat.size),
        'Content-Disposition': `inline; filename="${media.fileName.replaceAll('"', '')}"`,
      },
    });
  } catch {
    return NextResponse.redirect(`${VIDEO_FALLBACK_HOST}/api/media/${id}`, 302);
  }
}
