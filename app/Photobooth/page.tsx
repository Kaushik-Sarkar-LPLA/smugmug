import Image from 'next/image';
import { PageHero, SiteShell } from '@/components/SiteShell';
import { contact } from '@/lib/site-content';
import { findSiteAsset } from '@/lib/priority-assets';

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
  const heroPoster = findSiteAsset('PHOTOBOOTH BY PIXILENS.png');
  const videoPoster = findSiteAsset('videobooth.png');
  const booth360 = findSiteAsset('360photobooth.png');
  const banner = findSiteAsset('Photography.Video.Live.photobooth.png') ?? findSiteAsset('Photo, video, livw streaming, photobooth.png');

  return (
    <SiteShell>
      <PageHero eyebrow="PHOTOBOOTH" title="Photobooth by Pixilens">
        <p>Modern photobooth, 360 booth, video booth, photography, and live streaming options for events and celebrations.</p>
      </PageHero>

      <section className="mx-auto max-w-7xl px-5 pb-20 md:px-8">
        {banner ? (
          <div className="mb-10 overflow-hidden rounded-xl bg-white shadow-[0_18px_60px_rgba(71,52,24,0.13)]">
            <Image src={banner.imgbb_display_url} alt="Photography Video Live Photobooth" width={banner.width} height={banner.height} className="h-auto w-full object-contain" />
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-3">
          {packages.map((item, index) => {
            const asset = index === 0 ? heroPoster : index === 1 ? booth360 : videoPoster;
            return (
              <article key={item.title} className="photobooth-card glass-panel group overflow-hidden rounded-xl">
                <div className="relative min-h-80 bg-[linear-gradient(135deg,#ffffff,#fff3df,#eef7ff)] p-6">
                  <div className="absolute inset-0 opacity-70 bg-[radial-gradient(circle_at_20%_20%,rgba(214,181,109,0.24),transparent_32%),radial-gradient(circle_at_85%_15%,rgba(116,185,255,0.20),transparent_30%),radial-gradient(circle_at_50%_95%,rgba(244,180,255,0.18),transparent_32%)]" />
                  {asset ? (
                    <Image src={asset.imgbb_display_url} alt={item.title} width={asset.width} height={asset.height} className="relative mx-auto h-72 w-full object-contain transition duration-700 group-hover:scale-[1.03]" />
                  ) : null}
                </div>
                <div className="p-6">
                  <p className="text-xs uppercase tracking-[0.32em] text-[#17130f]/45">{item.price}</p>
                  <h2 className="gold-text mt-2 text-2xl font-light tracking-[0.08em]">{item.title}</h2>
                  <p className="mt-4 text-sm leading-7 text-[#17130f]/70">{item.description}</p>
                  <ul className="mt-5 space-y-2 text-sm text-[#17130f]/65">
                    {item.points.map((point) => <li key={point}>• {point}</li>)}
                  </ul>
                </div>
              </article>
            );
          })}
        </div>

        <div className="mt-12 flex flex-wrap justify-center gap-4">
          <a href={contact.rentalHref} className="glass-button">Photobooth rental form</a>
          <a href={contact.honeybookHref} className="glass-button">Enquiry form</a>
        </div>
      </section>
    </SiteShell>
  );
}
