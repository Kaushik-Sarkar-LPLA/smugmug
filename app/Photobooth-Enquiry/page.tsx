import { redirect } from 'next/navigation';
import { PageHero, SiteShell } from '@/components/SiteShell';
import { contact } from '@/lib/site-content';
import { field, formatRows, htmlEscape, sendPixilensEmail } from '@/lib/email';

export const metadata = {
  title: 'Photobooth Enquiry - Pixilens Photography',
};

const areas = ['Austin and Surrounding cities (TX)', 'Phoenix and Surrounding cities (AZ)'];
const boothTypes = ['360 Photobooth', 'Video Guest Book', 'Photobooth (IPAD)', 'Photobooth with Unlimited Prints'];
const eventTypes = ['Wedding', 'Birthday Party', 'Quinceanera', 'Sweet 16', '18th Debut', '1st Birthday', 'Baby Shower', 'Bar & Bat Mitzvah', 'Prom', 'Graduation', 'Christening', 'Corporate', 'Halloween', 'Christmas', 'Fundraiser', 'Festival', 'Other'];
const hourOptions = ['2 hours', '3 hours', '4 hours', '5 hours', '6 hours'];
const setupOptions = ['Indoors', 'Outdoors', 'Both'];
const paymentOptions = ['Zelle - 737 231 0033 (Pixilens LLC) [Preferred]', 'CashApp - https://cash.app/$pixilensphotography', 'Cash balance due at event'];

type PhotoboothState = {
  area: string;
  boothType: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  eventType: string;
  eventDate: string;
  eventTime: string;
  hours: string;
  venueName: string;
  venueAddress: string;
  setupLocation: string;
  paymentMethod: string;
  galleryText: string;
  notes: string;
  agreement: string;
};

function fullName(data: PhotoboothState) {
  return `${data.firstName} ${data.lastName}`.trim();
}

function formatText(data: PhotoboothState) {
  return `New Pixilens photobooth enquiry\n\nName: ${fullName(data)}\nEmail: ${data.email}\nPhone: ${data.phone}\nArea: ${data.area}\nPhotobooth Type: ${data.boothType}\nEvent Type: ${data.eventType}\nEvent Date: ${data.eventDate}\nEvent Time: ${data.eventTime || 'Not provided'}\nNumber of Hours: ${data.hours}\nVenue Name: ${data.venueName}\nVenue Address: ${data.venueAddress}\nSetup Location: ${data.setupLocation}\nPayment Method: ${data.paymentMethod}\nOnline Gallery Text: ${data.galleryText}\nAgreement: ${data.agreement}\n\nNotes:\n${data.notes || 'Not provided'}`;
}

function formatHtml(data: PhotoboothState) {
  return `<div style="font-family:Arial,sans-serif;color:#17130f;line-height:1.5;"><h2 style="color:#a87921;">New Pixilens photobooth enquiry</h2><table style="border-collapse:collapse;width:100%;max-width:760px;">${formatRows([
    ['Name', fullName(data)],
    ['Email', data.email],
    ['Phone', data.phone],
    ['Area', data.area],
    ['Photobooth Type', data.boothType],
    ['Event Type', data.eventType],
    ['Event Date', data.eventDate],
    ['Event Time', data.eventTime || 'Not provided'],
    ['Number of Hours', data.hours],
    ['Venue Name', data.venueName],
    ['Venue Address', data.venueAddress],
    ['Setup Location', data.setupLocation],
    ['Payment Method', data.paymentMethod],
    ['Online Gallery Text', data.galleryText],
    ['Agreement', data.agreement],
  ])}</table><h3 style="color:#a87921;">Notes</h3><p>${htmlEscape(data.notes || 'Not provided').replaceAll('\n', '<br>')}</p></div>`;
}

async function sendPhotoboothEnquiry(formData: FormData) {
  'use server';

  const data: PhotoboothState = {
    area: field(formData, 'area'),
    boothType: field(formData, 'boothType'),
    firstName: field(formData, 'firstName'),
    lastName: field(formData, 'lastName'),
    phone: field(formData, 'phone'),
    email: field(formData, 'email'),
    eventType: field(formData, 'eventType'),
    eventDate: field(formData, 'eventDate'),
    eventTime: field(formData, 'eventTime'),
    hours: field(formData, 'hours'),
    venueName: field(formData, 'venueName'),
    venueAddress: field(formData, 'venueAddress'),
    setupLocation: field(formData, 'setupLocation'),
    paymentMethod: field(formData, 'paymentMethod'),
    galleryText: field(formData, 'galleryText'),
    notes: field(formData, 'notes'),
    agreement: field(formData, 'agreement'),
  };

  if (!data.area || !data.boothType || !data.firstName || !data.lastName || !data.phone || !data.email || !data.eventType || !data.eventDate || !data.hours || !data.venueName || !data.venueAddress || !data.setupLocation || !data.paymentMethod || !data.galleryText || data.agreement !== 'Yes I Agree') {
    redirect('/Photobooth-Enquiry?status=missing');
  }

  const sent = await sendPixilensEmail({
    toUser: data.email,
    userName: fullName(data),
    subject: `Pixilens photobooth enquiry from ${fullName(data)}`,
    text: formatText(data),
    html: formatHtml(data),
  });

  redirect(sent ? '/Photobooth-Enquiry?status=sent' : '/Photobooth-Enquiry?status=email-not-configured');
}

export default async function PhotoboothEnquiryPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const params = await searchParams;
  return (
    <SiteShell>
      <PageHero eyebrow="Photobooth" title="Photobooth enquiry">
        <p>Tell us about your event, booth type, venue, and rental needs. Pixilens will confirm availability and package details.</p>
      </PageHero>

      <section className="mx-auto max-w-5xl px-5 pb-20 md:px-8">
        {params.status === 'sent' ? <div className="glass-panel mb-8 rounded-xl p-5 text-center text-[#17130f]/75">Thank you. Your photobooth enquiry was sent to Pixilens and a confirmation email was sent to you.</div> : null}
        {params.status === 'missing' ? <div className="glass-panel mb-8 rounded-xl border-red-200/70 p-5 text-center text-red-700">Please fill out all required fields before sending.</div> : null}
        {params.status === 'email-not-configured' ? <div className="glass-panel mb-8 rounded-xl border-red-200/70 p-5 text-center text-red-700">Email sending is not configured yet. Please email {contact.email} directly.</div> : null}

        <form action={sendPhotoboothEnquiry} className="glass-panel rounded-xl p-6 md:p-9">
          <div className="grid gap-5 md:grid-cols-2">
            <label className="public-label">Select Area *<select name="area" required className="public-input public-select"><option value="">Please Select</option>{areas.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label className="public-label">Photobooth Type *<select name="boothType" required className="public-input public-select"><option value="">Please Select</option>{boothTypes.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label className="public-label">First Name *<input name="firstName" required className="public-input" /></label>
            <label className="public-label">Last Name *<input name="lastName" required className="public-input" /></label>
            <label className="public-label">Phone Number *<input name="phone" required className="public-input" placeholder="(000) 000-0000" /></label>
            <label className="public-label">Email *<input name="email" type="email" required className="public-input" placeholder="example@example.com" /></label>
            <label className="public-label">Event Type *<select name="eventType" required className="public-input public-select"><option value="">Please Select</option>{eventTypes.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label className="public-label">Event Date *<input name="eventDate" type="date" required className="public-input public-date" /></label>
            <label className="public-label">Event Time<input name="eventTime" type="time" className="public-input public-date" /></label>
            <label className="public-label">Number of Hours *<select name="hours" required className="public-input public-select"><option value="">Please Select</option>{hourOptions.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label className="public-label">Venue Name *<input name="venueName" required className="public-input" placeholder="If home just write home" /></label>
            <label className="public-label">Where will we be setting up? *<select name="setupLocation" required className="public-input public-select"><option value="">Please Select</option>{setupOptions.map((item) => <option key={item}>{item}</option>)}</select></label>
          </div>

          <label className="public-label mt-7 block">Venue Address *<textarea name="venueAddress" required className="public-input min-h-28" placeholder="Street, city, state, zip" /></label>
          <label className="public-label mt-7 block">Payment Method for Deposit of $50 *<select name="paymentMethod" required className="public-input public-select"><option value="">Please Select</option>{paymentOptions.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label className="public-label mt-7 block">What do you want the text to say in the Online Gallery? *<input name="galleryText" required className="public-input" placeholder="Ex. Tommy & Linda's Wedding" /></label>
          <label className="public-label mt-7 block">Additional notes<textarea name="notes" className="public-input min-h-32" placeholder="Anything else we should know?" /></label>

          <div className="mt-8 rounded-xl border border-[#281f16]/10 bg-white/55 p-5 text-sm leading-7 text-[#17130f]/68">
            <p className="font-art gold-text text-xl">Photobooth rental agreement summary</p>
            <p className="mt-3">Pixilens will deliver, set up, and remove the booth. A non-refundable $50 deposit is required to reserve the date. Remaining balance is due before setup or on the event date. Client is responsible for venue access, power, appropriate space, and any equipment damage caused by misuse.</p>
            <label className="mt-4 flex items-center gap-3 text-[#17130f]/78"><input name="agreement" value="Yes I Agree" type="checkbox" required className="accent-[#a87921]" /> Yes I Agree</label>
          </div>

          <button className="glass-button mt-7" type="submit">Submit photobooth enquiry</button>
        </form>
      </section>
    </SiteShell>
  );
}
