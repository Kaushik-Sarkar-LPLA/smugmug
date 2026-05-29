import { NextResponse } from 'next/server';
import { getPool, hasDatabase, qname } from '@/lib/admin/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!hasDatabase()) {
    return NextResponse.json({ error: 'No database configured' }, { status: 500 });
  }

  try {
    const db = getPool();

    const folders = await db.query(`SELECT count(*) as count FROM ${qname('folders')}`);
    const galleries = await db.query(`SELECT count(*) as count FROM ${qname('galleries')}`);
    const media = await db.query(`SELECT count(*) as count FROM ${qname('media')}`);
    const migrationState = await db.query(`SELECT value FROM ${qname('migration_state')} WHERE key='smugmug'`);

    return NextResponse.json({
      hasDb: true,
      dbOk: true,
      counts: {
        folders: Number(folders.rows[0].count),
        galleries: Number(galleries.rows[0].count),
        media: Number(media.rows[0].count),
      },
      migrationState: migrationState.rows[0]?.value || {},
      sampleGallery: await db.query(`SELECT id, title, slug FROM ${qname('galleries')} LIMIT 3`),
    });
  } catch (error: any) {
    return NextResponse.json({
      hasDb: true,
      dbOk: false,
      error: error.message,
    }, { status: 500 });
  }
}
