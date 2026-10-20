const { chromium, firefox, webkit } = require('playwright');
const { default: AxeBuilder } = require('@axe-core/playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const browserName = process.env.TEST_BROWSER || 'chromium';
const base = process.env.TEST_URL || 'http://127.0.0.1:4173';
const output = { browser: browserName, checks: [] };

(async () => {
  const browser = await { chromium, firefox, webkit }[browserName].launch({
    headless: true,
    ...(browserName === 'chromium' && process.env.CHROME_CHANNEL ? { channel: process.env.CHROME_CHANNEL } : {}),
  });
  fs.mkdirSync('test-results', { recursive: true });
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: 'dark' });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(base);
    const homeCount = await page.locator('.chronicle-entry').count();
    assert.ok(homeCount >= 9);
    assert.equal(await page.locator('.ascent-map-labels').innerText(), 'BASE CAMP · 2025\nSUMMIT AWAITS · 2026');
    assert.equal(await page.locator('.profile-summary .credential-link').count(), 0);
    assert.match(await page.locator('.profile-intro').evaluate(el => getComputedStyle(el, '::before').backgroundImage), /ascent-everest-illustration-800\.webp/);
    assert.equal(await page.locator('.ascent-climber .mountaineer-pack').count(), 1);
    if (browserName === 'chromium') await page.locator('.home-timeline').screenshot({ path: 'test-results/home-ascent-preview.png' });
    output.checks.push('Home retains the compact shared-post preview, dynamic labels and equipped climber');

    await page.goto(base + '/about/');
    assert.equal(await page.locator('.credential-list a').count(), 2);
    assert.equal(await page.locator('.credential-list br').count(), 1, 'A literal line break must survive stale CSS');
    assert.equal(await page.locator('.credential-list a').last().getAttribute('href'), 'https://certs.zeropointsecurity.co.uk/c206a569-e644-4fae-ae5f-d2bf97d1360f');
    const credentials = await page.locator('.credential-list a').evaluateAll(links => links.map(link => link.getBoundingClientRect().toJSON()));
    assert.ok(credentials[1].top >= credentials[0].bottom + 8, 'Credentials need separate lines and spacing');
    if (browserName === 'chromium') await page.locator('.about-aside').screenshot({ path: 'test-results/about-credentials.png' });
    output.checks.push('About lists Network+ and CRTO on separately spaced lines');

    await page.goto(base + '/journey/?rig=legacy');
    const checkpoints = page.locator('.expedition-checkpoint');
    assert.equal(await checkpoints.count(), homeCount);
    assert.equal(await page.locator('.chronicle').count(), 0);
    assert.equal(await page.locator('.expedition-art').count(), 1);
    assert.equal(await page.locator('.expedition-climber image').count(), 1, 'Render one opaque complete pose without separate limbs');
    assert.match(await page.locator('[data-climber-frame-primary]').getAttribute('href'), /ascent-climber-swirl-frame-01\.webp\?v=ascent-21$/);
    for (let index = 1; index <= 14; index += 1) {
      const image = await page.evaluate(async index => {
        const image = new Image();
        image.src = `/assets/media/ascent-climber-swirl-frame-${String(index).padStart(2, '0')}.webp`;
        await image.decode();
        return { width: image.naturalWidth, height: image.naturalHeight };
      }, index);
      assert.deepEqual(image, { width: 400, height: 533 }, `Full-body frame ${index} must load`);
    }
    assert.deepEqual(
      fs.readFileSync('assets/media/ascent-climber-swirl-frame-10.webp'),
      fs.readFileSync('assets/media/ascent-climber-swirl-frame-11.webp'),
      'The both-straight foothold should hold for two frames',
    );
    const footholds = await page.evaluate(async () => {
      const sample = async index => {
        const image = new Image();
        image.src = `/assets/media/ascent-climber-swirl-frame-${String(index).padStart(2, '0')}.webp`;
        await image.decode();
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const context = canvas.getContext('2d', { willReadFrequently: true });
        context.drawImage(image, 0, 0);
        const center = (top, height) => {
          const pixels = context.getImageData(0, top, image.width, height).data;
          const xs = [];
          for (let i = 3; i < pixels.length; i += 4) {
            if (pixels[i] > 150) xs.push(Math.floor(i / 4) % image.width);
          }
          xs.sort((a, b) => a - b);
          return xs[Math.floor(xs.length / 2)];
        };
        const rgba = context.getImageData(0, 300, image.width, image.height - 300).data;
        const bootXs = [];
        const bootHeights = [[], []];
        for (let i = 0; i < rgba.length; i += 4) {
          const [red, green, blue, alpha] = rgba.subarray(i, i + 4);
          if (alpha > 160 && red > 100 && green > 35 && green < 160 &&
              blue < 105 && red > green * 1.25) {
            const x = Math.floor(i / 4) % image.width;
            const y = 300 + Math.floor(i / 4 / image.width);
            bootXs.push(x);
            if (y > 305) bootHeights[x < 225 ? 0 : 1].push(y);
          }
        }
        bootXs.sort((a, b) => a - b);
        const bootY = bootHeights.map(heights => {
          heights.sort((a, b) => a - b);
          return heights[Math.floor(heights.length / 2)];
        });
        const whiteFabric = bootY.map((height, side) => {
          const left = side ? 235 : 155;
          const top = Math.max(190, Math.round(height - 100));
          const pixels = context.getImageData(left, top, 60, 65).data;
          let light = 0;
          for (let i = 0; i < pixels.length; i += 4)
            if (pixels[i + 3] > 180 && pixels[i] > 140 && pixels[i + 1] > 140 && pixels[i + 2] > 140) light++;
          return light;
        });
        return { hip: center(210, 70), lowerLeg: center(400, 90),
          orangeSpan: bootXs[Math.floor(bootXs.length * .9)] - bootXs[Math.floor(bootXs.length * .1)],
          orangeCount: bootXs.length, bootY, whiteFabric };
      };
      return Promise.all(Array.from({ length: 14 }, (_, index) => sample(index + 1)));
    });
    for (const [index, pose] of footholds.entries()) {
      const leftLeg = index < 11 ? 1 : 0;
      assert.ok(pose.whiteFabric[leftLeg] > 25 && pose.whiteFabric[leftLeg] > pose.whiteFabric[1 - leftLeg] * 1.5,
        `White pattern must distinguish the anatomical left shin from the dark right shin in pose ${index + 1}: ${JSON.stringify(pose)}`);
      assert.ok(Math.abs(pose.lowerLeg - pose.hip) < 70,
        `Pose ${index + 1} must keep the supporting leg beneath the hip: ${JSON.stringify(pose)}`);
      assert.ok(pose.orangeSpan > 35 && pose.orangeCount > 150,
        `Pose ${index + 1} must show two separated crampon boots: ${JSON.stringify(pose)}`);
      const heightDifference = Math.abs(pose.bootY[0] - pose.bootY[1]);
      if ([0, 9, 10].includes(index))
        assert.ok(heightDifference < 25, `Both boots should be level in straight-leg pose ${index + 1}: ${JSON.stringify(pose)}`);
      else if (index !== 1 && index !== 8) {
        assert.ok(heightDifference >= 60, `Exactly one boot should be raised in bent-leg pose ${index + 1}: ${JSON.stringify(pose)}`);
        assert.ok(pose.bootY[1] <= pose.bootY[0] - 60,
          `Raised boot must reach toward the image-right wall, not kick backward, in pose ${index + 1}: ${JSON.stringify(pose)}`);
      }
    }
    const halfway = footholds[1].bootY[1];
    assert.ok(halfway < footholds[0].bootY[1] - 15 && halfway > footholds[2].bootY[1] + 15,
      `The new left foot must sit between straight and fully raised: ${JSON.stringify(footholds.slice(0, 3))}`);
    const lowering = footholds[8].bootY[1];
    assert.ok(lowering > footholds[7].bootY[1] + 15 && lowering < footholds[9].bootY[1] - 15,
      `Left foot must lower through an intermediate height: ${JSON.stringify(footholds.slice(7, 10))}`);
    assert.equal(await page.locator('.expedition-celestial').count(), 0);
    assert.equal(await page.locator('[data-expedition-zone]').count(), 0);
    assert.equal(await page.locator('[data-climber-front-arm], [data-climber-back-arm], [data-climber-front-leg], [data-climber-back-leg], [data-climber-front-shin], [data-climber-back-shin]').count(), 0);
    assert.equal(await page.locator('.expedition-visual').getAttribute('aria-hidden'), 'true');
    assert.equal(await page.locator('.expedition-panel h2 a').count(), homeCount);
    assert.equal(await page.evaluate(() => getComputedStyle(document.documentElement).scrollSnapType), 'none');
    const pacificSky = await page.locator('.expedition-visual').getAttribute('data-pacific-sky');
    const hour = await page.evaluate(() => Number(new Intl.DateTimeFormat('en-US', { timeZone: 'America/Los_Angeles', hour: 'numeric', hourCycle: 'h23' }).format(new Date())));
    assert.equal(pacificSky, hour >= 6 && hour < 19 ? 'day' : 'night');
    assert.ok((await page.locator('.expedition-backdrop').getAttribute('src')).endsWith('ascent-everest-illustration.webp'));
    assert.ok((await page.locator('.expedition-wall').getAttribute('src')).endsWith('ascent-icewall-800.webp'));
    await page.locator('.expedition-visual').evaluate(el => { el.dataset.pacificSky = 'night'; });
    const nightFilter = await page.locator('.expedition-backdrop').evaluate(el => getComputedStyle(el).filter);
    await page.locator('.expedition-visual').evaluate(el => { el.dataset.pacificSky = 'day'; });
    const dayFilter = await page.locator('.expedition-backdrop').evaluate(el => getComputedStyle(el).filter);
    assert.notEqual(nightFilter, dayFilter);
    await page.locator('.expedition-visual').evaluate((el, sky) => { el.dataset.pacificSky = sky; }, pacificSky);
    output.checks.push('Post navigation avoids forced browser snapping; layered scene tracks Pacific day/night');

    await checkpoints.nth(1).evaluate(el => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
    await page.waitForTimeout(150);
    const beforeWheel = await page.evaluate(() => scrollY);
    await page.evaluate(() => {
      window.__wheelPositions = [];
      window.__poseFrames = [];
      window.__climberScreenY = [];
      const begun = performance.now();
      const sample = () => {
        window.__wheelPositions.push(Math.round(scrollY));
        window.__poseFrames.push(document.querySelector('[data-climber-frame-primary]').getAttribute('href'));
        window.__climberScreenY.push(document.querySelector('[data-expedition-climber]').getScreenCTM().f);
        if (performance.now() - begun < 850) requestAnimationFrame(sample);
      };
      requestAnimationFrame(sample);
    });
    await page.mouse.move(1100, 460);
    await page.mouse.wheel(0, 580);
    await page.waitForTimeout(1600);
    const intermediatePositions = await page.evaluate(() => new Set(window.__wheelPositions).size);
    assert.ok(intermediatePositions >= (browserName === 'firefox' ? 4 : 7), `Wheel should ease through intermediate positions: ${intermediatePositions}`);
    const scrollReversal = await page.evaluate(() => window.__wheelPositions.slice(1).reduce((max, y, i) => Math.max(max, window.__wheelPositions[i] - y), 0));
    assert.ok(scrollReversal <= 1, `Downward wheel settling must not reverse the page: ${scrollReversal}px`);
    const visitedFrames = await page.evaluate(() => new Set(window.__poseFrames).size);
    assert.ok(visitedFrames >= 3, `Wheel travel should show several illustrated full-body poses: ${visitedFrames}`);
    if (browserName === 'chromium') {
      const largestFrameStep = await page.evaluate(() => {
        const sequence = window.__poseFrames.map(url => Number(url.match(/frame-(\d+)/)[1]))
          .filter((number, index, all) => index === 0 || number !== all[index - 1]);
        return sequence.slice(1).reduce((largest, number, index) => {
          const distance = Math.abs(number - sequence[index]);
          return Math.max(largest, Math.min(distance, 14 - distance));
        }, 0);
      });
      assert.ok(largestFrameStep <= 1, `Moderate wheel travel skipped illustrated poses: ${largestFrameStep}`);
    }
    const rebound = await page.evaluate(() => window.__climberScreenY.slice(1).reduce((max, y, i) => Math.max(max, y - window.__climberScreenY[i]), 0));
    assert.ok(rebound < 3, `Climber must not drop back down during downward wheel travel: ${rebound.toFixed(1)}px`);
    const settled = await page.evaluate(() => {
      const target = 84 + (innerHeight - 84) / 2;
      const panels = [...document.querySelectorAll('.expedition-checkpoint')];
      return Math.min(...panels.map(el => Math.abs(el.getBoundingClientRect().top + el.getBoundingClientRect().height / 2 - target)));
    });
    assert.ok(Math.abs(await page.evaluate(() => scrollY) - beforeWheel) > 100, 'Wheel must reach another post');
    assert.ok(Math.abs(await page.evaluate(() => scrollY) - beforeWheel) < 950, 'Wheel should not leap over several entries');
    assert.ok(settled < 250, `Post did not settle near a reading position: ${settled}`);
    output.checks.push(`Desktop wheel eases between entries with ${visitedFrames} illustrated poses in an 850ms sample`);
    const positions = [];
    const lateralPositions = [];
    for (const index of [0, Math.floor(homeCount / 2), homeCount - 1]) {
      await checkpoints.nth(index).scrollIntoViewIfNeeded();
      await page.waitForTimeout(850);
      positions.push(Number((await page.locator('.expedition-art').getAttribute('viewBox')).split(' ')[1]));
      lateralPositions.push(await page.locator('.expedition-climber').evaluate(el => new DOMPoint(0, 0).matrixTransform(el.getScreenCTM()).x));
    }
    assert.ok(positions[0] > positions[1] && positions[1] > positions[2], `Camera did not climb: ${positions}`);
    assert.ok(Math.max(...lateralPositions) - Math.min(...lateralPositions) < 24,
      `Climber should ascend almost straight up without lateral shimmy: ${lateralPositions}`);
    await checkpoints.first().scrollIntoViewIfNeeded();
    await page.waitForTimeout(850);
    const reversed = Number((await page.locator('.expedition-art').getAttribute('viewBox')).split(' ')[1]);
    assert.ok(reversed > positions[1], 'Upward scrolling must reverse the camera');
    output.checks.push('Native vertical scrolling advances and reverses camera across actual checkpoints');

    const firstY = await checkpoints.first().evaluate(el => el.getBoundingClientRect().top + scrollY + el.offsetHeight / 2);
    const nextY = await checkpoints.nth(1).evaluate(el => el.getBoundingClientRect().top + scrollY + el.offsetHeight / 2);
    await page.evaluate(() => { document.documentElement.style.scrollSnapType = 'none'; });
    const samplePose = async (fraction) => {
      await page.evaluate(({ firstY, nextY, fraction }) => scrollTo(0, firstY + (nextY - firstY) * fraction - innerHeight * .52), { firstY, nextY, fraction });
      await page.waitForTimeout(850);
      return page.locator('.expedition-climber').evaluate(el => ({
        frame: el.querySelector('[data-climber-frame-primary]').getAttribute('href'),
        opacity: getComputedStyle(el.querySelector('[data-climber-frame-primary]')).opacity,
        transform: el.getAttribute('transform'),
        wall: document.querySelector('.expedition-wall-picture').style.transform,
        scroll: scrollY,
        stage: document.querySelector('[data-expedition-position]').textContent,
      }));
    };
    const reaching = await samplePose(.1);
    const pulling = await samplePose(.9);
    assert.notEqual(reaching.frame, pulling.frame, 'Complete climbing pose must change with scroll');
    const frameNumber = pose => Number(pose.frame.match(/frame-(\d+)\.webp/)[1]);
    const advance = (frameNumber(pulling) - frameNumber(reaching) + 14) % 14;
    assert.ok(advance >= 4 && advance <= 7, `One entry should consume about half a climbing cycle: ${advance} poses`);
    assert.equal(reaching.opacity, '1', 'The illustrated climber must remain fully opaque');
    assert.notEqual(reaching.transform, pulling.transform, 'Climber must travel along the wall');
    assert.notEqual(reaching.wall, pulling.wall, 'Foreground wall must parallax separately from the distant mountain');
    assert.equal(await page.locator('.expedition-route, .expedition-route-done').count(), 0, 'No visible trail beside the climber');
    assert.equal(await page.locator('defs > [data-expedition-route]').count(), 1, 'Keep movement geometry unpainted');
    const rightLead = await samplePose(.25);
    const leftLead = await samplePose(.75);
    assert.notEqual(rightLead.frame, leftLead.frame, 'Opposite reach phases need distinct complete illustrations');
    assert.equal(await page.locator('.expedition-climber image').count(), 1, 'No independently moving limbs at any phase');
    await page.evaluate(() => { document.documentElement.style.removeProperty('scroll-snap-type'); });
    output.checks.push('Distinct full-body reach phases travel with limited body sway and wall parallax');

    await page.locator('.expedition-continuation').scrollIntoViewIfNeeded();
    assert.equal(await page.getByRole('heading', { name: 'The ascent continues' }).count(), 1);
    for (const width of [360, 430, 768, 1440, 1920]) {
      await page.setViewportSize({ width, height: 900 });
      await page.waitForTimeout(80);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      assert.ok(overflow <= 1, `Horizontal overflow at ${width}: ${overflow}`);
    }
    output.checks.push('Continuing route and five responsive widths, including mobile');

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.selectOption('#theme-select', 'dark');
    await checkpoints.nth(Math.floor(homeCount / 2)).scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    if (browserName === 'chromium') await page.screenshot({ path: 'test-results/expedition-desktop-dark.png' });
    if (browserName === 'chromium') {
      await page.locator('.expedition-visual').evaluate(el => { el.dataset.pacificSky = 'night'; });
      await page.screenshot({ path: 'test-results/expedition-desktop-night.png' });
      await page.locator('.expedition-visual').evaluate((el, sky) => { el.dataset.pacificSky = sky; }, pacificSky);
    }
    for (const theme of ['dark', 'light']) {
      await page.selectOption('#theme-select', theme);
      const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
      if (result.violations.length) console.log(JSON.stringify(result.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => ({ target: n.target, reason: n.failureSummary })) })), null, 2));
      assert.deepEqual(result.violations.map(v => v.id), [], `${theme} accessibility`);
    }
    if (browserName === 'chromium') {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.selectOption('#theme-select', 'light');
      await checkpoints.nth(Math.floor(homeCount / 2)).scrollIntoViewIfNeeded();
      assert.ok(/ascent-everest-illustration-640\.(avif|webp)$/.test(await page.locator('.expedition-backdrop').evaluate(el => el.currentSrc)));
      assert.ok(/ascent-icewall-480\.(avif|webp)$/.test(await page.locator('.expedition-wall').evaluate(el => el.currentSrc)));
      await page.screenshot({ path: 'test-results/expedition-mobile-light.png' });
    }
    output.checks.push('Dark and light automated accessibility scans; desktop/mobile screenshot capture');

    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.reload();
    await checkpoints.last().scrollIntoViewIfNeeded();
    assert.equal(await page.locator('.expedition-panel').first().evaluate(el => getComputedStyle(el).transitionDuration), '0s');
    const stillPose = await page.locator('[data-climber-frame-primary]').getAttribute('href');
    await checkpoints.first().scrollIntoViewIfNeeded();
    assert.equal(await page.locator('[data-climber-frame-primary]').getAttribute('href'), stillPose);
    output.checks.push('Reduced motion keeps entries available and holds one static complete climbing pose');
    const lastDestination = await page.locator('.expedition-panel h2 a').last().getAttribute('href');
    await context.close();

    const noJs = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
    const staticPage = await noJs.newPage();
    await staticPage.goto(base + '/journey/');
    assert.equal(await staticPage.locator('.expedition-panel h2 a').count(), homeCount);
    assert.equal(await staticPage.locator('.expedition-panel h2 a').last().getAttribute('href'), lastDestination);
    await noJs.close();
    output.checks.push('No-JavaScript version retains all dated, linked checkpoints');
    assert.deepEqual(errors, []);
    output.passed = true;
  } finally {
    await browser.close();
    fs.writeFileSync(`test-results/expedition-${browserName}.json`, JSON.stringify(output, null, 2));
  }
  console.log(`PASS: ${browserName}; ${output.checks.length} expedition checks`);
})().catch(error => { console.error(error); process.exitCode = 1; });
