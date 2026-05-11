import Image from 'next/image';
import { PageHero, SiteShell } from '@/components/SiteShell';
import { contact, services } from '@/lib/site-content';
import { findSiteAsset } from '@/lib/priority-assets';

export const metadata = {
  title: 'Services and Pricing - Pixilens Photography',
};

export default function ServicesPage() {
  const serviceImage = findSiteAsset('services.jpg');

  return (
    <SiteShell>
      <PageHero eyebrow="Services" title="Services and Pricing">
        <p>Photography, videography, live streaming, and photobooth services for portraits, events, weddings, dance, fashion, products, maternity, newborns, kids, and custom fine art.</p>
      </PageHero>
      {serviceImage ? (
        <div className="mx-auto mb-14 max-w-5xl px-5 md:px-8">
          <Image src={serviceImage.imgbb_display_url} alt="Pixilens services" width={serviceImage.width} height={serviceImage.height} className="mx-auto h-auto max-h-[420px] w-full object-cover opacity-90" />
        </div>
      ) : null}
      <section className="mx-auto grid max-w-7xl gap-5 px-5 pb-20 md:grid-cols-2 md:px-8 lg:grid-cols-3">
        {services.map((service) => (
          <article key={service.title} className="flex min-h-80 flex-col border border-white/10 bg-white/[0.03] p-6 md:p-8">
            <h2 className="text-2xl font-light tracking-[0.08em]">{service.title}</h2>
            <p className="mt-5 flex-1 text-sm leading-7 text-white/62">{service.description}</p>
            <a href={contact.messengerHref} className="mt-7 inline-flex w-fit border border-white/40 px-5 py-3 text-xs uppercase tracking-[0.22em] transition hover:bg-white hover:text-black">Book us now</a>
          </article>
        ))}
      </section>
    </SiteShell>
  );
}
