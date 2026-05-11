import Image from 'next/image';
import { PageHero, SiteShell } from '@/components/SiteShell';
import { contact } from '@/lib/site-content';
import { findSiteAsset } from '@/lib/priority-assets';

export const metadata = {
  title: 'About Us - Pixilens Photography',
};

export default function AboutPage() {
  const aboutImage = findSiteAsset('IMG_2135.JPG') ?? findSiteAsset('Amanda-21.jpg');

  return (
    <SiteShell>
      <PageHero eyebrow="About" title="About Us" />
      <section className="mx-auto grid max-w-6xl gap-10 px-5 pb-20 md:grid-cols-[0.9fr_1.1fr] md:px-8 md:items-center">
        {aboutImage ? (
          <Image src={aboutImage.imgbb_display_url} alt="Pixilens portrait" width={aboutImage.width} height={aboutImage.height} className="h-auto w-full object-cover opacity-90" />
        ) : null}
        <div className="space-y-6 text-base leading-8 text-white/68 md:text-lg">
          <p>We specialize in fashion & product photography, dance photography, family, newborn, and kids portraits to capture the perfect moment.</p>
          <p>From the shores of New Jersey to the beaches of California and beyond, we will be there with you every step of the way to guarantee your special moments are captured for all time. To us photography is all about being real and then letting us portray a picture of that moment to remember it forever.</p>
          <p>The thing that matters most: real people, real stories, real moments. We are a team of photographers, graphic designers, and retouchers who work with us on any given day.</p>
          <p>We would love to reach with you by phone or in person and talk about your wedding, event, portrait session, or video project.</p>
          <a href={contact.messengerHref} className="inline-flex border border-white/40 px-6 py-3 text-xs uppercase tracking-[0.24em] text-white transition hover:bg-white hover:text-black">Click here to DM us directly</a>
        </div>
      </section>
    </SiteShell>
  );
}
