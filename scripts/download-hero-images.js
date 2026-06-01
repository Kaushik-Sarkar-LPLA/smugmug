#!/usr/bin/env node
/**
 * Download homepage hero slides for local editing.
 *
 * Usage:
 *   npm run hero:download
 *   npm run hero:download -- --out=hero-images --full=true
 */
const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
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

const outDir = path.resolve(process.cwd(), args.out || 'hero-images');
const includeFull = args.full !== 'false';
const includeWeb = args.web !== 'false';

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

function safeName(value) {
  return String(value || 'slide').replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '') || 'slide';
}

function extFromUrl(url, fallback = '.jpg') {
  try {
    const base = path.basename(new URL(url).pathname);
    const ext = path.extname(base);
    if (ext && ext.length <= 5) return ext.toLowerCase();
  } catch {
    // ignore
  }
  return fallback;
}

async function downloadBuffer(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return Buffer.from(await res.arrayBuffer());
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

async function main() {
  let pool = null;
  if (process.env.DATABASE_URL) {
    pool = new Pool({
      connectionString: (process.env.DATABASE_URL || '').replace(/[?&]sslmode=[^&]+/, ''),
      ssl: sslConfig(),
    });
  }

  const config = await loadConfig(pool);
  const heroes = config.items
    .filter((item) => item.enabled && item.useInHero)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  await fsp.mkdir(outDir, { recursive: true });

  const manifest = [];
  console.log(`Downloading ${heroes.length} hero slides -> ${outDir}`);

  for (const item of heroes) {
    const base = `${String(item.sortOrder).padStart(2, '0')}-${safeName(item.fileName || item.id)}`;
    const entry = {
      id: item.id,
      fileName: item.fileName,
      sortOrder: item.sortOrder,
      alt: item.alt,
      objectPosition: item.objectPosition,
      files: {},
    };

    const downloads = [];
    if (includeWeb && item.heroUrl) {
      const ext = extFromUrl(item.heroUrl, '.webp');
      const file = `${base}-web${ext}`;
      downloads.push({ kind: 'web', url: item.heroUrl, file, note: 'Currently shown on homepage slideshow' });
    }
    if (includeFull && (item.imageUrl || item.displayUrl)) {
      const url = item.imageUrl || item.displayUrl;
      const ext = extFromUrl(url, '.jpg');
      const file = `${base}-full${ext}`;
      downloads.push({ kind: 'full', url, file, note: 'Higher-resolution source from ImgBB' });
    }

    if (!downloads.length) {
      entry.status = 'skipped';
      entry.error = 'No heroUrl or imageUrl';
      manifest.push(entry);
      console.warn(`skip ${item.id}: no URLs`);
      continue;
    }

    try {
      for (const dl of downloads) {
        const dest = path.join(outDir, dl.file);
        console.log(`  ${dl.file} <= ${dl.url.slice(0, 70)}...`);
        const buffer = await downloadBuffer(dl.url);
        await fsp.writeFile(dest, buffer);
        entry.files[dl.kind] = {
          file: dl.file,
          path: dest,
          url: dl.url,
          bytes: buffer.length,
          note: dl.note,
        };
      }
      entry.status = 'done';
    } catch (error) {
      entry.status = 'error';
      entry.error = String(error.message || error);
      console.error(`  ERROR ${item.id}:`, entry.error);
    }

    manifest.push(entry);
  }

  const readme = `# Hero images (local edit copies)

Downloaded: ${new Date().toISOString()}
Slides: ${heroes.length}

## Files

- \`*-web.webp\` / \`*-web.jpg\` — compressed hero shown on https://pixilens.com (1920px max)
- \`*-full.jpg\` — full ImgBB source (edit these for best quality, then re-run compress/upload)

## After editing

1. Replace files in this folder or update paths in \`manifest.json\`
2. Re-upload: \`npm run hero:compress -- --force=true\` (recompresses from imageUrl in DB)
   Or manually upload edited files to ImgBB and update homepage config in /admin/homepage

See \`manifest.json\` for slide IDs, sort order, and source URLs.
`;

  await fsp.writeFile(path.join(outDir, 'README.md'), readme);
  await fsp.writeFile(path.join(outDir, 'manifest.json'), JSON.stringify({ downloadedAt: new Date().toISOString(), slides: manifest }, null, 2));

  const done = manifest.filter((m) => m.status === 'done').length;
  const errors = manifest.filter((m) => m.status === 'error').length;
  console.log(JSON.stringify({ outDir, total: heroes.length, done, errors, skipped: heroes.length - done - errors }, null, 2));

  if (pool) await pool.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
