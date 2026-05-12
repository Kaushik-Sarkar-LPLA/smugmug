#!/usr/bin/env node
const path = require('path');
const fs = require('fs');

function sslConfig() {
  const certsDir = process.env.SSL_CERTS_DIR;
  if (certsDir) {
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
  }
  if ((process.env.POSTGRES_SSLMODE || '').toLowerCase() || (process.env.DATABASE_URL || '').includes('sslmode=')) return { rejectUnauthorized: false };
  return undefined;
}

function loadEnv() {
  const envPath = path.resolve(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
    const [key, ...rest] = trimmed.split('=');
    if (!process.env[key]) process.env[key] = rest.join('=');
  }
}

loadEnv();

const { Pool } = require('pg');
const databaseUrl = (process.env.DATABASE_URL || '').replace(/[?&]sslmode=[^&]+/, '');
const schema = process.env.DATABASE_SCHEMA || 'pixilens_smugmug';
const dataDir = process.env.ADMIN_DATA_DIR || path.resolve(__dirname, '..', 'data/admin');
if (!databaseUrl) throw new Error('DATABASE_URL is missing');
if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(schema)) throw new Error('Invalid schema');
const ident = (value) => `"${value}"`;
const qname = (table) => `${ident(schema)}.${ident(table)}`;
const pool = new Pool({ connectionString: databaseUrl, ssl: sslConfig() });

async function ensure() {
  await pool.query(`CREATE SCHEMA IF NOT EXISTS ${ident(schema)}`);
  await pool.query(`CREATE TABLE IF NOT EXISTS ${qname('kv_store')} (key text PRIMARY KEY, value jsonb NOT NULL, updated_at timestamptz NOT NULL DEFAULT now())`);
  await pool.query(`CREATE TABLE IF NOT EXISTS ${qname('folders')} (id text PRIMARY KEY,title text NOT NULL,slug text NOT NULL,description text NOT NULL DEFAULT '',parent_id text NOT NULL DEFAULT '',visibility text NOT NULL DEFAULT 'public',sort_order integer NOT NULL DEFAULT 0,created_at timestamptz NOT NULL,updated_at timestamptz NOT NULL)`);
  await pool.query(`CREATE TABLE IF NOT EXISTS ${qname('galleries')} (id text PRIMARY KEY,folder_id text NOT NULL DEFAULT '',title text NOT NULL,slug text NOT NULL,description text NOT NULL DEFAULT '',visibility text NOT NULL DEFAULT 'public',sort_order integer NOT NULL DEFAULT 0,cover_media_id text NOT NULL DEFAULT '',created_at timestamptz NOT NULL,updated_at timestamptz NOT NULL)`);
  await pool.query(`CREATE TABLE IF NOT EXISTS ${qname('media')} (id text PRIMARY KEY,gallery_id text NOT NULL DEFAULT '',type text NOT NULL,title text NOT NULL,caption text NOT NULL DEFAULT '',slug text NOT NULL,visibility text NOT NULL DEFAULT 'public',sort_order integer NOT NULL DEFAULT 0,provider text NOT NULL,public_url text NOT NULL,display_url text NOT NULL,delete_url text,local_path text,file_name text NOT NULL,mime_type text NOT NULL,size_bytes bigint NOT NULL DEFAULT 0,width integer,height integer,created_at timestamptz NOT NULL,updated_at timestamptz NOT NULL)`);
}

function readJson(name, fallback) {
  const file = path.join(dataDir, name);
  if (!fs.existsSync(file)) return fallback;
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

async function main() {
  await ensure();
  const library = readJson('library.json', { folders: [], galleries: [], media: [] });
  const homepage = readJson('homepage-config.json', null);
  if (homepage) {
    await pool.query(`INSERT INTO ${qname('kv_store')} (key,value,updated_at) VALUES ($1,$2,now()) ON CONFLICT (key) DO UPDATE SET value=excluded.value, updated_at=now()`, ['homepage_config', JSON.stringify(homepage)]);
  }
  for (const folder of library.folders || []) {
    await pool.query(`INSERT INTO ${qname('folders')} (id,title,slug,description,parent_id,visibility,sort_order,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT (id) DO UPDATE SET title=excluded.title,slug=excluded.slug,description=excluded.description,parent_id=excluded.parent_id,visibility=excluded.visibility,sort_order=excluded.sort_order,updated_at=excluded.updated_at`, [folder.id, folder.title, folder.slug, folder.description, folder.parentId, folder.visibility, folder.sortOrder, folder.createdAt, folder.updatedAt]);
  }
  for (const gallery of library.galleries || []) {
    await pool.query(`INSERT INTO ${qname('galleries')} (id,folder_id,title,slug,description,visibility,sort_order,cover_media_id,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) ON CONFLICT (id) DO UPDATE SET folder_id=excluded.folder_id,title=excluded.title,slug=excluded.slug,description=excluded.description,visibility=excluded.visibility,sort_order=excluded.sort_order,cover_media_id=excluded.cover_media_id,updated_at=excluded.updated_at`, [gallery.id, gallery.folderId, gallery.title, gallery.slug, gallery.description, gallery.visibility, gallery.sortOrder, gallery.coverMediaId, gallery.createdAt, gallery.updatedAt]);
  }
  for (const item of library.media || []) {
    await pool.query(`INSERT INTO ${qname('media')} (id,gallery_id,type,title,caption,slug,visibility,sort_order,provider,public_url,display_url,delete_url,local_path,file_name,mime_type,size_bytes,width,height,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20) ON CONFLICT (id) DO UPDATE SET gallery_id=excluded.gallery_id,type=excluded.type,title=excluded.title,caption=excluded.caption,slug=excluded.slug,visibility=excluded.visibility,sort_order=excluded.sort_order,provider=excluded.provider,public_url=excluded.public_url,display_url=excluded.display_url,delete_url=excluded.delete_url,local_path=excluded.local_path,file_name=excluded.file_name,mime_type=excluded.mime_type,size_bytes=excluded.size_bytes,width=excluded.width,height=excluded.height,updated_at=excluded.updated_at`, [item.id, item.galleryId, item.type, item.title, item.caption, item.slug, item.visibility, item.sortOrder, item.provider, item.publicUrl, item.displayUrl, item.deleteUrl || null, item.localPath || null, item.fileName, item.mimeType, item.sizeBytes, item.width || null, item.height || null, item.createdAt, item.updatedAt]);
  }
  const counts = await Promise.all(['folders','galleries','media','kv_store'].map(async table => [table, (await pool.query(`SELECT count(*)::int AS count FROM ${qname(table)}`)).rows[0].count]));
  console.log(Object.fromEntries(counts));
  await pool.end();
}
main().catch((error) => { console.error(error); process.exit(1); });
