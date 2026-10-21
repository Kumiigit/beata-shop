import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';
import { adminSession } from '@/lib/admin-auth';
import { getArtwork } from '@/lib/artwork-storage';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await adminSession())) return NextResponse.json({ error: 'Admin login required.' }, { status: 401 });
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: 'Database unavailable.' }, { status: 503 });
  const { id } = await params; const db = getDatabase();
  const result = await db.sql<{ storage_key: string; original_name: string; mime_type: string }>`SELECT storage_key, original_name, mime_type FROM custom_artwork WHERE id = ${id}`;
  const row = result[0]; if (!row) return NextResponse.json({ error: 'Artwork not found.' }, { status: 404 });
  const blob = await getArtwork(row.storage_key); if (!blob) return NextResponse.json({ error: 'Artwork file not found.' }, { status: 404 });
  return new Response(blob.stream(), { headers: { 'content-type': row.mime_type, 'content-disposition': `inline; filename="${row.original_name.replaceAll('"', '')}"`, 'cache-control': 'private, no-store' } });
}
