import type { MetadataRoute } from 'next';
import { listStorefrontProducts } from '@/lib/storefront-catalog';
// The production database is available at runtime, not in the local build.
export const dynamic = 'force-dynamic';
const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://beata-shop.co').replace(/\/$/, '');

const publicPages: { path: string; changeFrequency: 'daily' | 'weekly' | 'monthly' | 'yearly'; priority: number }[] = [
  { path: '', changeFrequency: 'weekly', priority: 1 },
  { path: '/shop', changeFrequency: 'daily', priority: 0.9 },
  { path: '/workwear', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/custom-print', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/about', changeFrequency: 'yearly', priority: 0.5 },
  { path: '/contact', changeFrequency: 'yearly', priority: 0.5 },
  { path: '/shipping', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/returns', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/privacy', changeFrequency: 'yearly', priority: 0.4 },
  { path: '/terms', changeFrequency: 'yearly', priority: 0.4 },
  { path: '/cancellation-form', changeFrequency: 'yearly', priority: 0.3 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages: MetadataRoute.Sitemap = publicPages.map(({ path, changeFrequency, priority }) => ({
    url: `${siteUrl}${path}`,
    changeFrequency,
    priority,
  }));

  try {
    const products = await listStorefrontProducts();
    return [
      ...pages,
      ...products.map((product) => ({
        url: `${siteUrl}/shop/${encodeURIComponent(product.slug)}`,
        lastModified: product.createdAt,
        changeFrequency: 'weekly' as const,
        priority: 0.7,
        images: (product.imageUrls ?? [])
          .filter(Boolean)
          .map((image) => image.startsWith('http') ? image : `${siteUrl}${image.startsWith('/') ? '' : '/'}${image}`),
      })),
    ];
  } catch {
    return pages;
  }
}
