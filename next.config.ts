import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_NETLIFY_IMAGE_CDN: process.env.NETLIFY === 'true' || process.env.NEXT_PUBLIC_NETLIFY_IMAGE_CDN === 'true' ? 'true' : 'false',
  },
  images: {
    loader: 'custom',
    loaderFile: './lib/store-image-loader.ts',
    formats: ['image/avif', 'image/webp'],
    qualities: [65],
    // Keep swatches and thumbnails small, including on high-density screens.
    imageSizes: [32, 48, 64, 96, 128, 256, 384],
    deviceSizes: [480, 640, 750, 828, 1080, 1200],
  },
};

export default nextConfig;
