import { AdminShell } from '@/components/AdminShell';
import { getHomepageConfig } from '@/lib/admin/homepage-config';

export const metadata = {
  title: 'Admin - Pixilens',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const config = await getHomepageConfig();
  const heroCount = config.items.filter((item) => item.useInHero && item.enabled).length;
  const galleryCount = config.items.filter((item) => item.useInGallery && item.enabled).length;

  return (
    <AdminShell title="Dashboard">
      <section className="grid gap-5 md:grid-cols-3">
        <div className="glass-panel rounded-3xl p-6">
          <p className="text-xs uppercase tracking-[0.28em] text-white/45">Hero slideshow</p>
          <p className="font-art gold-text mt-4 text-5xl">{heroCount}</p>
        </div>
        <div className="glass-panel rounded-3xl p-6">
          <p className="text-xs uppercase tracking-[0.28em] text-white/45">Front page gallery</p>
          <p className="font-art gold-text mt-4 text-5xl">{galleryCount}</p>
        </div>
        <div className="glass-panel rounded-3xl p-6">
          <p className="text-xs uppercase tracking-[0.28em] text-white/45">Slide duration</p>
          <p className="font-art gold-text mt-4 text-5xl">{config.slideDurationSeconds}s</p>
        </div>
      </section>
    </AdminShell>
  );
}
