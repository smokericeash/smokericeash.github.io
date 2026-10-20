const { chromium, firefox, webkit } = require('playwright');
const name = process.env.TEST_BROWSER || 'firefox';
(async () => {
  const browser = await { chromium, firefox, webkit }[name].launch({ headless: true,
    ...(name === 'chromium' ? { channel: 'chrome' } : {}) });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto('http://127.0.0.1:4173/journey/');
    await page.waitForSelector('[data-contact-rig]');
    const anchors = await page.evaluate(() => [document.querySelector('.expedition-prologue'),
      ...document.querySelectorAll('.expedition-checkpoint'), document.querySelector('.expedition-continuation')]
      .map(el => { const r = el.getBoundingClientRect(); return r.top + scrollY + r.height / 2; }));
    const start = anchors.length - 2;
    for (const offset of [.90, .92, .94, .95, .96, .97, .98, .99, 1]) {
      const y = anchors[start] + (anchors[start + 1] - anchors[start]) * offset - 900 * .52;
      await page.evaluate(value => scrollTo(0, value), y);
      await page.waitForTimeout(1000);
      console.log(name, offset, await page.evaluate(() => ({ scroll: scrollY,
        body: document.querySelector('[data-rig-body]').getAttribute('opacity'),
        plant: document.querySelector('[data-rig-planting-portrait]').getAttribute('opacity'),
        final: document.querySelector('[data-rig-final-portrait]').getAttribute('opacity'),
        position: document.querySelector('[data-expedition-position]').textContent })));
    }
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
