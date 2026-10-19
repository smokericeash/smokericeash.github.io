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
      let maxArm = 0, maxLeg = 0, maxDrift = 0, maxJointDelta = 0, swaps = 0, maxArmAt = null, maxLegAt = null, maxJointAt = null;
      const length = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
      const states = [];
      let previous = null;
      for (let n = 0; n <= 1000; n++) {
        const s = rig.update(n / 100);
        for (const side of ['left', 'right']) {
          const armLength = Math.max(length(s.shoulders[side], s.elbows[side]), length(s.elbows[side], s.hands[side]));
          if (armLength > maxArm) { maxArm = armLength; maxArmAt = { progress: n / 100, side, reach: length(s.shoulders[side], s.hands[side]) }; }
          const legLength = Math.max(length(s.hips[side], s.knees[side]), length(s.knees[side], s.feet[side]));
          if (legLength > maxLeg) { maxLeg = legLength; maxLegAt = { progress: n / 100, side, step: s.step, u: s.u }; }
          // The photo-skin arm is mapped between shoulder and hand. The solver's
          // internal elbow can switch bend branches without a visible seam.
          if (previous && n / 100 < 9.7) for (const name of ['hips', 'knees', 'feet', 'shoulders', 'hands', 'tips']) {
            const delta = length(previous[name][side], s[name][side]);
            if (delta > maxJointDelta) { maxJointDelta = delta; maxJointAt = { progress: n / 100, side, name, step: s.step, u: s.u }; }
          }
        }
        previous = s;
        if (n % 10 === 0 && n / 100 < 9.72) states.push(s);
      }
      for (let i = 1; i < states.length; i++) {
        const a = states[i - 1], b = states[i];
        if (a.step !== b.step) continue;
        if (a.moving !== b.moving) swaps++;
        const support = a.planted;
        maxDrift = Math.max(maxDrift, length(a.feet[support], b.feet[support]), length(a.tips[support], b.tips[support]));
      }
      return { maxArm, maxArmAt, maxLeg, maxLegAt, maxDrift, maxJointDelta, maxJointAt, swaps };
    });
    console.log(JSON.stringify(report));
    if (report.maxArm > 45 || report.maxLeg > 65 || report.maxDrift > .01 || report.maxJointDelta > 20 || report.swaps) process.exitCode = 1;
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
