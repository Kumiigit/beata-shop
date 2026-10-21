'use client';

import { useState } from 'react';
import { ProductArtwork } from './product-artwork';
import { useProductSelection } from './product-selection';
import './product-gallery.css';
import { useLanguage } from './language-provider';
import { StoreImage } from './store-image';

export function ProductGallery({ images, name, slug }: { images: string[]; name: string; slug: string }) {
  const pl = useLanguage() === 'pl';
  const [selected, setSelected] = useState(0);
  const selection = useProductSelection();
  const activeImage = selection?.image || images[selected] || images[0];
  return <div className="product-gallery compact-gallery">
    <ProductArtwork slug={slug} label={name} src={activeImage} className="product-artwork-large" sizes="(max-width: 760px) calc(100vw - 32px), (max-width: 1180px) 50vw, 554px" loading="eager" />
    {images.length > 1 && <div className="compact-gallery-thumbnails" aria-label={pl ? 'Zdjęcia produktu' : 'Product images'}>
      {images.map((src, index) => <button type="button" key={`${src}-${index}`} aria-label={`${pl ? 'Pokaż zdjęcie' : 'Show image'} ${index + 1}`} aria-pressed={activeImage === src} onClick={() => { setSelected(index); selection?.setImage(src); }}><StoreImage src={src} alt="" width={64} height={64} sizes="64px" /></button>)}
    </div>}
  </div>;
}
