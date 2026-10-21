import type { ProductAudience } from '@/lib/product-audiences';

export type ProductVariant = {
  id: string;
  productId: string;
  sku: string;
  size: string;
  stockOnHand: number;
  reserved: number;
  available: number;
  active: boolean;
  printAreaWidthCm?: number;
  printAreaHeightCm?: number;
};

export type ProductColour = {
  id: string;
  name: string;
  imageUrl: string;
  backImageUrl?: string;
  pricePence: number | null;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  audiences?: ProductAudience[];
  pricePence: number;
  featured: boolean;
  active: boolean;
  customPrintingAvailable?: boolean;
  createdAt: string;
  details: string[];
  imageUrls?: string[];
  colours?: ProductColour[];
  variants: ProductVariant[];
};

export type CartLine = {
  lineId: string;
  variantId: string;
  slug: string;
  name: string;
  size: string;
  pricePence: number;
  colourId?: string;
  colour?: string;
  imageUrl?: string;
  quantity: number;
  customPrint?: {
    prints: CustomPrintPlacement[];
    feePence: number;
  };
};

export type CustomPrintType = 'logo' | 'a4' | 'a3' | 'mug';
export type CustomPrintSide = 'front' | 'back';
export type CustomPrintOrientation = 'portrait' | 'landscape';

export type CustomPrintPlacement = {
  uploadId: string;
  name: string;
  type: CustomPrintType;
  side: CustomPrintSide;
  orientation: CustomPrintOrientation;
  x: number;
  y: number;
  feePence: number;
};

export type CheckoutRequest = {
  items: Array<{
    variantId: string;
    colourId?: string;
    quantity: number;
    customPrint?: { uploadIds: string[] };
  }>;
  termsAccepted: boolean;
};

export type CheckoutResponse = {
  checkoutUrl: string;
  orderId: string;
};

export type OrderStatus =
  | 'reserving'
  | 'awaiting_payment'
  | 'paid'
  | 'expired'
  | 'payment_failed'
  | 'configuration_required';

export type Order = {
  id: string;
  stripeSessionId: string | null;
  status: OrderStatus;
  customerEmail: string | null;
  subtotalPence: number;
  shippingPence: number;
  totalPence: number;
  createdAt: string;
};

export function formatGBP(pence: number) {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 0,
    maximumFractionDigits: pence % 100 === 0 ? 0 : 2,
  }).format(pence / 100);
}
