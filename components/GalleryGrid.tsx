'use client';

import { useState, useCallback } from 'react';
import GalleryLightbox from '@/components/GalleryLightbox';

export type GalleryImage = {
  id: string;
  url: string;
  fullUrl?: string;
  title: string;
  width?: number;
  height?: number;
};

export default function GalleryGrid({ images }: { images: GalleryImage[] }) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loadedMap, setLoadedMap] = useState<Set<string>>(() => new Set());

  const openLightbox = useCallback((index: number) => {
    setCurrentIndex(index);
    setLightboxOpen(true);
  }, []);

  const closeLightbox = useCallback(() => setLightboxOpen(false), []);
  const prevImage = useCallback(
    () => setCurrentIndex((index) => (index === 0 ? images.length - 1 : index - 1)),
    [images.length],
  );
  const nextImage = useCallback(
    () => setCurrentIndex((index) => (index === images.length - 1 ? 0 : index + 1)),
    [images.length],
  );

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {images.map((image, index) => (
          <button
            key={image.id}
            type="button"
            onClick={() => openLightbox(index)}
            className={`media-card group relative aspect-[3/4] w-full text-left ${loadedMap.has(image.id) ? '' : 'image-loading'}`}
          >
            <img
              src={image.url}
              alt={image.title}
              className="absolute inset-0 h-full w-full object-cover opacity-90 transition duration-500 group-hover:scale-105 group-hover:opacity-100"
              loading="lazy"
              onLoad={() => setLoadedMap((prev) => new Set(prev).add(image.id))}
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition duration-300 group-hover:bg-black/40">
              <span className="rounded-full border border-white/60 px-4 py-1.5 text-xs uppercase tracking-widest text-white opacity-0 transition duration-300 group-hover:opacity-100">
                View image
              </span>
            </div>
          </button>
        ))}
      </div>

      {lightboxOpen ? (
        <GalleryLightbox
          images={images}
          currentIndex={currentIndex}
          onClose={closeLightbox}
          onPrev={prevImage}
          onNext={nextImage}
        />
      ) : null}
    </>
  );
}
