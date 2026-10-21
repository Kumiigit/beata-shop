import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';
import { saveArtwork, deleteArtwork } from '@/lib/artwork-storage';
import { STORE } from '@/lib/store-config';
import type { CustomPrintOrientation, CustomPrintSide, CustomPrintType } from '@/types/store';
import { MUG_PRINT } from '@/lib/mug-print';
import { validAdminOrigin } from '@/lib/admin-origin';

const MAX_BYTES = 10 * 1024 * 1024;
const TYPES = new Map([['image/jpeg', '.jpg'], ['image/png', '.png'], ['application/pdf', '.pdf']]);
const PRINT_TYPES = new Set<CustomPrintType>(['logo', 'a4', 'a3', 'mug']);
const SIDES = new Set<CustomPrintSide>(['front', 'back']);
const ORIENTATIONS = new Set<CustomPrintOrientation>(['portrait', 'landscape']);
const PRINT_DIMENSIONS_CM = {
  a4: { width: 21, height: 29.7 },
  a3: { width: 29.7, height: 42 },
} as const;

function safeName(name: string) { return name.replace(/[^a-zA-Z0-9._-]+/g, '-').slice(-120); }
function hasExpectedSignature(type: string, bytes: Uint8Array) {
  if (type === 'image/jpeg') return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (type === 'image/png') return bytes.slice(0, 8).every((value, index) => value === [137, 80, 78, 71, 13, 10, 26, 10][index]);
  if (type === 'application/pdf') return String.fromCharCode(...bytes.slice(0, 5)) === '%PDF-';
  return false;
}

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: 'Artwork uploads require the connected shop database.' }, { status: 503 });
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin && !validAdminOrigin(request)) return NextResponse.json({ error: 'Invalid upload origin.' }, { status: 403 });
  const data = await request.formData().catch(() => null);
  if (!data || data.get('rights') !== 'true') return NextResponse.json({ error: 'You must confirm your artwork rights and content declaration.' }, { status: 400 });
  const files = data.getAll('artwork').filter((item): item is File => item instanceof File && item.size > 0);
  const printTypes = data.getAll('printType').map(String) as CustomPrintType[];
  const sides = data.getAll('printSide').map(String) as CustomPrintSide[];
  const orientations = data.getAll('printOrientation').map(String) as CustomPrintOrientation[];
  const xs = data.getAll('placementX').map(Number);
  const ys = data.getAll('placementY').map(Number);
  const variantId = data.get('variantId');
  if (typeof variantId !== 'string' || !variantId.trim()) return NextResponse.json({ error: 'Choose a valid product variant.' }, { status: 400 });
  if (files.length < 1 || files.length > 3 || printTypes.length !== files.length || sides.length !== files.length || orientations.length !== files.length || xs.length !== files.length || ys.length !== files.length) return NextResponse.json({ error: 'Choose at least one print option and upload one file for each selected option.' }, { status: 400 });
  if (new Set(printTypes).size !== printTypes.length) return NextResponse.json({ error: 'Each print size can only be selected once per item.' }, { status: 400 });
  const db = getDatabase();
  const variants = await db.sql<{ print_area_width_cm: string | number; print_area_height_cm: string | number; details_json: unknown; category: string }>`SELECT v.print_area_width_cm, v.print_area_height_cm, p.details_json, p.category FROM variants v JOIN products p ON p.id = v.product_id WHERE v.id = ${variantId} AND v.active = TRUE AND p.active = TRUE`;
  const variant = variants[0];
  const presentation = typeof variant?.details_json === 'string' ? JSON.parse(variant.details_json) : variant?.details_json;
  if (!variant || !presentation || typeof presentation !== 'object' || (presentation as { customPrintingAvailable?: unknown }).customPrintingAvailable !== true) return NextResponse.json({ error: 'This product variant is not available for custom printing.' }, { status: 400 });
  const mug = variant.category === 'Mugs';
  if (mug ? files.length !== 1 || printTypes[0] !== 'mug' : printTypes.includes('mug')) return NextResponse.json({ error: 'Mugs use one complete wrap design with a flat £2 printing charge.' }, { status: 400 });
  const printAreaWidthCm = mug ? MUG_PRINT.widthCm : Number(variant.print_area_width_cm);
  const printAreaHeightCm = mug ? MUG_PRINT.heightCm : Number(variant.print_area_height_cm);
  const invalidPlacement = printTypes.some((type, index) => {
    if (!PRINT_TYPES.has(type) || !SIDES.has(sides[index]) || !ORIENTATIONS.has(orientations[index]) || !Number.isInteger(xs[index]) || !Number.isInteger(ys[index])) return true;
    if (type === 'mug') return sides[index] !== 'front' || orientations[index] !== 'landscape' || xs[index] !== 50 || ys[index] !== 50;
    if (type === 'logo') return sides[index] !== 'front' || orientations[index] !== 'portrait';
    const baseDimensions = PRINT_DIMENSIONS_CM[type];
    const dimensions = orientations[index] === 'landscape' ? { width: baseDimensions.height, height: baseDimensions.width } : baseDimensions;
    const halfWidth = (dimensions.width / printAreaWidthCm) * 50;
    const halfHeight = (dimensions.height / printAreaHeightCm) * 50;
    return xs[index] < Math.ceil(halfWidth) || xs[index] > Math.floor(100 - halfWidth) || ys[index] < Math.ceil(halfHeight) || ys[index] > Math.floor(100 - halfHeight);
  });
  if (files.some((file) => !TYPES.has(file.type) || file.size > MAX_BYTES) || invalidPlacement) return NextResponse.json({ error: 'Each file must be JPG, PNG, or PDF, no larger than 10 MB, with a valid print size and placement.' }, { status: 400 });
  const buffers = await Promise.all(files.map((file) => file.arrayBuffer()));
  const invalidIndex = files.findIndex((file, index) => !hasExpectedSignature(file.type, new Uint8Array(buffers[index]).slice(0, 8)));
  if (invalidIndex >= 0) return NextResponse.json({ error: `${safeName(files[invalidIndex].name)} does not match its declared file type.` }, { status: 400 });
  if (mug) {
    // PNG's IHDR stores dimensions at bytes 16 and 20. Avoid loading a native
    // image processor in the upload function just to check an export's size.
    const header = buffers[0].byteLength >= 24 ? new DataView(buffers[0]) : null;
    if (files[0].type !== 'image/png' || header?.getUint32(16) !== Math.round(MUG_PRINT.widthCm * MUG_PRINT.dpi / 2.54) || header?.getUint32(20) !== Math.round(MUG_PRINT.heightCm * MUG_PRINT.dpi / 2.54)) return NextResponse.json({ error: 'Export the complete mug design from the mug editor before uploading.' }, { status: 400 });
  }

  const saved: Array<{ id: string; key: string; name: string; type: CustomPrintType; side: CustomPrintSide; orientation: CustomPrintOrientation; x: number; y: number; feePence: number; position: string }> = [];
  try {
    for (let index = 0; index < files.length; index += 1) {
      const file = files[index]; const id = crypto.randomUUID(); const ext = TYPES.get(file.type)!; const name = safeName(file.name); const key = `uploads/${id}${ext}`;
      const type = printTypes[index]; const side = type === 'logo' ? 'front' : sides[index]; const orientation = type === 'logo' ? 'portrait' : orientations[index]; const x = type === 'logo' ? 78 : xs[index]; const y = type === 'logo' ? 14 : ys[index]; const feePence = STORE.customPrintFeesPence[type];
      const position = type === 'mug' ? 'Mug · Full wrap · 21.47 × 9.11 cm · Front and back · 300 DPI' : type === 'logo' ? 'Logo · Front top right' : `${type.toUpperCase()} · ${side === 'front' ? 'Front' : 'Back'} · ${orientation === 'landscape' ? 'Landscape' : 'Portrait'} · ${x}% / ${y}%`;
      await saveArtwork(key, buffers[index], { originalName: name, contentType: file.type, size: file.size, printType: type, side, orientation, x, y, feePence, variantId, printAreaWidthCm, printAreaHeightCm });
      await db.sql`INSERT INTO custom_artwork (id, storage_key, original_name, mime_type, size_bytes, print_position, print_type, print_side, print_orientation, placement_x, placement_y, fee_pence, variant_id, rights_confirmed_at, status, uploaded_at, delete_after) VALUES (${id}, ${key}, ${name}, ${file.type}, ${file.size}, ${position}, ${type}, ${side}, ${orientation}, ${x}, ${y}, ${feePence}, ${variantId}, NOW(), 'pending_checkout', NOW(), NOW() + INTERVAL '30 days')`;
      saved.push({ id, key, name, type, side, orientation, x, y, feePence, position });
    }
    return NextResponse.json({ uploads: saved.map(({ id, name, type, side, orientation, x, y, feePence }) => ({ uploadId: id, name, type, side, orientation, x, y, feePence })) });
  } catch {
    await Promise.allSettled(saved.map((item) => deleteArtwork(item.key)));
    if (saved.length) {
      try { await db.sql`DELETE FROM custom_artwork WHERE id = ANY(${saved.map((item) => item.id)}::text[])`; } catch { /* Retried by scheduled cleanup. */ }
    }
    return NextResponse.json({ error: 'The artwork could not be uploaded. Please try again.' }, { status: 500 });
  }
}
