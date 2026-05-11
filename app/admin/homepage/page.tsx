import Image from 'next/image';
import { AdminShell } from '@/components/AdminShell';
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
      {params.saved ? <div className="glass-panel mb-6 rounded-2xl p-4 text-sm text-white/75">Homepage settings saved.</div> : null}
      <form action="/api/admin/homepage" method="post" className="space-y-8">
        <section className="glass-panel rounded-3xl p-6">
          <label className="block text-xs uppercase tracking-[0.24em] text-white/50">
            Slide duration seconds
            <input name="slideDurationSeconds" type="number" min="2" max="30" defaultValue={config.slideDurationSeconds} className="mt-3 w-32 rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-base text-white outline-none focus:border-white/40" />
          </label>
        </section>

        <section className="grid gap-4">
          {config.items.map((item) => (
            <article key={item.id} className="glass-panel grid gap-5 rounded-3xl p-4 md:grid-cols-[220px_1fr] md:p-5">
              <Image src={item.displayUrl} alt={item.alt} width={220} height={150} className="h-40 w-full rounded-2xl object-cover" />
              <div className="grid gap-4 md:grid-cols-4">
                <div className="md:col-span-4">
                  <p className="font-art text-xl text-white">{item.fileName}</p>
                  <p className="mt-1 text-xs text-white/45">{item.width}×{item.height} · {item.id}</p>
                </div>
                <label className="flex items-center gap-3 text-sm text-white/70"><input name={`enabled:${item.id}`} type="checkbox" defaultChecked={item.enabled} /> Enabled</label>
                <label className="flex items-center gap-3 text-sm text-white/70"><input name={`useInHero:${item.id}`} type="checkbox" defaultChecked={item.useInHero} /> Hero</label>
                <label className="flex items-center gap-3 text-sm text-white/70"><input name={`useInGallery:${item.id}`} type="checkbox" defaultChecked={item.useInGallery} /> FP gallery</label>
                <label className="text-xs uppercase tracking-[0.18em] text-white/45">
                  Sort
                  <input name={`sortOrder:${item.id}`} type="number" defaultValue={item.sortOrder} className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none" />
                </label>
                <label className="md:col-span-2 text-xs uppercase tracking-[0.18em] text-white/45">
                  Hero focal position
                  <select name={`objectPosition:${item.id}`} defaultValue={item.objectPosition} className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none">
                    {['center 20%', 'center 28%', 'center 32%', 'center 38%', 'center center', 'center 62%'].map((value) => <option key={value} value={value}>{value}</option>)}
                  </select>
                </label>
                <label className="md:col-span-2 text-xs uppercase tracking-[0.18em] text-white/45">
                  Alt text
                  <input name={`alt:${item.id}`} defaultValue={item.alt} className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none" />
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
