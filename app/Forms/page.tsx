import Link from 'next/link';
import { PageHero, SiteShell } from '@/components/SiteShell';
import { FormIcon } from '@/components/FormIcon';

const forms = [
  { label: 'Get Started', href: '/Get-Started', description: 'General enquiry — tell us about your event and get started.' },
  { label: 'Booking Form', href: '/Booking-Form', description: 'Book photography, videography, and add-on packages with release agreement.' },
  { label: 'Photobooth Enquiry', href: '/Photobooth-Enquiry', description: 'Rent an iPad photobooth, 360 booth, or video guestbook for your event.' },
  { label: 'Contact us', href: '/Direct-Message', description: 'Reach us via WhatsApp, phone, or email.' },
  { label: 'Release Agreement', href: '/Release-Agreement', description: 'Review and sign the standard photography, videography, and digital media release agreement.' },
];

export const metadata = {
  title: 'Forms - Pixilens Photography',
};

export default function FormsPage() {
  return (
    <SiteShell>
      <PageHero eyebrow="Forms" title="Forms">
        <p>All available Pixilens forms in one place — enquiries, bookings, rentals, and direct contact.</p>
      </PageHero>
      <FormIcon />
      <section className="mx-auto grid max-w-5xl gap-6 px-5 pb-20 md:px-8">
        {forms.map((form) => (
          <Link key={form.label} href={form.href} className="glass-panel group block rounded-xl p-6 transition hover:-translate-y-1 hover:shadow-lg active:scale-[0.98] cursor-pointer">
            <p className="gold-text text-lg font-light tracking-[0.06em]">{form.label}</p>
            <p className="mt-2 text-sm leading-6 text-[#17130f]/65">{form.description}</p>
          </Link>
        ))}
      </section>
    </SiteShell>
  );
}
