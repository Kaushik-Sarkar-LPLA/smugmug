import Link from 'next/link';
import { SiteShell } from '@/components/SiteShell';
import { portfolioCategories } from '@/lib/portfolio';

export const metadata = {
  title: 'Portfolio - Pixilens Photography',
};

export default function PortfolioPage() {
  return (
    <SiteShell>
      <section className="mx-auto max-w-7xl px-5 py-14 text-center md:px-8 md:py-20">
        <p className="text-xs uppercase tracking-[0.4em] text-[#17130f]/45">Portfolio</p>
        <h1 className="gold-text mt-4 text-4xl font-light tracking-[0.12em] md:text-6xl">Galleries</h1>
      </section>
      <section className="mx-auto grid max-w-7xl gap-5 px-5 pb-20 sm:grid-cols-2 lg:grid-cols-4 md:px-8">
        {portfolioCategories.map((category) => {
          const cover = category.galleries.find((gallery) => gallery.cover)?.cover;
          return (
            <Link key={category.path} href={category.path} className="glass-panel group overflow-hidden rounded-xl">
              <div className="relative aspect-[3/4] bg-white/60">
                {cover?.url ? <img src={cover.url} alt={category.label} className="h-full w-full object-cover opacity-90 transition duration-700 group-hover:scale-105 group-hover:opacity-100" /> : null}
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
                <div className="absolute bottom-0 p-5">
                  <p className="text-[10px] uppercase tracking-[0.28em] text-white/58">{category.galleryCount || category.galleries.length} galleries</p>
                  <h2 className="font-art mt-2 text-xl tracking-[0.08em] text-white">{category.label}</h2>
                </div>
              </div>
            </Link>
          );
        })}
      </section>
    </SiteShell>
  );
}
