import { Gift, PackageCheck, Paintbrush, Shirt, Sparkles, Smile, Tags } from 'lucide-react';
import { ProductArtwork } from '@/components/product-artwork';
import { ProductCard } from '@/components/product-card';
import { listProducts } from '@/lib/catalog';

const categoryCards = [
  { name: 'T-shirts', note: 'Funny, wearable, dangerously relatable', href: '/shop?category=T-shirts', slug: 'probably-tomorrow-tee', icon: Shirt },
  { name: 'Hoodies', note: 'Comfort with something to say', href: '/shop?category=Hoodies', slug: 'out-of-office-mentally-hoodie', icon: Smile },
  { name: 'Sweatshirts', note: 'Main-character layers', href: '/shop?category=Sweatshirts', slug: 'main-character-energy-sweatshirt', icon: Tags },
  { name: 'Accessories', note: 'Small things. Loud opinions.', href: '/shop?category=Accessories', slug: 'social-battery-one-percent-cap', icon: Gift },
];

export default async function Home() {
  const products = await listProducts();
  return <main className="cat-home">
    <section className="cat-hero word-hero"><div className="cat-hero-shade" /><div className="cat-hero-copy"><p className="cat-kicker">Clothes with excellent timing</p><h1>Wear something<br /><em>worth reading.</em></h1><p>Funny text, comfortable fits, and everyday clothes for people with opinions, excuses, and a very specific sense of humour.</p><div className="cat-hero-actions"><a className="cat-button" href="/shop">Shop the collection</a><a className="cat-link" href="#new-arrivals">See what’s new <span>→</span></a></div><div className="cat-trust"><span>Original text designs</span><span>Unisex fits</span><span>UK delivery</span></div></div><div className="word-hero-art"><img src="/beata-logo.png" alt="Beata Shop" /><div className="floating-slogan slogan-one">OUT OF OFFICE<br />MENTALLY</div><div className="floating-slogan slogan-two">PROBABLY<br />TOMORROW</div><div className="floating-slogan slogan-three">SOCIAL<br />BATTERY: 1%</div></div></section>
    <section className="cat-categories section-shell" aria-labelledby="category-title"><div className="cat-section-heading"><div><p className="cat-kicker">Pick your mood</p><h2 id="category-title">Good clothes. Better one-liners.</h2></div><a href="/shop">View everything <span>→</span></a></div><div className="cat-category-grid">{categoryCards.map(({ name, note, href, slug, icon: Icon }) => <a href={href} key={name}><ProductArtwork slug={slug} label={name} /><div className="cat-category-copy"><Icon aria-hidden="true" /><div><h3>{name}</h3><p>{note}</p></div><span>→</span></div></a>)}</div></section>
    <section className="cat-club statement-section"><div className="cat-club-copy"><p className="cat-kicker">The Beata point of view</p><h2>Less basic.<br />More you.</h2><p>We make clothes that say the quiet part out loud—printed on soft, useful pieces you’ll actually want to wear.</p><a className="cat-button cat-button-light" href="/shop">Find your new favourite</a></div><div className="statement-wall"><span>I NEED A NAP</span><span>MAIN CHARACTER ENERGY</span><span>GOOD THINGS TAKE SNACKS</span><img src="/beata-logo.png" alt="Beata Shop" /></div></section>
    <section className="cat-arrivals section-shell" id="new-arrivals"><div className="cat-section-heading"><div><p className="cat-kicker">Freshly printed</p><h2>New arrivals</h2></div><a href="/shop?sort=newest">View all <span>→</span></a></div><div className="product-grid">{products.slice(0, 6).map((product) => <ProductCard product={product} key={product.id} />)}</div></section>
    <section className="cat-custom section-shell" id="custom-print"><div className="cat-custom-copy"><Paintbrush aria-hidden="true" /><p className="cat-kicker">Custom print</p><h2>Your words.<br />Your wardrobe.</h2><p>Have a line that belongs on a shirt? Tell us the idea and we’ll help turn it into something wearable.</p><a className="cat-button" href="/contact">Start a custom order</a></div><div className="custom-copy-wall"><strong>YOUR<br />TEXT<br />HERE</strong><img src="/beata-logo.png" alt="Beata Shop logo placeholder for custom product artwork" /></div></section>
    <section className="cat-service-strip"><div><PackageCheck aria-hidden="true" /><span><strong>Free UK delivery</strong> on orders over £60</span></div><div><Sparkles aria-hidden="true" /><span><strong>Original designs</strong> printed with care</span></div><div><Gift aria-hidden="true" /><span><strong>Gift-ready</strong> for funny people you tolerate</span></div></section>
  </main>;
}
