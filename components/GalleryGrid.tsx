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

const BATCH_SIZE = 48;

function GridImageCard({
  image,
  index,
  onOpen,
  isPriority,
}: {
  image: GalleryImage;
  index: number;
  onOpen: (index: number) => void;
  isPriority: boolean;
}) {
  const [loaded, setLoaded] = useState(false);

  return (
    <button
      type="button"
      onClick={() => onOpen(index)}
      className={`media-card group relative aspect-[3/4] w-full text-left ${loaded ? '' : 'image-loading'}`}
    >
      <img
        src={image.url}
        alt={image.title}
        className={`absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105 ${
          loaded ? 'opacity-90 group-hover:opacity-100' : 'opacity-0'
        }`}
        loading={isPriority ? 'eager' : 'lazy'}
        fetchPriority={isPriority ? 'high' : 'auto'}
        decoding="async"
        onLoad={() => setLoaded(true)}
      />
      <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition duration-300 group-hover:bg-black/40">
        <span className="rounded-full border border-white/60 px-4 py-1.5 text-xs uppercase tracking-widest text-white opacity-0 transition duration-300 group-hover:opacity-100">
          View image
        </span>
      </div>
    </button>
  );
}

export default function GalleryGrid({ images }: { images: GalleryImage[] }) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visibleCount, setVisibleCount] = useState(() => Math.min(images.length, BATCH_SIZE));

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

  const visibleImages = images.slice(0, visibleCount);
  const hasMore = visibleCount < images.length;

  const loadMore = useCallback(() => {
    setVisibleCount((prev) => Math.min(images.length, prev + BATCH_SIZE));
  }, [images.length]);

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {visibleImages.map((image, index) => (
          <GridImageCard
            key={image.id}
            image={image}
            index={index}
            onOpen={openLightbox}
            isPriority={index < 10}
          />
        ))}
      </div>

      {hasMore ? (
        <div className="mt-12 flex flex-col items-center justify-center gap-3">
          <p className="text-xs uppercase tracking-[0.2em] text-[#17130f]/50">
            Showing {visibleCount} of {images.length} photos
          </p>
          <button
            type="button"
            onClick={loadMore}
            className="rounded-full border border-[#17130f]/15 bg-white/70 px-8 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#17130f] shadow-sm backdrop-blur-sm transition hover:bg-white hover:shadow-md"
          >
            Load More Photos ({images.length - visibleCount} remaining)
          </button>
        </div>
      ) : null}

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
