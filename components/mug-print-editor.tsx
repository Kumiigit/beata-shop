'use client';

import { useEffect, useRef, useState } from 'react';
import type { CustomPrintPlacement, Product, ProductColour, ProductVariant } from '@/types/store';
import { formatGBP } from '@/types/store';
import { MUG_PRINT } from '@/lib/mug-print';
import { renderMugMockup } from '@/lib/mug-mockup';
import { withPngDpi } from '@/lib/png-dpi';
import { useCart } from './cart-provider';
import { useLanguage } from './language-provider';
import { Button } from './ui/button';
import { StoreImage } from './store-image';
import './mug-print-editor.css';

const W = 1000;
const H = W * MUG_PRINT.heightCm / MUG_PRINT.widthCm;
type Layer = { id: string; kind: 'image' | 'text'; content: string; x: number; y: number; width: number; height: number; rotation: number; color: string; font: string };
const colours: Record<string, string> = { white: '#f4f4f1', orange: '#ff6a13', yellow: '#ffe000', green: '#0c8b4e', purple: '#743ca1', blue: '#135ac7' };
function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => { const image = new Image(); image.onload = () => resolve(image); image.onerror = () => reject(new Error('The image could not be read.')); image.src = src; });
}
async function artworkCanvas(layers: Layer[], width: number) {
  await document.fonts.ready;
  const output = document.createElement('canvas'); output.width = width; output.height = Math.round(width * H / W);
  const context = output.getContext('2d'); if (!context) throw new Error('Canvas unavailable.');
  context.scale(width / W, output.height / H);
  for (const layer of layers) {
    context.save(); context.translate(layer.x, layer.y); context.rotate(layer.rotation * Math.PI / 180);
    if (layer.kind === 'image') context.drawImage(await loadImage(layer.content), -layer.width / 2, -layer.height / 2, layer.width, layer.height);
    else { context.font = `${layer.height * .8}px ${layer.font}`; context.fillStyle = layer.color; context.textAlign = 'center'; context.textBaseline = 'middle'; const measured = context.measureText(layer.content).width; if (measured > 0) context.scale(layer.width / measured, 1); context.fillText(layer.content, 0, 0); }
    context.restore();
  }
  return output;
}
function canvasBlob(canvas: HTMLCanvasElement) { return new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Could not export artwork.')), 'image/png')); }

export function MugPrintEditor({ product, variant, colour }: { product: Product; variant?: ProductVariant; colour?: ProductColour }) {
  const pl = useLanguage() === 'pl';
  const [layers, setLayers] = useState<Layer[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [side, setSide] = useState<'front' | 'back'>('front');
  const [text, setText] = useState('');
  const [rights, setRights] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [previewError, setPreviewError] = useState(false);
  const preview = useRef<HTMLDivElement>(null);
  const wrap = useRef<SVGSVGElement>(null);
  const [handleSize, setHandleSize] = useState(160);
  useEffect(() => {
    const element = wrap.current; if (!element) return;
    const observer = new ResizeObserver(([entry]) => { if (entry.contentRect.width) setHandleSize(44 * W / entry.contentRect.width); });
    observer.observe(element); return () => observer.disconnect();
  }, []);
  const drag = useRef<{ id: string; x: number; y: number; startX: number; startY: number; pointer: number; width: number; height: number; rotation: number; resize: boolean } | null>(null);
  const selected = layers.find((item) => item.id === selectedId);
  const { addItem } = useCart();
  const basePrice = colour?.pricePence ?? product.pricePence;
  const hex = colours[colour?.id ?? ''] ?? colours[(colour?.name ?? 'white').toLowerCase()] ?? '#f4f4f1';
  const frontImage = colour?.imageUrl || product.imageUrls?.[0] || '';
  const backImage = colour?.backImageUrl || frontImage;

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      try {
        const art = await artworkCanvas(layers, 1500);
        // Editorium previews include the unprinted margins by the handle.
        const body = document.createElement('canvas'); body.width = 1800; body.height = Math.round(1800 * MUG_PRINT.bodyHeightCm / MUG_PRINT.bodyWidthCm);
        const context = body.getContext('2d'); if (!context) throw new Error('Canvas unavailable.');
        const width = body.width * MUG_PRINT.widthCm / MUG_PRINT.bodyWidthCm;
        const height = body.height * MUG_PRINT.heightCm / MUG_PRINT.bodyHeightCm;
        context.drawImage(art, (body.width - width) / 2, (body.height - height) / 2, width, height);
        const result = await renderMugMockup(body, hex, side);
        if (!cancelled && preview.current) { result.setAttribute('aria-label', pl ? 'Podgląd kubka' : 'Mug design preview'); preview.current.replaceChildren(result); setPreviewError(false); }
      } catch { if (!cancelled) setPreviewError(true); }
    }, 150);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [layers, hex, side, pl]);

  function update(change: Partial<Layer>) { setLayers((current) => current.map((item) => item.id === selectedId ? { ...item, ...change } : item)); }
  function fit(target: 'front' | 'back' | 'wrap') {
    if (!selected) return;
    const width = target === 'wrap' ? W * .9 : W * .36;
    const scale = Math.min(width / selected.width, H * .8 / selected.height);
    update({ x: target === 'wrap' ? W / 2 : target === 'front' ? W * .25 : W * .75, y: H / 2, width: selected.width * scale, height: selected.height * scale, rotation: 0 });
    if (target !== 'wrap') setSide(target);
  }
  async function upload(file?: File) {
    if (!file) return;
    setStatus('');
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 10 * 1024 * 1024) { setStatus(pl ? 'Wybierz PNG, JPG lub WebP do 10 MB.' : 'Choose a PNG, JPG or WebP up to 10 MB.'); return; }
    try {
      const content = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('Image could not be read.')); reader.onerror = reject; reader.readAsDataURL(file); });
      const image = await loadImage(content);
      if (image.naturalWidth * image.naturalHeight > 40000000) throw new Error(pl ? 'Obraz jest zbyt duży (maks. 40 megapikseli).' : 'Image is too large (maximum 40 megapixels).');
      const scale = Math.min(W * .36 / image.naturalWidth, H * .8 / image.naturalHeight);
      const layer: Layer = { id: crypto.randomUUID(), kind: 'image', content, x: side === 'front' ? W * .25 : W * .75, y: H / 2, width: image.naturalWidth * scale, height: image.naturalHeight * scale, rotation: 0, color: '#202020', font: 'Arial' };
      setLayers((current) => [...current, layer]); setSelectedId(layer.id);
    } catch (error) { setStatus(error instanceof Error ? error.message : 'Upload failed.'); }
  }
  function addText() {
    if (!text.trim()) return;
    const layer: Layer = { id: crypto.randomUUID(), kind: 'text', content: text.trim(), x: side === 'front' ? W * .25 : W * .75, y: H / 2, width: Math.min(360, Math.max(90, text.length * 25)), height: 60, rotation: 0, color: '#202020', font: 'Arial' };
    setLayers((current) => [...current, layer]); setSelectedId(layer.id); setText('');
  }
  async function exportPrint() {
    const canvas = await artworkCanvas(layers, Math.round(MUG_PRINT.widthCm * MUG_PRINT.dpi / 2.54));
    return withPngDpi(await canvasBlob(canvas), MUG_PRINT.dpi);
  }
  async function submit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault(); setStatus('');
    if (!variant || !rights || !layers.length || !layers.some((layer) => layer.x + layer.width / 2 > 0 && layer.x - layer.width / 2 < W && layer.y + layer.height / 2 > 0 && layer.y - layer.height / 2 < H)) { setStatus(pl ? 'Dodaj projekt i potwierdź prawa do grafiki.' : 'Add a design inside the wrap and confirm your artwork rights.'); return; }
    setLoading(true);
    try {
      const blob = await exportPrint();
      if (blob.size > 10 * 1024 * 1024) throw new Error(pl ? 'Projekt przekracza 10 MB. Użyj mniejszego obrazu.' : 'Design exceeds 10 MB. Use a smaller image.');
      const form = new FormData(); form.set('variantId', variant.id); form.set('rights', 'true'); form.set('artwork', blob, 'mug-full-wrap-300dpi.png'); form.set('printType', 'mug'); form.set('printSide', 'front'); form.set('printOrientation', 'landscape'); form.set('placementX', '50'); form.set('placementY', '50');
      const response = await fetch('/api/artwork', { method: 'POST', body: form });
      const result = await response.json() as { uploads?: CustomPrintPlacement[]; error?: string };
      if (!response.ok || result.uploads?.length !== 1 || result.uploads[0].type !== 'mug' || result.uploads[0].feePence !== 200) throw new Error(result.error ?? 'Upload failed.');
      addItem({ lineId: `${variant.id}:${colour?.id ?? 'default'}:custom:${result.uploads[0].uploadId}`, variantId: variant.id, slug: product.slug, name: product.name, size: variant.size, colourId: colour?.id, colour: colour?.name, imageUrl: frontImage, pricePence: basePrice + 200, customPrint: { prints: result.uploads, feePence: 200 } }, 1);
      window.location.assign('/cart');
    } catch (error) { setStatus(error instanceof Error ? error.message : 'Upload failed.'); setLoading(false); }
  }

  return <form onSubmit={submit} className="mug-editor">
    <section className="custom-config-section">
      <div className="custom-section-heading"><span>2</span><div><h2>{pl ? 'Zaprojektuj kubek' : 'Design your mug'}</h2><p>{pl ? 'Jeden projekt dookoła kubka. Nadruk tylko £2 — także na obu stronach.' : 'One wraparound design. Printing is only £2—even with artwork on both sides.'}</p></div></div>
      <div className="mug-tools"><label className="file-drop"><span>{pl ? 'Dodaj obraz · PNG, JPG, WebP' : 'Add image · PNG, JPG, WebP'}</span><input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => { void upload(event.target.files?.[0]); event.target.value = ''; }} /></label><div className="mug-add-text"><label>{pl ? 'Twój tekst' : 'Your text'}<input value={text} maxLength={100} onChange={(event) => setText(event.target.value)} /></label><button type="button" onClick={addText} disabled={!text.trim()}>{pl ? 'Dodaj tekst' : 'Add text'}</button></div></div>
      <p className="mug-wrap-note">{pl ? 'Pole nadruku 21,47 × 9,11 cm. Lewa połowa → przód, prawa → tył. Dotknij grafiki i przeciągnij ją. Uchwyt w rogu zmienia rozmiar.' : '21.47 × 9.11 cm print wrap. Left half → front, right half → back. Tap artwork and drag to move. Drag its corner handle to resize.'}</p>
      <div className="mug-wrap-labels"><span>{pl ? 'PRZÓD' : 'FRONT'}</span><span>{pl ? 'TYŁ' : 'BACK'}</span></div>
      <svg ref={wrap} className="mug-wrap-canvas" viewBox={`0 0 ${W} ${H}`} aria-label={pl ? 'Edytor projektu kubka' : 'Mug wrap design editor'} onPointerMove={(event) => { const current = drag.current; if (!current || current.pointer !== event.pointerId) return; const rect = event.currentTarget.getBoundingClientRect(); const x = Math.max(0, Math.min(W, current.x + (event.clientX - current.startX) * W / rect.width)); const y = Math.max(0, Math.min(H, current.y + (event.clientY - current.startY) * H / rect.height)); if (current.resize) {
          const dx = (event.clientX - current.startX) * W / rect.width; const dy = (event.clientY - current.startY) * H / rect.height;
          const angle = current.rotation * Math.PI / 180;
          const localX = dx * Math.cos(angle) + dy * Math.sin(angle); const localY = -dx * Math.sin(angle) + dy * Math.cos(angle);
          const scale = Math.max(30 / current.width, Math.min(W / current.width, 1 + 2 * (localX * current.width + localY * current.height) / (current.width ** 2 + current.height ** 2)));
          setLayers((items) => items.map((item) => item.id === current.id ? { ...item, width: current.width * scale, height: current.height * scale } : item));
        } else setLayers((items) => items.map((item) => item.id === current.id ? { ...item, x, y } : item)); }} onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }} onLostPointerCapture={() => { drag.current = null; }}>
        <defs><clipPath id="mug-wrap-clip"><rect width={W} height={H} /></clipPath></defs><line x1={W / 2} x2={W / 2} y1={0} y2={H} stroke="#c4b4a6" strokeDasharray="8 8" />
        <rect x={W * .5 / MUG_PRINT.widthCm} y={W * .5 / MUG_PRINT.widthCm} width={W - W / MUG_PRINT.widthCm} height={H - W / MUG_PRINT.widthCm} fill="none" stroke="#c4b4a6" strokeDasharray="6 6" />
        <g clipPath="url(#mug-wrap-clip)">{layers.map((layer) => <g key={layer.id} transform={`translate(${layer.x} ${layer.y}) rotate(${layer.rotation})`} onPointerDown={(event) => { event.preventDefault(); setSelectedId(layer.id); drag.current = { id: layer.id, x: layer.x, y: layer.y, startX: event.clientX, startY: event.clientY, pointer: event.pointerId, width: layer.width, height: layer.height, rotation: layer.rotation, resize: (event.target as Element).closest('.mug-resize-handle') !== null }; event.currentTarget.ownerSVGElement?.setPointerCapture(event.pointerId); }}>
          {layer.kind === 'image' ? <image href={layer.content} x={-layer.width / 2} y={-layer.height / 2} width={layer.width} height={layer.height} /> : <text fill={layer.color} fontFamily={layer.font} fontSize={layer.height * .8} textAnchor="middle" dominantBaseline="central" textLength={layer.width} lengthAdjust="spacingAndGlyphs">{layer.content}</text>}
          <rect x={-layer.width / 2} y={-layer.height / 2} width={layer.width} height={layer.height} fill="transparent" stroke={selectedId === layer.id ? '#8b422d' : 'transparent'} strokeWidth={3} />
          {selectedId === layer.id && <svg x={layer.width / 2 - handleSize / 2} y={layer.height / 2 - handleSize / 2} width={handleSize} height={handleSize} className="mug-resize-handle" viewBox="0 0 44 44" aria-label={pl ? 'Zmień rozmiar grafiki' : 'Resize artwork'}><rect width={44} height={44} rx={22} fill="#8b422d" /><path d="M15 15L29 29M18 29H29V18" fill="none" stroke="white" strokeWidth={3} /></svg>}
        </g>)}</g>
      </svg>
      <p className="mug-wrap-note">{pl ? 'Linia przerywana: bezpieczny margines 5 mm. Zawartość poza polem zostanie przycięta.' : 'Dashed outline: 5 mm safe margin. Artwork outside the wrap is cropped.'}</p>
      {!!layers.length && <label>{pl ? 'Warstwa' : 'Layer'}<select value={selectedId} onChange={(event) => setSelectedId(event.target.value)}>{layers.map((layer, index) => <option key={layer.id} value={layer.id}>{index + 1}. {layer.kind === 'text' ? layer.content : (pl ? 'Obraz' : 'Image')}</option>)}</select></label>}
      {selected && <div className="mug-layer-controls">
        <div className="mug-fit-buttons">{(['front', 'back', 'wrap'] as const).map((target) => <button type="button" key={target} onClick={() => fit(target)}>{target === 'front' ? (pl ? 'Dopasuj z przodu' : 'Fit front') : target === 'back' ? (pl ? 'Dopasuj z tyłu' : 'Fit back') : (pl ? 'Całe pole' : 'Fit wrap')}</button>)}<button type="button" onClick={() => { const copy = { ...selected, id: crypto.randomUUID(), x: selected.x < W / 2 ? W * .75 : W * .25 }; setLayers((current) => [...current, copy]); setSelectedId(copy.id); }}>{pl ? 'Kopiuj na drugą stronę' : 'Copy to other side'}</button><button type="button" onClick={() => { setLayers((current) => current.filter((item) => item.id !== selectedId)); setSelectedId(''); }}>{pl ? 'Usuń' : 'Delete'}</button></div>
        <label>{pl ? 'Rozmiar' : 'Size'}<input type="range" min={30} max={W} value={Math.min(W, selected.width)} onChange={(event) => { const width = Number(event.target.value); update({ width, height: selected.height * width / selected.width }); }} /></label><label>{pl ? 'Obrót' : 'Rotation'}<input type="range" min={-180} max={180} value={selected.rotation} onChange={(event) => update({ rotation: Number(event.target.value) })} /></label>
        <label>{pl ? 'Poziomo' : 'Horizontal'}<input type="range" min={0} max={W} value={selected.x} onChange={(event) => update({ x: Number(event.target.value) })} /></label><label>{pl ? 'Pionowo' : 'Vertical'}<input type="range" min={0} max={H} value={selected.y} onChange={(event) => update({ y: Number(event.target.value) })} /></label>
        {selected.kind === 'text' && <><label>{pl ? 'Tekst' : 'Text'}<input value={selected.content} maxLength={100} onChange={(event) => update({ content: event.target.value })} required /></label><label>{pl ? 'Kolor tekstu' : 'Text colour'}<input type="color" value={selected.color} onChange={(event) => update({ color: event.target.value })} /></label><label>{pl ? 'Czcionka' : 'Font'}<select value={selected.font} onChange={(event) => update({ font: event.target.value })}>{['Arial', 'Georgia', 'Verdana', 'Courier New'].map((font) => <option key={font}>{font}</option>)}</select></label></>}
      </div>}
    </section>
    <section className="custom-config-section"><div className="custom-section-heading"><span>3</span><div><h2>{pl ? 'Podgląd kubka' : 'Preview your mug'}</h2><p>{pl ? 'Projekt zakrzywia się wokół białego korpusu. Kolor dotyczy wnętrza i uchwytu.' : 'Your design curves around the white body. Colour applies to the inside and handle.'}</p></div></div>
      <div className="preview-side-switch">{(['front', 'back'] as const).map((value) => <button type="button" key={value} className={side === value ? 'is-active' : ''} onClick={() => setSide(value)}>{value === 'front' ? (pl ? 'Przód' : 'Front') : (pl ? 'Tył' : 'Back')}</button>)}</div>
      <div className="mug-curved-preview" ref={preview} />
      {previewError && <><StoreImage src={side === 'front' ? frontImage : backImage} width={600} height={600} alt={product.name} /><p>{pl ? 'Podgląd 3D jest niedostępny w tej przeglądarce. Projekt z pola powyżej zostanie wydrukowany.' : 'Curved preview is unavailable in this browser. The wrap design above is the artwork that will be printed.'}</p></>}
    </section>
    <label className="rights-check"><input type="checkbox" checked={rights} onChange={(event) => setRights(event.target.checked)} required /><span>{pl ? 'Potwierdzam, że mam prawa do grafiki i upoważniam Beata Shop do wydrukowania projektu.' : 'I confirm that I own the artwork or have permission to reproduce it, and authorise Beata Shop to print this design.'}</span></label>
    <div className="custom-price custom-price-breakdown"><span>{pl ? 'Kubek' : 'Mug'}</span><strong>{formatGBP(basePrice)}</strong><div><span>{pl ? 'Nadruk całego projektu' : 'Complete mug print'}</span><strong>+£2</strong></div><div className="custom-total"><span>{pl ? 'Razem za sztukę' : 'Total per mug'}</span><strong>{formatGBP(basePrice + 200)}</strong></div><small>{pl ? 'Jedna opłata £2 za nadruk na kubku. Dostawa doliczana w kasie.' : 'One £2 print charge per mug. Delivery calculated at checkout.'}</small></div>
    <Button type="submit" className="shop-button" size="lg" disabled={loading || !variant || !layers.length}>{loading ? (pl ? 'Przesyłanie…' : 'Uploading artwork…') : (pl ? 'Dodaj kubek do koszyka' : 'Add custom mug to bag')}</Button><p role="alert" className="checkout-error">{status}</p>
  </form>;
}
