import fs from 'fs/promises';
import { NextRequest, NextResponse } from 'next/server';
import { getLibrary } from '@/lib/admin/library-store';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const store = await getLibrary();
  const media = store.media.find((item) => item.id === id && item.provider === 'local');
  if (!media?.localPath) return new NextResponse('Not found', { status: 404 });
  const file = await fs.readFile(media.localPath);
  return new NextResponse(file, {
    headers: {
      'Content-Type': media.mimeType,
      'Content-Length': String(file.length),
      'Content-Disposition': `inline; filename="${media.fileName.replaceAll('"', '')}"`,
    },
  });
}
