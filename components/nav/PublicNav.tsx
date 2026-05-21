'use client';

import Link from 'next/link';
import { useState } from 'react';
import { navItems } from '@/lib/site-content';

function localHref(href: string) {
  if (href.startsWith('/')) return href;
  return href;
}

export function PublicNav() {
  const [open, setOpen] = useState(false);

  return (
    <div className="w-full max-w-6xl">
      <div className="flex items-center justify-center md:hidden">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="rounded-lg border border-[#17130f]/10 bg-white/75 px-5 py-3 text-xs font-medium uppercase tracking-[0.18em] text-[#17130f]/75 shadow-xl backdrop-blur-xl"
          aria-expanded={open}
          aria-controls="mobile-nav"
        >
          {open ? 'Close' : 'Menu'}
        </button>
      </div>
      <nav className="hidden max-w-6xl flex-wrap items-center justify-center gap-2 rounded-xl border border-[#17130f]/10 bg-white/60 p-2 text-center text-xs uppercase tracking-[0.14em] text-[#17130f]/72 shadow-xl backdrop-blur-xl md:flex">
        {navItems.map((item) => (
          <Link key={item.label} href={localHref(item.href)} className="rounded-lg px-3 py-2 transition hover:bg-white/90 hover:text-[#17130f] active:scale-95 cursor-pointer md:min-w-24">
            {item.label}
          </Link>
        ))}
      </nav>
      {open ? (
        <nav id="mobile-nav" className="mt-3 grid gap-2 rounded-xl border border-[#17130f]/10 bg-white/88 p-3 text-center text-xs uppercase tracking-[0.16em] text-[#17130f]/75 shadow-2xl backdrop-blur-2xl md:hidden">
          {navItems.map((item) => (
            <Link key={item.label} href={localHref(item.href)} onClick={() => setOpen(false)} className="rounded-lg border border-[#17130f]/10 bg-white/70 px-4 py-3 transition hover:bg-white hover:text-[#17130f] active:scale-95 cursor-pointer">
              {item.label}
            </Link>
          ))}
        </nav>
      ) : null}
    </div>
  );
}
