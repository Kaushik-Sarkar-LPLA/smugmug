import type { HomepageItem } from '@/lib/admin/homepage-config';

/** Fast preview — loads immediately for progressive reveal. */
export function homepageThumbSrc(slide: HomepageItem) {
  return slide.displayUrl || slide.imageUrl;
}

/** Full source for hero at viewport resolution (via Next Image optimizer). */
export function homepageHeroFullSrc(slide: HomepageItem) {
  return slide.imageUrl || slide.displayUrl;
}

/** Grid columns are narrow; display URL matches on-screen pixel density. */
export function homepageGridSrc(slide: HomepageItem) {
  return slide.displayUrl || slide.imageUrl;
}
