import { notFound } from 'next/navigation';
import Link from 'next/link';
import { PageHero, SiteShell } from '@/components/SiteShell';
import { ImageWithLoader } from '@/components/ImageWithLoader';
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
      <section className="px-2 pb-20 md:px-4">
        <div className="columns-1 gap-3 sm:columns-2 lg:columns-4 xl:columns-5">
          {media.map((item) => (
            <figure key={item.id} className="mb-3 break-inside-avoid overflow-hidden rounded-lg bg-white/5">
              {item.type === 'photo' ? (
                <ImageWithLoader src={item.displayUrl} alt={item.title} width={item.width || 1200} height={item.height || 800} className="h-auto w-full object-cover" loading="lazy" />
              ) : (
                <video src={item.publicUrl} className="h-auto w-full" controls />
              )}
              {item.caption ? <figcaption className="p-3 text-sm text-[#17130f]/55">{item.caption}</figcaption> : null}
            </figure>
          ))}
        </div>
      </section>
    </SiteShell>
  );
}
