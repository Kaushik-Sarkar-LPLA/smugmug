import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageHero, SiteShell } from '@/components/SiteShell';
import { BrowseGrid } from '@/components/gallery/BrowseGrid';
import { getPublicBrowse, getPublicFolderBySlug } from '@/lib/admin/library-store';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const folder = await getPublicFolderBySlug(slug);
  return { title: `${folder?.title ?? 'Folder'} - Pixilens Photography` };
}

export default async function FolderPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const folder = await getPublicFolderBySlug(slug);
  if (!folder) notFound();

  const { folders, galleries } = await getPublicBrowse(folder.id);

  return (
    <SiteShell>
      <PageHero eyebrow="Folder" title={folder.title}>
        {folder.description ? <p>{folder.description}</p> : null}
        <p className="mt-4">
          <Link href="/gallery" className="text-[#17130f]/55 underline-offset-4 hover:text-[#17130f] hover:underline">
            ← All galleries
          </Link>
        </p>
      </PageHero>
      <section className="mx-auto grid max-w-7xl gap-5 px-5 pb-20 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 md:px-8">
        <BrowseGrid folders={folders} galleries={galleries} />
      </section>
    </SiteShell>
  );
}
