const { chromium, firefox, webkit } = require("playwright");
const { default: AxeBuilder } = require("@axe-core/playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const base = process.env.TEST_URL || "http://127.0.0.1:4173";
const name = process.env.TEST_BROWSER || "chromium";
const engines = { chromium, firefox, webkit };
const options = { headless: true };
if (name === "chromium" && process.env.CHROME_CHANNEL)
  options.channel = process.env.CHROME_CHANNEL;
const out = path.join(__dirname, "../test-results");
fs.mkdirSync(out, { recursive: true });
const routes = fs
  .readdirSync(path.join(__dirname, "../_site"), { recursive: true })
  .filter((f) => f.endsWith(".html"))
  .map((f) => "/" + f.replaceAll("\\", "/").replace(/index\.html$/, ""));
const primary = [
  "/",
  "/work/",
  "/research/",
  "/journey/",
  "/about/",
  "/work/itc-2026/",
  "/posts/MISSA-ITC-Competition/",
  "/posts/NETWORK+/",
  "/categories/",
  "/tags/",
  "/archives/",
];
const widths = [360, 430, 768, 1920, 2560, 3440];
const failures = [];
const report = {
  browser: name,
  routeChecks: 0,
  responsiveChecks: 0,
  accessibility: [],
  interactions: [],
};

(async () => {
  const browser = await engines[name].launch(options);
  try {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
      colorScheme: "dark",
    });
    const page = await context.newPage();
    page.on("pageerror", (e) => failures.push("JS: " + e.message));
    page.on("response", (r) => {
      if (r.status() >= 400) failures.push(`HTTP ${r.status()}: ${r.url()}`);
    });
    page.on("requestfailed", (r) =>
      failures.push("Request failed: " + r.url()),
    );
    const checkLayout = async (label) => {
      const layout = await page.evaluate(() => ({
        width: innerWidth,
        scroll: document.documentElement.scrollWidth,
        headings: document.querySelectorAll("h1").length,
      }));
      if (layout.scroll > layout.width + 1)
        failures.push(
          `${label}: horizontal overflow ${layout.scroll}/${layout.width}`,
        );
      if (layout.headings !== 1)
        failures.push(`${label}: ${layout.headings} h1 headings`);
    };
    for (const theme of ["dark", "light"]) {
      await page.goto(base);
      await page.selectOption("#theme-select", theme);
      for (const route of routes) {
        await page.goto(base + route);
        await checkLayout(theme + route);
        assert.equal(
          await page.locator("html").getAttribute("data-theme"),
          theme,
        );
        report.routeChecks++;
      }
      for (const width of widths) {
        await page.setViewportSize({
          width,
          height: width > 1000 ? 1080 : 900,
        });
        for (const route of primary) {
          await page.goto(base + route);
          await checkLayout(`${theme} ${width} ${route}`);
          report.responsiveChecks++;
        }
      }
      await page.setViewportSize({ width: 1440, height: 1000 });
      for (const route of primary) {
        await page.goto(base + route);
        const axe = await new AxeBuilder({ page })
          .withTags([
            "wcag2a",
            "wcag2aa",
            "wcag21a",
            "wcag21aa",
            "wcag22aa",
            "best-practice",
          ])
          .analyze();
        report.accessibility.push({
          theme,
          route,
          violations: axe.violations.map((v) => ({
            id: v.id,
            impact: v.impact,
            nodes: v.nodes.map((n) => n.target),
          })),
        });
        axe.violations.forEach((v) =>
          failures.push(
            `axe ${theme} ${route}: ${v.id} (${v.nodes.map((n) => n.target.join(" ")).join(", ")})`,
          ),
        );
      }
      console.log(
        `${name}: ${theme} route, responsive and accessibility checks complete`,
      );
    }
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto(base);
    assert.equal(await page.locator("#primary-nav").isVisible(), false);
    await page.getByRole("button", { name: /Menu/ }).focus();
    await page.keyboard.press("Enter");
    assert.equal(await page.locator("#primary-nav").isVisible(), true);
    await page.keyboard.press("Tab");
    assert.equal(
      await page.evaluate(() => document.activeElement.textContent.trim()),
      "Home",
    );
    await page.keyboard.press("Escape");
    assert.equal(await page.locator("#primary-nav").isVisible(), false);
    assert.equal(
      await page
        .locator(".menu-toggle")
        .evaluate((el) => el === document.activeElement),
      true,
    );
    await page.keyboard.press("Tab");
    assert.equal(
      await page.evaluate(() => document.activeElement.id),
      "theme-select",
    );
    report.interactions.push(
      "Mobile menu Enter/Tab/Escape, focus return, hidden links excluded from focus order",
    );
    await page.goto(base + "/research/");
    const networkMatches = await page
      .locator(".post-row")
      .evaluateAll(
        (rows) =>
          rows.filter((row) => row.dataset.search.includes("network")).length,
      );
    await page.locator("#journal-search").fill("network");
    assert.ok(networkMatches >= 1);
    assert.equal(
      await page.locator(".post-row:visible").count(),
      networkMatches,
    );
    await page.locator("#journal-search").fill("");
    const certificationMatches = await page
      .locator(".post-row")
      .evaluateAll(
        (rows) =>
          rows.filter((row) =>
            row.dataset.category.split("|").includes("Certification"),
          ).length,
      );
    await page.selectOption("#category-filter", "Certification");
    assert.ok(certificationMatches >= 1);
    assert.equal(
      await page.locator(".post-row:visible").count(),
      certificationMatches,
    );
    await page.locator("#journal-search").fill("no-matching-entry");
    assert.equal(await page.locator(".post-row:visible").count(), 0);
    assert.equal(await page.locator("#no-results").isVisible(), true);
    report.interactions.push("Search, category combination, empty results");
    await page.selectOption("#theme-select", "system");
    await page.emulateMedia({ colorScheme: "light" });
    await page.waitForFunction(
      () => document.documentElement.dataset.theme === "light",
    );
    assert.equal(
      await page.locator("html").getAttribute("data-theme"),
      "light",
    );
    await page.emulateMedia({ colorScheme: "dark" });
    await page.waitForFunction(
      () => document.documentElement.dataset.theme === "dark",
    );
    assert.equal(await page.locator("html").getAttribute("data-theme"), "dark");
    await page.selectOption("#theme-select", "light");
    await page.reload();
    assert.equal(
      await page.locator("html").getAttribute("data-theme"),
      "light",
    );
    await page.emulateMedia({ reducedMotion: "reduce" });
    assert.equal(
      await page.evaluate(
        () => getComputedStyle(document.documentElement).scrollBehavior,
      ),
      "auto",
    );
    report.interactions.push(
      "System theme updates, explicit preference persistence, reduced motion",
    );

    // Code-copy enhancement is tested with a nonpublished HTML fixture.
    await page.route("**/__code_fixture/", (route) =>
      route.fulfill({
        contentType: "text/html",
        body: fs
          .readFileSync(path.join(__dirname, "../_site/index.html"), "utf8")
          .replace(
            '<main id="main" tabindex="-1">',
            '<main id="main" tabindex="-1"><div class="prose"><pre><code>printf hello</code></pre></div>',
          ),
      }),
    );
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: {
          writeText: async (text) => {
            window.copiedText = text;
          },
        },
      });
    });
    await page.goto(base + "/__code_fixture/");
    await page.getByRole("button", { name: "Copy code to clipboard" }).click();
    assert.equal(await page.evaluate(() => window.copiedText), "printf hello");
    report.interactions.push("Copy-code control writes the exact code text");
    await context.close();

    const noJS = await browser.newContext({
      javaScriptEnabled: false,
      viewport: { width: 360, height: 800 },
      colorScheme: "dark",
    });
    const staticPage = await noJS.newPage();
    await staticPage.goto(base);
    assert.equal(await staticPage.locator("#primary-nav").isVisible(), true);
    assert.equal(await staticPage.locator("h1").textContent(), "Aidan Chen");
    await staticPage.goto(base + "/posts/MISSA-ITC-Competition/");
    assert.ok((await staticPage.locator(".toc a").count()) > 3);
    await noJS.close();
    report.interactions.push(
      "No-JS navigation, content, and static article TOC",
    );

    const blocked = await browser.newContext();
    await blocked.addInitScript(() => {
      Object.defineProperty(window, "localStorage", {
        get() {
          throw new Error("Storage blocked");
        },
      });
    });
    const blockedPage = await blocked.newPage();
    blockedPage.on("pageerror", (e) =>
      failures.push("Storage scenario: " + e.message),
    );
    await blockedPage.goto(base);
    await blockedPage.selectOption("#theme-select", "dark");
    assert.equal(
      await blockedPage.locator("html").getAttribute("data-theme"),
      "dark",
    );
    await blocked.close();
    report.interactions.push("Theme works when localStorage is unavailable");

    const shots = await browser.newContext();
    const shot = await shots.newPage();
    for (const theme of ["dark", "light"]) {
      for (const width of [390, 1440]) {
        await shot.setViewportSize({ width, height: 1000 });
        await shot.goto(base);
        await shot.selectOption("#theme-select", theme);
        // Scroll through to load documentary images before capturing the full page.
        await shot.locator("img").evaluateAll((images) =>
          images.forEach((img) => {
            img.loading = "eager";
          }),
        );
        await shot
          .locator("img")
          .evaluateAll((images) =>
            Promise.all(images.map((img) => img.decode().catch(() => {}))),
          );
        await shot.screenshot({
          path: path.join(out, `${name}-home-${theme}-${width}.png`),
          fullPage: true,
        });
      }
    }
    await shots.close();
  } finally {
    report.failures = [...new Set(failures)];
    fs.writeFileSync(
      path.join(out, `browser-${name}.json`),
      JSON.stringify(report, null, 2),
    );
    await browser.close();
  }
  report.failures = [...new Set(failures)];
  fs.writeFileSync(
    path.join(out, `browser-${name}.json`),
    JSON.stringify(report, null, 2),
  );
  if (report.failures.length) {
    console.error(report.failures.join("\n"));
    process.exitCode = 1;
  } else
    console.log(
      `PASS: ${name}; ${report.routeChecks} routes, ${report.responsiveChecks} responsive pages, ${report.accessibility.length} axe checks, ${report.interactions.length} interaction groups`,
    );
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
