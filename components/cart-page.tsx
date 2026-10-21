'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatGBP } from '@/types/store';
import { useCart } from './cart-provider';
import { LogoPlaceholder } from './logo-placeholder';
import { ProductArtwork } from './product-artwork';
import { useLanguage } from './language-provider';
import { translateColour, translateSize } from '@/lib/i18n';
import { STORE } from '@/lib/store-config';

const FREE_DELIVERY = STORE.freeShippingThresholdPence;

export function CartPage() {
  const language = useLanguage();
  const pl = language === 'pl';
  const { items, subtotalPence, updateQuantity, removeItem } = useCart();
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const shipping = subtotalPence >= FREE_DELIVERY ? 0 : STORE.shippingPence;
  const remaining = Math.max(FREE_DELIVERY - subtotalPence, 0);
  const progress = Math.min((subtotalPence / FREE_DELIVERY) * 100, 100);

  async function checkout() {
    if (!termsAccepted) {
      setStatus(pl ? 'Przed przejściem do płatności zaakceptuj Regulamin i Politykę prywatności.' : 'Please accept the Terms and Privacy Notice before checkout.');
      return;
    }
    setLoading(true);
    setStatus('');
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          items: items.map(({ variantId, colourId, quantity, customPrint }) => ({
            variantId,
            colourId,
            quantity,
            customPrint: customPrint ? { uploadIds: customPrint.prints.map((print) => print.uploadId) } : undefined,
          })),
          termsAccepted,
        }),
      });
      const data = (await response.json()) as {
        checkoutUrl?: string;
        error?: string;
      };
      if (!response.ok || !data.checkoutUrl)
        throw new Error(data.error ?? 'Checkout could not be started.');
      window.location.assign(data.checkoutUrl);
    } catch (error) {
      setStatus(
        error instanceof Error
          ? error.message
          : (pl ? 'Nie udało się rozpocząć płatności.' : 'Checkout could not be started.'),
      );
      setLoading(false);
    }
  }

  if (!items.length)
    return (
      <section className="empty-cart">
        <LogoPlaceholder label={pl ? 'Pusty koszyk' : 'Empty shopping bag'} />
        <p className="eyebrow">{pl ? 'Twój koszyk' : 'Your bag'}</p>
        <h1>{pl ? 'Jest tu dużo miejsca na coś świetnego.' : 'Plenty of room for a good one-liner.'}</h1>
        <p>
          {pl ? 'Twój koszyk jest pusty. Przejrzyj kolekcję i znajdź coś w swoim stylu.' : 'Your bag is empty. Explore the collection and find something that sounds suspiciously like you.'}
        </p>
        <Link prefetch={false} className="button button-dark" href="/shop">
          {pl ? 'Przejdź do kolekcji' : 'Shop the collection'}
        </Link>
      </section>
    );

  return (
    <section className="cart-layout">
      <div className="cart-lines">
        <p className="eyebrow">{pl ? 'Twój koszyk' : 'Your bag'}</p>
        <h1>
          {pl ? `${items.length} ${items.length === 1 ? 'nowy ulubieniec' : 'nowe produkty'}.` : `${items.length} new ${items.length === 1 ? 'favourite' : 'favourites'}.`}
        </h1>
        <div className="delivery-progress">
          <p>
            {remaining
              ? (pl ? `Dodaj produkty za ${formatGBP(remaining)}, aby otrzymać darmową dostawę na terenie Wielkiej Brytanii.` : `Add ${formatGBP(remaining)} for free mainland GB delivery.`)
              : (pl ? 'Twoje zamówienie kwalifikuje się do darmowej dostawy na terenie Wielkiej Brytanii.' : 'Your order qualifies for free mainland GB delivery.')}
          </p>
          <div>
            <span style={{ width: `${progress}%` }} />
          </div>
        </div>
        {items.map((item) => (
          <article className="cart-line" key={item.lineId}>
            <ProductArtwork
              slug={item.slug}
              label={`${item.name} product artwork`}
              src={item.imageUrl}
              sizes="120px"
            />
            <div className="cart-line-copy">
              <Link prefetch={false} href={`/shop/${item.slug}`}>{item.name}</Link>
              {item.colour && <p>{translateColour(item.colour, language)}</p>}
              <p>{item.size === 'One size' ? translateSize(item.size, language) : `${pl ? 'Rozmiar' : 'Size'} ${item.size}`}</p>
              {item.customPrint && (
                <p className="custom-line-note">
                  {pl ? 'Własny nadruk' : 'Custom print'} · {item.customPrint.prints.map((print) => print.type === 'mug' ? (pl ? 'Kubek · cały projekt' : 'Mug · complete wrap') : `${print.type.toUpperCase()} ${print.side === 'front' ? (pl ? 'przód' : 'front') : (pl ? 'tył' : 'back')}${print.type === 'logo' ? '' : ` ${print.orientation === 'landscape' ? (pl ? 'poziomo' : 'landscape') : (pl ? 'pionowo' : 'portrait')}`}`).join(' + ')}
                </p>
              )}
              <button type="button" onClick={() => removeItem(item.lineId)}>
                <Trash2 /> {pl ? 'Usuń' : 'Remove'}
              </button>
            </div>
            <div
              className="quantity-control"
              aria-label={`${pl ? 'Ilość produktu' : 'Quantity for'} ${item.name}`}
            >
              <button
                type="button"
                aria-label={pl ? 'Zmniejsz ilość' : 'Decrease quantity'}
                onClick={() => updateQuantity(item.lineId, item.quantity - 1)}
              >
                <Minus />
              </button>
              <span>{item.quantity}</span>
              <button
                type="button"
                aria-label={pl ? 'Zwiększ ilość' : 'Increase quantity'}
                onClick={() => updateQuantity(item.lineId, item.quantity + 1)}
              >
                <Plus />
              </button>
            </div>
            <strong>{formatGBP(item.pricePence * item.quantity)}</strong>
          </article>
        ))}
      </div>
      <aside className="order-summary">
        <p className="eyebrow">{pl ? 'Podsumowanie zamówienia' : 'Order summary'}</p>
        <dl>
          <div>
            <dt>{pl ? 'Suma częściowa' : 'Subtotal'}</dt>
            <dd>{formatGBP(subtotalPence)}</dd>
          </div>
          <div>
            <dt>{pl ? 'Dostawa InPost' : 'InPost delivery'}</dt>
            <dd>{shipping ? formatGBP(shipping) : (pl ? 'Bezpłatnie' : 'Free')}</dd>
          </div>
          <div className="order-total">
            <dt>{pl ? 'Razem' : 'Total'}</dt>
            <dd>{formatGBP(subtotalPence + shipping)}</dd>
          </div>
        </dl>
        <label className="checkout-consent">
          <input
            type="checkbox"
            checked={termsAccepted}
            onChange={(event) => setTermsAccepted(event.target.checked)}
          />{' '}
          <span>
            {pl ? 'Akceptuję ' : 'I agree to the '}
            <Link prefetch={false} href="/terms" target="_blank">
              {pl ? 'Regulamin' : 'Terms'}
            </Link>{' '}
            {pl ? ' i potwierdzam zapoznanie się z ' : 'and acknowledge the '}
            <Link prefetch={false} href="/privacy" target="_blank">
              {pl ? 'Polityką prywatności' : 'Privacy Notice'}
            </Link>
            {pl ? '. Produkty personalizowane wymagają zatwierdzenia projektu i zwykle nie podlegają zwrotowi, chyba że są wadliwe.' : '. Custom items require proof approval and are not normally returnable unless faulty.'}
          </span>
        </label>
        <Button
          className="shop-button"
          size="lg"
          onClick={checkout}
          disabled={loading}
        >
          {loading ? (pl ? 'Otwieranie bezpiecznej płatności…' : 'Opening secure checkout…') : (pl ? 'Przejdź do bezpiecznej płatności' : 'Continue to secure checkout')}
        </Button>
        <p className="checkout-note">
          {pl ? 'Bezpieczna płatność przez Stripe. Dostawa jest ograniczona do kontynentalnej Wielkiej Brytanii. Stripe Tax nie jest włączony.' : 'Secure payment by Stripe. Delivery is limited to mainland Great Britain. Stripe Tax is not enabled.'}
        </p>
        <p className="checkout-error" role="alert">
          {status}
        </p>
      </aside>
    </section>
  );
}
