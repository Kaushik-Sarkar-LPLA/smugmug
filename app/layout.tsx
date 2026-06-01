import type { Metadata } from 'next';
import { Suspense } from 'react';
import { NavigationProgress } from '@/components/nav/NavigationProgress';
import { GoogleAnalytics } from '@/components/analytics/GoogleAnalytics';
import { ga4MeasurementId, shouldLoadAnalytics } from '@/lib/analytics';
import { buildMetadata, siteUrl } from '@/lib/seo';
import './globals.css';

export const metadata: Metadata = {
  ...buildMetadata(),
  metadataBase: new URL(siteUrl()),
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const measurementId = ga4MeasurementId();

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://i.ibb.co" crossOrigin="" />
        <link rel="dns-prefetch" href="https://i.ibb.co" />
      </head>
      <body>
        {shouldLoadAnalytics() ? <GoogleAnalytics measurementId={measurementId} /> : null}
        <Suspense fallback={null}>
          <NavigationProgress />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
