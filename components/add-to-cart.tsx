'use client';

import { StoreImage } from './store-image';
import { useMemo, useState } from 'react';
import type { Product } from '@/types/store';
import { formatGBP } from '@/types/store';
import { Button } from '@/components/ui/button';
import { useCart } from './cart-provider';
import './purchase-options.css';
import { useProductSelection } from './product-selection';
import { useLanguage } from './language-provider';
import { translateColour, translateSize } from '@/lib/i18n';

export function AddToCart({ product }: { product: Product }) {
  const language = useLanguage();
  const pl = language === 'pl';
  const selection = useProductSelection();
  const choices = useMemo(
    () => product.variants.filter((variant) => variant.active),
    [product.variants],
  );
  const [variantId, setVariantId] = useState(
    choices.find((variant) => variant.available > 0)?.id ??
      choices[0]?.id ??
      '',
  );
  const [colourId, setColourId] = useState(product.colours?.[0]?.id ?? '');
  const [quantity, setQuantity] = useState(1);
  const [notice, setNotice] = useState('');
  const { addItem } = useCart();
  const selected = choices.find((variant) => variant.id === variantId);
  const selectedColour = product.colours?.find(
    (colour) => colour.id === colourId,
  );
  const selectedPrice = selectedColour?.pricePence ?? product.pricePence;

  function add() {
    if (!selected || selected.available < 1) return;
    addItem(
      {
        lineId: `${selected.id}:${colourId || 'default'}`,
        variantId: selected.id,
        slug: product.slug,
        name: product.name,
        size: selected.size,
        pricePence: selectedPrice,
        colourId: selectedColour?.id,
        colour: selectedColour?.name,
        imageUrl: selectedColour?.imageUrl || product.imageUrls?.[0],
      },
      quantity,
    );
    setNotice(
      pl
        ? `${product.name}${selectedColour ? `, ${translateColour(selectedColour.name, language)}` : ''}, ${translateSize(selected.size, language)} dodano do koszyka.`
        : `${product.name}${selectedColour ? `, ${selectedColour.name}` : ''}, ${selected.size}, was added to your bag.`,
    );
  }

  return (
    <div className="purchase-panel">
      {!!product.colours?.length && (
        <fieldset className="size-picker colour-picker">
          <legend>{pl ? 'Wybierz kolor lub wzór' : 'Choose a colour or design'}</legend>
          <div>
            {product.colours.map((colour) => (
              <label key={colour.id}>
                <input
                  type="radio"
                  name="colour"
                  value={colour.id}
                  checked={colourId === colour.id}
                  onChange={() => { setColourId(colour.id); selection?.setImage(colour.imageUrl || product.imageUrls?.[0] || ''); }}
                />
                <span className="colour-option">
                  {colour.imageUrl && <StoreImage src={colour.imageUrl} alt="" width={42} height={42} sizes="42px" className="colour-option-image" />}
                  {translateColour(colour.name, language)}
                  {colour.pricePence !== null
                    ? ` · ${formatGBP(colour.pricePence)}`
                    : ''}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      )}
      {!!product.colours?.length && <p className="selected-option-price" aria-live="polite">{selectedColour && translateColour(selectedColour.name, language)} · {formatGBP(selectedPrice)}</p>}
      {!(choices.length === 1 && choices[0]?.size === 'One size') && <fieldset className="size-picker">
        <legend>{pl ? 'Wybierz rozmiar' : 'Choose a size'}</legend>
        <div>
          {choices.map((variant) => (
            <label
              key={variant.id}
              className={variant.available < 1 ? 'unavailable' : ''}
            >
              <input
                type="radio"
                name="size"
                value={variant.id}
                checked={variantId === variant.id}
                disabled={variant.available < 1}
                onChange={() => setVariantId(variant.id)}
              />
              <span>{translateSize(variant.size, language)}</span>
            </label>
          ))}
        </div>
      </fieldset>}
      <div className="quantity-row">
        <label htmlFor="quantity">{pl ? 'Ilość' : 'Quantity'}</label>
        <select
          id="quantity"
          value={quantity}
          onChange={(event) => setQuantity(Number(event.target.value))}
        >
          {[1, 2, 3, 4].map((value) => (
            <option value={value} key={value}>
              {value}
            </option>
          ))}
        </select>
      </div>
      <Button
        className="shop-button"
        size="lg"
        disabled={!selected || selected.available < 1}
        onClick={add}
      >
        {selected && selected.available > 0
          ? (pl ? 'Dodaj do koszyka' : 'Add to bag')
          : (pl ? 'Obecnie niedostępny' : 'Currently unavailable')}
      </Button>
      <p className="stock-note">
        {selected && selected.available > 0
          ? (pl ? `${selected.available} obecnie dostępnych` : `${selected.available} currently available`)
          : (pl ? 'Wybierz dostępny rozmiar' : 'Choose an available size')}
      </p>
      <p className="sr-only" aria-live="polite">
        {notice}
      </p>
    </div>
  );
}
