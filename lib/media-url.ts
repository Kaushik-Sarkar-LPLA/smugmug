type MediaLike = {
  id?: string;
  type?: string;
  displayUrl?: string;
  publicUrl?: string;
};

/** Prefer full-resolution URL when available. */
export function mediaImageUrl(item: MediaLike | null | undefined) {
  if (!item) return '';
  if (item.type === 'video') return item.publicUrl || item.displayUrl || '';
  return item.publicUrl || item.displayUrl || '';
}

/** Prefer lighter thumbnail URL for grids and cards. */
export function mediaThumbUrl(item: MediaLike | null | undefined) {
  if (!item) return '';
  if (item.displayUrl && item.displayUrl.startsWith('http')) return item.displayUrl;
  if (item.id) return `https://cdn.pixilens.online/${item.id}.jpg`;
  if (item.type !== 'video' && item.publicUrl && item.publicUrl.startsWith('http')) return item.publicUrl;
  return '';
}

