import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import { mediaRoot, slugify } from '@/lib/admin/library-store';

const IMGBB_MAX_BYTES = Number(process.env.IMGBB_MAX_BYTES || 31_500_000);
const JPEG_QUALITY = Number(process.env.MIGRATE_JPEG_QUALITY || 85);
const MAX_DIMENSION = Number(process.env.MIGRATE_MAX_DIMENSION || 3000);

export type ImgBBUploadResult = {
  url: string;
  display_url: string;
  delete_url?: string;
  width?: number;
  height?: number;
  localOriginalPath?: string;
  migrationStatus: 'done' | 'done_with_local_original';
  uploadedBytes: number;
};

function imgbbKey() {
  const key = process.env.IMGBB_API_KEY;
  if (!key) throw new Error('IMGBB_API_KEY is missing');
  return key;
}

function isTooBigError(error: unknown) {
  const message = String(error instanceof Error ? error.message : error).toLowerCase();
  return message.includes('too big') || message.includes('file size') || message.includes('payload too large');
}

async function uploadBufferToImgBB(buffer: Buffer, name: string, attempt = 0): Promise<{
  url: string;
  display_url: string;
  delete_url?: string;
  width?: number;
  height?: number;
}> {
  const form = new FormData();
  form.set('key', imgbbKey());
  form.set('name', name);
  form.set('image', buffer.toString('base64'));

  try {
    const response = await fetch('https://api.imgbb.com/1/upload', { method: 'POST', body: form });
    const body = await response.json();
    if (!response.ok || !body.success) {
      throw new Error(body?.error?.message || `ImgBB upload failed (HTTP ${response.status})`);
    }
    return body.data;
  } catch (error) {
    if (attempt >= 2) throw error;
    await new Promise((resolve) => setTimeout(resolve, 750 * (attempt + 1)));
    return uploadBufferToImgBB(buffer, name, attempt + 1);
  }
}

async function compressForImgBB(buffer: Buffer) {
  let quality = JPEG_QUALITY;
  let dimension = MAX_DIMENSION;

  for (let pass = 0; pass < 12; pass++) {
    const out = await sharp(buffer, { failOn: 'none' })
      .rotate()
      .resize({ width: dimension, height: dimension, fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality, mozjpeg: true })
      .toBuffer();

    if (out.length <= IMGBB_MAX_BYTES) {
      const meta = await sharp(out).metadata();
      return {
        buffer: out,
        width: meta.width || undefined,
        height: meta.height || undefined,
      };
    }

    if (quality > 45) quality -= 8;
    else dimension = Math.max(960, Math.floor(dimension * 0.82));
  }

  throw new Error('Unable to compress image below ImgBB size limit');
}

async function archiveOriginal(
  buffer: Buffer,
  galleryId: string,
  mediaId: string,
  title: string,
  extension: string,
) {
  const relative = path.join('photo-originals', galleryId, `${mediaId}-${slugify(title)}${extension || '.jpg'}`);
  const absolute = path.join(mediaRoot(), relative);
  await fs.mkdir(path.dirname(absolute), { recursive: true });
  await fs.writeFile(absolute, buffer);
  return absolute;
}

export async function uploadPhotoBufferToImgBB(params: {
  buffer: Buffer;
  uploadName: string;
  galleryId: string;
  mediaId: string;
  title: string;
  fileName: string;
}): Promise<ImgBBUploadResult> {
  const { buffer, uploadName, galleryId, mediaId, title, fileName } = params;
  const extension = path.extname(fileName) || '.jpg';
  let localOriginalPath: string | undefined;
  let migrationStatus: ImgBBUploadResult['migrationStatus'] = 'done';
  let uploadBuffer = buffer;
  let width: number | undefined;
  let height: number | undefined;

  const applyCompressed = async (original: Buffer) => {
    const compressed = await compressForImgBB(original);
    uploadBuffer = compressed.buffer;
    width = compressed.width;
    height = compressed.height;
    localOriginalPath = await archiveOriginal(original, galleryId, mediaId, title, extension);
    migrationStatus = 'done_with_local_original';
  };

  if (buffer.length > IMGBB_MAX_BYTES) {
    await applyCompressed(buffer);
  } else {
    try {
      const meta = await sharp(buffer, { failOn: 'none' }).rotate().metadata();
      width = meta.width || undefined;
      height = meta.height || undefined;
    } catch {
      // keep ImgBB dimensions as fallback
    }
  }

  let uploaded;
  const uploadLabel = localOriginalPath ? `${uploadName}--compressed` : uploadName;
  try {
    uploaded = await uploadBufferToImgBB(uploadBuffer, uploadLabel);
  } catch (error) {
    if (localOriginalPath || !isTooBigError(error)) throw error;
    await applyCompressed(buffer);
    uploaded = await uploadBufferToImgBB(uploadBuffer, `${uploadName}--compressed`);
  }

  return {
    url: uploaded.url,
    display_url: uploaded.display_url,
    delete_url: uploaded.delete_url,
    width: uploaded.width || width,
    height: uploaded.height || height,
    localOriginalPath,
    migrationStatus,
    uploadedBytes: uploadBuffer.length,
  };
}
