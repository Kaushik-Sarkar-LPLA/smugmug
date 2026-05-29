import { AdminShell } from '@/components/AdminShell';
import { getLibrary } from '@/lib/admin/library-store';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Galleries Admin - Pixilens', robots: { index: false, follow: false } };

export default async function GalleriesPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const params = await searchParams;
  const store = await getLibrary();
  const galleries = [...store.galleries].sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title));

  return (
    <AdminShell title="Galleries">
      {params.saved ? <div className="glass-panel mb-6 rounded-2xl p-4 text-sm text-white/75">Gallery changes saved.</div> : null}
      <section className="grid gap-6 lg:grid-cols-[420px_1fr]">
        <form action="/api/admin/galleries" method="post" className="glass-panel rounded-3xl p-6">
          <h2 className="font-art gold-text text-2xl">Create gallery</h2>
          <GalleryFields folders={store.folders} media={[]} />
          <button className="glass-button mt-6" type="submit">Create gallery</button>
        </form>
        <div className="space-y-4">
          {galleries.map((gallery) => (
            <details key={gallery.id} className="glass-panel rounded-3xl p-5">
              <summary className="cursor-pointer font-art text-xl text-white">{gallery.title}</summary>
              <form action="/api/admin/galleries" method="post" className="mt-5 grid gap-4">
                <input type="hidden" name="id" value={gallery.id} />
                <GalleryFields folders={store.folders} media={store.media.filter((item) => item.galleryId === gallery.id)} gallery={gallery} />
                <div className="flex flex-wrap gap-3">
                  <button className="glass-button" type="submit">Save</button>
                  <button className="glass-button" name="action" value="delete" type="submit">Delete</button>
                </div>
              </form>
            </details>
          ))}
        </div>
      </section>
    </AdminShell>
  );
}

function GalleryFields({ folders, media, gallery }: { folders: Awaited<ReturnType<typeof getLibrary>>['folders']; media: { id: string; title: string; fileName: string }[]; gallery?: Awaited<ReturnType<typeof getLibrary>>['galleries'][number] }) {
  return (
    <div className="mt-5 grid gap-4">
      <label className="admin-label">Title<input className="admin-input" name="title" defaultValue={gallery?.title} required /></label>
      <label className="admin-label">Slug<input className="admin-input" name="slug" defaultValue={gallery?.slug} /></label>
      <label className="admin-label">Description<textarea className="admin-input min-h-24" name="description" defaultValue={gallery?.description} /></label>
      <label className="admin-label">Folder<select className="admin-input" name="folderId" defaultValue={gallery?.folderId || ''}><option value="">None</option>{folders.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>
      <div className="flex flex-col gap-1.5">
        <label className="admin-label">Cover media ID</label>
        <input className="admin-input" name="coverMediaId" defaultValue={gallery?.coverMediaId || ''} placeholder="Auto (Paste a media ID)" />
        {media.length > 0 ? (
          <p className="text-[11px] text-white/50 max-h-24 overflow-y-auto">
            Available in gallery: {media.map((item) => `${item.title || item.fileName} (${item.id})`).join(', ')}
          </p>
        ) : (
          <p className="text-[11px] text-white/50">
            Leave blank for auto-selection. Copy a media ID from the Media list to set a custom cover.
          </p>
        )}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <label className="admin-label">Visibility<select className="admin-input" name="visibility" defaultValue={gallery?.visibility || 'public'}><option>public</option><option>private</option><option>draft</option></select></label>
        <label className="admin-label">Sort order<input className="admin-input" name="sortOrder" type="number" defaultValue={gallery?.sortOrder || 0} /></label>
      </div>
    </div>
  );
}
