import { NextResponse } from 'next/server';
import { adminSession } from '@/lib/admin-auth';
import { deleteProduct, saveProduct } from '@/lib/catalog';
import type { Product } from '@/types/store';
import { isProductAudience } from '@/lib/product-audiences';
import { MAX_PRODUCT_IMAGES } from '@/lib/product-images';
import { revalidateTag } from 'next/cache';
import { CATALOG_TAG } from '@/lib/storefront-catalog';

async function authorised() { return Boolean(await adminSession()); }

export async function POST(request: Request) { return persist(request); }
export async function PUT(request: Request) { return persist(request); }
export async function DELETE(request: Request) { if (!(await authorised())) return NextResponse.json({ error: 'Admin login required.' }, { status: 401 }); const id = new URL(request.url).searchParams.get('id'); if (!id) return NextResponse.json({ error: 'Product ID is required.' }, { status: 400 }); await deleteProduct(id); revalidateTag(CATALOG_TAG, { expire: 0 }); return NextResponse.json({ ok: true }); }

async function persist(request: Request) {
  if (!(await authorised())) return NextResponse.json({ error: 'Admin login required.' }, { status: 401 });
  const body = await request.json().catch(() => null) as { product?: Product } | null; const product = body?.product;
  if (!product || !valid(product)) return NextResponse.json({ error: 'Product details are invalid.' }, { status: 400 });
  try { await saveProduct(product); revalidateTag(CATALOG_TAG, { expire: 0 }); return NextResponse.json({ ok: true, product }); }
  catch (error) {
    const databaseError = error as { code?: string; constraint?: string };
    console.error('Product save failed', { code: databaseError.code, constraint: databaseError.constraint });
    if (databaseError.code === '23505') {
      const message = databaseError.constraint === 'products_slug_key'
        ? 'A product with this name already exists. Use a different product name.'
        : 'A stock code conflict was detected. Close this product and try adding it again.';
      return NextResponse.json({ error: message }, { status: 409 });
    }
    return NextResponse.json({ error: 'The product could not be saved.' }, { status: 500 });
  }
}

function valid(product: Product) { return typeof product.id === 'string' && product.id.length > 0 && typeof product.slug === 'string' && product.slug.length > 0 && text(product.name, 120) && text(product.category, 80) && text(product.description, 1200) && Number.isInteger(product.pricePence) && product.pricePence >= 0 && product.pricePence <= 100000 && (product.audiences === undefined || (Array.isArray(product.audiences) && product.audiences.length <= 3 && product.audiences.every(isProductAudience))) && (product.customPrintingAvailable === undefined || typeof product.customPrintingAvailable === 'boolean') && Array.isArray(product.details) && (!product.imageUrls || (Array.isArray(product.imageUrls) && product.imageUrls.length <= MAX_PRODUCT_IMAGES && product.imageUrls.every((url) => text(url, 500)))) && (!product.colours || (Array.isArray(product.colours) && product.colours.length <= 20 && product.colours.every((colour) => text(colour.id, 100) && text(colour.name, 60) && (!colour.imageUrl || text(colour.imageUrl, 500)) && (!colour.backImageUrl || text(colour.backImageUrl, 500)) && (colour.pricePence === null || (Number.isInteger(colour.pricePence) && colour.pricePence >= 0 && colour.pricePence <= 100000))))) && Array.isArray(product.variants) && product.variants.length > 0 && product.variants.every((variant) => text(variant.id, 160) && text(variant.sku, 100) && text(variant.size, 40) && Number.isInteger(variant.stockOnHand) && variant.stockOnHand >= variant.reserved && variant.stockOnHand <= 100000 && (variant.printAreaWidthCm === undefined || (Number.isFinite(variant.printAreaWidthCm) && variant.printAreaWidthCm >= (product.category === 'Mugs' ? 1 : 30) && variant.printAreaWidthCm <= 80)) && (variant.printAreaHeightCm === undefined || (Number.isFinite(variant.printAreaHeightCm) && variant.printAreaHeightCm >= (product.category === 'Mugs' ? 1 : 43) && variant.printAreaHeightCm <= 100))); }
function text(value: unknown, max: number) { return typeof value === 'string' && value.trim().length > 0 && value.trim().length <= max; }
