import 'server-only';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { getDatabase } from './database';
import { HOMEPAGE_MEDIA_SLOTS, type HomepageMedia, type HomepageMediaKey } from '@/types/homepage-media';

const localFile = path.join(process.cwd(), 'data', 'local-homepage-media.json');
const keys = new Set<string>(HOMEPAGE_MEDIA_SLOTS.map(slot => slot.key));
export function isHomepageMediaKey(value: string): value is HomepageMediaKey { return keys.has(value); }

export async function getHomepageMedia(): Promise<HomepageMedia> {
  const defaults = Object.fromEntries(HOMEPAGE_MEDIA_SLOTS.filter(slot => 'defaultUrl' in slot).map(slot => [slot.key, slot.defaultUrl])) as HomepageMedia;
  if (!process.env.DATABASE_URL) {
    try { return { ...defaults, ...JSON.parse(await fs.readFile(localFile, 'utf8')) }; }
    catch (error) { if ((error as NodeJS.ErrnoException).code === 'ENOENT') return defaults; throw error; }
  }
  try {
    const { rows } = await getDatabase().pool.query<{ slot_key: string; image_url: string }>('SELECT slot_key,image_url FROM public.homepage_media');
    return { ...defaults, ...Object.fromEntries(rows.filter(row => isHomepageMediaKey(row.slot_key)).map(row => [row.slot_key, row.image_url])) };
  } catch (error) { if ((error as { code?: string }).code === '42P01') return defaults; throw error; }
}

export async function setHomepageMedia(slot: HomepageMediaKey, imageUrl: string | null) {
  if (!process.env.DATABASE_URL) {
    const current = await getHomepageMedia();
    if (imageUrl) current[slot] = imageUrl; else delete current[slot];
    await fs.writeFile(localFile, JSON.stringify(current, null, 2));
    return;
  }
  const client = await getDatabase().pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('CREATE TABLE IF NOT EXISTS public.homepage_media (slot_key text PRIMARY KEY, image_url text NOT NULL, updated_at timestamptz NOT NULL DEFAULT now())');
    await client.query('ALTER TABLE public.homepage_media ENABLE ROW LEVEL SECURITY');
    if (imageUrl) await client.query('INSERT INTO public.homepage_media (slot_key,image_url,updated_at) VALUES ($1,$2,NOW()) ON CONFLICT (slot_key) DO UPDATE SET image_url=EXCLUDED.image_url,updated_at=NOW()', [slot, imageUrl]);
    else await client.query('DELETE FROM public.homepage_media WHERE slot_key=$1', [slot]);
    await client.query('COMMIT');
  } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
}
