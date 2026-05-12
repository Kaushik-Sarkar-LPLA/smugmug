import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageHero, SiteShell } from '@/components/SiteShell';
import { getLibrary } from '@/lib/admin/library-store';

export const revalidate = 0;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const store = await getLibrary();
  const folder = store.folders.find((item) => item.slug === slug && item.visibility === 'public');
  return { title: `${folder?.title ?? 'Folder'} - Pixilens Photography` };
}

export default async function FolderPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const store = await getLibrary();
  const folder = store.folders.find((item) => item.slug === slug && item.visibility === 'public');
  if (!folder) notFound();
  const galleries = store.galleries
    .filter((gallery) => gallery.folderId === folder.id && gallery.visibility === 'public')
    .sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title));

  return (
    <SiteShell>
      <PageHero eyebrow="Folder" title={folder.title}>{folder.description ? <p>{folder.description}</p> : null}</PageHero>
      <section className="mx-auto grid max-w-7xl gap-5 px-5 pb-20 sm:grid-cols-2 lg:grid-cols-3 md:px-8">
        {galleries.map((gallery) => {
          const cover = store.media.find((item) => item.id === gallery.coverMediaId) || store.media.find((item) => item.galleryId === gallery.id && item.visibility === 'public');
          return (
            <Link key={gallery.id} href={`/galleries/${gallery.slug}`} className="glass-panel group overflow-hidden rounded-xl">
              <div className="relative aspect-[4/3] bg-white/5">
                {cover?.displayUrl ? <Image src={cover.displayUrl} alt={gallery.title} fill className="object-cover opacity-85 transition duration-700 group-hover:scale-105 group-hover:opacity-100" sizes="(min-width:1024px) 33vw, 50vw" /> : null}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/25 to-transparent" />
                <div className="absolute bottom-0 p-6">
                  <p className="text-xs uppercase tracking-[0.32em] text-white/50">Gallery</p>
                  <h2 className="font-art mt-2 text-2xl tracking-[0.08em] text-white">{gallery.title}</h2>
                </div>
              </div>
            </Link>
          );
        })}
      </section>
    </SiteShell>
  );
}
