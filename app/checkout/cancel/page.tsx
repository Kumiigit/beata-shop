import Link from 'next/link';
import type { Metadata } from 'next';
import { getLanguage } from '@/lib/server-language';
export async function generateMetadata(): Promise<Metadata> { return { title: (await getLanguage()) === 'pl' ? 'Płatność wstrzymana' : 'Checkout paused', robots: { index: false, follow: false } }; }
export default async function Page() { const pl = (await getLanguage()) === 'pl'; return <main className="result-page"><p className="eyebrow">{pl ? 'Płatność wstrzymana' : 'Checkout paused'}</p><h1>{pl ? 'Twój koszyk nadal tu jest.' : 'Your bag is still here.'}</h1><p>{pl ? 'Nie pobrano płatności. Wróć do koszyka, kiedy będziesz gotowy.' : 'No payment was taken. Return to your bag whenever you are ready.'}</p><Link prefetch={false} className="button button-dark" href="/cart">{pl ? 'Wróć do koszyka' : 'Return to bag'}</Link></main>; }
