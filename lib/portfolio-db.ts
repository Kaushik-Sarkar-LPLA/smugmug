import {
  getFolderByUrlPath,
  getPortfolioGallerySummaries,
  getPublicMediaForGallery,
  type MediaRecord,
} from '@/lib/admin/library-store';
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

export function portfolioSlug(title: string, slug?: string) {
  if (slug?.trim()) return slug.trim();
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'gallery';
}

function staticFallback(): PortfolioGallery[] {
  return (portfolioData as StaticCategory[]).map((cat) => {
    const images: MediaRecord[] = [];
    for (const g of cat.galleries) {
      for (const img of g.images) {
        images.push({
          id: img.webUri,
          galleryId: cat.slug,
          type: 'photo',
          title: img.fileName,
          caption: '',
          slug: '',
          visibility: 'public',
          sortOrder: 0,
          provider: 'imgbb',
          publicUrl: img.url,
          displayUrl: img.url,
          fileName: img.fileName,
          mimeType: 'image/jpeg',
          sizeBytes: 0,
          width: img.width,
          height: img.height,
          createdAt: '',
          updatedAt: '',
        });
      }
    }
    const cover = cat.galleries[0]?.cover;
    return {
      id: cat.slug,
      title: cat.label,
      slug: cat.slug,
      description: '',
      mediaCount: cat.galleries.reduce((sum, gallery) => sum + gallery.imageCount, 0),
      coverUrl: cover?.url || '',
      coverWidth: cover?.width,
      coverHeight: cover?.height,
      images,
    };
  });
}

function toPortfolioGallery(
  summary: { gallery: { id: string; title: string; slug: string; description: string }; mediaCount: number; cover: MediaRecord | null },
  images: MediaRecord[] = [],
): PortfolioGallery {
  const slug = portfolioSlug(summary.gallery.title, summary.gallery.slug);
  const cover = summary.cover;
  return {
    id: summary.gallery.id,
    title: summary.gallery.title,
    slug,
    description: summary.gallery.description,
    mediaCount: summary.mediaCount,
    coverUrl: cover?.displayUrl || cover?.publicUrl || '',
    coverWidth: cover?.width,
    coverHeight: cover?.height,
    images,
  };
}

export async function getPortfolioGalleries(): Promise<PortfolioGallery[]> {
  try {
    const folder = await getFolderByUrlPath('/Pixilens-Portfolio');
    if (!folder) return staticFallback();
    const summaries = await getPortfolioGallerySummaries(folder.id);
    if (!summaries.length) return staticFallback();
    return summaries.map((summary) => toPortfolioGallery(summary));
  } catch {
    return staticFallback();
  }
}

export async function findPortfolioGallery(slug: string): Promise<PortfolioGallery | null> {
  try {
    const folder = await getFolderByUrlPath('/Pixilens-Portfolio');
    if (!folder) return staticFallback().find((gallery) => gallery.slug === slug) || null;

    const summaries = await getPortfolioGallerySummaries(folder.id);
    const summary = summaries.find(
      (entry) => portfolioSlug(entry.gallery.title, entry.gallery.slug) === slug,
    );
    if (!summary) return null;

    const images = await getPublicMediaForGallery(summary.gallery.id);
    const cover = summary.cover || images[0] || null;
    return toPortfolioGallery({ ...summary, cover, mediaCount: images.length }, images);
  } catch {
    return staticFallback().find((gallery) => gallery.slug === slug) || null;
  }
}
