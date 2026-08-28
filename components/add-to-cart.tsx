'use client';

import { useMemo, useState } from 'react';
import type { Product } from '@/types/store';
import { Button } from '@/components/ui/button';
import { useCart } from './cart-provider';

export function AddToCart({ product }: { product: Product }) {
  const choices = useMemo(
    () => product.variants.filter((variant) => variant.active),
    [product.variants],
  );
  const [variantId, setVariantId] = useState(choices.find((variant) => variant.available > 0)?.id ?? choices[0]?.id ?? '');
  const [quantity, setQuantity] = useState(1);
  const [notice, setNotice] = useState('');
  const { addItem } = useCart();
  const selected = choices.find((variant) => variant.id === variantId);

  function add() {
    if (!selected || selected.available < 1) return;
    addItem({
      variantId: selected.id,
      slug: product.slug,
      name: product.name,
      size: selected.size,
      pricePence: product.pricePence,
    }, quantity);
    setNotice(`${product.name}, ${selected.size}, was added to your bag.`);
  }

  return (
    <div className="purchase-panel">
      <fieldset className="size-picker">
        <legend>Choose a size</legend>
        <div>
          {choices.map((variant) => (
            <label key={variant.id} className={variant.available < 1 ? 'unavailable' : ''}>
              <input
                type="radio"
                name="size"
                value={variant.id}
                checked={variantId === variant.id}
                disabled={variant.available < 1}
                onChange={() => setVariantId(variant.id)}
              />
              <span>{variant.size}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <div className="quantity-row">
        <label htmlFor="quantity">Quantity</label>
        <select id="quantity" value={quantity} onChange={(event) => setQuantity(Number(event.target.value))}>
          {[1, 2, 3, 4].map((value) => <option value={value} key={value}>{value}</option>)}
        </select>
      </div>
      <Button className="shop-button" size="lg" disabled={!selected || selected.available < 1} onClick={add}>
        {selected && selected.available > 0 ? 'Add to bag' : 'Currently unavailable'}
      </Button>
      <p className="stock-note">{selected && selected.available > 0 ? `${selected.available} currently available` : 'Choose an available size'}</p>
      <p className="sr-only" aria-live="polite">{notice}</p>
    </div>
  );
}
