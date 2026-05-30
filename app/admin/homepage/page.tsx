import { AdminShell } from '@/components/AdminShell';
import { ImageWithLoader } from '@/components/ImageWithLoader';
import { getHomepageConfig } from '@/lib/admin/homepage-config';

export const metadata = {
  title: 'Homepage Admin - Pixilens',
  robots: { index: false, follow: false },
};

export default async function AdminHomepagePage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const params = await searchParams;
  const config = await getHomepageConfig();

  return (
    <AdminShell title="Homepage">
      {params.saved ? (
        <div className="glass-panel mb-6 rounded-2xl p-4 text-sm text-[#17130f]/75">Homepage settings saved.</div>
      ) : null}
      <form action="/api/admin/homepage" method="post" className="space-y-8">
        <section className="glass-panel rounded-3xl p-6">
          <label className="admin-label">
            Slide duration seconds
            <input
              name="slideDurationSeconds"
              type="number"
              min="2"
              max="30"
              defaultValue={config.slideDurationSeconds}
              className="admin-input mt-3 w-32"
            />
          </label>
        </section>

        <section className="grid gap-4">
          {config.items.map((item) => (
            <article key={item.id} className="glass-panel grid gap-5 rounded-3xl p-4 md:grid-cols-[180px_1fr] md:p-5">
              <div className="aspect-[3/4] overflow-hidden rounded-2xl bg-black/5">
                <ImageWithLoader
                  src={item.displayUrl}
                  alt={item.alt}
                  width={180}
                  height={240}
                  className="h-full w-full object-cover object-center"
                />
              </div>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="md:col-span-4">
                  <p className="font-art text-xl text-[#17130f]">{item.fileName}</p>
                  <p className="mt-1 text-xs text-[#17130f]/45">
                    {item.width}×{item.height} · {item.id}
                  </p>
                </div>
                <label className="flex items-center gap-3 text-sm text-[#17130f]/70">
                  <input name={`enabled:${item.id}`} type="checkbox" defaultChecked={item.enabled} /> Enabled
                </label>
                <label className="flex items-center gap-3 text-sm text-[#17130f]/70">
                  <input name={`useInHero:${item.id}`} type="checkbox" defaultChecked={item.useInHero} /> Hero
                </label>
                <label className="flex items-center gap-3 text-sm text-[#17130f]/70">
                  <input name={`useInGallery:${item.id}`} type="checkbox" defaultChecked={item.useInGallery} /> FP gallery
                </label>
                <label className="admin-label">
                  Sort
                  <input
                    name={`sortOrder:${item.id}`}
                    type="number"
                    defaultValue={item.sortOrder}
                    className="admin-input"
                  />
                </label>
                <label className="admin-label md:col-span-2">
                  Hero focal position
                  <select name={`objectPosition:${item.id}`} defaultValue={item.objectPosition} className="admin-input">
                    {['center 20%', 'center 28%', 'center 32%', 'center 38%', 'center center', 'center 62%'].map((value) => (
                      <option key={value} value={value}>{value}</option>
                    ))}
                  </select>
                </label>
                <label className="admin-label md:col-span-2">
                  Alt text
                  <input name={`alt:${item.id}`} defaultValue={item.alt} className="admin-input" />
                </label>
              </div>
            </article>
          ))}
        </section>

        <div className="sticky bottom-4 flex justify-end">
          <button className="glass-button" type="submit">Save homepage</button>
        </div>
      </form>
    </AdminShell>
  );
}
