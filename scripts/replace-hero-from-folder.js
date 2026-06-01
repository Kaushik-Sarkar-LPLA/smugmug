#!/usr/bin/env node
/**
 * Replace homepage hero slideshow from a local folder.
 * Gallery masonry items (useInGallery) are kept; new heroes are hero-only.
 *
 * Usage:
 *   npm run hero:replace -- --folder=hero-images/heronew
 *   npm run hero:replace -- --folder=hero-images/heronew --dryRun=true
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

const folder = path.resolve(process.cwd(), args.folder || 'hero-images/heronew');
const dryRun = args.dryRun === 'true';

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

function naturalSort(a, b) {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
}

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
    };
  }
  return {
    buffer: webp,
    width: webpMeta.width || HERO_WEB_MAX_WIDTH,
    height: webpMeta.height || 1280,
    mimeType: 'image/webp',
  };
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
  if (!fs.existsSync(folder)) throw new Error(`Folder not found: ${folder}`);

  const files = fs.readdirSync(folder)
    .filter((name) => /\.(jpe?g|png|webp)$/i.test(name) && !name.startsWith('.'))
    .sort(naturalSort);

  if (!files.length) throw new Error(`No images in ${folder}`);

  let pool = null;
  if (process.env.DATABASE_URL) {
    pool = new Pool({
      connectionString: (process.env.DATABASE_URL || '').replace(/[?&]sslmode=[^&]+/, ''),
      ssl: sslConfig(),
    });
  }

  const config = await loadConfig(pool);
  const galleryItems = config.items
    .filter((item) => item.useInGallery)
    .map((item) => ({ ...item, useInHero: false, enabled: item.enabled !== false }));

  console.log(`Folder: ${folder}`);
  console.log(`New hero images: ${files.length}`);
  console.log(`Keeping gallery items: ${galleryItems.length} (useInGallery only)`);

  const newHeroItems = [];
  for (let i = 0; i < files.length; i += 1) {
    const fileName = files[i];
    const filePath = path.join(folder, fileName);
    const baseName = path.parse(fileName).name;
    const id = `hero-new-${String(i + 1).padStart(2, '0')}-${baseName.replace(/[^a-zA-Z0-9._-]+/g, '-')}`;

    const source = fs.readFileSync(filePath);
    const meta = await sharp(source).metadata();
    const compressed = await compressForHeroWeb(source);
    const origKb = Math.round(source.length / 1024);
    const webKb = Math.round(compressed.buffer.length / 1024);

    console.log(`[${i + 1}/${files.length}] ${fileName} ${origKb}KB -> ${webKb}KB ${compressed.mimeType}`);

    if (dryRun) {
      newHeroItems.push({
        id,
        fileName,
        imageUrl: `dry-run-full://${fileName}`,
        displayUrl: `dry-run-display://${fileName}`,
        heroUrl: `dry-run-hero://${fileName}`,
        heroWidth: compressed.width,
        heroHeight: compressed.height,
        width: meta.width || 1920,
        height: meta.height || 1280,
        sourceWebUri: `/hero-new/${fileName}`,
        enabled: true,
        useInHero: true,
        useInGallery: false,
        sortOrder: i + 1,
        objectPosition: 'center 32%',
        alt: baseName.replace(/[-_]+/g, ' '),
      });
      continue;
    }

    const fullUpload = await uploadToImgBB(source, `pixilens-hero-new-full--${baseName}`);
    await new Promise((r) => setTimeout(r, 1200));
    const heroUpload = await uploadToImgBB(compressed.buffer, `pixilens-hero-new-web--${baseName}`);
    await new Promise((r) => setTimeout(r, 1200));

    newHeroItems.push({
      id,
      fileName,
      imageUrl: fullUpload.url || fullUpload.display_url,
      displayUrl: fullUpload.display_url || fullUpload.url,
      heroUrl: heroUpload.url || heroUpload.display_url,
      heroWidth: compressed.width,
      heroHeight: compressed.height,
      width: meta.width || compressed.width,
      height: meta.height || compressed.height,
      sourceWebUri: `/hero-new/${fileName}`,
      enabled: true,
      useInHero: true,
      useInGallery: false,
      sortOrder: i + 1,
      objectPosition: 'center 32%',
      alt: baseName.replace(/[-_]+/g, ' '),
    });
  }

  config.items = [...galleryItems, ...newHeroItems];
  config.slideDurationSeconds = config.slideDurationSeconds || 5;

  if (!dryRun) {
    await saveConfig(pool, config);
    console.log('Saved homepage_config');
  }

  const manifestPath = path.join(dataDir(), 'hero-replace-manifest.json');
  await fsp.mkdir(dataDir(), { recursive: true });
  await fsp.writeFile(manifestPath, JSON.stringify({
    at: new Date().toISOString(),
    folder,
    dryRun,
    heroCount: newHeroItems.length,
    galleryCount: galleryItems.length,
    heroes: newHeroItems.map((item) => ({
      id: item.id,
      fileName: item.fileName,
      heroUrl: item.heroUrl,
      useInGallery: item.useInGallery,
    })),
  }, null, 2));

  console.log(JSON.stringify({
    dryRun,
    heroSlides: newHeroItems.length,
    gallerySlides: galleryItems.length,
    totalItems: config.items.length,
    manifestPath,
  }, null, 2));

  if (pool) await pool.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
