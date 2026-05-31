#!/usr/bin/env node
/**
 * Compress all homepage hero slides to web-sized WebP/JPEG and upload to ImgBB.
 * Updates homepage_config in Postgres (or local JSON) with heroUrl on each item.
 *
 * Usage: npm run hero:compress
 *        npm run hero:compress -- --dryRun=true
 *        npm run hero:compress -- --force=true   (recompress even if heroUrl exists)
 */
const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const { Pool } = require('pg');
const sharp = require('sharp');

const HERO_WEB_MAX_WIDTH = 1920;
const HERO_WEB_QUALITY = 86;

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
const dryRun = args.dryRun === 'true';
const force = args.force === 'true';

const schema = process.env.DATABASE_SCHEMA || 'pixilens_smugmug';
function dataDir() {
  return process.env.ADMIN_DATA_DIR || path.resolve(__dirname, '..', 'data/admin');
}

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
  return { rejectUnauthorized: false };
}

const ident = (value) => `"${value}"`;
const qname = (table) => `${ident(schema)}.${ident(table)}`;

async function compressForHeroWeb(source) {
  const pipeline = sharp(source, { failOn: 'none' }).rotate().resize({
    width: HERO_WEB_MAX_WIDTH,
    height: HERO_WEB_MAX_WIDTH,
    fit: 'inside',
    withoutEnlargement: true,
  });
  const webp = await pipeline.clone().webp({ quality: HERO_WEB_QUALITY, effort: 4 }).toBuffer();
  const webpMeta = await sharp(webp).metadata();
  const jpeg = await pipeline.clone().jpeg({ quality: HERO_WEB_QUALITY, mozjpeg: true }).toBuffer();
  if (jpeg.length < webp.length * 0.92) {
    const jpegMeta = await sharp(jpeg).metadata();
    return {
      buffer: jpeg,
      width: jpegMeta.width || HERO_WEB_MAX_WIDTH,
      height: jpegMeta.height || 1280,
      mimeType: 'image/jpeg',
      ext: '.jpg',
    };
  }
  return {
    buffer: webp,
    width: webpMeta.width || HERO_WEB_MAX_WIDTH,
    height: webpMeta.height || 1280,
    mimeType: 'image/webp',
    ext: '.webp',
  };
}

async function downloadBuffer(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download HTTP ${res.status} ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

async function uploadToImgBB(buffer, name) {
  const key = process.env.IMGBB_API_KEY;
  if (!key) throw new Error('IMGBB_API_KEY is missing');
  const form = new FormData();
  form.set('key', key);
  form.set('name', name);
  form.set('image', buffer.toString('base64'));
  const res = await fetch('https://api.imgbb.com/1/upload', { method: 'POST', body: form });
  const body = await res.json();
  if (!res.ok || !body.success) throw new Error(body?.error?.message || `ImgBB HTTP ${res.status}`);
  return body.data;
}

async function loadConfig(pool) {
  const jsonPath = path.join(dataDir(), 'homepage-config.json');
  if (pool) {
    try {
      const result = await pool.query(`SELECT value FROM ${qname('kv_store')} WHERE key = $1`, ['homepage_config']);
      if (result.rowCount) return result.rows[0].value;
    } catch (error) {
      console.warn('DB read failed, falling back to JSON:', error.message);
    }
  }
  if (fs.existsSync(jsonPath)) return JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  throw new Error('homepage_config not found in DB or JSON');
}

async function saveConfig(pool, config) {
  const jsonPath = path.join(dataDir(), 'homepage-config.json');
  await fsp.mkdir(dataDir(), { recursive: true });
  await fsp.writeFile(jsonPath, JSON.stringify(config, null, 2));
  if (pool) {
    await pool.query(
      `INSERT INTO ${qname('kv_store')} (key, value, updated_at) VALUES ($1, $2, now())
       ON CONFLICT (key) DO UPDATE SET value = excluded.value, updated_at = now()`,
      ['homepage_config', JSON.stringify(config)],
    );
  }
}

async function main() {
  let pool = null;
  if (process.env.DATABASE_URL) {
    pool = new Pool({
      connectionString: (process.env.DATABASE_URL || '').replace(/[?&]sslmode=[^&]+/, ''),
      ssl: sslConfig(),
    });
  }

  const config = await loadConfig(pool);
  const heroes = config.items.filter((item) => item.enabled && item.useInHero);
  const manifest = [];
  let updated = 0;
  let skipped = 0;

  console.log(`Hero slides to process: ${heroes.length}${dryRun ? ' (dry run)' : ''}`);

  for (const item of heroes) {
    if (item.heroUrl && !force) {
      skipped += 1;
      manifest.push({ id: item.id, status: 'skipped', heroUrl: item.heroUrl });
      console.log(`skip ${item.id} (heroUrl exists)`);
      continue;
    }

    const sourceUrl = item.imageUrl || item.displayUrl;
    if (!sourceUrl) {
      manifest.push({ id: item.id, status: 'error', error: 'No source URL' });
      console.warn(`skip ${item.id}: no source URL`);
      continue;
    }

    try {
      console.log(`compress ${item.id} <= ${sourceUrl.slice(0, 72)}...`);
      const original = await downloadBuffer(sourceUrl);
      const compressed = await compressForHeroWeb(original);
      const kb = Math.round(compressed.buffer.length / 1024);
      const origKb = Math.round(original.length / 1024);

      if (dryRun) {
        manifest.push({
          id: item.id,
          status: 'dry-run',
          sourceUrl,
          originalKb: origKb,
          compressedKb: kb,
          width: compressed.width,
          height: compressed.height,
          mimeType: compressed.mimeType,
        });
        console.log(`  ${origKb}KB -> ${kb}KB ${compressed.mimeType} ${compressed.width}x${compressed.height}`);
        continue;
      }

      const uploadName = `hero-web--${item.id.replace(/[^a-zA-Z0-9]+/g, '-')}`;
      const uploaded = await uploadToImgBB(compressed.buffer, uploadName);
      item.heroUrl = uploaded.url || uploaded.display_url;
      item.heroWidth = compressed.width;
      item.heroHeight = compressed.height;
      updated += 1;
      manifest.push({
        id: item.id,
        status: 'done',
        heroUrl: item.heroUrl,
        originalKb: origKb,
        compressedKb: kb,
        width: compressed.width,
        height: compressed.height,
      });
      console.log(`  ${origKb}KB -> ${kb}KB | ${item.heroUrl}`);
      await new Promise((r) => setTimeout(r, 1200));
    } catch (error) {
      manifest.push({ id: item.id, status: 'error', error: String(error.message || error) });
      console.error(`  ERROR ${item.id}:`, error.message || error);
    }
  }

  if (!dryRun && updated > 0) {
    await saveConfig(pool, config);
    console.log(`Saved homepage_config (${updated} heroUrl updates)`);
  }

  const manifestPath = path.join(dataDir(), 'hero-compress-manifest.json');
  await fsp.mkdir(dataDir(), { recursive: true });
  await fsp.writeFile(manifestPath, JSON.stringify({ at: new Date().toISOString(), manifest }, null, 2));
  console.log(`Manifest: ${manifestPath}`);
  console.log(JSON.stringify({ total: heroes.length, updated, skipped, errors: manifest.filter((m) => m.status === 'error').length }, null, 2));

  if (pool) await pool.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
