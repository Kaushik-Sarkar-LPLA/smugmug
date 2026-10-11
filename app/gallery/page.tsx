import Link from 'next/link';
import { SiteShell, PageHero } from '@/components/SiteShell';
import { BrowseGrid, type BrowseGridItem } from '@/components/gallery/BrowseGrid';
import { getPublicBrowse } from '@/lib/admin/library-store';
import { buildMetadata } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export const metadata = buildMetadata({
  title: 'Photo Gallery',
  description: 'Browse Pixilens Photography folders and galleries — Austin, Dallas, and Houston event and portrait work.',
  path: '/gallery',
});

const PAGE_SIZE = 36;

export default async function GalleryIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; tab?: string; q?: string }>;
}) {
  const params = await searchParams;
  const rawPage = params.page || '1';
  const tab = (params.tab || 'all').toLowerCase();
  const q = (params.q || '').trim();

  const { folders, galleries } = await getPublicBrowse('');

  const queryLower = q.toLowerCase();
  const filteredFolders = folders.filter((f) => {
    if (!queryLower) return true;
    return (
      f.title.toLowerCase().includes(queryLower) ||
      (f.description && f.description.toLowerCase().includes(queryLower)) ||
      f.slug.toLowerCase().includes(queryLower)
    );
  });

  const filteredGalleries = galleries.filter((g) => {
    if (!queryLower) return true;
    return (
      g.title.toLowerCase().includes(queryLower) ||
      (g.description && g.description.toLowerCase().includes(queryLower)) ||
      g.slug.toLowerCase().includes(queryLower)
    );
  });

  let items: BrowseGridItem[] = [];
  if (tab === 'folders') {
    items = filteredFolders.map((f) => ({ kind: 'folder', data: f }));
  } else if (tab === 'galleries') {
    items = filteredGalleries.map((g) => ({ kind: 'gallery', data: g }));
  } else {
    items = [
      ...filteredFolders.map((f) => ({ kind: 'folder' as const, data: f })),
      ...filteredGalleries.map((g) => ({ kind: 'gallery' as const, data: g })),
    ];
  }

  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.max(1, Math.min(totalPages, parseInt(rawPage, 10) || 1));
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const endIndex = Math.min(total, startIndex + PAGE_SIZE);
  const pagedItems = items.slice(startIndex, endIndex);

  function buildUrl(newPage: number, newTab = tab, newQ = q) {
    const sp = new URLSearchParams();
    if (newTab && newTab !== 'all') sp.set('tab', newTab);
    if (newPage > 1) sp.set('page', String(newPage));
    if (newQ) sp.set('q', newQ);
    const qs = sp.toString();
    return qs ? `/gallery?${qs}` : '/gallery';
  }

  return (
    <SiteShell>
      <PageHero eyebrow="Library" title="Gallery">
        <p>Browse folders and galleries from the Pixilens photo library.</p>
      </PageHero>

      <section className="mx-auto max-w-7xl px-5 pb-20 md:px-8">
        {/* Filter Toolbar */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={buildUrl(1, 'all')}
              className={tab === 'all' ? 'glass-tab glass-tab--active' : 'glass-tab'}
            >
              All ({filteredFolders.length + filteredGalleries.length})
            </Link>
            <Link
              href={buildUrl(1, 'folders')}
              className={tab === 'folders' ? 'glass-tab glass-tab--active' : 'glass-tab'}
            >
              Folders ({filteredFolders.length})
            </Link>
            <Link
              href={buildUrl(1, 'galleries')}
              className={tab === 'galleries' ? 'glass-tab glass-tab--active' : 'glass-tab'}
            >
              Galleries ({filteredGalleries.length})
            </Link>
          </div>

          {/* Search Form */}
          <form method="GET" action="/gallery" className="relative w-full sm:w-72">
            {tab !== 'all' ? <input type="hidden" name="tab" value={tab} /> : null}
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder="Search galleries..."
              className="glass-panel w-full rounded-full px-4 py-2 pr-9 text-xs text-[#17130f] placeholder:text-[#17130f]/40 focus:outline-none focus:ring-1 focus:ring-[#a87921]/50"
            />
            {q ? (
              <Link
                href={buildUrl(1, tab, '')}
                className="absolute inset-y-0 right-3 flex items-center text-xs text-[#17130f]/40 hover:text-[#17130f]"
                title="Clear search"
              >
                ✕
              </Link>
            ) : (
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-[#17130f]/40">
                🔍
              </span>
            )}
          </form>
        </div>

        {/* Results Grid */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <BrowseGrid items={pagedItems} />
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 ? (
          <nav className="glass-panel mt-12 flex flex-col items-center justify-between gap-4 rounded-2xl p-5 sm:flex-row">
            <span className="text-xs uppercase tracking-[0.16em] text-[#17130f]/60">
              Showing {startIndex + 1}–{endIndex} of {total} items
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {currentPage > 1 ? (
                <>
                  <Link href={buildUrl(1)} className="glass-page-btn">
                    First
                  </Link>
                  <Link href={buildUrl(currentPage - 1)} className="glass-page-btn">
                    Prev
                  </Link>
                </>
              ) : null}

              {/* Nearby Page numbers */}
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
                .map((p, idx, arr) => {
                  const prev = arr[idx - 1];
                  const showEllipsis = prev && p - prev > 1;
                  return (
                    <span key={p} className="flex items-center">
                      {showEllipsis ? <span className="px-1 text-xs text-[#17130f]/40">…</span> : null}
                      <Link
                        href={buildUrl(p)}
                        className={p === currentPage ? 'glass-page-btn glass-page-btn--active' : 'glass-page-btn'}
                      >
                        {p}
                      </Link>
                    </span>
                  );
                })}

              {currentPage < totalPages ? (
                <>
                  <Link href={buildUrl(currentPage + 1)} className="glass-page-btn">
                    Next
                  </Link>
                  <Link href={buildUrl(totalPages)} className="glass-page-btn">
                    Last
                  </Link>
                </>
              ) : null}
            </div>
          </nav>
        ) : null}
      </section>
    </SiteShell>
  );
}
