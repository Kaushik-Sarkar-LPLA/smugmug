import { ContactIcon } from '@/components/ContactIcon';
import { PageHero, SiteShell } from '@/components/SiteShell';
import { contact } from '@/lib/site-content';

export const metadata = {
  title: 'Direct Message - Pixilens Photography',
};

const contactActions = [
  { label: 'Contact us', href: contact.honeybookHref },
  { label: 'WhatsApp', href: contact.whatsappHref, detail: '+1 737 231 0033' },
  { label: 'Phone', href: contact.phoneHref, detail: '+1 737 231 0033' },
  { label: 'Email', href: contact.emailHref, detail: 'contact@pixilens.com' },
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
            <a key={action.label} href={action.href} className="glass-button justify-start rounded-lg px-6 py-4 text-left text-sm md:py-5">
              <span className="font-medium">{action.label}</span>
              {'detail' in action && action.detail ? <span className="ml-2 text-[#17130f]/55">{action.detail}</span> : null}
            </a>
          ))}
        </div>
      </section>
    </SiteShell>
  );
}
