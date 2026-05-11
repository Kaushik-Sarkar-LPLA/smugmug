import manifest from '@/data/export/priority-imgbb-upload-manifest.json';

type PriorityAsset = {
  priority_role: 'front-page-slides' | 'site-data';
  sort_order: number;
  file_name: string;
  imgbb_display_url: string;
  width: number;
  height: number;
  source_web_uri: string;
};

const assets = manifest as PriorityAsset[];

export const frontPageSlides = assets
  .filter((asset) => asset.priority_role === 'front-page-slides')
  .sort((a, b) => a.sort_order - b.sort_order);

export const siteDataAssets = assets
  .filter((asset) => asset.priority_role === 'site-data')
  .sort((a, b) => a.sort_order - b.sort_order);

export function findSiteAsset(fileName: string) {
  const normalized = fileName.toLowerCase();
  return siteDataAssets.find((asset) => asset.file_name.toLowerCase() === normalized);
}
