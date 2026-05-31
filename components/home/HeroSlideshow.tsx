'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import type { HomepageItem } from '@/lib/admin/homepage-config';

function slideSrc(slide: HomepageItem) {
  return slide.displayUrl || slide.imageUrl;
}

export function HeroSlideshow({ slides, duration }: { slides: HomepageItem[]; duration: number }) {
  const items = useMemo(() => slides.filter(Boolean), [slides]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [progressKey, setProgressKey] = useState(0);
  const [loadedIds, setLoadedIds] = useState<Set<string>>(() => new Set());

  const activeSlide = items[activeIndex] || null;
  const nextIndex = items.length ? (activeIndex + 1) % items.length : 0;
  const nextSlide = items[nextIndex] || null;

  useEffect(() => {
    setActiveIndex(0);
    setLoadedIds(new Set());
  }, [items]);

  useEffect(() => {
    if (!nextSlide || loadedIds.has(nextSlide.id)) return;
    const img = new window.Image();
    img.src = slideSrc(nextSlide);
  }, [nextSlide, loadedIds]);

  useEffect(() => {
    if (items.length <= 1) return;
    const timer = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % items.length);
      setProgressKey((key) => key + 1);
    }, duration * 1000);
    return () => window.clearInterval(timer);
  }, [duration, items.length]);

  const markLoaded = (id: string) => {
    setLoadedIds((current) => {
      if (current.has(id)) return current;
      const next = new Set(current);
      next.add(id);
      return next;
    });
  };

  if (!items.length) {
    return <div className="absolute inset-0 bg-[linear-gradient(115deg,#111,#3d3122,#111)]" />;
  }

  const firstLoaded = Boolean(activeSlide && loadedIds.has(activeSlide.id));

  return (
    <div className="absolute inset-0 overflow-hidden" style={{ '--slide-duration': `${duration}s` } as React.CSSProperties}>
      <div className="absolute inset-0 bg-[linear-gradient(115deg,#111,#3d3122,#111)]" />

      {items.map((slide, index) => {
        const isActive = index === activeIndex;
        const isNext = index === nextIndex;
        if (!isActive && !isNext) return null;

        return (
          <Image
            key={slide.id}
            src={slideSrc(slide)}
            alt=""
            fill
            priority={index === 0}
            loading={index <= 1 ? 'eager' : 'lazy'}
            sizes="100vw"
            className={`object-cover transition-opacity duration-700 ${isActive && loadedIds.has(slide.id) ? 'hero-active-slide opacity-100' : 'opacity-0'} ${isActive ? 'z-[2]' : 'z-[1]'}`}
            style={{ objectPosition: slide.objectPosition }}
            onLoad={() => markLoaded(slide.id)}
          />
        );
      })}

      <div className="absolute inset-0 z-[3] bg-[radial-gradient(circle_at_68%_42%,transparent_0,rgba(0,0,0,0.12)_36%,rgba(0,0,0,0.72)_100%)]" />
      <div className="absolute bottom-0 left-0 right-0 z-[4] h-1 bg-white/15">
        {firstLoaded ? (
          <div key={progressKey} className="hero-progress h-full bg-[linear-gradient(90deg,rgba(214,181,109,0.15),rgba(214,181,109,0.95),rgba(255,255,255,0.85))]" />
        ) : (
          <div className="h-full w-1/3 animate-pulse bg-white/50" />
        )}
      </div>
    </div>
  );
}
