import { readdir, readFile } from 'node:fs/promises';
const directory = '.next/static';
const files = (await readdir(directory, { recursive: true })).filter(name => name.endsWith('.css'));
const css = (await Promise.all(files.map(name => readFile(`${directory}/${name}`, 'utf8')))).join('\n');
for (const selector of ['.spectrum-inventory', '.spectrum-summary', '.spectrum-filters', '.spectrum-product-table', '.spectrum-drawer']) {
  if (!css.includes(`${selector}{`)) throw new Error(`Missing production admin CSS: ${selector}`);
}
console.log('Production admin layout CSS verified.');
