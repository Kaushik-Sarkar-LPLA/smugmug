import Image from 'next/image';
import { notFound } from 'next/navigation';
import { PageHero, SiteShell } from '@/components/SiteShell';
import { findPortfolioCategory, portfolioCategories } from '@/lib/portfolio';

export function generateStaticParams() {
  return portfolioCategories.map((category) => ({ slug: category.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = findPortfolioCategory(slug);
  return { title: `${category?.label ?? 'Portfolio'} - Pixilens Photography` };
}

export default async function PortfolioCategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = findPortfolioCategory(slug);
  if (!category) notFound();

  return (
    <SiteShell>
      <PageHero eyebrow="Portfolio" title={category.label}>
        <p>{category.galleryCount || category.galleries.length} imported SmugMug galleries. This staging page currently shows preview images while full gallery import is built.</p>
      </PageHero>
      <section className="mx-auto max-w-7xl px-5 pb-20 md:px-8">
        {category.galleries.length ? (
          <div className="space-y-14">
            {category.galleries.map((gallery) => (
              <article key={gallery.webUri} className="glass-panel rounded-3xl p-5 md:p-7">
                <div className="mb-6 flex flex-col justify-between gap-3 md:flex-row md:items-end">
                  <div>
                    <p className="text-xs uppercase tracking-[0.32em] text-white/45">{gallery.imageCount} items</p>
                    <h2 className="font-art mt-2 text-3xl font-light tracking-[0.08em]">{gallery.title}</h2>
                  </div>
                  <a href={gallery.webUri} className="text-xs uppercase tracking-[0.24em] text-white/50 hover:text-white">Original SmugMug page</a>
                </div>
                <div className="columns-1 gap-4 sm:columns-2 lg:columns-4">
                  {gallery.images.map((image) => (
                    <figure key={image.webUri} className="mb-4 break-inside-avoid overflow-hidden rounded-2xl bg-black/30">
                      {image.url ? (
                        <Image src={image.url} alt={image.fileName || gallery.title} width={image.width || 600} height={image.height || 400} className="h-auto w-full object-cover opacity-90 transition duration-500 hover:scale-[1.03] hover:opacity-100" />
                      ) : null}
                    </figure>
                  ))}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="glass-panel mx-auto max-w-3xl rounded-3xl p-8 text-center text-white/65">
            This category exists in navigation, but no matching public SmugMug album was found in the first metadata pass.
          </div>
        )}
      </section>
    </SiteShell>
  );
}
