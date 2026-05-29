import Link from 'next/link';
import { AdminShell } from '@/components/AdminShell';
import { ImageWithLoader } from '@/components/ImageWithLoader';
import { getMediaPage, getGalleriesShallow } from '@/lib/admin/library-store';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Media Admin - Pixilens', robots: { index: false, follow: false } };

export default async function MediaPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string; page?: string; galleryId?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || '1', 10) || 1);
  const galleryId = params.galleryId || '';
  const pageSize = 50;

  const [galleries, { items: media, total }] = await Promise.all([
    getGalleriesShallow(),
    getMediaPage({ page, pageSize, galleryId: galleryId || undefined }),
  ]);

  const totalPages = Math.ceil(total / pageSize);

  const buildPageUrl = (p: number) => {
    const urlParams = new URLSearchParams();
    urlParams.set('page', String(p));
    if (galleryId) urlParams.set('galleryId', galleryId);
    return `?${urlParams.toString()}`;
  };

  return (
    <AdminShell title="Media">
      {params.saved ? <div className="glass-panel mb-6 rounded-2xl p-4 text-sm text-white/75">Media changes saved.</div> : null}
      {params.error ? <div className="glass-panel mb-6 rounded-2xl p-4 text-sm text-red-100">Upload failed: {params.error}</div> : null}

      <section className="grid gap-6 lg:grid-cols-[420px_1fr]">
        {/* Left Column: Upload Form */}
        <form action="/api/admin/media" method="post" encType="multipart/form-data" className="glass-panel h-fit rounded-3xl p-6">
          <h2 className="font-art gold-text text-2xl">Upload media</h2>
          <div className="mt-5 grid gap-4">
            <label className="admin-label">
              Gallery
              <select className="admin-input" name="galleryId" defaultValue={galleryId} required>
                <option value="">Select gallery</option>
                {galleries.map((g) => (
                  <option key={g.id} value={g.id}>{g.title}</option>
                ))}
              </select>
            </label>
            <label className="admin-label">File<input className="admin-input" name="file" type="file" accept="image/*,video/*" required /></label>
            <label className="admin-label">Title<input className="admin-input" name="title" /></label>
            <label className="admin-label">Slug<input className="admin-input" name="slug" /></label>
            <label className="admin-label">Caption<textarea className="admin-input min-h-24" name="caption" /></label>
            <div className="grid grid-cols-2 gap-4">
              <label className="admin-label">
                Visibility
                <select className="admin-input" name="visibility" defaultValue="public">
                  <option>public</option>
                  <option>private</option>
                  <option>draft</option>
                </select>
              </label>
              <label className="admin-label">
                Sort order
                <input className="admin-input" name="sortOrder" type="number" defaultValue={0} placeholder="0 = append" />
              </label>
            </div>
          </div>
          <button className="glass-button mt-6" type="submit">Upload</button>
        </form>

        {/* Right Column: Media List + Filters */}
        <div className="space-y-6">
          {/* Gallery Filter Bar */}
          <form method="get" className="glass-panel flex flex-col gap-3 rounded-3xl p-5 sm:flex-row sm:items-end">
            <label className="flex flex-1 flex-col gap-1.5">
              <span className="text-xs uppercase tracking-[0.18em] text-white/50">Filter by Gallery</span>
              <select name="galleryId" defaultValue={galleryId} className="admin-input">
                <option value="">All Galleries</option>
                {galleries.map((g) => (
                  <option key={g.id} value={g.id}>{g.title}</option>
                ))}
              </select>
            </label>
            <input type="hidden" name="page" value="1" />
            <button className="glass-button self-end sm:mb-0.5" type="submit">Filter</button>
          </form>

          {/* Media Items */}
          {media.length > 0 ? (
            <div className="grid gap-4">
              {media.map((item) => {
                const gallery = galleries.find((entry) => entry.id === item.galleryId);
                return (
                  <article key={item.id} className="glass-panel grid gap-5 rounded-3xl p-4 md:grid-cols-[180px_1fr]">
                    <div className="overflow-hidden rounded-2xl bg-black/40">
                      {item.type === 'photo' ? (
                        <ImageWithLoader src={item.displayUrl} alt={item.title} width={180} height={130} className="h-36 w-full object-cover" />
                      ) : (
                        <video src={item.publicUrl} className="h-36 w-full object-cover" controls />
                      )}
                    </div>
                    <div className="flex flex-col justify-between">
                      <div>
                        <p className="font-art text-xl text-white">{item.title}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.18em] text-white/45">
                          {item.type} · {item.provider} · {gallery?.title || 'No gallery'}
                        </p>
                        <p className="mt-2 text-xs text-white/30 font-mono">ID: {item.id}</p>
                        <p className="mt-3 text-sm text-white/55">{item.fileName}</p>
                      </div>
                      <div className="mt-5 flex flex-wrap gap-3">
                        <a className="glass-button" href={item.publicUrl} download>Download</a>
                        <form action="/api/admin/media" method="post">
                          <input type="hidden" name="action" value="delete" />
                          <input type="hidden" name="id" value={item.id} />
                          {galleryId && <input type="hidden" name="galleryId" value={galleryId} />}
                          <input type="hidden" name="page" value={page} />
                          <button className="glass-button" type="submit">Delete</button>
                        </form>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="glass-panel rounded-3xl p-10 text-center text-white/50">
              No media found.
            </div>
          )}

          {/* Pagination Navigation */}
          {totalPages > 1 ? (
            <nav className="glass-panel flex flex-col items-center justify-between gap-4 rounded-3xl p-5 sm:flex-row">
              <span className="text-sm text-white/60">
                Showing {Math.min(total, (page - 1) * pageSize + 1)} - {Math.min(total, page * pageSize)} of {total} items
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {page > 1 ? (
                  <>
                    <Link href={buildPageUrl(1)} className="glass-button px-3 py-1.5 text-xs">First</Link>
                    <Link href={buildPageUrl(page - 1)} className="glass-button px-3 py-1.5 text-xs">Prev</Link>
                  </>
                ) : (
                  <>
                    <span className="glass-button opacity-30 cursor-not-allowed px-3 py-1.5 text-xs">First</span>
                    <span className="glass-button opacity-30 cursor-not-allowed px-3 py-1.5 text-xs">Prev</span>
                  </>
                )}

                <span className="mx-2 text-sm text-white/80 font-medium">
                  Page {page} of {totalPages}
                </span>

                {page < totalPages ? (
                  <>
                    <Link href={buildPageUrl(page + 1)} className="glass-button px-3 py-1.5 text-xs">Next</Link>
                    <Link href={buildPageUrl(totalPages)} className="glass-button px-3 py-1.5 text-xs">Last</Link>
                  </>
                ) : (
                  <>
                    <span className="glass-button opacity-30 cursor-not-allowed px-3 py-1.5 text-xs">Next</span>
                    <span className="glass-button opacity-30 cursor-not-allowed px-3 py-1.5 text-xs">Last</span>
                  </>
                )}
              </div>
            </nav>
          ) : null}
        </div>
      </section>
    </AdminShell>
  );
}
