'use client';

import Image, { type ImageProps } from 'next/image';
import { useRef, useState } from 'react';

export function ImageWithLoader(props: ImageProps) {
  const [loaded, setLoaded] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  const isFill = props.fill === true;

  return (
    <span
      ref={ref}
      className={`image-loading ${isFill ? 'absolute inset-0 block' : 'relative block'} ${loaded ? 'image-loaded' : ''}`}
    >
      <Image
        {...props}
        onLoadingComplete={() => setLoaded(true)}
      />
    </span>
  );
}
