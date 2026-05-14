import { getLibrary, hasDatabase, ensureDatabase, type MediaRecord } from '@/lib/admin/library-store';

export type PortfolioGallery = {
  id: string;
  title: string;
  slug: string;
  description: string;
  mediaCount: number;
  coverUrl: string;
  coverWidth?: number;
  coverHeight?: number;
  images: MediaRecord[];
};

const slugFromTitle = (title: string) =>
  title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'gallery';

export async function getPortfolioGalleries(): Promise<PortfolioGallery[]> {
  if (!hasDatabase()) return [];
  await ensureDatabase();
  const lib = await getLibrary();
  const pf = lib.folders.find((f) => f.urlPath === '/Pixilens-Portfolio');
  if (!pf) return [];
  const folderGalleries = lib.galleries
    .filter((g) => g.folderId === pf.id)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return folderGalleries.map((g) => {
    const images = lib.media
      .filter((m) => m.galleryId === g.id && (m.migrationStatus === 'done' || m.migrationStatus === undefined) && m.visibility !== 'private')
      .sort((a, b) => a.sortOrder - b.sortOrder);
    const cover = g.coverMediaId
      ? images.find((m) => m.id === g.coverMediaId)
      : images[0];
    return {
      id: g.id,
      title: g.title,
      slug: slugFromTitle(g.title),
      description: g.description,
      mediaCount: images.length,
      coverUrl: cover?.displayUrl || cover?.publicUrl || '',
      coverWidth: cover?.width,
      coverHeight: cover?.height,
      images,
    };
  });
}

export async function findPortfolioGallery(slug: string): Promise<PortfolioGallery | null> {
  const galleries = await getPortfolioGalleries();
  return galleries.find((g) => g.slug === slug) || null;
}
