import Link from 'next/link';
import { ArrowRight, Gift, ImageIcon, PackageCheck, Paintbrush, RotateCcw, Shirt, ShoppingBag } from 'lucide-react';
import { ProductArtwork } from '@/components/product-artwork';
import { ProductCard } from '@/components/product-card';
import { listStorefrontProducts, getStorefrontHomepageMedia } from '@/lib/storefront-catalog';
import type { HomepageMediaKey } from '@/types/homepage-media';
import { cookies } from 'next/headers';
import { HalloweenCobweb } from '@/components/halloween-cobweb';
import { StoreImage } from '@/components/store-image';

const categories: { name: string; href: string; slug: string; icon: typeof Shirt; slot: HomepageMediaKey }[] = [
  { name: 'T-shirts', href: '/shop?category=T-shirts', slug: 'probably-tomorrow-tee', icon: Shirt, slot: 'category-tshirts' },
  { name: 'Hoodies', href: '/shop?category=Hoodies', slug: 'out-of-office-mentally-hoodie', icon: Shirt, slot: 'category-hoodies' },
  { name: 'Caps & hats', href: '/shop?category=Accessories', slug: 'social-battery-one-percent-cap', icon: Gift, slot: 'category-accessories' },
  { name: 'Workwear', href: '/workwear', slug: 'workwear', icon: Shirt, slot: 'category-workwear' },
  { name: 'Mugs', href: '/shop?category=Mugs', slug: 'custom-printed-mug', icon: Gift, slot: 'category-mugs' },
  { name: 'Bags', href: '/shop?category=Bags', slug: '50-age-is-just-a-number-bag-pouch-set', icon: ShoppingBag, slot: 'category-bags' },
];

function BannerPlaceholder({ label, className = '', pl = false }: { label: string; className?: string; pl?: boolean }) {
  return <figure style={{ margin: 0 }} className={`banner-placeholder ${className}`}  aria-label={`${label} — ${pl ? 'miejsce na zdjęcie' : 'placeholder'}`}><ImageIcon aria-hidden="true" /><span>{label}</span><small>{pl ? 'Dodaj zdjęcie lub grafikę kampanii' : 'Replace with your photo or campaign artwork'}</small></figure>;
}

function HomepageImage({ url, label, className = '', pl = false }: { url?: string; label: string; className?: string; pl?: boolean }) {
  const hero = className.includes('store-hero-media');
  return url ? <div className={`homepage-image ${className}`}><StoreImage src={url} alt={label} width={1200} height={900} sizes={hero ? '(max-width: 760px) 100vw, 65vw' : '(max-width: 540px) 100vw, (max-width: 900px) 50vw, 33vw'} loading={hero ? 'eager' : 'lazy'} fetchPriority={hero ? 'high' : undefined} /></div> : <BannerPlaceholder label={label} className={className} pl={pl} />;
}

export default async function Home() {
  const isPolish = (await cookies()).get('beata_language')?.value === 'pl';
  const [products, media] = await Promise.all([listStorefrontProducts(), getStorefrontHomepageMedia()]);
  return <main className="store-home halloween-home">
    <section className="store-hero halloween-hero">
      <HomepageImage url="/halloween/home-hero.webp" label={isPolish ? 'Bluza Take a Deep Breath Bro, kubek Too Cool to Haunt i T-shirt Trick-or-Treat Ghost Dogs z kolekcji Halloween Beata Shop' : 'Beata Shop Halloween collection: Take a Deep Breath Bro hoodie, Too Cool to Haunt mug and Trick-or-Treat Ghost Dogs T-shirt'} className="store-hero-media" pl={isPolish} />
      <HalloweenCobweb className="halloween-web-left" />
      <HalloweenCobweb className="halloween-web-right" />
      <div className="store-hero-copy"><p className="store-kicker">{isPolish ? 'Czas na Halloween' : 'A little spooky. A lot of you.'}</p><h1>{isPolish ? <>Twój styl.<br /><em>Duch Halloween.</em></> : <>Get into<br />the <em>spirit.</em></>}</h1><p>{isPolish ? 'Przytulne bluzy, upiornie dobre T-shirty i kubki pełne charakteru. Odkryj swoje ulubione wzory na Halloween.' : 'Cosy hoodies, hauntingly good tees and mugs with a mischievous side. Find your favourites for spooky season.'}</p><Link prefetch={false} className="store-button" href="/shop?q=halloween">{isPolish ? 'Odkryj Halloween' : 'Shop Halloween'} <ArrowRight aria-hidden="true" /></Link><span className="halloween-hero-note">{isPolish ? 'Twoje ulubione produkty. W upiornym wydaniu.' : 'All treats. A few tricks.'}</span></div>
    </section>

    <section className="store-categories store-shell" aria-labelledby="category-heading">
      <div className="store-section-heading"><div><p className="store-kicker">{isPolish ? 'Kupuj po swojemu' : 'Shop your way'}</p><h2 id="category-heading">{isPolish ? 'Przeglądaj kategorie' : 'Browse categories'}</h2></div><Link prefetch={false} href="/shop">{isPolish ? 'Zobacz wszystko' : 'View all'} <ArrowRight aria-hidden="true" /></Link></div>
      <div className="store-category-grid">{categories.map(({ name, href, slug, icon: Icon, slot }, index) => { const displayName = isPolish ? ['T-shirty', 'Bluzy', 'Czapki', 'Odzież robocza', 'Kubki', 'Torby'][index] : name; return <Link prefetch={false} href={href} className={`store-category-card${slot === 'category-workwear' ? ' store-category-card--workwear' : ''}`} key={name}>{media[slot] ? <HomepageImage url={media[slot]} label={isPolish ? `Kolekcja: ${displayName}` : `${displayName} collection`} pl={isPolish} /> : <ProductArtwork slug={slug} label={displayName} />}<span><Icon aria-hidden="true" />{displayName}</span></Link>; })}</div>
    </section>

    <section className="store-feature" id="special-edition">
      <div className="store-feature-copy"><p className="store-kicker">{isPolish ? 'Kolekcja limitowana' : 'Limited collection'}</p><h2>{isPolish ? 'Wyjątkowa kolekcja w Twoim stylu.' : 'A special drop, made your way.'}</h2><p>{isPolish ? 'Odkryj sezonowe kolekcje, współprace i nasze najpopularniejsze wzory.' : 'Use this space for a seasonal collection, collaboration or bestselling design range.'}</p><Link prefetch={false} className="store-button" href="/shop?sort=newest">{isPolish ? 'Zobacz kolekcję' : 'Explore the collection'} <ArrowRight aria-hidden="true" /></Link></div>
      <HomepageImage url={media['special-drop']} label={isPolish ? 'Kolekcja edycji specjalnej' : 'Special-edition collection'} pl={isPolish} />
    </section>

    <section className="store-arrivals store-shell" id="new-arrivals">
      <div className="store-section-heading"><div><p className="store-kicker">{isPolish ? 'Świeżo dodane' : 'Fresh picks'}</p><h2>{isPolish ? 'Nowości' : 'New arrivals'}</h2></div><Link prefetch={false} href="/shop?sort=newest">{isPolish ? 'Zobacz wszystko' : 'View all'} <ArrowRight aria-hidden="true" /></Link></div>
      <div className="product-grid store-product-grid">{products.slice(0, 6).map((product) => <ProductCard product={product} key={product.id} />)}</div>
    </section>

    <section className="store-custom">
      <div className="store-custom-copy"><Paintbrush aria-hidden="true" /><p className="store-kicker">{isPolish ? 'Własny nadruk · od £2' : 'Custom print · from £2'}</p><h2>{isPolish ? 'Twój projekt, ułożony po Twojemu.' : 'Your design, placed your way.'}</h2><p>{isPolish ? 'Wybierz Logo, A4, A3 lub wszystkie trzy, prześlij grafikę i ustaw jej położenie przed złożeniem zamówienia.' : 'Choose Logo, A4, A3, or all three, upload your artwork, and position it before checkout.'}</p><Link prefetch={false} className="store-button" href="/custom-print">{isPolish ? 'Stwórz swój projekt' : 'Create yours'} <ArrowRight aria-hidden="true" /></Link></div>
      <div className="store-custom-steps">{(isPolish ? ['Wybierz produkt', 'Prześlij grafikę', 'Zatwierdź wizualizację', 'My drukujemy'] : ['Choose a product', 'Upload your artwork', 'Approve your proof', 'We print it']).map((step, index) => { const slot = (['custom-choose','custom-upload','custom-proof','custom-print'] as HomepageMediaKey[])[index]; return <div key={step}>{media[slot] ? <HomepageImage url={media[slot]} label={step} pl={isPolish} /> : <ProductArtwork slug={index === 1 ? 'out-of-office-mentally-hoodie' : index === 2 ? 'social-battery-one-percent-cap' : 'probably-tomorrow-tee'} label={step} />}<span>{index + 1}</span><p>{step}</p></div>; })}</div>
    </section>

    <section className="store-inspiration store-shell"><div className="store-section-heading"><div><p className="store-kicker">{isPolish ? 'Miejsce na Twoje pomysły' : 'Your ideas here'}</p><h2>{isPolish ? 'Zrób to po swojemu' : 'Make it yours'}</h2></div></div><div className="store-inspiration-grid">{(isPolish ? ['Wyrazisty tekst', 'Natura', 'Podróże', 'Ilustracja', 'Minimalizm', 'Coś osobistego'] : ['Bold type', 'Nature', 'Travel', 'Illustration', 'Minimal', 'Something personal']).map((item, index) => { const slot = (['inspiration-bold','inspiration-nature','inspiration-travel','inspiration-illustration','inspiration-minimal','inspiration-personal'] as HomepageMediaKey[])[index]; return <HomepageImage url={media[slot]} label={item} key={item} pl={isPolish} />; })}</div></section>

    <section className="store-service-strip" aria-label={isPolish ? 'Informacje o zakupach' : 'Shopping information'}><div><PackageCheck aria-hidden="true" /><span><strong>{isPolish ? 'Dostawa InPost' : 'InPost delivery'}</strong>{isPolish ? '£3 lub bezpłatnie od £60' : '£3 or free over £60'}</span></div><div><RotateCcw aria-hidden="true" /><span><strong>{isPolish ? '30 dni na zwrot' : '30-day returns'}</strong>{isPolish ? 'Dla produktów objętych zwrotem' : 'On eligible items'}</span></div><div><Gift aria-hidden="true" /><span><strong>{isPolish ? 'Potrzebujesz pomocy?' : 'Need help?'}</strong>{isPolish ? 'Pon.–sob., 9:00–17:00' : 'Mon–Sat, 9am–5pm'}</span></div></section>
  </main>;
}
