const { chromium, firefox, webkit } = require("playwright");
const { default: AxeBuilder } = require("@axe-core/playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const name = process.env.TEST_BROWSER || "chromium";
const base = process.env.TEST_URL || "http://127.0.0.1:4173";
const results = { browser: name, checks: [], errors: [] };
(async () => {
  const browser = await { chromium, firefox, webkit }[name].launch({
    headless: true,
    ...(name === "chromium" && process.env.CHROME_CHANNEL
      ? { channel: process.env.CHROME_CHANNEL }
      : {}),
  });
  try {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
      colorScheme: "dark",
    });
    const page = await context.newPage();
    page.on("pageerror", (error) => results.errors.push(error.message));
    let postCount;
    const jumpToLatestYear = async () => {
      const button = page.locator("[data-year-jump]").last();
      const year = await button.getAttribute("data-year-jump");
      const index = await page
        .locator(".chronicle-entry")
        .evaluateAll(
          (entries, year) =>
            entries.findIndex((entry) => entry.dataset.year === year),
          year,
        );
      await button.click();
      await select(index);
    };
    const select = async (index) => {
      await page.waitForFunction(
        (index) =>
          document
            .querySelectorAll(".chronicle-entry")
            [index].hasAttribute("data-current"),
        index,
      );
      assert.equal(
        await page.locator(".chronicle-entry[data-current]").count(),
        1,
      );
    };
    for (const route of ["/", "/journey/"]) {
      await page.goto(base + route);
      const timeline = page.locator(".chronicle");
      await timeline.scrollIntoViewIfNeeded();
      postCount = await page.locator(".chronicle-entry").count();
      assert.ok(postCount >= 9, "Original milestones remain available");
      const lastIndex = postCount - 1;
      const viewport = page.locator(".chronicle-window");
      const map = page.locator(".ascent-map");
      assert.equal(await map.getAttribute("aria-hidden"), "true");
      assert.ok(Number(await map.getAttribute("data-progress")) < 0.01);
      const untraveledRoute = await map.locator(".ascent-route-travel").evaluate(
        (el) => getComputedStyle(el).clipPath,
      );
      assert.equal(
        await viewport.evaluate(
          (element) => getComputedStyle(element).scrollSnapType,
        ),
        "none",
      );
      await viewport.evaluate((element) => {
        window.timelineScrollTrace = [];
        element.addEventListener(
          "scroll",
          () => window.timelineScrollTrace.push(element.scrollLeft),
          { passive: true },
        );
      });
      await page.getByRole("button", { name: "Next milestone" }).click();
      await select(1);
      await page.waitForFunction(() => {
        const frame = document.querySelector(".chronicle-window");
        const entries = frame.querySelectorAll(".chronicle-entry");
        return (
          Math.abs(
            frame.scrollLeft - (entries[1].offsetLeft - entries[0].offsetLeft),
          ) < 2
        );
      });
      const glide = await page.evaluate(() => {
        const entries = document.querySelectorAll(".chronicle-entry");
        const target = entries[1].offsetLeft - entries[0].offsetLeft;
        return window.timelineScrollTrace.some(
          (position) => position > target * 0.2 && position < target * 0.8,
        );
      });
      assert.ok(
        glide,
        `${route}: next control must glide through intermediate positions`,
      );
      await page.getByRole("button", { name: "Previous milestone" }).click();
      await select(0);
      await jumpToLatestYear();
      await page.locator(".chronicle input").fill(String(lastIndex));
      await select(lastIndex);
      await page.waitForFunction(
        () => Number(document.querySelector(".ascent-map").dataset.progress) > 0.98,
      );
      assert.ok(
        (await map.locator(".ascent-climber").evaluate((el) => parseFloat(el.style.left))) > 95,
      );
      assert.notEqual(
        await map.locator(".ascent-route-travel").evaluate(
          (el) => getComputedStyle(el).clipPath,
        ),
        untraveledRoute,
      );
      results.checks.push(`${route}: climber and illuminated route follow scroll to the latest entry`);
      assert.equal(
        await page.getByRole("button", { name: "Next milestone" }).isDisabled(),
        true,
      );
      assert.equal(
        await page.locator(".chronicle input").getAttribute("aria-valuetext"),
        await page
          .locator(".chronicle-entry")
          .last()
          .getAttribute("data-milestone-label"),
      );
      await viewport.focus();
      await page.keyboard.press("Home");
      await select(0);
      await page.keyboard.press("End");
      await select(lastIndex);
      await page.keyboard.press("ArrowLeft");
      await select(lastIndex - 1);
      results.checks.push(
        `${route}: year jumps, next/previous, range endpoint, Home/End/Arrow keys and accessible value`,
      );

      await page.locator(".chronicle input").fill("0");
      await select(0);
      const wheelBounds = await viewport.boundingBox();
      await page.mouse.move(
        wheelBounds.x + Math.min(220, wheelBounds.width - 20),
        wheelBounds.y + 100,
      );
      await page.mouse.wheel(130, 0);
      await page.waitForFunction(
        () => document.querySelector(".chronicle-window").scrollLeft > 20,
      );
      await page.waitForTimeout(250);
      const wheelPosition = await viewport.evaluate((element) => {
        const entries = element.querySelectorAll(".chronicle-entry");
        return {
          left: element.scrollLeft,
          next: entries[1].offsetLeft - entries[0].offsetLeft,
        };
      });
      assert.ok(
        wheelPosition.left < wheelPosition.next - 40,
        `${route}: a small horizontal wheel gesture should not jump to the next post`,
      );
      const routeProgress = Number(await map.getAttribute("data-progress"));
      assert.ok(routeProgress > 0 && routeProgress < 1);
      assert.ok(
        (await map.locator(".ascent-climber").evaluate((el) => parseFloat(el.style.left))) > 3.4,
      );
      await page.locator(".chronicle input").fill("0");
      await select(0);
      results.checks.push(
        `${route}: wheel scrolling remains continuous between milestones`,
      );
      const bounds = await viewport.boundingBox();
      await page.mouse.move(
        bounds.x + Math.min(320, bounds.width - 25),
        bounds.y + 120,
      );
      await page.mouse.down();
      await page.mouse.move(bounds.x + 20, bounds.y + 120, { steps: 16 });
      await page.mouse.up();
      await select(1);
      assert.equal(new URL(page.url()).pathname, route);
      results.checks.push(
        `${route}: mouse drag advances timeline without activating an entry`,
      );

      for (const width of [360, 430, 768, 1920, 2560, 3440]) {
        await page.setViewportSize({ width, height: 1000 });
        await page.locator(".chronicle input").fill(String(lastIndex));
        await select(lastIndex);
        const geometry = await viewport.evaluate((element) => {
          const last = element
            .querySelector(".chronicle-entry:last-child")
            .getBoundingClientRect();
          const frame = element.getBoundingClientRect();
          return {
            documentWidth: document.documentElement.scrollWidth,
            width: innerWidth,
            fits: last.left >= frame.left - 2 && last.right <= frame.right + 2,
          };
        });
        assert.ok(
          geometry.documentWidth <= geometry.width + 1,
          `Page overflow at ${width}`,
        );
        assert.ok(geometry.fits, `Last milestone unreachable at ${width}`);
      }
      results.checks.push(
        `${route}: final milestone fully reachable at all six responsive widths`,
      );
      await page.setViewportSize({ width: 1440, height: 1000 });
      for (const theme of ["light", "dark"]) {
        await page.selectOption("#theme-select", theme);
        const audit = await new AxeBuilder({ page })
          .withTags([
            "wcag2a",
            "wcag2aa",
            "wcag21a",
            "wcag21aa",
            "wcag22aa",
            "best-practice",
          ])
          .analyze();
        if (audit.violations.length)
          console.log(
            JSON.stringify(
              audit.violations.map((v) => ({
                id: v.id,
                nodes: v.nodes.map((n) => ({
                  target: n.target,
                  reason: n.failureSummary,
                })),
              })),
              null,
              2,
            ),
          );
        assert.deepEqual(
          audit.violations.map((v) => v.id),
          [],
          `${theme} accessibility`,
        );
      }
    }
    await page.goto(base);
    assert.equal(await page.locator(".post-preview").count(), 3);
    assert.equal(await page.locator(".topology").count(), 0);
    const destination = await page
      .locator(".post-preview h3 a")
      .first()
      .getAttribute("href");
    await page.locator(".post-preview h3 a").first().click();
    assert.ok(page.url().endsWith(destination));
    assert.equal(await page.locator(".reading-trace").count(), 1);
    await page.evaluate(() =>
      window.scrollTo({ top: document.body.scrollHeight, behavior: "instant" }),
    );
    await page.waitForFunction(
      () =>
        getComputedStyle(document.querySelector(".reading-trace")).transform ===
        "matrix(1, 0, 0, 1, 0, 0)",
    );
    results.checks.push(
      "Homepage post previews link to original entries; article reading trace reaches completion",
    );

    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(base + "/journey/");
    await jumpToLatestYear();
    assert.equal(
      await page
        .locator(".chronicle-card")
        .first()
        .evaluate((el) => getComputedStyle(el).transitionDuration),
      "0s",
    );
    assert.equal(
      await page.evaluate(
        () =>
          document
            .getAnimations()
            .filter((animation) => animation.playState === "running").length,
      ),
      0,
    );
    results.checks.push(
      "Reduced motion: no active animations, instant timeline navigation",
    );

    // Hold the cover response so cached images cannot hide a layout regression.
    for (const width of [412, 1440]) {
      const delayed = await context.newPage();
      await delayed.setViewportSize({ width, height: 1000 });
      let release;
      const ready = new Promise((resolve) => {
        release = resolve;
      });
      await delayed.route("**/assets/media/missa-*.webp", async (route) => {
        await ready;
        await route.continue();
      });
      try {
        await delayed.goto(base + "/posts/MISSA-ITC-Competition/", {
          waitUntil: "domcontentloaded",
        });
        const geometry = () =>
          delayed.locator(".article-cover img").evaluate((image) => ({
            height: image.getBoundingClientRect().height,
            gridTop: document
              .querySelector(".article-grid")
              .getBoundingClientRect().top,
          }));
        const before = await geometry();
        assert.ok(
          before.height > 0,
          `Cover space missing before decode at ${width}`,
        );
        release();
        await delayed
          .locator(".article-cover img")
          .evaluate((image) => image.decode());
        const after = await geometry();
        assert.ok(
          Math.abs(after.gridTop - before.gridTop) < 1,
          `Cover shifts content at ${width}`,
        );
      } finally {
        release();
        await delayed.close();
      }
    }
    results.checks.push(
      "Delayed article cover reserves its space on mobile and desktop",
    );
    await context.close();

    const staticContext = await browser.newContext({
      javaScriptEnabled: false,
      viewport: { width: 360, height: 800 },
    });
    const staticPage = await staticContext.newPage();
    await staticPage.goto(base + "/journey/");
    assert.equal(
      await staticPage.locator(".chronicle-entry").count(),
      postCount,
    );
    assert.equal(
      await staticPage.locator(".chronicle-controls").isVisible(),
      false,
    );
    const lastLink = staticPage
      .locator(".chronicle-entry:last-child a")
      .first();
    const lastDestination = await lastLink.getAttribute("href");
    await lastLink.focus();
    await staticPage.keyboard.press("Enter");
    await staticPage.waitForURL(base + lastDestination);
    assert.ok(staticPage.url().endsWith(lastDestination));
    await staticContext.close();
    results.checks.push(
      "No-JS timeline preserves all entries and keyboard-accessible destinations",
    );
    if (name === "chromium") {
      const touchContext = await browser.newContext({
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      });
      const touchPage = await touchContext.newPage();
      await touchPage.goto(base + "/journey/");
      await touchPage.locator(".chronicle-window").scrollIntoViewIfNeeded();
      const box = await touchPage.locator(".chronicle-window").boundingBox();
      const session = await touchContext.newCDPSession(touchPage);
      const y = Math.min(box.y + 100, 700);
      await session.send("Input.dispatchTouchEvent", {
        type: "touchStart",
        touchPoints: [{ x: 330, y }],
      });
      for (let x = 310; x >= 70; x -= 20) {
        await session.send("Input.dispatchTouchEvent", {
          type: "touchMove",
          touchPoints: [{ x, y }],
        });
        await touchPage.waitForTimeout(20);
      }
      await session.send("Input.dispatchTouchEvent", {
        type: "touchEnd",
        touchPoints: [],
      });
      await touchPage.waitForFunction(
        () => document.querySelector(".chronicle-window").scrollLeft > 100,
      );
      assert.ok(touchPage.url().endsWith("/journey/"));
      await touchContext.close();
      results.checks.push(
        "Native mobile touch swipe scrolls the timeline without following links",
      );
    }
    assert.deepEqual(results.errors, []);
    results.passed = true;
  } finally {
    await browser.close();
    fs.writeFileSync(
      `test-results/experience-${name}.json`,
      JSON.stringify(results, null, 2),
    );
  }
  console.log(
    `PASS: ${name}; ${results.checks.length} experience check groups, zero browser errors`,
  );
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
