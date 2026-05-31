import { localBusinessJsonLd } from '@/lib/seo';

export function LocalBusinessJsonLd() {
  const data = localBusinessJsonLd();
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
