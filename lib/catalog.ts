import 'server-only';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { getDatabase } from '@netlify/database';
import { seedProducts } from '@/data/products';
import type { Product, ProductVariant } from '@/types/store';

type ProductRow = { id: string; slug: string; name: string; description: string; category: string; price_pence: number; featured: boolean; active: boolean; details_json: string[] | string; created_at: string | Date };
type VariantRow = { id: string; product_id: string; sku: string; size: string; stock_on_hand: number; reserved: number; active: boolean };
const localPath = path.join(process.cwd(), 'data', 'local-inventory.json');

function hasDatabase() { return Boolean(process.env.NETLIFY_DB_URL); }

async function readLocal(): Promise<Product[]> {
  try { return JSON.parse(await fs.readFile(localPath, 'utf8')) as Product[]; }
  catch { return structuredClone(seedProducts); }
}

async function writeLocal(products: Product[]) { await fs.writeFile(localPath, `${JSON.stringify(products, null, 2)}\n`, 'utf8'); }

async function seedDatabase() {
  const db = getDatabase();
  const [{ count }] = await db.sql<{ count: string }>`SELECT COUNT(*)::text AS count FROM products`;
  if (Number(count) > 0) return;
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    for (const product of seedProducts) {
      await client.query('INSERT INTO products (id, slug, name, description, category, price_pence, featured, active, details_json, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW())', [product.id, product.slug, product.name, product.description, product.category, product.pricePence, product.featured, product.active, JSON.stringify(product.details), product.createdAt]);
      for (const variant of product.variants) await client.query('INSERT INTO variants (id, product_id, sku, size, stock_on_hand, reserved, active) VALUES ($1,$2,$3,$4,$5,0,$6)', [variant.id, product.id, variant.sku, variant.size, variant.stockOnHand, variant.active]);
    }
    await client.query('COMMIT');
  } catch (error) { await client.query('ROLLBACK'); throw error; }
  finally { client.release(); }
}

export async function listProducts(includeInactive = false): Promise<Product[]> {
  if (!hasDatabase()) { const products = await readLocal(); return products.filter((product) => includeInactive || product.active); }
  await seedDatabase();
  const db = getDatabase();
  const productRows = await db.sql<ProductRow>`SELECT id, slug, name, description, category, price_pence, featured, active, details_json, created_at FROM products ORDER BY created_at DESC`;
  const variantRows = await db.sql<VariantRow>`SELECT id, product_id, sku, size, stock_on_hand, reserved, active FROM variants ORDER BY product_id, id`;
  const variants = new Map<string, ProductVariant[]>();
  for (const row of variantRows) { const group = variants.get(row.product_id) ?? []; group.push({ id: row.id, productId: row.product_id, sku: row.sku, size: row.size, stockOnHand: row.stock_on_hand, reserved: row.reserved, available: Math.max(row.stock_on_hand - row.reserved, 0), active: row.active }); variants.set(row.product_id, group); }
  return productRows.filter((row) => includeInactive || row.active).map((row) => ({ id: row.id, slug: row.slug, name: row.name, description: row.description, category: row.category, pricePence: row.price_pence, featured: row.featured, active: row.active, details: Array.isArray(row.details_json) ? row.details_json.map(String) : safeDetails(row.details_json), createdAt: new Date(row.created_at).toISOString(), variants: variants.get(row.id) ?? [] }));
}

export async function getProduct(slug: string) { return (await listProducts()).find((product) => product.slug === slug); }

export async function saveProduct(product: Product) {
  if (!hasDatabase()) { const products = await readLocal(); const index = products.findIndex((item) => item.id === product.id); if (index >= 0) products[index] = product; else products.unshift(product); await writeLocal(products); return; }
  const db = getDatabase(); const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`INSERT INTO products (id, slug, name, description, category, price_pence, featured, active, details_json, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW()) ON CONFLICT (id) DO UPDATE SET slug=EXCLUDED.slug,name=EXCLUDED.name,description=EXCLUDED.description,category=EXCLUDED.category,price_pence=EXCLUDED.price_pence,featured=EXCLUDED.featured,active=EXCLUDED.active,details_json=EXCLUDED.details_json,updated_at=NOW()`, [product.id, product.slug, product.name, product.description, product.category, product.pricePence, product.featured, product.active, JSON.stringify(product.details), product.createdAt]);
    const ids = product.variants.map((variant) => variant.id);
    if (ids.length) await client.query('DELETE FROM variants WHERE product_id = $1 AND NOT (id = ANY($2::text[]))', [product.id, ids]); else await client.query('DELETE FROM variants WHERE product_id = $1', [product.id]);
    for (const variant of product.variants) await client.query(`INSERT INTO variants (id, product_id, sku, size, stock_on_hand, reserved, active) VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (id) DO UPDATE SET sku=EXCLUDED.sku,size=EXCLUDED.size,stock_on_hand=EXCLUDED.stock_on_hand,reserved=EXCLUDED.reserved,active=EXCLUDED.active`, [variant.id, product.id, variant.sku, variant.size, variant.stockOnHand, variant.reserved, variant.active]);
    await client.query('COMMIT');
  } catch (error) { await client.query('ROLLBACK'); throw error; }
  finally { client.release(); }
}

export async function deleteProduct(id: string) {
  if (!hasDatabase()) { await writeLocal((await readLocal()).filter((product) => product.id !== id)); return; }
  const db = getDatabase(); await db.sql`DELETE FROM products WHERE id = ${id}`;
}

function safeDetails(value: string) { try { const parsed = JSON.parse(value); return Array.isArray(parsed) ? parsed.map(String) : []; } catch { return []; } }
