/** Normalize a legacy SmugMug pathname for DB lookup. */
export function normalizeLegacyPath(pathname: string) {
  if (!pathname) return '';
  let path = pathname.trim();
  if (!path.startsWith('/')) path = `/${path}`;
  path = path.replace(/\/+$/, '') || '/';
  return path;
}

/** SmugMug stores url_path encoded or decoded — try both. */
export function legacyPathVariants(pathname: string) {
  const normalized = normalizeLegacyPath(pathname);
  const variants = new Set<string>([normalized]);
  try {
    const decoded = decodeURIComponent(normalized);
    variants.add(decoded);
    variants.add(encodeURI(decoded));
  } catch {
    // keep normalized only
  }
  return [...variants];
}

export function isLegacyPhotoPath(pathname: string) {
  return /\/i-[^/]+$/i.test(normalizeLegacyPath(pathname));
}

export function galleryPathFromPhotoPath(pathname: string) {
  const path = normalizeLegacyPath(pathname);
  const match = path.match(/^(.*)\/i-[^/]+$/i);
  return match?.[1] || null;
}
