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
    // Control application time, not the runner's rendering throughput. Install
    // before navigation so every application timer and rAF uses the same clock.
    const epoch = Date.now();
    await page.clock.install({ time: epoch });
    await page.clock.pauseAt(epoch + 1000);
    await page.goto(base + '/journey/');
    await page.waitForSelector('[data-contact-rig]');
    assert.equal(await page.locator('[data-rig-body]').count(), 1);
    assert.equal(await page.locator('[data-photo-limb]').count(), 6);
    assert.equal(await page.locator('[data-photo-waist]').count(), 1);
    assert.equal(await page.locator('[data-rig-waist-ropes]').count(), 1);
    assert.ok(await page.evaluate(() => !!(document.querySelector('[data-rig-tool="left"]')
      .compareDocumentPosition(document.querySelector('[data-rig-body]')) & Node.DOCUMENT_POSITION_FOLLOWING)),
    'Far ice axe must render behind the climber');
    assert.equal(await page.locator('[data-rig-flag] text').count(), 0, 'Flag must have no ac replacement mark');
    assert.equal(await page.locator('[data-rig-flag-cloth] image').getAttribute('href'),
      await page.locator('[data-rig-planting-portrait]').getAttribute('href'), 'Reuse the actual dark-blue planting flag');
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

    await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all([...document.images].map(image => {
        image.loading = 'eager';
        return image.decode();
      }));
      dispatchEvent(new Event('resize'));
    });
    await page.clock.runFor(32);
    const installProbe = () => {
      const nodes = [document.querySelector('.expedition-prologue'),
        ...document.querySelectorAll('.expedition-checkpoint'),
        document.querySelector('.expedition-continuation')];
      const centers = nodes.map(node => {
        const rect = node.getBoundingClientRect();
        return rect.top + scrollY + rect.height / 2;
      });
      // A detached solver is the expected pose at a known scroll progress. It
      // never drives the live controller or replaces the live photographic skin.
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      const world = document.createElementNS(svg.namespaceURI, 'g');
      svg.append(world);
      const oracle = IceClimberRig.create(svg, world, centers.length - 1, { photoTorso: true });
      window.__rigTest = {
        progress() {
          const focus = scrollY + innerHeight * .52;
          if (focus <= centers[0]) return 0;
          for (let i = 1; i < centers.length; i++)
            if (focus <= centers[i]) return i - 1 + (focus - centers[i - 1]) / (centers[i] - centers[i - 1]);
          return centers.length - 1;
        },
        expected() {
          const progress = this.progress(), state = oracle.update(progress);
          const stride = progress % 1;
          const smooth = x => { const t = Math.max(0, Math.min(1, x)); return t * t * (3 - 2 * t); };
          const rise = (Math.floor(progress) + (smooth((stride - .28) / .23) + smooth((stride - .78) / .22)) / 2) / (centers.length - 1);
          return { progress, body: oracle.body.getAttribute('transform'), state,
            camera: state.origin.y - (500 - 190 * rise) };
        },
        read() {
          const svg = document.querySelector('.expedition-art');
          const worldFromScreen = svg.getScreenCTM().inverse();
          const feet = Object.fromEntries(['left', 'right'].map(side => {
            const shin = document.querySelector(`[data-photo-limb="${side}-leg-shin"]`);
            const screen = new DOMPoint(side === 'left' ? 180 : 175, 405).matrixTransform(shin.getScreenCTM());
            const point = screen.matrixTransform(worldFromScreen);
            return [side, { x: point.x, y: point.y }];
          }));
          const transform = selector => document.querySelector(selector).getAttribute('transform');
          return {
            body: transform('[data-rig-body]'),
            origin: { x: document.querySelector('[data-rig-body]').transform.baseVal.getItem(0).matrix.e,
              y: document.querySelector('[data-rig-body]').transform.baseVal.getItem(0).matrix.f }, feet,
            leftLeg: transform('[data-photo-limb="left-leg-shin"]'),
            rightLeg: transform('[data-photo-limb="right-leg-shin"]'),
            leftArm: transform('[data-photo-limb="left-arm-whole"]'),
            rightArm: transform('[data-photo-limb="right-arm-whole"]'),
            camera: Number(svg.getAttribute('viewBox').split(' ')[1]),
            y: document.querySelector('[data-rig-body]').getScreenCTM().f,
            scroll: scrollY,
          };
        },
      };
      return centers;
    };
    const centers = await page.evaluate(installProbe);
    const assertPose = (actual, expected, label) => {
      assert.ok(Math.hypot(actual.origin.x - expected.state.origin.x, actual.origin.y - expected.state.origin.y) < .03,
        `${label}: body must reach the scroll-derived pose (within SVG rounding precision)`);
      assert.ok(Math.abs(actual.camera - expected.camera) < .02, `${label}: camera must follow the same progress`);
      for (const side of ['left', 'right'])
        assert.ok(Math.hypot(actual.feet[side].x - expected.state.feet[side].x,
          actual.feet[side].y - expected.state.feet[side].y) < .15,
        `${label}: ${side} photographic boot must follow its own solved contact`);
    };
    const settledPose = async (label, sparse = false) => {
      if (sparse) for (let tick = 0; tick < 10; tick++) await page.clock.fastForward(100);
      else await page.clock.runFor(1000);
      const result = await page.evaluate(() => ({ actual: __rigTest.read(), expected: __rigTest.expected() }));
      assertPose(result.actual, result.expected, label);
      return result;
    };
    const go = async (progress, sparse = false) => {
      const index = Math.floor(progress), fraction = progress - index;
      const y = centers[index] + (centers[Math.min(index + 1, centers.length - 1)] - centers[index]) * fraction - 900 * .52;
      await page.evaluate(value => new Promise(resolve => {
        dispatchEvent(new PointerEvent('pointerdown'));
        const before = scrollY;
        const onScroll = () => resolve();
        addEventListener('scroll', onScroll, { once: true });
        scrollTo({ top: value, behavior: 'instant' });
        if (scrollY === before) { removeEventListener('scroll', onScroll); resolve(); }
      }), y);
      return (await settledPose(`progress ${progress}`, sparse)).actual;
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

    // Fixed progress samples span four alternating steps, independent of how
    // many frames the host can paint. Check the actual skin, not just a solver.
    let previous = null;
    const swings = new Map();
    for (let index = 0; index <= 64; index++) {
      const actual = await go(1 + index / 32, index % 2 === 1);
      const { progress, state } = await page.evaluate(() => __rigTest.expected());
      assert.equal(state.moving, state.step % 2 === 0 ? 'right' : 'left', 'Anatomical step order must alternate');
      if (previous && state.step === previous.state.step) {
        const distance = side => Math.hypot(actual.feet[side].x - previous.actual.feet[side].x,
          actual.feet[side].y - previous.actual.feet[side].y);
        assert.ok(distance(state.planted) < .15, 'The supporting boot must stay planted while the other leg swings');
        assert.ok(distance(state.moving) < 35, 'A swing must not teleport between footholds');
        if (distance(state.moving) > 1) swings.set(state.step, state.moving);
        assert.ok(previous.actual.y - actual.y >= -1 && previous.actual.y - actual.y < 5,
          'Dense forward progress must not drop or snap the climber');
      }
      previous = { actual, state, progress };
    }
    assert.deepEqual([...swings.values()], ['right', 'left', 'right', 'left'],
      'Both anatomical legs must independently complete alternating swings');

    console.log(`${browserName}: 65 fixed-progress poses, alternating regular/sparse callbacks; four independent swings`);

    // Native input and compositor delivery run on a separate, real clock.
    // Wait for the scroll/pose contract, not a fixed wall-time frame count.
    const live = await browser.newPage({ viewport: { width: 1440, height: 900 }, colorScheme: 'dark' });
    live.on('pageerror', error => errors.push(error.message));
    try {
      await live.goto(base + '/journey/');
      await live.evaluate(async () => {
        await document.fonts.ready;
        await Promise.all([...document.images].map(image => { image.loading = 'eager'; return image.decode(); }));
        dispatchEvent(new Event('resize'));
      });
      const anchors = await live.evaluate(installProbe);
      await live.evaluate(y => { dispatchEvent(new PointerEvent('pointerdown')); scrollTo({ top: y, behavior: 'instant' }); },
        anchors[1] + (anchors[2] - anchors[1]) * .2 - 900 * .52);
      await live.waitForFunction(() => {
        const a = __rigTest.read(), e = __rigTest.expected();
        return Math.hypot(a.origin.x - e.state.origin.x, a.origin.y - e.state.origin.y) < .03;
      }, null, { timeout: 15000 });
      await live.mouse.move(1050, 450);
      const start = await live.evaluate(() => {
        const first = __rigTest.read();
        window.__liveSamples = [first];
        window.__liveRecording = true;
        const sample = () => {
          if (!__liveRecording) return;
          __liveSamples.push(__rigTest.read());
          requestAnimationFrame(sample);
        };
        requestAnimationFrame(sample);
        window.__liveInput = new Promise(resolve => addEventListener('wheel', event => {
          const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? innerHeight : 1);
          const readingCenter = (innerHeight + 84) / 2, target = scrollY + delta * 1.2;
          const nodes = [document.querySelector('.expedition-prologue'),
            ...document.querySelectorAll('.expedition-checkpoint'), document.querySelector('.expedition-continuation')];
          const next = nodes.map(node => { const r = node.getBoundingClientRect(); return r.top + scrollY + r.height / 2; })
            .find(center => center - readingCenter >= target - 1);
          resolve({ delta, destination: next != null && next - readingCenter - target < 300 ? next - readingCenter : target });
        }, { once: true }));
        return first;
      });
      await live.mouse.wheel(0, 500);
      const input = await live.evaluate(() => __liveInput);
      assert.ok(input.delta > 0, 'Native wheel must deliver forward input');
      await live.waitForFunction(destination => {
        const actual = __rigTest.read(), expected = __rigTest.expected();
        return Math.abs(actual.scroll - destination) <= 1 && Math.hypot(actual.origin.x - expected.state.origin.x, actual.origin.y - expected.state.origin.y) < .03 &&
          Math.abs(actual.camera - expected.camera) < .02;
      }, input.destination, { timeout: 15000 });
      const finish = await live.evaluate(() => {
        __liveRecording = false;
        const samples = __liveSamples;
        return { actual: __rigTest.read(), expected: __rigTest.expected(),
          frames: samples.length,
          intermediate: samples.some(s => s.scroll > samples[0].scroll + 20 && s.scroll < samples.at(-1).scroll - 20 &&
            s.y < samples[0].y - 1 && s.leftLeg !== samples[0].leftLeg && s.rightLeg !== samples[0].rightLeg),
          maxDownward: samples.slice(1).reduce((m, s, i) => Math.max(m, s.y - samples[i].y), 0),
          maxJump: samples.slice(1).reduce((m, s, i) => Math.max(m, Math.abs(s.y - samples[i].y)), 0) };
      });
      assertPose(finish.actual, finish.expected, 'native wheel endpoint');
      assert.ok(finish.actual.y < start.y - 3 && finish.intermediate, 'Native input must animate both legs and ascend before settling');
      assert.ok(finish.maxDownward < 3 && finish.maxJump < 18, 'Native wheel must not drop or snap the climber');
      console.log(`${browserName} native wheel: ${JSON.stringify({ frames: finish.frames, delta: input.delta,
        maxDownward: finish.maxDownward, maxJump: finish.maxJump })}`);
    } finally { await live.close(); }

    // Assets/fonts were settled before measuring anchors; go waits for the
    // native scroll event before advancing application time.
    await go(centers.length - 2 + .97);
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
