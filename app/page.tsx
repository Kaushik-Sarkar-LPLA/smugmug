import Image from 'next/image';
import Link from 'next/link';
import { SiteShell } from '@/components/SiteShell';
import { getHomepageConfig, type HomepageItem } from '@/lib/admin/homepage-config';
import { contact } from '@/lib/site-content';

export const revalidate = 0;

export default async function Home() {
  const config = await getHomepageConfig();
  const heroSlides = config.items.filter((item) => item.enabled && item.useInHero).sort((a, b) => a.sortOrder - b.sortOrder);
  const gallerySlides = config.items.filter((item) => item.enabled && item.useInGallery).sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <SiteShell>
      <section className="relative flex min-h-[calc(100vh-9rem)] items-center overflow-hidden md:min-h-[calc(100vh-10rem)]">
        <HeroSlideshow slides={heroSlides} duration={config.slideDurationSeconds} />
        <div className="absolute inset-0 bg-gradient-to-b from-black/65 via-black/20 to-[#050505]/85" />
        <div className="relative z-10 mx-auto w-full max-w-7xl px-5 py-24 md:px-8">
          <div className="max-w-3xl">
            <p className="mb-5 text-xs uppercase tracking-[0.45em] text-white/70">Photography • Video • Live Streaming • Photobooth</p>
            <h1 className="text-5xl font-light leading-tight tracking-[0.08em] md:text-7xl">Pixilens Photography</h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-white/75 md:text-xl">
              Austin Texas photographer and videographer for portraits, events, fashion, products, dance, weddings, live streaming, and photobooth experiences.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link href="/Services-and-Pricing" className="glass-button">Services</Link>
              <a href={contact.honeybookHref} className="glass-button">Get Started</a>
            </div>
          </div>
        </div>
      </section>

      <section className="px-2 pb-4 pt-10 md:px-4 md:pb-6 md:pt-16">
        <div className="columns-1 gap-3 sm:columns-2 lg:columns-4 xl:columns-5">
          {gallerySlides.map((slide, index) => (
            <figure key={slide.sourceWebUri} className="group mb-3 break-inside-avoid overflow-hidden rounded-2xl bg-white/5">
              <Image
                src={slide.displayUrl}
                alt={slide.alt || `Pixilens gallery image ${index + 1}`}
                width={slide.width || 1200}
                height={slide.height || 800}
                className="h-auto w-full object-cover opacity-95 transition duration-500 group-hover:scale-[1.03] group-hover:opacity-100"
                sizes="(min-width: 1280px) 20vw, (min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
              />
            </figure>
          ))}
        </div>
      </section>
    </SiteShell>
  );
}

function HeroSlideshow({ slides, duration }: { slides: HomepageItem[]; duration: number }) {
  const totalDuration = slides.length * duration;
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ '--slide-duration': `${duration}s`, '--slideshow-duration': `${totalDuration}s` } as React.CSSProperties}>
      {slides.map((slide, index) => (
        <div key={slide.sourceWebUri} className="hero-slide absolute inset-0" style={{ animationDelay: `${index * duration}s` }}>
          <Image
            src={slide.imageUrl}
            alt=""
            fill
            unoptimized
            className="object-cover"
            style={{ objectPosition: slide.objectPosition }}
            sizes="100vw"
            priority={index < 2}
          />
        </div>
      ))}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_68%_42%,transparent_0,rgba(0,0,0,0.12)_36%,rgba(0,0,0,0.72)_100%)]" />
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
        <div className="hero-progress h-full bg-[linear-gradient(90deg,rgba(214,181,109,0.15),rgba(214,181,109,0.95),rgba(255,255,255,0.85))]" />
      </div>
    </div>
  );
}
