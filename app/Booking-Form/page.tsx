import { redirect } from 'next/navigation';
import { PageHero, SiteShell } from '@/components/SiteShell';
import { contact } from '@/lib/site-content';
import { field, formatRows, htmlEscape, sendPixilensEmail } from '@/lib/email';
import { buildCalendarInvite, parseDurationMinutes } from '@/lib/calendar';

export const metadata = {
  title: 'Booking Form - Pixilens Photography',
};

const services = ['Photography Only', 'Videography Only', 'Photo & Video'];
const eventTypes = ['Wedding', 'Quinceañera or Sweet 16', 'Birthday', 'House Warming', 'Portrait Session', 'Family Sessions', 'Engagement', 'Court House Wedding', 'Dance Photography', 'Graduation Ceremony', 'Other Photography services', 'Other Videography Services', 'Mini Session Fall Photography', 'Mini Session Summer Photography', 'Mini Session Senior Photography', 'Mini Session Christmas Photography', 'Mini Session Blue Bonnets Photography', 'Mini Session Dance Photography', 'Mini Session Family Photography', 'Mini Session Couples Photography', 'Mini Session Maternity Photography', 'Mini Session Newborn Photography', "Mini Session Kid's Photography", 'Mini Session Headshot Photography', 'Mini Session Halloween Photography', 'Mini Session Couples Photography', 'Mini Session Fashion Photography', 'Mini Session Model Photography', 'Mini Session Other Photography', 'Product Photography', 'Product Videography', 'Other (Not in List)'];
const deliveryOptions = ['Edited Unlimited Photos in cloud', 'Edited Video Highlights 3 - 5 mins', 'All Raw video clips', 'All Raw Photos (CR2 or CR3 format delivery). Commericial License Extra $600+ charges apply.', 'Edited Video for Entire Event (15 mins to an Hr long video) Extra Charges', 'Photo Prints Extra Charges', 'Password Protected Cloud Storage delivery of Photos and Video (Keep it Private)', 'Other'];
const photoboothOptions = ['Yes with email/SMS/Prints', 'Yes with email & SMS only', 'No'];
const yesNoOptions = ['Yes', 'No'];
const hourOptions = ['15 mins Micro Session', '30 mins Mini Session', '1 hour', '2 hours', '2.5 hours', '3 hours', '3.5 hours', '4 hours', '5 hours', '6 hours', '8 hours'];

const releaseAgreement = `Photography & Videography Release Agreement

I give Pixilens Photography by Priyanka Sarkar the absolute and irrevocable right and permission to use photographs, video, audio, and other media taken of me or my minor child for portfolio, promotion, advertising, marketing, publication, and related business purposes.

I release and discharge the photographer from claims connected with the use of the photographs or media, including claims for libel and invasion of privacy. I understand that Pixilens Photography retains copyright to images and media created during the session or event. A print release may be provided for personal use, but images may not be sold, altered, or used commercially without written permission.

I assume the risks of participating in the activity or event and release Pixilens Photography, its representatives, and assigns from liability to the fullest extent permitted by law. This release is worldwide, perpetual, and binding on my heirs and assigns.`;

type BookingState = {
  name: string;
  email: string;
  address: string;
  phone: string;
  date: string;
  service: string;
  type: string;
  otherType: string;
  delivery: string[];
  otherDelivery: string;
  details: string;
  eventAddress: string;
  includePhotobooth: string;
  youtubeLive: string;
  releaseAgreement: string;
  signature: string;
  totalHours: string;
  numberOfHours: string;
  includeVideoGuestbook: string;
  include360: string;
};

function formatText(data: BookingState) {
  return `New Pixilens booking form\n\nName: ${data.name}\nEmail: ${data.email}\nYour Address: ${data.address}\nPhone Number: ${data.phone}\nDate: ${data.date}\nService: ${data.service}\nType: ${data.type}\nIf other selected above: ${data.otherType || 'Not provided'}\nDelivery: ${data.delivery.join(', ')}\nIf Other Mentioned above in Delivery: ${data.otherDelivery || 'Not provided'}\nEvents Details and Important Notes:\n${data.details}\n\nEvent Address: ${data.eventAddress}\nInclude Digital Photobooth?: ${data.includePhotobooth}\nYoutube Live streaming (1 Camera): ${data.youtubeLive}\nAgree with Release Agreement: ${data.releaseAgreement}\nSignature: ${data.signature}\nTotal Hours: ${data.totalHours}\nNumber of hours: ${data.numberOfHours}\nInclude Digital Video Guestbook?: ${data.includeVideoGuestbook}\n360 videobooth with GoPro: ${data.include360}`;
}

function formatHtml(data: BookingState) {
  return `<div style="font-family:Arial,sans-serif;color:#17130f;line-height:1.5;"><h2 style="color:#a87921;">New Pixilens booking form</h2><table style="border-collapse:collapse;width:100%;max-width:760px;">${formatRows([
    ['Name', data.name],
    ['Email', data.email],
    ['Your Address', data.address],
    ['Phone Number', data.phone],
    ['Date', data.date],
    ['Service', data.service],
    ['Type', data.type],
    ['If other selected above', data.otherType || 'Not provided'],
    ['Delivery', data.delivery.join(', ')],
    ['If Other Mentioned above in Delivery', data.otherDelivery || 'Not provided'],
    ['Event Address', data.eventAddress],
    ['Include Digital Photobooth?', data.includePhotobooth],
    ['Youtube Live streaming (1 Camera)', data.youtubeLive],
    ['Agree with Release Agreement', data.releaseAgreement],
    ['Signature', data.signature],
    ['Total Hours', data.totalHours],
    ['Number of hours', data.numberOfHours],
    ['Include Digital Video Guestbook?', data.includeVideoGuestbook],
    ['360 videobooth with GoPro', data.include360],
  ])}</table><h3 style="color:#a87921;">Events Details and Important Notes</h3><p>${htmlEscape(data.details).replaceAll('\n', '<br>')}</p></div>`;
}

async function sendBookingForm(formData: FormData) {
  'use server';

  const data: BookingState = {
    name: field(formData, 'name'),
    email: field(formData, 'email'),
    address: field(formData, 'address'),
    phone: field(formData, 'phone'),
    date: field(formData, 'date'),
    service: field(formData, 'service'),
    type: field(formData, 'type'),
    otherType: field(formData, 'otherType'),
    delivery: formData.getAll('delivery').map((value) => String(value)).filter(Boolean),
    otherDelivery: field(formData, 'otherDelivery'),
    details: field(formData, 'details'),
    eventAddress: field(formData, 'eventAddress'),
    includePhotobooth: field(formData, 'includePhotobooth'),
    youtubeLive: field(formData, 'youtubeLive'),
    releaseAgreement: field(formData, 'releaseAgreement'),
    signature: field(formData, 'signature'),
    totalHours: field(formData, 'totalHours'),
    numberOfHours: field(formData, 'numberOfHours'),
    includeVideoGuestbook: field(formData, 'includeVideoGuestbook'),
    include360: field(formData, 'include360'),
  };

  if (!data.name || !data.email || !data.address || !data.phone || !data.date || !data.service || !data.type || data.delivery.length === 0 || !data.details || !data.eventAddress || !data.includePhotobooth || !data.youtubeLive || data.releaseAgreement !== 'Yes' || !data.signature || !data.totalHours || !data.numberOfHours || !data.includeVideoGuestbook || !data.include360) {
    redirect('/Booking-Form?status=missing');
  }

  const calendarInvite = buildCalendarInvite({
    summary: `Pixilens Booking — ${data.type}`,
    description: formatText(data),
    location: data.eventAddress,
    attendeeName: data.name,
    attendeeEmail: data.email,
    date: data.date,
    durationMinutes: parseDurationMinutes(data.numberOfHours, parseDurationMinutes(String(data.totalHours), 120)),
    filename: 'pixilens-booking.ics',
  });

  const sent = await sendPixilensEmail({
    toUser: data.email,
    userName: data.name,
    subject: `Pixilens booking form from ${data.name}`,
    text: formatText(data),
    html: formatHtml(data),
    calendarInvite,
  });

  redirect(sent ? '/Booking-Form?status=sent' : '/Booking-Form?status=email-not-configured');
}

export default async function BookingFormPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const params = await searchParams;
  return (
    <SiteShell>
      <PageHero eyebrow="Booking Form" title="Booking Form">
        <p>Book Pixilens photography, videography, photo and video packages, add-ons, and release agreement in one form.</p>
      </PageHero>

      <section className="mx-auto max-w-5xl px-5 pb-20 md:px-8">
        {params.status === 'sent' ? <div className="glass-panel mb-8 rounded-xl p-5 text-center text-[#17130f]/75">Thank you. Your booking form was sent to Pixilens, a confirmation email was sent to you, and a calendar invite was attached.</div> : null}
        {params.status === 'missing' ? <div className="glass-panel mb-8 rounded-xl border-red-200/70 p-5 text-center text-red-700">Please fill out all required fields before sending.</div> : null}
        {params.status === 'email-not-configured' ? <div className="glass-panel mb-8 rounded-xl border-red-200/70 p-5 text-center text-red-700">Email sending is not configured yet. Please email {contact.email} directly.</div> : null}

        <form action={sendBookingForm} className="glass-panel rounded-xl p-6 md:p-9">
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="public-label sm:col-span-2">Name *<input name="name" required className="public-input" /></label>
            <label className="public-label">Email *<input name="email" type="email" required className="public-input" /></label>
            <label className="public-label">Phone Number *<input name="phone" required className="public-input" /></label>
            <label className="public-label sm:col-span-2">Date *<input name="date" type="date" required className="public-input public-date" /></label>
            <label className="public-label">Service *<select name="service" required className="public-input public-select"><option value="">Please Select</option>{services.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label className="public-label">Type *<select name="type" required className="public-input public-select"><option value="">Please Select</option>{eventTypes.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label className="public-label sm:col-span-2">If other selected above<input name="otherType" className="public-input" /></label>
          </div>

          <label className="public-label mt-7 block">Your Address *<textarea name="address" required className="public-input min-h-28" /></label>
          <label className="public-label mt-7 block">Event Address *<textarea name="eventAddress" required className="public-input min-h-28" /></label>

          <fieldset className="mt-7">
            <legend className="public-label mb-3">Delivery *</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {deliveryOptions.map((item) => (
                <label key={item} className="flex items-start gap-3 rounded-lg border border-[#281f16]/10 bg-white/55 p-3 text-sm text-[#17130f]/72">
                  <input name="delivery" value={item} type="checkbox" className="mt-1 accent-[#a87921]" />
                  <span>{item}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <label className="public-label mt-7 block">If Other Mentioned above in Delivery<input name="otherDelivery" className="public-input" /></label>
          <label className="public-label mt-7 block">Events Details and Important Notes *<textarea name="details" required className="public-input min-h-36" /></label>

          <div className="mt-7 grid gap-5 sm:grid-cols-2">
            <label className="public-label">Include Digital Photobooth? Extra charges *<select name="includePhotobooth" required className="public-input public-select"><option value="">Please Select</option>{photoboothOptions.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label className="public-label">Youtube Live streaming (1 Camera) Extra charges *<select name="youtubeLive" required className="public-input public-select"><option value="">Please Select</option>{yesNoOptions.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label className="public-label">Total Hours *<input name="totalHours" type="number" min="1" required className="public-input" /></label>
            <label className="public-label">Number of hours *<select name="numberOfHours" required className="public-input public-select"><option value="">Please Select</option>{hourOptions.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label className="public-label">Include Digital Video Guestbook? Extra charges *<select name="includeVideoGuestbook" required className="public-input public-select"><option value="">Please Select</option>{yesNoOptions.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label className="public-label">360 videobooth with GoPro Extra charges *<select name="include360" required className="public-input public-select"><option value="">Please Select</option>{yesNoOptions.map((item) => <option key={item}>{item}</option>)}</select></label>
          </div>

          <div className="mt-8 rounded-xl border border-[#281f16]/10 bg-white/55 p-5 text-sm leading-7 text-[#17130f]/68">
            <p className="font-art gold-text text-xl">Photography & Videography Release Agreement</p>
            <p className="mt-3 whitespace-pre-line">{releaseAgreement}</p>
            <label className="mt-5 flex items-center gap-3 text-[#17130f]/78"><input name="releaseAgreement" value="Yes" type="checkbox" required className="accent-[#a87921]" /> Agree with Release Agreement</label>
          </div>

          <label className="public-label mt-7 block">Signature *<input name="signature" required className="public-input" placeholder="Type your full name as signature" /></label>
          <button className="glass-button mt-7 cursor-pointer" type="submit">Submit</button>
        </form>
      </section>
    </SiteShell>
  );
}
