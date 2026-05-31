type MediaLike = {
  type?: string;
  displayUrl?: string;
  publicUrl?: string;
};

/** Prefer full-resolution URL when available. */
export function mediaImageUrl(item: MediaLike | null | undefined) {
  if (!item) return '';
  if (item.type === 'video') return item.publicUrl || '';
  return item.publicUrl || item.displayUrl || '';
}

/** Prefer lighter thumbnail URL for grids and cards. */
export function mediaThumbUrl(item: MediaLike | null | undefined) {
  if (!item) return '';
  if (item.type === 'video') return item.publicUrl || '';
  return item.displayUrl || item.publicUrl || '';
}
