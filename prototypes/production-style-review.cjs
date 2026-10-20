// Confirm production CSS compression preserves the rendered design.
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  let compared = 0;
  try {
    for (const width of [390, 1440]) for (const colorScheme of ['light', 'dark']) {
      const context = await browser.newContext({ viewport: { width, height: 900 }, colorScheme, reducedMotion: 'reduce' });
      const page = await context.newPage();
      const settleImages = () => page.evaluate(async () => {
        await Promise.all([...document.images].filter(image => image.loading !== 'lazy' || image.getBoundingClientRect().top < innerHeight)
          .map(image => image.decode().catch(() => {})));
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      });
      const imageStyles = () => page.locator('img, svg image').evaluateAll(images => images
        .filter(image => { const rect = image.getBoundingClientRect(); return rect.top < innerHeight && rect.bottom > 0; })
        .map(image => {
          const css = getComputedStyle(image), rect = image.getBoundingClientRect();
          return [image.currentSrc || image.getAttribute('href'), rect.x, rect.y, rect.width, rect.height,
            css.objectFit, css.objectPosition, css.filter, css.transform, css.opacity];
        }));
      for (const route of ['/', '/research/', '/posts/MISSA-ITC-Competition/', '/journey/']) {
        await page.goto('http://127.0.0.1:4173' + route, { waitUntil: 'networkidle' });
        await settleImages();
        const imageSources = await imageStyles();
        // Chrome can rasterize the same decoded photo with slightly different
        // sampling after reload. Check its source/style/geometry separately.
        const production = await page.screenshot({ animations: 'disabled', mask: [page.locator('img, svg image')] });
        await page.route('**/assets/css/*.css*', request => request.fulfill({
          contentType: 'text/css', body: fs.readFileSync(path.join(process.cwd(), new URL(request.request().url()).pathname)),
        }));
        await page.reload({ waitUntil: 'networkidle' });
        await settleImages();
        const reloadedSources = await imageStyles();
        assert.deepEqual(reloadedSources, imageSources, 'Responsive image selection must be stable');
        const source = await page.screenshot({ animations: 'disabled', mask: [page.locator('img, svg image')] });
        const differences = await page.evaluate(async ([a, b]) => {
          const pixels = async data => {
            const image = new Image(); image.src = 'data:image/png;base64,' + data; await image.decode();
            const canvas = document.createElement('canvas'); canvas.width = image.width; canvas.height = image.height;
            const context = canvas.getContext('2d'); context.drawImage(image, 0, 0);
            return context.getImageData(0, 0, canvas.width, canvas.height).data;
          };
          const x = await pixels(a), y = await pixels(b);
          let changed = 0; const box = [Infinity, Infinity, 0, 0]; let maxDelta = 0;
          for (let i = 0; i < x.length; i += 4)
            if (x[i] !== y[i] || x[i + 1] !== y[i + 1] || x[i + 2] !== y[i + 2]) {
              changed++; const px = i / 4 % innerWidth, py = Math.floor(i / 4 / innerWidth);
              box[0] = Math.min(box[0], px); box[1] = Math.min(box[1], py);
              box[2] = Math.max(box[2], px); box[3] = Math.max(box[3], py);
              maxDelta = Math.max(maxDelta, Math.abs(x[i] - y[i]), Math.abs(x[i + 1] - y[i + 1]), Math.abs(x[i + 2] - y[i + 2]));
            }
          return { changed, box, maxDelta };
        }, [production.toString('base64'), source.toString('base64')]);
        if (differences.maxDelta > 1) {
          fs.writeFileSync('test-results/style-production.png', production);
          fs.writeFileSync('test-results/style-source.png', source);
        }
        // Native color/compositing normalization can round a channel by one.
        assert.ok(differences.maxDelta <= 1, `${route} ${width}px ${colorScheme}: ${JSON.stringify(differences)}`);
        await page.unroute('**/assets/css/*.css*');
        compared++;
      }
      await context.close();
    }
    console.log(`PASS: ${compared} source/production UI views match within one RGB level; image sources, geometry and appearance styles match`);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
