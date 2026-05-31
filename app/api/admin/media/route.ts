import fs from 'fs/promises';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireAdminRequest } from '@/lib/admin/auth';
import {
  deleteMediaRecord,
  getMediaById,
  getNextMediaSortOrder,
  id,
  insertMediaRecord,
  mediaRoot,
  moveMediaInGallery,
  now,
  setGalleryCoverMedia,
  slugify,
  type MediaRecord,
  type Visibility,
} from '@/lib/admin/library-store';
import { adminRedirectUrl } from '@/lib/admin/redirect';

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

function mediaRedirect(request: NextRequest, form: FormData) {
  const redirectUrl = adminRedirectUrl(request, '/admin/media');
  const page = form.get('page');
  const galleryId = form.get('galleryId');
  if (page) redirectUrl.searchParams.set('page', String(page));
  if (galleryId) redirectUrl.searchParams.set('galleryId', String(galleryId));
  return redirectUrl;
}

function uploadErrorRedirect(request: NextRequest, form: FormData, message: string) {
  const redirectUrl = mediaRedirect(request, form);
  redirectUrl.searchParams.set('error', message.slice(0, 180));
  return NextResponse.redirect(redirectUrl, 303);
}

export async function POST(request: NextRequest) {
  if (!requireAdminRequest(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const form = await request.formData();
  const action = String(form.get('action') || 'upload');

  if (action === 'delete') {
    const mediaId = String(form.get('id') || '');
    const media = await getMediaById(mediaId);
    if (media?.localPath) await fs.rm(media.localPath, { force: true });
    await deleteMediaRecord(mediaId);
    revalidatePath('/admin');
    revalidatePath('/admin/media');
    revalidatePath('/admin/galleries');
    const redirectUrl = mediaRedirect(request, form);
    redirectUrl.searchParams.set('saved', '1');
    return NextResponse.redirect(redirectUrl, 303);
  }

  if (action === 'move-up' || action === 'move-down') {
    const mediaId = String(form.get('id') || '');
    const moved = await moveMediaInGallery(mediaId, action === 'move-up' ? 'up' : 'down');
    revalidatePath('/admin/media');
    revalidatePath('/admin/galleries');
    const redirectUrl = mediaRedirect(request, form);
    if (moved) redirectUrl.searchParams.set('saved', '1');
    return NextResponse.redirect(redirectUrl, 303);
  }

  if (action === 'set-cover') {
    const mediaId = String(form.get('id') || '');
    const galleryId = String(form.get('galleryId') || '');
    const media = await getMediaById(mediaId);
    if (galleryId && media?.galleryId === galleryId) {
      await setGalleryCoverMedia(galleryId, mediaId);
    }
    revalidatePath('/admin/media');
    revalidatePath('/admin/galleries');
    revalidatePath('/Pixilens-Portfolio');
    const redirectUrl = mediaRedirect(request, form);
    redirectUrl.searchParams.set('saved', 'cover');
    return NextResponse.redirect(redirectUrl, 303);
  }

  const file = form.get('file');
  if (!(file instanceof File) || file.size === 0) {
    return uploadErrorRedirect(request, form, 'file');
  }

  const galleryId = String(form.get('galleryId') || '');
  if (!galleryId) {
    return uploadErrorRedirect(request, form, 'gallery');
  }

  try {
    const timestamp = now();
    const type = file.type.startsWith('video/') ? 'video' : 'photo';
    const title = String(form.get('title') || file.name);
    const mediaId = id('media');
    const baseSlug = slugify(String(form.get('slug') || title));
    const sortOrderInput = Number(form.get('sortOrder') || 0);
    const sortOrder = sortOrderInput > 0 ? sortOrderInput : await getNextMediaSortOrder(galleryId);
    const visibility = String(form.get('visibility') || 'public') as Visibility;

    let record: MediaRecord;

    if (type === 'photo') {
      if (!file.type.startsWith('image/')) {
        return uploadErrorRedirect(request, form, 'type');
      }
      const uploaded = await uploadPhotoToImgBB(file, `pixilens-admin-${mediaId}-${baseSlug}`);
      record = {
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
        migrationStatus: 'done',
        createdAt: timestamp,
        updatedAt: timestamp,
      };
    } else {
      const extension = path.extname(file.name) || '.mp4';
      const relative = path.join('videos', `${mediaId}-${baseSlug}${extension}`);
      const absolute = path.join(mediaRoot(), relative);
      await fs.mkdir(path.dirname(absolute), { recursive: true });
      await fs.writeFile(absolute, Buffer.from(await file.arrayBuffer()));
      record = {
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
        migrationStatus: 'done',
        createdAt: timestamp,
        updatedAt: timestamp,
      };
    }

    await insertMediaRecord(record);
    revalidatePath('/admin');
    revalidatePath('/admin/media');
    revalidatePath('/admin/galleries');
    revalidatePath('/gallery');
    revalidatePath(`/galleries/${baseSlug}`);

    const redirectUrl = mediaRedirect(request, form);
    redirectUrl.searchParams.set('saved', '1');
    return NextResponse.redirect(redirectUrl, 303);
  } catch (error) {
    console.error('Admin media upload failed:', error);
    const message = error instanceof Error ? error.message : 'upload';
    return uploadErrorRedirect(request, form, message);
  }
}
