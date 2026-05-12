import Image from 'next/image';
import Link from 'next/link';
import { findSiteAsset } from '@/lib/priority-assets';
import { contact, navItems } from '@/lib/site-content';

function localHref(href: string) {
  if (href.startsWith('/')) return href;
  return href;
}

export function SiteHeader() {
  const logo = findSiteAsset('i-9T6g4MC-XL_color1.png') ?? findSiteAsset('logo-main.png') ?? findSiteAsset('logo.png');

  return (
    <header className="sticky top-0 z-30 border-b border-[#17130f]/10 px-4 py-4 shadow-xl backdrop-blur-2xl md:px-8 bg-[linear-gradient(110deg,rgba(255,255,255,0.82),rgba(255,232,197,0.62),rgba(220,238,255,0.58),rgba(244,221,255,0.54),rgba(255,255,255,0.8))]">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-4">
        <Link href="/" className="flex items-center justify-center" aria-label="Pixilens home">
          {logo ? (
            <Image src={logo.imgbb_display_url} alt="Pixilens Photography" width={260} height={125} className="h-20 w-auto object-contain md:h-24" priority />
          ) : (
            <span className="text-3xl font-light tracking-[0.28em]">PIXILENS</span>
          )}
        </Link>
        <nav className="grid w-full max-w-6xl grid-cols-2 gap-2 rounded-xl border border-[#17130f]/10 bg-white/60 p-2 text-center text-[10px] uppercase tracking-[0.14em] text-[#17130f]/72 shadow-xl backdrop-blur-xl sm:grid-cols-3 md:flex md:flex-wrap md:items-center md:justify-center md:text-xs">
          {navItems.map((item) => (
            <Link key={item.label} href={localHref(item.href)} className="rounded-lg px-3 py-2 transition hover:bg-white/90 hover:text-[#17130f] md:min-w-24">
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-10 border-t border-[#17130f]/10 bg-white/75 px-5 py-10 text-center text-sm text-[#17130f]/55 shadow-xl backdrop-blur-2xl md:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-wrap items-center justify-center gap-5 text-xs uppercase tracking-[0.22em]">
          <a href="http://facebook.com/pixilens" className="hover:text-[#17130f]">Facebook</a>
          <a href="http://instagram.com/pixilens.photography" className="hover:text-[#17130f]">Instagram</a>
          <a href="https://www.youtube.com/channel/UCrGsCtzAtC0-xLj9UK0sNcw" className="hover:text-[#17130f]">YouTube</a>
          <a href={contact.messengerHref} className="hover:text-[#17130f]">DM</a>
        </div>
        <p>
          Copyrights © <Link href="/" className="text-[#17130f]/75 hover:text-[#17130f]">Pixilens</Link> Photography. All rights reserved.{' '}
          <a href={contact.messengerHref} className="text-[#17130f]/75 hover:text-[#17130f]">Click here to send a DM to get in touch directly.</a>
        </p>
      </div>
    </footer>
  );
}

export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen text-[#17130f]">
      <SiteHeader />
      {children}
      <SiteFooter />
    </main>
  );
}

export function PageHero({ eyebrow, title, children }: { eyebrow: string; title: string; children?: React.ReactNode }) {
  return (
    <section className="mx-auto max-w-5xl px-5 py-16 text-center md:px-8 md:py-24">
      <p className="text-xs uppercase tracking-[0.4em] text-[#17130f]/45">{eyebrow}</p>
      <h1 className="gold-text mt-4 text-4xl font-light tracking-[0.12em] md:text-6xl">{title}</h1>
      {children ? <div className="mx-auto mt-8 max-w-3xl text-base leading-8 text-[#17130f]/65 md:text-lg">{children}</div> : null}
    </section>
  );
}
