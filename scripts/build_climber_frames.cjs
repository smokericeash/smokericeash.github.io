// Rebuild the optimized full-body frames from the three original sprite sheets.
// Run with CHROME_CHANNEL=chrome node scripts/build_climber_frames.cjs.
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const sheets = [
  { file: 'ascent-climber-cycle-right-a.png', offsetX: 0 },
  { file: 'ascent-climber-cycle-left.png', offsetX: -40 },
  { file: 'ascent-climber-cycle-right-b.png', offsetX: 0 },
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
      const source = fs.readFileSync(path.join(root, 'assets', 'img', sheet.file));
      const frames = await page.evaluate(async ({ data, offsetX }) => {
        const image = new Image();
        image.src = `data:image/png;base64,${data}`;
        await image.decode();
        const width = image.width / 2;
        const height = image.height / 2;
        if (!Number.isInteger(width) || !Number.isInteger(height))
          throw new Error('The source sheet needs four equal cells');
        return Array.from({ length: 4 }, (_, index) => {
          const canvas = document.createElement('canvas');
          canvas.width = 400;
          canvas.height = 533;
          const context = canvas.getContext('2d');
          context.drawImage(image,
            (index % 2) * width, Math.floor(index / 2) * height, width, height,
            offsetX * canvas.width / width, 0, canvas.width, canvas.height);
          // The generator occasionally lets a tool tip from an adjacent panel
          // cross a cell boundary. Remove only tiny disconnected edge islands.
          const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
          const seen = new Uint8Array(canvas.width * canvas.height);
          for (let seed = 0; seed < seen.length; seed += 1) {
            if (seen[seed] || pixels.data[seed * 4 + 3] < 20) continue;
            const queue = [seed];
            seen[seed] = 1;
            let left = canvas.width, top = canvas.height, right = 0, bottom = 0;
            for (let cursor = 0; cursor < queue.length; cursor += 1) {
              const value = queue[cursor];
              const x = value % canvas.width;
              const y = Math.floor(value / canvas.width);
              left = Math.min(left, x); right = Math.max(right, x);
              top = Math.min(top, y); bottom = Math.max(bottom, y);
              for (const neighbor of [value - 1, value + 1, value - canvas.width, value + canvas.width]) {
                if (neighbor < 0 || neighbor >= seen.length ||
                    Math.abs(neighbor % canvas.width - x) + Math.abs(Math.floor(neighbor / canvas.width) - y) !== 1 ||
                    seen[neighbor] || pixels.data[neighbor * 4 + 3] < 20) continue;
                seen[neighbor] = 1;
                queue.push(neighbor);
              }
            }
            if (queue.length < 350 && (left < 8 || top < 8 || right > canvas.width - 9 || bottom > canvas.height - 9))
              context.clearRect(Math.max(0, left - 2), Math.max(0, top - 2), right - left + 5, bottom - top + 5);
          }
          return canvas.toDataURL('image/webp', .82).split(',')[1];
        });
      }, { data: source.toString('base64'), offsetX: sheet.offsetX });
      for (const frame of frames) {
        number += 1;
        const target = path.join(root, 'assets', 'media', `ascent-climber-frame-${String(number).padStart(2, '0')}.webp`);
        fs.writeFileSync(target, Buffer.from(frame, 'base64'));
        console.log(`${path.relative(root, target)} ${fs.statSync(target).size} bytes`);
      }
    }
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
