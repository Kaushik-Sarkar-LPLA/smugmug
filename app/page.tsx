import Link from 'next/link';
import { preload } from 'react-dom';
import { SiteShell } from '@/components/SiteShell';
import { HomeHeroSection } from '@/components/home/HomeHeroSection';
import { ImageWithLoader } from '@/components/ImageWithLoader';
import { LocalBusinessJsonLd } from '@/components/seo/LocalBusinessJsonLd';
import { LocalServiceAreaSection } from '@/components/seo/LocalServiceAreaSection';
import { getHomepageConfig } from '@/lib/admin/homepage-config';
import { homepageGridSrc, homepageHeroFullSrc, homepageThumbSrc } from '@/lib/homepage-images';
import { buildMetadata } from '@/lib/seo';

export const revalidate = 0;

export const metadata = buildMetadata({
  description:
    'Pixilens Photography — Austin, Dallas, and Houston photographer and videographer for weddings, portraits, events, fashion, dance, live streaming, and photobooth.',
  path: '/',
});

export default async function Home() {
  const config = await getHomepageConfig();
  const heroSlides = config.items.filter((item) => item.enabled && item.useInHero).sort((a, b) => a.sortOrder - b.sortOrder);
  const gallerySlides = config.items.filter((item) => item.enabled && item.useInGallery).sort((a, b) => a.sortOrder - b.sortOrder);

  for (const slide of heroSlides.slice(0, 3)) {
    const thumb = homepageThumbSrc(slide);
    const full = homepageHeroFullSrc(slide);
    preload(thumb, { as: 'image', fetchPriority: 'high' });
    if (full !== thumb) preload(full, { as: 'image', fetchPriority: 'high' });
  }

  for (const slide of gallerySlides.slice(0, 8)) {
    preload(homepageGridSrc(slide), { as: 'image' });
  }

  return (
    <SiteShell floatingHeader>
      <LocalBusinessJsonLd />
      <HomeHeroSection slides={heroSlides} duration={config.slideDurationSeconds}>
        <div className="mx-auto w-full max-w-3xl text-center">
          <p className="mb-5 text-balance text-xs uppercase tracking-[0.28em] text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.75)] sm:tracking-[0.38em]">
            Photography • Video • Live Streaming • Photobooth
          </p>
          <h1 className="text-balance text-5xl font-light leading-tight tracking-[0.08em] text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.8)] md:text-7xl">
            Pixilens Photography
          </h1>
            <p className="font-hand mx-auto mt-7 max-w-2xl text-balance text-xl leading-7 text-white drop-shadow-[0_2px_14px_rgba(0,0,0,0.8)] md:text-[2rem] md:leading-[1.18]">
              <span className="typewriter">Austin, Dallas, and Houston Texas photographer and videographer for portraits, events, fashion, products, dance, weddings, live streaming, and photobooth experiences.</span>
            </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link href="/Services-and-Pricing" className="glass-button">Services</Link>
            <Link href="/Get-Started" className="glass-button">Get Started</Link>
          </div>
        </div>
      </HomeHeroSection>

      <section className="mx-auto max-w-7xl px-5 pb-4 pt-10 md:px-8 md:pb-6 md:pt-16">
        <div className="columns-1 gap-3 sm:columns-2 lg:columns-4">
          {gallerySlides.map((slide, index) => {
            const aspect = slide.width && slide.height ? slide.height / slide.width : 2 / 3;
            const displayWidth = 640;
            const displayHeight = Math.max(1, Math.round(displayWidth * aspect));

            return (
            <figure key={slide.sourceWebUri} className="group mb-3 break-inside-avoid overflow-hidden rounded-lg bg-white shadow-[0_18px_60px_rgba(71,52,24,0.13)]">
              <ImageWithLoader
                src={homepageGridSrc(slide)}
                alt={slide.alt || `Pixilens gallery image ${index + 1}`}
                width={displayWidth}
                height={displayHeight}
                className="h-auto w-full object-cover opacity-95 transition duration-500 group-hover:scale-[1.03] group-hover:opacity-100"
                quality={90}
                sizes="(min-width: 1024px) 320px, (min-width: 640px) 50vw, 100vw"
                loading={index < 10 ? 'eager' : 'lazy'}
                priority={index < 4}
                fetchPriority={index < 4 ? 'high' : 'auto'}
              />
            </figure>
            );
          })}
        </div>
      </section>

      <LocalServiceAreaSection />
    </SiteShell>
  );
}
