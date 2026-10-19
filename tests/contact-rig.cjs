const { chromium, firefox, webkit } = require('playwright');
const assert = require('node:assert/strict');

const browserName = process.env.TEST_BROWSER || 'chromium';
const base = process.env.TEST_URL || 'http://127.0.0.1:4173';

(async () => {
  const browser = await { chromium, firefox, webkit }[browserName].launch({
    headless: true,
    ...(browserName === 'chromium' && process.env.CHROME_CHANNEL ? { channel: process.env.CHROME_CHANNEL } : {}),
  });
  const errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, colorScheme: 'dark' });
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(base + '/journey/');
    await page.waitForSelector('[data-contact-rig]');
    assert.equal(await page.locator('[data-rig-body]').count(), 1);
    assert.equal(await page.locator('[data-photo-limb]').count(), 6);
    assert.equal(await page.locator('[data-expedition-climber]').evaluate(el => getComputedStyle(el).display), 'none');
    assert.equal(await page.locator('.expedition-wall-picture').evaluate(el => getComputedStyle(el).display), 'none');
    assert.equal(await page.locator('[data-rig-flag]').evaluate(el => getComputedStyle(el).display), 'none', 'Flag pole must not appear beside the climbing figure');
    const assets = await page.evaluate(async () => {
      const names = ['ascent-summit-ledge.webp', 'ascent-planting-pose.webp', 'ascent-standing-pose.webp',
        ...['left-leg-thigh', 'left-leg-shin', 'right-leg-thigh', 'right-leg-shin', 'left-arm-whole', 'right-arm-whole']
          .map(part => `ascent-rig-${part}.webp`)];
      return Promise.all(names.map(async name => {
        const image = new Image();
        image.src = `/assets/media/${name}`;
        await image.decode();
        return [name, image.naturalWidth, image.naturalHeight];
      }));
    });
    assert.ok(assets.every(([, width, height]) => width > 200 && height > 200));

    const centers = await page.evaluate(() => {
      const nodes = [document.querySelector('.expedition-prologue'),
        ...document.querySelectorAll('.expedition-checkpoint'),
        document.querySelector('.expedition-continuation')];
      return nodes.map(node => {
        const rect = node.getBoundingClientRect();
        return rect.top + scrollY + rect.height / 2;
      });
    });
    const go = async progress => {
      const index = Math.floor(progress);
      const fraction = progress - index;
      const y = centers[index] + (centers[Math.min(index + 1, centers.length - 1)] - centers[index]) * fraction - 900 * .52;
      await page.evaluate(value => scrollTo(0, value), y);
      await page.waitForTimeout(850);
      return page.evaluate(() => ({
        body: document.querySelector('[data-rig-body]').getAttribute('transform'),
        leftLeg: document.querySelector('[data-photo-limb="left-leg-shin"]').getAttribute('transform'),
        rightLeg: document.querySelector('[data-photo-limb="right-leg-shin"]').getAttribute('transform'),
        leftArm: document.querySelector('[data-photo-limb="left-arm-whole"]').getAttribute('transform'),
        rightArm: document.querySelector('[data-photo-limb="right-arm-whole"]').getAttribute('transform'),
        camera: Number(document.querySelector('.expedition-art').getAttribute('viewBox').split(' ')[1]),
      }));
    };
    const rightStep = await go(.25);
    const leftStep = await go(.75);
    const middle = await go(Math.floor((centers.length - 1) / 2));
    assert.notEqual(rightStep.rightLeg, leftStep.rightLeg);
    assert.notEqual(rightStep.leftLeg, leftStep.leftLeg);
    assert.notEqual(rightStep.rightArm, leftStep.rightArm);
    assert.notEqual(rightStep.leftArm, leftStep.leftArm);
    assert.ok(rightStep.camera > middle.camera);
    const reverse = await go(.25);
    assert.ok(reverse.camera > middle.camera);
    assert.equal(reverse.body, rightStep.body, 'Reverse scrub should restore the same deterministic pose');
    for (const limb of ['leftLeg', 'rightLeg', 'leftArm', 'rightArm'])
      assert.equal(reverse[limb], rightStep[limb], `${limb} should return to the same pose after reversing`);

    await go(1.2);
    await page.evaluate(() => {
      window.__rigMotion = [];
      const start = performance.now();
      const sample = time => {
        const body = document.querySelector('[data-rig-body]');
        window.__rigMotion.push({ time, y: body.getScreenCTM().f,
          left: document.querySelector('[data-photo-limb="left-leg-shin"]').getAttribute('transform'),
          right: document.querySelector('[data-photo-limb="right-leg-shin"]').getAttribute('transform') });
        if (time - start < 900) requestAnimationFrame(sample);
      };
      requestAnimationFrame(sample);
    });
    await page.mouse.move(1050, 450);
    await page.mouse.wheel(0, 500);
    await page.waitForTimeout(1250);
    const motion = await page.evaluate(() => {
      const samples = window.__rigMotion;
      return {
        frames: samples.length,
        uniqueLeft: new Set(samples.map(sample => sample.left)).size,
        uniqueRight: new Set(samples.map(sample => sample.right)).size,
        maxDownward: samples.slice(1).reduce((max, sample, index) => Math.max(max, sample.y - samples[index].y), 0),
        maxJump: samples.slice(1).reduce((max, sample, index) => Math.max(max, Math.abs(sample.y - samples[index].y)), 0),
      };
    });
    console.log(`${browserName} sampled motion: ${JSON.stringify(motion)}`);
    // Headless Windows WebKit yielded 15 rAF samples for the unchanged legacy
    // scene in this same 900 ms benchmark. Assert continuity and no rebound;
    // this runner's sample count is not a device frame-rate guarantee.
    assert.ok(motion.frames >= (browserName === 'chromium' ? 25 : 12),
      `Wheel gesture should be sampled over many animation frames: ${JSON.stringify(motion)}`);
    assert.ok(motion.uniqueLeft >= 10 && motion.uniqueRight >= 10, `Both legs must update continuously: ${JSON.stringify(motion)}`);
    assert.ok(motion.maxDownward < 3 && motion.maxJump < 18, `Climber should not snap or drop during ascent: ${JSON.stringify(motion)}`);

    // Re-measure after lazy-loaded panels have settled. The initial card
    // centers can shift slightly during the long scroll on Firefox/WebKit.
    await page.evaluate(() => {
      dispatchEvent(new PointerEvent('pointerdown'));
      document.documentElement.style.scrollBehavior = 'auto';
      const nodes = [document.querySelector('.expedition-prologue'),
        ...document.querySelectorAll('.expedition-checkpoint'),
        document.querySelector('.expedition-continuation')];
      const center = node => { const rect = node.getBoundingClientRect();
        return rect.top + scrollY + rect.height / 2; };
      const a = center(nodes[nodes.length - 2]);
      const b = center(nodes[nodes.length - 1]);
      scrollTo({ top: a + (b - a) * .97 - innerHeight * .52, behavior: 'instant' });
    });
    await page.waitForFunction(() =>
      document.querySelector('[data-rig-planting-portrait]').getAttribute('opacity') === '1',
    );
    assert.deepEqual(await page.evaluate(() => ({
      body: document.querySelector('[data-rig-body]').getAttribute('opacity'),
      planting: document.querySelector('[data-rig-planting-portrait]').getAttribute('opacity'),
      standing: document.querySelector('[data-rig-final-portrait]').getAttribute('opacity'),
    })), { body: '0', planting: '1', standing: '0' }, 'Flag planting should show one fully opaque figure');
    const finish = await go(centers.length - 1);
    assert.ok(finish.camera < middle.camera);
    assert.equal(await page.locator('[data-rig-final-portrait]').getAttribute('opacity'), '1');
    assert.equal(await page.locator('[data-rig-wall] image').nth(1).getAttribute('opacity'), '1.000');
    assert.equal(await page.getByRole('heading', { name: 'The ascent continues' }).count(), 1);

    for (const width of [390, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth) <= 1, `Overflow at ${width}`);
    }
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.reload();
    assert.equal(await page.locator('[data-contact-rig]').count(), 0);
    assert.equal(await page.locator('[data-expedition-climber]').evaluate(el => getComputedStyle(el).display), 'inline');
    assert.deepEqual(errors, []);
    await page.close();
  } finally { await browser.close(); }
  console.log(`PASS: ${browserName}; contact rig, alternating limbs, reverse scrub, summit, assets, responsive and reduced motion`);
})().catch(error => { console.error(error); process.exitCode = 1; });
