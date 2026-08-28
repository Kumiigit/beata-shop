'use client';
import { useEffect } from 'react';
import { useCart } from './cart-provider';
export function CheckoutResult() { const { clearCart } = useCart(); useEffect(() => clearCart(), [clearCart]); return null; }
