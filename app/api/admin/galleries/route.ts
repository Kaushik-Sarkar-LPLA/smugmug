import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireAdminRequest } from '@/lib/admin/auth';
import { getLibrary, id, now, saveLibrary, slugify, type Visibility } from '@/lib/admin/library-store';

export async function POST(request: NextRequest) {
  if (!requireAdminRequest(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const form = await request.formData();
  const action = String(form.get('action') || 'create');
  const store = await getLibrary();
  const timestamp = now();

  if (action === 'delete') {
    const galleryId = String(form.get('id') || '');
    store.galleries = store.galleries.filter((gallery) => gallery.id !== galleryId);
    store.media = store.media.map((media) => media.galleryId === galleryId ? { ...media, galleryId: '', updatedAt: timestamp } : media);
  } else {
    const galleryId = String(form.get('id') || '');
    const title = String(form.get('title') || 'Untitled gallery');
    const payload = {
      folderId: String(form.get('folderId') || ''),
      title,
      slug: slugify(String(form.get('slug') || title)),
      description: String(form.get('description') || ''),
      visibility: String(form.get('visibility') || 'public') as Visibility,
      sortOrder: Number(form.get('sortOrder') || 0),
      coverMediaId: String(form.get('coverMediaId') || ''),
      updatedAt: timestamp,
    };
    if (galleryId) {
      store.galleries = store.galleries.map((gallery) => gallery.id === galleryId ? { ...gallery, ...payload } : gallery);
    } else {
      store.galleries.push({ id: id('gallery'), ...payload, createdAt: timestamp });
    }
  }

  await saveLibrary(store);
  revalidatePath('/admin');
  revalidatePath('/admin/galleries');
  return NextResponse.redirect(new URL('/admin/galleries?saved=1', request.url), 303);
}
