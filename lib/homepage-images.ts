import type { HomepageItem } from '@/lib/admin/homepage-config';

/** Fast preview — loads immediately for progressive reveal. */
export function homepageThumbSrc(slide: HomepageItem) {
  return slide.displayUrl || slide.imageUrl;
}

/** Hero slideshow source — pre-compressed web version when available. */
export function homepageHeroFullSrc(slide: HomepageItem) {
  return slide.heroUrl || slide.imageUrl || slide.displayUrl;
}

export function homepageHeroIsWebOptimized(slide: HomepageItem) {
  return Boolean(slide.heroUrl);
}

/** Grid columns are narrow; display URL matches on-screen pixel density. */
export function homepageGridSrc(slide: HomepageItem) {
  return slide.displayUrl || slide.imageUrl;
}
