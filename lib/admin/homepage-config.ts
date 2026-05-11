import fs from 'fs/promises';
import path from 'path';
import { frontPageSlides } from '@/lib/priority-assets';

export type HomepageItem = {
  id: string;
  fileName: string;
  imageUrl: string;
  displayUrl: string;
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

export async function getHomepageConfig(): Promise<HomepageConfig> {
  try {
    const raw = await fs.readFile(configPath(), 'utf8');
    const parsed = JSON.parse(raw) as HomepageConfig;
    const defaults = defaultConfig();
    const byId = new Map(parsed.items.map((item) => [item.id, item]));
    return {
      slideDurationSeconds: parsed.slideDurationSeconds || defaults.slideDurationSeconds,
      items: defaults.items.map((item) => ({ ...item, ...byId.get(item.id) })).sort((a, b) => a.sortOrder - b.sortOrder),
    };
  } catch {
    return defaultConfig();
  }
}

export async function saveHomepageConfig(config: HomepageConfig) {
  await fs.mkdir(dataDir(), { recursive: true });
  await fs.writeFile(configPath(), JSON.stringify(config, null, 2));
}
