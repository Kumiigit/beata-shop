const tones = ['clay', 'ink', 'sage', 'sun', 'blush', 'stone'];

function displayText(label: string) { return label.replace(/\b(Tee|Hoodie|Sweatshirt|Cap|Tote|Long Sleeve)\b/gi, '').trim(); }

export function ProductArtwork({ slug, label, className = '' }: { slug: string; label: string; className?: string }) {
  const tone = tones[[...slug].reduce((sum, char) => sum + char.charCodeAt(0), 0) % tones.length];
  return <div className={`product-artwork text-artwork tone-${tone} ${className}`} role="img" aria-label={`${label}, product image placeholder`}><span className="artwork-mark">Beata Shop</span><strong>{displayText(label)}</strong><small>Wear what you mean</small></div>;
}
