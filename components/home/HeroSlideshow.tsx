'use client';

import Image from 'next/image';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { HomepageItem } from '@/lib/admin/homepage-config';
import { homepageHeroFullSrc } from '@/lib/homepage-images';
import { HERO_IMAGE_QUALITY, heroImageSizes, heroOptimizedSrc } from '@/lib/hero-image-url';

function preloadImage(url: string) {
  if (!url) return;
  const img = new window.Image();
  img.src = url;
}

export function HeroSlideshow({
  slides,
  duration,
  autoplay = true,
}: {
  slides: HomepageItem[];
  duration: number;
  autoplay?: boolean;
}) {
  const items = useMemo(() => slides.filter(Boolean), [slides]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [progressKey, setProgressKey] = useState(0);
  const [fullLoadedIds, setFullLoadedIds] = useState<Set<string>>(() => new Set());

  const activeSlide = items[activeIndex] || null;
  const nextIndex = items.length ? (activeIndex + 1) % items.length : 0;
  const nextSlide = items[nextIndex] || null;

  const markFullLoaded = useCallback((id: string) => {
    setFullLoadedIds((current) => {
      if (current.has(id)) return current;
      const next = new Set(current);
      next.add(id);
      return next;
    });
  }, []);

  useEffect(() => {
    setActiveIndex(0);
    setProgressKey(0);
    setFullLoadedIds(new Set());
  }, [items]);

  useEffect(() => {
    if (!items.length) return;
    const warm = [items[0], items[1], items[2], activeSlide, nextSlide].filter(Boolean) as HomepageItem[];
    const seen = new Set<string>();
    for (const slide of warm) {
      const url = heroOptimizedSrc(homepageHeroFullSrc(slide));
      if (url && !seen.has(url)) {
        seen.add(url);
        preloadImage(url);
      }
    }
  }, [items, activeSlide, nextSlide]);

  useEffect(() => {
    if (!items.length) return;
    for (const slide of items.slice(0, 3)) {
      const url = heroOptimizedSrc(homepageHeroFullSrc(slide));
      if (!url) continue;
      const img = new window.Image();
      img.src = url;
      if (img.complete && img.naturalWidth > 0) {
        markFullLoaded(slide.id);
      }
    }
  }, [items, markFullLoaded]);

  useEffect(() => {
    if (!autoplay || items.length <= 1) return;
    const timer = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % items.length);
      setProgressKey((key) => key + 1);
    }, duration * 1000);
    return () => window.clearInterval(timer);
  }, [autoplay, duration, items.length]);

  if (!items.length) {
    return <div className="absolute inset-0 bg-[linear-gradient(115deg,#111,#3d3122,#111)]" />;
  }

  const firstReady = Boolean(activeSlide && fullLoadedIds.has(activeSlide.id));

  return (
    <div className="absolute inset-0 overflow-hidden" style={{ '--slide-duration': `${duration}s` } as React.CSSProperties}>
      <div className="absolute inset-0 bg-[linear-gradient(115deg,#111,#3d3122,#111)]" />

      {items.map((slide, index) => {
        const isActive = index === activeIndex;
        const isNext = index === nextIndex;
        if (!isActive && !isNext) return null;

        const fullSrc = homepageHeroFullSrc(slide);
        const fullLoaded = fullLoadedIds.has(slide.id);

        return (
          <div
            key={slide.id}
            className={`absolute inset-0 ${isActive ? 'z-[2]' : 'z-[1]'}`}
            aria-hidden={!isActive}
          >
            <Image
              src={fullSrc}
              alt=""
              fill
              priority={index <= 2}
              loading={index <= 2 ? 'eager' : 'lazy'}
              sizes={heroImageSizes}
              quality={HERO_IMAGE_QUALITY}
              className={`object-cover transition-opacity duration-700 ${fullLoaded ? (isActive ? 'hero-active-slide opacity-100' : 'opacity-100') : 'opacity-0'} ${isActive ? 'z-[2]' : 'z-[1]'}`}
              style={{ objectPosition: slide.objectPosition }}
              onLoad={() => markFullLoaded(slide.id)}
            />
          </div>
        );
      })}

      <div className="absolute inset-0 z-[3] bg-[radial-gradient(circle_at_68%_42%,transparent_0,rgba(0,0,0,0.12)_36%,rgba(0,0,0,0.72)_100%)]" />
      <div className="absolute bottom-0 left-0 right-0 z-[4] h-1 bg-white/15">
        {firstReady && autoplay ? (
          <div key={progressKey} className="hero-progress h-full bg-[linear-gradient(90deg,rgba(214,181,109,0.15),rgba(214,181,109,0.95),rgba(255,255,255,0.85))]" />
        ) : (
          <div className="h-full w-1/3 animate-pulse bg-white/50" />
        )}
      </div>
    </div>
  );
}
