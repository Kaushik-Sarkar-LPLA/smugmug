import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { ensureDatabase, getPool, hasDatabase, qname } from '@/lib/admin/db';

export type Visibility = 'public' | 'private' | 'draft';

export type FolderRecord = {
  id: string;
  title: string;
  slug: string;
  description: string;
  parentId: string;
  visibility: Visibility;
  sortOrder: number;
  smugmugUri?: string;
  originalUrl?: string;
  urlPath?: string;
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
  smugmugUri?: string;
  originalUrl?: string;
  urlPath?: string;
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
  smugmugUri?: string;
  imageKey?: string;
  originalUrl?: string;
  urlPath?: string;
  migrationStatus?: string;
  migrationError?: string;
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

async function getLibraryFromJson(): Promise<LibraryStore> {
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

async function saveLibraryToJson(store: LibraryStore) {
  await fs.mkdir(dataDir(), { recursive: true });
  await fs.writeFile(libraryPath(), JSON.stringify(store, null, 2));
}

export async function getLibrary(): Promise<LibraryStore> {
  if (!hasDatabase()) return getLibraryFromJson();
  await ensureDatabase();
  const db = getPool();
  const [folders, galleries, media] = await Promise.all([
    db.query(`SELECT * FROM ${qname('folders')} ORDER BY sort_order, title`),
    db.query(`SELECT * FROM ${qname('galleries')} ORDER BY sort_order, title`),
    db.query(`SELECT * FROM ${qname('media')} ORDER BY sort_order, created_at`),
  ]);
  return {
    folders: folders.rows.map((row) => ({ id: row.id, title: row.title, slug: row.slug, description: row.description, parentId: row.parent_id, visibility: row.visibility, sortOrder: row.sort_order, smugmugUri: row.smugmug_uri || undefined, originalUrl: row.original_url || undefined, urlPath: row.url_path || undefined, createdAt: row.created_at.toISOString(), updatedAt: row.updated_at.toISOString() })),
    galleries: galleries.rows.map((row) => ({ id: row.id, folderId: row.folder_id, title: row.title, slug: row.slug, description: row.description, visibility: row.visibility, sortOrder: row.sort_order, coverMediaId: row.cover_media_id, smugmugUri: row.smugmug_uri || undefined, originalUrl: row.original_url || undefined, urlPath: row.url_path || undefined, createdAt: row.created_at.toISOString(), updatedAt: row.updated_at.toISOString() })),
    media: media.rows.map((row) => ({ id: row.id, galleryId: row.gallery_id, type: row.type, title: row.title, caption: row.caption, slug: row.slug, visibility: row.visibility, sortOrder: row.sort_order, provider: row.provider, publicUrl: row.public_url, displayUrl: row.display_url, deleteUrl: row.delete_url || undefined, localPath: row.local_path || undefined, fileName: row.file_name, mimeType: row.mime_type, sizeBytes: Number(row.size_bytes), width: row.width || undefined, height: row.height || undefined, imageKey: row.image_key || undefined, smugmugUri: row.smugmug_uri || undefined, originalUrl: row.original_url || undefined, urlPath: row.url_path || undefined, migrationStatus: row.migration_status || undefined, migrationError: row.migration_error || undefined, createdAt: row.created_at.toISOString(), updatedAt: row.updated_at.toISOString() })),
  };
}

export async function saveLibrary(store: LibraryStore) {
  if (!hasDatabase()) return saveLibraryToJson(store);
  await ensureDatabase();
  const db = getPool();
  await db.query('BEGIN');
  try {
    await db.query(`DELETE FROM ${qname('media')}`);
    await db.query(`DELETE FROM ${qname('galleries')}`);
    await db.query(`DELETE FROM ${qname('folders')}`);
    for (const folder of store.folders) {
      await db.query(`INSERT INTO ${qname('folders')} (id,title,slug,description,parent_id,visibility,sort_order,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`, [folder.id, folder.title, folder.slug, folder.description, folder.parentId, folder.visibility, folder.sortOrder, folder.createdAt, folder.updatedAt]);
    }
    for (const gallery of store.galleries) {
      await db.query(`INSERT INTO ${qname('galleries')} (id,folder_id,title,slug,description,visibility,sort_order,cover_media_id,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`, [gallery.id, gallery.folderId, gallery.title, gallery.slug, gallery.description, gallery.visibility, gallery.sortOrder, gallery.coverMediaId, gallery.createdAt, gallery.updatedAt]);
    }
    for (const item of store.media) {
      await db.query(`INSERT INTO ${qname('media')} (id,gallery_id,type,title,caption,slug,visibility,sort_order,provider,public_url,display_url,delete_url,local_path,file_name,mime_type,size_bytes,width,height,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)`, [item.id, item.galleryId, item.type, item.title, item.caption, item.slug, item.visibility, item.sortOrder, item.provider, item.publicUrl, item.displayUrl, item.deleteUrl || null, item.localPath || null, item.fileName, item.mimeType, item.sizeBytes, item.width || null, item.height || null, item.createdAt, item.updatedAt]);
    }
    await db.query('COMMIT');
  } catch (error) {
    await db.query('ROLLBACK');
    throw error;
  }
}

export async function migrateJsonLibraryToDatabase() {
  if (!hasDatabase()) return;
  const current = await getLibrary();
  if (current.folders.length || current.galleries.length || current.media.length) return;
  const jsonStore = await getLibraryFromJson();
  if (jsonStore.folders.length || jsonStore.galleries.length || jsonStore.media.length) await saveLibrary(jsonStore);
}

export function now() {
  return new Date().toISOString();
}
