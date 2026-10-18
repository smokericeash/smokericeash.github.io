// Read-only measurement of the existing wall cutout's alpha silhouette.
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    const page = await browser.newPage();
    await page.goto('http://127.0.0.1:4173/');
    const profile = await page.evaluate(async () => {
      const image = new Image();
      image.src = '/assets/media/ascent-icewall-800.webp';
      await image.decode();
      const canvas = document.createElement('canvas');
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const context = canvas.getContext('2d', { willReadFrequently: true });
      context.drawImage(image, 0, 0);
      const rgba = context.getImageData(0, 0, canvas.width, canvas.height).data;
      const points = [];
      for (let sample = 0; sample <= 20; sample += 1) {
        const imageY = Math.min(canvas.height - 1, Math.round(sample * (canvas.height - 1) / 20));
        let imageX = -1;
        for (let x = 0; x < canvas.width; x += 1) {
          if (rgba[(imageY * canvas.width + x) * 4 + 3] >= 128) { imageX = x; break; }
        }
        points.push({ imageY, imageX, svgXAt600: +(imageX * 600 / canvas.width).toFixed(1) });
      }
      return { width: canvas.width, height: canvas.height, points };
    });
    console.log(JSON.stringify(profile, null, 2));
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
