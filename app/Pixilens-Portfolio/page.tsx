import Image from 'next/image';
import Link from 'next/link';
import { PageHero, SiteShell } from '@/components/SiteShell';
import { portfolioCategories } from '@/lib/portfolio';

export const metadata = {
  title: 'Portfolio - Pixilens Photography',
};

export default function PortfolioPage() {
  return (
    <SiteShell>
      <PageHero eyebrow="Portfolio" title="Portfolio">
        <p>Imported portfolio categories from the current Pixilens SmugMug site. Full album migration will expand these previews into complete galleries.</p>
      </PageHero>
      <section className="mx-auto grid max-w-7xl gap-5 px-5 pb-20 sm:grid-cols-2 lg:grid-cols-3 md:px-8">
        {portfolioCategories.map((category) => {
          const cover = category.galleries.find((gallery) => gallery.cover)?.cover;
          return (
            <Link key={category.path} href={category.path} className="glass-panel group overflow-hidden rounded-3xl">
              <div className="relative aspect-[4/3] bg-white/5">
                {cover?.url ? <Image src={cover.url} alt={category.label} fill className="object-cover opacity-80 transition duration-700 group-hover:scale-105 group-hover:opacity-100" sizes="(min-width: 1024px) 33vw, 50vw" /> : null}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/25 to-transparent" />
                <div className="absolute bottom-0 p-6">
                  <p className="text-xs uppercase tracking-[0.32em] text-white/50">{category.galleryCount || category.galleries.length} galleries</p>
                  <h2 className="font-art mt-2 text-2xl tracking-[0.08em] text-white">{category.label}</h2>
                </div>
              </div>
            </Link>
          );
        })}
      </section>
    </SiteShell>
  );
}
