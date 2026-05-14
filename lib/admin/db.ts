import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';

let pool: Pool | null = null;
let initialized = false;

export function databaseUrl() {
  return process.env.DATABASE_URL || '';
}

export function databaseUrlWithoutSsl() {
  return (process.env.DATABASE_URL || '').replace(/[?&]sslmode=[^&]+/, '');
}

export function schemaName() {
  return process.env.DATABASE_SCHEMA || 'pixilens_smugmug';
}

export function hasDatabase() {
  return Boolean(databaseUrl());
}

function ident(value: string) {
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(value)) throw new Error(`Invalid identifier: ${value}`);
  return `"${value}"`;
}

export function qname(table: string) {
  return `${ident(schemaName())}.${ident(table)}`;
}

function sslConfig() {
  const certsDir = process.env.SSL_CERTS_DIR;
  if (certsDir) {
    try {
      const ca = path.join(certsDir, 'ca.crt');
      const cert = path.join(certsDir, 'client_grabber_user.crt');
      const key = path.join(certsDir, 'client_grabber_user.key');
      if (fs.existsSync(ca) && fs.existsSync(cert) && fs.existsSync(key)) {
        return {
          rejectUnauthorized: false,
          ca: fs.readFileSync(ca, 'utf8'),
          cert: fs.readFileSync(cert, 'utf8'),
          key: fs.readFileSync(key, 'utf8'),
        };
      }
    } catch {
      return { rejectUnauthorized: false };
    }
  }
  if ((process.env.POSTGRES_SSLMODE || process.env.SSL_MODE || '').toLowerCase() || (process.env.DATABASE_URL || '').includes('sslmode=')) return { rejectUnauthorized: false };
  return undefined;
}

export function getPool() {
  if (!pool) {
    const ssl = sslConfig();
    const connectionString = ssl ? databaseUrlWithoutSsl() : databaseUrl();
    pool = new Pool({ connectionString, ssl });
  }
  return pool;
}

export async function ensureDatabase() {
  if (!hasDatabase() || initialized) return;
  const db = getPool();
  const schema = ident(schemaName());
  await db.query(`CREATE SCHEMA IF NOT EXISTS ${schema}`);
  await db.query(`
    CREATE TABLE IF NOT EXISTS ${qname('kv_store')} (
      key text PRIMARY KEY,
      value jsonb NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `);
  await db.query(`
    CREATE TABLE IF NOT EXISTS ${qname('folders')} (
      id text PRIMARY KEY,
      title text NOT NULL,
      slug text NOT NULL,
      description text NOT NULL DEFAULT '',
      parent_id text NOT NULL DEFAULT '',
      visibility text NOT NULL DEFAULT 'public',
      sort_order integer NOT NULL DEFAULT 0,
      smugmug_uri text,
      original_url text,
      url_path text,
      created_at timestamptz NOT NULL,
      updated_at timestamptz NOT NULL
    )
  `);
  await db.query(`
    CREATE TABLE IF NOT EXISTS ${qname('galleries')} (
      id text PRIMARY KEY,
      folder_id text NOT NULL DEFAULT '',
      title text NOT NULL,
      slug text NOT NULL,
      description text NOT NULL DEFAULT '',
      visibility text NOT NULL DEFAULT 'public',
      sort_order integer NOT NULL DEFAULT 0,
      cover_media_id text NOT NULL DEFAULT '',
      smugmug_uri text,
      original_url text,
      url_path text,
      created_at timestamptz NOT NULL,
      updated_at timestamptz NOT NULL
    )
  `);
  await db.query(`
    CREATE TABLE IF NOT EXISTS ${qname('media')} (
      id text PRIMARY KEY,
      gallery_id text NOT NULL DEFAULT '',
      type text NOT NULL,
      title text NOT NULL,
      caption text NOT NULL DEFAULT '',
      slug text NOT NULL,
      visibility text NOT NULL DEFAULT 'public',
      sort_order integer NOT NULL DEFAULT 0,
      provider text NOT NULL,
      public_url text NOT NULL,
      display_url text NOT NULL,
      delete_url text,
      local_path text,
      file_name text NOT NULL,
      mime_type text NOT NULL,
      size_bytes bigint NOT NULL DEFAULT 0,
      width integer,
      height integer,
      smugmug_uri text,
      image_key text,
      original_url text,
      url_path text,
      migration_status text,
      migration_error text,
      created_at timestamptz NOT NULL,
      updated_at timestamptz NOT NULL
    )
  `);
  await db.query(`ALTER TABLE ${qname('folders')} DROP CONSTRAINT IF EXISTS folders_slug_key`);
  await db.query(`ALTER TABLE ${qname('galleries')} DROP CONSTRAINT IF EXISTS galleries_slug_key`);
  for (const column of ['smugmug_uri text', 'original_url text', 'url_path text']) {
    await db.query(`ALTER TABLE ${qname('folders')} ADD COLUMN IF NOT EXISTS ${column}`);
    await db.query(`ALTER TABLE ${qname('galleries')} ADD COLUMN IF NOT EXISTS ${column}`);
  }
  for (const column of ['smugmug_uri text', 'image_key text', 'original_url text', 'url_path text', 'migration_status text', 'migration_error text']) {
    await db.query(`ALTER TABLE ${qname('media')} ADD COLUMN IF NOT EXISTS ${column}`);
  }
  await db.query(`
    CREATE TABLE IF NOT EXISTS ${qname('migration_state')} (
      key text PRIMARY KEY,
      value jsonb NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `);
  initialized = true;
}
