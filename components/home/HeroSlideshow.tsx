'use client';

import Image from 'next/image';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { HomepageItem } from '@/lib/admin/homepage-config';
import { homepageHeroFullSrc, homepageHeroIsWebOptimized } from '@/lib/homepage-images';
import { HERO_IMAGE_QUALITY, heroImageSizes, heroPreloadSrc } from '@/lib/hero-image-url';

const CROSSFADE_MS = 700;

function preloadImage(url: string) {
  if (!url) return;
  const img = new window.Image();
  img.src = url;
}

function HeroSlideImage({
  slide,
  priority,
  kenBurns,
  opacity,
  onLoaded,
}: {
  slide: HomepageItem;
  priority: boolean;
  kenBurns: boolean;
  opacity: number;
  onLoaded: () => void;
}) {
  const fullSrc = homepageHeroFullSrc(slide);
  const directSrc = homepageHeroIsWebOptimized(slide);
  const className = `absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-in-out ${kenBurns ? 'hero-active-slide' : ''}`;

  const style = {
    objectPosition: slide.objectPosition,
    opacity,
  };

  if (directSrc) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={fullSrc}
        alt=""
        fetchPriority={priority ? 'high' : 'auto'}
        decoding="async"
        className={className}
        style={style}
        onLoad={onLoaded}
      />
    );
  }

  return (
    <Image
      src={fullSrc}
      alt=""
      fill
      priority={priority}
      loading={priority ? 'eager' : 'lazy'}
      sizes={heroImageSizes}
      quality={HERO_IMAGE_QUALITY}
      className={className}
      style={style}
      onLoad={onLoaded}
    />
  );
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
  const [previousIndex, setPreviousIndex] = useState<number | null>(null);
  const [crossfading, setCrossfading] = useState(false);
  const [progressKey, setProgressKey] = useState(0);
  const [loadedIds, setLoadedIds] = useState<Set<string>>(() => new Set());
  const fadeTimerRef = useRef<number | undefined>(undefined);
  const activeIndexRef = useRef(activeIndex);
  activeIndexRef.current = activeIndex;

  const markLoaded = useCallback((id: string) => {
    setLoadedIds((current) => {
      if (current.has(id)) return current;
      const next = new Set(current);
      next.add(id);
      return next;
    });
  }, []);

  useEffect(() => {
    setActiveIndex(0);
    setPreviousIndex(null);
    setCrossfading(false);
    setProgressKey(0);
    setLoadedIds(new Set());
  }, [items]);

  useEffect(() => {
    if (!items.length) return;
    const count = items.length;
    const warm = new Set<number>([
      activeIndex,
      (activeIndex + 1) % count,
      (activeIndex - 1 + count) % count,
      0,
      1,
      2,
    ]);
    const seen = new Set<string>();
    for (const index of warm) {
      const slide = items[index];
      const url = heroPreloadSrc(slide);
      if (url && !seen.has(url)) {
        seen.add(url);
        preloadImage(url);
      }
    }
  }, [items, activeIndex]);

  useEffect(() => {
    for (const slide of items.slice(0, 6)) {
      const url = heroPreloadSrc(slide);
      if (!url) continue;
      const img = new window.Image();
      img.src = url;
      if (img.complete && img.naturalWidth > 0) markLoaded(slide.id);
    }
  }, [items, markLoaded]);

  const advanceSlide = useCallback(() => {
    if (items.length <= 1) return;

    window.clearTimeout(fadeTimerRef.current);
    setPreviousIndex(activeIndexRef.current);
    setCrossfading(false);
    setActiveIndex((index) => (index + 1) % items.length);
    setProgressKey((key) => key + 1);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => setCrossfading(true));
    });

    fadeTimerRef.current = window.setTimeout(() => {
      setPreviousIndex(null);
      setCrossfading(false);
    }, CROSSFADE_MS);
  }, [items.length]);

  useEffect(() => {
    return () => window.clearTimeout(fadeTimerRef.current);
  }, []);

  useEffect(() => {
    if (!autoplay || items.length <= 1) return;
    const timer = window.setInterval(advanceSlide, duration * 1000);
    return () => window.clearInterval(timer);
  }, [autoplay, duration, items.length, advanceSlide]);

  if (!items.length) {
    return <div className="absolute inset-0 bg-[linear-gradient(115deg,#111,#3d3122,#111)]" />;
  }

  const activeSlide = items[activeIndex];
  const previousSlide = previousIndex !== null ? items[previousIndex] : null;
  const firstReady = Boolean(activeSlide && loadedIds.has(activeSlide.id));

  const renderIndices = previousIndex !== null ? [previousIndex, activeIndex] : [activeIndex];

  return (
    <div className="absolute inset-0 overflow-hidden" style={{ '--slide-duration': `${duration}s` } as React.CSSProperties}>
      <div className="absolute inset-0 bg-[linear-gradient(115deg,#111,#3d3122,#111)]" />

      {renderIndices.map((index) => {
        const slide = items[index];
        const isActive = index === activeIndex;
        const isPrevious = index === previousIndex;
        const loaded = loadedIds.has(slide.id);

        let opacity = 0;
        if (loaded) {
          if (!isPrevious) {
            opacity = crossfading || previousIndex === null ? 1 : 0;
          } else {
            opacity = crossfading ? 0 : 1;
          }
        }

        return (
          <div
            key={slide.id}
            className={`absolute inset-0 ${isActive ? 'z-[2]' : 'z-[1]'}`}
            aria-hidden={!isActive}
          >
            <HeroSlideImage
              slide={slide}
              priority={index <= 2}
              kenBurns={isActive && (crossfading || previousIndex === null)}
              opacity={opacity}
              onLoaded={() => markLoaded(slide.id)}
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
