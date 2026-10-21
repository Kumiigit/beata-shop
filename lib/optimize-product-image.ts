import sharp from 'sharp';

// Product photos are display assets; customer print artwork uses separate storage.
export async function optimizeProductImage(data: ArrayBuffer) {
  return sharp(Buffer.from(data), { limitInputPixels: 40_000_000 })
    .rotate()
    .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 80, alphaQuality: 100 })
    .toBuffer();
}
