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
  title: { default: 'Beata Shop | Everything for cat people', template: '%s | Beata Shop' },
  description: 'Original cat-themed clothing, homeware and gifts, designed to make cat people smile.',
  openGraph: { title: 'Beata Shop', description: 'Everything for cat people.', url: '/', siteName: 'Beata Shop', locale: 'en_GB', type: 'website', images: [{ url: '/og.png', width: 1730, height: 909, alt: 'Beata Shop — Everything for cat people.' }] },
  twitter: { card: 'summary_large_image', title: 'Beata Shop', description: 'Everything for cat people.', images: ['/og.png'] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en-GB"><body><CartProvider><SiteHeader />{children}<SiteFooter /></CartProvider></body></html>;
}
