import { seedProducts } from '@/data/products';
import { getD1 } from './index';

const statements = [
  `CREATE TABLE IF NOT EXISTS products (id TEXT PRIMARY KEY, slug TEXT NOT NULL UNIQUE, name TEXT NOT NULL, description TEXT NOT NULL, category TEXT NOT NULL, price_pence INTEGER NOT NULL CHECK(price_pence >= 0), featured INTEGER NOT NULL DEFAULT 0, active INTEGER NOT NULL DEFAULT 1, details_json TEXT NOT NULL DEFAULT '[]', created_at TEXT NOT NULL, updated_at TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS variants (id TEXT PRIMARY KEY, product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE, sku TEXT NOT NULL UNIQUE, size TEXT NOT NULL, stock_on_hand INTEGER NOT NULL DEFAULT 0 CHECK(stock_on_hand >= 0), reserved INTEGER NOT NULL DEFAULT 0 CHECK(reserved >= 0), active INTEGER NOT NULL DEFAULT 1, UNIQUE(product_id, size))`,
  `CREATE TABLE IF NOT EXISTS orders (id TEXT PRIMARY KEY, stripe_session_id TEXT UNIQUE, status TEXT NOT NULL, customer_email TEXT, subtotal_pence INTEGER NOT NULL, shipping_pence INTEGER NOT NULL, total_pence INTEGER NOT NULL, reservation_expires_at TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS order_items (id TEXT PRIMARY KEY, order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE, variant_id TEXT NOT NULL, product_name TEXT NOT NULL, size TEXT NOT NULL, unit_price_pence INTEGER NOT NULL, quantity INTEGER NOT NULL CHECK(quantity > 0))`,
  `CREATE TABLE IF NOT EXISTS webhook_events (id TEXT PRIMARY KEY, event_type TEXT NOT NULL, processed_at TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS newsletter_subscribers (email TEXT PRIMARY KEY, created_at TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS content_migrations (id TEXT PRIMARY KEY, applied_at TEXT NOT NULL)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_products_slug ON products(slug)`,
  `CREATE INDEX IF NOT EXISTS idx_products_active_category ON products(active, category)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_variants_sku ON variants(sku)`,
  `CREATE INDEX IF NOT EXISTS idx_variants_product ON variants(product_id)`,
  `CREATE INDEX IF NOT EXISTS idx_orders_open_status ON orders(status) WHERE status != 'paid'`,
  `CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id)`,
];

let ready: Promise<D1Database> | null = null;

export function ensureDatabase() {
  if (!ready) ready = initialise().catch((error) => { ready = null; throw error; });
  return ready;
}

async function initialise() {
  const db = getD1();
  for (const sql of statements) await db.prepare(sql).run();
  const migrationId = 'cat-catalog-v2';
  const migrated = await db.prepare('SELECT id FROM content_migrations WHERE id = ?').bind(migrationId).first<{ id: string }>();
  if (!migrated) {
    const now = new Date().toISOString();
    await db.prepare('UPDATE products SET active = 0, updated_at = ?').bind(now).run();
    const inserts = seedProducts.flatMap((product) => [
      db.prepare('INSERT INTO products (id, slug, name, description, category, price_pence, featured, active, details_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET slug = excluded.slug, name = excluded.name, description = excluded.description, category = excluded.category, price_pence = excluded.price_pence, featured = excluded.featured, active = excluded.active, details_json = excluded.details_json, updated_at = excluded.updated_at').bind(product.id, product.slug, product.name, product.description, product.category, product.pricePence, product.featured ? 1 : 0, product.active ? 1 : 0, JSON.stringify(product.details), product.createdAt, now),
      ...product.variants.map((variant) => db.prepare('INSERT INTO variants (id, product_id, sku, size, stock_on_hand, reserved, active) VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET sku = excluded.sku, size = excluded.size, stock_on_hand = excluded.stock_on_hand, active = excluded.active').bind(variant.id, product.id, variant.sku, variant.size, variant.stockOnHand, 0, 1)),
    ]);
    await db.batch([...inserts, db.prepare('INSERT INTO content_migrations (id, applied_at) VALUES (?, ?)').bind(migrationId, now)]);
  }
  await db.prepare('PRAGMA optimize').run();
  return db;
}
