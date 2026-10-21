import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
const products = JSON.parse(await readFile('data/local-inventory.json', 'utf8'));
const collections = JSON.parse(await readFile('data/local-collections.json', 'utf8'));
const urls = [...new Set(products.flatMap(p => [...(p.imageUrls ?? []), ...(p.colours ?? []).map(c => c.imageUrl)]).filter(Boolean))];
const images = {};
for (const url of urls) {
  if (!/^\/api\/product-images\/[\w-]+\.(png|jpg|webp)$/.test(url)) throw new Error('Unexpected image path');
  const bytes = await readFile(path.join('data/product-images', path.basename(url)));
  images[url] = { base64: bytes.toString('base64'), type: url.endsWith('.png') ? 'image/png' : url.endsWith('.webp') ? 'image/webp' : 'image/jpeg' };
}
await mkdir('outputs', { recursive: true });
await writeFile('outputs/inventory-transfer.json', JSON.stringify({ products, collections, images }));
console.log(`Exported ${products.length} products, ${collections.length} collections and ${urls.length} images. No credentials included.`);
