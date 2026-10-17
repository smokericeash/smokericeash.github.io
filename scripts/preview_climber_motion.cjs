// Capture one complete step cycle at equal scroll increments for motion QA.
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.CHROME_CHANNEL ? { channel: process.env.CHROME_CHANNEL } : {}),
  });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto((process.env.PREVIEW_URL || 'http://127.0.0.1:4173') + '/journey/');
    const anchors = await page.evaluate(() => [
      ...document.querySelectorAll('.expedition-checkpoint'),
    ].map(element => {
      const rect = element.getBoundingClientRect();
      return rect.top + scrollY + rect.height / 2;
    }));
    const captures = [];
    for (let index = 0; index < 26; index += 1) {
      const current = 4 + (index + .5) / 13;
      const before = Math.floor(current) - 1;
      const between = current - Math.floor(current);
      const focus = anchors[before] + (anchors[before + 1] - anchors[before]) * between;
      await page.evaluate(top => scrollTo(0, top), focus - 900 * .52);
      await page.waitForTimeout(350);
      const frames = await page.locator('.expedition-climber').evaluate(element =>
        [...element.querySelectorAll('image')].map(image => ({
          frame: image.getAttribute('href').match(/frame-(\d+)/)?.[1],
          opacity: getComputedStyle(image).opacity,
        })));
      const name = String(index + 1).padStart(2, '0');
      const target = path.join(__dirname, '..', 'test-results', 'climber-motion-' + name + '.png');
      await page.locator('.expedition-climber').screenshot({ path: target });
      captures.push({ name, frames, target });
    }
    const sheet = await browser.newPage({ viewport: { width: 1950, height: 860 }, deviceScaleFactor: 1 });
    const cells = captures.map(({ name, frames, target }) =>
      '<figure><img src="data:image/png;base64,' + fs.readFileSync(target).toString('base64') +
      '"><figcaption>' + name + ' ' + frames.map(frame => frame.frame + ':' + frame.opacity).join(' ') +
      '</figcaption></figure>');
    await sheet.setContent('<style>html,body{margin:0;background:#13202a;color:#dbe6ed;font:12px sans-serif}main{display:grid;grid-template-columns:repeat(13,1fr)}figure{height:420px;margin:0;border:1px solid #445;position:relative}img{width:100%;height:100%;object-fit:contain}figcaption{position:absolute;bottom:3px;left:3px;background:#13202a}</style><main>' + cells.join('') + '</main>');
    await sheet.locator('img').last().evaluate(image => image.decode());
    const target = path.join(__dirname, '..', 'test-results', 'climber-motion-contact.png');
    await sheet.screenshot({ path: target, fullPage: true });
    console.log(target);
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
