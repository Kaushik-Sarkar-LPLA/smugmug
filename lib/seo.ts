import type { Metadata } from 'next';
import { contact } from '@/lib/site-content';

export const business = {
  name: 'Pixilens Photography',
  legalName: 'Pixilens Photography by Priyanka Sarkar',
  tagline: 'Photography, video, live streaming & photobooth',
  email: contact.email,
  phone: contact.phoneDisplay,
  phoneE164: '+17372310033',
  primaryCity: 'Austin',
  primaryRegion: 'TX',
  country: 'US',
  serviceCities: ['Austin', 'Dallas', 'Houston'] as const,
  social: {
    facebook: 'https://facebook.com/pixilens',
    instagram: 'https://instagram.com/pixilens.photography',
    youtube: 'https://www.youtube.com/channel/UCrGsCtzAtC0-xLj9UK0sNcw',
  },
};

export const seoKeywords = [
  'Austin photographer',
  'Austin Texas photographer',
  'Dallas photographer',
  'Houston photographer',
  'Texas wedding photographer',
  'Austin videographer',
  'Dallas videographer',
  'Houston videographer',
  'Austin portrait photographer',
  'event photographer Austin',
  'quinceañera photographer Texas',
  'dance photography Austin',
  'fashion photographer Texas',
  'photobooth Austin',
  'live streaming Austin',
  'Pixilens Photography',
];

export function siteUrl() {
  const raw = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'https://smugmug.pixilens.online';
  return raw.replace(/\/$/, '');
}

/** Set ALLOW_SEARCH_INDEXING=false on private staging. Default: indexable. */
export function allowSearchIndexing() {
  return process.env.ALLOW_SEARCH_INDEXING !== 'false';
}

export function pageTitle(title?: string) {
  if (!title) {
    return `${business.name} | Austin, Dallas & Houston Photographer`;
  }
  return `${title} | ${business.name}`;
}

export function defaultDescription() {
  return `Professional photographer and videographer serving Austin, Dallas, and Houston, Texas. Weddings, portraits, events, fashion, dance, maternity, live streaming, and photobooth by ${business.name}.`;
}

export function buildMetadata({
  title,
  description,
  path = '',
  keywords,
  noIndex,
}: {
  title?: string;
  description?: string;
  path?: string;
  keywords?: string[];
  noIndex?: boolean;
} = {}): Metadata {
  const url = `${siteUrl()}${path.startsWith('/') ? path : path ? `/${path}` : ''}`;
  const desc = description || defaultDescription();
  const indexable = !noIndex && allowSearchIndexing();

  return {
    title: title ? pageTitle(title) : pageTitle(),
    description: desc,
    keywords: (keywords || seoKeywords).join(', '),
    alternates: { canonical: url },
    robots: indexable
      ? { index: true, follow: true, googleBot: { index: true, follow: true } }
      : { index: false, follow: false, googleBot: { index: false, follow: false } },
    openGraph: {
      type: 'website',
      locale: 'en_US',
      url,
      siteName: business.name,
      title: title ? pageTitle(title) : pageTitle(),
      description: desc,
    },
    twitter: {
      card: 'summary_large_image',
      title: title ? pageTitle(title) : pageTitle(),
      description: desc,
    },
  };
}

export function localBusinessJsonLd() {
  const url = siteUrl();
  return {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    '@id': `${url}/#organization`,
    name: business.name,
    url,
    email: business.email,
    telephone: business.phoneE164,
    description: defaultDescription(),
    priceRange: '$$',
    image: `${url}/Pixilens-Portfolio`,
    areaServed: business.serviceCities.map((city) => ({
      '@type': 'City',
      name: city,
      containedInPlace: { '@type': 'State', name: 'Texas' },
    })),
    address: {
      '@type': 'PostalAddress',
      addressLocality: business.primaryCity,
      addressRegion: business.primaryRegion,
      addressCountry: business.country,
    },
    sameAs: [business.social.facebook, business.social.instagram, business.social.youtube],
    knowsAbout: [
      'Wedding photography',
      'Portrait photography',
      'Event photography',
      'Videography',
      'Live streaming',
      'Photobooth rental',
      'Fashion photography',
      'Dance photography',
    ],
  };
}

export const publicSitemapPaths = [
  '/',
  '/Pixilens-Portfolio',
  '/Services-and-Pricing',
  '/About-Us',
  '/Get-Started',
  '/Direct-Message',
  '/Photobooth',
  '/Photobooth-Enquiry',
  '/Booking-Form',
  '/gallery',
  '/Forms',
  '/Release-Agreement',
];
