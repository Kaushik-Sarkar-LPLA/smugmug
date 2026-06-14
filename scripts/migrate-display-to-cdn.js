#!/usr/bin/env node
/**
 * migrate-display-to-cdn.js
 *
 * Downloads display_url images from ImgBB and saves them to the local CDN
 * directory on priyanka. Updates DB display_url to cdn.pixilens.online URLs.
 *
 * Full-res public_url remains on ImgBB (only used on lightbox click).
 *
 * Usage:
 *   node scripts/migrate-display-to-cdn.js              # run migration
 *   node scripts/migrate-display-to-cdn.js --progress   # show counts only
 *   node scripts/migrate-display-to-cdn.js --limit=100  # test with 100 images
 *   node scripts/migrate-display-to-cdn.js --concurrency=5
 */

'use strict';

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { Pool } = require('pg');

// ── Config ────────────────────────────────────────────────────────────────────

const CDN_PUBLIC_URL = process.env.CDN_PUBLIC_URL || 'https://cdn.pixilens.online';
const CDN_DIR        = process.env.CDN_DIR        || '/home/priyanka/pixilens-cdn/photos';
const SCHEMA         = process.env.DATABASE_SCHEMA || 'pixilens_smugmug';
const CONCURRENCY    = parseInt(process.env.CONCURRENCY || '10', 10);
const DELAY_MS       = parseInt(process.env.DELAY_MS    || '50',  10);
const RETRY_MAX      = 3;

// Parse CLI flags
const args        = process.argv.slice(2);
const progressOnly = args.includes('--progress');
const limitArg    = args.find(a => a.startsWith('--limit='));
const concArg     = args.find(a => a.startsWith('--concurrency='));
const LIMIT       = limitArg  ? parseInt(limitArg.split('=')[1],  10) : null;
const concurrency = concArg   ? parseInt(concArg.split('=')[1],   10) : CONCURRENCY;

// ── DB helpers ────────────────────────────────────────────────────────────────

function sslConfig() {
  const certsDir = process.env.SSL_CERTS_DIR;
  if (certsDir) {
    try {
      return {
        rejectUnauthorized: false,
        ca:   fs.readFileSync(path.join(certsDir, 'ca.crt'),                    'utf8'),
        cert: fs.readFileSync(path.join(certsDir, 'client_grabber_user.crt'),   'utf8'),
        key:  fs.readFileSync(path.join(certsDir, 'client_grabber_user.key'),   'utf8'),
      };
    } catch { /* fall through */ }
  }
  const { SSL_CA, SSL_CERT, SSL_KEY } = process.env;
  if (SSL_CA && SSL_CERT && SSL_KEY) {
    try {
      return {
        rejectUnauthorized: false,
        ca:   Buffer.from(SSL_CA,   'base64').toString('utf8'),
        cert: Buffer.from(SSL_CERT, 'base64').toString('utf8'),
        key:  Buffer.from(SSL_KEY,  'base64').toString('utf8'),
      };
    } catch { /* fall through */ }
  }
  return { rejectUnauthorized: false };
}

function getPool() {
  const dbUrl = (process.env.DATABASE_URL || '').replace(/[?&]sslmode=[^&]+/, '');
  if (!dbUrl) throw new Error('DATABASE_URL not set');
  return new Pool({ connectionString: dbUrl, ssl: sslConfig() });
}

const qname = t => `"${SCHEMA}"."${t}"`;

// ── HTTP download ─────────────────────────────────────────────────────────────

function download(url, retries = RETRY_MAX) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    const req = mod.get(url, { timeout: 30000 }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return download(res.headers.location, retries).then(resolve, reject);
      }
      if (res.statusCode !== 200) {
        res.resume();
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    });
    req.on('error', (err) => {
      if (retries > 0) {
        setTimeout(() => download(url, retries - 1).then(resolve, reject), 1000);
      } else {
        reject(err);
      }
    });
    req.on('timeout', () => {
      req.destroy();
      if (retries > 0) {
        setTimeout(() => download(url, retries - 1).then(resolve, reject), 1000);
      } else {
        reject(new Error(`Timeout: ${url}`));
      }
    });
  });
}

// ── Concurrency pool ──────────────────────────────────────────────────────────

async function runPool(items, fn, limit) {
  const results = [];
  let i = 0;
  async function next() {
    if (i >= items.length) return;
    const idx = i++;
    try {
      results[idx] = await fn(items[idx], idx);
    } catch (e) {
      results[idx] = { error: e.message };
    }
    await next();
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, next));
  return results;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const pool = getPool();

  // Show progress only
  if (progressOnly) {
    const r = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE provider = 'imgbb')  AS imgbb,
        COUNT(*) FILTER (WHERE provider = 'cdn')    AS cdn,
        COUNT(*)                                     AS total
      FROM ${qname('media')}
      WHERE type = 'photo'
    `);
    const { imgbb, cdn, total } = r.rows[0];
    console.log(`Total photos : ${total}`);
    console.log(`On ImgBB     : ${imgbb}`);
    console.log(`Migrated CDN : ${cdn}`);
    console.log(`Remaining    : ${parseInt(imgbb)}`);
    await pool.end();
    return;
  }

  // Ensure CDN dir exists
  fs.mkdirSync(CDN_DIR, { recursive: true });

  // Fetch rows to migrate
  const { rows } = await pool.query(`
    SELECT id, display_url
    FROM ${qname('media')}
    WHERE type = 'photo'
      AND provider = 'imgbb'
      AND display_url LIKE 'https://i.ibb.co/%'
    ORDER BY created_at ASC
    ${LIMIT ? `LIMIT ${LIMIT}` : ''}
  `);

  if (rows.length === 0) {
    console.log('Nothing to migrate.');
    await pool.end();
    return;
  }

  console.log(`Migrating ${rows.length} images → ${CDN_DIR}`);
  console.log(`CDN base: ${CDN_PUBLIC_URL}`);
  console.log(`Concurrency: ${concurrency}`);
  console.log('');

  let done = 0, errors = 0;
  const startTime = Date.now();

  // Batch DB updates
  const pending = [];
  async function flushBatch() {
    if (pending.length === 0) return;
    const batch = pending.splice(0);
    const values = batch.map((r, i) => `($${i * 2 + 1}, $${i * 2 + 2})`).join(', ');
    const params = batch.flatMap(r => [r.id, r.cdnUrl]);
    await pool.query(`
      UPDATE ${qname('media')} AS m
      SET display_url = v.url, provider = 'cdn'
      FROM (VALUES ${values}) AS v(id, url)
      WHERE m.id = v.id
    `, params);
  }

  await runPool(rows, async (row, idx) => {
    if (DELAY_MS > 0) await new Promise(r => setTimeout(r, DELAY_MS));

    const ext   = path.extname(row.display_url.split('?')[0]) || '.jpg';
    const fname = `${row.id}${ext}`;
    const fpath = path.join(CDN_DIR, fname);
    const cdnUrl = `${CDN_PUBLIC_URL}/${fname}`;

    try {
      // Skip if already on disk (partial resume)
      if (!fs.existsSync(fpath)) {
        const buf = await download(row.display_url);
        fs.writeFileSync(fpath, buf);
      }

      pending.push({ id: row.id, cdnUrl });
      if (pending.length >= 50) await flushBatch();

      done++;
      if (done % 100 === 0 || done === rows.length) {
        const elapsed  = ((Date.now() - startTime) / 1000).toFixed(0);
        const pct      = ((done / rows.length) * 100).toFixed(1);
        const rate     = (done / (Date.now() - startTime) * 1000).toFixed(1);
        const remaining = Math.round((rows.length - done) / rate);
        console.log(`[${elapsed}s] ${done}/${rows.length} (${pct}%) | ${rate}/s | ~${remaining}s left | errors: ${errors}`);
      }
    } catch (e) {
      errors++;
      console.error(`ERROR ${row.id}: ${e.message}`);
    }
  }, concurrency);

  await flushBatch();

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log('');
  console.log(`Done in ${elapsed}s — migrated: ${done}, errors: ${errors}`);

  await pool.end();
}

main().catch(e => { console.error(e); process.exit(1); });
