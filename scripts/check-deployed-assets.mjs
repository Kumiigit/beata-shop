import assert from 'node:assert/strict';

const base = process.argv[2];
assert(base, 'Usage: node scripts/check-deployed-assets.mjs https://deploy-url');
const assets = new Set();
for (const path of ['/', '/shop', '/admin/insights']) {
  const response = await fetch(new URL(path, base));
  assert.equal(response.status, 200, `${path} must load`);
  const html = await response.text();
  const matches = [...html.matchAll(/(?:href|src)="([^"]*\/_next\/static\/[^"?]+\.(?:css|js))(?:\?[^" ]*)?"/g)];
  assert(matches.some((match) => match[1].endsWith('.css')), `${path} must reference CSS`);
  assert(matches.some((match) => match[1].endsWith('.js')), `${path} must reference JavaScript`);
  for (const match of matches) assets.add(match[1]);
}
for (const path of assets) {
  const response = await fetch(new URL(path, base));
  assert.equal(response.status, 200, `Missing deployed asset: ${path}`);
  const type = response.headers.get('content-type') || '';
  assert(path.endsWith('.css') ? type.includes('text/css') : /javascript/.test(type), `Wrong content type for ${path}: ${type}`);
  const body = await response.text();
  assert(body.length > 0, `Empty deployed asset: ${path}`);
  if (path.endsWith('.css')) {
    for (const match of body.matchAll(/url\(["']?([^\s)"']+\.(?:woff2?|ttf|otf))(?:["']?)\)/g)) {
      const fontUrl = new URL(match[1], new URL(path, base));
      const font = await fetch(fontUrl);
      assert.equal(font.status, 200, `Missing deployed font: ${fontUrl.pathname}`);
      await font.arrayBuffer();
    }
  }
}
console.log(`Deployed CSS, JavaScript and fonts verified: ${assets.size} assets across 3 pages.`);
