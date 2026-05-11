import Image from 'next/image';
import Link from 'next/link';
import { SiteShell } from '@/components/SiteShell';
import { frontPageSlides } from '@/lib/priority-assets';
import { contact } from '@/lib/site-content';

export default function Home() {
  const heroSlides = frontPageSlides.slice(0, 16);

  return (
    <SiteShell>
      <section className="relative flex min-h-[78vh] items-center overflow-hidden">
        <div className="absolute inset-0 opacity-55">
          <MasonryPreview slides={heroSlides} />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-black/35 to-[#050505]" />
        <div className="relative z-10 mx-auto w-full max-w-7xl px-5 py-24 md:px-8">
          <div className="max-w-3xl">
            <p className="mb-5 text-xs uppercase tracking-[0.45em] text-white/70">Photography • Video • Live Streaming • Photobooth</p>
            <h1 className="text-5xl font-light leading-tight tracking-[0.08em] md:text-7xl">Pixilens Photography</h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-white/75 md:text-xl">
              Austin Texas photographer and videographer for portraits, events, fashion, products, dance, weddings, live streaming, and photobooth experiences.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link href="/Services-and-Pricing" className="border border-white px-7 py-3 text-xs uppercase tracking-[0.28em] transition hover:bg-white hover:text-black">Services</Link>
              <a href={contact.honeybookHref} className="border border-white/25 px-7 py-3 text-xs uppercase tracking-[0.28em] text-white/80 transition hover:border-white hover:text-white">Get Started</a>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-24">
        <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-white/45">FP Slides</p>
            <h2 className="mt-3 text-3xl font-light tracking-[0.12em] md:text-5xl">Featured Gallery</h2>
          </div>
          <p className="max-w-xl text-sm leading-7 text-white/55">
            Front page imagery migrated from the current Pixilens SmugMug homepage and served from ImgBB for this staging build.
          </p>
        </div>
        <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 xl:columns-4">
          {frontPageSlides.map((slide, index) => (
            <figure key={slide.source_web_uri} className="group mb-4 break-inside-avoid overflow-hidden bg-white/5">
              <Image
                src={slide.imgbb_display_url}
                alt={slide.file_name || `Pixilens gallery image ${index + 1}`}
                width={slide.width || 1200}
                height={slide.height || 800}
                className="h-auto w-full object-cover opacity-95 transition duration-500 group-hover:scale-[1.03] group-hover:opacity-100"
                sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
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
    <div className="grid h-full grid-cols-3 gap-2 p-2 md:grid-cols-6">
      {slides.map((slide, index) => (
        <div key={slide.source_web_uri} className={`relative overflow-hidden ${index % 5 === 0 ? 'row-span-2' : ''} ${index % 7 === 0 ? 'col-span-2' : ''}`}>
          <Image src={slide.imgbb_display_url} alt="" fill className="object-cover" sizes="20vw" priority={index < 8} />
        </div>
      ))}
    </div>
  );
}
