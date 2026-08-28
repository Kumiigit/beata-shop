import type { Product, ProductVariant } from '@/types/store';

const STANDARD_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

function variants(productId: string, prefix: string, sizes = STANDARD_SIZES): ProductVariant[] {
  return sizes.map((size, index) => ({
    id: `${productId}-${size.toLowerCase().replaceAll(' ', '-')}`,
    productId,
    sku: `BEA-${prefix}-${size.replaceAll(' ', '')}`,
    size,
    stockOnHand: 8 + ((index * 3) % 7),
    reserved: 0,
    available: 8 + ((index * 3) % 7),
    active: true,
  }));
}

export const seedProducts: Product[] = [
  {
    id: 'signature-tee',
    slug: 'heavyweight-signature-tee',
    name: 'Heavyweight Signature Tee',
    description: 'A substantial everyday tee with a relaxed, balanced cut and clean ribbed neckline.',
    category: 'Tees',
    pricePence: 3000,
    featured: true,
    active: true,
    createdAt: '2026-08-20T09:00:00.000Z',
    details: ['240gsm cotton jersey', 'Relaxed unisex fit', 'Softened for a lived-in hand feel'],
    variants: variants('signature-tee', 'TEE'),
  },
  {
    id: 'box-tee',
    slug: 'essential-box-tee',
    name: 'Essential Box Tee',
    description: 'A lighter boxy tee designed to sit neatly over trousers, denim, or relaxed layers.',
    category: 'Tees',
    pricePence: 2400,
    featured: false,
    active: true,
    createdAt: '2026-08-16T09:00:00.000Z',
    details: ['Breathable cotton jersey', 'Cropped box silhouette', 'Twin-needle finishing'],
    variants: variants('box-tee', 'BOX'),
  },
  {
    id: 'rib-long-sleeve',
    slug: 'ribbed-long-sleeve',
    name: 'Ribbed Long Sleeve',
    description: 'A close, comfortable base layer with a softly structured rib and generous sleeve length.',
    category: 'Long sleeves',
    pricePence: 3200,
    featured: false,
    active: true,
    createdAt: '2026-08-12T09:00:00.000Z',
    details: ['Cotton-modal rib', 'Close unisex fit', 'Bound crew neckline'],
    variants: variants('rib-long-sleeve', 'RIB'),
  },
  {
    id: 'studio-sweat',
    slug: 'studio-sweatshirt',
    name: 'Studio Sweatshirt',
    description: 'Our clean crew-neck layer, cut with dropped shoulders and a quietly oversized shape.',
    category: 'Sweats',
    pricePence: 4800,
    featured: true,
    active: true,
    createdAt: '2026-08-24T09:00:00.000Z',
    details: ['Brushed cotton fleece', 'Dropped shoulder', 'Deep rib hem and cuffs'],
    variants: variants('studio-sweat', 'SWT'),
  },
  {
    id: 'core-hoodie',
    slug: 'core-everyday-hoodie',
    name: 'Core Everyday Hoodie',
    description: 'A calm, weighty hoodie with a double-layer hood and discreet side-seam pockets.',
    category: 'Layers',
    pricePence: 5800,
    featured: true,
    active: true,
    createdAt: '2026-08-25T09:00:00.000Z',
    details: ['Heavy brushed fleece', 'Double-layer hood', 'Hidden side pockets'],
    variants: variants('core-hoodie', 'HDY'),
  },
  {
    id: 'utility-overshirt',
    slug: 'utility-overshirt',
    name: 'Utility Overshirt',
    description: 'A versatile outer layer with a softly structured collar and considered patch pockets.',
    category: 'Outerwear',
    pricePence: 6200,
    featured: false,
    active: true,
    createdAt: '2026-08-08T09:00:00.000Z',
    details: ['Garment-washed cotton twill', 'Easy layering fit', 'Reinforced patch pockets'],
    variants: variants('utility-overshirt', 'OVR'),
  },
  {
    id: 'everyday-jogger',
    slug: 'everyday-jogger',
    name: 'Everyday Jogger',
    description: 'A clean, tapered trouser with a soft elastic waist and enough structure for days beyond home.',
    category: 'Trousers',
    pricePence: 4500,
    featured: true,
    active: true,
    createdAt: '2026-08-22T09:00:00.000Z',
    details: ['Midweight loopback cotton', 'Tapered unisex leg', 'Internal drawcord'],
    variants: variants('everyday-jogger', 'JGR'),
  },
  {
    id: 'canvas-tote',
    slug: 'canvas-market-tote',
    name: 'Canvas Market Tote',
    description: 'A generous everyday carry-all in dense natural canvas with reinforced shoulder straps.',
    category: 'Accessories',
    pricePence: 1800,
    featured: false,
    active: true,
    createdAt: '2026-08-04T09:00:00.000Z',
    details: ['Heavy natural canvas', 'Internal slip pocket', 'One generous size'],
    variants: variants('canvas-tote', 'TOTE', ['One size']),
  },
];

export const categories = [...new Set(seedProducts.map((product) => product.category))];
export const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'One size'];

export function findSeedProduct(slug: string) {
  return seedProducts.find((product) => product.slug === slug && product.active);
}
