import { NextResponse } from 'next/server';
import { getLibrary } from '@/lib/admin/library-store';
import { hasDatabase } from '@/lib/admin/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const store = await getLibrary();

    return NextResponse.json({
      hasDatabase,
      foldersCount: store.folders.length,
      galleriesCount: store.galleries.length,
      mediaCount: store.media.length,
      sampleFolders: store.folders.slice(0, 3).map((f) => ({ id: f.id, title: f.title, slug: f.slug })),
      sampleGalleries: store.galleries.slice(0, 3).map((g) => ({ id: g.id, title: g.title, slug: g.slug, folderId: g.folderId })),
    });
  } catch (error: any) {
    return NextResponse.json({
      hasDatabase: hasDatabase(),
      error: error.message,
      stack: error.stack?.split('\n').slice(0, 5),
    }, { status: 500 });
  }
}
