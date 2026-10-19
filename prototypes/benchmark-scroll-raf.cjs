const { webkit } = require('playwright');

(async () => {
  const browser = await webkit.launch();
  try {
    for (const suffix of ['?rig=legacy', '']) {
      const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
      await page.goto(`http://127.0.0.1:4173/journey/${suffix}`);
      await page.locator('.expedition-checkpoint').nth(1).scrollIntoViewIfNeeded();
      await page.waitForTimeout(400);
      const framePromise = page.evaluate(() => new Promise(resolve => {
        const start = performance.now();
        const samples = [];
        const sample = now => {
          samples.push(now);
          if (now - start < 900) requestAnimationFrame(sample);
          else resolve({ frames: samples.length, elapsed: now - start });
        };
        requestAnimationFrame(sample);
      }));
      await page.mouse.move(1050, 450);
      await page.mouse.wheel(0, 500);
      console.log(suffix || 'default', await framePromise);
      await page.close();
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
