'use client';

import type { FormEvent } from 'react';
import { useState } from 'react';

const eventTypes = ['Wedding', 'Birthday Party', 'Quinceanera', 'Sweet 16', '18th Debut', '1st Birthday', 'Baby Shower', 'Bar & Bat Mitzvah', 'Prom', 'Graduation', 'Christening', 'Corporate', 'Halloween', 'Christmas', 'Fundraiser', 'Festival', 'Other'];
const setupOptions = ['Indoors', 'Outdoors', 'Both'];
const paymentOptions = ['Zelle - 737 231 0033 (Pixilens LLC) [Preferred]', 'CashApp - https://cash.app/$pixilensphotography'];
const attendantOptions = ['Yes', 'No'];
const hourOptions = ['2 hours', '3 hours', '4 hours', '5 hours', '6 hours'];
const areas = ['Austin and Surrounding cities (TX)', 'Phoenix and Surrounding cities (AZ)'];
const boothTypes = ['360 Photobooth', 'Video Guest Book', 'Photobooth (IPAD)'];

const boothImages = {
  threeSixty: [
    { label: '360 Platform', src: 'https://www.jotform.com/uploads/pixilens/form_files/360-Platform-removebg-preview.677604fc53ea52.65615481.png' },
    { label: '360 Photobooth Setup', src: 'https://www.jotform.com/uploads/pixilens/form_files/Untitled.68c9f9aa79eb72.43379710.png' },
  ],
  standard: [
    { label: 'Digital Booth Setup', src: 'https://www.jotform.com/uploads/pixilens/form_files/split_1445x.6776053aa32942.06651781.webp' },
    { label: 'Photobooth by Pixilens', src: 'https://www.jotform.com/uploads/pixilens/form_files/i-jwPFqJV-X3.68c9f823ac6311.25511216.png' },
  ],
};

const backdropOptions = [
  { label: 'Gold Sequin', src: 'https://www.jotform.com/uploads/pixilens/form_files/81xxS8uMjmL._AC_SL1200_.66ce8d12d47508.12274019.jpg' },
  { label: 'Silver Sequin', src: 'https://www.jotform.com/uploads/pixilens/form_files/silver.66ce8d9c48c285.05943534.jpg' },
  { label: 'Rose Gold Sequin', src: 'https://www.jotform.com/uploads/pixilens/form_files/81oOX21YqIL._AC_SL1500_.67760740d309c6.98407710.jpg' },
  { label: 'Blue Sequin', src: 'https://www.jotform.com/uploads/pixilens/form_files/81km_dA1TqL._AC_SL1100_.66ce8de2aee3e3.68626385.jpg' },
  { label: 'Black Sequin', src: 'https://www.jotform.com/uploads/pixilens/form_files/91UqOFGfBNL._AC_SL1500_.66ce8e3db72e69.92660219.jpg' },
  { label: 'Red Sequin', src: 'https://www.jotform.com/uploads/pixilens/form_files/91BcddKHQSL._AC_SL1500_.66ce8e586d5001.15064880.jpg' },
];

type Props = {
  action: (formData: FormData) => void | Promise<void>;
  agreementText: string;
};

export function PhotoboothRentalForm({ action, agreementText }: Props) {
  const [photoboothType, setPhotoboothType] = useState('');
  const [eventType, setEventType] = useState('');
  const showStandardBoothImages = photoboothType === 'Video Guest Book' || photoboothType === 'Photobooth (IPAD)';
  const show360BoothImages = photoboothType === '360 Photobooth';
  const showIpadOptions = photoboothType === 'Photobooth (IPAD)';

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (showIpadOptions) return;
    const form = event.currentTarget;
    form.querySelectorAll<HTMLInputElement>('input[name="backdrop"], input[name="attendantRequired"]').forEach((input) => {
      input.checked = false;
    });
  }

  return (
    <form action={action} onSubmit={handleSubmit} className="glass-panel rounded-xl p-6 md:p-9">
      <div className="grid gap-5 md:grid-cols-2">
        <label className="public-label">Select Area *<select name="area" required className="public-input public-select"><option value="">Please Select</option>{areas.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label className="public-label">Photobooth Type *<select name="photoboothType" required value={photoboothType} onChange={(event) => setPhotoboothType(event.target.value)} className="public-input public-select"><option value="">Please Select</option>{boothTypes.map((item) => <option key={item}>{item}</option>)}</select></label>
      </div>

      {show360BoothImages ? <BoothImages images={boothImages.threeSixty} /> : null}
      {showStandardBoothImages ? <BoothImages images={boothImages.standard} /> : null}

      <div className="mt-7 grid gap-5 md:grid-cols-2">
        <label className="public-label">First Name *<input name="firstName" required className="public-input" /></label>
        <label className="public-label">Last Name *<input name="lastName" required className="public-input" /></label>
        <label className="public-label">Phone Number *<input name="phone" required className="public-input" placeholder="(000) 000-0000" /></label>
        <label className="public-label">Email *<input name="email" type="email" required className="public-input" /></label>
      </div>

      <fieldset className="mt-7">
        <legend className="public-label mb-3">Event Type *</legend>
        <div className="grid gap-3 md:grid-cols-3">
          {eventTypes.map((item) => (
            <label key={item} className="flex items-start gap-3 rounded-lg border border-[#281f16]/10 bg-white/55 p-3 text-sm text-[#17130f]/72">
              <input name="eventType" value={item} type="radio" required className="mt-1 accent-[#a87921]" onChange={(event) => setEventType(event.target.value)} />
              <span>{item}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {eventType === 'Other' ? <label className="public-label mt-5 block">Other Event Type *<input name="otherEventType" required className="public-input" /></label> : null}

      <div className="mt-7 grid gap-5 md:grid-cols-2">
        <label className="public-label">Event Date *<input name="eventDate" type="date" required className="public-input public-date" /></label>
        <label className="public-label">Event Time *<input name="eventTime" type="time" required className="public-input public-date" /></label>
        <label className="public-label">Number of Hours *<select name="numberOfHours" required className="public-input public-select"><option value="">Please Select</option>{hourOptions.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label className="public-label">Venue Name *<input name="venueName" required className="public-input" placeholder="If home just write home" /></label>
        <label className="public-label">Where will we be setting up? *<select name="setupLocation" required className="public-input public-select"><option value="">Please Select</option>{setupOptions.map((item) => <option key={item}>{item}</option>)}</select></label>
      </div>

      <fieldset className="mt-7">
        <legend className="public-label mb-3">Venue Address *</legend>
        <div className="grid gap-5 md:grid-cols-2">
          <label className="public-label md:col-span-2">Street Address *<input name="venueStreet" required className="public-input" /></label>
          <label className="public-label md:col-span-2">Street Address Line 2<input name="venueStreet2" className="public-input" /></label>
          <label className="public-label">City *<input name="venueCity" required className="public-input" /></label>
          <label className="public-label">State / Province *<input name="venueState" required className="public-input" /></label>
          <label className="public-label">Postal / Zip Code *<input name="venueZip" required className="public-input" /></label>
        </div>
      </fieldset>

      {showIpadOptions ? (
        <>
          <fieldset className="mt-8">
            <legend className="public-label mb-3">Choose A Backdrop *</legend>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {backdropOptions.map((item) => (
                <label key={item.label} className="group cursor-pointer rounded-xl border border-[#281f16]/10 bg-white/55 p-3 text-sm text-[#17130f]/70 transition hover:-translate-y-1 hover:shadow-lg">
                  <input name="backdrop" value={item.label} type="radio" required={showIpadOptions} className="peer sr-only" />
                  <span className="block overflow-hidden rounded-lg border border-transparent bg-white/80 peer-checked:border-[#a87921] peer-checked:ring-2 peer-checked:ring-[#a87921]/30">
                    <img src={item.src} alt={item.label} className="h-48 w-full object-cover" />
                  </span>
                  <span className="gold-text mt-3 block text-center peer-checked:font-semibold">{item.label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <label className="public-label mt-7 block">Attendant required? Extra $50 per hour *<select name="attendantRequired" required={showIpadOptions} className="public-input public-select"><option value="">Please Select</option>{['Yes', 'No'].map((item) => <option key={item}>{item}</option>)}</select></label>
        </>
      ) : null}

      <label className="public-label mt-7 block">Payment Method for Deposit of $50. Rest of the remaining payment should be done prior to setting up Photobooth at the Event. We accept cash also for balance dues. *<select name="paymentMethod" required className="public-input public-select"><option value="">Please Select</option>{paymentOptions.map((item) => <option key={item}>{item}</option>)}</select></label>
      <label className="public-label mt-7 block">What do you want the text to say in the Online Gallery? *<textarea name="galleryText" required className="public-input min-h-28" placeholder="Ex. Tommy & Linda's Wedding" /></label>

      <div className="mt-8 max-h-[34rem] overflow-y-auto rounded-xl border border-[#281f16]/10 bg-white/55 p-5 text-sm leading-7 text-[#17130f]/68">
        <p className="font-art gold-text text-xl">Photobooth rental agreement</p>
        <p className="mt-3 whitespace-pre-line">{agreementText}</p>
      </div>

      <label className="public-label mt-7 block">Sign here<input name="signature" className="public-input" placeholder="Type your full name as signature" /></label>
      <fieldset className="mt-7">
        <legend className="public-label mb-3">Please read the Photobooth rental agreement and Agree *</legend>
        <label className="flex items-center gap-3 rounded-lg border border-[#281f16]/10 bg-white/55 p-3 text-sm text-[#17130f]/72"><input name="agreement" value="Yes I Agree" type="radio" required className="accent-[#a87921]" /> Yes I Agree</label>
      </fieldset>

      <button className="glass-button mt-7" type="submit">Submit</button>
      <p className="mt-6 text-center text-sm text-[#17130f]/55">Thanks for choosing us.</p>
    </form>
  );
}

function BoothImages({ images }: { images: Array<{ label: string; src: string }> }) {
  return (
    <div className="mt-8">
      <p className="public-label mb-3">Booth preview</p>
      <div className="grid gap-4 md:grid-cols-2">
        {images.map((item) => (
          <div key={item.src} className="rounded-xl border border-[#281f16]/10 bg-white/55 p-3 text-center text-sm text-[#17130f]/70">
            <img src={item.src} alt={item.label} className="mx-auto max-h-96 w-full rounded-lg object-contain" />
            <p className="gold-text mt-3">{item.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
