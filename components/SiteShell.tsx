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
    <header className="sticky top-0 z-30 px-3 pt-3 md:px-6">
      <div className="glass-panel mx-auto flex max-w-7xl flex-col items-center gap-4 rounded-3xl px-5 py-5 md:px-8">
        <Link href="/" className="flex items-center justify-center" aria-label="Pixilens home">
          {logo ? (
            <Image src={logo.imgbb_display_url} alt="Pixilens Photography" width={260} height={125} className="h-20 w-auto object-contain md:h-24" priority />
          ) : (
            <span className="text-3xl font-light tracking-[0.28em]">PIXILENS</span>
          )}
        </Link>
        <nav className="flex max-w-5xl flex-wrap items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.055] px-3 py-2 text-[11px] uppercase tracking-[0.22em] text-white/75 shadow-2xl backdrop-blur-xl md:text-xs">
          {navItems.map((item) => (
            <Link key={item.label} href={localHref(item.href)} className="rounded-full px-3 py-2 transition hover:bg-white/10 hover:text-white">
              {item.label}
            </Link>
          ))}
        </nav>
        <p className="text-center text-xs tracking-[0.12em] text-white/55 md:text-sm">
          Phone/SMS/WhatsApp {contact.phoneDisplay} <span className="mx-3 text-white/25">|</span> Email: {contact.email}
        </p>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mx-3 mb-3 mt-10 rounded-3xl border border-white/10 bg-black/45 px-5 py-10 text-center text-sm text-white/50 shadow-2xl backdrop-blur-xl md:mx-6 md:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-wrap items-center justify-center gap-5 text-xs uppercase tracking-[0.22em]">
          <a href="http://facebook.com/pixilens" className="hover:text-white">Facebook</a>
          <a href="http://instagram.com/pixilens.photography" className="hover:text-white">Instagram</a>
          <a href="https://www.youtube.com/channel/UCrGsCtzAtC0-xLj9UK0sNcw" className="hover:text-white">YouTube</a>
          <a href={contact.messengerHref} className="hover:text-white">DM</a>
        </div>
        <p>
          Copyrights © <Link href="/" className="text-white/75 hover:text-white">Pixilens</Link> Photography. All rights reserved.{' '}
          <a href={contact.messengerHref} className="text-white/75 hover:text-white">Click here to send a DM to get in touch directly.</a>
        </p>
      </div>
    </footer>
  );
}

export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen text-[#f8f0e3]">
      <SiteHeader />
      {children}
      <SiteFooter />
    </main>
  );
}

export function PageHero({ eyebrow, title, children }: { eyebrow: string; title: string; children?: React.ReactNode }) {
  return (
    <section className="mx-auto max-w-5xl px-5 py-16 text-center md:px-8 md:py-24">
      <p className="text-xs uppercase tracking-[0.4em] text-white/45">{eyebrow}</p>
      <h1 className="gold-text mt-4 text-4xl font-light tracking-[0.12em] md:text-6xl">{title}</h1>
      {children ? <div className="mx-auto mt-8 max-w-3xl text-base leading-8 text-white/65 md:text-lg">{children}</div> : null}
    </section>
  );
}
