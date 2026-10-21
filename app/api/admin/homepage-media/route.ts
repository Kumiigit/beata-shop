import { adminSession } from '@/lib/admin-auth';
import { validAdminOrigin } from '@/lib/admin-origin';
import { getHomepageMedia, isHomepageMediaKey, setHomepageMedia } from '@/lib/homepage-media';
import { revalidateTag } from 'next/cache';
import { HOMEPAGE_MEDIA_TAG } from '@/lib/storefront-catalog';

export async function GET() {
  if (!await adminSession()) return Response.json({ error: 'Please sign in.' }, { status: 401 });
  return Response.json({ media: await getHomepageMedia() });
}

export async function PUT(request: Request) {
  if (!await adminSession()) return Response.json({ error: 'Please sign in.' }, { status: 401 });
  if (!validAdminOrigin(request)) return Response.json({ error: 'Invalid origin.' }, { status: 403 });
  const body = await request.json().catch(() => null) as { slot?: string; imageUrl?: string | null } | null;
  if (!body?.slot || !isHomepageMediaKey(body.slot) || !(body.imageUrl === null || (typeof body.imageUrl === 'string' && /^\/api\/product-images\/[0-9a-f-]{36}\.(jpg|png|webp)$/i.test(body.imageUrl)))) return Response.json({ error: 'Invalid image slot.' }, { status: 400 });
  try { await setHomepageMedia(body.slot, body.imageUrl); revalidateTag(HOMEPAGE_MEDIA_TAG, { expire: 0 }); return Response.json({ media: await getHomepageMedia() }); }
  catch { return Response.json({ error: 'Could not save this homepage image.' }, { status: 500 }); }
}
