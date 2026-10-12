// Export sixteen independently drawn, complete climber poses. No separate limbs
// or runtime transforms are involved: each WebP is one entire illustration.
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const sheets = [
  { file: 'ascent-climber-clean-right.png', frames: [0, 1, 2] },
  { file: 'ascent-climber-clean-crossover-left.png', frames: [0] },
  { file: 'ascent-climber-clean-right.png', frames: [3] },
  { file: 'ascent-climber-clean-crossover-left.png', frames: [1, 2, 3] },
  { file: 'ascent-climber-clean-left.png', frames: [0, 1, 2, 3] },
  { file: 'ascent-climber-clean-crossover-right.png', frames: [0, 2, 1, 3] },
];

(async () => {
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.CHROME_CHANNEL ? { channel: process.env.CHROME_CHANNEL } : {}),
  });
  try {
    const page = await browser.newPage();
    let number = 0;
    for (const sheet of sheets) {
      const data = fs.readFileSync(path.join(root, 'assets', 'img', sheet.file)).toString('base64');
      const frames = await page.evaluate(async ({ data, indices }) => {
        const image = new Image();
        image.src = `data:image/png;base64,${data}`;
        await image.decode();
        const cellWidth = image.width / 2;
        const cellHeight = image.height / 2;
        return indices.map(index => {
          const draft = document.createElement('canvas');
          draft.width = 400;
          draft.height = 533;
          const draftContext = draft.getContext('2d', { willReadFrequently: true });
          const scale = Math.min(360 / cellWidth, 500 / cellHeight);
          const width = cellWidth * scale;
          const height = cellHeight * scale;
          draftContext.drawImage(image,
            (index % 2) * cellWidth, Math.floor(index / 2) * cellHeight,
            cellWidth, cellHeight, (400 - width) / 2, (533 - height) / 2,
            width, height);
          // Align blue goggle lenses so differing source placement cannot make
          // the whole climber jump between otherwise complete drawings.
          const pixels = draftContext.getImageData(0, 0, 400, 533).data;
          let totalX = 0, totalY = 0, count = 0;
          for (let y = 30; y < 170; y += 1) {
            for (let x = 80; x < 330; x += 1) {
              const offset = (y * 400 + x) * 4;
              const [red, green, blue, alpha] = pixels.subarray(offset, offset + 4);
              if (alpha > 170 && blue > 90 && blue > red * 1.35 && green > red * 1.1) {
                totalX += x; totalY += y; count += 1;
              }
            }
          }
          if (count < 15) throw new Error(`Could not register goggles in pose ${index + 1}`);
          const output = document.createElement('canvas');
          output.width = 400;
          output.height = 533;
          const context = output.getContext('2d', { willReadFrequently: true });
          context.drawImage(draft,
            Math.round(211 - totalX / count), Math.round(104 - totalY / count));
          // A neighboring sheet cell can leave a tiny axe-tip island inside
          // the crop. Remove only isolated pieces too small to be body parts.
          const imageData = context.getImageData(0, 0, 400, 533);
          const seen = new Uint8Array(400 * 533);
          for (let seed = 0; seed < seen.length; seed += 1) {
            if (seen[seed] || imageData.data[seed * 4 + 3] < 24) continue;
            const queue = [seed];
            seen[seed] = 1;
            for (let cursor = 0; cursor < queue.length; cursor += 1) {
              const position = queue[cursor];
              const x = position % 400;
              const y = Math.floor(position / 400);
              for (const neighbor of [position - 1, position + 1, position - 400, position + 400]) {
                if (neighbor < 0 || neighbor >= seen.length || seen[neighbor] ||
                    Math.abs(neighbor % 400 - x) + Math.abs(Math.floor(neighbor / 400) - y) !== 1 ||
                    imageData.data[neighbor * 4 + 3] < 24) continue;
                seen[neighbor] = 1;
                queue.push(neighbor);
              }
            }
            if (queue.length < 240) {
              for (const pixel of queue) imageData.data[pixel * 4 + 3] = 0;
            }
          }
          context.putImageData(imageData, 0, 0);
          return {
            data: output.toDataURL('image/webp', .84).split(',')[1],
            goggle: [Math.round(totalX / count), Math.round(totalY / count)],
          };
        });
      }, { data, indices: sheet.frames });
      for (const frame of frames) {
        number += 1;
        const target = path.join(root, 'assets', 'media',
          `ascent-climber-frame-${String(number).padStart(2, '0')}.webp`);
        fs.writeFileSync(target, Buffer.from(frame.data, 'base64'));
        console.log(`${path.relative(root, target)} ${fs.statSync(target).size} bytes; lens ${frame.goggle}`);
      }
    }
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
