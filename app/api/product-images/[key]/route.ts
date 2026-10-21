import { getProductImage } from '@/lib/product-image-storage';

const TYPES: Record<string, string> = { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };

export async function GET(_request: Request, context: { params: Promise<{ key: string }> }) {
  const { key } = await context.params;
  const match = /^([0-9a-f-]{36})\.(jpg|png|webp)$/i.exec(key);
  if (!match) return new Response('Not found', { status: 404 });
  const image = await getProductImage(key);
  if (!image) return new Response('Not found', { status: 404 });
  return new Response(image, { headers: { 'Content-Type': TYPES[match[2].toLowerCase()], 'Cache-Control': 'public, max-age=31536000, immutable', 'Netlify-CDN-Cache-Control': 'public, max-age=31536000, durable', 'X-Content-Type-Options': 'nosniff' } });
}
