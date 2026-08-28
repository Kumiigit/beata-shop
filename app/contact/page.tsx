import type { Metadata } from 'next';
import { ContentPage } from '@/components/content-page';
export const metadata: Metadata = { title: 'Contact' };
export default function Page() { return <ContentPage eyebrow="Here to help" title="Let’s talk." intro="Questions about sizing, delivery, or an order? Send us a note and we will come back to you as soon as we can."><h2>Customer care</h2><p><a className="text-link" href="mailto:hello@beata-shop.co">hello@beata-shop.co <span>→</span></a></p><p>Monday–Friday, 9am–5pm UK time. We aim to reply within two working days.</p><h2>Before you write</h2><p>For delivery estimates, see our <a href="/shipping">shipping page</a>. For returning an unworn item, read our <a href="/returns">returns guidance</a>.</p></ContentPage>; }
