'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { CartLine } from '@/types/store';

type CartContextValue = {
  items: CartLine[];
  itemCount: number;
  subtotalPence: number;
  addItem: (item: Omit<CartLine, 'quantity'>, quantity?: number) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  removeItem: (variantId: string) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = 'beata-shop-cart-v1';

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartLine[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) setItems(JSON.parse(stored) as CartLine[]);
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (loaded) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, loaded]);

  const value = useMemo<CartContextValue>(() => ({
    items,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotalPence: items.reduce((sum, item) => sum + item.pricePence * item.quantity, 0),
    addItem(item, quantity = 1) {
      setItems((current) => {
        const existing = current.find((line) => line.variantId === item.variantId);
        if (existing) {
          return current.map((line) =>
            line.variantId === item.variantId
              ? { ...line, quantity: Math.min(line.quantity + quantity, 10) }
              : line,
          );
        }
        return [...current, { ...item, quantity: Math.min(quantity, 10) }];
      });
    },
    updateQuantity(variantId, quantity) {
      if (quantity <= 0) {
        setItems((current) => current.filter((item) => item.variantId !== variantId));
      } else {
        setItems((current) =>
          current.map((item) => item.variantId === variantId
            ? { ...item, quantity: Math.min(quantity, 10) }
            : item),
        );
      }
    },
    removeItem(variantId) {
      setItems((current) => current.filter((item) => item.variantId !== variantId));
    },
    clearCart() { setItems([]); },
  }), [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error('useCart must be used within CartProvider');
  return value;
}
