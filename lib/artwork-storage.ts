import 'server-only';
import { getStore } from '@netlify/blobs';

const STORE_NAME = 'beata-custom-artwork';

export async function saveArtwork(key: string, data: ArrayBuffer, metadata: Record<string, string | number>) {
  await getStore(STORE_NAME).set(key, data, { metadata });
}

export async function getArtwork(key: string) {
  return getStore(STORE_NAME).get(key, { type: 'blob' });
}

export async function deleteArtwork(key: string) {
  await getStore(STORE_NAME).delete(key);
}
