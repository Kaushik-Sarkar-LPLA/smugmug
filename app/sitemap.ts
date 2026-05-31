import type { MetadataRoute } from 'next';
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

  const byUrl = new Map<string, MetadataRoute.Sitemap[number]>();
  for (const entry of [...staticEntries, ...portfolioFromNav, ...portfolioFromDb]) {
    byUrl.set(entry.url, entry);
  }

  return [...byUrl.values()];
}
