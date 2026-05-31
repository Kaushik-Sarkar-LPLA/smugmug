#!/usr/bin/env node
const fs = require('fs');
const crypto = require('crypto');
const { Pool } = require('pg');

function loadEnv() {
  const envPath = require('path').resolve(__dirname, '..', '.env');
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
const skipPathPatterns = (args.skipPath || process.env.SMUGMUG_SKIP_PATHS || '/Automatic-iOS-Uploads')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);
const smugDelayMs = Number(args.smugDelayMs || 350);
const verbose = args.verbose === 'true';

const required = ['SMUGMUG_API_KEY', 'SMUGMUG_API_SECRET', 'SMUGMUG_ACCESS_TOKEN', 'SMUGMUG_ACCESS_TOKEN_SECRET', 'DATABASE_URL'];
for (const key of required) if (!process.env[key]) throw new Error(`${key} is missing`);

const enc = (value) => encodeURIComponent(String(value)).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const id = (prefix, seed) => `${prefix}_${crypto.createHash('sha1').update(seed).digest('hex').slice(0, 16)}`;

function sslConfig() {
  const certsDir = process.env.SSL_CERTS_DIR;
  if (certsDir) {
    const ca = require('path').join(certsDir, 'ca.crt');
    const cert = require('path').join(certsDir, 'client_grabber_user.crt');
    const key = require('path').join(certsDir, 'client_grabber_user.key');
    if (fs.existsSync(ca) && fs.existsSync(cert) && fs.existsSync(key)) {
      return { rejectUnauthorized: false, ca: fs.readFileSync(ca, 'utf8'), cert: fs.readFileSync(cert, 'utf8'), key: fs.readFileSync(key, 'utf8') };
    }
  }
  return { rejectUnauthorized: false };
}

const pool = new Pool({ connectionString: (process.env.DATABASE_URL || '').replace(/[?&]sslmode=[^&]+/, ''), ssl: sslConfig() });
const ident = (value) => `"${value}"`;
const qname = (table) => `${ident(schema)}.${ident(table)}`;

function oauthHeader(method, rawUrl, params = {}) {
  const oauth = {
    oauth_consumer_key: process.env.SMUGMUG_API_KEY,
    oauth_token: process.env.SMUGMUG_ACCESS_TOKEN,
    oauth_nonce: crypto.randomBytes(16).toString('hex'),
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_version: '1.0',
  };
  const allParams = { ...params, ...oauth };
  const paramString = Object.keys(allParams).sort().map((key) => `${enc(key)}=${enc(allParams[key])}`).join('&');
  const base = [method.toUpperCase(), enc(rawUrl), enc(paramString)].join('&');
  const signingKey = `${enc(process.env.SMUGMUG_API_SECRET)}&${enc(process.env.SMUGMUG_ACCESS_TOKEN_SECRET)}`;
  oauth.oauth_signature = crypto.createHmac('sha1', signingKey).update(base).digest('base64');
  return 'OAuth ' + Object.entries(oauth).map(([k, v]) => `${enc(k)}="${enc(v)}"`).join(', ');
}

async function smugGet(apiPath, params = {}, retries = 5) {
  await sleep(smugDelayMs);
  for (let attempt = 1; attempt <= retries; attempt++) {
    const res = await fetch(`https://api.smugmug.com${apiPath}?${new URLSearchParams(params)}`, {
      headers: {
        Accept: 'application/json',
        Authorization: oauthHeader('GET', `https://api.smugmug.com${apiPath}`, params),
        'User-Agent': 'pixilens-smugmug-compare/1.0',
      },
    });
    if (res.ok) return res.json();
    const body = await res.text();
    const retryable = [429, 500, 502, 503, 504].includes(res.status) || (res.status === 401 && /nonce_used|oauth_problem/.test(body));
    if (!retryable || attempt === retries) throw new Error(`SmugMug ${apiPath} HTTP ${res.status}: ${body}`);
    await sleep(attempt * 2000);
  }
}

async function collect(apiPath, key) {
  const out = [];
  let start = 1;
  while (true) {
    const resp = (await smugGet(apiPath, { count: '100', start: String(start), _verbosity: '1' })).Response || {};
    let arr = resp[key] || [];
    if (!Array.isArray(arr)) arr = [arr];
    out.push(...arr.filter(Boolean));
    const pages = resp.Pages || {};
    const count = Number(pages.Count || arr.length);
    const total = Number(pages.Total || out.length);
    if (!count || start + count - 1 >= total) break;
    start += count;
  }
  return out;
}

function isSkipped(pathname) {
  return skipPathPatterns.some((pattern) => pathname.startsWith(pattern));
}

function folderPathsFromAlbumPath(pathname) {
  const parts = pathname.split('/').filter(Boolean).slice(0, -1);
  const folders = [];
  let accumulated = '';
  for (const part of parts) {
    accumulated += `/${part}`;
    folders.push(accumulated);
  }
  return folders;
}

async function loadDb() {
  const galleries = (await pool.query(`SELECT id, title, url_path, smugmug_uri, original_url FROM ${qname('galleries')}`)).rows;
  const folders = (await pool.query(`SELECT id, title, url_path FROM ${qname('folders')}`)).rows;
  const mediaRows = (await pool.query(`
    SELECT gallery_id, type, migration_status, image_key, smugmug_uri, title, file_name, original_url, migration_error
    FROM ${qname('media')}
  `)).rows;
  const mediaByGallery = new Map();
  for (const row of mediaRows) {
    if (!mediaByGallery.has(row.gallery_id)) mediaByGallery.set(row.gallery_id, []);
    mediaByGallery.get(row.gallery_id).push(row);
  }
  return {
    galleriesByUri: new Map(galleries.filter((g) => g.smugmug_uri).map((g) => [g.smugmug_uri, g])),
    galleriesByPath: new Map(galleries.filter((g) => g.url_path).map((g) => [g.url_path, g])),
    foldersByPath: new Map(folders.filter((f) => f.url_path).map((f) => [f.url_path, f])),
    mediaByGallery,
    galleryCount: galleries.length,
    folderCount: folders.length,
    mediaCount: mediaRows.length,
  };
}

async function albumMediaKeys(album) {
  const items = await collect(`${album.Uri}!images`, 'AlbumImage');
  const photos = [];
  const videos = [];
  for (const item of items) {
    const entry = {
      imageKey: item.ImageKey,
      uri: item.Uri,
      webUri: item.WebUri,
      fileName: item.FileName || item.Title || item.ImageKey,
      isVideo: Boolean(item.IsVideo),
    };
    if (item.IsVideo) videos.push(entry);
    else photos.push(entry);
  }
  return { photos, videos, total: items.length };
}

async function main() {
  console.error('Fetching SmugMug albums...');
  const allAlbums = await collect('/api/v2/user/pixilens!albums', 'Album');
  const skippedAlbums = allAlbums.filter((album) => isSkipped(new URL(album.WebUri).pathname));
  const eligibleAlbums = allAlbums.filter((album) => !isSkipped(new URL(album.WebUri).pathname));

  console.error('Loading database...');
  const db = await loadDb();

  const expectedFolderPaths = new Set();
  for (const album of eligibleAlbums) {
    for (const folderPath of folderPathsFromAlbumPath(new URL(album.WebUri).pathname)) {
      expectedFolderPaths.add(folderPath);
    }
  }

  const missingFolders = [...expectedFolderPaths].filter((path) => !db.foldersByPath.has(path)).sort();
  const extraFolders = [...db.foldersByPath.keys()].filter((path) => !expectedFolderPaths.has(path)).sort();

  const missingGalleries = [];
  const extraGalleries = [];
  const galleryMismatches = [];
  const missingMedia = [];
  const dbErrors = [];

  for (const album of eligibleAlbums) {
    const pathname = new URL(album.WebUri).pathname;
    const gallery = db.galleriesByUri.get(album.Uri) || db.galleriesByPath.get(pathname);
    if (!gallery) {
      missingGalleries.push({
        title: album.Name || album.Title,
        path: pathname,
        url: album.WebUri,
        smugCount: Number(album.ImageCount || 0),
      });
      continue;
    }

    const media = db.mediaByGallery.get(gallery.id) || [];
    const dbTotal = media.length;
    const dbDone = media.filter((m) => m.migration_status === 'done' || m.migration_status === 'done_with_local_original').length;
    const dbErrorsInGallery = media.filter((m) => m.migration_status === 'error');
    const dbPhotos = media.filter((m) => m.type === 'photo').length;
    const dbVideos = media.filter((m) => m.type === 'video').length;
    const smugCount = Number(album.ImageCount || 0);

    for (const row of dbErrorsInGallery) {
      dbErrors.push({
        gallery: gallery.title,
        galleryPath: gallery.url_path,
        galleryUrl: gallery.original_url,
        image: row.title || row.file_name,
        imageUrl: row.original_url,
        error: row.migration_error,
      });
    }

    if (dbTotal !== smugCount || dbDone + dbErrorsInGallery.length !== smugCount) {
      galleryMismatches.push({
        title: gallery.title,
        path: pathname,
        url: album.WebUri,
        smugCount,
        dbTotal,
        dbDone,
        dbErrors: dbErrorsInGallery.length,
        dbPhotos,
        dbVideos,
      });
    }
  }

  for (const [path, gallery] of db.galleriesByPath.entries()) {
    const hasAlbum = eligibleAlbums.some((album) => new URL(album.WebUri).pathname === path);
    if (!hasAlbum) extraGalleries.push({ title: gallery.title, path, url: gallery.original_url });
  }

  console.error(`Drilling into ${galleryMismatches.length} galleries with count mismatches...`);
  for (const mismatch of galleryMismatches) {
    const album = eligibleAlbums.find((a) => new URL(a.WebUri).pathname === mismatch.path);
    if (!album) continue;
    const gallery = db.galleriesByUri.get(album.Uri) || db.galleriesByPath.get(mismatch.path);
    const media = db.mediaByGallery.get(gallery.id) || [];
    const dbKeys = new Set(media.map((m) => m.image_key).filter(Boolean));
    const { photos, videos } = await albumMediaKeys(album);
    const smugPhotos = photos.filter((p) => !dbKeys.has(p.imageKey));
    const smugVideos = videos.filter((v) => !dbKeys.has(v.imageKey));
    const dbKeySet = new Set([...photos, ...videos].map((item) => item.imageKey));
    const extraDb = media.filter((m) => m.image_key && !dbKeySet.has(m.image_key));

    mismatch.smugPhotos = photos.length;
    mismatch.smugVideos = videos.length;
    mismatch.missingPhotos = smugPhotos.length;
    mismatch.missingVideos = smugVideos.length;
    mismatch.extraDb = extraDb.length;

    for (const item of [...smugPhotos, ...smugVideos]) {
      missingMedia.push({
        gallery: mismatch.title,
        galleryPath: mismatch.path,
        galleryUrl: mismatch.url,
        type: item.isVideo ? 'video' : 'photo',
        fileName: item.fileName,
        imageKey: item.imageKey,
        imageUrl: item.webUri,
      });
    }
  }

  for (const missing of missingGalleries) {
    const album = eligibleAlbums.find((a) => new URL(a.WebUri).pathname === missing.path);
    if (!album) continue;
    const { photos, videos } = await albumMediaKeys(album);
    for (const item of [...photos, ...videos]) {
      missingMedia.push({
        gallery: missing.title,
        galleryPath: missing.path,
        galleryUrl: missing.url,
        type: item.isVideo ? 'video' : 'photo',
        fileName: item.fileName,
        imageKey: item.imageKey,
        imageUrl: item.webUri,
      });
    }
  }

  const smugEligibleMedia = eligibleAlbums.reduce((sum, album) => sum + Number(album.ImageCount || 0), 0);
  const smugSkippedMedia = skippedAlbums.reduce((sum, album) => sum + Number(album.ImageCount || 0), 0);

  const report = {
    summary: {
      smugAlbumsTotal: allAlbums.length,
      smugAlbumsSkipped: skippedAlbums.length,
      smugAlbumsEligible: eligibleAlbums.length,
      smugEligibleMedia,
      smugSkippedMedia,
      dbGalleries: db.galleryCount,
      dbFolders: db.folderCount,
      dbMedia: db.mediaCount,
      expectedFolders: expectedFolderPaths.size,
      missingFolders: missingFolders.length,
      extraFolders: extraFolders.length,
      missingGalleries: missingGalleries.length,
      extraGalleries: extraGalleries.length,
      galleriesWithCountMismatch: galleryMismatches.length,
      missingMediaItems: missingMedia.length,
      dbErrorItems: dbErrors.length,
      skipPathPatterns,
    },
    missingFolders: missingFolders.map((path) => ({ path, url: `https://www.pixilens.com${path}` })),
    extraFolders: extraFolders.map((path) => ({ path, ...(db.foldersByPath.get(path) || {}) })),
    missingGalleries,
    extraGalleries,
    galleryMismatches,
    missingMedia,
    dbErrors,
    skippedAlbums: skippedAlbums.map((album) => ({
      title: album.Name || album.Title,
      path: new URL(album.WebUri).pathname,
      url: album.WebUri,
      imageCount: Number(album.ImageCount || 0),
    })),
  };

  const hasProblems =
    report.summary.missingFolders > 0 ||
    report.summary.missingGalleries > 0 ||
    report.summary.missingMediaItems > 0 ||
    report.summary.dbErrorItems > 0;

  console.log(JSON.stringify(report, null, 2));
  await pool.end();

  if (hasProblems) {
    console.error(`\nAUDIT FAILED: ${report.summary.missingGalleries} missing galleries, ${report.summary.missingMediaItems} missing media, ${report.summary.dbErrorItems} error items, ${report.summary.missingFolders} missing folders.`);
    process.exit(1);
  }

  console.error('\nAUDIT PASSED: SmugMug eligible content matches database (skipped albums excluded).');
}

main().catch(async (error) => {
  console.error(error);
  try { await pool.end(); } catch {}
  process.exit(1);
});
