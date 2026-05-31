'use client';

import { useState } from 'react';

function FolderIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-14 w-14 text-white/75" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M3 7a2 2 0 0 1 2-2h5l2 2h9a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" strokeLinejoin="round" />
      <path d="M3 9h18" strokeLinecap="round" />
    </svg>
  );
}

function GalleryIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-14 w-14 text-white/75" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
      <circle cx="9" cy="10" r="1.5" fill="currentColor" stroke="none" />
      <path d="M20 16.5 14.5 11 9.5 15.5 7 13" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function BrowseCoverPlaceholder({ kind }: { kind: 'folder' | 'gallery' }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-[linear-gradient(135deg,rgba(255,255,255,0.72),rgba(214,181,109,0.28))]">
      <div className="flex h-24 w-24 items-center justify-center rounded-full border border-white/25 bg-black/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] backdrop-blur-sm">
        {kind === 'folder' ? <FolderIcon /> : <GalleryIcon />}
      </div>
    </div>
  );
}

export function BrowseCover({
  url,
  alt,
  kind,
}: {
  url: string;
  alt: string;
  kind: 'folder' | 'gallery';
}) {
  const [failed, setFailed] = useState(false);

  if (!url || failed) {
    return <BrowseCoverPlaceholder kind={kind} />;
  }

  return (
    <img
      src={url}
      alt={alt}
      className="absolute inset-0 h-full w-full object-cover opacity-90 transition duration-700 group-hover:scale-105 group-hover:opacity-100"
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}
