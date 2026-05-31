import { notFound, permanentRedirect } from 'next/navigation';
import { resolveLegacySmugmugPath } from '@/lib/smugmug-redirect';

export const dynamic = 'force-dynamic';

type PageProps = { params: Promise<{ smugmugPath: string[] }> };

/** 301 redirect old SmugMug gallery/folder/photo URLs to the new site routes. */
export default async function LegacySmugmugRedirectPage({ params }: PageProps) {
  const { smugmugPath } = await params;
  const legacyPath = `/${smugmugPath.join('/')}`;
  const destination = await resolveLegacySmugmugPath(legacyPath);
  if (!destination) notFound();
  permanentRedirect(destination);
}
