import Link from 'next/link';
import { SiteShell } from '@/components/SiteShell';
import { getPortfolioGalleries } from '@/lib/portfolio-db';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Portfolio - Pixilens Photography',
};

export default async function PortfolioPage() {
  let galleries: Awaited<ReturnType<typeof getPortfolioGalleries>> = [];
  try {
    galleries = await getPortfolioGalleries();
  } catch {} // DB not available yet
  const hasGalleries = galleries.length > 0;

  return (
    <SiteShell>
      <section className="mx-auto max-w-7xl px-5 py-14 text-center md:px-8 md:py-20">
        <p className="text-xs uppercase tracking-[0.4em] text-[#17130f]/45">Portfolio</p>
        <h1 className="gold-text mt-4 text-4xl font-light tracking-[0.12em] md:text-6xl">Galleries</h1>
      </section>
      <section className="mx-auto grid max-w-7xl gap-5 px-5 pb-20 sm:grid-cols-2 lg:grid-cols-4 md:px-8">
        {hasGalleries ? (
          galleries.map((gallery) => (
            <PortfolioCard key={gallery.id} gallery={gallery} />
          ))
        ) : (
          <div className="col-span-full glass-panel mx-auto max-w-3xl rounded-xl p-8 text-center text-[#17130f]/65">
            Portfolio galleries are coming soon. Check back shortly.
          </div>
        )}
      </section>
    </SiteShell>
  );
}

function PortfolioCard({ gallery }: { gallery: Awaited<ReturnType<typeof getPortfolioGalleries>>[0] }) {
  return (
    <Link key={gallery.id} href={`/Pixilens-Portfolio/${gallery.slug}`} className="glass-panel group relative overflow-hidden rounded-xl active:scale-[0.98] transition-transform">
      <div className="relative aspect-[3/4] bg-white/60">
        {gallery.coverUrl ? (
          <img
            src={gallery.coverUrl}
            alt={gallery.title}
            className="image-loading h-full w-full object-cover opacity-90 transition duration-700 group-hover:scale-105 group-hover:opacity-100"
            loading="lazy"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
        <div className="absolute bottom-0 p-5">
          <p className="text-[10px] uppercase tracking-[0.28em] text-white/58">{gallery.mediaCount} items</p>
          <h2 className="font-art mt-2 break-words text-xl leading-tight tracking-[0.08em] text-white">{gallery.title}</h2>
        </div>
      </div>
      <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition duration-300 group-hover:bg-black/35">
        <button className="rounded-full border border-white/70 px-5 py-2 text-xs uppercase tracking-widest text-white opacity-0 transition duration-300 group-hover:opacity-100 active:scale-90 active:bg-white/20 cursor-pointer">
          View Gallery
        </button>
      </div>
    </Link>
  );
}
