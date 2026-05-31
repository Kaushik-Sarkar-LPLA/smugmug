'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import type { HomepageItem } from '@/lib/admin/homepage-config';
import { homepageHeroFullSrc, homepageThumbSrc } from '@/lib/homepage-images';

function preloadImage(url: string) {
  if (!url) return;
  const img = new window.Image();
  img.src = url;
}

export function HeroSlideshow({ slides, duration }: { slides: HomepageItem[]; duration: number }) {
  const items = useMemo(() => slides.filter(Boolean), [slides]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [progressKey, setProgressKey] = useState(0);
  const [fullLoadedIds, setFullLoadedIds] = useState<Set<string>>(() => new Set());

  const activeSlide = items[activeIndex] || null;
  const nextIndex = items.length ? (activeIndex + 1) % items.length : 0;
  const nextSlide = items[nextIndex] || null;

  useEffect(() => {
    setActiveIndex(0);
    setFullLoadedIds(new Set());
  }, [items]);

  useEffect(() => {
    if (!items.length) return;
    const warm = [items[0], items[1], items[2], activeSlide, nextSlide].filter(Boolean) as HomepageItem[];
    const seen = new Set<string>();
    for (const slide of warm) {
      const thumb = homepageThumbSrc(slide);
      const full = homepageHeroFullSrc(slide);
      if (thumb && !seen.has(thumb)) {
        seen.add(thumb);
        preloadImage(thumb);
      }
      if (full && full !== thumb && !seen.has(full)) {
        seen.add(full);
        preloadImage(full);
      }
    }
  }, [items, activeSlide, nextSlide]);

  useEffect(() => {
    if (items.length <= 1) return;
    const timer = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % items.length);
      setProgressKey((key) => key + 1);
    }, duration * 1000);
    return () => window.clearInterval(timer);
  }, [duration, items.length]);

  const markFullLoaded = (id: string) => {
    setFullLoadedIds((current) => {
      if (current.has(id)) return current;
      const next = new Set(current);
      next.add(id);
      return next;
    });
  };

  if (!items.length) {
    return <div className="absolute inset-0 bg-[linear-gradient(115deg,#111,#3d3122,#111)]" />;
  }

  const firstReady = Boolean(activeSlide && (fullLoadedIds.has(activeSlide.id) || homepageThumbSrc(activeSlide)));

  return (
    <div className="absolute inset-0 overflow-hidden" style={{ '--slide-duration': `${duration}s` } as React.CSSProperties}>
      <div className="absolute inset-0 bg-[linear-gradient(115deg,#111,#3d3122,#111)]" />

      {items.map((slide, index) => {
        const isActive = index === activeIndex;
        const isNext = index === nextIndex;
        if (!isActive && !isNext) return null;

        const thumbSrc = homepageThumbSrc(slide);
        const fullSrc = homepageHeroFullSrc(slide);
        const fullLoaded = fullLoadedIds.has(slide.id);

        return (
          <div
            key={slide.id}
            className={`absolute inset-0 ${isActive ? 'z-[2]' : 'z-[1]'}`}
            aria-hidden={!isActive}
          >
            {thumbSrc ? (
              <img
                src={thumbSrc}
                alt=""
                fetchPriority={index === 0 ? 'high' : 'auto'}
                decoding="async"
                className="absolute inset-0 h-full w-full object-cover"
                style={{ objectPosition: slide.objectPosition }}
              />
            ) : null}

            <Image
              src={fullSrc}
              alt=""
              fill
              priority={index === 0}
              loading={index <= 1 ? 'eager' : 'lazy'}
              sizes="100vw"
              quality={92}
              className={`object-cover transition-opacity duration-700 ${isActive && fullLoaded ? 'hero-active-slide opacity-100' : fullLoaded ? 'opacity-100' : 'opacity-0'} ${isActive ? 'z-[2]' : 'z-[1]'}`}
              style={{ objectPosition: slide.objectPosition }}
              onLoad={() => markFullLoaded(slide.id)}
            />
          </div>
        );
      })}

      <div className="absolute inset-0 z-[3] bg-[radial-gradient(circle_at_68%_42%,transparent_0,rgba(0,0,0,0.12)_36%,rgba(0,0,0,0.72)_100%)]" />
      <div className="absolute bottom-0 left-0 right-0 z-[4] h-1 bg-white/15">
        {firstReady ? (
          <div key={progressKey} className="hero-progress h-full bg-[linear-gradient(90deg,rgba(214,181,109,0.15),rgba(214,181,109,0.95),rgba(255,255,255,0.85))]" />
        ) : (
          <div className="h-full w-1/3 animate-pulse bg-white/50" />
        )}
      </div>
    </div>
  );
}
