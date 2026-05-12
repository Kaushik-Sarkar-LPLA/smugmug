import { ContactIcon } from '@/components/ContactIcon';
import { PageHero, SiteShell } from '@/components/SiteShell';
import { contact } from '@/lib/site-content';

export const metadata = {
  title: 'Direct Message - Pixilens Photography',
};

const contactActions = [
  { label: 'Click here to contact us and get started', href: contact.honeybookHref },
  { label: 'WhatsApp +17372310033', href: contact.whatsappHref },
  { label: 'Phone Number +1737 231 0033', href: contact.phoneHref },
  { label: 'Email at contact@pixilens.com', href: contact.emailHref },
];

export default function ContactPage() {
  return (
    <SiteShell>
      <PageHero eyebrow="Contact us" title="Direct Message">
        <p>Reach Pixilens directly for booking, event details, photography, video, live streaming, and photobooth questions.</p>
      </PageHero>
      <section className="mx-auto grid max-w-5xl gap-10 px-5 pb-20 md:grid-cols-[0.8fr_1.2fr] md:px-8 md:items-start">
        <ContactIcon />
        <div className="grid gap-4">
          {contactActions.map((action) => (
            <a key={action.label} href={action.href} className="glass-button justify-start rounded-lg px-6 py-5 text-left text-sm">
              {action.label}
            </a>
          ))}
        </div>
      </section>
    </SiteShell>
  );
}
