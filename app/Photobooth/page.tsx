import Image from 'next/image';
import { PageHero, SiteShell } from '@/components/SiteShell';
import { contact } from '@/lib/site-content';

export const metadata = {
  title: 'Photobooth - Pixilens Photography',
};

const experiences = [
  {
    title: 'Digital iPad Photobooth',
    price: '$150/hour',
    description: 'Digital booth experience with text/email delivery and an online gallery after the event.',
    points: ['Text/email sharing', 'Online gallery delivery', 'Backdrop choices for iPad booth'],
  },
  {
    title: '360 Photobooth',
    price: '$225/hour',
    description: 'High-energy 360 video booth experience for weddings, parties, graduations, and activations.',
    points: ['360 video clips', 'Share-ready social files', 'Great for dance floors and entrances'],
  },
  {
    title: 'Video Guestbook',
    price: '$150/hour',
    description: 'A digital video guestbook where guests record messages, wishes, and memories.',
    points: ['Guest video messages', 'Event keepsake content', 'Digital delivery'],
  },
];

const pricingRows = [
  { service: 'Video Guestbook', price: '$150/hour', details: 'Digital video guestbook experience for guest messages and event memories.' },
  { service: 'Photobooth (IPAD)', price: '$150/hour', details: 'Digital iPad photobooth with text/email delivery and online gallery.' },
  { service: '360 Photobooth', price: '$225/hour', details: '360 video booth experience with share-ready clips.' },
];

const pricingNotes = [
  'A $50 non-refundable deposit is required to reserve the date.',
  'Any overage may be billed at $175/hour and must be paid by the end of the event.',
  'Discounts or custom pricing are discussed separately and apply only if agreed.',
  'Date change requests must be made in writing at least 15 days before the event and are subject to availability.',
  'Digital delivery depends on internet availability; queued text/email delivery sends after the booth reconnects if needed.',
];

export default function PhotoboothPage() {
  return (
    <SiteShell>
      <PageHero eyebrow="PHOTOBOOTH" title="Photobooth by Pixilens">
        <p>Modern iPad photobooth, 360 photobooth, video guestbook, and digital gallery options for weddings, parties, school events, corporate activations, and private celebrations.</p>
      </PageHero>

      <section className="mx-auto max-w-7xl px-5 pb-20 md:px-8">
        <div className="glass-panel mx-auto mb-10 grid max-w-6xl gap-8 overflow-hidden rounded-xl p-4 md:p-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <Image
            src="/generated/photobooth-pricing-flyer.png"
            alt="Pixilens photobooth pricing flyer"
            width={1024}
            height={1536}
            className="h-auto w-full rounded-lg object-contain"
            priority
          />
          <div className="p-3 md:p-6">
            <p className="text-xs uppercase tracking-[0.36em] text-[#17130f]/45">Event experiences</p>
            <h2 className="gold-text mt-3 text-3xl font-light tracking-[0.08em] md:text-5xl">Photobooth rental packages</h2>
            <p className="mt-5 text-base leading-8 text-[#17130f]/70">
              Choose a digital iPad booth, collect video guestbook messages, or bring a 360 booth to the dance floor. Packages can be customized with photo, video, and live-streaming coverage.
            </p>
          </div>
        </div>

        <div className="glass-panel mb-10 rounded-xl p-6 md:p-8">
          <p className="text-xs uppercase tracking-[0.32em] text-[#17130f]/45">Pricing</p>
          <h2 className="gold-text mt-2 text-3xl font-light tracking-[0.08em]">Photobooth rental pricing</h2>
          <div className="mt-6 space-y-4 md:hidden">
            {pricingRows.map((row) => (
              <div key={row.service} className="rounded-lg border border-[#17130f]/10 bg-white/45 p-4">
                <p className="gold-text text-lg">{row.service}</p>
                <p className="mt-2 text-sm font-medium text-[#17130f]/80">{row.price}</p>
                <p className="mt-2 text-sm leading-6 text-[#17130f]/65">{row.details}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 hidden md:block">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[#17130f]/10 text-xs uppercase tracking-[0.22em] text-[#17130f]/45">
                  <th className="py-3 pr-4 font-normal">Service</th>
                  <th className="py-3 pr-4 font-normal">Starting price</th>
                  <th className="py-3 font-normal">Details</th>
                </tr>
              </thead>
              <tbody className="text-[#17130f]/70">
                {pricingRows.map((row) => (
                  <tr key={row.service} className="border-b border-[#17130f]/10 last:border-0">
                    <td className="py-4 pr-4 font-medium text-[#17130f]/80">{row.service}</td>
                    <td className="py-4 pr-4">{row.price}</td>
                    <td className="py-4">{row.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className="mt-5 space-y-2 text-sm leading-7 text-[#17130f]/65">
            {pricingNotes.map((note) => <li key={note}>• {note}</li>)}
          </ul>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {experiences.map((item) => (
            <article key={item.title} className="photobooth-card glass-panel group overflow-hidden rounded-xl p-6 md:p-8">
              <p className="text-xs uppercase tracking-[0.32em] text-[#17130f]/45">{item.price}</p>
              <h2 className="gold-text mt-2 text-2xl font-light tracking-[0.08em]">{item.title}</h2>
              <p className="mt-4 text-sm leading-7 text-[#17130f]/70">{item.description}</p>
              <ul className="mt-5 space-y-2 text-sm text-[#17130f]/65">
                {item.points.map((point) => <li key={point}>• {point}</li>)}
              </ul>
            </article>
          ))}
        </div>

        <div className="mt-12 flex flex-wrap justify-center gap-4">
          <a href={contact.rentalHref} className="glass-button">Book Photobooth</a>
          <a href={contact.honeybookHref} className="glass-button">Enquiry Form</a>
        </div>
      </section>
    </SiteShell>
  );
}
