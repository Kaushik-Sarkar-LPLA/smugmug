export const PUBLIC_EXCLUDED_PATH_PREFIX = '/Automatic-iOS-Uploads';

type LibraryItemLike = {
  urlPath?: string;
  slug?: string;
  title?: string;
};

export function isExcludedPublicLibraryItem(item: LibraryItemLike) {
  const path = item.urlPath || '';
  if (path.startsWith(PUBLIC_EXCLUDED_PATH_PREFIX)) return true;

  const slug = (item.slug || '').toLowerCase();
  if (slug === 'automatic-ios-uploads' || slug.startsWith('automatic-ios-uploads/')) return true;

  const normalizedTitle = (item.title || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
  if (normalizedTitle === 'automatic ios uploads') return true;

  return false;
}

export function publicLibrarySqlExclude(alias: string) {
  return `(${alias}.url_path IS NULL OR ${alias}.url_path NOT LIKE '${PUBLIC_EXCLUDED_PATH_PREFIX}%')
    AND lower(${alias}.slug) NOT LIKE 'automatic-ios-uploads%'`;
}
