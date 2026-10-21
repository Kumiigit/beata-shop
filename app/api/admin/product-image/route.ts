import { NextResponse } from 'next/server';
import { adminSession } from '@/lib/admin-auth';
import { saveProductImage } from '@/lib/product-image-storage';
import { validAdminOrigin } from '@/lib/admin-origin';
import { optimizeProductImage } from '@/lib/optimize-product-image';

const MAX_BYTES = 5 * 1024 * 1024;
const TYPES = new Map([['image/jpeg', 'jpg'], ['image/png', 'png'], ['image/webp', 'webp']]);

function validSignature(type: string, bytes: Uint8Array) {
  if (type === 'image/jpeg') return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (type === 'image/png') return bytes.slice(0, 8).every((value, index) => value === [137, 80, 78, 71, 13, 10, 26, 10][index]);
  if (type === 'image/webp') return String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP';
  return false;
}

export async function POST(request: Request) {
  if (!(await adminSession())) return NextResponse.json({ error: 'Admin login required.' }, { status: 401 });
  if (!validAdminOrigin(request)) return NextResponse.json({ error: 'Invalid upload origin.' }, { status: 403 });
  if (process.env.NODE_ENV !== 'production' && process.env.DATABASE_URL) return NextResponse.json({ error: 'The local admin uses live catalogue data. Upload new images from the admin panel on beata-shop.co so they are stored with the live shop.' }, { status: 409 });
  const form = await request.formData().catch(() => null);
  const file = form?.get('image');
  if (!(file instanceof File) || !TYPES.has(file.type) || file.size < 1 || file.size > MAX_BYTES) return NextResponse.json({ error: 'Choose a JPG, PNG or WebP image up to 5 MB.' }, { status: 400 });
  const data = await file.arrayBuffer();
  if (!validSignature(file.type, new Uint8Array(data).slice(0, 12))) return NextResponse.json({ error: 'The selected file is not a valid image.' }, { status: 400 });
  let optimized: Buffer;
  try { optimized = await optimizeProductImage(data); }
  catch { return NextResponse.json({ error: 'The image could not be read. Choose a valid JPG, PNG or WebP image up to 40 megapixels.' }, { status: 400 }); }
  const key = `${crypto.randomUUID()}.webp`;
  try { await saveProductImage(key, new Uint8Array(optimized).buffer, 'image/webp'); return NextResponse.json({ url: `/api/product-images/${key}` }); }
  catch (error) {
    console.error('Product image upload failed', { name: error instanceof Error ? error.name : 'Unknown', code: (error as { code?: string }).code });
    return NextResponse.json({ error: 'The image could not be uploaded. Please try again.' }, { status: 500 });
  }
}
