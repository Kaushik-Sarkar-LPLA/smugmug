import Image from 'next/image';
import { PageHero, SiteShell } from '@/components/SiteShell';
import { contact } from '@/lib/site-content';

export const metadata = {
  title: 'Photobooth - Pixilens Photography',
};

const packages = [
  {
    title: 'Classic Photobooth',
    price: 'from $399',
    description: 'Open-air photobooth experience for birthdays, school events, weddings, corporate events, and family celebrations.',
    points: ['Instant digital sharing', 'Custom overlay design', 'Online gallery delivery'],
  },
  {
    title: '360 Video Booth',
    price: 'from $599',
    description: 'A premium 360 booth experience with cinematic short clips, perfect for dance floors, parties, and brand activations.',
    points: ['Slow-motion video clips', 'Music/branding overlays', 'Share-ready social files'],
  },
  {
    title: 'Photo + Video + Live',
    price: 'custom quote',
    description: 'Bundle photobooth with event photography, videography, or live streaming for complete event coverage.',
    points: ['Event coverage add-ons', 'Highlight content', 'Custom package planning'],
  },
];

export default function PhotoboothPage() {
  return (
    <SiteShell>
      <PageHero eyebrow="PHOTOBOOTH" title="Photobooth by Pixilens">
        <p>Modern photobooth, 360 photobooth, video booth, photography, and live streaming options for events and celebrations.</p>
      </PageHero>

      <section className="mx-auto max-w-7xl px-5 pb-20 md:px-8">
        <div className="mx-auto mb-12 grid max-w-6xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div className="glass-panel overflow-hidden rounded-xl p-4">
            <Image
              src="/generated/photobooth-pricing-flyer.png"
              alt="Pixilens photobooth pricing flyer"
              width={1024}
              height={1536}
              className="h-auto w-full rounded-lg object-contain"
              priority
            />
          </div>
          <div className="glass-panel rounded-xl p-7 md:p-9">
            <p className="text-xs uppercase tracking-[0.36em] text-[#17130f]/45">Event experiences</p>
            <h2 className="gold-text mt-3 text-3xl font-light tracking-[0.08em] md:text-5xl">Photobooth packages</h2>
            <p className="mt-5 text-base leading-8 text-[#17130f]/70">
              Designed for weddings, birthdays, school events, corporate activations, cultural events, and private celebrations. Choose a simple classic booth, a high-energy 360 video booth, or bundle it with photography, video, and live streaming.
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {packages.map((item) => (
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
          <a href={contact.rentalHref} className="glass-button">Photobooth rental form</a>
          <a href={contact.honeybookHref} className="glass-button">Enquiry form</a>
        </div>
      </section>
    </SiteShell>
  );
}
