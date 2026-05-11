import Image from 'next/image';
import { PageHero, SiteShell } from '@/components/SiteShell';
import { contact } from '@/lib/site-content';
import { findSiteAsset } from '@/lib/priority-assets';

export const metadata = {
  title: 'Direct Message - Pixilens Photography',
};

const contactActions = [
  { label: 'Save to contacts', href: contact.vcardHref },
  { label: 'Click here to contact us and get started', href: contact.honeybookHref },
  { label: 'WhatsApp +17372310033', href: contact.whatsappHref },
  { label: 'Facebook DM http://m.me/pixilens', href: contact.messengerHref },
  { label: 'Phone Number +1737 231 0033', href: contact.phoneHref },
  { label: 'Email at contact@pixilens.com', href: contact.emailHref },
];

export default function ContactPage() {
  const qr = findSiteAsset('adobe-express-qr-code.png');

  return (
    <SiteShell>
      <PageHero eyebrow="Contact us" title="Direct Message">
        <p>Reach Pixilens directly for booking, event details, photography, video, live streaming, and photobooth questions.</p>
      </PageHero>
      <section className="mx-auto grid max-w-5xl gap-10 px-5 pb-20 md:grid-cols-[0.8fr_1.2fr] md:px-8 md:items-start">
        {qr ? <Image src={qr.imgbb_display_url} alt="Pixilens contact QR code" width={qr.width} height={qr.height} className="mx-auto h-auto w-full max-w-xs" /> : null}
        <div className="grid gap-4">
          {contactActions.map((action) => (
            <a key={action.label} href={action.href} className="border border-white/10 bg-white/[0.03] px-6 py-5 text-sm uppercase tracking-[0.18em] text-white/75 transition hover:border-white/40 hover:text-white">
              {action.label}
            </a>
          ))}
        </div>
      </section>
    </SiteShell>
  );
}
