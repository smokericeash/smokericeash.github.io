// Build real temporary Markdown posts without altering the preview or published content.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { execSync } = require('node:child_process');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const destination = 'test-results/post-propagation';
const output = path.join(root, destination);
const created = [];
const fixtures = [
  ['2099-01-01-propagation-climb.md', `---
title: "Propagation fixture climb"
date: 2099-01-01
categories: [Authoring Fixture]
tags: [propagation-fixture]
---

A text-only fixture with an automatically derived description.

## Evidence

The new checkpoint must extend the existing climb without editing its UI.
`],
  ['2099-01-02-propagation-note.md', `---
title: "Propagation fixture note"
date: 2099-01-02
categories: [Authoring Fixture]
tags: [propagation-fixture]
description: "An ordinary post that opts out of the climb."
ascent: false
image: /assets/img/missa.png
alt: "An existing cover reused only in this test"
---

An ordinary post remains discoverable throughout the journal.
`],
];
const read = route => fs.readFileSync(path.join(output, route), 'utf8');
const occurrences = (html, token) => html.split(token).length - 1;

(async () => {
  let server, browser;
  try {
    const original = fs.readFileSync(path.join(root, '_site/journey/index.html'), 'utf8');
    const count = occurrences(original, 'data-expedition-checkpoint');
    assert.ok(count > 0, 'Build the normal site before checking post propagation');
    for (const [name, content] of fixtures) {
      const file = path.join(root, '_posts', name);
      fs.writeFileSync(file, content, { flag: 'wx' });
      created.push(file);
    }
    // --future affects this isolated build only; the primary _site stays intact.
    execSync(`bundle exec jekyll build --future --destination ${destination}`, {
      cwd: root, stdio: 'pipe', env: { ...process.env, JEKYLL_ENV: 'production' },
    });
    execSync(`bundle exec ruby tests/verify_site.rb ${destination}`, { cwd: root, stdio: 'inherit' });
    const home = read('index.html');
    const journey = read('journey/index.html');
    assert.equal(occurrences(journey, 'data-expedition-checkpoint'), count + 1);
    assert.equal(occurrences(home, 'class="chronicle-entry"'), count + 1);
    assert.ok(journey.includes('Propagation fixture climb'));
    assert.ok(!journey.includes('Propagation fixture note'));
    assert.match(home, /THE RECORD \/ \d{4}–2099/, 'Ascent date range must include the new year');
    for (const route of ['index.html', 'research/index.html', 'archives/index.html',
      'categories/authoring-fixture/index.html', 'tags/propagation-fixture/index.html', 'feed.xml', 'sitemap.xml']) {
      for (const slug of ['propagation-climb', 'propagation-note'])
        assert.ok(read(route).includes(`/posts/${slug}/`), `${route} must discover ${slug}`);
    }
    assert.ok(read('posts/propagation-climb/index.html').includes('A text-only fixture with an automatically derived description.'));
    assert.ok(read('posts/propagation-climb/index.html').includes('/posts/propagation-note/'), 'Adjacent articles update');
    assert.ok(!read('posts/propagation-climb/index.html').includes('class="article-cover"'), 'Text-only posts have no empty cover');
    assert.ok(read('posts/propagation-note/index.html').includes('class="article-cover"'), 'An optional cover appears automatically');
    assert.ok(read('posts/propagation-note/index.html').includes('srcset="/assets/media/missa-480.webp'), 'Cover uses responsive derivatives');

    const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
      '.svg': 'image/svg+xml', '.webp': 'image/webp', '.avif': 'image/avif', '.png': 'image/png' };
    server = http.createServer((request, response) => {
      try {
        let file = path.resolve(output, '.' + decodeURIComponent(new URL(request.url, 'http://localhost').pathname));
        if (file !== output && !file.startsWith(output + path.sep)) { response.writeHead(403).end(); return; }
        if (fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
        response.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
        fs.createReadStream(file).pipe(response);
      } catch { response.writeHead(404).end(); }
    });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const base = `http://127.0.0.1:${server.address().port}`;
    browser = await chromium.launch({ headless: true,
      ...(process.env.CHROME_CHANNEL ? { channel: process.env.CHROME_CHANNEL } : {}) });
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(base + '/research/');
    await page.locator('#journal-search').fill('Propagation fixture');
    assert.equal(await page.locator('.post-row:visible').count(), 2);
    await page.locator('#category-filter').selectOption('Authoring Fixture');
    assert.equal(await page.locator('.post-row:visible').count(), 2);
    await page.goto(base + '/journey/');
    await page.waitForSelector('[data-contact-rig]');
    assert.equal(await page.locator('[data-expedition-checkpoint]').count(), count + 1);
    const measured = await page.evaluate(async () => {
      const world = document.querySelector('[data-expedition-world]');
      const height = Number(world.querySelector('[data-rig-wall] image').getAttribute('height'));
      document.documentElement.style.scrollBehavior = 'auto';
      const end = document.querySelector('.expedition-continuation');
      scrollTo(0, end.getBoundingClientRect().top + scrollY + end.offsetHeight / 2 - innerHeight * .52 + 2);
      return { height };
    });
    // One extra checkpoint means two extra steps (28 units each), at the same pace.
    const stages = count + 2;
    assert.equal(measured.height, Math.max(1550, 692 + (stages * 2 - 1) * 28 + 400));
    await page.waitForFunction(() => document.querySelector('[data-rig-final-portrait]').getAttribute('opacity') === '1');
    assert.deepEqual(errors, []);
    const result = { passed: true, postsAdded: 2, checkpointsBefore: count, checkpointsAfter: count + 1,
      covered: ['Home recent posts', 'Home Ascent', 'Work search/filter', 'archives', 'new category/tag', 'responsive cover',
        'description fallback', 'text-only cover', 'adjacent articles', 'feed', 'sitemap', 'longer live climb', 'summit', 'ascent:false'] };
    fs.writeFileSync(path.join(root, 'test-results/post-propagation.json'), JSON.stringify(result, null, 2));
    console.log('PASS: temporary posts propagate through every content view and extend the live climb');
  } finally {
    for (const file of created) fs.unlinkSync(file);
    if (browser) await browser.close();
    if (server) await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
