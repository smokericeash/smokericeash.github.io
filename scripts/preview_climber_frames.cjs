// Produce a visual QA sheet of the complete climber poses.
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');

(async () => {
  const root = path.resolve(__dirname, '..');
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.CHROME_CHANNEL ? { channel: process.env.CHROME_CHANNEL } : {}),
  });
  try {
    const cells = Array.from({ length: 12 }, (_, index) => {
      const number = String(index + 1).padStart(2, '0');
      const data = fs.readFileSync(path.join(root, 'assets', 'media',
        `ascent-climber-frame-${number}.webp`)).toString('base64');
      return `<figure><img src="data:image/webp;base64,${data}"><figcaption>${number}</figcaption></figure>`;
    });
    const page = await browser.newPage({ viewport: { width: 1200, height: 1455 }, deviceScaleFactor: 1 });
    await page.setContent(`<style>html,body{margin:0;background:#121820;color:#c9d6e4;font:20px sans-serif}main{display:grid;grid-template-columns:repeat(4,1fr)}figure{height:485px;margin:0;position:relative;border:1px solid #344453;box-sizing:border-box}img{width:100%;height:100%;object-fit:contain}figcaption{position:absolute;bottom:8px;left:10px}</style><main>${cells.join('')}</main>`);
    await page.locator('img').last().evaluate(image => image.decode());
    const target = path.join(root, 'test-results', 'climber-frame-contact.png');
    fs.mkdirSync(path.dirname(target), { recursive: true });
    await page.screenshot({ path: target, fullPage: true });
    console.log(target);
    if (process.env.PREVIEW_URL) {
      const scene = await browser.newPage({ viewport: { width: 1440, height: 900 } });
      await scene.goto(`${process.env.PREVIEW_URL.replace(/\/$/, '')}/journey/`);
      await scene.locator('.expedition-checkpoint').nth(4).evaluate(element =>
        element.scrollIntoView({ block: 'center', behavior: 'instant' }));
      await scene.waitForTimeout(250);
      for (const index of [1, 3, 5, 7, 9, 11, 12]) {
        const number = String(index).padStart(2, '0');
        await scene.locator('[data-climber-frame-primary]').evaluate((element, number) => {
          element.setAttribute('href', element.getAttribute('href')
            .replace(/ascent-climber-frame-\d+\.webp/, `ascent-climber-frame-${number}.webp`));
        }, number);
        await scene.waitForTimeout(120);
        const imageTarget = path.join(root, 'test-results', `climber-scene-${number}.png`);
        await scene.locator('.expedition-visual').screenshot({ path: imageTarget });
        console.log(imageTarget);
      }
    }
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
