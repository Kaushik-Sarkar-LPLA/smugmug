import Link from 'next/link';
import { business } from '@/lib/seo';

const markets = [
  {
    city: 'Austin',
    text: 'Based in Austin, Texas, we photograph weddings, quinceañeras, senior portraits, dance recitals, corporate events, and family sessions across the Austin metro — from downtown to Round Rock, Cedar Park, and Georgetown.',
  },
  {
    city: 'Dallas',
    text: 'We travel to Dallas and the DFW area for weddings, fashion editorials, product shoots, headshots, and large-scale events. Book a Dallas photography or videography session for your next campaign or celebration.',
  },
  {
    city: 'Houston',
    text: 'Houston clients choose Pixilens for portrait sessions, maternity and newborn photography, live streaming, photobooth rentals, and full event coverage throughout the Houston metro and greater Texas.',
  },
];

export function LocalServiceAreaSection() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-20" aria-labelledby="service-areas-heading">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-xs uppercase tracking-[0.38em] text-[#17130f]/45">Service areas</p>
        <h2 id="service-areas-heading" className="gold-text mt-4 text-3xl font-light tracking-[0.1em] md:text-4xl">
          Austin, Dallas &amp; Houston photographer
        </h2>
        <p className="mt-6 text-base leading-8 text-[#17130f]/70 md:text-lg">
          {business.name} is a Texas photographer and videographer serving {business.serviceCities.join(', ')}, and
          surrounding communities. Whether you need a wedding photographer in Austin, event coverage in Dallas, or
          portrait photography in Houston, our team delivers polished images, cinematic video, and reliable on-site
          production including live streaming and photobooth experiences.
        </p>
      </div>
      <div className="mt-12 grid gap-5 md:grid-cols-3">
        {markets.map((market) => (
          <article key={market.city} className="glass-panel rounded-xl p-6 md:p-7">
            <h3 className="gold-text text-xl font-light tracking-[0.08em]">{market.city}, Texas</h3>
            <p className="mt-4 text-sm leading-7 text-[#17130f]/70">{market.text}</p>
          </article>
        ))}
      </div>
      <div className="mt-10 flex flex-wrap justify-center gap-4">
        <Link href="/Services-and-Pricing" className="glass-button">View services</Link>
        <Link href="/Get-Started" className="glass-button">Book a session</Link>
      </div>
    </section>
  );
}
