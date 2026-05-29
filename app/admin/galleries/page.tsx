import Link from 'next/link';
import { AdminShell } from '@/components/AdminShell';
import { getFoldersForAdmin, getGalleriesForAdmin, type GalleryRecord, type FolderRecord } from '@/lib/admin/library-store';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Galleries Admin - Pixilens', robots: { index: false, follow: false } };

export default async function GalleriesPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; page?: string; edit?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || '1', 10) || 1);
  const pageSize = 50;

  const [folders, galleryRows] = await Promise.all([getFoldersForAdmin(), getGalleriesForAdmin()]);
  const galleries = [...galleryRows].sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title));
  const folderById = new Map(folders.map((folder) => [folder.id, folder]));
  const total = galleries.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageGalleries = galleries.slice((safePage - 1) * pageSize, safePage * pageSize);
  const editing = params.edit ? galleries.find((gallery) => gallery.id === params.edit) : null;

  const buildPageUrl = (nextPage: number) => {
    const urlParams = new URLSearchParams();
    urlParams.set('page', String(nextPage));
    if (params.edit) urlParams.set('edit', params.edit);
    return `?${urlParams.toString()}`;
  };

  return (
    <AdminShell title="Galleries">
      {params.saved ? (
        <div className="glass-panel mb-6 rounded-2xl p-4 text-sm text-[#17130f]/75">Gallery changes saved.</div>
      ) : null}

      <p className="mb-6 text-sm text-[#17130f]/60">
        {total} {total === 1 ? 'gallery' : 'galleries'}
        {total > pageSize ? ` · page ${safePage} of ${totalPages}` : ''}
      </p>

      <section className="grid gap-6 lg:grid-cols-[420px_1fr]">
        <div className="space-y-4">
          <form action="/api/admin/galleries" method="post" className="glass-panel rounded-3xl p-6">
            <h2 className="font-art gold-text text-2xl">{editing ? 'Edit gallery' : 'Create gallery'}</h2>
            {editing ? <input type="hidden" name="id" value={editing.id} /> : null}
            <GalleryFields folders={folders} gallery={editing} />
            <div className="mt-6 flex flex-wrap gap-3">
              <button className="glass-button" type="submit">{editing ? 'Save gallery' : 'Create gallery'}</button>
              {editing ? (
                <>
                  <button className="glass-button" name="action" value="delete" type="submit">Delete</button>
                  <Link href={`?page=${safePage}`} className="glass-button">Cancel</Link>
                </>
              ) : null}
            </div>
          </form>
        </div>

        <div className="space-y-4">
          {pageGalleries.length > 0 ? (
            <div className="glass-panel overflow-hidden rounded-3xl">
              <div className="grid grid-cols-[1.4fr_1fr_0.7fr_0.5fr] gap-3 border-b border-black/10 px-5 py-3 text-[11px] uppercase tracking-[0.18em] text-[#17130f]/45">
                <span>Title</span>
                <span>Folder</span>
                <span>Visibility</span>
                <span className="text-right">Edit</span>
              </div>
              {pageGalleries.map((gallery) => (
                <GalleryRow
                  key={gallery.id}
                  gallery={gallery}
                  folderTitle={folderById.get(gallery.folderId)?.title || 'None'}
                  editHref={`?page=${safePage}&edit=${encodeURIComponent(gallery.id)}`}
                  active={editing?.id === gallery.id}
                />
              ))}
            </div>
          ) : (
            <div className="glass-panel rounded-3xl p-10 text-center text-[#17130f]/50">No galleries found.</div>
          )}

          {totalPages > 1 ? (
            <nav className="glass-panel flex flex-col items-center justify-between gap-4 rounded-3xl p-5 sm:flex-row">
              <span className="text-sm text-[#17130f]/60">
                Showing {(safePage - 1) * pageSize + 1}–{Math.min(total, safePage * pageSize)} of {total}
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {safePage > 1 ? (
                  <>
                    <Link href={buildPageUrl(1)} className="glass-button px-3 py-1.5 text-xs">First</Link>
                    <Link href={buildPageUrl(safePage - 1)} className="glass-button px-3 py-1.5 text-xs">Prev</Link>
                  </>
                ) : null}
                <span className="mx-2 text-sm font-medium text-[#17130f]/80">Page {safePage} of {totalPages}</span>
                {safePage < totalPages ? (
                  <>
                    <Link href={buildPageUrl(safePage + 1)} className="glass-button px-3 py-1.5 text-xs">Next</Link>
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

function GalleryRow({
  gallery,
  folderTitle,
  editHref,
  active,
}: {
  gallery: GalleryRecord;
  folderTitle: string;
  editHref: string;
  active: boolean;
}) {
  return (
    <div
      className={`grid grid-cols-[1.4fr_1fr_0.7fr_0.5fr] gap-3 border-b border-black/5 px-5 py-4 last:border-b-0 ${active ? 'bg-[#a87921]/8' : ''}`}
    >
      <div>
        <p className="font-art text-lg text-[#17130f]">{gallery.title}</p>
        <p className="mt-1 text-xs text-[#17130f]/45">{gallery.slug || 'no-slug'}</p>
      </div>
      <p className="self-center text-sm text-[#17130f]/65">{folderTitle}</p>
      <p className="self-center text-xs uppercase tracking-[0.16em] text-[#17130f]/50">{gallery.visibility}</p>
      <div className="self-center text-right">
        <Link href={editHref} className="glass-button px-3 py-1.5 text-xs">Edit</Link>
      </div>
    </div>
  );
}

function GalleryFields({ folders, gallery }: { folders: FolderRecord[]; gallery?: GalleryRecord }) {
  return (
    <div className="mt-5 grid gap-4">
      <label className="admin-label">Title<input className="admin-input" name="title" defaultValue={gallery?.title} required /></label>
      <label className="admin-label">Slug<input className="admin-input" name="slug" defaultValue={gallery?.slug} /></label>
      <label className="admin-label">Description<textarea className="admin-input min-h-24" name="description" defaultValue={gallery?.description} /></label>
      <label className="admin-label">Folder<select className="admin-input" name="folderId" defaultValue={gallery?.folderId || ''}><option value="">None</option>{folders.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>
      <div className="flex flex-col gap-1.5">
        <label className="admin-label">Cover media ID</label>
        <input className="admin-input" name="coverMediaId" defaultValue={gallery?.coverMediaId || ''} placeholder="Auto (paste a media ID)" />
        <p className="text-[11px] text-[#17130f]/50">
          Leave blank for auto-selection. Copy a media ID from the Media list to set a custom cover.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <label className="admin-label">Visibility<select className="admin-input" name="visibility" defaultValue={gallery?.visibility || 'public'}><option>public</option><option>private</option><option>draft</option></select></label>
        <label className="admin-label">Sort order<input className="admin-input" name="sortOrder" type="number" defaultValue={gallery?.sortOrder || 0} /></label>
      </div>
    </div>
  );
}
