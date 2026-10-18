const { chromium } = require('playwright');
const path = require('node:path');

(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  try {
    const page = await browser.newPage();
    await page.setContent('<svg><defs></defs><g id="world"></g></svg>');
    await page.addScriptTag({ path: path.resolve('prototypes/ice-climber-rig.js') });
    const report = await page.evaluate(() => {
      const rig = IceClimberRig.create(document.querySelector('svg'), document.querySelector('#world'), 10);
      let maxArm = 0, maxLeg = 0, maxDrift = 0, swaps = 0, maxArmAt = null;
      const length = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
      const states = [];
      for (let n = 0; n <= 1000; n++) {
        const s = rig.update(n / 100);
        for (const side of ['left', 'right']) {
          const armLength = Math.max(length(s.shoulders[side], s.elbows[side]), length(s.elbows[side], s.hands[side]));
          if (armLength > maxArm) { maxArm = armLength; maxArmAt = { progress: n / 100, side, reach: length(s.shoulders[side], s.hands[side]) }; }
          maxLeg = Math.max(maxLeg, length(s.hips[side], s.knees[side]), length(s.knees[side], s.feet[side]));
        }
        if (n % 10 === 0 && n / 100 < 9.72) states.push(s);
      }
      for (let i = 1; i < states.length; i++) {
        const a = states[i - 1], b = states[i];
        if (a.step !== b.step) continue;
        if (a.moving !== b.moving) swaps++;
        const support = a.planted;
        maxDrift = Math.max(maxDrift, length(a.feet[support], b.feet[support]), length(a.tips[support], b.tips[support]));
      }
      return { maxArm, maxArmAt, maxLeg, maxDrift, swaps };
    });
    console.log(JSON.stringify(report));
    if (report.maxArm > 45 || report.maxLeg > 61 || report.maxDrift > .01 || report.swaps) process.exitCode = 1;
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
