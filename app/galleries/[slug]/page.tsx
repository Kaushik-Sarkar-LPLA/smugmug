import { notFound } from 'next/navigation';
import Link from 'next/link';
import { PageHero, SiteShell } from '@/components/SiteShell';
import GalleryGrid from '@/components/GalleryGrid';
import { mediaImageUrl, mediaThumbUrl } from '@/lib/media-url';
import { getPublicGalleryBySlug, getPublicMediaForGallery } from '@/lib/admin/library-store';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const gallery = await getPublicGalleryBySlug(slug);
  return { title: `${gallery?.title ?? 'Gallery'} - Pixilens Photography` };
}

export default async function GalleryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const gallery = await getPublicGalleryBySlug(slug);
  if (!gallery) notFound();

  const media = await getPublicMediaForGallery(gallery.id);
  const photos = media.filter((item) => item.type === 'photo' && mediaThumbUrl(item));
  const videos = media.filter((item) => item.type === 'video' && item.publicUrl);

  const gridImages = photos.map((item) => ({
    id: item.id,
    url: mediaThumbUrl(item),
    fullUrl: mediaImageUrl(item),
    title: item.title || item.caption || gallery.title,
    width: item.width,
    height: item.height,
  }));

  return (
    <SiteShell>
      <PageHero eyebrow="Gallery" title={gallery.title}>
        {gallery.description ? <p>{gallery.description}</p> : null}
        <p className="mt-4">
          <Link href="/gallery" className="text-[#17130f]/55 underline-offset-4 hover:text-[#17130f] hover:underline">
            ← All galleries
          </Link>
        </p>
      </PageHero>
      <section className="mx-auto max-w-7xl px-5 pb-20 md:px-8">
        {gridImages.length ? (
          <GalleryGrid images={gridImages} />
        ) : (
          <div className="glass-panel mx-auto max-w-3xl rounded-xl p-8 text-center text-[#17130f]/65">
            No images are available in this gallery yet.
          </div>
        )}

        {videos.length ? (
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {videos.map((item) => (
              <figure key={item.id} className="overflow-hidden rounded-lg bg-white/60 shadow-[0_8px_30px_rgba(71,52,24,0.10)]">
                <video src={item.publicUrl} className="h-auto w-full" controls preload="metadata" />
                {item.title || item.caption ? (
                  <figcaption className="p-3 text-sm text-[#17130f]/55">{item.title || item.caption}</figcaption>
                ) : null}
              </figure>
            ))}
          </div>
        ) : null}
      </section>
    </SiteShell>
  );
}
