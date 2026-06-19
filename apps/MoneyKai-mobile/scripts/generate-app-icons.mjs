import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Jimp from 'jimp-compact';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(projectRoot, '..', '..');
const sourcePath = path.join(repoRoot, 'LOGO.jpeg');
const outputDir = path.join(projectRoot, 'assets', 'images');

const SIZE = 1024;
const FOREGROUND_SCALE = 0.62;
const WHITE = Jimp.rgbaToInt(255, 255, 255, 255);
const TRANSPARENT = Jimp.rgbaToInt(255, 255, 255, 0);

const isNearWhite = ({ r, g, b }) => r >= 245 && g >= 245 && b >= 245;

const transparentWhite = (image) => {
  image.scan(0, 0, image.bitmap.width, image.bitmap.height, function scanWhiteToTransparent(x, y, idx) {
    const color = Jimp.intToRGBA(this.getPixelColor(x, y));
    if (isNearWhite(color)) {
      this.bitmap.data[idx + 3] = 0;
    } else {
      this.bitmap.data[idx] = 0;
      this.bitmap.data[idx + 1] = 0;
      this.bitmap.data[idx + 2] = 0;
      this.bitmap.data[idx + 3] = 255;
    }
  });
  return image;
};

const centeredCanvas = async (image, backgroundColor) => {
  const canvas = await new Jimp(SIZE, SIZE, backgroundColor);
  const x = Math.round((SIZE - image.bitmap.width) / 2);
  const y = Math.round((SIZE - image.bitmap.height) / 2);
  canvas.composite(image, x, y);
  return canvas;
};

const makeForeground = async () => {
  const logo = await Jimp.read(sourcePath);
  logo.autocrop(0.02);
  transparentWhite(logo);
  logo.contain(Math.round(SIZE * FOREGROUND_SCALE), Math.round(SIZE * FOREGROUND_SCALE), Jimp.HORIZONTAL_ALIGN_CENTER | Jimp.VERTICAL_ALIGN_MIDDLE);
  return centeredCanvas(logo, TRANSPARENT);
};

const makeLauncherIcon = async (foreground) => {
  const canvas = await new Jimp(SIZE, SIZE, WHITE);
  canvas.composite(foreground, 0, 0);
  return canvas;
};

const makeMonochrome = async (foreground) => {
  const monochrome = foreground.clone();
  monochrome.scan(0, 0, monochrome.bitmap.width, monochrome.bitmap.height, function normalizeMonochrome(x, y, idx) {
    const alpha = this.bitmap.data[idx + 3];
    this.bitmap.data[idx] = 0;
    this.bitmap.data[idx + 1] = 0;
    this.bitmap.data[idx + 2] = 0;
    this.bitmap.data[idx + 3] = alpha > 0 ? 255 : 0;
  });
  return monochrome;
};

const main = async () => {
  const foreground = await makeForeground();
  const launcherIcon = await makeLauncherIcon(foreground);
  const background = await new Jimp(SIZE, SIZE, WHITE);
  const monochrome = await makeMonochrome(foreground);

  await launcherIcon.writeAsync(path.join(outputDir, 'icon.png'));
  await launcherIcon.writeAsync(path.join(outputDir, 'moneykai-logo.png'));
  await foreground.writeAsync(path.join(outputDir, 'android-icon-foreground.png'));
  await background.writeAsync(path.join(outputDir, 'android-icon-background.png'));
  await monochrome.writeAsync(path.join(outputDir, 'android-icon-monochrome.png'));
  await launcherIcon.resize(192, 192).writeAsync(path.join(outputDir, 'favicon.png'));
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
