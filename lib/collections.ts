import 'server-only';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { getDatabase } from './database';
import type { ProductCollection } from '@/types/collection';

const file = path.join(process.cwd(), 'data', 'local-collections.json');
export async function listCollections(): Promise<ProductCollection[]> {
  if (!process.env.DATABASE_URL) {
    try { return JSON.parse(await fs.readFile(file, 'utf8')); }
    catch (error) { if ((error as NodeJS.ErrnoException).code === 'ENOENT') return []; throw error; }
  }
  try {
    const { rows } = await getDatabase().pool.query('SELECT id, name, category, product_ids AS "productIds" FROM public.shop_collections ORDER BY created_at, id');
    return rows;
  } catch (error) { if ((error as { code?: string }).code === '42P01') return []; throw error; }
}

export async function saveCollection(collection: ProductCollection) {
  if (!process.env.DATABASE_URL) {
    const all = await listCollections();
    const index = all.findIndex(item => item.id === collection.id);
    if (index < 0) all.push(collection); else all[index] = collection;
    await fs.writeFile(file, JSON.stringify(all, null, 2));
    return;
  }
  // Initialise on the first authenticated save, never on a storefront read.
  const client = await getDatabase().pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('CREATE TABLE IF NOT EXISTS public.shop_collections (id text PRIMARY KEY, name text NOT NULL, category text NOT NULL, product_ids jsonb NOT NULL DEFAULT \'[]\', created_at timestamptz NOT NULL DEFAULT now())');
    await client.query('ALTER TABLE public.shop_collections ENABLE ROW LEVEL SECURITY');
    await client.query('INSERT INTO public.shop_collections (id,name,category,product_ids) VALUES ($1,$2,$3,$4) ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name,category=EXCLUDED.category,product_ids=EXCLUDED.product_ids', [collection.id, collection.name, collection.category, JSON.stringify(collection.productIds)]);
    await client.query('COMMIT');
  } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
}

export async function deleteCollection(id: string) {
  if (!process.env.DATABASE_URL) { await fs.writeFile(file, JSON.stringify((await listCollections()).filter(item => item.id !== id), null, 2)); return; }
  await getDatabase().pool.query('DELETE FROM public.shop_collections WHERE id=$1', [id]);
}
