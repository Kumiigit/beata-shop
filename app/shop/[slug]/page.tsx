import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { AddToCart } from '@/components/add-to-cart';
import { ProductGallery } from '@/components/product-gallery';
import { ProductSelectionProvider } from '@/components/product-selection';
import { ProductCard } from '@/components/product-card';
import { getStorefrontProduct, listStorefrontProducts } from '@/lib/storefront-catalog';
import { formatGBP } from '@/types/store';
import { getLanguage } from '@/lib/server-language';
import { translateCategory, translateProductDescription, translateProductDetail } from '@/lib/i18n';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const product = await getStorefrontProduct((await params).slug);
  return product
    ? {
        title: product.name,
        description: product.description,
        openGraph: {
          title: product.name,
          description: product.description,
          images: [],
        },
        twitter: {
          title: product.name,
          description: product.description,
          images: [],
        },
      }
    : { title: 'Product not found' };
}
export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const product = await getStorefrontProduct((await params).slug);
  if (!product) notFound();
  if (product.category === 'Workwear') redirect('/workwear');
  const [allProducts, language] = await Promise.all([listStorefrontProducts(), getLanguage()]);
  const pl = language === 'pl';
  const related = allProducts
    .filter((item) => item.id !== product.id)
    .slice(0, 3);
  return (
    <ProductSelectionProvider initialImage={product.colours?.[0]?.imageUrl || product.imageUrls?.[0] || ''}>
    <main className="product-page">
      <ProductGallery images={product.imageUrls ?? []} name={product.name} slug={product.slug} />
      <section className="product-info">
        <p className="eyebrow">{translateCategory(product.category, language)}</p>
        <h1>{product.name}</h1>
        <p className="product-price">{formatGBP(product.pricePence)}<small>{pl ? '£3 dostawy InPost za zamówienie na terenie kontynentalnej Wielkiej Brytanii · darmowa dostawa od £60 wartości produktów' : '£3 InPost mainland GB delivery per order · free delivery when the product subtotal reaches £60'}</small></p>
        <p className="product-description">{translateProductDescription(product.description, language)}</p>
        <aside className="made-to-order-note">
          <strong>{pl ? 'Robione na zamówienie' : 'Made to order'}</strong>
          <span>
            {pl ? 'Każdy produkt wykonujemy specjalnie dla Ciebie, więc nic nie leży i nie zbiera kurzu. Może to oznaczać nieco dłuższy czas przed wysyłką.' : 'We make every product especially for you, so nothing sits around collecting dust. This can mean a little extra time before dispatch.'}
          </span>
        </aside>
        <AddToCart product={product} />
        {product.customPrintingAvailable && (
          <p className="custom-print-invite">
            {pl ? 'Chcesz własny projekt? ' : 'Want your own design? '}
            <a href={`/custom-print?product=${encodeURIComponent(product.slug)}`}>
              {pl ? 'Dodaj własny nadruk od £2' : 'Add custom printing from £2'}
            </a>
            .
          </p>
        )}
        <details open>
          <summary>{pl ? 'Szczegóły' : 'Details'}</summary>
          <ul>
            {product.details.map((detail) => (
              <li key={detail}>{translateProductDetail(detail, language)}</li>
            ))}
          </ul>
        </details>
        <details>
          <summary>{pl ? 'Dostawa i zwroty' : 'Delivery & returns'}</summary>
          <p>
            {pl ? 'Dostawa InPost na terenie kontynentalnej Wielkiej Brytanii kosztuje £3 i jest bezpłatna od £60. Każdy produkt jest robiony na zamówienie, dlatego w okresach wzmożonego ruchu czas realizacji może się wydłużyć. Zamówienia personalizowane przygotowujemy po zatwierdzeniu projektu. Kwalifikujące się produkty standardowe można zwrócić w ciągu 30 dni.' : 'InPost delivery to mainland Great Britain is £3 and free over £60. Every product is made to order, so processing times can increase during busy periods. Personalised orders are prepared after proof approval. Eligible standard items can be returned within 30 days.'}
          </p>
        </details>
      </section>
      <section className="related-products">
        <div className="section-heading">
          <div>
            <p className="eyebrow">{pl ? 'Podobny klimat' : 'Same energy'}</p>
            <h2>{pl ? 'Może Ci się też spodobać.' : 'You might also like.'}</h2>
          </div>
        </div>
        <div className="product-grid">
          {related.map((item) => (
            <ProductCard product={item} key={item.id} />
          ))}
        </div>
      </section>
    </main>
    </ProductSelectionProvider>
  );
}
