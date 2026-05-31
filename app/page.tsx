import Link from 'next/link';
import { SiteShell } from '@/components/SiteShell';
import { HeroSlideshow } from '@/components/home/HeroSlideshow';
import { ImageWithLoader } from '@/components/ImageWithLoader';
import { getHomepageConfig } from '@/lib/admin/homepage-config';

export const revalidate = 0;

export default async function Home() {
  const config = await getHomepageConfig();
  const heroSlides = config.items.filter((item) => item.enabled && item.useInHero).sort((a, b) => a.sortOrder - b.sortOrder);
  const gallerySlides = config.items.filter((item) => item.enabled && item.useInGallery).sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <SiteShell floatingHeader>
      <section className="relative flex min-h-screen items-center overflow-hidden">
        <HeroSlideshow slides={heroSlides} duration={config.slideDurationSeconds} />
        <div className="absolute inset-0 bg-gradient-to-b from-white/25 via-black/10 to-[#fbfaf7]/92" />
        <div className="relative z-10 mx-auto w-full max-w-7xl px-5 pb-24 pt-52 md:px-8 md:pt-60">
          <div className="max-w-3xl">
            <p className="mb-5 text-xs uppercase tracking-[0.45em] text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.75)]">Photography • Video • Live Streaming • Photobooth</p>
            <h1 className="text-5xl font-light leading-tight tracking-[0.08em] text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.8)] md:text-7xl">Pixilens Photography</h1>
            <p className="font-hand mt-7 max-w-3xl text-xl leading-7 text-white drop-shadow-[0_2px_14px_rgba(0,0,0,0.8)] md:text-[2rem] md:leading-[1.18]">
              <span className="typewriter">Austin Texas photographer and videographer for portraits, events, fashion, products, dance, weddings, live streaming, and photobooth experiences.</span>
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link href="/Services-and-Pricing" className="glass-button">Services</Link>
              <Link href="/Get-Started" className="glass-button">Get Started</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="px-2 pb-4 pt-10 md:px-4 md:pb-6 md:pt-16">
        <div className="columns-1 gap-3 sm:columns-2 lg:columns-4 xl:columns-5">
          {gallerySlides.map((slide, index) => (
            <figure key={slide.sourceWebUri} className="group mb-3 break-inside-avoid overflow-hidden rounded-lg bg-white shadow-[0_18px_60px_rgba(71,52,24,0.13)]">
              <ImageWithLoader
                src={slide.displayUrl}
                alt={slide.alt || `Pixilens gallery image ${index + 1}`}
                width={slide.width || 1200}
                height={slide.height || 800}
                className="h-auto w-full object-cover opacity-95 transition duration-500 group-hover:scale-[1.03] group-hover:opacity-100"
                sizes="(min-width: 1280px) 20vw, (min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                loading={index < 6 ? 'eager' : 'lazy'}
              />
            </figure>
          ))}
        </div>
      </section>
    </SiteShell>
  );
}
