import { notFound } from 'next/navigation';
import { PageHero, SiteShell } from '@/components/SiteShell';
import { ImageWithLoader } from '@/components/ImageWithLoader';
import { getLibrary } from '@/lib/admin/library-store';

export const revalidate = 0;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const store = await getLibrary();
  const gallery = store.galleries.find((item) => item.slug === slug && item.visibility === 'public');
  return { title: `${gallery?.title ?? 'Gallery'} - Pixilens Photography` };
}

export default async function GalleryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const store = await getLibrary();
  const gallery = store.galleries.find((item) => item.slug === slug && item.visibility === 'public');
  if (!gallery) notFound();
  const media = store.media
    .filter((item) => item.galleryId === gallery.id && item.visibility === 'public')
    .sort((a, b) => a.sortOrder - b.sortOrder || a.createdAt.localeCompare(b.createdAt));

  return (
    <SiteShell>
      <PageHero eyebrow="Gallery" title={gallery.title}>{gallery.description ? <p>{gallery.description}</p> : null}</PageHero>
      <section className="px-2 pb-20 md:px-4">
        <div className="columns-1 gap-3 sm:columns-2 lg:columns-4 xl:columns-5">
          {media.map((item) => (
            <figure key={item.id} className="mb-3 break-inside-avoid overflow-hidden rounded-lg bg-white/5">
              {item.type === 'photo' ? (
                <ImageWithLoader src={item.displayUrl} alt={item.title} width={item.width || 1200} height={item.height || 800} className="h-auto w-full object-cover" />
              ) : (
                <video src={item.publicUrl} className="h-auto w-full" controls />
              )}
              {item.caption ? <figcaption className="p-3 text-sm text-white/55">{item.caption}</figcaption> : null}
            </figure>
          ))}
        </div>
      </section>
    </SiteShell>
  );
}
