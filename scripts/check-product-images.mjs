import assert from 'node:assert/strict';
import sharp from 'sharp';
import { optimizeProductImage } from '../lib/optimize-product-image.ts';

const asArrayBuffer = (buffer) => new Uint8Array(buffer).buffer;

// Oversized camera photos must fit the display limit without changing shape.
const large = await sharp({ create: { width: 2400, height: 1800, channels: 3, background: '#527fa3' } }).png().toBuffer();
const resized = await optimizeProductImage(asArrayBuffer(large));
const metadata = await sharp(resized).metadata();
assert.equal(metadata.format, 'webp');
assert.equal(metadata.width, 1600);
assert.equal(metadata.height, 1200);
assert.ok(resized.length < large.length);

// Small transparent cutouts must retain their size and transparency.
const cutout = await sharp({ create: { width: 40, height: 60, channels: 4, background: { r: 255, g: 0, b: 0, alpha: 0 } } }).png().toBuffer();
const cutoutResult = await optimizeProductImage(asArrayBuffer(cutout));
const cutoutMetadata = await sharp(cutoutResult).metadata();
assert.equal(cutoutMetadata.width, 40);
assert.equal(cutoutMetadata.height, 60);
assert.equal(cutoutMetadata.hasAlpha, true);
const pixels = await sharp(cutoutResult).raw().toBuffer();
assert.equal(pixels[3], 0);

// Camera orientation must be applied before EXIF metadata is stripped.
const rotated = await sharp({ create: { width: 80, height: 40, channels: 3, background: '#ffffff' } }).withMetadata({ orientation: 6 }).jpeg().toBuffer();
const rotatedMetadata = await sharp(await optimizeProductImage(asArrayBuffer(rotated))).metadata();
assert.equal(rotatedMetadata.width, 40);
assert.equal(rotatedMetadata.height, 80);
assert.equal(rotatedMetadata.orientation, undefined);

// A forged PNG signature must not be accepted as a decodable product photo.
await assert.rejects(() => optimizeProductImage(asArrayBuffer(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))));
const hugeHeader = await sharp({ create: { width: 6400, height: 6400, channels: 3, background: '#ffffff' } }).png().toBuffer();
await assert.rejects(() => optimizeProductImage(asArrayBuffer(hugeHeader)));

console.log('Product image checks passed: resize, compression, transparency, orientation, malformed files and pixel limit.');
