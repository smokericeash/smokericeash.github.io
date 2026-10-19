const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const approvedRef = process.env.APPEARANCE_BASELINE || '214bce2';

(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  try {
    const page = await browser.newPage({ viewport: { width: 600, height: 800 } });
    await page.goto('http://127.0.0.1:4173/');
    const setup = async baseline => {
      await page.setContent('<style>html,body{margin:0;background:#53616a}svg{display:block;width:600px;height:800px}</style><svg viewBox="0 0 600 800"><defs></defs><g id="world"></g></svg>');
      for (const file of ['ice-climber-rig.js', 'photo-climber-rig.js']) {
        const content = baseline ? execFileSync('git', ['show', `${approvedRef}:assets/js/${file}`], { encoding: 'utf8' })
          : fs.readFileSync(path.resolve('assets/js', file), 'utf8');
        await page.addScriptTag({ content });
      }
      await page.evaluate(() => {
        window.rig = IceClimberRig.create(document.querySelector('svg'), document.querySelector('#world'), 10, {
          photoTorso: true, summitSrc: '/assets/media/ascent-summit-ledge.webp',
          plantSrc: '/assets/media/ascent-planting-pose.webp', finalSrc: '/assets/media/ascent-standing-pose.webp' });
        window.skin = PhotoLegRig.create(rig.body, '/assets/media');
      });
      await page.evaluate(async () => {
        const sources = new Set([...document.querySelectorAll('svg image')].map(image => image.getAttribute('href')));
        await Promise.all([...sources].map(async source => {
          const image = new Image(); image.src = source; await image.decode();
        }));
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      });
    };
    const states = () => page.evaluate(() => Array.from({ length: 1001 }, (_, index) => {
      const state = rig.update(index / 100);
      return JSON.stringify(state);
    }));
    await setup(true);
    const approvedMotion = await states();
    const isolateBody = () => page.evaluate(() => {
      document.documentElement.style.background = document.body.style.background = 'transparent';
      for (const node of document.querySelector('#world').children)
        if (!node.matches('[data-rig-body]')) node.style.display = 'none';
    });
    const pose = progress => page.evaluate(progress => {
      const state = rig.update(progress); skin.update(state);
      const svg = document.querySelector('svg');
      svg.setAttribute('viewBox', `250 ${state.origin.y - 150} 230 ${230 * 4 / 3}`);
      const project = p => { const v = svg.createSVGPoint(); v.x = p.x; v.y = p.y;
        const s = v.matrixTransform(svg.getScreenCTM()); return { x: Math.round(s.x), y: Math.round(s.y) }; };
      return { torso: project({ x: state.origin.x, y: state.origin.y - 30 }),
        feet: [project(state.feet.left), project(state.feet.right)],
        knees: [project(state.knees.left), project(state.knees.right)], scale: svg.getScreenCTM().a };
    }, progress);
    await isolateBody();
    const baselineShots = [];
    for (let sample = 0; sample < 32; sample++) {
      await pose(sample / 16);
      baselineShots.push((await page.screenshot({ omitBackground: true })).toString('base64'));
    }
    await setup(false);
    assert.deepEqual(await states(), approvedMotion, 'All 1,001 solved poses must remain identical to the approved motion');
    for (const [index, progress] of [0, .25, .5, .75, 1.25, 1.5, 1.75, 9.92, 9.954, 9.956, 9.98, 9.986, 10].entries()) {
      await page.evaluate(progress => {
        const state = rig.update(progress); skin.update(state);
        document.querySelector('svg').setAttribute('viewBox', `250 ${state.origin.y - 150} 230 ${230 * 4 / 3}`);
      }, progress);
      await page.waitForTimeout(80);
      await page.screenshot({ path: `test-results/appearance-${String(index).padStart(2, '0')}.png` });
    }
    await isolateBody();
    let connectedPoses = 0;
    let worstKneeCoverage = 1, baselineKneeCoverage = 1, changedOutsideKnees = 0;
    for (let sample = 0; sample < 32; sample++) {
      const targets = await pose(sample / 16);
      const shot = (await page.screenshot({ omitBackground: true })).toString('base64');
      if (sample === 0) {
        fs.writeFileSync('test-results/knee-seam-before.png', Buffer.from(baselineShots[sample], 'base64'));
        fs.writeFileSync('test-results/knee-seam-after.png', Buffer.from(shot, 'base64'));
      }
      const seam = await page.evaluate(async ({ shot, baseline, targets }) => {
        const decode = async source => {
          const image = new Image(); image.src = `data:image/png;base64,${source}`; await image.decode();
          const canvas = document.createElement('canvas'); canvas.width = image.width; canvas.height = image.height;
          const ctx = canvas.getContext('2d'); ctx.drawImage(image, 0, 0);
          return ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        };
        const current = await decode(shot), previous = await decode(baseline);
        let outside = 0;
        for (let y = 0; y < 800; y++) for (let x = 0; x < 600; x++) {
          const i = (y * 600 + x) * 4;
          if ([0, 1, 2, 3].some(c => Math.abs(current[i + c] - previous[i + c]) > 2) &&
              targets.knees.every(p => Math.hypot(x - p.x, y - p.y) > 20 * targets.scale)) outside++;
        }
        const coverage = pixels => Math.min(...targets.knees.map(p => {
          const radius = 11 * targets.scale;
          let opaque = 0, total = 0;
          for (let dy = -Math.ceil(radius); dy <= radius; dy++) for (let dx = -Math.ceil(radius); dx <= radius; dx++)
            if (Math.hypot(dx, dy) <= radius) { total++; if (pixels[((p.y + dy) * 600 + p.x + dx) * 4 + 3] > 80) opaque++; }
          return opaque / total;
        }));
        return { outside, current: coverage(current), previous: coverage(previous) };
      }, { shot, baseline: baselineShots[sample], targets });
      changedOutsideKnees += seam.outside;
      worstKneeCoverage = Math.min(worstKneeCoverage, seam.current);
      baselineKneeCoverage = Math.min(baselineKneeCoverage, seam.previous);
      const connected = await page.evaluate(async ({ shot, targets }) => {
        const image = new Image(); image.src = `data:image/png;base64,${shot}`; await image.decode();
        const canvas = document.createElement('canvas'); canvas.width = image.width; canvas.height = image.height;
        const ctx = canvas.getContext('2d'); ctx.drawImage(image, 0, 0);
        const rgba = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        const w = canvas.width, h = canvas.height, visited = new Uint8Array(w * h), queue = [];
        const opaque = (x, y) => x >= 0 && y >= 0 && x < w && y < h && rgba[(y * w + x) * 4 + 3] > 80;
        for (let dy = -5; dy <= 5 && !queue.length; dy++) for (let dx = -5; dx <= 5; dx++)
          if (opaque(targets.torso.x + dx, targets.torso.y + dy)) { queue.push((targets.torso.y + dy) * w + targets.torso.x + dx); break; }
        for (let q = 0; q < queue.length; q++) {
          const i = queue[q]; if (visited[i]) continue; visited[i] = 1;
          const x = i % w, y = Math.floor(i / w);
          for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]])
            if (opaque(x + dx, y + dy) && !visited[(y + dy) * w + x + dx]) queue.push((y + dy) * w + x + dx);
        }
        return targets.feet.every(foot => {
          for (let dy = -10; dy <= 10; dy++) for (let dx = -10; dx <= 10; dx++)
            if (visited[(foot.y + dy) * w + foot.x + dx]) return true;
          return false;
        });
      }, { shot, targets });
      assert.ok(connected, `Both boots must remain visibly connected to the torso at progress ${sample / 16}`);
      connectedPoses++;
    }
    // Compare just the cloth across the opaque planting/standing handover in
    // fixed world coordinates, with the same background and camera.
    await page.evaluate(() => {
      document.documentElement.style.background = document.body.style.background = '#53616a';
      document.querySelector('svg').setAttribute('viewBox', '417 516 45 60');
      for (const node of document.querySelector('#world').children)
        node.style.display = node.matches('[data-rig-planting-portrait], [data-rig-flag]') ? '' : 'none';
    });
    const shots = [];
    for (const progress of [9.97, 10]) {
      await page.evaluate(value => rig.update(value), progress);
      await page.waitForTimeout(100);
      const shot = await page.screenshot();
      shots.push(shot.toString('base64'));
      fs.writeFileSync(`test-results/flag-match-${progress}.png`, shot);
    }
    const flagDifference = await page.evaluate(async shots => {
      const pixels = [];
      for (const shot of shots) {
        const image = new Image(); image.src = `data:image/png;base64,${shot}`; await image.decode();
        const canvas = document.createElement('canvas'); canvas.width = image.width; canvas.height = image.height;
        const ctx = canvas.getContext('2d'); ctx.drawImage(image, 0, 0);
        pixels.push(ctx.getImageData(0, 0, canvas.width, canvas.height).data);
      }
      let different = 0;
      // The hand releases the pole below the cloth; compare the flag itself.
      const clothPixelBytes = 600 * 540 * 4;
      for (let i = 0; i < clothPixelBytes; i += 4)
        if (Math.max(...[0, 1, 2].map(channel => Math.abs(pixels[0][i + channel] - pixels[1][i + channel]))) > 10) different++;
      return different / (clothPixelBytes / 4);
    }, shots);
    console.log(JSON.stringify({ approvedRef, approvedPosesUnchanged: 1001, connectedPoses,
      baselineKneeCoverage, worstKneeCoverage, changedOutsideKnees, flagPixelDifference: flagDifference }));
    assert.ok(worstKneeCoverage > .99, 'Knee fabric must cover the seam throughout the bend cycle');
    assert.equal(changedOutsideKnees, 0, 'The appearance correction must remain local to the knees');
    assert.ok(flagDifference < .02, 'The same dark-blue cloth must remain aligned across the final handover');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
