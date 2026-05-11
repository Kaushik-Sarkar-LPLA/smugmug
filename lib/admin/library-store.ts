import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

export type Visibility = 'public' | 'private' | 'draft';

export type FolderRecord = {
  id: string;
  title: string;
  slug: string;
  description: string;
  parentId: string;
  visibility: Visibility;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type GalleryRecord = {
  id: string;
  folderId: string;
  title: string;
  slug: string;
  description: string;
  visibility: Visibility;
  sortOrder: number;
  coverMediaId: string;
  createdAt: string;
  updatedAt: string;
};

export type MediaRecord = {
  id: string;
  galleryId: string;
  type: 'photo' | 'video';
  title: string;
  caption: string;
  slug: string;
  visibility: Visibility;
  sortOrder: number;
  provider: 'imgbb' | 'local';
  publicUrl: string;
  displayUrl: string;
  deleteUrl?: string;
  localPath?: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  width?: number;
  height?: number;
  createdAt: string;
  updatedAt: string;
};

export type LibraryStore = {
  folders: FolderRecord[];
  galleries: GalleryRecord[];
  media: MediaRecord[];
};

function dataDir() {
  return process.env.ADMIN_DATA_DIR || path.join(process.cwd(), 'data/admin');
}

function libraryPath() {
  return path.join(dataDir(), 'library.json');
}

export function mediaRoot() {
  return process.env.MEDIA_ROOT || path.join(dataDir(), 'media');
}

export function id(prefix: string) {
  return `${prefix}_${crypto.randomBytes(8).toString('hex')}`;
}

export function slugify(value: string) {
  return value.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 90) || 'untitled';
}

export async function getLibrary(): Promise<LibraryStore> {
  try {
    const raw = await fs.readFile(libraryPath(), 'utf8');
    const parsed = JSON.parse(raw) as Partial<LibraryStore>;
    return {
      folders: parsed.folders || [],
      galleries: parsed.galleries || [],
      media: parsed.media || [],
    };
  } catch {
    return { folders: [], galleries: [], media: [] };
  }
}

export async function saveLibrary(store: LibraryStore) {
  await fs.mkdir(dataDir(), { recursive: true });
  await fs.writeFile(libraryPath(), JSON.stringify(store, null, 2));
}

export function now() {
  return new Date().toISOString();
}
