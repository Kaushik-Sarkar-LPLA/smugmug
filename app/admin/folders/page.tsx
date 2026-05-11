import { AdminShell } from '@/components/AdminShell';
import { getLibrary } from '@/lib/admin/library-store';

export const metadata = { title: 'Folders Admin - Pixilens', robots: { index: false, follow: false } };

export default async function FoldersPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const params = await searchParams;
  const store = await getLibrary();
  const folders = [...store.folders].sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title));

  return (
    <AdminShell title="Folders">
      {params.saved ? <div className="glass-panel mb-6 rounded-2xl p-4 text-sm text-white/75">Folder changes saved.</div> : null}
      <section className="grid gap-6 lg:grid-cols-[420px_1fr]">
        <form action="/api/admin/folders" method="post" className="glass-panel rounded-3xl p-6">
          <h2 className="font-art gold-text text-2xl">Create folder</h2>
          <FolderFields folders={folders} />
          <button className="glass-button mt-6" type="submit">Create folder</button>
        </form>
        <div className="space-y-4">
          {folders.map((folder) => (
            <details key={folder.id} className="glass-panel rounded-3xl p-5">
              <summary className="cursor-pointer font-art text-xl text-white">{folder.title}</summary>
              <form action="/api/admin/folders" method="post" className="mt-5 grid gap-4">
                <input type="hidden" name="id" value={folder.id} />
                <FolderFields folders={folders.filter((candidate) => candidate.id !== folder.id)} folder={folder} />
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

function FolderFields({ folders, folder }: { folders: Awaited<ReturnType<typeof getLibrary>>['folders']; folder?: Awaited<ReturnType<typeof getLibrary>>['folders'][number] }) {
  return (
    <div className="mt-5 grid gap-4">
      <label className="admin-label">Title<input className="admin-input" name="title" defaultValue={folder?.title} required /></label>
      <label className="admin-label">Slug<input className="admin-input" name="slug" defaultValue={folder?.slug} /></label>
      <label className="admin-label">Description<textarea className="admin-input min-h-24" name="description" defaultValue={folder?.description} /></label>
      <label className="admin-label">Parent folder<select className="admin-input" name="parentId" defaultValue={folder?.parentId || ''}><option value="">None</option>{folders.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>
      <div className="grid grid-cols-2 gap-4">
        <label className="admin-label">Visibility<select className="admin-input" name="visibility" defaultValue={folder?.visibility || 'public'}><option>public</option><option>private</option><option>draft</option></select></label>
        <label className="admin-label">Sort order<input className="admin-input" name="sortOrder" type="number" defaultValue={folder?.sortOrder || 0} /></label>
      </div>
    </div>
  );
}
