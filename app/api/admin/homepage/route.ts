import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireAdminRequest } from '@/lib/admin/auth';
import { getHomepageConfig, saveHomepageConfig } from '@/lib/admin/homepage-config';

export async function POST(request: NextRequest) {
  if (!requireAdminRequest(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const form = await request.formData();
  const config = await getHomepageConfig();
  const duration = Number(form.get('slideDurationSeconds') || config.slideDurationSeconds);
  config.slideDurationSeconds = Number.isFinite(duration) && duration >= 2 && duration <= 30 ? duration : config.slideDurationSeconds;

  config.items = config.items.map((item) => {
    const id = item.id;
    const sortOrder = Number(form.get(`sortOrder:${id}`) || item.sortOrder);
    return {
      ...item,
      enabled: form.get(`enabled:${id}`) === 'on',
      useInHero: form.get(`useInHero:${id}`) === 'on',
      useInGallery: form.get(`useInGallery:${id}`) === 'on',
      sortOrder: Number.isFinite(sortOrder) ? sortOrder : item.sortOrder,
      objectPosition: String(form.get(`objectPosition:${id}`) || item.objectPosition || 'center 32%'),
      alt: String(form.get(`alt:${id}`) || item.alt || item.fileName),
    };
  }).sort((a, b) => a.sortOrder - b.sortOrder);

  await saveHomepageConfig(config);
  revalidatePath('/');
  revalidatePath('/admin');
  revalidatePath('/admin/homepage');
  return NextResponse.redirect(new URL('/admin/homepage?saved=1', request.url), 303);
}
