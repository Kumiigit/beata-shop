'use client';

import { createContext, useContext, useMemo, useSyncExternalStore } from 'react';
import type { CartLine } from '@/types/store';

type CartContextValue = {
  items: CartLine[];
  itemCount: number;
  subtotalPence: number;
  addItem: (item: Omit<CartLine, 'quantity'>, quantity?: number) => void;
  updateQuantity: (lineId: string, quantity: number) => void;
  removeItem: (lineId: string) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = 'beata-shop-cart-v2';
const CART_CHANGE = 'beata-cart-change';
const EMPTY_CART: CartLine[] = [];
let cachedRaw: string | null | undefined;
let cachedItems = EMPTY_CART;
let storageFailed = false;

function getCartSnapshot() {
  if (storageFailed) return cachedItems;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw !== cachedRaw) {
      cachedRaw = raw;
      try {
        const parsed: unknown = raw ? JSON.parse(raw) : [];
        cachedItems = Array.isArray(parsed) ? parsed.filter((item): item is CartLine => Boolean(item && typeof item === 'object' && item.lineId && item.variantId && (!item.customPrint || Array.isArray(item.customPrint.prints)))) : [];
      } catch { cachedItems = []; }
    }
  } catch { storageFailed = true; }
  return cachedItems;
}

function subscribeToCart(onChange: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY || event.key === null) onChange();
  };
  window.addEventListener('storage', onStorage);
  window.addEventListener(CART_CHANGE, onChange);
  return () => {
    window.removeEventListener('storage', onStorage);
    window.removeEventListener(CART_CHANGE, onChange);
  };
}

function updateCart(update: (items: CartLine[]) => CartLine[]) {
  cachedItems = update(getCartSnapshot());
  cachedRaw = JSON.stringify(cachedItems);
  try { window.localStorage.setItem(STORAGE_KEY, cachedRaw); }
  catch { storageFailed = true; }
  window.dispatchEvent(new Event(CART_CHANGE));
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const items = useSyncExternalStore(subscribeToCart, getCartSnapshot, () => EMPTY_CART);

  const value = useMemo<CartContextValue>(() => ({
    items,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotalPence: items.reduce((sum, item) => sum + item.pricePence * item.quantity, 0),
    addItem(item, quantity = 1) {
      updateCart((current) => {
        const existing = current.find((line) => line.lineId === item.lineId);
        if (existing) return current.map((line) => line.lineId === item.lineId ? { ...line, quantity: Math.min(line.quantity + quantity, 10) } : line);
        return [...current, { ...item, quantity: Math.min(quantity, 10) }];
      });
    },
    updateQuantity(lineId, quantity) {
      if (quantity <= 0) updateCart((current) => current.filter((item) => item.lineId !== lineId));
      else updateCart((current) => current.map((item) => item.lineId === lineId ? { ...item, quantity: Math.min(quantity, 10) } : item));
    },
    removeItem(lineId) { updateCart((current) => current.filter((item) => item.lineId !== lineId)); },
    clearCart() { updateCart(() => []); },
  }), [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error('useCart must be used within CartProvider');
  return value;
}
