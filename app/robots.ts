import type { MetadataRoute } from 'next';
import { allowSearchIndexing, siteUrl } from '@/lib/seo';

export default function robots(): MetadataRoute.Robots {
  const base = siteUrl();

  if (!allowSearchIndexing()) {
    return {
      rules: { userAgent: '*', disallow: '/' },
    };
  }

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/'],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
