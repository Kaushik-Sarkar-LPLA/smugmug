import { NextResponse } from 'next/server';
import { hasDatabase, databaseUrl } from '@/lib/admin/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const dbUrl = databaseUrl();
  const hasDb = hasDatabase();
  const sslMode = process.env.POSTGRES_SSLMODE || process.env.SSL_MODE || 'unset';
  const dbSchema = process.env.DATABASE_SCHEMA || 'unset';

  // Try a quick DB connection
  let dbOk = false;
  let dbError = '';
  if (hasDb) {
    try {
      const { getPool } = await import('@/lib/admin/db');
      const pool = getPool();
      const r = await pool.query('SELECT 1 as ok');
      dbOk = r.rows[0]?.ok === 1;
    } catch (e: unknown) {
      dbError = String(e instanceof Error ? e.message : e);
    }
  }

  return NextResponse.json({
    hasDb,
    dbUrlPrefix: dbUrl ? dbUrl.substring(0, 40) + '...' : 'none',
    dbSchema,
    sslMode,
    dbOk,
    dbError: dbError ? dbError.substring(0, 200) : '',
    env: {
      node: process.version,
      hasDbUrl: !!process.env.DATABASE_URL,
      hasSslMode: !!process.env.SSL_MODE,
      hasPgSslMode: !!process.env.POSTGRES_SSLMODE,
      hasSslCa: !!process.env.SSL_CA,
      hasSslCert: !!process.env.SSL_CERT,
      hasSslKey: !!process.env.SSL_KEY,
      sslCaLen: (process.env.SSL_CA || '').length,
      sslCertLen: (process.env.SSL_CERT || '').length,
      sslKeyLen: (process.env.SSL_KEY || '').length,
    },
  });
}
