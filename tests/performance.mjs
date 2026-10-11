import { chromium } from "playwright";
import lighthouse from "lighthouse";
import fs from "node:fs";
const browser = await chromium.launch({
  headless: true,
  ...(process.env.CHROME_CHANNEL
    ? { channel: process.env.CHROME_CHANNEL }
    : {}),
  args: ["--remote-debugging-port=9225"],
});
fs.mkdirSync("test-results", { recursive: true });
const results = [];
try {
  for (const [name, route] of [
    ["home", "/"],
    ["journal", "/research/"],
    ["article", "/posts/MISSA-ITC-Competition/"],
    ["journey", "/journey/"],
  ].filter(([name]) => !process.env.PERFORMANCE_PAGE || process.env.PERFORMANCE_PAGE === name)) {
    for (const desktop of [false, true]) {
      const device = desktop ? "desktop" : "mobile";
      const result = await lighthouse(`http://127.0.0.1:4173${route}`, {
        port: 9225,
        output: ["html", "json"],
        logLevel: "error",
        onlyCategories: [
          "performance",
          "accessibility",
          "best-practices",
          "seo",
        ],
        ...(desktop
          ? {
              formFactor: "desktop",
              screenEmulation: {
                mobile: false,
                width: 1350,
                height: 940,
                deviceScaleFactor: 1,
                disabled: false,
              },
              throttling: {
                rttMs: 40,
                throughputKbps: 10240,
                cpuSlowdownMultiplier: 1,
                requestLatencyMs: 0,
                downloadThroughputKbps: 0,
                uploadThroughputKbps: 0,
              },
            }
          : {}),
      });
      fs.writeFileSync(
        `test-results/lighthouse-${name}-${device}.html`,
        result.report[0],
      );
      fs.writeFileSync(
        `test-results/lighthouse-${name}-${device}.json`,
        result.report[1],
      );
      const entry = {
        page: name,
        device,
        scores: Object.fromEntries(
          Object.entries(result.lhr.categories).map(([key, value]) => [
            key,
            Math.round(value.score * 100),
          ]),
        ),
        metrics: {
          LCP: result.lhr.audits["largest-contentful-paint"].displayValue,
          CLS: result.lhr.audits["cumulative-layout-shift"].displayValue,
          TBT: result.lhr.audits["total-blocking-time"].displayValue,
        },
        warnings: result.lhr.runWarnings,
      };
      results.push(entry);
      console.log(JSON.stringify(entry));
    }
  }
} finally {
  await browser.close();
}
fs.writeFileSync(
  "test-results/lighthouse-summary.json",
  JSON.stringify(results, null, 2),
);
if (
  results.some((result) =>
    Object.values(result.scores).some((score) => score < 95),
  )
)
  process.exitCode = 1;
