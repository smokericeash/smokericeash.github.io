// Export complete, individually illustrated poses. The browser never assembles limbs.
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
// Keep the approved source sequence untouched. The extra left-leg half step
// sits between original poses 01 and 02; every approved pose remains present.
const sources = ['01', '01-half', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];

(async () => {
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.CHROME_CHANNEL ? { channel: process.env.CHROME_CHANNEL } : {}),
  });
  try {
    const page = await browser.newPage();
    for (let index = 1; index <= sources.length; index += 1) {
      const number = String(index).padStart(2, '0');
      const source = path.join(root, 'assets', 'img', 'ascent-climber-clean', 'pose-' + sources[index - 1] + '.png');
      const data = fs.readFileSync(source).toString('base64');
      const originalNumber = sources[index - 1] === '01-half' ? '02' : sources[index - 1];
      const baseline = fs.readFileSync(path.join(root, 'assets', 'media',
        'ascent-climber-frame-' + originalNumber + '.webp')).toString('base64');
      const result = await page.evaluate(async ({ data, baseline }) => {
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
        // Cleanup can slightly change canvas occupancy. Register the complete
        // figure to BOTH approved goggles and the lowest planted crampon;
        // never stretch or transform an individual limb.
        const original = new Image();
        original.src = 'data:image/webp;base64,' + baseline;
        await original.decode();
        const reference = document.createElement('canvas');
        reference.width = 400;
        reference.height = 533;
        const referenceContext = reference.getContext('2d');
        referenceContext.drawImage(original, 0, 0);
        const bottom = pixels => {
          for (let y = 532; y >= 300; y -= 1)
            for (let x = 0; x < 400; x += 1)
              if (pixels[(y * 400 + x) * 4 + 3] > 160) return y;
          throw new Error('Could not register support boot');
        };
        const referenceBottom = bottom(referenceContext.getImageData(0, 0, 400, 533).data);
        const size = (referenceBottom - 104) / (bottom(pixels) - totalY / count);
        const output = document.createElement('canvas');
        output.width = 400;
        output.height = 533;
        output.getContext('2d').drawImage(draft,
          211 - totalX / count * size, 104 - totalY / count * size, 400 * size, 533 * size);
        return {
          data: output.toDataURL('image/webp', .86).split(',')[1],
          goggle: [Math.round(totalX / count), Math.round(totalY / count)],
        };
      }, { data, baseline });
      const target = path.join(root, 'assets', 'media', 'ascent-climber-clean-frame-' + number + '.webp');
      fs.writeFileSync(target, Buffer.from(result.data, 'base64'));
      console.log(path.relative(root, target) + ' ' + fs.statSync(target).size + ' bytes; lens ' + result.goggle);
    }
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
