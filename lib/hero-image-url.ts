import { getImageProps } from 'next/image';

export const HERO_IMAGE_QUALITY = 92;
export const HERO_IMAGE_WIDTH = 3840;

/** Same optimized URL Next.js `<Image sizes="100vw" quality={92}>` uses for hero slides. */
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

export const heroImageSizes = '100vw';
