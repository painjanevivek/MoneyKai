import { mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const symbolPath = path.join(rootDir, 'apps', 'MoneyKai-web', 'public', 'brand', 'moneykai-symbol-logo.svg');
const appAssetDirectories = [
  path.join(rootDir, 'apps', 'MoneyKai-mobile', 'assets', 'images'),
  path.join(rootDir, 'apps', 'MoneyKai-android', 'assets', 'images'),
  path.join(rootDir, 'apps', 'MoneyKai-web', 'assets', 'images'),
];
const publicBrandDirectory = path.join(rootDir, 'apps', 'MoneyKai-web', 'public', 'brand');

const transparentMark = (svg) => svg.replace(/\s*<rect[^>]*fill="#000000"\/>/, '');

const foregroundSvg = (mark) => mark.replace(
  /(<svg[^>]*>)/,
  '$1<g transform="translate(192 192) scale(1.25)">'
).replace('</svg>', '</g></svg>');

const blackBackgroundSvg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"><rect width="1" height="1" fill="#000000"/></svg>';

async function render(page, svg, outputPath, { size, transparent = false, type = 'png' }) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<style>html,body{margin:0;width:100%;height:100%;background:transparent}svg{display:block;width:100%;height:100%}</style>${svg}`);
  await page.screenshot({
    path: outputPath,
    type,
    quality: type === 'jpeg' ? 92 : undefined,
    omitBackground: transparent,
  });
}

async function main() {
  const symbol = await readFile(symbolPath, 'utf8');
  const foreground = foregroundSvg(transparentMark(symbol));
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    for (const directory of appAssetDirectories) {
      await mkdir(directory, { recursive: true });
      await render(page, symbol, path.join(directory, 'icon.png'), { size: 1024 });
      await render(page, symbol, path.join(directory, 'moneykai-logo.png'), { size: 1024 });
      await render(page, symbol, path.join(directory, 'logo-glow.png'), { size: 1024 });
      await render(page, symbol, path.join(directory, 'splash-icon.png'), { size: 1024 });
      await render(page, symbol, path.join(directory, 'favicon.png'), { size: 192 });
      await render(page, foreground, path.join(directory, 'android-icon-foreground.png'), { size: 1024, transparent: true });
      await render(page, foreground, path.join(directory, 'android-icon-monochrome.png'), { size: 1024, transparent: true });
      await render(page, blackBackgroundSvg, path.join(directory, 'android-icon-background.png'), { size: 1024 });
      await render(page, symbol, path.join(directory, 'moneykai-logo.jpeg'), { size: 1024, type: 'jpeg' });

      if (!directory.endsWith('MoneyKai-web\\assets\\images')) {
        await render(page, symbol, path.join(directory, 'moneykai-app-logo-source.jpeg'), { size: 1024, type: 'jpeg' });
      }
    }

    await render(page, symbol, path.join(publicBrandDirectory, 'moneykai-mark-96.png'), { size: 96 });
    await render(page, symbol, path.join(publicBrandDirectory, 'moneykai-mark.jpeg'), { size: 1024, type: 'jpeg' });
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
