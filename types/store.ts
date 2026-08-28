export type ProductVariant = {
  id: string;
  productId: string;
  sku: string;
  size: string;
  stockOnHand: number;
  reserved: number;
  available: number;
  active: boolean;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  pricePence: number;
  featured: boolean;
  active: boolean;
  createdAt: string;
  details: string[];
  variants: ProductVariant[];
};

export type CartLine = {
  variantId: string;
  slug: string;
  name: string;
  size: string;
  pricePence: number;
  quantity: number;
};

export type CheckoutRequest = {
  items: Array<{ variantId: string; quantity: number }>;
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
