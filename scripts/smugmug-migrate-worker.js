#!/usr/bin/env node
const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const { Pool } = require('pg');

function loadEnv() {
  const envPath = path.resolve(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
    const [key, ...rest] = trimmed.split('=');
    process.env[key] = rest.join('=');
  }
}
loadEnv();

const args = Object.fromEntries(process.argv.slice(2).map((arg) => {
  const [k, ...v] = arg.replace(/^--/, '').split('=');
  return [k, v.length ? v.join('=') : 'true'];
}));
const schema = process.env.DATABASE_SCHEMA || 'pixilens_smugmug';
function dataDir() {
  return process.env.ADMIN_DATA_DIR || path.resolve(__dirname, '..', 'data/admin');
}
function mediaRootDir() {
  return process.env.MEDIA_ROOT || path.join(dataDir(), 'media');
}
const limitAlbums = Number(args.limitAlbums || 0);
const limitMedia = Number(args.limitMedia || 0);
const onlyAlbumKey = args.albumKey || '';
const dryRun = args.dryRun === 'true';
const skipPathPatterns = (args.skipPath || process.env.SMUGMUG_SKIP_PATHS || '/Automatic-iOS-Uploads')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);
const delayMs = Number(args.delayMs || 900);
const smugDelayMs = Number(args.smugDelayMs || 350);

const required = ['SMUGMUG_API_KEY', 'SMUGMUG_API_SECRET', 'SMUGMUG_ACCESS_TOKEN', 'SMUGMUG_ACCESS_TOKEN_SECRET', 'DATABASE_URL'];
for (const key of required) if (!process.env[key]) throw new Error(`${key} is missing`);

function sslConfig() {
  const certsDir = process.env.SSL_CERTS_DIR;
  if (certsDir) {
    const ca = path.join(certsDir, 'ca.crt');
    const cert = path.join(certsDir, 'client_grabber_user.crt');
    const key = path.join(certsDir, 'client_grabber_user.key');
    if (fs.existsSync(ca) && fs.existsSync(cert) && fs.existsSync(key)) {
      return { rejectUnauthorized: false, ca: fs.readFileSync(ca, 'utf8'), cert: fs.readFileSync(cert, 'utf8'), key: fs.readFileSync(key, 'utf8') };
    }
  }
  return { rejectUnauthorized: false };
}
const pool = new Pool({ connectionString: (process.env.DATABASE_URL || '').replace(/[?&]sslmode=[^&]+/, ''), ssl: sslConfig() });
const ident = (value) => {
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(value)) throw new Error(`Invalid identifier ${value}`);
  return `"${value}"`;
};
const qname = (table) => `${ident(schema)}.${ident(table)}`;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const slugify = (value) => (value || 'untitled').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 90) || 'untitled';
const id = (prefix, seed) => `${prefix}_${crypto.createHash('sha1').update(seed).digest('hex').slice(0, 16)}`;
const enc = (value) => encodeURIComponent(String(value)).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);

async function ensure() {
  await pool.query(`CREATE SCHEMA IF NOT EXISTS ${ident(schema)}`);
  await pool.query(`CREATE TABLE IF NOT EXISTS ${qname('migration_state')} (key text PRIMARY KEY, value jsonb NOT NULL, updated_at timestamptz NOT NULL DEFAULT now())`);
  await pool.query(`CREATE TABLE IF NOT EXISTS ${qname('folders')} (id text PRIMARY KEY,title text NOT NULL,slug text NOT NULL,description text NOT NULL DEFAULT '',parent_id text NOT NULL DEFAULT '',visibility text NOT NULL DEFAULT 'public',sort_order integer NOT NULL DEFAULT 0,smugmug_uri text,original_url text,url_path text,created_at timestamptz NOT NULL,updated_at timestamptz NOT NULL)`);
  await pool.query(`CREATE TABLE IF NOT EXISTS ${qname('galleries')} (id text PRIMARY KEY,folder_id text NOT NULL DEFAULT '',title text NOT NULL,slug text NOT NULL,description text NOT NULL DEFAULT '',visibility text NOT NULL DEFAULT 'public',sort_order integer NOT NULL DEFAULT 0,cover_media_id text NOT NULL DEFAULT '',smugmug_uri text,original_url text,url_path text,created_at timestamptz NOT NULL,updated_at timestamptz NOT NULL)`);
  await pool.query(`CREATE TABLE IF NOT EXISTS ${qname('media')} (id text PRIMARY KEY,gallery_id text NOT NULL DEFAULT '',type text NOT NULL,title text NOT NULL,caption text NOT NULL DEFAULT '',slug text NOT NULL,visibility text NOT NULL DEFAULT 'public',sort_order integer NOT NULL DEFAULT 0,provider text NOT NULL,public_url text NOT NULL,display_url text NOT NULL,delete_url text,local_path text,file_name text NOT NULL,mime_type text NOT NULL,size_bytes bigint NOT NULL DEFAULT 0,width integer,height integer,smugmug_uri text,image_key text,original_url text,url_path text,migration_status text,migration_error text,created_at timestamptz NOT NULL,updated_at timestamptz NOT NULL)`);
  await pool.query(`ALTER TABLE ${qname('folders')} DROP CONSTRAINT IF EXISTS folders_slug_key`);
  await pool.query(`ALTER TABLE ${qname('galleries')} DROP CONSTRAINT IF EXISTS galleries_slug_key`);
}

function oauthHeader(method, rawUrl, params = {}) {
  const oauth = { oauth_consumer_key: process.env.SMUGMUG_API_KEY, oauth_token: process.env.SMUGMUG_ACCESS_TOKEN, oauth_nonce: crypto.randomBytes(16).toString('hex'), oauth_timestamp: Math.floor(Date.now() / 1000).toString(), oauth_signature_method: 'HMAC-SHA1', oauth_version: '1.0' };
  const allParams = { ...params, ...oauth };
  const paramString = Object.keys(allParams).sort().map((key) => `${enc(key)}=${enc(allParams[key])}`).join('&');
  const base = [method.toUpperCase(), enc(rawUrl), enc(paramString)].join('&');
  const signingKey = `${enc(process.env.SMUGMUG_API_SECRET)}&${enc(process.env.SMUGMUG_ACCESS_TOKEN_SECRET)}`;
  oauth.oauth_signature = crypto.createHmac('sha1', signingKey).update(base).digest('base64');
  return 'OAuth ' + Object.entries(oauth).map(([k, v]) => `${enc(k)}="${enc(v)}"`).join(', ');
}

async function smugGet(apiPath, params = {}, retries = 4) {
  await sleep(smugDelayMs);
  const url = new URL(`https://api.smugmug.com${apiPath}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  for (let attempt = 1; attempt <= retries; attempt++) {
    const res = await fetch(url, { headers: { Accept: 'application/json', Authorization: oauthHeader('GET', `https://api.smugmug.com${apiPath}`, params), 'User-Agent': 'pixilens-smugmug-migrator/1.0' } });
    if (res.ok) return res.json();
    if (![429, 500, 502, 503, 504].includes(res.status) || attempt === retries) throw new Error(`SmugMug ${apiPath} HTTP ${res.status}: ${await res.text()}`);
    await sleep(attempt * 4000);
  }
}

async function collect(apiPath, key) {
  const out = []; let start = 1;
  while (true) {
    const resp = (await smugGet(apiPath, { count: '100', start: String(start), _verbosity: '1' })).Response || {};
    let arr = resp[key] || [];
    if (!Array.isArray(arr)) arr = [arr];
    out.push(...arr.filter(Boolean));
    const pages = resp.Pages || {}; const count = Number(pages.Count || arr.length); const total = Number(pages.Total || out.length);
    if (!count || start + count - 1 >= total) break;
    start += count;
  }
  return out;
}

async function upsertFolderFromWebPath(webUri) {
  const url = new URL(webUri);
  const parts = url.pathname.split('/').filter(Boolean).slice(0, -1);
  let parentId = '';
  let accumulated = '';
  let sort = 0;
  for (const part of parts) {
    accumulated += `/${part}`;
    const fid = id('folder', accumulated);
    await pool.query(`INSERT INTO ${qname('folders')} (id,title,slug,description,parent_id,visibility,sort_order,smugmug_uri,original_url,url_path,created_at,updated_at) VALUES ($1,$2,$3,'',$4,'public',$5,NULL,$6,$7,now(),now()) ON CONFLICT (id) DO UPDATE SET title=excluded.title,parent_id=excluded.parent_id,original_url=excluded.original_url,url_path=excluded.url_path,updated_at=now()`, [fid, decodeURIComponent(part).replaceAll('-', ' '), part, parentId, sort++, `https://www.pixilens.com${accumulated}`, accumulated]);
    parentId = fid;
  }
  return parentId;
}

async function imageDownloadUrl(item) {
  const uri = item?.Uris?.ImageDownload?.Uri || item?.Uris?.AlbumImageDownload?.Uri || `/api/v2/image/${item.ImageKey}-0!download`;
  const data = (await smugGet(uri)).Response || {};
  return data.ImageDownload?.Url;
}

async function largestVideo(item) {
  const uri = item?.Uris?.LargestVideo?.Uri || `/api/v2/image/${item.ImageKey}-0!largestvideo`;
  const data = (await smugGet(uri)).Response || {};
  return data.LargestVideo;
}

async function imageSizes(item) {
  const uri = item?.Uris?.ImageSizes?.Uri || `/api/v2/image/${item.ImageKey}-0!sizes`;
  const data = (await smugGet(uri)).Response || {};
  return data.ImageSizes || data.ImageSize || data;
}

function findImageUrls(payload) {
  const urls = [];
  const visit = (value) => {
    if (!value) return;
    if (Array.isArray(value)) return value.forEach(visit);
    if (typeof value === 'object') {
      if (typeof value.Url === 'string') urls.push({ url: value.Url, width: value.Width || value.width || 0, height: value.Height || value.height || 0 });
      for (const nested of Object.values(value)) visit(nested);
    }
  };
  visit(payload);
  return urls.filter((entry) => /\.(jpe?g|png|webp)(\?|$)/i.test(entry.url));
}

async function downloadBuffer(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download HTTP ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

async function archiveOriginal(buffer, galleryId, mediaId, title, extension) {
  const relative = path.join('photo-originals', galleryId, `${mediaId}-${slugify(title)}${extension || '.jpg'}`);
  const absolute = path.join(mediaRootDir(), relative);
  if (!dryRun) { await fsp.mkdir(path.dirname(absolute), { recursive: true }); await fsp.writeFile(absolute, buffer); }
  return absolute;
}

async function uploadToImgBB(buffer, name) {
  const form = new FormData();
  form.set('key', process.env.IMGBB_API_KEY);
  form.set('name', name);
  form.set('image', buffer.toString('base64'));
  const res = await fetch('https://api.imgbb.com/1/upload', { method: 'POST', body: form });
  const body = await res.json();
  if (!res.ok || !body.success) throw new Error(body?.error?.message || `ImgBB HTTP ${res.status}`);
  await sleep(delayMs);
  return body.data;
}

async function migrateMedia(galleryId, galleryPath, item, sortOrder) {
  const mediaId = id('media', item.Uri || `${galleryId}:${item.ImageKey}`);
  const existing = await pool.query(`SELECT migration_status FROM ${qname('media')} WHERE id=$1`, [mediaId]);
  if (existing.rowCount && existing.rows[0].migration_status === 'done') return 'skipped';
  const title = item.Title || item.FileName || item.ImageKey || mediaId;
  const mediaSlug = item.WebUri ? new URL(item.WebUri).pathname.split('/').filter(Boolean).pop() : slugify(title);
  try {
    if (item.IsVideo) {
      const video = await largestVideo(item);
      if (!video?.Url) throw new Error('Missing LargestVideo URL');
      const res = await fetch(video.Url);
      if (!res.ok) throw new Error(`Video download HTTP ${res.status}`);
      const buffer = Buffer.from(await res.arrayBuffer());
      const ext = video.Ext ? `.${video.Ext}` : path.extname(item.FileName || '.mp4') || '.mp4';
      const relative = path.join('videos', galleryId, `${mediaId}-${slugify(title)}${ext}`);
      const absolute = path.join(mediaRootDir(), relative);
      if (!dryRun) { await fsp.mkdir(path.dirname(absolute), { recursive: true }); await fsp.writeFile(absolute, buffer); }
      await pool.query(`INSERT INTO ${qname('media')} (id,gallery_id,type,title,caption,slug,visibility,sort_order,provider,public_url,display_url,local_path,file_name,mime_type,size_bytes,width,height,smugmug_uri,image_key,original_url,url_path,migration_status,migration_error,created_at,updated_at) VALUES ($1,$2,'video',$3,$4,$5,'public',$6,'local',$7,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,'done',NULL,now(),now()) ON CONFLICT (id) DO UPDATE SET migration_status='done',migration_error=NULL,updated_at=now()`, [mediaId, galleryId, title, item.Caption || '', mediaSlug, sortOrder, `/api/media/${mediaId}`, absolute, item.FileName || `${mediaId}${ext}`, `video/${(video.Ext || 'mp4')}`, buffer.length, video.Width || item.OriginalWidth || null, video.Height || item.OriginalHeight || null, item.Uri, item.ImageKey, item.WebUri, galleryPath ? `${galleryPath}/${mediaSlug}` : null]);
    } else {
      const url = await imageDownloadUrl(item);
      if (!url) throw new Error('Missing image download URL');
      const originalBuffer = await downloadBuffer(url);
      const uploadName = `smugmug--${galleryPath.replace(/^\//, '').replace(/[^a-zA-Z0-9]+/g, '-') || galleryId}--${item.ImageKey || mediaId}`;
      let uploaded;
      let localOriginal = null;
      let status = 'done';
      try {
        uploaded = dryRun ? { url, display_url: url, delete_url: '', width: item.OriginalWidth, height: item.OriginalHeight } : await uploadToImgBB(originalBuffer, uploadName);
      } catch (uploadError) {
        if (!String(uploadError.message || uploadError).includes('File too big')) throw uploadError;
        const ext = path.extname(item.FileName || '.jpg') || '.jpg';
        localOriginal = await archiveOriginal(originalBuffer, galleryId, mediaId, title, ext);
        const candidates = findImageUrls(await imageSizes(item));
        let fallback = null;
        for (const candidate of candidates.sort((a, b) => (b.width || 0) - (a.width || 0))) {
          try {
            const candidateBuffer = await downloadBuffer(candidate.url);
            if (candidateBuffer.length > 31_500_000) continue;
            fallback = { candidate, buffer: candidateBuffer };
            break;
          } catch {}
        }
        if (!fallback) throw new Error('File too big - original archived locally but no ImgBB display fallback found');
        uploaded = dryRun ? { url: fallback.candidate.url, display_url: fallback.candidate.url, delete_url: '', width: fallback.candidate.width, height: fallback.candidate.height } : await uploadToImgBB(fallback.buffer, `${uploadName}--display`);
        status = 'done_with_local_original';
      }
      await pool.query(`INSERT INTO ${qname('media')} (id,gallery_id,type,title,caption,slug,visibility,sort_order,provider,public_url,display_url,delete_url,local_path,file_name,mime_type,size_bytes,width,height,smugmug_uri,image_key,original_url,url_path,migration_status,migration_error,created_at,updated_at) VALUES ($1,$2,'photo',$3,$4,$5,'public',$6,'imgbb',$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,NULL,now(),now()) ON CONFLICT (id) DO UPDATE SET public_url=excluded.public_url,display_url=excluded.display_url,delete_url=excluded.delete_url,local_path=excluded.local_path,size_bytes=excluded.size_bytes,width=excluded.width,height=excluded.height,migration_status=excluded.migration_status,migration_error=NULL,updated_at=now()`, [mediaId, galleryId, title, item.Caption || '', mediaSlug, sortOrder, uploaded.url, uploaded.display_url, uploaded.delete_url || null, localOriginal, item.FileName || `${mediaId}.jpg`, item.Format ? `image/${String(item.Format).toLowerCase()}` : 'image/jpeg', originalBuffer.length, uploaded.width || item.OriginalWidth || null, uploaded.height || item.OriginalHeight || null, item.Uri, item.ImageKey, item.WebUri, galleryPath ? `${galleryPath}/${mediaSlug}` : null, status]);
    }
    return 'done';
  } catch (error) {
    await pool.query(`INSERT INTO ${qname('media')} (id,gallery_id,type,title,caption,slug,visibility,sort_order,provider,public_url,display_url,file_name,mime_type,size_bytes,smugmug_uri,image_key,original_url,url_path,migration_status,migration_error,created_at,updated_at) VALUES ($1,$2,$3,$4,'',$5,'draft',$6,'imgbb','','',$7,'',0,$8,$9,$10,$11,'error',$12,now(),now()) ON CONFLICT (id) DO UPDATE SET migration_status='error', migration_error=$12, updated_at=now()`, [mediaId, galleryId, item.IsVideo ? 'video' : 'photo', title, mediaSlug, sortOrder, item.FileName || '', item.Uri, item.ImageKey, item.WebUri, galleryPath ? `${galleryPath}/${mediaSlug}` : null, String(error.message || error).slice(0, 1000)]);
    return 'error';
  }
}

async function saveState(patch) {
  const current = await pool.query(`SELECT value FROM ${qname('migration_state')} WHERE key='smugmug'`);
  const value = { ...(current.rows[0]?.value || {}), ...patch, updatedAt: new Date().toISOString() };
  await pool.query(`INSERT INTO ${qname('migration_state')} (key,value,updated_at) VALUES ('smugmug',$1,now()) ON CONFLICT (key) DO UPDATE SET value=$1, updated_at=now()`, [JSON.stringify(value)]);
}

async function progress() {
  await ensure();
  const counts = await pool.query(`SELECT migration_status, count(*)::int FROM ${qname('media')} GROUP BY migration_status ORDER BY migration_status`);
  const state = await pool.query(`SELECT value FROM ${qname('migration_state')} WHERE key='smugmug'`);
  console.log(JSON.stringify({ state: state.rows[0]?.value || {}, media: counts.rows }, null, 2));
  await pool.end();
}

async function main() {
  if (args.progress === 'true') return progress();
  await ensure();
  const albums = await collect('/api/v2/user/pixilens!albums', 'Album');
  const eligibleAlbums = albums.filter((album) => {
    const pathname = album.WebUri ? new URL(album.WebUri).pathname : '';
    return !skipPathPatterns.some((pattern) => pathname.startsWith(pattern));
  });
  const selected = eligibleAlbums.filter((album) => !onlyAlbumKey || album.Uri.endsWith(`/${onlyAlbumKey}`)).slice(0, limitAlbums || undefined);
  await saveState({ totalAlbums: albums.length, skippedAlbums: albums.length - eligibleAlbums.length, selectedAlbums: selected.length, skipPathPatterns, mode: onlyAlbumKey ? 'single' : 'all' });
  let mediaDone = 0, mediaErrors = 0;
  for (let ai = 0; ai < selected.length; ai++) {
    const album = selected[ai];
    const folderId = await upsertFolderFromWebPath(album.WebUri);
    const galleryPath = new URL(album.WebUri).pathname;
    const galleryId = id('gallery', album.Uri);
    await pool.query(`INSERT INTO ${qname('galleries')} (id,folder_id,title,slug,description,visibility,sort_order,cover_media_id,smugmug_uri,original_url,url_path,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,'public',$6,'',$7,$8,$9,now(),now()) ON CONFLICT (id) DO UPDATE SET title=excluded.title,folder_id=excluded.folder_id,slug=excluded.slug,description=excluded.description,original_url=excluded.original_url,url_path=excluded.url_path,updated_at=now()`, [galleryId, folderId, album.Name || album.UrlName || galleryId, slugify(galleryPath), album.Description || '', ai, album.Uri, album.WebUri, galleryPath]);
    const images = await collect(album.Uri + '!images', 'AlbumImage');
    await saveState({ currentAlbum: album.WebUri, currentAlbumIndex: ai + 1, currentAlbumMedia: images.length, mediaDone, mediaErrors });
    for (let mi = 0; mi < images.length; mi++) {
      if (limitMedia && mediaDone + mediaErrors >= limitMedia) break;
      const result = await migrateMedia(galleryId, galleryPath, images[mi], mi);
      if (result === 'done') mediaDone++; else if (result === 'error') mediaErrors++;
      if ((mediaDone + mediaErrors) % 10 === 0) await saveState({ mediaDone, mediaErrors });
    }
    await saveState({ mediaDone, mediaErrors, completedAlbumIndex: ai + 1 });
    if (limitMedia && mediaDone + mediaErrors >= limitMedia) break;
  }
  await saveState({ status: 'idle', mediaDone, mediaErrors, finishedAt: new Date().toISOString() });
  console.log(JSON.stringify({ albums: selected.length, mediaDone, mediaErrors }, null, 2));
  await pool.end();
}

main().catch(async (error) => {
  console.error(error);
  try { await saveState({ status: 'failed', error: String(error.message || error) }); } catch {}
  await pool.end();
  process.exit(1);
});
