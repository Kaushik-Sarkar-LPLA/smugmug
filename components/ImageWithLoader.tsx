'use client';

import Image, { type ImageProps } from 'next/image';
import { useRef, useState } from 'react';

export function ImageWithLoader(props: ImageProps) {
  const [loaded, setLoaded] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  return (
    <span ref={ref} className={`image-loading relative block ${loaded ? 'image-loaded' : ''}`}>
      <Image
        {...props}
        onLoadingComplete={() => setLoaded(true)}
      />
    </span>
  );
}
