// Export complete, individually illustrated poses. The browser never assembles limbs.
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const count = 10;

(async () => {
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.CHROME_CHANNEL ? { channel: process.env.CHROME_CHANNEL } : {}),
  });
  try {
    const page = await browser.newPage();
    for (let index = 1; index <= count; index += 1) {
      const number = String(index).padStart(2, '0');
      const source = path.join(root, 'assets', 'img', 'ascent-climber-sequence', 'pose-' + number + '.png');
      const data = fs.readFileSync(source).toString('base64');
      const result = await page.evaluate(async data => {
        const image = new Image();
        image.src = 'data:image/png;base64,' + data;
        await image.decode();
        const draft = document.createElement('canvas');
        draft.width = 400;
        draft.height = 533;
        const draftContext = draft.getContext('2d', { willReadFrequently: true });
        const scale = Math.min(360 / image.width, 500 / image.height);
        const width = image.width * scale;
        const height = image.height * scale;
        draftContext.drawImage(image, (400 - width) / 2, (533 - height) / 2, width, height);

        // Register the stable blue lens, rather than the varying axe or boot tips.
        const pixels = draftContext.getImageData(0, 0, 400, 533).data;
        let totalX = 0, totalY = 0, count = 0;
        for (let y = 35; y < 190; y += 1) {
          for (let x = 60; x < 350; x += 1) {
            const offset = (y * 400 + x) * 4;
            const [red, green, blue, alpha] = pixels.subarray(offset, offset + 4);
            if (alpha > 170 && blue > 90 && blue > red * 1.35 && green > red * 1.1) {
              totalX += x; totalY += y; count += 1;
            }
          }
        }
        if (count < 15) throw new Error('Could not register blue goggles');
        const output = document.createElement('canvas');
        output.width = 400;
        output.height = 533;
        output.getContext('2d').drawImage(draft,
          Math.round(211 - totalX / count), Math.round(104 - totalY / count));
        return {
          data: output.toDataURL('image/webp', .86).split(',')[1],
          goggle: [Math.round(totalX / count), Math.round(totalY / count)],
        };
      }, data);
      const target = path.join(root, 'assets', 'media', 'ascent-climber-frame-' + number + '.webp');
      fs.writeFileSync(target, Buffer.from(result.data, 'base64'));
      console.log(path.relative(root, target) + ' ' + fs.statSync(target).size + ' bytes; lens ' + result.goggle);
    }
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
