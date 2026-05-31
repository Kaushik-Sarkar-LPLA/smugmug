import type { Metadata } from 'next';
import { Suspense } from 'react';
import { NavigationProgress } from '@/components/nav/NavigationProgress';
import './globals.css';

export const metadata: Metadata = {
  title: 'Pixilens Photography',
  description: 'Photography, video, live streaming, and photobooth by Pixilens.',
  robots: {
    index: false,
    follow: false,
  },
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
