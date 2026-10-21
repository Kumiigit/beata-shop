'use client';

import { StoreImage } from './store-image';
import { useMemo, useState } from 'react';
import { ImageIcon, Upload } from 'lucide-react';
import type { CustomPrintOrientation, CustomPrintPlacement, CustomPrintSide, CustomPrintType, Product } from '@/types/store';
import { formatGBP } from '@/types/store';
import { Button } from '@/components/ui/button';
import { useCart } from './cart-provider';
import { useLanguage } from './language-provider';
import { translateColour, translateSize } from '@/lib/i18n';
import { MugPrintEditor } from './mug-print-editor';
import { isMug } from '@/lib/mug-print';
import { TouchArtwork, type ArtworkTransform } from './touch-artwork';
import { withPngDpi } from '@/lib/png-dpi';

type PrintChoice = { enabled: boolean; side: CustomPrintSide; orientation: CustomPrintOrientation; x: number; y: number; file: File | null; previewUrl: string; transform?: ArtworkTransform };

const printOptions: Array<{ type: GarmentPrintType; feePence: number; name: string; polishName: string; note: string; polishNote: string }> = [
  { type: 'logo', feePence: 200, name: 'Logo', polishName: 'Logo', note: 'Small front print, fixed at the upper-right chest', polishNote: 'Mały nadruk z przodu, w stałym miejscu na prawej piersi' },
  { type: 'a4', feePence: 400, name: 'A4', polishName: 'A4', note: 'Medium print on the front or back', polishNote: 'Średni nadruk z przodu lub z tyłu' },
  { type: 'a3', feePence: 600, name: 'A3', polishName: 'A3', note: 'Large print on the front or back', polishNote: 'Duży nadruk z przodu lub z tyłu' },
];

type GarmentPrintType = Exclude<CustomPrintType, 'mug'>;
const printDimensionsCm: Record<GarmentPrintType, { width: number; height: number }> = {
  logo: { width: 10, height: 10 },
  a4: { width: 21, height: 29.7 },
  a3: { width: 29.7, height: 42 },
};

const initialPrints: Record<GarmentPrintType, PrintChoice> = {
  logo: { enabled: false, side: 'front', orientation: 'portrait', x: 78, y: 14, file: null, previewUrl: '' },
  a4: { enabled: false, side: 'front', orientation: 'portrait', x: 50, y: 38, file: null, previewUrl: '' },
  a3: { enabled: false, side: 'back', orientation: 'portrait', x: 50, y: 43, file: null, previewUrl: '' },
};

export function CustomPrintBuilder({ products, initialSlug }: { products: Product[]; initialSlug?: string }) {
  const language = useLanguage();
  const pl = language === 'pl';
  const initialProduct = products.find((item) => item.slug === initialSlug) ?? products[0];
  const [productId, setProductId] = useState(initialProduct?.id ?? '');
  const product = useMemo(() => products.find((item) => item.id === productId), [productId, products]);
  const choices = useMemo(() => product?.variants.filter((item) => item.active && item.available > 0) ?? [], [product]);
  const [variantId, setVariantId] = useState('');
  const [colourId, setColourId] = useState('');
  const [prints, setPrints] = useState(initialPrints);
  const [selectedArtwork, setSelectedArtwork] = useState<GarmentPrintType | null>(null);
  const [previewSide, setPreviewSide] = useState<CustomPrintSide>('front');
  const [rights, setRights] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const { addItem } = useCart();
  const selected = choices.find((item) => item.id === variantId) ?? choices[0];
  const selectedColour = product?.colours?.find((item) => item.id === colourId) ?? product?.colours?.[0];
  const basePrice = selectedColour?.pricePence ?? product?.pricePence ?? 0;
  const activeOptions = printOptions.filter((option) => prints[option.type].enabled);
  const printFee = activeOptions.reduce((sum, option) => sum + option.feePence, 0);
  const frontImage = selectedColour?.imageUrl || product?.imageUrls?.[0] || '';
  const previewImage = previewSide === 'back' ? selectedColour?.backImageUrl || frontImage : frontImage;
  const printAreaWidthCm = selected?.printAreaWidthCm ?? 40.4;
  const printAreaHeightCm = selected?.printAreaHeightCm ?? 65;

  function orientedDimensions(type: GarmentPrintType, orientation: CustomPrintOrientation) {
    const dimensions = printDimensionsCm[type];
    return orientation === 'landscape' && type !== 'logo' ? { width: dimensions.height, height: dimensions.width } : dimensions;
  }

  function placementLimits(type: 'a4' | 'a3', orientation: CustomPrintOrientation) {
    const dimensions = orientedDimensions(type, orientation);
    const halfWidth = (dimensions.width / printAreaWidthCm) * 50;
    const halfHeight = (dimensions.height / printAreaHeightCm) * 50;
    return { minX: Math.ceil(halfWidth), maxX: Math.floor(100 - halfWidth), minY: Math.ceil(halfHeight), maxY: Math.floor(100 - halfHeight) };
  }

  function updatePrint(type: GarmentPrintType, change: Partial<PrintChoice>) {
    setPrints((current) => ({ ...current, [type]: { ...current[type], ...change } }));
  }

  function togglePrint(type: GarmentPrintType) {
    const nextEnabled = !prints[type].enabled;
    updatePrint(type, { enabled: nextEnabled });
    if (nextEnabled) setPreviewSide(type === 'logo' ? 'front' : prints[type].side);
  }

  function chooseFile(type: GarmentPrintType, file: File | null) {
    const oldUrl = prints[type].previewUrl;
    if (oldUrl) URL.revokeObjectURL(oldUrl);
    setSelectedArtwork(type);
    updatePrint(type, { file, transform: { scale: 1, offsetX: 0, offsetY: 0 }, previewUrl: file && file.type.startsWith('image/') ? URL.createObjectURL(file) : '' });
  }

  async function submit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('');
    if (!product || !selected || !activeOptions.length || activeOptions.some((option) => !prints[option.type].file) || !rights) {
      setStatus(pl ? 'Wybierz produkt, co najmniej jeden rodzaj nadruku, dodaj wymagane pliki i potwierdź oświadczenie.' : 'Choose a product and at least one print option, add every required file, and confirm the artwork declaration.');
      return;
    }
    setLoading(true);
    const form = new FormData(event.currentTarget);
    form.set('rights', 'true');
    try {
      // Export the preview adjustments into the transparent physical print sheet.
      form.delete('artwork');
      for (const option of activeOptions) {
        const choice = prints[option.type]; const transform = choice.transform;
        if (choice.previewUrl && transform && (transform.scale !== 1 || transform.offsetX !== 0 || transform.offsetY !== 0)) {
          const image = new Image(); image.src = choice.previewUrl; await image.decode();
          const dimensions = orientedDimensions(option.type, choice.orientation);
          const canvas = document.createElement('canvas');
          canvas.width = Math.round(dimensions.width / 2.54 * 300); canvas.height = Math.round(dimensions.height / 2.54 * 300);
          const context = canvas.getContext('2d'); if (!context) throw new Error('Canvas unavailable.');
          const fit = Math.min(canvas.width / image.naturalWidth, canvas.height / image.naturalHeight) * transform.scale;
          const width = image.naturalWidth * fit; const height = image.naturalHeight * fit;
          context.drawImage(image, canvas.width * (.5 + transform.offsetX) - width / 2, canvas.height * (.5 + transform.offsetY) - height / 2, width, height);
          const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((result) => result ? resolve(result) : reject(new Error('Artwork export failed.')), 'image/png'));
          form.append('artwork', await withPngDpi(blob, 300), `${option.type}-adjusted.png`);
        } else if (choice.file) form.append('artwork', choice.file);
      }
      const response = await fetch('/api/artwork', { method: 'POST', body: form });
      const result = await response.json() as { uploads?: CustomPrintPlacement[]; error?: string };
      if (!response.ok || !result.uploads?.length) throw new Error(result.error ?? (pl ? 'Nie udało się przesłać plików.' : 'Upload failed.'));
      const uploads = result.uploads;
      addItem({
        lineId: `${selected.id}:${selectedColour?.id ?? 'default'}:custom:${uploads.map((item) => item.uploadId).join('-')}`,
        variantId: selected.id,
        slug: product.slug,
        name: product.name,
        size: selected.size,
        pricePence: basePrice + uploads.reduce((sum, item) => sum + item.feePence, 0),
        colourId: selectedColour?.id,
        colour: selectedColour?.name,
        imageUrl: frontImage,
        customPrint: { prints: uploads, feePence: uploads.reduce((sum, item) => sum + item.feePence, 0) },
      }, 1);
      window.location.assign('/cart');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : (pl ? 'Nie udało się przesłać plików.' : 'Upload failed.'));
      setLoading(false);
    }
  }

  if (!product) return <div className="custom-builder"><p>{pl ? 'Brak produktów dostępnych do własnego nadruku.' : 'No products are currently available for custom printing.'}</p></div>;

  return <div className="custom-builder custom-configurator">
    <section className="custom-config-section">
      <div className="custom-section-heading"><span>1</span><div><h2>{pl ? 'Wybierz produkt' : 'Choose your product'}</h2><p>{pl ? 'Najpierw wybierz produkt oraz dostępny wariant.' : 'Start with the product and its available variant.'}</p></div></div>
      <div className="custom-builder-fields">
        <label>{pl ? 'Produkt' : 'Product'}<select value={productId} onChange={(event) => { setProductId(event.target.value); setVariantId(''); setColourId(''); }}>{products.map((item) => <option key={item.id} value={item.id}>{item.name} — {formatGBP(item.pricePence)}</option>)}</select></label>
        {choices.length > 1 ? <label>{pl ? 'Rozmiar' : 'Size'}<select value={selected?.id ?? ''} onChange={(event) => setVariantId(event.target.value)}>{choices.map((item) => <option key={item.id} value={item.id}>{translateSize(item.size, language)}</option>)}</select></label> : <div className="custom-static-choice"><span>{pl ? 'Wariant' : 'Variant'}</span><strong>{selected ? translateSize(selected.size, language) : (pl ? 'Niedostępny' : 'Unavailable')}</strong></div>}
        {!!product.colours?.length && <label>{pl ? 'Kolor lub wzór' : 'Colour or design'}<select value={selectedColour?.id ?? ''} onChange={(event) => setColourId(event.target.value)}>{product.colours.map((colour) => <option key={colour.id} value={colour.id}>{translateColour(colour.name, language)}{colour.pricePence !== null ? ` — ${formatGBP(colour.pricePence)}` : ''}</option>)}</select></label>}
      </div>
    </section>

    {isMug(product) ? <MugPrintEditor key={product.id} product={product} variant={selected} colour={selectedColour} /> : <form onSubmit={submit} style={{ display: 'grid', gap: 34 }}>
    <input type="hidden" name="variantId" value={selected?.id ?? ''} />
    <section className="custom-config-section">
      <div className="custom-section-heading"><span>2</span><div><h2>{pl ? 'Dodaj nadruki' : 'Add print areas'}</h2><p>{pl ? 'Możesz wybrać dowolną kombinację: Logo, A4 i A3.' : 'Select any combination of Logo, A4, and A3.'}</p></div></div>
      <div className="print-option-grid">
        {printOptions.map((option) => {
          const choice = prints[option.type];
          const limits = option.type === 'logo' ? null : placementLimits(option.type, choice.orientation);
          const placedX = limits ? Math.min(limits.maxX, Math.max(limits.minX, choice.x)) : choice.x;
          const placedY = limits ? Math.min(limits.maxY, Math.max(limits.minY, choice.y)) : choice.y;
          return <article className={`print-option ${choice.enabled ? 'is-selected' : ''}`} key={option.type}>
            <label className="print-option-toggle"><input type="checkbox" checked={choice.enabled} onChange={() => togglePrint(option.type)} /><span><strong>{pl ? option.polishName : option.name}</strong><b>+{formatGBP(option.feePence)}</b><small>{pl ? option.polishNote : option.note}</small></span></label>
            {choice.enabled && <div className="print-option-controls">
              {option.type !== 'logo' && <label>{pl ? 'Strona produktu' : 'Product side'}<select name="printSide" value={choice.side} onChange={(event) => { const side = event.target.value as CustomPrintSide; updatePrint(option.type, { side }); setPreviewSide(side); }}><option value="front">{pl ? 'Przód' : 'Front'}</option><option value="back">{pl ? 'Tył' : 'Back'}</option></select></label>}
              {option.type === 'logo' && <><input type="hidden" name="printSide" value="front" /><p className="fixed-placement-note">{pl ? 'Stałe miejsce: prawa górna część przodu' : 'Fixed placement: upper-right front'}</p></>}
              {option.type !== 'logo' ? <label>{pl ? 'Orientacja' : 'Orientation'}<select name="printOrientation" value={choice.orientation} onChange={(event) => updatePrint(option.type, { orientation: event.target.value as CustomPrintOrientation, x: 50, y: 50 })}><option value="portrait">{pl ? 'Pionowa' : 'Portrait'}</option><option value="landscape">{pl ? 'Pozioma' : 'Landscape'}</option></select></label> : <input type="hidden" name="printOrientation" value="portrait" />}
              <input type="hidden" name="printType" value={option.type} />
              <input type="hidden" name="placementX" value={placedX} />
              <input type="hidden" name="placementY" value={placedY} />
              <label className="file-drop"><Upload aria-hidden="true" /><span>{choice.file ? choice.file.name : (pl ? 'Wybierz JPG, PNG lub PDF · maks. 10 MB' : 'Choose JPG, PNG or PDF · max 10 MB')}</span><input name="artwork" type="file" accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf" required onChange={(event) => chooseFile(option.type, event.target.files?.[0] ?? null)} /></label>
              {limits && <div className="placement-controls"><label>{pl ? 'Poziomo' : 'Horizontal'}<input type="range" min={limits.minX} max={limits.maxX} value={placedX} onChange={(event) => updatePrint(option.type, { x: Number(event.target.value) })} /></label><label>{pl ? 'Pionowo' : 'Vertical'}<input type="range" min={limits.minY} max={limits.maxY} value={placedY} onChange={(event) => updatePrint(option.type, { y: Number(event.target.value) })} /></label></div>}
            </div>}
          </article>;
        })}
      </div>
    </section>

    <section className="custom-config-section custom-preview-section">
      <div className="custom-section-heading"><span>3</span><div><h2>{pl ? 'Ustaw projekt' : 'Place your artwork'}</h2><p>{pl ? 'Dotknij grafiki i przeciągnij ją. Uchwyt w rogu zmienia rozmiar. Grafika poza polem zostanie przycięta.' : 'Tap your artwork and drag to move it. Drag the corner handle to resize. Artwork outside the print area is cropped.'}</p></div></div>
      <div className="custom-preview-layout">
        <p className="preview-scale-note">{pl ? `Skala względem pola nadruku ${printAreaWidthCm} × ${printAreaHeightCm} cm dla rozmiaru ${selected ? translateSize(selected.size, language) : ''}.` : `Scaled to the ${printAreaWidthCm} × ${printAreaHeightCm} cm printable area for size ${selected ? translateSize(selected.size, language) : ''}.`}</p>
        <fieldset style={{ margin: 0, padding: 0, border: 0, minWidth: 0 }} className="preview-side-switch"  aria-label={pl ? 'Strona podglądu' : 'Preview side'}><button type="button" className={previewSide === 'front' ? 'is-active' : ''} onClick={() => setPreviewSide('front')}>{pl ? 'Przód' : 'Front'}</button><button type="button" className={previewSide === 'back' ? 'is-active' : ''} onClick={() => setPreviewSide('back')}>{pl ? 'Tył' : 'Back'}</button></fieldset>
        <div className="garment-preview" aria-label={pl ? `Podgląd produktu — ${previewSide === 'front' ? 'przód' : 'tył'}` : `${previewSide} product preview`}>
          {previewImage ? <StoreImage className="garment-preview-image" src={previewImage} alt="" width={800} height={1000} sizes="(max-width: 760px) 100vw, 600px" loading="eager" /> : <div className="garment-preview-placeholder"><ImageIcon aria-hidden="true" /><span>{product.name}</span></div>}
          <div className="printable-zone" style={{ aspectRatio: `${printAreaWidthCm} / ${printAreaHeightCm}` }}>
            {activeOptions.map((option) => { const choice = prints[option.type]; const dimensions = orientedDimensions(option.type, choice.orientation); const limits = option.type === 'logo' ? null : placementLimits(option.type, choice.orientation); const x = limits ? Math.min(limits.maxX, Math.max(limits.minX, choice.x)) : choice.x; const y = limits ? Math.min(limits.maxY, Math.max(limits.minY, choice.y)) : choice.y; if (choice.side !== previewSide) return null; return <div className={`artwork-preview artwork-preview-${option.type}${choice.previewUrl ? ' has-artwork' : ''}`} style={{ left: `${x}%`, top: `${y}%`, width: `${(dimensions.width / printAreaWidthCm) * 100}%`, aspectRatio: `${dimensions.width} / ${dimensions.height}` }} key={option.type}>{choice.previewUrl ? <TouchArtwork src={choice.previewUrl} selected={selectedArtwork === option.type} onSelect={() => setSelectedArtwork(option.type)} transform={choice.transform ?? { scale: 1, offsetX: 0, offsetY: 0 }} onChange={(transform) => updatePrint(option.type, { transform })} pl={pl} /> : <span>{choice.file?.type === 'application/pdf' ? 'PDF' : option.name}</span>}</div>; })}
          </div>
          <span className="preview-side-label">{previewSide === 'front' ? (pl ? 'PRZÓD' : 'FRONT') : (pl ? 'TYŁ' : 'BACK')}</span>
        </div>
      </div>
    </section>

    <label className="rights-check"><input type="checkbox" checked={rights} onChange={(event) => setRights(event.target.checked)} required /><span>{pl ? 'Potwierdzam, że jestem właścicielem grafiki lub mam zgodę na jej powielanie oraz upoważniam Beata Shop do wykorzystania jej w celu realizacji zamówienia.' : 'I confirm that I own the artwork or have permission to reproduce it, and I authorise Beata Shop to use it to fulfil this order.'}</span></label>
    <div className="custom-price custom-price-breakdown"><span>{pl ? 'Produkt' : 'Product'}</span><strong>{formatGBP(basePrice)}</strong>{activeOptions.map((option) => <div key={option.type}><span>{option.name}</span><strong>+{formatGBP(option.feePence)}</strong></div>)}<div className="custom-total"><span>{pl ? 'Razem za sztukę' : 'Total per item'}</span><strong>{formatGBP(basePrice + printFee)}</strong></div><small>{pl ? 'Cena nadruku jest naliczana za każdą sztukę.' : 'Print charges apply to each item.'}</small></div>
    <Button type="submit" className="shop-button" size="lg" disabled={loading || !selected || !activeOptions.length}>{loading ? (pl ? 'Przesyłanie grafiki…' : 'Uploading artwork…') : (pl ? 'Prześlij i dodaj do koszyka' : 'Upload and add to bag')}</Button><p className="checkout-error" role="alert">{status}</p>
  </form>}
  </div>;
}
