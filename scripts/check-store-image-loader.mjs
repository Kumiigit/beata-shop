import assert from 'node:assert/strict';
import loader from '../lib/store-image-loader.ts';

const original = process.env.NEXT_PUBLIC_NETLIFY_IMAGE_CDN;
try {
  for (const cdn of ['true', 'false']) {
    process.env.NEXT_PUBLIC_NETLIFY_IMAGE_CDN = cdn;
    const src = '/api/product-images/photo.png?version=2&name=a b';
    const url = new URL(loader({ src, width: 384 }), 'https://beata-shop.co');
    assert.equal(url.pathname, cdn === 'true' ? '/.netlify/images' : '/_next/image');
    assert.equal(url.searchParams.get('url'), src);
    assert.equal(url.searchParams.get('w'), '384');
    assert.equal(url.searchParams.get('q'), '65');
    assert.equal(url.searchParams.get('fm'), cdn === 'true' ? 'webp' : null);
  }
} finally {
  if (original === undefined) delete process.env.NEXT_PUBLIC_NETLIFY_IMAGE_CDN;
  else process.env.NEXT_PUBLIC_NETLIFY_IMAGE_CDN = original;
}
console.log('Image loader checks passed: crawler-safe WebP, development fallback and source URL encoding.');
