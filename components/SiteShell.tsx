import Image from 'next/image';
import Link from 'next/link';
import { PublicNav } from '@/components/nav/PublicNav';
import { findSiteAsset } from '@/lib/priority-assets';

export function SiteHeader({ floating = false }: { floating?: boolean }) {
  const logo = findSiteAsset('i-9T6g4MC-XL_color1.png') ?? findSiteAsset('logo-main.png') ?? findSiteAsset('logo.png');

  return (
    <header className={floating ? "absolute left-0 right-0 top-0 z-30 px-4 py-4 md:px-8" : "sticky top-0 z-30 border-b border-[#17130f]/10 px-4 py-4 shadow-xl backdrop-blur-2xl md:px-8 bg-[linear-gradient(110deg,rgba(255,255,255,0.82),rgba(255,232,197,0.62),rgba(220,238,255,0.58),rgba(244,221,255,0.54),rgba(255,255,255,0.8))]"}>
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-4">
        <Link href="/" className="flex items-center justify-center" aria-label="Pixilens home">
          {logo ? (
            <Image src={logo.imgbb_display_url} alt="Pixilens Photography" width={260} height={125} className={`h-20 w-auto object-contain md:h-24 ${floating ? 'brightness-0 invert drop-shadow-[0_3px_18px_rgba(0,0,0,0.85)]' : 'logo-gold'}`} priority />
          ) : (
            <span className="text-3xl font-light tracking-[0.28em]">PIXILENS</span>
          )}
        </Link>
        <PublicNav />
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-10 border-t border-[#17130f]/10 px-5 py-10 text-center text-sm text-[#17130f]/55 shadow-xl backdrop-blur-2xl md:px-8 bg-[linear-gradient(110deg,rgba(255,255,255,0.82),rgba(255,232,197,0.62),rgba(220,238,255,0.58),rgba(244,221,255,0.54),rgba(255,255,255,0.8))]">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-wrap items-center justify-center gap-5 text-xs uppercase tracking-[0.22em]">
          <a href="http://facebook.com/pixilens" className="hover:text-[#17130f]">Facebook</a>
          <a href="http://instagram.com/pixilens.photography" className="hover:text-[#17130f]">Instagram</a>
          <a href="https://www.youtube.com/channel/UCrGsCtzAtC0-xLj9UK0sNcw" className="hover:text-[#17130f]">YouTube</a>
        </div>
        <p>
          Copyrights © <Link href="/" className="text-[#17130f]/75 hover:text-[#17130f]">Pixilens</Link> Photography. All rights reserved.{' '}
          <Link href="/Direct-Message" className="text-[#17130f]/75 hover:text-[#17130f]">Contact us</Link>
        </p>
      </div>
    </footer>
  );
}

export function SiteShell({ children, floatingHeader = false }: { children: React.ReactNode; floatingHeader?: boolean }) {
  return (
    <main className="min-h-screen text-[#17130f]">
      <SiteHeader floating={floatingHeader} />
      {children}
      <SiteFooter />
    </main>
  );
}

export function PageHero({ eyebrow, title, children }: { eyebrow: string; title: string; children?: React.ReactNode }) {
  return (
    <section className="mx-auto max-w-5xl px-5 py-16 text-center md:px-8 md:py-24">
      <p className="text-xs uppercase tracking-[0.4em] text-[#17130f]/45">{eyebrow}</p>
      <h1 className="gold-text mt-4 break-words text-4xl font-light leading-tight tracking-[0.12em] md:text-6xl">{title}</h1>
      {children ? <div className="mx-auto mt-8 max-w-3xl text-base leading-8 text-[#17130f]/65 md:text-lg">{children}</div> : null}
    </section>
  );
}
