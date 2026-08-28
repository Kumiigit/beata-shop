import { ensureDatabase } from '@/db/bootstrap';
import { seedProducts } from '@/data/products';
import type { Product, ProductVariant } from '@/types/store';

type ProductRow = { id: string; slug: string; name: string; description: string; category: string; price_pence: number; featured: number; active: number; details_json: string; created_at: string };
type VariantRow = { id: string; product_id: string; sku: string; size: string; stock_on_hand: number; reserved: number; active: number };

export async function listProducts(includeInactive = false): Promise<Product[]> {
  try {
    const db = await ensureDatabase();
    const productRows = await db.prepare(`SELECT id, slug, name, description, category, price_pence, featured, active, details_json, created_at FROM products ${includeInactive ? '' : 'WHERE active = 1'} ORDER BY created_at DESC`).all<ProductRow>();
    const variantRows = await db.prepare('SELECT id, product_id, sku, size, stock_on_hand, reserved, active FROM variants ORDER BY product_id, id').all<VariantRow>();
    const variantsByProduct = new Map<string, ProductVariant[]>();
    for (const row of variantRows.results) {
      const items = variantsByProduct.get(row.product_id) ?? [];
      items.push({ id: row.id, productId: row.product_id, sku: row.sku, size: row.size, stockOnHand: row.stock_on_hand, reserved: row.reserved, available: Math.max(row.stock_on_hand - row.reserved, 0), active: Boolean(row.active) });
      variantsByProduct.set(row.product_id, items);
    }
    return productRows.results.map((row) => ({ id: row.id, slug: row.slug, name: row.name, description: row.description, category: row.category, pricePence: row.price_pence, featured: Boolean(row.featured), active: Boolean(row.active), details: safeDetails(row.details_json), createdAt: row.created_at, variants: variantsByProduct.get(row.id) ?? [] }));
  } catch {
    return seedProducts.filter((product) => includeInactive || product.active);
  }
}

export async function getProduct(slug: string) { return (await listProducts()).find((product) => product.slug === slug); }

function safeDetails(value: string) { try { const parsed = JSON.parse(value); return Array.isArray(parsed) ? parsed.map(String) : []; } catch { return []; } }
