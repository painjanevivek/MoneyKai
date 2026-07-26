import { chromium } from 'playwright';
import { resolve } from 'node:path';

const output = resolve('outputs/contra-moneykai');
const pageUrl = `file:///${resolve(output, 'case-study.html').replaceAll('\\', '/')}`;
const captures = [
  ['#cover', '01-cover.png'],
  ['#dashboard', '02-dashboard.png'],
  ['#detail', '03-portfolio-detail.png'],
  ['#core-flow', '04-core-flow.png'],
  ['#mobile', '05-mobile.png'],
  ['#process', '06-wireframe-to-product.png'],
];

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1700, height: 1100 }, deviceScaleFactor: 1 });
await page.goto(pageUrl, { waitUntil: 'load' });
for (const [selector, filename] of captures) {
  await page.locator(selector).screenshot({ path: resolve(output, filename) });
}
await browser.close();
