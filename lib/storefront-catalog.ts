import 'server-only';
import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { listProducts } from './catalog';
import { listCollections } from './collections';
import { getHomepageMedia } from './homepage-media';

// This app uses the non-Cache-Components model. Keep checkout/admin reads fresh;
// only the public catalogue uses a short shared cache, deduplicated per render.
export const CATALOG_TAG = 'storefront-catalog';
export const COLLECTIONS_TAG = 'storefront-collections';
export const HOMEPAGE_MEDIA_TAG = 'storefront-homepage-media';
const readCachedCatalog = unstable_cache(() => listProducts(), ['storefront-catalog-v1'], {
  tags: [CATALOG_TAG],
  revalidate: 60,
});
export const listStorefrontProducts = cache(() =>
  process.env.NODE_ENV === 'production' && process.env.DATABASE_URL
    ? readCachedCatalog()
    : listProducts(),
);
export const getStorefrontProduct = cache(async (slug: string) =>
  (await listStorefrontProducts()).find((product) => product.slug === slug),
);
const readCachedCollections = unstable_cache(listCollections, ['storefront-collections-v1'], {
  tags: [COLLECTIONS_TAG], revalidate: 60,
});
const readCachedMedia = unstable_cache(getHomepageMedia, ['storefront-media-v1'], {
  tags: [HOMEPAGE_MEDIA_TAG], revalidate: 60,
});
export const listStorefrontCollections = cache(() =>
  process.env.NODE_ENV === 'production' && process.env.DATABASE_URL ? readCachedCollections() : listCollections(),
);
export const getStorefrontHomepageMedia = cache(() =>
  process.env.NODE_ENV === 'production' && process.env.DATABASE_URL ? readCachedMedia() : getHomepageMedia(),
);
