'use client';

import Link from 'next/link';
import { useState } from 'react';
import { navItems } from '@/lib/site-content';

function localHref(href: string) {
  if (href.startsWith('/')) return href;
  return href;
}

export function PublicNav({ floating = false }: { floating?: boolean }) {
  const [open, setOpen] = useState(false);

  const desktopNavClass = floating
    ? 'hidden max-w-6xl flex-wrap items-center justify-center gap-1 rounded-xl border border-white/20 bg-black/20 p-2 text-center text-xs uppercase tracking-[0.14em] text-white/90 shadow-[0_8px_32px_rgba(0,0,0,0.18)] backdrop-blur-sm md:flex'
    : 'hidden max-w-6xl flex-wrap items-center justify-center gap-2 rounded-xl border border-[#17130f]/10 bg-white/60 p-2 text-center text-xs uppercase tracking-[0.14em] text-[#17130f]/72 shadow-xl backdrop-blur-xl md:flex';

  const desktopLinkClass = floating
    ? 'rounded-lg px-3 py-2 transition hover:bg-white/15 hover:text-white active:scale-95 cursor-pointer md:min-w-24'
    : 'rounded-lg px-3 py-2 transition hover:bg-white/90 hover:text-[#17130f] active:scale-95 cursor-pointer md:min-w-24';

  const menuButtonClass = floating
    ? 'rounded-lg border border-white/25 bg-black/25 px-5 py-3 text-xs font-medium uppercase tracking-[0.18em] text-white/90 shadow-[0_8px_32px_rgba(0,0,0,0.18)] backdrop-blur-sm'
    : 'rounded-lg border border-[#17130f]/10 bg-white/75 px-5 py-3 text-xs font-medium uppercase tracking-[0.18em] text-[#17130f]/75 shadow-xl backdrop-blur-xl';

  const mobileNavClass = floating
    ? 'mt-3 grid gap-2 rounded-xl border border-white/20 bg-black/35 p-3 text-center text-xs uppercase tracking-[0.16em] text-white/90 shadow-[0_12px_40px_rgba(0,0,0,0.28)] backdrop-blur-md md:hidden'
    : 'mt-3 grid gap-2 rounded-xl border border-[#17130f]/10 bg-white/88 p-3 text-center text-xs uppercase tracking-[0.16em] text-[#17130f]/75 shadow-2xl backdrop-blur-2xl md:hidden';

  const mobileLinkClass = floating
    ? 'rounded-lg border border-white/15 bg-white/10 px-4 py-3 transition hover:bg-white/20 hover:text-white active:scale-95 cursor-pointer'
    : 'rounded-lg border border-[#17130f]/10 bg-white/70 px-4 py-3 transition hover:bg-white hover:text-[#17130f] active:scale-95 cursor-pointer';

  return (
    <div className="w-full max-w-6xl">
      <div className="flex items-center justify-center md:hidden">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className={menuButtonClass}
          aria-expanded={open}
          aria-controls="mobile-nav"
        >
          {open ? 'Close' : 'Menu'}
        </button>
      </div>
      <nav className={desktopNavClass}>
        {navItems.map((item) => (
          <Link key={item.label} href={localHref(item.href)} className={desktopLinkClass}>
            {item.label}
          </Link>
        ))}
      </nav>
      {open ? (
        <nav id="mobile-nav" className={mobileNavClass}>
          {navItems.map((item) => (
            <Link key={item.label} href={localHref(item.href)} onClick={() => setOpen(false)} className={mobileLinkClass}>
              {item.label}
            </Link>
          ))}
        </nav>
      ) : null}
    </div>
  );
}
