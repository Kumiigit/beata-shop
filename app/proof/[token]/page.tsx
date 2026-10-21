import type { Metadata } from 'next';
import { ProofApproval } from '@/components/proof-approval';
import { getLanguage } from '@/lib/server-language';
export async function generateMetadata(): Promise<Metadata> { return { title: (await getLanguage()) === 'pl' ? 'Zaakceptuj projekt nadruku' : 'Approve your custom-print proof', robots: { index: false, follow: false } }; }
export default async function Page({ params }: { params: Promise<{ token: string }> }) { const { token } = await params; const pl = (await getLanguage()) === 'pl'; return <main className="proof-page"><p className="eyebrow">{pl ? 'Własny nadruk' : 'Custom print'}</p><h1>{pl ? 'Sprawdź swój projekt.' : 'Review your proof.'}</h1><p>{pl ? 'Nic nie zostanie wydrukowane bez Twojej akceptacji.' : 'Nothing is printed until you approve it.'}</p><ProofApproval token={token} /></main>; }
