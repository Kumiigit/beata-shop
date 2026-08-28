import type { Metadata } from 'next';
import { requireChatGPTUser, chatGPTSignOutPath } from '@/app/chatgpt-auth';
import { AdminPanel } from '@/components/admin-panel';
import { listProducts } from '@/lib/catalog';
import { runtimeValue } from '@/lib/runtime';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Store admin', robots: { index: false, follow: false } };

export default async function AdminPage() {
  const user = await requireChatGPTUser('/admin');
  const configured = runtimeValue('OWNER_EMAIL')?.trim().toLowerCase();
  const localOwner = process.env.NODE_ENV !== 'production' && user.email.toLowerCase() === 'seedy@sites.test';
  const authorised = localOwner || (!!configured && user.email.toLowerCase() === configured);
  if (!authorised) return <main className="result-page"><p className="eyebrow">Owner access</p><h1>Access is not configured for this account.</h1><p>{configured ? 'The signed-in email is not the store owner.' : 'Set OWNER_EMAIL in the hosted site settings to the owner’s ChatGPT email.'}</p><a className="button button-dark" href={chatGPTSignOutPath('/admin')}>Sign out</a></main>;
  const products = await listProducts(true);
  return <main className="admin-page"><header><div><p className="eyebrow">Private owner area</p><h1>Store catalogue.</h1><p>Signed in as {user.email}</p></div><a className="text-link" href={chatGPTSignOutPath('/')}>Sign out <span>→</span></a></header><AdminPanel initialProducts={products} /></main>;
}
