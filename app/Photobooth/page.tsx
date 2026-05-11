import Image from 'next/image';
import { PageHero, SiteShell } from '@/components/SiteShell';
import { contact } from '@/lib/site-content';
import { findSiteAsset } from '@/lib/priority-assets';

export const metadata = {
  title: 'Photobooth - Pixilens Photography',
};

export default function PhotoboothPage() {
  const assets = [
    findSiteAsset('13707397.png'),
    findSiteAsset('PHOTOBOOTH BY PIXILENS.png'),
    findSiteAsset('videobooth.png'),
    findSiteAsset('360photobooth.png'),
    findSiteAsset('Photography.Video.Live.photobooth.png'),
  ].filter(Boolean);

  return (
    <SiteShell>
      <PageHero eyebrow="PHOTOBOOTH" title="Photobooth by Pixilens">
        <p>Photobooth, 360 photobooth, photography, video, and live streaming options for events and celebrations.</p>
      </PageHero>
      <section className="mx-auto max-w-6xl px-5 pb-20 md:px-8">
        <div className="grid gap-6 md:grid-cols-3 md:items-start">
          {assets.map((asset) => asset ? (
            <div key={asset.file_name} className="border border-white/10 bg-white/[0.03] p-4">
              <Image src={asset.imgbb_display_url} alt={asset.file_name} width={asset.width} height={asset.height} className="h-auto w-full object-contain" />
            </div>
          ) : null)}
        </div>
        <div className="mt-12 flex flex-wrap justify-center gap-4">
          <a href={contact.rentalHref} className="glass-button">Photobooth rental form</a>
          <a href={contact.honeybookHref} className="glass-button">Enquiry form</a>
        </div>
      </section>
    </SiteShell>
  );
}
