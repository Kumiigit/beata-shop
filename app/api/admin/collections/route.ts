import { adminSession } from '@/lib/admin-auth';
import { validAdminOrigin } from '@/lib/admin-origin';
import { listCollections, saveCollection, deleteCollection } from '@/lib/collections';
import { listProducts } from '@/lib/catalog';
import { revalidateTag } from 'next/cache';
import { COLLECTIONS_TAG } from '@/lib/storefront-catalog';

export async function GET() {
  if (!await adminSession()) return Response.json({ error: 'Please sign in.' }, { status: 401 });
  return Response.json({ collections: await listCollections() });
}
export async function POST(request: Request) {
  if (!await adminSession()) return Response.json({ error: 'Please sign in.' }, { status: 401 });
  if (!validAdminOrigin(request)) return Response.json({ error: 'Invalid origin.' }, { status: 403 });
  const value = await request.json().catch(() => null);
  if (!value || typeof value.id !== 'string' || !/^[\w-]{1,100}$/.test(value.id) || typeof value.name !== 'string' || !value.name.trim() || value.name.length > 80 || typeof value.category !== 'string' || value.category.length > 80 || !Array.isArray(value.productIds) || value.productIds.length > 1000 || !value.productIds.every((id: unknown) => typeof id === 'string')) return Response.json({ error: 'Enter a name, category and valid products.' }, { status: 400 });
  const products = await listProducts(true);
  if (!products.some(p => p.category === value.category) || value.productIds.some((id: string) => !products.some(p => p.id === id && p.category === value.category))) return Response.json({ error: 'Choose products from the collection’s category. Refresh if a product has changed.' }, { status: 400 });
  try {
    await saveCollection({ id: value.id, name: value.name.trim(), category: value.category, productIds: [...new Set<string>(value.productIds)] });
    revalidateTag(COLLECTIONS_TAG, { expire: 0 });
    return Response.json({ collections: await listCollections() });
  } catch { return Response.json({ error: 'Could not save the collection. Check the database connection and table permissions.' }, { status: 500 }); }
}
export async function DELETE(request: Request) {
  if (!await adminSession()) return Response.json({ error: 'Please sign in.' }, { status: 401 });
  if (!validAdminOrigin(request)) return Response.json({ error: 'Invalid origin.' }, { status: 403 });
  const id = new URL(request.url).searchParams.get('id');
  if (!id) return Response.json({ error: 'Collection required.' }, { status: 400 });
  try { await deleteCollection(id); revalidateTag(COLLECTIONS_TAG, { expire: 0 }); return Response.json({ collections: await listCollections() }); }
  catch { return Response.json({ error: 'Could not delete the collection.' }, { status: 500 }); }
}
