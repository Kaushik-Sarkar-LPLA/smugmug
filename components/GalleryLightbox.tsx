'use client';

import { useCallback, useEffect, useState } from 'react';
import type { GalleryImage } from '@/components/GalleryGrid';

export default function GalleryLightbox({
  images,
  currentIndex,
  onClose,
  onPrev,
  onNext,
}: {
  images: GalleryImage[];
  currentIndex: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const image = images[currentIndex];
  const fullUrl = image.fullUrl || image.url;
  const [loaded, setLoaded] = useState(false);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowLeft') onPrev();
      if (event.key === 'ArrowRight') onNext();
    },
    [onClose, onPrev, onNext],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    setLoaded(false);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [handleKeyDown, currentIndex]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/92 backdrop-blur-sm"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-5 top-5 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white/80 transition hover:bg-white/20 hover:text-white"
        aria-label="Close"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 4l12 12M16 4L4 16" />
        </svg>
      </button>

      <a
        href={fullUrl}
        download
        target="_blank"
        rel="noreferrer"
        onClick={(event) => event.stopPropagation()}
        className="absolute right-5 top-20 z-10 rounded-full border border-white/35 bg-white/10 px-4 py-2 text-xs uppercase tracking-[0.24em] text-white/85 transition hover:bg-white/20 hover:text-white"
      >
        Download
      </a>

      {images.length > 1 ? (
        <>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onPrev();
            }}
            className="absolute left-4 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white/70 transition hover:bg-white/20 hover:text-white"
            aria-label="Previous"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onNext();
            }}
            className="absolute right-4 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white/70 transition hover:bg-white/20 hover:text-white"
            aria-label="Next"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </>
      ) : null}

      <div className="flex h-full w-full items-center justify-center p-4" onClick={(event) => event.stopPropagation()}>
        <div className={`relative flex max-h-full max-w-full flex-col items-center ${loaded ? '' : 'image-loading'}`}>
          <img
            src={fullUrl}
            alt={image.title}
            className="max-h-[88vh] max-w-full rounded-lg object-contain shadow-2xl"
            onLoad={() => setLoaded(true)}
          />
          {image.title ? <p className="mt-3 text-sm text-white/50">{image.title}</p> : null}
        </div>
      </div>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-4 py-2 text-xs text-white/60">
        {currentIndex + 1} / {images.length}
      </div>
    </div>
  );
}
