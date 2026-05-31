import { getImageProps } from 'next/image';
import type { HomepageItem } from '@/lib/admin/homepage-config';
import { homepageHeroFullSrc, homepageHeroIsWebOptimized } from '@/lib/homepage-images';

export const HERO_IMAGE_QUALITY = 86;
export const HERO_IMAGE_WIDTH = 1920;

/** URL to preload / display for a hero slide. Pre-compressed heroes skip Next.js re-encoding. */
export function heroSlideSrc(slide: HomepageItem) {
  return homepageHeroFullSrc(slide);
}

export function heroSlideUsesDirectSrc(slide: HomepageItem) {
  return homepageHeroIsWebOptimized(slide);
}

/** Next.js optimized URL — only for legacy full-size ImgBB sources without heroUrl. */
export function heroOptimizedSrc(src: string) {
  if (!src) return '';
  const { props } = getImageProps({
    alt: '',
    src,
    width: HERO_IMAGE_WIDTH,
    height: Math.round(HERO_IMAGE_WIDTH * 0.667),
    quality: HERO_IMAGE_QUALITY,
    sizes: '100vw',
  });
  return props.src;
}

export function heroPreloadSrc(slide: HomepageItem) {
  const src = homepageHeroFullSrc(slide);
  if (homepageHeroIsWebOptimized(slide)) return src;
  return heroOptimizedSrc(src);
}

export const heroImageSizes = '100vw';
