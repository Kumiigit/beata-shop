export const PRODUCT_AUDIENCES = ['women', 'men', 'kids'] as const;
export type ProductAudience = typeof PRODUCT_AUDIENCES[number];

export function isProductAudience(value: unknown): value is ProductAudience {
  return PRODUCT_AUDIENCES.some((audience) => audience === value);
}

export function matchesProductAudience(audiences: readonly ProductAudience[] | undefined, selected: ProductAudience | 'all') {
  return selected === 'all' || !audiences?.length || audiences.includes(selected);
}
