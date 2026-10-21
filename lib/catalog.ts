import 'server-only';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { getDatabase } from '@/lib/database';
import { seedProducts } from '@/data/products';
import type { Product, ProductColour, ProductVariant } from '@/types/store';
import { isProductAudience, type ProductAudience } from '@/lib/product-audiences';

type ProductRow = { id: string; slug: string; name: string; description: string; category: string; price_pence: number; featured: boolean; active: boolean; details_json: unknown; created_at: string | Date };
type VariantRow = { id: string; product_id: string; sku: string; size: string; stock_on_hand: number; reserved: number; active: boolean; print_area_width_cm: string | number; print_area_height_cm: string | number };
const localPath = path.join(process.cwd(), 'data', 'local-inventory.json');

function hasDatabase() { return Boolean(process.env.DATABASE_URL); }

async function readLocal(): Promise<Product[]> {
  try { return JSON.parse(await fs.readFile(localPath, 'utf8')) as Product[]; }
  catch { return structuredClone(seedProducts); }
}

async function writeLocal(products: Product[]) { await fs.writeFile(localPath, `${JSON.stringify(products, null, 2)}\n`, 'utf8'); }

let seedReady: Promise<void> | undefined;
async function seedDatabase() {
  seedReady ??= initialiseDatabase().catch((error) => { seedReady = undefined; throw error; });
  await seedReady;
}

async function initialiseDatabase() {
  const db = getDatabase();
  const [{ count }] = await db.sql<{ count: string }>`SELECT COUNT(*)::text AS count FROM products`;
  if (Number(count) > 0) return;
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    for (const product of seedProducts) {
      await client.query('INSERT INTO products (id, slug, name, description, category, price_pence, featured, active, details_json, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW())', [product.id, product.slug, product.name, product.description, product.category, product.pricePence, product.featured, product.active, JSON.stringify(product.details), product.createdAt]);
      for (const variant of product.variants) await client.query('INSERT INTO variants (id, product_id, sku, size, stock_on_hand, reserved, active, print_area_width_cm, print_area_height_cm) VALUES ($1,$2,$3,$4,$5,0,$6,$7,$8)', [variant.id, product.id, variant.sku, variant.size, variant.stockOnHand, variant.active, variant.printAreaWidthCm ?? 40.4, variant.printAreaHeightCm ?? 65]);
    }
    await client.query('COMMIT');
  } catch (error) { await client.query('ROLLBACK'); throw error; }
  finally { client.release(); }
}

export async function listProducts(includeInactive = false): Promise<Product[]> {
  if (!hasDatabase()) { const products = await readLocal(); return products.filter((product) => includeInactive || product.active); }
  await seedDatabase();
  const db = getDatabase();
  const [productRows, variantRows] = await Promise.all([
    db.sql<ProductRow>`SELECT id, slug, name, description, category, price_pence, featured, active, details_json, created_at FROM products ORDER BY created_at DESC`,
    db.sql<VariantRow>`SELECT id, product_id, sku, size, stock_on_hand, reserved, active, print_area_width_cm, print_area_height_cm FROM variants ORDER BY product_id, id`,
  ]);
  const variants = new Map<string, ProductVariant[]>();
  for (const row of variantRows) { const group = variants.get(row.product_id) ?? []; group.push({ id: row.id, productId: row.product_id, sku: row.sku, size: row.size, stockOnHand: row.stock_on_hand, reserved: row.reserved, available: Math.max(row.stock_on_hand - row.reserved, 0), active: row.active, printAreaWidthCm: Number(row.print_area_width_cm), printAreaHeightCm: Number(row.print_area_height_cm) }); variants.set(row.product_id, group); }
  return productRows.filter((row) => includeInactive || row.active).map((row) => { const presentation = safePresentation(row.details_json); return ({ id: row.id, slug: row.slug, name: row.name, description: row.description, category: row.category, audiences: presentation.audiences, pricePence: row.price_pence, featured: row.featured, active: row.active, customPrintingAvailable: presentation.customPrintingAvailable, details: presentation.details, imageUrls: presentation.imageUrls, colours: presentation.colours, createdAt: new Date(row.created_at).toISOString(), variants: variants.get(row.id) ?? [] }); });
}

export async function getProduct(slug: string) { return (await listProducts()).find((product) => product.slug === slug); }

export async function saveProduct(product: Product) {
  if (!hasDatabase()) { const products = await readLocal(); const index = products.findIndex((item) => item.id === product.id); if (index >= 0) products[index] = product; else products.unshift(product); await writeLocal(products); return; }
  const db = getDatabase(); const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`INSERT INTO products (id, slug, name, description, category, price_pence, featured, active, details_json, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW()) ON CONFLICT (id) DO UPDATE SET slug=EXCLUDED.slug,name=EXCLUDED.name,description=EXCLUDED.description,category=EXCLUDED.category,price_pence=EXCLUDED.price_pence,featured=EXCLUDED.featured,active=EXCLUDED.active,details_json=EXCLUDED.details_json,updated_at=NOW()`, [product.id, product.slug, product.name, product.description, product.category, product.pricePence, product.featured, product.active, JSON.stringify({ details: product.details, audiences: product.audiences ?? [], imageUrls: product.imageUrls ?? [], colours: product.colours ?? [], customPrintingAvailable: product.customPrintingAvailable === true }), product.createdAt]);
    const ids = product.variants.map((variant) => variant.id);
    if (ids.length) await client.query('DELETE FROM variants WHERE product_id = $1 AND NOT (id = ANY($2::text[]))', [product.id, ids]); else await client.query('DELETE FROM variants WHERE product_id = $1', [product.id]);
    for (const variant of product.variants) await client.query(`INSERT INTO variants (id, product_id, sku, size, stock_on_hand, reserved, active, print_area_width_cm, print_area_height_cm) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT (id) DO UPDATE SET sku=EXCLUDED.sku,size=EXCLUDED.size,stock_on_hand=EXCLUDED.stock_on_hand,reserved=EXCLUDED.reserved,active=EXCLUDED.active,print_area_width_cm=EXCLUDED.print_area_width_cm,print_area_height_cm=EXCLUDED.print_area_height_cm`, [variant.id, product.id, variant.sku, variant.size, variant.stockOnHand, variant.reserved, variant.active, variant.printAreaWidthCm ?? 40.4, variant.printAreaHeightCm ?? 65]);
    await client.query('COMMIT');
  } catch (error) { await client.query('ROLLBACK'); throw error; }
  finally { client.release(); }
}

export async function deleteProduct(id: string) {
  if (!hasDatabase()) { await writeLocal((await readLocal()).filter((product) => product.id !== id)); return; }
  const db = getDatabase(); await db.sql`DELETE FROM products WHERE id = ${id}`;
}

function safePresentation(value: unknown): { details: string[]; audiences: ProductAudience[]; imageUrls: string[]; colours: ProductColour[]; customPrintingAvailable: boolean } {
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    if (Array.isArray(parsed)) return { details: parsed.map(String), audiences: [], imageUrls: [], colours: [], customPrintingAvailable: false };
    if (!parsed || typeof parsed !== 'object') return { details: [], audiences: [], imageUrls: [], colours: [], customPrintingAvailable: false };
    const data = parsed as { details?: unknown; audiences?: unknown; imageUrls?: unknown; colours?: unknown; customPrintingAvailable?: unknown };
    return {
      details: Array.isArray(data.details) ? data.details.map(String) : [],
      audiences: Array.isArray(data.audiences) ? data.audiences.filter(isProductAudience) : [],
      imageUrls: Array.isArray(data.imageUrls) ? data.imageUrls.filter((item): item is string => typeof item === 'string') : [],
      colours: Array.isArray(data.colours) ? data.colours.filter((item): item is ProductColour => Boolean(item && typeof item === 'object' && typeof (item as ProductColour).id === 'string' && typeof (item as ProductColour).name === 'string')) : [],
      customPrintingAvailable: data.customPrintingAvailable === true,
    };
  } catch { return { details: [], audiences: [], imageUrls: [], colours: [], customPrintingAvailable: false }; }
}
