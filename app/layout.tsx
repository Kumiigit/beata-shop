import type { Metadata } from 'next';
import '@fontsource-variable/cormorant-garamond';
import '@fontsource-variable/manrope';
import './globals.css';
import { CartProvider } from '@/components/cart-provider';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://beata-shop.co';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: 'Beata Shop | Wear what you mean', template: '%s | Beata Shop' },
  description: 'Funny text T-shirts, hoodies, sweatshirts and accessories made to be worn on repeat.',
  openGraph: { title: 'Beata Shop', description: 'Wear what you mean.', url: '/', siteName: 'Beata Shop', locale: 'en_GB', type: 'website' },
  twitter: { card: 'summary_large_image', title: 'Beata Shop', description: 'Wear what you mean.' },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en-GB"><body><CartProvider><SiteHeader />{children}<SiteFooter /></CartProvider></body></html>;
}
