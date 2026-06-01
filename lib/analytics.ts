import { allowSearchIndexing } from '@/lib/seo';

/** GA4 measurement ID (G-XXXXXXXXXX). Set at runtime — no rebuild required. */
export function ga4MeasurementId() {
  return (process.env.GA4_MEASUREMENT_ID || process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID || '').trim();
}

/** Google Search Console HTML meta verification token (content value only). */
export function googleSiteVerification() {
  return (process.env.GOOGLE_SITE_VERIFICATION || '').trim();
}

export function shouldLoadAnalytics() {
  return allowSearchIndexing() && ga4MeasurementId().startsWith('G-');
}
