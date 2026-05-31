import { SiteShell, PageHero } from '@/components/SiteShell';
import { BrowseGrid } from '@/components/gallery/BrowseGrid';
import { getPublicBrowse } from '@/lib/admin/library-store';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Gallery - Pixilens Photography',
  description: 'Browse Pixilens photography folders and galleries.',
};

export default async function GalleryIndexPage() {
  const { folders, galleries } = await getPublicBrowse('');

  return (
    <SiteShell>
      <PageHero eyebrow="Library" title="Gallery">
        <p>Browse folders and galleries from the Pixilens photo library.</p>
      </PageHero>
      <section className="mx-auto grid max-w-7xl gap-5 px-5 pb-20 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 md:px-8">
        <BrowseGrid folders={folders} galleries={galleries} />
      </section>
    </SiteShell>
  );
}
