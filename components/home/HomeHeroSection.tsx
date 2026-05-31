'use client';

import { useEffect, useMemo, useState } from 'react';
import type { HomepageItem } from '@/lib/admin/homepage-config';
import { homepageHeroFullSrc, homepageThumbSrc } from '@/lib/homepage-images';
import { HeroSlideshow } from '@/components/home/HeroSlideshow';

const BOOT_TIMEOUT_MS = 9000;
const BOOT_SLIDE_COUNT = 3;

function nextHeroImageSrc(url: string) {
  return `/_next/image?url=${encodeURIComponent(url)}&w=3840&q=92`;
}

function loadImage(url: string) {
  return new Promise<void>((resolve) => {
    if (!url) {
      resolve();
      return;
    }
    const img = new window.Image();
    img.onload = () => resolve();
    img.onerror = () => resolve();
    img.src = url;
  });
}

async function preloadHeroSlides(slides: HomepageItem[]) {
  const targets = slides.slice(0, BOOT_SLIDE_COUNT);
  await Promise.all(
    targets.flatMap((slide) => {
      const full = homepageHeroFullSrc(slide);
      const thumb = homepageThumbSrc(slide);
      const jobs = [loadImage(nextHeroImageSrc(full)), loadImage(thumb)];
      if (full !== thumb) jobs.push(loadImage(full));
      return jobs;
    }),
  );
}

export function HomeHeroSection({
  slides,
  duration,
  children,
}: {
  slides: HomepageItem[];
  duration: number;
  children: React.ReactNode;
}) {
  const bootIds = useMemo(
    () => new Set(slides.slice(0, BOOT_SLIDE_COUNT).map((slide) => slide.id)),
    [slides],
  );
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

    preloadHeroSlides(slides).then(() => {
      if (!cancelled) setReady(true);
    });

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [slides]);

  return (
    <section className="relative min-h-[100svh] overflow-hidden">
      {!ready ? (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-[linear-gradient(115deg,#111,#3d3122,#111)]">
          <div className="nav-route-loader__panel">
            <div className="nav-route-loader__spinner" />
            <p className="nav-route-loader__label">Loading gallery</p>
          </div>
        </div>
      ) : (
        <>
          <HeroSlideshow
            slides={slides}
            duration={duration}
            autoplay
            initialLoadedIds={bootIds}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-white/25 via-black/10 to-[#fbfaf7]/92" />
          <div className="relative z-10 mx-auto flex min-h-[100svh] w-full max-w-7xl flex-col items-center justify-start px-5 pb-24 pt-48 sm:pt-52 md:justify-center md:px-8 md:pb-20 md:pt-56 lg:pt-60 opacity-0 animate-[fadeIn_700ms_ease_forwards]">
            {children}
          </div>
        </>
      )}
    </section>
  );
}
