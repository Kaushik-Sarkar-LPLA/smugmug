import Image from 'next/image';
import { findSiteAsset, frontPageSlides } from '@/lib/priority-assets';

const navItems = ['Home', 'Galleries', 'Services', 'About', 'Contact'];

export default function Home() {
  const logo = findSiteAsset('logo-main.png') ?? findSiteAsset('logo.png') ?? findSiteAsset('logo (1).png');
  const heroSlides = frontPageSlides.slice(0, 16);

  return (
    <main className="min-h-screen bg-[#050505] text-[#f6f2ea]">
      <header className="fixed left-0 right-0 top-0 z-20 border-b border-white/10 bg-black/70 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 md:px-8">
          <a className="flex items-center gap-3" href="#top" aria-label="Pixilens home">
            {logo ? (
              <Image src={logo.imgbb_display_url} alt="Pixilens" width={180} height={60} className="h-10 w-auto object-contain" priority />
            ) : (
              <span className="text-2xl font-semibold tracking-[0.22em]">PIXILENS</span>
            )}
          </a>
          <nav className="hidden items-center gap-7 text-xs uppercase tracking-[0.24em] text-white/75 md:flex">
            {navItems.map((item) => (
              <a key={item} className="transition hover:text-white" href={`#${item.toLowerCase()}`}>{item}</a>
            ))}
          </nav>
        </div>
      </header>

      <section id="top" className="relative flex min-h-screen items-center overflow-hidden pt-24">
        <div className="absolute inset-0 opacity-55">
          <MasonryPreview slides={heroSlides} />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/30 to-[#050505]" />
        <div className="relative z-10 mx-auto w-full max-w-7xl px-5 py-24 md:px-8">
          <div className="max-w-3xl">
            <p className="mb-5 text-xs uppercase tracking-[0.45em] text-white/70">Photography • Video • Live Streaming • Photobooth</p>
            <h1 className="text-5xl font-light leading-tight tracking-[0.08em] md:text-7xl">Pixilens Photography</h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-white/75 md:text-xl">
              A self-hosted rebuild of the Pixilens portfolio, preserving the current SmugMug visual feel, gallery structure, and visitor experience.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <a href="#galleries" className="border border-white px-7 py-3 text-xs uppercase tracking-[0.28em] transition hover:bg-white hover:text-black">View Galleries</a>
              <a href="#services" className="border border-white/25 px-7 py-3 text-xs uppercase tracking-[0.28em] text-white/80 transition hover:border-white hover:text-white">Services</a>
            </div>
          </div>
        </div>
      </section>

      <section id="galleries" className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-24">
        <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-white/45">FP Slides</p>
            <h2 className="mt-3 text-3xl font-light tracking-[0.12em] md:text-5xl">Featured Gallery</h2>
          </div>
          <p className="max-w-xl text-sm leading-7 text-white/55">
            These are the migrated front-page SmugMug images now served from ImgBB while the Pixilens app keeps the site structure and routing.
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

      <section id="services" className="border-t border-white/10 bg-white/[0.03] px-5 py-16 md:px-8 md:py-24">
        <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-[0.8fr_1.2fr] md:items-center">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-white/45">Services</p>
            <h2 className="mt-3 text-3xl font-light tracking-[0.12em] md:text-5xl">Photo, video, live streaming, photobooth</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {['Photography', 'Video', 'Live Streaming', 'Photobooth'].map((service) => (
              <div key={service} className="border border-white/10 p-6">
                <h3 className="text-lg uppercase tracking-[0.18em]">{service}</h3>
                <p className="mt-4 text-sm leading-7 text-white/55">Portfolio content and service pages will be rebuilt from migrated Pixilens site assets.</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-10 text-xs uppercase tracking-[0.24em] text-white/45 md:flex-row md:items-center md:justify-between md:px-8">
        <span>Pixilens Photography</span>
        <span>Staging: smugmug.pixilens.online</span>
      </footer>
    </main>
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
