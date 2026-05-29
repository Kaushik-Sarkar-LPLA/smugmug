import Link from 'next/link';
import { AdminShell } from '@/components/AdminShell';
import { ImageWithLoader } from '@/components/ImageWithLoader';
import { getGalleryById, getMediaById, getMediaPage, getGalleriesShallow } from '@/lib/admin/library-store';

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

  const [galleries, { items: media, total }, activeGallery] = await Promise.all([
    getGalleriesShallow(),
    getMediaPage({ page, pageSize, galleryId: galleryId || undefined }),
    galleryId ? getGalleryById(galleryId) : Promise.resolve(null),
  ]);

  const coverMedia = activeGallery?.coverMediaId ? await getMediaById(activeGallery.coverMediaId) : null;
  const totalPages = Math.ceil(total / pageSize);
  const globalOffset = (page - 1) * pageSize;

  const buildPageUrl = (p: number) => {
    const urlParams = new URLSearchParams();
    urlParams.set('page', String(p));
    if (galleryId) urlParams.set('galleryId', galleryId);
    return `?${urlParams.toString()}`;
  };

  const savedMessage =
    params.saved === 'cover'
      ? 'Gallery cover updated.'
      : params.saved
        ? 'Media changes saved.'
        : null;

  return (
    <AdminShell title="Media">
      {savedMessage ? (
        <div className="glass-panel mb-6 rounded-2xl p-4 text-sm text-[#17130f]/75">{savedMessage}</div>
      ) : null}
      {params.error ? (
        <div className="glass-panel mb-6 rounded-2xl p-4 text-sm text-red-700">Upload failed: {params.error}</div>
      ) : null}

      <section className="grid gap-6 lg:grid-cols-[360px_1fr]">
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

        <div className="space-y-6">
          <form method="get" className="glass-panel flex flex-col gap-3 rounded-3xl p-5 sm:flex-row sm:items-end">
            <label className="flex flex-1 flex-col gap-1.5">
              <span className="text-xs uppercase tracking-[0.18em] text-[#17130f]/50">Filter by Gallery</span>
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

          {activeGallery ? (
            <div className="glass-panel grid gap-4 rounded-3xl p-5 md:grid-cols-[120px_1fr]">
              <div className="mx-auto w-full max-w-[120px] overflow-hidden rounded-2xl bg-black/5">
                {coverMedia?.displayUrl ? (
                  <PortraitThumb src={coverMedia.displayUrl} alt={coverMedia.title} />
                ) : (
                  <div className="flex aspect-[3/4] items-center justify-center text-xs text-[#17130f]/40">No cover</div>
                )}
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-[#17130f]/45">Managing gallery</p>
                <h2 className="font-art mt-1 text-2xl text-[#17130f]">{activeGallery.title}</h2>
                <p className="mt-2 text-sm text-[#17130f]/60">
                  {total} items · use arrows to reorder · click Set cover to choose the gallery thumbnail
                </p>
                <Link href={`/admin/galleries?edit=${encodeURIComponent(activeGallery.id)}`} className="glass-button mt-4 inline-flex px-3 py-1.5 text-xs">
                  Edit gallery details
                </Link>
              </div>
            </div>
          ) : (
            <div className="glass-panel rounded-3xl p-5 text-sm text-[#17130f]/60">
              Select a gallery to reorder images and set a cover photo.
            </div>
          )}

          {media.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {media.map((item, index) => {
                const position = globalOffset + index + 1;
                const isCover = activeGallery?.coverMediaId === item.id;
                const gallery = galleries.find((entry) => entry.id === item.galleryId);
                return (
                  <article
                    key={item.id}
                    className={`glass-panel overflow-hidden rounded-3xl ${isCover ? 'ring-2 ring-[#a87921]/70' : ''}`}
                  >
                    <div className="relative bg-black/5">
                      {isCover ? (
                        <span className="absolute left-3 top-3 z-10 rounded-full bg-[#a87921] px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] text-white">
                          Cover
                        </span>
                      ) : null}
                      {item.type === 'photo' ? (
                        <PortraitThumb src={item.displayUrl} alt={item.title} />
                      ) : (
                        <video src={item.publicUrl} className="aspect-[3/4] w-full object-cover" controls />
                      )}
                    </div>
                    <div className="space-y-3 p-4">
                      <div>
                        <p className="font-art text-lg text-[#17130f]">{item.title}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.16em] text-[#17130f]/45">
                          #{position} · {item.type} · {gallery?.title || 'No gallery'}
                        </p>
                        <p className="mt-2 truncate text-xs text-[#17130f]/45">{item.fileName}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {galleryId && item.galleryId === galleryId ? (
                          <>
                            <form action="/api/admin/media" method="post">
                              <input type="hidden" name="action" value="set-cover" />
                              <input type="hidden" name="id" value={item.id} />
                              <input type="hidden" name="galleryId" value={galleryId} />
                              <input type="hidden" name="page" value={page} />
                              <button className="glass-button px-3 py-1.5 text-xs" type="submit" disabled={isCover}>
                                {isCover ? 'Cover set' : 'Set cover'}
                              </button>
                            </form>
                            <form action="/api/admin/media" method="post">
                              <input type="hidden" name="action" value="move-up" />
                              <input type="hidden" name="id" value={item.id} />
                              <input type="hidden" name="galleryId" value={galleryId} />
                              <input type="hidden" name="page" value={page} />
                              <button className="glass-button px-3 py-1.5 text-xs" type="submit" disabled={position === 1}>
                                ↑
                              </button>
                            </form>
                            <form action="/api/admin/media" method="post">
                              <input type="hidden" name="action" value="move-down" />
                              <input type="hidden" name="id" value={item.id} />
                              <input type="hidden" name="galleryId" value={galleryId} />
                              <input type="hidden" name="page" value={page} />
                              <button className="glass-button px-3 py-1.5 text-xs" type="submit" disabled={position === total}>
                                ↓
                              </button>
                            </form>
                          </>
                        ) : null}
                        <a className="glass-button px-3 py-1.5 text-xs" href={item.publicUrl} download>
                          Download
                        </a>
                        <form action="/api/admin/media" method="post">
                          <input type="hidden" name="action" value="delete" />
                          <input type="hidden" name="id" value={item.id} />
                          {galleryId && <input type="hidden" name="galleryId" value={galleryId} />}
                          <input type="hidden" name="page" value={page} />
                          <button className="glass-button px-3 py-1.5 text-xs" type="submit">Delete</button>
                        </form>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="glass-panel rounded-3xl p-10 text-center text-[#17130f]/50">No media found.</div>
          )}

          {totalPages > 1 ? (
            <nav className="glass-panel flex flex-col items-center justify-between gap-4 rounded-3xl p-5 sm:flex-row">
              <span className="text-sm text-[#17130f]/60">
                Showing {Math.min(total, globalOffset + 1)}–{Math.min(total, globalOffset + media.length)} of {total}
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {page > 1 ? (
                  <>
                    <Link href={buildPageUrl(1)} className="glass-button px-3 py-1.5 text-xs">First</Link>
                    <Link href={buildPageUrl(page - 1)} className="glass-button px-3 py-1.5 text-xs">Prev</Link>
                  </>
                ) : null}
                <span className="mx-2 text-sm font-medium text-[#17130f]/80">Page {page} of {totalPages}</span>
                {page < totalPages ? (
                  <>
                    <Link href={buildPageUrl(page + 1)} className="glass-button px-3 py-1.5 text-xs">Next</Link>
                    <Link href={buildPageUrl(totalPages)} className="glass-button px-3 py-1.5 text-xs">Last</Link>
                  </>
                ) : null}
              </div>
            </nav>
          ) : null}
        </div>
      </section>
    </AdminShell>
  );
}

function PortraitThumb({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="aspect-[3/4] w-full overflow-hidden">
      <ImageWithLoader
        src={src}
        alt={alt}
        width={480}
        height={640}
        className="h-full w-full object-cover object-center"
      />
    </div>
  );
}
