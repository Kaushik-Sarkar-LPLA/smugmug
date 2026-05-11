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
    const folderId = String(form.get('id') || '');
    store.folders = store.folders.filter((folder) => folder.id !== folderId);
    store.galleries = store.galleries.map((gallery) => gallery.folderId === folderId ? { ...gallery, folderId: '', updatedAt: timestamp } : gallery);
  } else {
    const folderId = String(form.get('id') || '');
    const title = String(form.get('title') || 'Untitled folder');
    const payload = {
      title,
      slug: slugify(String(form.get('slug') || title)),
      description: String(form.get('description') || ''),
      parentId: String(form.get('parentId') || ''),
      visibility: String(form.get('visibility') || 'public') as Visibility,
      sortOrder: Number(form.get('sortOrder') || 0),
      updatedAt: timestamp,
    };
    if (folderId) {
      store.folders = store.folders.map((folder) => folder.id === folderId ? { ...folder, ...payload } : folder);
    } else {
      store.folders.push({ id: id('folder'), ...payload, createdAt: timestamp });
    }
  }

  await saveLibrary(store);
  revalidatePath('/admin');
  revalidatePath('/admin/folders');
  return NextResponse.redirect(new URL('/admin/folders?saved=1', request.url), 303);
}
