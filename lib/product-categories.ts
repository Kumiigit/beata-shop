export const PRODUCT_CATEGORIES = [
  'T-shirts',
  'Hoodies',
  'Sweatshirts',
  'Long sleeves',
  'Hats & caps',
  'Bags',
  'Accessories',
  'Workwear',
  'Mugs',
] as const;

export function listProductCategories(products: { category: string }[]) {
  return [...new Set<string>([...PRODUCT_CATEGORIES, ...products.map((product) => product.category)])];
}
