import { redirect } from 'next/navigation';
import nodemailer from 'nodemailer';
import { PageHero, SiteShell } from '@/components/SiteShell';
import { contact } from '@/lib/site-content';

export const metadata = {
  title: 'Get Started - Pixilens Photography',
};

const serviceTypes = [
  '360 Videobooth with GoPro (Austin Area)',
  'Digital Ipad Photobooth (Austin Area)',
  'Digital Ipad Photobooth with LCD display (Phoenix Area)',
  'Photography',
  'Videography',
  'Youtube Live Streaming',
  'Digital Video Guestbook (Austin Area)',
  'Pathfinder Boombox with 2 wireless Microphones',
];

const eventTypes = [
  'Birthday',
  'Wedding',
  'Senior Photography',
  'Portrait Session',
  'Quinceañera or Sweet 16',
  'House Warming',
  'Dance Photography',
  'Graduation Ceremony',
  'Engagement',
  'Court House Wedding',
  'Family Sessions',
  'Mini Session Portraits',
  'Product Photography',
  'Product Videography',
  'Other (Not in List)',
  'Photobooth for an Event',
  '360 Videobooth for an Event',
];

const referralOptions = [
  'Vendor Referral',
  'Client Referral',
  'Personal Website',
  'Google',
  'Facebook',
  'Instagram',
  'The Knot',
  'Yelp',
  'Thumbtack',
  'Other',
  'Unknown',
];

type FormState = {
  name: string;
  email: string;
  phone: string;
  serviceTypes: string[];
  eventType: string;
  eventDate: string;
  referral: string;
  eventAddress: string;
  message: string;
};

function field(formData: FormData, key: string) {
  return String(formData.get(key) || '').trim();
}

function htmlEscape(value: string) {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}

function formatText(data: FormState) {
  return `New Pixilens enquiry\n\nName: ${data.name}\nEmail: ${data.email}\nPhone: ${data.phone}\nServices: ${data.serviceTypes.join(', ')}\nEvent Type: ${data.eventType}\nEvent Date: ${data.eventDate}\nHow they heard about Pixilens: ${data.referral || 'Not provided'}\nEvent Address: ${data.eventAddress}\n\nEvent Details:\n${data.message || 'Not provided'}`;
}

function formatHtml(data: FormState) {
  const row = (label: string, value: string) => `<tr><td style="padding:8px 12px;border-bottom:1px solid #eadfce;color:#7a5b23;font-weight:600;">${label}</td><td style="padding:8px 12px;border-bottom:1px solid #eadfce;">${htmlEscape(value)}</td></tr>`;
  return `<div style="font-family:Arial,sans-serif;color:#17130f;line-height:1.5;"><h2 style="color:#a87921;">New Pixilens enquiry</h2><table style="border-collapse:collapse;width:100%;max-width:720px;">${row('Name', data.name)}${row('Email', data.email)}${row('Phone', data.phone)}${row('Services', data.serviceTypes.join(', '))}${row('Event Type', data.eventType)}${row('Event Date', data.eventDate)}${row('How they heard about Pixilens', data.referral || 'Not provided')}${row('Event Address', data.eventAddress)}</table><h3 style="color:#a87921;">Event Details</h3><p>${htmlEscape(data.message || 'Not provided').replaceAll('\n', '<br>')}</p></div>`;
}

function createTransporter() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;
  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user, pass },
  });
}

async function sendEnquiry(formData: FormData) {
  'use server';

  const data: FormState = {
    name: field(formData, 'name'),
    email: field(formData, 'email'),
    phone: field(formData, 'phone'),
    serviceTypes: formData.getAll('serviceTypes').map((value) => String(value)).filter(Boolean),
    eventType: field(formData, 'eventType'),
    eventDate: field(formData, 'eventDate'),
    referral: field(formData, 'referral'),
    eventAddress: field(formData, 'eventAddress'),
    message: field(formData, 'message'),
  };

  if (!data.name || !data.email || !data.phone || !data.eventType || !data.eventDate || !data.eventAddress || data.serviceTypes.length === 0) {
    redirect('/Get-Started?status=missing');
  }

  const transporter = createTransporter();
  if (!transporter) redirect('/Get-Started?status=email-not-configured');

  const from = process.env.SMTP_FROM || `Pixilens <${contact.email}>`;
  const subject = `Pixilens enquiry from ${data.name}`;
  const text = formatText(data);
  const html = formatHtml(data);

  await transporter.sendMail({ from, to: contact.email, replyTo: data.email, subject, text, html });
  await transporter.sendMail({
    from,
    to: data.email,
    subject: 'Pixilens received your enquiry',
    text: `Hi ${data.name},\n\nThank you for contacting Pixilens. We received your enquiry and will get back to you soon.\n\n${text}`,
    html: `<div style="font-family:Arial,sans-serif;color:#17130f;line-height:1.5;"><p>Hi ${htmlEscape(data.name)},</p><p>Thank you for contacting Pixilens. We received your enquiry and will get back to you soon.</p>${formatHtml(data)}</div>`,
  });

  redirect('/Get-Started?status=sent');
}

export default async function GetStartedPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const params = await searchParams;
  return (
    <SiteShell>
      <PageHero eyebrow="Get Started" title="Tell us about your event">
        <p>Contact us to get started. Pixilens serves Austin, TX and surrounding areas for photography, video, live streaming, and photobooth experiences.</p>
      </PageHero>

      <section className="mx-auto max-w-5xl px-5 pb-20 md:px-8">
        {params.status === 'sent' ? (
          <div className="glass-panel mb-8 rounded-xl p-5 text-center text-[#17130f]/75">Thank you. Your enquiry was sent to Pixilens and a confirmation email was sent to you.</div>
        ) : null}
        {params.status === 'missing' ? (
          <div className="glass-panel mb-8 rounded-xl border-red-200/70 p-5 text-center text-red-700">Please fill out all required fields before sending.</div>
        ) : null}
        {params.status === 'email-not-configured' ? (
          <div className="glass-panel mb-8 rounded-xl border-red-200/70 p-5 text-center text-red-700">Email sending is not configured yet. Please email {contact.email} directly.</div>
        ) : null}

        <form action={sendEnquiry} className="glass-panel rounded-xl p-6 md:p-9">
          <div className="mb-8 text-center text-[#17130f]/70">
            <p className="font-art gold-text text-2xl">Priyanka Sarkar</p>
            <p className="mt-2">Austin, TX | Phone/WhatsApp: {contact.phoneDisplay}</p>
            <p><a href={contact.emailHref} className="gold-text">{contact.email}</a></p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <label className="public-label md:col-span-2">Please enter your first and last name *<input name="name" required className="public-input" placeholder="Your name here" /></label>
            <label className="public-label">Email *<input name="email" type="email" required className="public-input" placeholder="E.g. myemail@email.com" /></label>
            <label className="public-label">Phone number *<input name="phone" required className="public-input" placeholder="E.g. 541 444 0755" /></label>
          </div>

          <fieldset className="mt-7">
            <legend className="public-label mb-3">Serviced Type (You can select Multiple products and services) *</legend>
            <div className="grid gap-3 md:grid-cols-2">
              {serviceTypes.map((service) => (
                <label key={service} className="flex items-start gap-3 rounded-lg border border-[#281f16]/10 bg-white/55 p-3 text-sm text-[#17130f]/72">
                  <input name="serviceTypes" value={service} type="checkbox" className="mt-1 accent-[#a87921]" />
                  <span>{service}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="mt-7 grid gap-5 md:grid-cols-2">
            <label className="public-label">Event Type *<select name="eventType" required className="public-input"><option value="">Select an option</option>{eventTypes.map((type) => <option key={type}>{type}</option>)}</select></label>
            <label className="public-label">Event date *<input name="eventDate" type="date" required className="public-input" /></label>
            <label className="public-label">How did you hear about us?<select name="referral" className="public-input"><option value="">Select an option</option>{referralOptions.map((option) => <option key={option}>{option}</option>)}</select></label>
            <label className="public-label">Event Address *<input name="eventAddress" required className="public-input" placeholder="E.g. 742 Evergreen Terrace, Springfield" /></label>
          </div>

          <label className="public-label mt-7 block">Tell us more about this Event<textarea name="message" className="public-input min-h-36" placeholder="What do I need to know about the project?" /></label>

          <p className="mt-6 text-xs leading-6 text-[#17130f]/50">Clicking Send confirms you're okay with getting texts from Pixilens. Message and/or data rates may apply.</p>
          <button className="glass-button mt-7" type="submit">Send</button>
        </form>
      </section>
    </SiteShell>
  );
}
