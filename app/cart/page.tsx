import type { Metadata } from 'next';
import { CartPage } from '@/components/cart-page';
import { getLanguage } from '@/lib/server-language';
export async function generateMetadata(): Promise<Metadata> { return { title: (await getLanguage()) === 'pl' ? 'Twój koszyk' : 'Your bag' }; }
export default function Page() { return <main><CartPage /></main>; }
