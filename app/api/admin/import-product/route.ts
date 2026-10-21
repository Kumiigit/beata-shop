import { adminSession } from '@/lib/admin-auth';
import { validAdminOrigin } from '@/lib/admin-origin';
import { listProducts } from '@/lib/catalog';
import { POST as save } from '../products/route';

export async function POST(request: Request) {
  if (!await adminSession()) return Response.json({ error: 'Please sign in.' }, { status: 401 });
  if (!validAdminOrigin(request)) return Response.json({ error: 'Invalid origin.' }, { status: 403 });
  const body = await request.clone().json().catch(() => null);
  if (!body?.product) return Response.json({ error: 'Product required.' }, { status: 400 });
  const products = await listProducts(true);
  if (products.some(p => p.id === body.product.id || p.slug === body.product.slug)) return Response.json({ error: 'Product already exists; it was not overwritten.' }, { status: 409 });
  return save(request);
}
