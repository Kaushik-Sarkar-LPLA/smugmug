import fs from 'fs/promises';
import path from 'path';
import { ensureDatabase, getPool, hasDatabase, qname } from '@/lib/admin/db';
import { frontPageSlides } from '@/lib/priority-assets';

export type HomepageItem = {
  id: string;
  fileName: string;
  imageUrl: string;
  displayUrl: string;
  /** Pre-compressed web hero (WebP/JPEG ~1920px) — preferred for slideshow. */
  heroUrl?: string;
  heroWidth?: number;
  heroHeight?: number;
  width: number;
  height: number;
  sourceWebUri: string;
  enabled: boolean;
  useInHero: boolean;
  useInGallery: boolean;
  sortOrder: number;
  objectPosition: string;
  alt: string;
};

export type HomepageConfig = {
  slideDurationSeconds: number;
  items: HomepageItem[];
};

function dataDir() {
  return process.env.ADMIN_DATA_DIR || path.join(process.cwd(), 'data/admin');
}

function configPath() {
  return path.join(dataDir(), 'homepage-config.json');
}

function defaultConfig(): HomepageConfig {
  return {
    slideDurationSeconds: 5,
    items: frontPageSlides.map((slide) => ({
      id: slide.source_web_uri.split('/').pop() || slide.file_name,
      fileName: slide.file_name,
      imageUrl: slide.imgbb_url ?? slide.imgbb_display_url,
      displayUrl: slide.imgbb_display_url,
      width: slide.width,
      height: slide.height,
      sourceWebUri: slide.source_web_uri,
      enabled: true,
      useInHero: slide.width > slide.height,
      useInGallery: true,
      sortOrder: slide.sort_order,
      objectPosition: 'center 32%',
      alt: slide.file_name,
    })),
  };
}

function mergeDefaults(config: HomepageConfig) {
  const defaults = defaultConfig();
  const byId = new Map(config.items.map((item) => [item.id, item]));
  return {
    slideDurationSeconds: config.slideDurationSeconds || defaults.slideDurationSeconds,
    items: defaults.items.map((item) => ({ ...item, ...byId.get(item.id) })).sort((a, b) => a.sortOrder - b.sortOrder),
  };
}

async function getHomepageConfigFromJson(): Promise<HomepageConfig> {
  try {
    const raw = await fs.readFile(configPath(), 'utf8');
    return mergeDefaults(JSON.parse(raw) as HomepageConfig);
  } catch {
    return defaultConfig();
  }
}

async function saveHomepageConfigToJson(config: HomepageConfig) {
  await fs.mkdir(dataDir(), { recursive: true });
  await fs.writeFile(configPath(), JSON.stringify(config, null, 2));
}

export async function getHomepageConfig(): Promise<HomepageConfig> {
  if (!hasDatabase()) return getHomepageConfigFromJson();
  try {
    await ensureDatabase();
    const result = await getPool().query(`SELECT value FROM ${qname('kv_store')} WHERE key = $1`, ['homepage_config']);
    if (!result.rowCount) return defaultConfig();
    return mergeDefaults(result.rows[0].value as HomepageConfig);
  } catch {
    return getHomepageConfigFromJson();
  }
}

export async function saveHomepageConfig(config: HomepageConfig) {
  if (!hasDatabase()) return saveHomepageConfigToJson(config);
  await ensureDatabase();
  await getPool().query(
    `INSERT INTO ${qname('kv_store')} (key, value, updated_at) VALUES ($1, $2, now()) ON CONFLICT (key) DO UPDATE SET value = excluded.value, updated_at = now()`,
    ['homepage_config', JSON.stringify(config)],
  );
}

export async function migrateJsonHomepageToDatabase() {
  if (!hasDatabase()) return;
  await ensureDatabase();
  const existing = await getPool().query(`SELECT 1 FROM ${qname('kv_store')} WHERE key = $1`, ['homepage_config']);
  if (existing.rowCount) return;
  const config = await getHomepageConfigFromJson();
  await saveHomepageConfig(config);
}
