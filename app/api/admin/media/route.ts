import fs from 'fs/promises';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireAdminRequest } from '@/lib/admin/auth';
import { getLibrary, id, mediaRoot, now, saveLibrary, slugify, type Visibility } from '@/lib/admin/library-store';

async function uploadPhotoToImgBB(file: File, name: string) {
  const key = process.env.IMGBB_API_KEY;
  if (!key) throw new Error('IMGBB_API_KEY is missing');
  const buffer = Buffer.from(await file.arrayBuffer());
  const form = new FormData();
  form.set('key', key);
  form.set('name', name);
  form.set('image', buffer.toString('base64'));
  const response = await fetch('https://api.imgbb.com/1/upload', { method: 'POST', body: form });
  const body = await response.json();
  if (!response.ok || !body.success) throw new Error(body?.error?.message || 'ImgBB upload failed');
  return body.data;
}

export async function POST(request: NextRequest) {
  if (!requireAdminRequest(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const form = await request.formData();
  const action = String(form.get('action') || 'upload');
  const store = await getLibrary();
  const timestamp = now();

  if (action === 'delete') {
    const mediaId = String(form.get('id') || '');
    const media = store.media.find((item) => item.id === mediaId);
    if (media?.localPath) await fs.rm(media.localPath, { force: true });
    store.media = store.media.filter((item) => item.id !== mediaId);
    await saveLibrary(store);
    revalidatePath('/admin');
    revalidatePath('/admin/media');
    return NextResponse.redirect(new URL('/admin/media?saved=1', request.url), 303);
  }

  const file = form.get('file');
  if (!(file instanceof File) || file.size === 0) return NextResponse.redirect(new URL('/admin/media?error=file', request.url), 303);
  const galleryId = String(form.get('galleryId') || '');
  const type = file.type.startsWith('video/') ? 'video' : 'photo';
  const title = String(form.get('title') || file.name);
  const mediaId = id('media');
  const baseSlug = slugify(String(form.get('slug') || title));
  const sortOrder = Number(form.get('sortOrder') || store.media.length + 1);
  const visibility = String(form.get('visibility') || 'public') as Visibility;

  if (type === 'photo') {
    if (!file.type.startsWith('image/')) return NextResponse.redirect(new URL('/admin/media?error=type', request.url), 303);
    const uploaded = await uploadPhotoToImgBB(file, `smugmug-admin-${mediaId}-${baseSlug}`);
    store.media.push({
      id: mediaId,
      galleryId,
      type,
      title,
      caption: String(form.get('caption') || ''),
      slug: baseSlug,
      visibility,
      sortOrder,
      provider: 'imgbb',
      publicUrl: uploaded.url,
      displayUrl: uploaded.display_url,
      deleteUrl: uploaded.delete_url,
      fileName: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
      width: uploaded.width,
      height: uploaded.height,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  } else {
    const extension = path.extname(file.name) || '.mp4';
    const relative = path.join('videos', `${mediaId}-${baseSlug}${extension}`);
    const absolute = path.join(mediaRoot(), relative);
    await fs.mkdir(path.dirname(absolute), { recursive: true });
    await fs.writeFile(absolute, Buffer.from(await file.arrayBuffer()));
    store.media.push({
      id: mediaId,
      galleryId,
      type,
      title,
      caption: String(form.get('caption') || ''),
      slug: baseSlug,
      visibility,
      sortOrder,
      provider: 'local',
      publicUrl: `/api/media/${mediaId}`,
      displayUrl: `/api/media/${mediaId}`,
      localPath: absolute,
      fileName: file.name,
      mimeType: file.type || 'video/mp4',
      sizeBytes: file.size,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  }

  await saveLibrary(store);
  revalidatePath('/admin');
  revalidatePath('/admin/media');
  return NextResponse.redirect(new URL('/admin/media?saved=1', request.url), 303);
}
