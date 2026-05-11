import Link from 'next/link';
import { PageHero, SiteShell } from '@/components/SiteShell';
import { portfolioLinks } from '@/lib/site-content';

export const metadata = {
  title: 'Portfolio - Pixilens Photography',
};

export default function PortfolioPlaceholderPage() {
  return (
    <SiteShell>
      <PageHero eyebrow="Portfolio" title="Portfolio">
        <p>Full gallery migration is coming next. These category routes are preserved from the current Pixilens navigation.</p>
      </PageHero>
      <section className="mx-auto grid max-w-5xl gap-4 px-5 pb-20 sm:grid-cols-2 md:px-8">
        {portfolioLinks.map((link) => (
          <Link key={link.href} href={link.href} className="border border-white/10 bg-white/[0.03] px-6 py-5 text-sm uppercase tracking-[0.18em] text-white/75 transition hover:border-white/40 hover:text-white">
            {link.label}
          </Link>
        ))}
      </section>
    </SiteShell>
  );
}
