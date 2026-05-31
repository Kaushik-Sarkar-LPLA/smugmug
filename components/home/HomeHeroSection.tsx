'use client';

import { useEffect, useState } from 'react';
import type { HomepageItem } from '@/lib/admin/homepage-config';
import { homepageHeroFullSrc } from '@/lib/homepage-images';
import { heroOptimizedSrc } from '@/lib/hero-image-url';
import { HeroSlideshow } from '@/components/home/HeroSlideshow';

/** First autoplay cycle — preload all of these before showing the page. */
const BOOT_SLIDE_COUNT = 3;
const BOOT_TIMEOUT_MS = 45000;

function loadImage(url: string, attempt = 1): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!url) {
      reject(new Error('Missing image URL'));
      return;
    }
    const img = new window.Image();
    img.onload = () => resolve();
    img.onerror = () => {
      if (attempt < 3) {
        loadImage(url, attempt + 1).then(resolve).catch(reject);
        return;
      }
      reject(new Error(`Failed to load ${url}`));
    };
    img.src = url;
  });
}

async function preloadHeroSlides(slides: HomepageItem[]) {
  const targets = slides.slice(0, BOOT_SLIDE_COUNT);
  const urls = targets.map((slide) => heroOptimizedSrc(homepageHeroFullSrc(slide)));
  await Promise.all(urls.map((url) => loadImage(url)));
}

function PageBootLoader() {
  return (
    <div className="fixed inset-0 z-[100] flex min-h-[100svh] items-center justify-center bg-[linear-gradient(115deg,#111,#3d3122,#111)]">
      <div className="nav-route-loader__panel">
        <div className="nav-route-loader__spinner" />
        <p className="nav-route-loader__label">Loading photos</p>
      </div>
    </div>
  );
}

export function HomeHeroSection({
  slides,
  duration,
  children,
  belowHero,
}: {
  slides: HomepageItem[];
  duration: number;
  children: React.ReactNode;
  belowHero?: React.ReactNode;
}) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setReady(false);

    if (!slides.length) {
      setReady(true);
      return;
    }

    const timeout = window.setTimeout(() => {
      if (!cancelled) setReady(true);
    }, BOOT_TIMEOUT_MS);

    preloadHeroSlides(slides)
      .then(() => {
        if (!cancelled) setReady(true);
      })
      .catch(() => {
        // Keep loader visible; timeout is the last-resort fallback only.
      });

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [slides]);

  if (!ready) {
    return <PageBootLoader />;
  }

  return (
    <>
      <section className="relative min-h-[100svh] overflow-hidden">
        <HeroSlideshow slides={slides} duration={duration} autoplay />
        <div className="absolute inset-0 bg-gradient-to-b from-white/25 via-black/10 to-[#fbfaf7]/92" />
        <div className="relative z-10 mx-auto flex min-h-[100svh] w-full max-w-7xl flex-col items-center justify-start px-5 pb-24 pt-48 opacity-0 animate-[fadeIn_700ms_ease_forwards] sm:pt-52 md:justify-center md:px-8 md:pb-20 md:pt-56 lg:pt-60">
          {children}
        </div>
      </section>
      {belowHero}
    </>
  );
}
