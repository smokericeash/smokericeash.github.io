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

    await page.goto(base + '/journey/');
    const checkpoints = page.locator('.expedition-checkpoint');
    assert.equal(await checkpoints.count(), homeCount);
    assert.equal(await page.locator('.chronicle').count(), 0);
    assert.equal(await page.locator('.expedition-art').count(), 1);
    assert.equal(await page.locator('.expedition-climber-frame').count(), 4);
    for (const frame of await page.locator('.expedition-climber-frame').evaluateAll(images => images.map(image => image.getAttribute('href') || image.dataset.frameSrc))) {
      assert.equal((await page.request.get(base + frame)).status(), 200, `${frame} must load`);
    }
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
      const begun = performance.now();
      const sample = () => {
        window.__wheelPositions.push(Math.round(scrollY));
        if (performance.now() - begun < 850) requestAnimationFrame(sample);
      };
      requestAnimationFrame(sample);
    });
    await page.mouse.move(1100, 460);
    await page.mouse.wheel(0, 580);
    await page.waitForTimeout(1600);
    const intermediatePositions = await page.evaluate(() => new Set(window.__wheelPositions).size);
    assert.ok(intermediatePositions >= (browserName === 'firefox' ? 4 : 7), `Wheel should ease through intermediate positions: ${intermediatePositions}`);
    const settled = await page.evaluate(() => {
      const target = 84 + (innerHeight - 84) / 2;
      const panels = [...document.querySelectorAll('.expedition-checkpoint')];
      return Math.min(...panels.map(el => Math.abs(el.getBoundingClientRect().top + el.getBoundingClientRect().height / 2 - target)));
    });
    assert.ok(Math.abs(await page.evaluate(() => scrollY) - beforeWheel) > 100, 'Wheel must reach another post');
    assert.ok(Math.abs(await page.evaluate(() => scrollY) - beforeWheel) < 950, 'Wheel should not leap over several entries');
    assert.ok(settled < 250, `Post did not settle near a reading position: ${settled}`);
    output.checks.push('Desktop wheel navigation eases through intermediate positions and settles near one entry');
    const positions = [];
    for (const index of [0, Math.floor(homeCount / 2), homeCount - 1]) {
      await checkpoints.nth(index).scrollIntoViewIfNeeded();
      await page.waitForTimeout(850);
      positions.push(Number((await page.locator('.expedition-art').getAttribute('viewBox')).split(' ')[1]));
    }
    assert.ok(positions[0] > positions[1] && positions[1] > positions[2], `Camera did not climb: ${positions}`);
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
        pose: [...el.querySelectorAll('.expedition-climber-frame')].findIndex(image => Number(getComputedStyle(image).opacity) > .9),
        frames: [...el.querySelectorAll('.expedition-climber-frame')].map(image => ({ loaded: image.hasAttribute('href'), opacity: getComputedStyle(image).opacity })),
        transform: el.getAttribute('transform'),
        wall: document.querySelector('.expedition-wall-picture').style.transform,
        scroll: scrollY,
        stage: document.querySelector('[data-expedition-position]').textContent,
      }));
    };
    const reaching = await samplePose(.1);
    const pulling = await samplePose(.9);
    assert.notEqual(reaching.pose, pulling.pose, `Realistic climber frames must change with ascent: ${JSON.stringify({ reaching, pulling })}`);
    assert.notEqual(reaching.transform, pulling.transform, 'Climber must travel along the wall');
    assert.notEqual(reaching.wall, pulling.wall, 'Foreground wall must parallax separately from the distant mountain');
    assert.ok(parseFloat(await page.locator('.expedition-route-done').evaluate(el => el.style.strokeDashoffset)) > 0);
    await page.evaluate(() => { document.documentElement.style.removeProperty('scroll-snap-type'); });
    output.checks.push('Full-body climbing poses, physical wall travel and parallax respond continuously to progress');

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
    const stillPose = await page.locator('.expedition-climber-frame').evaluateAll(images => images.map(image => getComputedStyle(image).opacity));
    await checkpoints.first().scrollIntoViewIfNeeded();
    assert.deepEqual(await page.locator('.expedition-climber-frame').evaluateAll(images => images.map(image => getComputedStyle(image).opacity)), stillPose);
    output.checks.push('Reduced motion keeps entries available and holds one static climbing pose');
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
