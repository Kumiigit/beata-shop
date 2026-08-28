import type { Metadata } from 'next';
import { Check } from 'lucide-react';
import { CheckoutResult } from '@/components/checkout-result';
export const metadata: Metadata = { title: 'Order received', robots: { index: false, follow: false } };
export default function Page() { return <main className="result-page"><CheckoutResult /><span className="result-icon"><Check /></span><p className="eyebrow">Thank you</p><h1>Your order is with us.</h1><p>Stripe will email your receipt. We will prepare your pieces and send delivery updates to the email used at checkout.</p><a className="button button-dark" href="/shop">Continue shopping</a></main>; }
