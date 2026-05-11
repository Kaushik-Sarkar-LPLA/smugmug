import portfolioData from '@/app/portfolio-data.json';

export type PortfolioImage = {
  imageKey: string;
  fileName: string;
  url: string;
  webUri: string;
  width: number;
  height: number;
  isVideo: boolean;
};

export type PortfolioGallery = {
  title: string;
  urlName: string;
  webUri: string;
  uri: string;
  imageCount: number;
  cover: PortfolioImage | null;
  images: PortfolioImage[];
};

export type PortfolioCategory = {
  label: string;
  path: string;
  slug: string;
  galleryCount: number;
  galleries: PortfolioGallery[];
};

export const portfolioCategories = portfolioData as PortfolioCategory[];

export function findPortfolioCategory(slug: string) {
  return portfolioCategories.find((category) => category.slug === slug);
}
