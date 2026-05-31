import type { Metadata } from 'next';
import { Suspense } from 'react';
import { NavigationProgress } from '@/components/nav/NavigationProgress';
import { buildMetadata, siteUrl } from '@/lib/seo';
import './globals.css';

export const metadata: Metadata = {
  ...buildMetadata(),
  metadataBase: new URL(siteUrl()),
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://i.ibb.co" crossOrigin="" />
        <link rel="dns-prefetch" href="https://i.ibb.co" />
      </head>
      <body>
        <Suspense fallback={null}>
          <NavigationProgress />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
