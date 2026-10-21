import { readFileSync } from 'node:fs';
import path from 'node:path';
import pg from 'pg';

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not configured.');

const apply = process.argv.includes('--apply') || process.env.APPLY_BACK_IMAGES === '1';
const connectionUrl = new URL(process.env.DATABASE_URL);
for (const parameter of ['sslmode', 'sslrootcert', 'uselibpqcompat']) connectionUrl.searchParams.delete(parameter);
const ca = readFileSync(path.join(process.cwd(), 'certs', 'supabase-prod-ca-2021.crt'), 'utf8');
const client = new pg.Client({ connectionString: connectionUrl.toString(), ssl: { ca, rejectUnauthorized: true } });

const backs = {
  hoodie: {
    black: '/products/custom/plain-hoodie-black-back.png',
    white: '/products/custom/plain-hoodie-white-back.png',
  },
  shirt: {
    black: '/products/custom/plain-tshirt-black-back.png',
    white: '/products/custom/plain-tshirt-white-back.png',
    blue: '/products/custom/plain-tshirt-blue-back.png',
    yellow: '/products/custom/plain-tshirt-yellow-back.png',
  },
};

const shirtFrontColours = {
  '/api/product-images/f78d21ab-77ae-4733-8618-5200a89916df.png': 'Black',
  '/api/product-images/676dffc7-9a08-493c-a285-6dd4f2852ce8.png': 'Yellow',
  '/api/product-images/8734040e-c638-4506-94d2-57cbd3c7b605.png': 'White',
  '/api/product-images/a347a81c-ed3b-44f8-a8f5-21bf31bcd8c9.png': 'Blue',
};

await client.connect();
try {
  const result = await client.query('SELECT id, name, category, details_json FROM products ORDER BY name');
  let changedProducts = 0;
  for (const product of result.rows) {
    const details = typeof product.details_json === 'string' ? JSON.parse(product.details_json) : product.details_json;
    if (details?.customPrintingAvailable !== true || !Array.isArray(details.colours)) continue;
    const kind = `${product.name} ${product.category}`.toLowerCase().includes('hoodie') ? 'hoodie' : 'shirt';
    let changed = false;
    const sourceColours = details.colours.length === 0 && kind === 'shirt'
      ? (details.imageUrls ?? []).flatMap((imageUrl) => {
          const name = shirtFrontColours[imageUrl];
          return name ? [{ id: `plain-tshirt-${name.toLowerCase()}`, name, imageUrl, pricePence: null }] : [];
        })
      : details.colours;
    if (sourceColours.length !== details.colours.length) changed = true;
    const colours = sourceColours.map((colour) => {
      const colourName = String(colour.name ?? '').toLowerCase();
      const colourKey = Object.keys(backs[kind]).find((key) => colourName.includes(key));
      if (!colourKey) return colour;
      const backImageUrl = backs[kind][colourKey];
      if (colour.backImageUrl === backImageUrl) return colour;
      changed = true;
      return { ...colour, backImageUrl };
    });
    console.log(`${product.name}: ${colours.map((colour) => `${colour.name} -> ${colour.backImageUrl ?? 'no back image'}`).join(', ')}`);
    if (apply && changed) {
      await client.query('UPDATE products SET details_json = $1, updated_at = NOW() WHERE id = $2', [JSON.stringify({ ...details, colours }), product.id]);
      changedProducts += 1;
    }
  }
  console.log(apply ? `Updated ${changedProducts} product(s).` : 'Dry run only. Pass --apply to save these mappings.');
} finally {
  await client.end();
}
