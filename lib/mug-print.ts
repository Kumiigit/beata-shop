// Same 11 oz wrap and handle margins as Editorium.
export const MUG_PRINT = { widthCm: 21.47, heightCm: 9.11, bodyWidthCm: 25.9, bodyHeightCm: 9.6, dpi: 300 } as const;
export function isMug(product: { category: string }) { return product.category === 'Mugs'; }
