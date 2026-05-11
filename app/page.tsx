import Image from 'next/image';
import Link from 'next/link';
import { SiteShell } from '@/components/SiteShell';
import { frontPageSlides } from '@/lib/priority-assets';
import { contact } from '@/lib/site-content';

export default function Home() {
  const heroSlides = frontPageSlides.slice(0, 32);

  return (
    <SiteShell>
      <section className="relative flex min-h-[calc(100vh-9rem)] items-center overflow-hidden md:min-h-[calc(100vh-10rem)]">
        <div className="absolute inset-0 opacity-75">
          <MasonryPreview slides={heroSlides} />
        </div>
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

      <section className="px-2 pb-4 md:px-4 md:pb-6">
        <div className="columns-1 gap-3 sm:columns-2 lg:columns-4 xl:columns-5">
          {frontPageSlides.map((slide, index) => (
            <figure key={slide.source_web_uri} className="group mb-3 break-inside-avoid overflow-hidden rounded-2xl bg-white/5">
              <Image
                src={slide.imgbb_display_url}
                alt={slide.file_name || `Pixilens gallery image ${index + 1}`}
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

function MasonryPreview({ slides }: { slides: typeof frontPageSlides }) {
  return (
    <div className="grid h-full grid-cols-4 auto-rows-fr gap-2 p-2 md:grid-cols-8">
      {slides.map((slide, index) => (
        <div key={slide.source_web_uri} className={`relative overflow-hidden ${index % 5 === 0 ? 'row-span-2' : ''} ${index % 7 === 0 ? 'col-span-2' : ''}`}>
          <Image src={slide.imgbb_display_url} alt="" fill className="object-cover" sizes="20vw" priority={index < 8} />
        </div>
      ))}
    </div>
  );
}
