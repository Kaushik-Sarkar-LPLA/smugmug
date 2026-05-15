import { AdminShell } from '@/components/AdminShell';
import { ImageWithLoader } from '@/components/ImageWithLoader';
import { getLibrary } from '@/lib/admin/library-store';

export const metadata = { title: 'Media Admin - Pixilens', robots: { index: false, follow: false } };

export default async function MediaPage({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  const params = await searchParams;
  const store = await getLibrary();
  const media = [...store.media].sort((a, b) => a.sortOrder - b.sortOrder || a.createdAt.localeCompare(b.createdAt));

  return (
    <AdminShell title="Media">
      {params.saved ? <div className="glass-panel mb-6 rounded-2xl p-4 text-sm text-white/75">Media changes saved.</div> : null}
      {params.error ? <div className="glass-panel mb-6 rounded-2xl p-4 text-sm text-red-100">Upload failed: {params.error}</div> : null}
      <section className="grid gap-6 lg:grid-cols-[420px_1fr]">
        <form action="/api/admin/media" method="post" encType="multipart/form-data" className="glass-panel rounded-3xl p-6">
          <h2 className="font-art gold-text text-2xl">Upload media</h2>
          <div className="mt-5 grid gap-4">
            <label className="admin-label">Gallery<select className="admin-input" name="galleryId" required><option value="">Select gallery</option>{store.galleries.map((gallery) => <option key={gallery.id} value={gallery.id}>{gallery.title}</option>)}</select></label>
            <label className="admin-label">File<input className="admin-input" name="file" type="file" accept="image/*,video/*" required /></label>
            <label className="admin-label">Title<input className="admin-input" name="title" /></label>
            <label className="admin-label">Slug<input className="admin-input" name="slug" /></label>
            <label className="admin-label">Caption<textarea className="admin-input min-h-24" name="caption" /></label>
            <div className="grid grid-cols-2 gap-4">
              <label className="admin-label">Visibility<select className="admin-input" name="visibility" defaultValue="public"><option>public</option><option>private</option><option>draft</option></select></label>
              <label className="admin-label">Sort order<input className="admin-input" name="sortOrder" type="number" defaultValue={media.length + 1} /></label>
            </div>
          </div>
          <button className="glass-button mt-6" type="submit">Upload</button>
        </form>
        <div className="grid gap-4">
          {media.map((item) => {
            const gallery = store.galleries.find((entry) => entry.id === item.galleryId);
            return (
              <article key={item.id} className="glass-panel grid gap-5 rounded-3xl p-4 md:grid-cols-[180px_1fr]">
                <div className="overflow-hidden rounded-2xl bg-black/40">
                  {item.type === 'photo' ? <ImageWithLoader src={item.displayUrl} alt={item.title} width={180} height={130} className="h-36 w-full object-cover" /> : <video src={item.publicUrl} className="h-36 w-full object-cover" controls />}
                </div>
                <div>
                  <p className="font-art text-xl text-white">{item.title}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.18em] text-white/45">{item.type} · {item.provider} · {gallery?.title || 'No gallery'}</p>
                  <p className="mt-3 text-sm text-white/55">{item.fileName}</p>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <a className="glass-button" href={item.publicUrl} download>Download</a>
                    <form action="/api/admin/media" method="post">
                      <input type="hidden" name="action" value="delete" />
                      <input type="hidden" name="id" value={item.id} />
                      <button className="glass-button" type="submit">Delete</button>
                    </form>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </AdminShell>
  );
}
