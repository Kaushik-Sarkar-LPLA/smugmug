import { notFound } from 'next/navigation';
import { PageHero, SiteShell } from '@/components/SiteShell';
import GalleryGrid from '@/components/GalleryGrid';
import { mediaImageUrl, mediaThumbUrl } from '@/lib/media-url';
import { findPortfolioGallery, getPortfolioGalleries } from '@/lib/portfolio-db';
import { buildMetadata } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export async function generateStaticParams() {
  try {
    const galleries = await getPortfolioGalleries();
    return galleries.map((g) => ({ slug: g.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let gallery: Awaited<ReturnType<typeof findPortfolioGallery>> = null;
  try { gallery = await findPortfolioGallery(slug); } catch {}
  return buildMetadata({
    title: gallery?.title ?? 'Portfolio',
    description: gallery
      ? `${gallery.title} photography gallery by Pixilens — Austin, Dallas, and Houston photographer.`
      : undefined,
    path: `/Pixilens-Portfolio/${slug}`,
  });
}

export default async function PortfolioGalleryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let gallery: Awaited<ReturnType<typeof findPortfolioGallery>> = null;
  try {
    gallery = await findPortfolioGallery(slug);
  } catch {}
  if (!gallery) notFound();

  const gridImages = gallery.images
    .filter((img) => mediaThumbUrl(img))
    .map((img) => ({
      id: img.id,
      url: mediaThumbUrl(img),
      fullUrl: mediaImageUrl(img),
      title: img.title || img.caption || gallery.title,
      width: img.width,
      height: img.height,
    }));

  return (
    <SiteShell>
      <PageHero eyebrow="Portfolio" title={gallery.title} />
      <section className="mx-auto max-w-7xl px-5 pb-20 md:px-8">
        {gridImages.length ? (
          <GalleryGrid images={gridImages} />
        ) : (
          <div className="glass-panel mx-auto max-w-3xl rounded-xl p-8 text-center text-[#17130f]/65">
            No images are available in this gallery yet.
          </div>
        )}
      </section>
    </SiteShell>
  );
}
