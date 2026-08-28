import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Checkout paused', robots: { index: false, follow: false } };
export default function Page() { return <main className="result-page"><p className="eyebrow">Checkout paused</p><h1>Your bag is still here.</h1><p>No payment was taken. Return to your bag whenever you are ready.</p><a className="button button-dark" href="/cart">Return to bag</a></main>; }
