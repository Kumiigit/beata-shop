import 'server-only';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { getStore } from '@netlify/blobs';

const STORE_NAME = 'beata-product-images';
const localDirectory = path.join(process.cwd(), 'data', 'product-images');
// NETLIFY is a build flag; Lambda's runtime flag also identifies deployed functions.
const isCloudStorage = () => Boolean(process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME);
const usesLiveDatabaseLocally = () => process.env.NODE_ENV !== 'production' && Boolean(process.env.DATABASE_URL);

async function getProductionImage(key: string) {
  if (!usesLiveDatabaseLocally()) return null;
  const response = await fetch(`https://beata-shop.co/api/product-images/${encodeURIComponent(key)}`);
  return response.ok ? response.blob() : null;
}

export async function saveProductImage(key: string, data: ArrayBuffer, contentType: string) {
  if (isCloudStorage()) {
    await getStore(STORE_NAME).set(key, data, { metadata: { contentType } });
    return;
  }
  await fs.mkdir(localDirectory, { recursive: true });
  await fs.writeFile(path.join(localDirectory, key), Buffer.from(data));
}

export async function getProductImage(key: string) {
  if (isCloudStorage()) {
    const image = await getStore(STORE_NAME).get(key, { type: 'blob' });
    return image ?? getProductionImage(key);
  }
  try { return new Blob([await fs.readFile(path.join(localDirectory, key))]); }
  catch { return getProductionImage(key); }
}
