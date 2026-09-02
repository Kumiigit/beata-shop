'use client';

import { useState } from 'react';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatGBP } from '@/types/store';
import { useCart } from './cart-provider';
import { LogoPlaceholder } from './logo-placeholder';
import { ProductArtwork } from './product-artwork';

const FREE_DELIVERY = 6000;

export function CartPage() {
  const { items, subtotalPence, updateQuantity, removeItem } = useCart();
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const shipping = subtotalPence >= FREE_DELIVERY ? 0 : 495;
  const remaining = Math.max(FREE_DELIVERY - subtotalPence, 0);
  const progress = Math.min((subtotalPence / FREE_DELIVERY) * 100, 100);

  async function checkout() {
    setLoading(true); setStatus('');
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ items: items.map(({ variantId, quantity }) => ({ variantId, quantity })) }),
      });
      const data = await response.json() as { checkoutUrl?: string; error?: string };
      if (!response.ok || !data.checkoutUrl) throw new Error(data.error ?? 'Checkout could not be started.');
      window.location.assign(data.checkoutUrl);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Checkout could not be started.');
      setLoading(false);
    }
  }

  if (!items.length) {
    return (
      <section className="empty-cart">
        <LogoPlaceholder label="Empty shopping bag" />
        <p className="eyebrow">Your bag</p>
        <h1>Plenty of room for a good one-liner.</h1>
        <p>Your bag is empty. Explore the collection and find something that sounds suspiciously like you.</p>
        <a className="button button-dark" href="/shop">Shop the collection</a>
      </section>
    );
  }

  return (
    <section className="cart-layout">
      <div className="cart-lines">
        <p className="eyebrow">Your bag</p><h1>{items.length} new {items.length === 1 ? 'favourite' : 'favourites'}.</h1>
        <div className="delivery-progress">
          <p>{remaining ? `Add ${formatGBP(remaining)} for complimentary UK delivery.` : 'Your order qualifies for complimentary UK delivery.'}</p>
          <div><span style={{ width: `${progress}%` }} /></div>
        </div>
        {items.map((item) => (
          <article className="cart-line" key={item.variantId}>
            <ProductArtwork slug={item.slug} label={`${item.name} product artwork`} />
            <div className="cart-line-copy"><a href={`/shop/${item.slug}`}>{item.name}</a><p>Size {item.size}</p><button type="button" onClick={() => removeItem(item.variantId)}><Trash2 /> Remove</button></div>
            <div className="quantity-control" aria-label={`Quantity for ${item.name}`}>
              <button type="button" aria-label="Decrease quantity" onClick={() => updateQuantity(item.variantId, item.quantity - 1)}><Minus /></button>
              <span>{item.quantity}</span>
              <button type="button" aria-label="Increase quantity" onClick={() => updateQuantity(item.variantId, item.quantity + 1)}><Plus /></button>
            </div>
            <strong>{formatGBP(item.pricePence * item.quantity)}</strong>
          </article>
        ))}
      </div>
      <aside className="order-summary">
        <p className="eyebrow">Order summary</p>
        <dl><div><dt>Subtotal</dt><dd>{formatGBP(subtotalPence)}</dd></div><div><dt>UK delivery</dt><dd>{shipping ? formatGBP(shipping) : 'Complimentary'}</dd></div><div className="order-total"><dt>Total</dt><dd>{formatGBP(subtotalPence + shipping)}</dd></div></dl>
        <Button className="shop-button" size="lg" onClick={checkout} disabled={loading}>{loading ? 'Opening secure checkout…' : 'Continue to secure checkout'}</Button>
        <p className="checkout-note">Payments are processed securely by Stripe. UK delivery only.</p>
        <p className="checkout-error" role="alert">{status}</p>
      </aside>
    </section>
  );
}
