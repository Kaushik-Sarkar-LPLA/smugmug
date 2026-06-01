import type { MetadataRoute } from 'next';
import { getPublicSitemapSlugs } from '@/lib/admin/library-store';
import { portfolioLinks } from '@/lib/site-content';
import { getPortfolioGalleries } from '@/lib/portfolio-db';
import { publicSitemapPaths, siteUrl } from '@/lib/seo';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = publicSitemapPaths.map((path) => ({
    url: `${base}${path === '/' ? '' : path}`,
    lastModified: now,
    changeFrequency: path === '/' ? 'weekly' : 'monthly',
    priority: path === '/' ? 1 : path === '/Pixilens-Portfolio' ? 0.9 : 0.7,
  }));

  const portfolioFromNav = portfolioLinks.map((link) => ({
    url: `${base}${link.href}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }));

  let portfolioFromDb: MetadataRoute.Sitemap = [];
  let libraryEntries: MetadataRoute.Sitemap = [];
  try {
    const galleries = await getPortfolioGalleries();
    portfolioFromDb = galleries.map((gallery) => ({
      url: `${base}/Pixilens-Portfolio/${gallery.slug}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.75,
    }));
  } catch {
    // DB unavailable — nav links still cover main portfolio URLs
  }

  try {
    const { galleries, folders } = await getPublicSitemapSlugs();
    libraryEntries = [
      ...galleries.map((gallery) => ({
        url: `${base}/galleries/${encodeURIComponent(gallery.slug)}`,
        lastModified: gallery.updatedAt ? new Date(gallery.updatedAt) : now,
        changeFrequency: 'monthly' as const,
        priority: 0.6,
      })),
      ...folders.map((folder) => ({
        url: `${base}/folders/${encodeURIComponent(folder.slug)}`,
        lastModified: folder.updatedAt ? new Date(folder.updatedAt) : now,
        changeFrequency: 'monthly' as const,
        priority: 0.55,
      })),
    ];
  } catch {
    // Gallery/folder sitemap entries optional when DB is down
  }

  const byUrl = new Map<string, MetadataRoute.Sitemap[number]>();
  for (const entry of [...staticEntries, ...portfolioFromNav, ...portfolioFromDb, ...libraryEntries]) {
    byUrl.set(entry.url, entry);
  }

  return [...byUrl.values()];
}
