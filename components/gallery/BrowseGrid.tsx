import Link from 'next/link';
import type { PublicBrowseFolder, PublicBrowseGallery } from '@/lib/admin/library-store';

export function BrowseGrid({
  folders,
  galleries,
}: {
  folders: PublicBrowseFolder[];
  galleries: PublicBrowseGallery[];
}) {
  if (!folders.length && !galleries.length) {
    return (
      <div className="glass-panel col-span-full mx-auto max-w-3xl rounded-xl p-8 text-center text-[#17130f]/65">
        No public folders or galleries here yet.
      </div>
    );
  }

  return (
    <>
      {folders.map((folder) => (
        <Link key={folder.id} href={`/folders/${folder.slug}`} className="glass-panel group overflow-hidden rounded-xl">
          <div className="relative aspect-[4/3] overflow-hidden bg-[linear-gradient(135deg,rgba(255,255,255,0.72),rgba(214,181,109,0.18))]">
            {folder.coverUrl ? (
              <img
                src={folder.coverUrl}
                alt={folder.title}
                className="absolute inset-0 h-full w-full object-cover opacity-90 transition duration-700 group-hover:scale-105 group-hover:opacity-100"
                loading="lazy"
              />
            ) : null}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-6">
              <p className="text-xs uppercase tracking-[0.32em] text-white/55">Folder</p>
              <h2 className="font-art mt-2 break-words text-2xl leading-tight tracking-[0.08em] text-white">{folder.title}</h2>
              <p className="mt-2 text-[11px] uppercase tracking-[0.22em] text-white/50">
                {folder.childFolderCount} folders · {folder.galleryCount} galleries
              </p>
            </div>
          </div>
        </Link>
      ))}

      {galleries.map((gallery) => (
        <Link key={gallery.id} href={`/galleries/${gallery.slug}`} className="glass-panel group overflow-hidden rounded-xl">
          <div className="relative aspect-[3/4] overflow-hidden bg-white/60">
            {gallery.coverUrl ? (
              <img
                src={gallery.coverUrl}
                alt={gallery.title}
                className="absolute inset-0 h-full w-full object-cover opacity-90 transition duration-700 group-hover:scale-105 group-hover:opacity-100"
                loading="lazy"
              />
            ) : null}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/25 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-6">
              <p className="text-[10px] uppercase tracking-[0.28em] text-white/58">{gallery.mediaCount} items</p>
              <h2 className="font-art mt-2 break-words text-xl leading-tight tracking-[0.08em] text-white">{gallery.title}</h2>
            </div>
          </div>
        </Link>
      ))}
    </>
  );
}
