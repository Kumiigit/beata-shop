import 'server-only';
import { cookies } from 'next/headers';
import type { Language } from '@/lib/i18n';

export async function getLanguage(): Promise<Language> {
  return (await cookies()).get('beata_language')?.value === 'pl' ? 'pl' : 'en';
}
