'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import type { HomepageItem } from '@/lib/admin/homepage-config';

export function HeroSlideshow({ slides, duration }: { slides: HomepageItem[]; duration: number }) {
  const [loaded, setLoaded] = useState<Set<string>>(new Set());
  const [activeIndex, setActiveIndex] = useState(0);
  const [progressKey, setProgressKey] = useState(0);
  const maxSlides = typeof window !== 'undefined' && window.innerWidth < 768 ? 3 : slides.length;
  const preloadSlides = slides.slice(0, maxSlides);
  const loadedSlides = useMemo(() => preloadSlides.filter((slide) => loaded.has(slide.id)), [preloadSlides, loaded]);
  const activeSlide = loadedSlides.length > 0 ? loadedSlides[activeIndex % loadedSlides.length] : null;
  const loadingPercent = preloadSlides.length ? Math.round((loaded.size / preloadSlides.length) * 100) : 100;

  useEffect(() => {
    let cancelled = false;
    setLoaded(new Set());
    for (const slide of preloadSlides) {
      const image = new window.Image();
      image.onload = () => {
        if (cancelled) return;
        setLoaded((current) => new Set(current).add(slide.id));
      };
      image.src = slide.imageUrl;
    }
    return () => {
      cancelled = true;
    };
  }, [preloadSlides]);

  useEffect(() => {
    if (loadedSlides.length <= 1) return;
    const timer = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % loadedSlides.length);
      setProgressKey((key) => key + 1);
    }, duration * 1000);
    return () => window.clearInterval(timer);
  }, [duration, loadedSlides.length]);

  return (
    <div className="absolute inset-0 overflow-hidden" style={{ '--slide-duration': `${duration}s` } as React.CSSProperties}>
      {slides.map((slide, index) => (
        <Image
          key={slide.id}
          src={slide.imageUrl}
          alt=""
          fill
          unoptimized
          priority={index < 2}
          sizes="100vw"
          className="pointer-events-none absolute opacity-0"
          onLoad={() => setLoaded((current) => new Set(current).add(slide.id))}
        />
      ))}
      {activeSlide ? (
        <Image
          key={activeSlide.id}
          src={activeSlide.imageUrl}
          alt=""
          fill
          unoptimized
          className="hero-active-slide object-cover"
          style={{ objectPosition: activeSlide.objectPosition }}
          sizes="100vw"
          priority
        />
      ) : (
        <div className="absolute inset-0 bg-[linear-gradient(115deg,#111,#3d3122,#111)]" />
      )}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_68%_42%,transparent_0,rgba(0,0,0,0.12)_36%,rgba(0,0,0,0.72)_100%)]" />
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/15">
        {activeSlide ? (
          <div key={progressKey} className="hero-progress h-full bg-[linear-gradient(90deg,rgba(214,181,109,0.15),rgba(214,181,109,0.95),rgba(255,255,255,0.85))]" />
        ) : (
          <div className="h-full bg-white/70 transition-all duration-300" style={{ width: `${loadingPercent}%` }} />
        )}
      </div>
    </div>
  );
}
