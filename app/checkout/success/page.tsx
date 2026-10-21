import Link from 'next/link';
import type { Metadata } from 'next';
import { Check } from 'lucide-react';
import { CheckoutResult } from '@/components/checkout-result';
import { getLanguage } from '@/lib/server-language';
export async function generateMetadata(): Promise<Metadata> { return { title: (await getLanguage()) === 'pl' ? 'Zamówienie przyjęte' : 'Order received', robots: { index: false, follow: false } }; }
export default async function Page() { const pl = (await getLanguage()) === 'pl'; return <main className="result-page"><CheckoutResult /><span className="result-icon"><Check /></span><p className="eyebrow">{pl ? 'Dziękujemy' : 'Thank you'}</p><h1>{pl ? 'Otrzymaliśmy Twoje zamówienie.' : 'Your order is with us.'}</h1><p>{pl ? 'Stripe wyśle potwierdzenie płatności e-mailem. Ponieważ produkty wykonujemy na zamówienie, realizacja może potrwać dłużej w okresach wzmożonego ruchu. W przypadku własnego nadruku sprawdzimy grafikę i wyślemy projekt do akceptacji; czas realizacji zaczyna się po zatwierdzeniu.' : 'Stripe will email your receipt. Because products are made to order, processing can take longer during busy periods. For custom-print orders, we will review the artwork and send a proof; processing begins after approval.'}</p><Link prefetch={false} className="button button-dark" href="/shop">{pl ? 'Kontynuuj zakupy' : 'Continue shopping'}</Link></main>; }
