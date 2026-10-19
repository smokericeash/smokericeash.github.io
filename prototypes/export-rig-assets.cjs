const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');

const files = [
  ['ascent-summit-ledge-study.png', 'ascent-summit-ledge.webp'],
  ['ascent-planting-pose-study.png', 'ascent-planting-pose.webp'],
  ['ascent-standing-pose-study.png', 'ascent-standing-pose.webp'],
];
const crops = [
  ['left-leg-thigh', 190, 540, 360, 420],
  ['left-leg-shin', 215, 915, 350, 530],
  ['right-leg-thigh', 655, 540, 365, 420],
  ['right-leg-shin', 675, 915, 345, 530],
  ['left-arm-whole', 70, 65, 510, 490],
  ['right-arm-whole', 590, 40, 430, 485],
];

(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const page = await browser.newPage();
  try {
    for (const [input, output] of files) {
      const source = fs.readFileSync(path.join(__dirname, input)).toString('base64');
      const encoded = await page.evaluate(async base64 => {
        const image = new Image();
        image.src = `data:image/png;base64,${base64}`;
        await image.decode();
        const canvas = document.createElement('canvas');
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        canvas.getContext('2d').drawImage(image, 0, 0);
        return canvas.toDataURL('image/webp', .88).split(',')[1];
      }, source);
      const destination = path.resolve('assets/media', output);
      fs.writeFileSync(destination, Buffer.from(encoded, 'base64'));
      console.log(`${output}: ${fs.statSync(destination).size} bytes`);
    }
    const atlas = fs.readFileSync(path.join(__dirname, 'climber-rig-components-study.png')).toString('base64');
    for (const [name, x, y, width, height] of crops) {
      const encoded = await page.evaluate(async ({ atlas, x, y, width, height }) => {
        const image = new Image();
        image.src = `data:image/png;base64,${atlas}`;
        await image.decode();
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d').drawImage(image, x, y, width, height, 0, 0, width, height);
        return canvas.toDataURL('image/webp', .9).split(',')[1];
      }, { atlas, x, y, width, height });
      const destination = path.resolve('assets/media', `ascent-rig-${name}.webp`);
      fs.writeFileSync(destination, Buffer.from(encoded, 'base64'));
      console.log(`${path.basename(destination)}: ${fs.statSync(destination).size} bytes`);
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
