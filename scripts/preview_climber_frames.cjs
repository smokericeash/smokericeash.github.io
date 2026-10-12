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
    const cells = Array.from({ length: 16 }, (_, index) => {
      const number = String(index + 1).padStart(2, '0');
      const data = fs.readFileSync(path.join(root, 'assets', 'media',
        `ascent-climber-frame-${number}.webp`)).toString('base64');
      return `<figure><img src="data:image/webp;base64,${data}"><figcaption>${number}</figcaption></figure>`;
    });
    const page = await browser.newPage({ viewport: { width: 1200, height: 1940 }, deviceScaleFactor: 1 });
    await page.setContent(`<style>html,body{margin:0;background:#121820;color:#c9d6e4;font:20px sans-serif}main{display:grid;grid-template-columns:repeat(4,1fr)}figure{height:485px;margin:0;position:relative;border:1px solid #344453;box-sizing:border-box}img{width:100%;height:100%;object-fit:contain}figcaption{position:absolute;bottom:8px;left:10px}</style><main>${cells.join('')}</main>`);
    await page.locator('img').last().evaluate(image => image.decode());
    const target = path.join(root, 'test-results', 'climber-frame-contact.png');
    fs.mkdirSync(path.dirname(target), { recursive: true });
    await page.screenshot({ path: target, fullPage: true });
    console.log(target);
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
