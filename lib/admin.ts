import { getChatGPTUser } from '@/app/chatgpt-auth';
import { runtimeValue } from './runtime';

export async function ownerStatus() {
  const user = await getChatGPTUser();
  if (!user) return { ok: false as const, status: 401, user: null, reason: 'Sign in to continue.' };
  const ownerEmail = runtimeValue('OWNER_EMAIL')?.trim().toLowerCase();
  const localOwner = process.env.NODE_ENV !== 'production' && user.email.toLowerCase() === 'seedy@sites.test';
  if (!ownerEmail && !localOwner) return { ok: false as const, status: 503, user, reason: 'OWNER_EMAIL must be configured before the admin area can be used.' };
  if (!localOwner && user.email.toLowerCase() !== ownerEmail) return { ok: false as const, status: 403, user, reason: 'This account is not authorised to manage the store.' };
  return { ok: true as const, status: 200, user };
}
