import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/Pixilens-Portfolio/Lifestyle',
        destination: '/Pixilens-Portfolio/pixilens-portfolio-lifestyle',
        permanent: true,
      },
    ];
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '64mb',
    },
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [256, 384, 480, 640, 750, 828],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.pixilens.online',
      },
      {
        protocol: 'https',
        hostname: 'i.ibb.co',
      },
      {
        protocol: 'https',
        hostname: 'photos.smugmug.com',
      },
    ],
  },
};

export default nextConfig;
