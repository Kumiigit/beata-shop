import { integer, sqliteTable, text, uniqueIndex, index } from 'drizzle-orm/sqlite-core';

export const products = sqliteTable('products', {
  id: text('id').primaryKey(), slug: text('slug').notNull(), name: text('name').notNull(), description: text('description').notNull(), category: text('category').notNull(), pricePence: integer('price_pence').notNull(), featured: integer('featured', { mode: 'boolean' }).notNull().default(false), active: integer('active', { mode: 'boolean' }).notNull().default(true), detailsJson: text('details_json').notNull().default('[]'), createdAt: text('created_at').notNull(), updatedAt: text('updated_at').notNull(),
}, (table) => [uniqueIndex('idx_products_slug').on(table.slug), index('idx_products_active_category').on(table.active, table.category)]);

export const variants = sqliteTable('variants', {
  id: text('id').primaryKey(), productId: text('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }), sku: text('sku').notNull(), size: text('size').notNull(), stockOnHand: integer('stock_on_hand').notNull().default(0), reserved: integer('reserved').notNull().default(0), active: integer('active', { mode: 'boolean' }).notNull().default(true),
}, (table) => [uniqueIndex('idx_variants_sku').on(table.sku), uniqueIndex('idx_variants_product_size').on(table.productId, table.size), index('idx_variants_product').on(table.productId)]);

export const orders = sqliteTable('orders', {
  id: text('id').primaryKey(), stripeSessionId: text('stripe_session_id'), status: text('status').notNull(), customerEmail: text('customer_email'), subtotalPence: integer('subtotal_pence').notNull(), shippingPence: integer('shipping_pence').notNull(), totalPence: integer('total_pence').notNull(), reservationExpiresAt: text('reservation_expires_at'), createdAt: text('created_at').notNull(), updatedAt: text('updated_at').notNull(),
}, (table) => [uniqueIndex('idx_orders_stripe_session').on(table.stripeSessionId), index('idx_orders_open_status').on(table.status)]);

export const orderItems = sqliteTable('order_items', {
  id: text('id').primaryKey(), orderId: text('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }), variantId: text('variant_id').notNull(), productName: text('product_name').notNull(), size: text('size').notNull(), unitPricePence: integer('unit_price_pence').notNull(), quantity: integer('quantity').notNull(),
}, (table) => [index('idx_order_items_order').on(table.orderId)]);

export const webhookEvents = sqliteTable('webhook_events', { id: text('id').primaryKey(), eventType: text('event_type').notNull(), processedAt: text('processed_at').notNull() });
export const newsletterSubscribers = sqliteTable('newsletter_subscribers', { email: text('email').primaryKey(), createdAt: text('created_at').notNull() });
export const contentMigrations = sqliteTable('content_migrations', { id: text('id').primaryKey(), appliedAt: text('applied_at').notNull() });
