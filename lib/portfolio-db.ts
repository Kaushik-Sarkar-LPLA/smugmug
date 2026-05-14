import { getLibrary, type MediaRecord } from '@/lib/admin/library-store';
import portfolioData from '@/app/portfolio-data.json';

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

type StaticImage = { url: string; fileName: string; webUri: string; width: number; height: number; isVideo: boolean };
type StaticGallery = { title: string; urlName: string; webUri: string; imageCount: number; cover: StaticImage | null; images: StaticImage[] };
type StaticCategory = { label: string; path: string; slug: string; galleryCount: number; galleries: StaticGallery[] };

const slugFromTitle = (title: string) =>
  title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'gallery';

function staticFallback(): PortfolioGallery[] {
  return (portfolioData as StaticCategory[]).map((cat) => {
    const images: MediaRecord[] = [];
    for (const g of cat.galleries) {
      for (const img of g.images) {
        images.push({
          id: img.webUri, galleryId: cat.slug, type: 'photo', title: img.fileName, caption: '', slug: '',
          visibility: 'public', sortOrder: 0, provider: 'imgbb',
          publicUrl: img.url, displayUrl: img.url,
          fileName: img.fileName, mimeType: 'image/jpeg', sizeBytes: 0,
          width: img.width, height: img.height,
          createdAt: '', updatedAt: '',
        });
      }
    }
    const cover = cat.galleries[0]?.cover;
    return {
      id: cat.slug,
      title: cat.label,
      slug: cat.slug,
      description: '',
      mediaCount: cat.galleries.reduce((s, g) => s + g.imageCount, 0),
      coverUrl: cover?.url || '',
      coverWidth: cover?.width,
      coverHeight: cover?.height,
      images,
    };
  });
}

export async function getPortfolioGalleries(): Promise<PortfolioGallery[]> {
  let lib;
  try { lib = await getLibrary(); } catch { return staticFallback(); }
  if (!lib.folders.length) return staticFallback();
  const pf = lib.folders.find((f) => f.urlPath === '/Pixilens-Portfolio');
  if (!pf) return staticFallback();
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
