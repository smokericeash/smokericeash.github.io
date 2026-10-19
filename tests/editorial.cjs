const { chromium, firefox, webkit } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const name = process.env.TEST_BROWSER || "chromium";
const base = process.env.TEST_URL || "http://127.0.0.1:4173";
const result = { browser: name, checks: [], errors: [] };
(async () => {
  const browser = await { chromium, firefox, webkit }[name].launch({
    headless: true,
    ...(name === "chromium" && process.env.CHROME_CHANNEL
      ? { channel: process.env.CHROME_CHANNEL }
      : {}),
  });
  try {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    });
    await context.addInitScript(() => {
      window.motionEvidence = {
        native: false,
        fallback: false,
        names: [],
        sequenced: false,
        reveals: 0,
      };
      const animate = Element.prototype.animate;
      Element.prototype.animate = function (frames, options) {
        if (this.id === "main") window.motionEvidence.fallback = true;
        if (this.matches(".post-thumbnail, .post-preview-media"))
          window.motionEvidence.reveals++;
        return animate.call(this, frames, options);
      };
      addEventListener("pagereveal", (event) => {
        window.motionEvidence.native = !!event.viewTransition;
        if (event.viewTransition)
          event.viewTransition.ready
            .then(() => {
              const animations = document.getAnimations();
              window.motionEvidence.names = animations
                .map((animation) => animation.animationName)
                .filter(Boolean);
              const incoming = animations.find(
                (animation) => animation.animationName === "calm-in",
              );
              const outgoing = animations.find(
                (animation) => animation.animationName === "calm-out",
              );
              const hold = incoming?.effect
                ?.getKeyframes()
                .filter((frame) => frame.opacity === "0")
                .at(-1)?.computedOffset;
              window.motionEvidence.sequenced =
                !!incoming &&
                !!outgoing &&
                Number(outgoing.effect.getTiming().duration) <=
                  Number(incoming.effect.getTiming().duration) * hold;
            })
            .catch(() => {});
      });
    });
    const page = await context.newPage();
    page.on("pageerror", (error) => result.errors.push(error.message));
    await page.goto(base);
    assert.deepEqual(await page.locator("#primary-nav a").allTextContents(), [
      "Home",
      "Work",
      "The Ascent",
      "About",
    ]);
    assert.equal(await page.locator("#hero-title").textContent(), "Aidan Chen");
    assert.equal(
      await page.locator(".brand > span:nth-child(2)").textContent(),
      "Aidan Chen",
    );
    assert.equal(await page.locator(".post-preview").count(), 3);
    const postCount = await page.locator(".chronicle-entry").count();
    assert.ok(postCount >= 9, "Original milestones remain available");
    assert.ok(
      await page
        .locator(".home-timeline .chronicle")
        .evaluate(
          (el) =>
            Math.abs(
              el.clientWidth - document.querySelector(".home-page").clientWidth,
            ) < 2,
        ),
    );
    assert.doesNotMatch(
      await page.locator("main").innerText(),
      /Curiosity is the start|Good work starts|Building stronger foundations|A little more understanding/,
    );
    result.checks.push(
      "Four primary destinations; concise factual home; three latest post previews and full-width timeline",
    );

    assert.equal(await page.locator(".footer-name").count(), 0);
    assert.equal(
      (await page.locator(".footer-bottom").innerText()).includes(
        "© 2026 Aidan Chen",
      ),
      true,
    );
    const archive = await page.request.get(base + "/archives/");
    const archiveHtml = await archive.text();
    assert.match(
      archiveHtml,
      /Every entry, in order\. Moments of learning documented so far\./,
    );
    assert.doesNotMatch(archiveHtml, /\d+ moments of learning/);
    result.checks.push(
      "Footer keeps one Aidan Chen copyright; archive wording has no manual count",
    );

    const contactEmail = page.locator(".contact-email");
    await contactEmail.click();
    const emailDialog = page.locator("#email-dialog");
    await emailDialog.waitFor({ state: "visible" });
    assert.equal(
      await emailDialog.locator("[data-email-app]").getAttribute("href"),
      "mailto:aidanchenn1@gmail.com",
    );
    assert.match(
      await emailDialog.locator("[data-email-gmail]").getAttribute("href"),
      /^https:\/\/mail\.google\.com\/mail\/\?.*to=aidanchenn1%40gmail\.com/,
    );
    await emailDialog.locator(".email-dialog-close").click();
    assert.equal(await emailDialog.isVisible(), false);
    assert.equal(
      await contactEmail.evaluate((link) => link === document.activeElement),
      true,
    );

    await page
      .getByRole("link", { name: "Request résumé", exact: true })
      .click();
    await emailDialog.waitFor({ state: "visible" });
    assert.equal(
      await emailDialog.locator("#email-dialog-title").textContent(),
      "Request a résumé",
    );
    assert.match(
      await emailDialog.locator("[data-email-app]").getAttribute("href"),
      /^mailto:aidanchenn1@gmail\.com\?subject=R%C3%A9sum%C3%A9%20request&body=/,
    );
    assert.match(
      await emailDialog.locator("[data-email-note]").innerText(),
      /shared by email/,
    );
    await emailDialog.locator(".email-dialog-close").click();

    await page
      .locator(".site-footer")
      .getByRole("link", { name: "Email", exact: true })
      .click();
    await emailDialog.waitFor({ state: "visible" });
    assert.equal(
      await emailDialog.locator("[data-email-app]").getAttribute("href"),
      "mailto:aidanchenn1@gmail.com",
    );
    await emailDialog.locator(".email-dialog-close").click();
    result.checks.push(
      "Contact address and footer Email open explicit email choices; résumé request is prefilled and privacy-preserving",
    );

    for (const [label, path] of [
      ["Work", "/research/"],
      ["The Ascent", "/journey/"],
      ["About", "/about/"],
      ["Home", "/"],
    ]) {
      await page
        .locator("#primary-nav")
        .getByRole("link", { name: label, exact: true })
        .click();
      await page.waitForURL(base + path);
      await page.waitForFunction(
        () =>
          motionEvidence.names.includes("calm-in") || motionEvidence.fallback,
      );
      assert.equal(
        await page.locator('#primary-nav a[aria-current="page"]').textContent(),
        label,
      );
      assert.equal(await page.locator("h1").count(), 1);
      const expectedHeading = {
        Home: "Aidan Chen",
        Work: "Work",
        "The Ascent": "The Ascent",
        About: "About me",
      }[label];
      assert.equal(await page.locator("h1").textContent(), expectedHeading);
      const evidence = await page.evaluate(() => motionEvidence);
      if (evidence.native) assert.equal(evidence.sequenced, true);
      result.checks.push(
        `${label}: ${evidence.native ? "native sequenced fade transition" : "fallback fade entrance"} with normal navigation`,
      );
      await page.waitForFunction(
        () =>
          !document
            .getAnimations()
            .some(
              (animation) =>
                ["calm-in", "calm-out"].includes(animation.animationName) &&
                animation.playState === "running",
            ),
      );
    }
    await page.goBack();
    assert.ok(page.url().endsWith("/about/"));
    await page.goForward();
    assert.equal(page.url(), base + "/");
    result.checks.push(
      "Back and forward retain browser history and correct pages",
    );

    await page.goto(base + "/research/");
    await page
      .locator(".post-thumbnail img")
      .evaluateAll((images) =>
        images.forEach((image) => (image.loading = "eager")),
      );
    await page
      .locator(".post-thumbnail img")
      .evaluateAll((images) =>
        Promise.all(images.map((image) => image.decode())),
      );
    const entries = await page.locator(".post-row").evaluateAll((rows) =>
      rows.map((row) => ({
        href: row.querySelector("h3 a").getAttribute("href"),
        src: row.querySelector("img")?.getAttribute("src"),
        imageHref: row.querySelector(".post-thumbnail")?.getAttribute("href"),
      })),
    );
    assert.equal(entries.length, postCount);
    for (const entry of entries) {
      const response = await page.request.get(base + entry.href);
      assert.equal(response.status(), 200);
      const cover = (await response.text()).match(
        /<figure class="article-cover">[\s\S]*?<img src="([^"]+)"/,
      );
      assert.equal(entry.src, cover?.[1], `Wrong preview for ${entry.href}`);
      if (!entry.src) continue;
      assert.equal(entry.imageHref, entry.href);
    }
    result.checks.push(
      "All Work previews decode and match their original article cover image and destination",
    );

    const target = page.locator(".post-row:has(.post-thumbnail)").nth(4);
    await target.scrollIntoViewIfNeeded();
    assert.equal(await page.evaluate(() => motionEvidence.reveals), 0);
    assert.equal(
      await target
        .locator(".post-thumbnail")
        .evaluate((el) => getComputedStyle(el).clipPath),
      "none",
    );
    assert.ok(await target.locator(".post-thumbnail").isVisible());
    await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
    await target.scrollIntoViewIfNeeded();
    assert.equal(await page.evaluate(() => motionEvidence.reveals), 0);
    result.checks.push(
      "Work previews remain visible and stable while scrolling, without entrance effects",
    );

    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(base + "/research/");
    await page.locator(".post-row").nth(5).scrollIntoViewIfNeeded();
    assert.equal(await page.evaluate(() => motionEvidence.reveals), 0);
    await page
      .locator("#primary-nav")
      .getByRole("link", { name: "The Ascent", exact: true })
      .click();
    await page.waitForURL(base + "/journey/");
    assert.equal(
      await page.evaluate(
        () => motionEvidence.native || motionEvidence.fallback,
      ),
      false,
    );
    assert.equal(
      await page.evaluate(
        () =>
          document.getAnimations().filter((a) => a.playState === "running")
            .length,
      ),
      0,
    );
    result.checks.push(
      "Reduced motion disables scroll and page animations without delaying links",
    );
    assert.deepEqual(result.errors, []);
    result.passed = true;
    await context.close();
  } finally {
    await browser.close();
    fs.writeFileSync(
      `test-results/editorial-${name}.json`,
      JSON.stringify(result, null, 2),
    );
  }
  console.log(
    `PASS: ${name}; ${result.checks.length} editorial and motion check groups`,
  );
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
