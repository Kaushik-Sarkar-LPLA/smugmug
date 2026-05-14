import { notFound } from 'next/navigation';
import { PageHero, SiteShell } from '@/components/SiteShell';
import { findPortfolioGallery, getPortfolioGalleries } from '@/lib/portfolio-db';

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
  return { title: `${gallery?.title ?? 'Portfolio'} - Pixilens Photography` };
}

export default async function PortfolioGalleryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let gallery: Awaited<ReturnType<typeof findPortfolioGallery>> = null;
  try {
    gallery = await findPortfolioGallery(slug);
  } catch {}
  if (!gallery) notFound();

  return (
    <SiteShell>
      <PageHero eyebrow="Portfolio" title={gallery.title} />
      <section className="mx-auto max-w-7xl px-5 pb-20 md:px-8">
        {gallery.images.length ? (
          <div className="columns-1 gap-4 sm:columns-2 lg:columns-4">
            {gallery.images.map((image) => (
              <figure key={image.id} className="mb-4 break-inside-avoid overflow-hidden rounded-lg bg-white shadow-[0_18px_60px_rgba(71,52,24,0.13)]">
                {image.displayUrl || image.publicUrl ? (
                  <img
                    src={image.displayUrl || image.publicUrl}
                    alt={image.title || image.caption || gallery.title}
                    className="h-auto w-full object-cover opacity-90 transition duration-500 hover:scale-[1.03] hover:opacity-100"
                  />
                ) : null}
              </figure>
            ))}
          </div>
        ) : (
          <div className="glass-panel mx-auto max-w-3xl rounded-xl p-8 text-center text-[#17130f]/65">
            No images are available in this gallery yet.
          </div>
        )}
      </section>
    </SiteShell>
  );
}
