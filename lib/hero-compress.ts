import sharp from 'sharp';

export const HERO_WEB_MAX_WIDTH = 1920;
export const HERO_WEB_QUALITY = 86;

export type HeroWebMeta = {
  buffer: Buffer;
  width: number;
  height: number;
  mimeType: 'image/webp' | 'image/jpeg';
  bytes: number;
};

/** Hero-sized WebP (JPEG fallback) — sharp enough for full-viewport slideshow, small enough to load fast. */
export async function compressForHeroWeb(source: Buffer): Promise<HeroWebMeta> {
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
      height: jpegMeta.height || Math.round(HERO_WEB_MAX_WIDTH * 0.667),
      mimeType: 'image/jpeg',
      bytes: jpeg.length,
    };
  }

  return {
    buffer: webp,
    width: webpMeta.width || HERO_WEB_MAX_WIDTH,
    height: webpMeta.height || Math.round(HERO_WEB_MAX_WIDTH * 0.667),
    mimeType: 'image/webp',
    bytes: webp.length,
  };
}
