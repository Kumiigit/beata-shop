import { seedProducts } from '@/data/products';
import { LogoPlaceholder } from '@/components/logo-placeholder';
import { ProductCard } from '@/components/product-card';

const categories = [
  { name: 'Essential layers', href: '/shop?category=Layers', note: 'Soft structure for changing days' },
  { name: 'Tees & long sleeves', href: '/shop?category=Tees', note: 'The base of a quieter wardrobe' },
  { name: 'Trousers & accessories', href: '/shop?category=Trousers', note: 'Useful finishing pieces' },
];

export default function Home() {
  const featured = seedProducts.filter((product) => product.featured).slice(0, 4);
  return (
    <main>
      <section className="hero" id="new">
        <div className="hero-copy">
          <p className="eyebrow">The everyday collection · 2026</p>
          <h1>Quiet confidence,<br />made for every day.</h1>
          <p className="hero-intro">Considered unisex essentials in soft, enduring fabrics. Easy silhouettes, thoughtful detail, and nothing you do not need.</p>
          <div className="hero-actions"><a className="button button-dark" href="/shop">Shop the collection</a><a className="text-link" href="/about">Discover our approach <span>→</span></a></div>
          <dl className="hero-notes"><div><dt>01</dt><dd>Inclusive sizing<br />XS—XXL</dd></div><div><dt>02</dt><dd>Designed for<br />repeat wear</dd></div><div><dt>03</dt><dd>UK delivery<br />3—5 days</dd></div></dl>
        </div>
        <div className="hero-visual"><LogoPlaceholder label="Beata Shop campaign" /><p>Campaign image placeholder</p></div>
      </section>
      <section className="category-band" aria-label="Shop by category">
        {categories.map((category, index) => <a href={category.href} key={category.name}><span>0{index + 1}</span><div><h2>{category.name}</h2><p>{category.note}</p></div><strong>→</strong></a>)}
      </section>
      <section className="collection" id="shop"><div className="section-heading"><div><p className="eyebrow">A refined uniform</p><h2>Pieces that work together.</h2></div><a className="text-link" href="/shop">View all eight pieces <span>→</span></a></div><div className="product-grid">{featured.map((product) => <ProductCard product={product} key={product.id} />)}</div></section>
      <section className="story" id="story"><p className="eyebrow">The Beata point of view</p><blockquote>“Fewer, better pieces.<br />More ways to be yourself.”</blockquote><p>We design a small wardrobe of dependable essentials—balanced proportions, versatile tones, and a relaxed feel that moves easily between days.</p><a className="text-link light" href="/about">Read our story <span>→</span></a></section>
      <section className="service-strip" aria-label="Store benefits"><div><span>01</span><h3>Complimentary delivery</h3><p>Free standard UK delivery over £60.</p></div><div><span>02</span><h3>Considered returns</h3><p>Simple returns within 14 days.</p></div><div><span>03</span><h3>Here to help</h3><p>Thoughtful support when you need it.</p></div></section>
    </main>
  );
}
