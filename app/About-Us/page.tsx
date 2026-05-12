import { AboutIcon } from '@/components/AboutIcon';
import { PageHero, SiteShell } from '@/components/SiteShell';
import { contact } from '@/lib/site-content';

export const metadata = {
  title: 'About Us - Pixilens Photography',
};

const paragraphs = [
  'We specialize in fashion & product photography, dance photography, family, newborn, and kids portraits to capture the perfect moment.',
  'From the shores of New Jersey to the beaches of California and beyond, we will be there with you every step of the way to guarantee your special moments are captured for all time. To us photography is all about being real and then letting us portray a picture of that moment to remember it forever.',
  'The thing that matters most: real people, real stories, real moments. We are a team of photographers, graphic designers, and retouchers who work with us on any given day.',
  'We would love to reach with you by phone or in person and talk about your wedding, event, portrait session, or video project.',
];

export default function AboutPage() {
  return (
    <SiteShell>
      <PageHero eyebrow="About" title="About Us" />
      <section className="mx-auto grid max-w-6xl gap-10 px-5 pb-20 md:grid-cols-[0.85fr_1.15fr] md:px-8 md:items-start">
        <AboutIcon />
        <div className="glass-panel rounded-2xl p-7 md:p-9">
          <div className="space-y-6 text-base leading-8 text-[#17130f]/72 md:text-lg">
            {paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          </div>
          <a href={contact.messengerHref} className="glass-button mt-8 w-fit">Click here to DM us directly</a>
        </div>
      </section>
    </SiteShell>
  );
}
