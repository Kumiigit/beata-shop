import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';
import { createStripeCheckout, type Stripe } from '@/lib/stripe';
import { STORE } from '@/lib/store-config';
import type { CheckoutRequest } from '@/types/store';

type Artwork = { id: string; name: string; position: string; type: 'logo' | 'a4' | 'a3' | 'mug'; side: 'front' | 'back'; orientation: 'portrait' | 'landscape'; x: number; y: number; feePence: number; variantId: string | null };
type CheckoutLine = {
  variantId: string;
  productName: string;
  size: string;
  colour: string;
  pricePence: number;
  quantity: number;
  artwork: Artwork[];
};

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL)
    return NextResponse.json(
      { error: 'Checkout needs the connected shop database.' },
      { status: 503 },
    );
  const body = (await request
    .json()
    .catch(() => null)) as CheckoutRequest | null;
  if (
    !body?.termsAccepted ||
    !Array.isArray(body.items) ||
    body.items.length < 1 ||
    body.items.length > 20
  )
    return NextResponse.json(
      {
        error:
          'Please review your bag and accept the Terms and Privacy Notice.',
      },
      { status: 400 },
    );
  for (const item of body.items) {
    if (
      !item ||
      typeof item.variantId !== 'string' ||
      (item.colourId !== undefined && typeof item.colourId !== 'string') ||
      !Number.isInteger(item.quantity) ||
      item.quantity < 1 ||
      item.quantity > 10
    )
      return NextResponse.json(
        { error: 'A bag quantity is invalid.' },
        { status: 400 },
      );
    if (
      item.customPrint &&
      (!Array.isArray(item.customPrint.uploadIds) ||
        item.customPrint.uploadIds.length < 1 ||
        item.customPrint.uploadIds.length > 3 ||
        item.customPrint.uploadIds.some((id) => typeof id !== 'string'))
    )
      return NextResponse.json(
        { error: 'A custom-print item is invalid.' },
        { status: 400 },
      );
  }

  const db = getDatabase();
  const client = await db.pool.connect();
  const lines: CheckoutLine[] = [];
  const orderId = crypto.randomUUID();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 31 * 60 * 1000);
  try {
    await client.query('BEGIN');
    for (const item of body.items) {
      const result = await client.query(
        'SELECT v.id AS variant_id, v.size, v.stock_on_hand, v.reserved, v.active AS variant_active, p.name AS product_name, p.price_pence, p.details_json, p.category, p.active AS product_active FROM variants v JOIN products p ON p.id = v.product_id WHERE v.id = $1 FOR UPDATE',
        [item.variantId],
      );
      const row = result.rows[0];
      if (!row || !row.variant_active || !row.product_active)
        throw new Error('One of these products is no longer available.');
      if (row.stock_on_hand - row.reserved < item.quantity)
        throw new Error(
          `${row.product_name} in ${row.size} does not have enough stock.`,
        );
      const presentation = typeof row.details_json === 'string' ? JSON.parse(row.details_json) : row.details_json;
      if (item.customPrint && presentation?.customPrintingAvailable !== true)
        throw new Error(`${row.product_name} is not available for custom printing.`);
      let artwork: Artwork[] = [];
      if (item.customPrint) {
        const uploads = await client.query(
          'SELECT id, original_name, print_position, print_type, print_side, print_orientation, placement_x, placement_y, fee_pence, variant_id FROM custom_artwork WHERE id = ANY($1::text[]) AND status = $2 FOR UPDATE',
          [item.customPrint.uploadIds, 'pending_checkout'],
        );
        if (uploads.rowCount !== item.customPrint.uploadIds.length)
          throw new Error(
            'One or more artwork uploads have expired or are already in use.',
          );
        artwork = uploads.rows.map(
          (upload: {
            id: string;
            original_name: string;
            print_position: string;
            print_type: 'logo' | 'a4' | 'a3' | 'mug';
            print_side: 'front' | 'back';
            print_orientation: 'portrait' | 'landscape';
            placement_x: number;
            placement_y: number;
            fee_pence: number;
            variant_id: string | null;
          }) => ({
            id: upload.id,
            name: upload.original_name,
            position: upload.print_position,
            type: upload.print_type,
            side: upload.print_side,
            orientation: upload.print_orientation,
            x: upload.placement_x,
            y: upload.placement_y,
            feePence: upload.fee_pence,
            variantId: upload.variant_id,
          }),
        );
        const mug = row.category === 'Mugs';
        if (mug ? artwork.length !== 1 || artwork[0].type !== 'mug' : artwork.some((entry) => entry.type === 'mug')) throw new Error('Mugs use one complete wrap design with a flat £2 printing charge.');
        if (artwork.some((entry) => entry.type === 'mug' && (entry.side !== 'front' || entry.orientation !== 'landscape' || entry.x !== 50 || entry.y !== 50))) throw new Error('Invalid mug wrap.');
        if (new Set(artwork.map((artworkItem) => artworkItem.type)).size !== artwork.length || artwork.some((artworkItem) => STORE.customPrintFeesPence[artworkItem.type] !== artworkItem.feePence || !['portrait', 'landscape'].includes(artworkItem.orientation) || (artworkItem.type === 'logo' && (artworkItem.side !== 'front' || artworkItem.orientation !== 'portrait')) || (artworkItem.variantId !== null && artworkItem.variantId !== item.variantId))) throw new Error('One or more custom-print selections are invalid.');
      }
      const colours = Array.isArray(presentation?.colours) ? presentation.colours : [];
      const colour = item.colourId ? colours.find((entry: { id?: unknown }) => entry.id === item.colourId) : null;
      if (item.colourId && !colour) throw new Error(`The selected colour for ${row.product_name} is no longer available.`);
      const basePrice = colour?.pricePence === null || colour?.pricePence === undefined ? Number(row.price_pence) : Number(colour.pricePence);
      const artworkFeePence = artwork.reduce((sum, item) => sum + item.feePence, 0);
      const pricePence = basePrice + artworkFeePence;
      lines.push({
        variantId: item.variantId,
        productName: row.product_name,
        size: row.size,
        colour: typeof colour?.name === 'string' ? colour.name : '',
        pricePence,
        quantity: item.quantity,
        artwork,
      });
      await client.query(
        'UPDATE variants SET reserved = reserved + $1 WHERE id = $2',
        [item.quantity, item.variantId],
      );
    }
    const subtotal = lines.reduce(
      (sum, line) => sum + line.pricePence * line.quantity,
      0,
    );
    const shipping =
      subtotal >= STORE.freeShippingThresholdPence ? 0 : STORE.shippingPence;
    const hasCustom = lines.some((line) => line.artwork.length);
    await client.query(
      'INSERT INTO orders (id, stripe_session_id, status, customer_email, subtotal_pence, shipping_pence, total_pence, reservation_expires_at, terms_accepted_at, custom_status, approval_token, created_at, updated_at) VALUES ($1,NULL,$2,NULL,$3,$4,$5,$6,$7,$8,$9,$7,$7)',
      [
        orderId,
        'reserving',
        subtotal,
        shipping,
        subtotal + shipping,
        expiresAt,
        now,
        hasCustom ? 'awaiting_artwork_review' : null,
        hasCustom ? crypto.randomUUID() : null,
      ],
    );
    for (const line of lines) {
      await client.query(
        'INSERT INTO order_items (id, order_id, variant_id, product_name, size, unit_price_pence, quantity, custom_print, artwork_fee_pence, artwork_json) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)',
        [
          crypto.randomUUID(),
          orderId,
          line.variantId,
          line.productName,
          line.colour ? `${line.size} · ${line.colour}` : line.size,
          line.pricePence,
          line.quantity,
          line.artwork.length > 0,
          line.artwork.reduce((sum, item) => sum + item.feePence, 0),
          JSON.stringify(line.artwork),
        ],
      );
      if (line.artwork.length)
        await client.query(
          "UPDATE custom_artwork SET order_id=$1,status='attached',delete_after=NULL WHERE id = ANY($2::text[])",
          [orderId, line.artwork.map((item) => item.id)],
        );
    }
    await client.query('COMMIT');
    const origin = new URL(request.url).origin;
    const suffix = orderId
      .replace(/[^a-f]/g, '')
      .slice(0, 8)
      .padEnd(8, 'a');
    const params: Stripe.Checkout.SessionCreateParams = {
      mode: 'payment',
      locale: 'en-GB',
      customer_creation: 'always',
      client_reference_id: orderId,
      integration_identifier: `beata_shop_${suffix}`,
      metadata: { order_id: orderId, custom_print: hasCustom ? 'yes' : 'no' },
      payment_intent_data: { metadata: { order_id: orderId } },
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout/cancel`,
      expires_at: Math.floor(expiresAt.getTime() / 1000),
      phone_number_collection: { enabled: true },
      shipping_address_collection: { allowed_countries: ['GB'] },
      shipping_options: [
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            display_name: shipping
              ? 'InPost — mainland Great Britain'
              : 'Free InPost — mainland Great Britain',
            fixed_amount: { amount: shipping, currency: 'gbp' },
          },
        },
      ],
      line_items: lines.map((line) => ({
        price_data: {
          currency: 'gbp',
          unit_amount: line.pricePence,
          product_data: {
            name: line.productName,
            description: [line.size === 'One size' ? 'One size' : `Size ${line.size}`, line.colour, line.artwork.length ? `custom print: ${line.artwork.map((item) => item.position).join(', ')}` : ''].filter(Boolean).join(' · '),
          },
        },
        quantity: line.quantity,
      })),
    };
    try {
      const session = await createStripeCheckout(params, orderId);
      await db.sql`UPDATE orders SET stripe_session_id = ${session.id}, status = 'awaiting_payment', updated_at = NOW() WHERE id = ${orderId}`;
      return NextResponse.json({ checkoutUrl: session.url, orderId });
    } catch (error) {
      await releaseOrder(orderId, lines, 'configuration_required');
      return NextResponse.json(
        {
          error:
            error instanceof Error
              ? error.message
              : 'Checkout could not be created.',
        },
        { status: 503 },
      );
    }
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Checkout is temporarily unavailable.',
      },
      { status: 409 },
    );
  } finally {
    client.release();
  }
}

async function releaseOrder(
  orderId: string,
  lines: CheckoutLine[],
  status: string,
) {
  const db = getDatabase();
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      'UPDATE orders SET status=$1,updated_at=NOW() WHERE id=$2',
      [status, orderId],
    );
    for (const line of lines)
      await client.query(
        'UPDATE variants SET reserved=GREATEST(reserved-$1,0) WHERE id=$2',
        [line.quantity, line.variantId],
      );
    await client.query(
      "UPDATE custom_artwork SET order_id=NULL,status='pending_checkout',delete_after=NOW()+INTERVAL '30 days' WHERE order_id=$1",
      [orderId],
    );
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
