import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { ensureDatabase, getPool, hasDatabase, qname } from '@/lib/admin/db';
import { mediaImageUrl } from '@/lib/media-url';
import { isExcludedPublicLibraryItem, publicLibrarySqlExclude } from '@/lib/public-library-filters';

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

function rowToMediaRecord(row: any): MediaRecord {
  return {
    id: row.id,
    galleryId: row.gallery_id,
    type: row.type,
    title: row.title,
    caption: row.caption,
    slug: row.slug,
    visibility: row.visibility,
    sortOrder: row.sort_order,
    provider: row.provider,
    publicUrl: row.public_url,
    displayUrl: row.display_url,
    deleteUrl: row.delete_url || undefined,
    localPath: row.local_path || undefined,
    fileName: row.file_name,
    mimeType: row.mime_type,
    sizeBytes: Number(row.size_bytes),
    width: row.width || undefined,
    height: row.height || undefined,
    imageKey: row.image_key || undefined,
    smugmugUri: row.smugmug_uri || undefined,
    originalUrl: row.original_url || undefined,
    urlPath: row.url_path || undefined,
    migrationStatus: row.migration_status || undefined,
    migrationError: row.migration_error || undefined,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at || ''),
    updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : String(row.updated_at || ''),
  };
}

export async function getLibrary(): Promise<LibraryStore> {
  if (!hasDatabase()) return getLibraryFromJson();
  try {
    await ensureDatabase();
  } catch {
    return getLibraryFromJson();
  }
  const db = getPool();
  let folders, galleries, media;
  try {
    [folders, galleries, media] = await Promise.all([
      db.query(`SELECT * FROM ${qname('folders')} ORDER BY sort_order, title`),
      db.query(`SELECT * FROM ${qname('galleries')} ORDER BY sort_order, title`),
      db.query(`SELECT * FROM ${qname('media')} ORDER BY sort_order, created_at`),
    ]);
  } catch {
    return getLibraryFromJson();
  }
  return {
    folders: folders.rows.map((row) => ({ id: row.id, title: row.title, slug: row.slug, description: row.description, parentId: row.parent_id, visibility: row.visibility, sortOrder: row.sort_order, smugmugUri: row.smugmug_uri || undefined, originalUrl: row.original_url || undefined, urlPath: row.url_path || undefined, createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at || ''), updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : String(row.updated_at || '') })),
    galleries: galleries.rows.map((row) => ({ id: row.id, folderId: row.folder_id, title: row.title, slug: row.slug, description: row.description, visibility: row.visibility, sortOrder: row.sort_order, coverMediaId: row.cover_media_id, smugmugUri: row.smugmug_uri || undefined, originalUrl: row.original_url || undefined, urlPath: row.url_path || undefined, createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at || ''), updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : String(row.updated_at || '') })),
    media: media.rows.map(rowToMediaRecord),
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

export async function getFoldersForAdmin(): Promise<FolderRecord[]> {
  if (!hasDatabase()) {
    const store = await getLibraryFromJson();
    return store.folders;
  }
  try {
    await ensureDatabase();
    const db = getPool();
    const res = await db.query(`SELECT * FROM ${qname('folders')} ORDER BY sort_order, title`);
    return res.rows.map((row) => ({
      id: row.id,
      title: row.title,
      slug: row.slug,
      description: row.description,
      parentId: row.parent_id,
      visibility: row.visibility,
      sortOrder: row.sort_order,
      smugmugUri: row.smugmug_uri || undefined,
      originalUrl: row.original_url || undefined,
      urlPath: row.url_path || undefined,
      createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at || ''),
      updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : String(row.updated_at || ''),
    }));
  } catch {
    const store = await getLibraryFromJson();
    return store.folders;
  }
}

export async function getGalleriesForAdmin(): Promise<GalleryRecord[]> {
  if (!hasDatabase()) {
    const store = await getLibraryFromJson();
    return store.galleries;
  }
  try {
    await ensureDatabase();
    const db = getPool();
    const res = await db.query(`SELECT * FROM ${qname('galleries')} ORDER BY sort_order, title`);
    return res.rows.map((row) => ({
      id: row.id,
      folderId: row.folder_id,
      title: row.title,
      slug: row.slug,
      description: row.description,
      visibility: row.visibility,
      sortOrder: row.sort_order,
      coverMediaId: row.cover_media_id,
      smugmugUri: row.smugmug_uri || undefined,
      originalUrl: row.original_url || undefined,
      urlPath: row.url_path || undefined,
      createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at || ''),
      updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : String(row.updated_at || ''),
    }));
  } catch {
    const store = await getLibraryFromJson();
    return store.galleries;
  }
}

export async function getGalleriesShallow(): Promise<{ id: string; title: string; coverMediaId: string }[]> {
  if (!hasDatabase()) {
    const store = await getLibraryFromJson();
    return store.galleries.map((g) => ({ id: g.id, title: g.title, coverMediaId: g.coverMediaId || '' }));
  }
  try {
    await ensureDatabase();
    const db = getPool();
    const res = await db.query(`SELECT id, title, cover_media_id FROM ${qname('galleries')} ORDER BY sort_order, title`);
    return res.rows.map((row) => ({ id: row.id, title: row.title, coverMediaId: row.cover_media_id || '' }));
  } catch {
    const store = await getLibraryFromJson();
    return store.galleries.map((g) => ({ id: g.id, title: g.title, coverMediaId: g.coverMediaId || '' }));
  }
}

export async function getGalleryById(galleryId: string): Promise<GalleryRecord | null> {
  if (!galleryId) return null;
  if (!hasDatabase()) {
    const store = await getLibraryFromJson();
    return store.galleries.find((g) => g.id === galleryId) || null;
  }
  try {
    await ensureDatabase();
    const db = getPool();
    const res = await db.query(`SELECT * FROM ${qname('galleries')} WHERE id = $1 LIMIT 1`, [galleryId]);
    const row = res.rows[0];
    if (!row) return null;
    return {
      id: row.id,
      folderId: row.folder_id,
      title: row.title,
      slug: row.slug,
      description: row.description,
      visibility: row.visibility,
      sortOrder: row.sort_order,
      coverMediaId: row.cover_media_id,
      smugmugUri: row.smugmug_uri || undefined,
      originalUrl: row.original_url || undefined,
      urlPath: row.url_path || undefined,
      createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at || ''),
      updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : String(row.updated_at || ''),
    };
  } catch {
    const store = await getLibraryFromJson();
    return store.galleries.find((g) => g.id === galleryId) || null;
  }
}

export async function setGalleryCoverMedia(galleryId: string, mediaId: string) {
  if (!hasDatabase()) {
    const store = await getLibraryFromJson();
    store.galleries = store.galleries.map((gallery) =>
      gallery.id === galleryId ? { ...gallery, coverMediaId: mediaId, updatedAt: now() } : gallery,
    );
    await saveLibraryToJson(store);
    return;
  }
  await ensureDatabase();
  const db = getPool();
  await db.query(`UPDATE ${qname('galleries')} SET cover_media_id = $1, updated_at = now() WHERE id = $2`, [mediaId, galleryId]);
}

async function listMediaInGallery(galleryId: string): Promise<MediaRecord[]> {
  if (!hasDatabase()) {
    const store = await getLibraryFromJson();
    return store.media
      .filter((item) => item.galleryId === galleryId)
      .sort((a, b) => a.sortOrder - b.sortOrder || a.createdAt.localeCompare(b.createdAt));
  }
  await ensureDatabase();
  const db = getPool();
  const res = await db.query(`SELECT * FROM ${qname('media')} WHERE gallery_id = $1 ORDER BY sort_order, created_at`, [galleryId]);
  return res.rows.map(rowToMediaRecord);
}

async function updateMediaSortOrder(mediaId: string, sortOrder: number) {
  const timestamp = now();
  if (!hasDatabase()) {
    const store = await getLibraryFromJson();
    store.media = store.media.map((item) => (item.id === mediaId ? { ...item, sortOrder, updatedAt: timestamp } : item));
    await saveLibraryToJson(store);
    return;
  }
  await ensureDatabase();
  const db = getPool();
  await db.query(`UPDATE ${qname('media')} SET sort_order = $1, updated_at = now() WHERE id = $2`, [sortOrder, mediaId]);
}

export async function moveMediaInGallery(mediaId: string, direction: 'up' | 'down'): Promise<boolean> {
  const current = await getMediaById(mediaId);
  if (!current?.galleryId) return false;
  const items = await listMediaInGallery(current.galleryId);
  const index = items.findIndex((item) => item.id === mediaId);
  if (index < 0) return false;
  const targetIndex = direction === 'up' ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= items.length) return false;
  const neighbor = items[targetIndex];
  await Promise.all([
    updateMediaSortOrder(current.id, neighbor.sortOrder),
    updateMediaSortOrder(neighbor.id, current.sortOrder),
  ]);
  return true;
}

export async function getMediaById(mediaId: string): Promise<MediaRecord | null> {
  if (!mediaId) return null;
  if (!hasDatabase()) {
    const store = await getLibraryFromJson();
    return store.media.find((item) => item.id === mediaId) || null;
  }
  try {
    await ensureDatabase();
    const db = getPool();
    const res = await db.query(`SELECT * FROM ${qname('media')} WHERE id = $1 LIMIT 1`, [mediaId]);
    return res.rows[0] ? rowToMediaRecord(res.rows[0]) : null;
  } catch {
    const store = await getLibraryFromJson();
    return store.media.find((item) => item.id === mediaId) || null;
  }
}

export async function getNextMediaSortOrder(galleryId: string) {
  if (!galleryId) return 1;
  if (!hasDatabase()) {
    const store = await getLibraryFromJson();
    const max = store.media
      .filter((item) => item.galleryId === galleryId)
      .reduce((current, item) => Math.max(current, item.sortOrder), 0);
    return max + 1;
  }
  await ensureDatabase();
  const db = getPool();
  const res = await db.query(
    `SELECT COALESCE(MAX(sort_order), 0) + 1 AS next FROM ${qname('media')} WHERE gallery_id = $1`,
    [galleryId],
  );
  return Number(res.rows[0]?.next || 1);
}

export async function insertMediaRecord(item: MediaRecord) {
  if (!hasDatabase()) {
    const store = await getLibraryFromJson();
    store.media.push(item);
    await saveLibraryToJson(store);
    return;
  }
  await ensureDatabase();
  const db = getPool();
  await db.query(
    `INSERT INTO ${qname('media')} (
      id, gallery_id, type, title, caption, slug, visibility, sort_order, provider,
      public_url, display_url, delete_url, local_path, file_name, mime_type, size_bytes,
      width, height, migration_status, created_at, updated_at
    ) VALUES (
      $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21
    )`,
    [
      item.id,
      item.galleryId,
      item.type,
      item.title,
      item.caption,
      item.slug,
      item.visibility,
      item.sortOrder,
      item.provider,
      item.publicUrl,
      item.displayUrl,
      item.deleteUrl || null,
      item.localPath || null,
      item.fileName,
      item.mimeType,
      item.sizeBytes,
      item.width || null,
      item.height || null,
      item.migrationStatus || 'done',
      item.createdAt,
      item.updatedAt,
    ],
  );
}

export async function deleteMediaRecord(mediaId: string) {
  if (!mediaId) return;
  if (!hasDatabase()) {
    const store = await getLibraryFromJson();
    store.media = store.media.filter((item) => item.id !== mediaId);
    await saveLibraryToJson(store);
    return;
  }
  await ensureDatabase();
  const db = getPool();
  await db.query(`DELETE FROM ${qname('media')} WHERE id = $1`, [mediaId]);
}

export async function getMediaPage(opts: {
  page: number;
  pageSize: number;
  galleryId?: string;
}): Promise<{ items: MediaRecord[]; total: number }> {
  const { page, pageSize, galleryId } = opts;
  const offset = (page - 1) * pageSize;

  if (!hasDatabase()) {
    const store = await getLibraryFromJson();
    let filtered = store.media;
    if (galleryId) {
      filtered = filtered.filter((m) => m.galleryId === galleryId);
    }
    filtered.sort((a, b) => a.sortOrder - b.sortOrder || a.createdAt.localeCompare(b.createdAt));
    return {
      items: filtered.slice(offset, offset + pageSize),
      total: filtered.length,
    };
  }

  try {
    await ensureDatabase();
    const db = getPool();
    let itemsQuery = `SELECT * FROM ${qname('media')}`;
    let countQuery = `SELECT count(*)::int as total FROM ${qname('media')}`;
    const params: any[] = [];

    if (galleryId) {
      itemsQuery += ` WHERE gallery_id = $1`;
      countQuery += ` WHERE gallery_id = $1`;
      params.push(galleryId);
    }

    itemsQuery += ` ORDER BY sort_order, created_at LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    const pageParams = [...params, pageSize, offset];

    const [itemsRes, countRes] = await Promise.all([
      db.query(itemsQuery, pageParams),
      db.query(countQuery, params),
    ]);

    return {
      items: itemsRes.rows.map(rowToMediaRecord),
      total: countRes.rows[0]?.total || 0,
    };
  } catch (error) {
    const store = await getLibraryFromJson();
    let filtered = store.media;
    if (galleryId) {
      filtered = filtered.filter((m) => m.galleryId === galleryId);
    }
    filtered.sort((a, b) => a.sortOrder - b.sortOrder || a.createdAt.localeCompare(b.createdAt));
    return {
      items: filtered.slice(offset, offset + pageSize),
      total: filtered.length,
    };
  }
}

export function now() {
  return new Date().toISOString();
}

function galleryFromRow(row: any): GalleryRecord {
  return {
    id: row.id,
    folderId: row.folder_id,
    title: row.title,
    slug: row.slug,
    description: row.description,
    visibility: row.visibility,
    sortOrder: row.sort_order,
    coverMediaId: row.cover_media_id,
    smugmugUri: row.smugmug_uri || undefined,
    originalUrl: row.original_url || undefined,
    urlPath: row.url_path || undefined,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at || ''),
    updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : String(row.updated_at || ''),
  };
}

const PUBLIC_MEDIA_WHERE = `visibility != 'private' AND (migration_status IS NULL OR migration_status IN ('done', 'done_with_local_original'))`;
const PUBLIC_FOLDER_WHERE = `visibility = 'public' AND ${publicLibrarySqlExclude('folders')}`;
const PUBLIC_GALLERY_WHERE = `visibility = 'public' AND ${publicLibrarySqlExclude('galleries')}`;

function isPublicFolderRecord(folder: FolderRecord) {
  return folder.visibility === 'public' && !isExcludedPublicLibraryItem(folder);
}

function isPublicGalleryRecord(gallery: GalleryRecord) {
  return gallery.visibility === 'public' && !isExcludedPublicLibraryItem(gallery);
}

function folderFromRow(row: any): FolderRecord {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description,
    parentId: row.parent_id,
    visibility: row.visibility,
    sortOrder: row.sort_order,
    smugmugUri: row.smugmug_uri || undefined,
    originalUrl: row.original_url || undefined,
    urlPath: row.url_path || undefined,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at || ''),
    updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : String(row.updated_at || ''),
  };
}

export type PublicBrowseGallery = {
  id: string;
  title: string;
  slug: string;
  description: string;
  mediaCount: number;
  coverUrl: string;
  coverWidth?: number;
  coverHeight?: number;
};

export type PublicBrowseFolder = {
  id: string;
  title: string;
  slug: string;
  description: string;
  childFolderCount: number;
  galleryCount: number;
  coverUrl: string;
};

function folderCoverFromStore(store: LibraryStore, folderId: string): string {
  const galleries = store.galleries
    .filter((gallery) => gallery.folderId === folderId && isPublicGalleryRecord(gallery))
    .sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title));

  for (const gallery of galleries) {
    if (isExcludedPublicLibraryItem(gallery)) continue;
    const images = store.media
      .filter(
        (item) =>
          item.galleryId === gallery.id &&
          item.visibility !== 'private' &&
          (!item.migrationStatus || item.migrationStatus === 'done' || item.migrationStatus === 'done_with_local_original'),
      )
      .sort((a, b) => a.sortOrder - b.sortOrder || a.createdAt.localeCompare(b.createdAt));
    const cover = (gallery.coverMediaId ? images.find((item) => item.id === gallery.coverMediaId) : null) || images[0] || null;
    const url = mediaImageUrl(cover);
    if (url) return url;
  }

  const childFolders = store.folders
    .filter((folder) => folder.parentId === folderId && isPublicFolderRecord(folder))
    .sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title));

  for (const child of childFolders) {
    if (isExcludedPublicLibraryItem(child)) continue;
    const url = folderCoverFromStore(store, child.id);
    if (url) return url;
  }

  return '';
}

async function enrichFolderCovers(folderIds: string[]): Promise<Map<string, string>> {
  const covers = new Map<string, string>();
  if (!folderIds.length) return covers;

  if (!hasDatabase()) {
    const store = await getLibraryFromJson();
    for (const folderId of folderIds) {
      const url = folderCoverFromStore(store, folderId);
      if (url) covers.set(folderId, url);
    }
    return covers;
  }

  await ensureDatabase();
  const db = getPool();
  const res = await db.query(
    `WITH RECURSIVE folder_tree AS (
      SELECT id, id AS root_id, sort_order, title, 0 AS depth
      FROM ${qname('folders')}
      WHERE id = ANY($1::text[]) AND visibility = 'public'
      UNION ALL
      SELECT f.id, ft.root_id, f.sort_order, f.title, ft.depth + 1
      FROM ${qname('folders')} f
      INNER JOIN folder_tree ft ON f.parent_id = ft.id
      WHERE f.visibility = 'public' AND ${publicLibrarySqlExclude('f')}
    )
    SELECT DISTINCT ON (ft.root_id)
      ft.root_id AS folder_id,
      COALESCE(NULLIF(m.public_url, ''), NULLIF(m.display_url, '')) AS cover_url
    FROM folder_tree ft
    INNER JOIN ${qname('galleries')} g ON g.folder_id = ft.id AND g.visibility = 'public' AND ${publicLibrarySqlExclude('g')}
    INNER JOIN LATERAL (
      SELECT public_url, display_url
      FROM ${qname('media')} m2
      WHERE m2.gallery_id = g.id
        AND m2.visibility != 'private'
        AND (m2.migration_status IS NULL OR m2.migration_status IN ('done', 'done_with_local_original'))
        AND COALESCE(NULLIF(m2.public_url, ''), NULLIF(m2.display_url, '')) <> ''
      ORDER BY
        CASE WHEN m2.id = g.cover_media_id THEN 0 ELSE 1 END,
        m2.sort_order,
        m2.created_at
      LIMIT 1
    ) m ON true
    ORDER BY ft.root_id, ft.depth, ft.sort_order, ft.title, g.sort_order, g.title`,
    [folderIds],
  );

  for (const row of res.rows) {
    if (row.cover_url) covers.set(row.folder_id, row.cover_url);
  }

  return covers;
}

async function enrichPublicGalleries(galleries: GalleryRecord[]): Promise<PublicBrowseGallery[]> {
  if (!galleries.length) return [];

  if (!hasDatabase()) {
    const store = await getLibraryFromJson();
    return galleries.map((gallery) => {
      const images = store.media
        .filter(
          (item) =>
            item.galleryId === gallery.id &&
            item.visibility !== 'private' &&
            (!item.migrationStatus || item.migrationStatus === 'done' || item.migrationStatus === 'done_with_local_original'),
        )
        .sort((a, b) => a.sortOrder - b.sortOrder || a.createdAt.localeCompare(b.createdAt));
      const cover = (gallery.coverMediaId ? images.find((item) => item.id === gallery.coverMediaId) : null) || images[0] || null;
      return {
        id: gallery.id,
        title: gallery.title,
        slug: gallery.slug,
        description: gallery.description,
        mediaCount: images.length,
        coverUrl: mediaImageUrl(cover),
        coverWidth: cover?.width,
        coverHeight: cover?.height,
      };
    });
  }

  await ensureDatabase();
  const db = getPool();
  const galleryIds = galleries.map((gallery) => gallery.id);
  const coverIds = galleries.map((gallery) => gallery.coverMediaId).filter(Boolean);

  const [countsRes, coverRes, firstRes] = await Promise.all([
    db.query(
      `SELECT gallery_id, count(*)::int AS total FROM ${qname('media')} WHERE gallery_id = ANY($1::text[]) AND ${PUBLIC_MEDIA_WHERE} GROUP BY gallery_id`,
      [galleryIds],
    ),
    coverIds.length
      ? db.query(`SELECT * FROM ${qname('media')} WHERE id = ANY($1::text[])`, [coverIds])
      : Promise.resolve({ rows: [] }),
    db.query(
      `SELECT DISTINCT ON (gallery_id) * FROM ${qname('media')} WHERE gallery_id = ANY($1::text[]) AND ${PUBLIC_MEDIA_WHERE} ORDER BY gallery_id, sort_order, created_at`,
      [galleryIds],
    ),
  ]);

  const countByGallery = new Map<string, number>(countsRes.rows.map((row) => [row.gallery_id, row.total]));
  const coverById = new Map<string, MediaRecord>(coverRes.rows.map((row) => [row.id, rowToMediaRecord(row)]));
  const firstByGallery = new Map<string, MediaRecord>(firstRes.rows.map((row) => [row.gallery_id, rowToMediaRecord(row)]));

  return galleries.map((gallery) => {
    let cover: MediaRecord | null = null;
    if (gallery.coverMediaId) {
      const selected = coverById.get(gallery.coverMediaId);
      if (selected && selected.galleryId === gallery.id) cover = selected;
    }
    if (!cover) cover = firstByGallery.get(gallery.id) || null;
    return {
      id: gallery.id,
      title: gallery.title,
      slug: gallery.slug,
      description: gallery.description,
      mediaCount: countByGallery.get(gallery.id) || 0,
      coverUrl: mediaImageUrl(cover),
      coverWidth: cover?.width,
      coverHeight: cover?.height,
    };
  });
}

function browseFoldersFromStore(store: LibraryStore, parentFolderId: string, coverByFolderId?: Map<string, string>): PublicBrowseFolder[] {
  const folders = store.folders
    .filter((folder) => folder.parentId === parentFolderId && isPublicFolderRecord(folder))
    .sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title));
  return folders.map((folder) => ({
    id: folder.id,
    title: folder.title,
    slug: folder.slug,
    description: folder.description,
    childFolderCount: store.folders.filter((item) => item.parentId === folder.id && isPublicFolderRecord(item)).length,
    galleryCount: store.galleries.filter((item) => item.folderId === folder.id && isPublicGalleryRecord(item)).length,
    coverUrl: coverByFolderId?.get(folder.id) || folderCoverFromStore(store, folder.id),
  }));
}

export async function getPublicBrowse(parentFolderId = ''): Promise<{ folders: PublicBrowseFolder[]; galleries: PublicBrowseGallery[] }> {
  if (!hasDatabase()) {
    const store = await getLibraryFromJson();
    const galleries = store.galleries
      .filter((gallery) => gallery.folderId === parentFolderId && isPublicGalleryRecord(gallery))
      .sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title));
    const folderCovers = await enrichFolderCovers(
      store.folders.filter((folder) => folder.parentId === parentFolderId && isPublicFolderRecord(folder)).map((folder) => folder.id),
    );
    return {
      folders: browseFoldersFromStore(store, parentFolderId, folderCovers),
      galleries: await enrichPublicGalleries(galleries),
    };
  }

  try {
    await ensureDatabase();
    const db = getPool();
    const [foldersRes, galleriesRes, childFolderCounts, galleryCounts] = await Promise.all([
      db.query(`SELECT * FROM ${qname('folders')} WHERE parent_id = $1 AND ${PUBLIC_FOLDER_WHERE} ORDER BY sort_order, title`, [parentFolderId]),
      db.query(`SELECT * FROM ${qname('galleries')} WHERE folder_id = $1 AND ${PUBLIC_GALLERY_WHERE} ORDER BY sort_order, title`, [parentFolderId]),
      db.query(`SELECT parent_id, count(*)::int AS total FROM ${qname('folders')} WHERE ${PUBLIC_FOLDER_WHERE} GROUP BY parent_id`),
      db.query(`SELECT folder_id, count(*)::int AS total FROM ${qname('galleries')} WHERE ${PUBLIC_GALLERY_WHERE} GROUP BY folder_id`),
    ]);

    const childCountByFolder = new Map<string, number>(childFolderCounts.rows.map((row) => [row.parent_id, row.total]));
    const galleryCountByFolder = new Map<string, number>(galleryCounts.rows.map((row) => [row.folder_id, row.total]));
    const folderIds = foldersRes.rows.map((row) => row.id);
    const folderCovers = await enrichFolderCovers(folderIds);
    const folders = foldersRes.rows.map((row) => ({
      id: row.id,
      title: row.title,
      slug: row.slug,
      description: row.description,
      childFolderCount: childCountByFolder.get(row.id) || 0,
      galleryCount: galleryCountByFolder.get(row.id) || 0,
      coverUrl: folderCovers.get(row.id) || '',
    }));
    const galleries = await enrichPublicGalleries(galleriesRes.rows.map(galleryFromRow));
    return { folders, galleries };
  } catch {
    const store = await getLibraryFromJson();
    const galleries = store.galleries
      .filter((gallery) => gallery.folderId === parentFolderId && isPublicGalleryRecord(gallery))
      .sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title));
    const folderCovers = await enrichFolderCovers(
      store.folders.filter((folder) => folder.parentId === parentFolderId && isPublicFolderRecord(folder)).map((folder) => folder.id),
    );
    return {
      folders: browseFoldersFromStore(store, parentFolderId, folderCovers),
      galleries: await enrichPublicGalleries(galleries),
    };
  }
}

export async function getPublicFolderBySlug(slug: string): Promise<FolderRecord | null> {
  const folders = await getFoldersForAdmin();
  const folder = folders.find((item) => item.slug === slug && isPublicFolderRecord(item)) || null;
  return folder;
}

export async function getPublicGalleryBySlug(slug: string): Promise<GalleryRecord | null> {
  const galleries = await getGalleriesForAdmin();
  const gallery = galleries.find((item) => item.slug === slug && isPublicGalleryRecord(item)) || null;
  return gallery;
}

export async function getFolderByUrlPath(urlPath: string): Promise<FolderRecord | null> {
  const folders = await getFoldersForAdmin();
  return folders.find((folder) => folder.urlPath === urlPath) || null;
}

export async function getPublicGalleriesForFolder(folderId: string): Promise<GalleryRecord[]> {
  if (!hasDatabase()) {
    const store = await getLibraryFromJson();
    return store.galleries
      .filter((gallery) => gallery.folderId === folderId && gallery.visibility === 'public')
      .sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title));
  }
  try {
    await ensureDatabase();
    const db = getPool();
    const res = await db.query(
      `SELECT * FROM ${qname('galleries')} WHERE folder_id = $1 AND visibility = 'public' ORDER BY sort_order, title`,
      [folderId],
    );
    return res.rows.map(galleryFromRow);
  } catch {
    const store = await getLibraryFromJson();
    return store.galleries
      .filter((gallery) => gallery.folderId === folderId && gallery.visibility === 'public')
      .sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title));
  }
}

export async function getPublicMediaForGallery(galleryId: string): Promise<MediaRecord[]> {
  if (!hasDatabase()) {
    const store = await getLibraryFromJson();
    return store.media
      .filter(
        (item) =>
          item.galleryId === galleryId &&
          item.visibility !== 'private' &&
          (item.migrationStatus === 'done' || item.migrationStatus === 'done_with_local_original' || item.migrationStatus === undefined),
      )
      .sort((a, b) => a.sortOrder - b.sortOrder || a.createdAt.localeCompare(b.createdAt));
  }
  try {
    await ensureDatabase();
    const db = getPool();
    const res = await db.query(
      `SELECT * FROM ${qname('media')} WHERE gallery_id = $1 AND ${PUBLIC_MEDIA_WHERE} ORDER BY sort_order, created_at`,
      [galleryId],
    );
    return res.rows.map(rowToMediaRecord);
  } catch {
    const store = await getLibraryFromJson();
    return store.media
      .filter(
        (item) =>
          item.galleryId === galleryId &&
          item.visibility !== 'private' &&
          (item.migrationStatus === 'done' || item.migrationStatus === 'done_with_local_original' || item.migrationStatus === undefined),
      )
      .sort((a, b) => a.sortOrder - b.sortOrder || a.createdAt.localeCompare(b.createdAt));
  }
}

export async function getPortfolioGallerySummaries(folderId: string): Promise<
  Array<{ gallery: GalleryRecord; mediaCount: number; cover: MediaRecord | null }>
> {
  const galleries = await getPublicGalleriesForFolder(folderId);
  if (!galleries.length) return [];

  if (!hasDatabase()) {
    const store = await getLibraryFromJson();
    return galleries.map((gallery) => {
      const images = store.media
        .filter(
          (item) =>
            item.galleryId === gallery.id &&
            item.visibility !== 'private' &&
            (item.migrationStatus === 'done' || item.migrationStatus === 'done_with_local_original' || item.migrationStatus === undefined),
        )
        .sort((a, b) => a.sortOrder - b.sortOrder || a.createdAt.localeCompare(b.createdAt));
      const cover = gallery.coverMediaId
        ? images.find((item) => item.id === gallery.coverMediaId) || images[0] || null
        : images[0] || null;
      return { gallery, mediaCount: images.length, cover };
    });
  }

  await ensureDatabase();
  const db = getPool();
  const galleryIds = galleries.map((gallery) => gallery.id);
  const coverIds = galleries.map((gallery) => gallery.coverMediaId).filter(Boolean);

  const [countsRes, coverRes, firstRes] = await Promise.all([
    db.query(
      `SELECT gallery_id, count(*)::int AS total FROM ${qname('media')} WHERE gallery_id = ANY($1::text[]) AND ${PUBLIC_MEDIA_WHERE} GROUP BY gallery_id`,
      [galleryIds],
    ),
    coverIds.length
      ? db.query(`SELECT * FROM ${qname('media')} WHERE id = ANY($1::text[])`, [coverIds])
      : Promise.resolve({ rows: [] }),
    db.query(
      `SELECT DISTINCT ON (gallery_id) * FROM ${qname('media')} WHERE gallery_id = ANY($1::text[]) AND ${PUBLIC_MEDIA_WHERE} ORDER BY gallery_id, sort_order, created_at`,
      [galleryIds],
    ),
  ]);

  const countByGallery = new Map<string, number>(countsRes.rows.map((row) => [row.gallery_id, row.total]));
  const coverById = new Map<string, MediaRecord>(coverRes.rows.map((row) => [row.id, rowToMediaRecord(row)]));
  const firstByGallery = new Map<string, MediaRecord>(firstRes.rows.map((row) => [row.gallery_id, rowToMediaRecord(row)]));

  return galleries.map((gallery) => {
    let cover: MediaRecord | null = null;
    if (gallery.coverMediaId) {
      const selected = coverById.get(gallery.coverMediaId);
      if (selected && selected.galleryId === gallery.id) cover = selected;
    }
    if (!cover) cover = firstByGallery.get(gallery.id) || null;
    return {
      gallery,
      mediaCount: countByGallery.get(gallery.id) || 0,
      cover,
    };
  });
}
