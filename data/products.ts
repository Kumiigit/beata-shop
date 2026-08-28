import type { Product, ProductVariant } from '@/types/store';

const CLOTHING_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

function variants(productId: string, prefix: string, sizes = CLOTHING_SIZES): ProductVariant[] {
  return sizes.map((size, index) => {
    const stock = 9 + ((index * 4) % 8);
    return { id: `${productId}-${size.toLowerCase().replaceAll(' ', '-')}`, productId, sku: `BEA-${prefix}-${size.replaceAll(' ', '')}`, size, stockOnHand: stock, reserved: 0, available: stock, active: true };
  });
}

export const seedProducts: Product[] = [
  { id: 'cat-portrait-tee', slug: 'cat-portrait-tee', name: 'Cat Portrait Tee', category: 'T-shirts', pricePence: 2600, description: 'A soft everyday tee starring an illustrated house cat with exactly the right amount of attitude.', featured: true, active: true, createdAt: '2026-08-27T09:00:00.000Z', details: ['Midweight cotton jersey', 'Relaxed unisex fit', 'Original Beata Shop cat artwork'], variants: variants('cat-portrait-tee', 'CPT') },
  { id: 'cat-nap-hoodie', slug: 'cat-nap-club-hoodie', name: 'Cat Nap Club Hoodie', category: 'Hoodies', pricePence: 5200, description: 'A cosy brushed hoodie for committed loungers, late risers, and honorary members of the cat nap club.', featured: true, active: true, createdAt: '2026-08-28T09:00:00.000Z', details: ['Soft brushed fleece', 'Relaxed unisex fit', 'Double-layer hood and kangaroo pocket'], variants: variants('cat-nap-hoodie', 'CNH') },
  { id: 'little-menace-cap', slug: 'little-menace-cap', name: 'Little Menace Cap', category: 'Accessories', pricePence: 2400, description: 'An easy everyday cap with a quietly mischievous embroidered cat motif.', featured: false, active: true, createdAt: '2026-08-26T09:00:00.000Z', details: ['Washed cotton twill', 'Adjustable back strap', 'Embroidered cat detail'], variants: variants('little-menace-cap', 'LMC', ['One size']) },
  { id: 'morning-cat-mug', slug: 'morning-cat-mug', name: 'Morning Cat Mug', category: 'Mugs', pricePence: 1800, description: 'A generous ceramic mug for coffee, tea, and the morning supervision of your favourite feline.', featured: true, active: true, createdAt: '2026-08-25T09:00:00.000Z', details: ['Gloss ceramic', 'Dishwasher safe', 'Comfortable 350ml size'], variants: variants('morning-cat-mug', 'MCM', ['One size']) },
  { id: 'stretch-cat-tote', slug: 'stretch-cat-tote', name: 'Stretch Cat Tote', category: 'Home & gifts', pricePence: 2200, description: 'A sturdy canvas tote with a long, stretching cat illustration and room for all the important things.', featured: false, active: true, createdAt: '2026-08-24T09:00:00.000Z', details: ['Heavy natural canvas', 'Long shoulder straps', 'Original wraparound cat artwork'], variants: variants('stretch-cat-tote', 'SCT', ['One size']) },
  { id: 'snoozing-cat-cushion', slug: 'snoozing-cat-cushion', name: 'Snoozing Cat Cushion', category: 'Home & gifts', pricePence: 2800, description: 'A softly structured cushion with a curled-up cat, made for sofas already claimed by someone furry.', featured: false, active: true, createdAt: '2026-08-23T09:00:00.000Z', details: ['Soft woven cover', 'Removable inner pad', 'Hidden zip closure'], variants: variants('snoozing-cat-cushion', 'SCC', ['One size']) },
  { id: 'house-cat-art-print', slug: 'house-cat-art-print', name: 'House Cat Art Print', category: 'Art prints', pricePence: 2000, description: 'A warm modern portrait celebrating the small monarch who rules the house.', featured: true, active: true, createdAt: '2026-08-22T09:00:00.000Z', details: ['Archival matte paper', 'Printed in the UK', 'Frame not included'], variants: variants('house-cat-art-print', 'HCA', ['A4', 'A3']) },
  { id: 'soft-paw-bandana', slug: 'soft-paw-bandana', name: 'Soft Paw Bandana', category: 'For cats', pricePence: 1600, description: 'A comfortable cotton bandana for cats who understand that every hallway is a catwalk.', featured: false, active: true, createdAt: '2026-08-21T09:00:00.000Z', details: ['Lightweight cotton', 'Slides over a breakaway collar', 'Choose S, M, or L'], variants: variants('soft-paw-bandana', 'SPB', ['S', 'M', 'L']) },
];

const artworkBySlug = new Map(seedProducts.map((product, index) => [product.slug, index]));
export const categories = [...new Set(seedProducts.map((product) => product.category))];
export const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'One size', 'A4', 'A3'];
export function getProductArtworkIndex(slug: string) { return artworkBySlug.get(slug) ?? 0; }
export function findSeedProduct(slug: string) { return seedProducts.find((product) => product.slug === slug && product.active); }
