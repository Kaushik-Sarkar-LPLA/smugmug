import {
  getFolderByUrlPath,
  getGalleryById,
  getGalleryByUrlPath,
  getMediaByUrlPath,
} from '@/lib/admin/library-store';
import { galleryPathFromPhotoPath, normalizeLegacyPath } from '@/lib/legacy-path';
import { normalizePortfolioSlug } from '@/lib/portfolio-db';

function portfolioRedirect(path: string) {
  if (!path.startsWith('/Pixilens-Portfolio/')) return null;
  const segment = path.split('/').filter(Boolean).pop();
  if (!segment) return '/Pixilens-Portfolio';
  return `/Pixilens-Portfolio/${normalizePortfolioSlug(segment)}`;
}

function galleryRedirect(slug: string, legacyPath: string) {
  const portfolio = portfolioRedirect(legacyPath);
  if (portfolio) return portfolio;
  return `/galleries/${encodeURIComponent(slug)}`;
}

/** Map an old pixilens.com / SmugMug path to the new site route, or null if unknown. */
export async function resolveLegacySmugmugPath(pathname: string): Promise<string | null> {
  const path = normalizeLegacyPath(pathname);
  if (!path || path === '/') return null;

  const portfolio = portfolioRedirect(path);
  if (portfolio) {
    const gallery = await getGalleryByUrlPath(path);
    if (gallery) return portfolio;
  }

  const media = await getMediaByUrlPath(path);
  if (media) {
    const gallery = await getGalleryById(media.galleryId);
    if (gallery) return galleryRedirect(gallery.slug, gallery.urlPath || path);
  }

  const parentGalleryPath = galleryPathFromPhotoPath(path);
  if (parentGalleryPath) {
    const gallery = await getGalleryByUrlPath(parentGalleryPath);
    if (gallery) return galleryRedirect(gallery.slug, gallery.urlPath || parentGalleryPath);
  }

  const gallery = await getGalleryByUrlPath(path);
  if (gallery) return galleryRedirect(gallery.slug, gallery.urlPath || path);

  const folder = await getFolderByUrlPath(path);
  if (folder) return `/folders/${encodeURIComponent(folder.slug)}`;

  return null;
}
