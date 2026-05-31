import { PageHero, SiteShell } from '@/components/SiteShell';
import { ServiceIcon } from '@/components/ServiceIcon';
import { services } from '@/lib/site-content';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Services and Pricing',
  description:
    'Photography, videography, live streaming, and photobooth pricing for Austin, Dallas, and Houston. Weddings, portraits, events, fashion, dance, maternity, and more.',
  path: '/Services-and-Pricing',
});

export default function ServicesPage() {
  return (
    <SiteShell>
      <PageHero eyebrow="Services" title="Services and Pricing">
        <p>
          Photography, videography, live streaming, and photobooth services in Austin, Dallas, Houston, and across Texas —
          for portraits, events, weddings, dance, fashion, products, maternity, newborns, kids, and custom fine art.
        </p>
      </PageHero>
      <ServiceIcon />
      <section className="mx-auto grid max-w-7xl gap-5 px-5 pb-20 sm:grid-cols-2 md:px-8 lg:grid-cols-3">
        {services.map((service) => (
          <article key={service.title} className="glass-panel flex min-h-80 flex-col rounded-xl p-6 md:p-8">
            <h2 className="gold-text text-2xl font-light tracking-[0.08em]">{service.title}</h2>
            <p className="mt-5 flex-1 text-sm leading-7 text-[#17130f]/70">{service.description}</p>
            <a href="/Get-Started" className="glass-button mt-7 w-fit">Contact us</a>
          </article>
        ))}
      </section>
    </SiteShell>
  );
}
