const { chromium } = require('playwright');
const path = require('node:path');

(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const errors = [];
  try {
    for (const [name, viewport] of [
      ['desktop', { width: 1440, height: 900 }],
      ['mobile', { width: 390, height: 844 }],
    ]) {
      const page = await browser.newPage({ viewport, deviceScaleFactor: 1 });
      page.on('pageerror', error => errors.push(`${name}: ${error.message}`));
      await page.goto('http://127.0.0.1:4173/journey/');
      await page.waitForSelector('[data-contact-rig]', { timeout: 12000 });
      await page.locator('.expedition-visual').evaluate(el => { el.dataset.pacificSky = 'day'; });
      const anchors = await page.evaluate(() => {
        const center = node => {
          const bounds = node.getBoundingClientRect();
          return bounds.top + scrollY + bounds.height / 2;
        };
        return [
          center(document.querySelector('.expedition-prologue')),
          ...[...document.querySelectorAll('.expedition-checkpoint')].map(center),
          center(document.querySelector('.expedition-continuation')),
        ];
      });
      const focus = viewport.width <= 680 ? .72 : .52;
      const cases = [[0, 'start'], [.25, 'reach'], [.5, 'plant'], [.75, 'push'], [1.25, 'other-reach'],
        [anchors.length - 1.08, 'summit-approach'], [anchors.length - 1.04, 'summit-plant'],
        [anchors.length - 1.02, 'summit-rise'], [anchors.length - 1, 'end']];
      for (const [progress, label] of cases) {
        const start = Math.floor(progress);
        const t = progress - start;
        const destination = (anchors[start] + (anchors[Math.min(start + 1, anchors.length - 1)] - anchors[start]) * t) - viewport.height * focus;
        await page.evaluate(y => scrollTo(0, y), destination);
        await page.waitForTimeout(650);
        await page.screenshot({ path: path.resolve('test-results', `rig-layout-${name}-${label}.png`) });
        const state = await page.evaluate(() => ({
          stage: document.querySelector('[data-expedition-position]').textContent,
          viewBox: document.querySelector('.expedition-art').getAttribute('viewBox'),
          rig: !!document.querySelector('[data-rig-body]'),
          visible: getComputedStyle(document.querySelector('[data-expedition-climber]')).display,
        }));
        console.log(name, label, JSON.stringify(state));
      }
      await page.close();
    }
  } finally { await browser.close(); }
  if (errors.length) throw new Error(errors.join('\n'));
})().catch(error => { console.error(error); process.exitCode = 1; });
