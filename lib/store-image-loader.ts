'use client';

import type { ImageLoaderProps } from 'next/image';

export default function storeImageLoader({ src, width, quality }: ImageLoaderProps) {
  const params = new URLSearchParams({ url: src, w: String(width), q: String(quality ?? 65) });
  if (process.env.NEXT_PUBLIC_NETLIFY_IMAGE_CDN === 'true') {
    // Crawler Accept headers often omit WebP: explicitly request compression
    // instead of allowing the CDN to return a large original-format PNG.
    params.set('fm', 'webp');
    return `/.netlify/images?${params}`;
  }
  return `/_next/image?${params}`;
}
