const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');

(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const page = await browser.newPage({ viewport: { width: 600, height: 800 }, deviceScaleFactor: 1 });
  try {
    await page.goto('http://127.0.0.1:4173/');
    await page.setContent(`<style>html,body{margin:0;width:600px;height:800px;background:#102433}main{position:relative;width:600px;height:800px;overflow:hidden;background:url('/assets/media/ascent-everest-illustration.webp') 50% 50%/cover no-repeat}svg{position:absolute;inset:0;width:600px;height:800px}</style><main><svg viewBox="0 650 600 800"><defs></defs><g id="world"></g></svg></main>`);
    await page.addScriptTag({ path: path.resolve('prototypes/ice-climber-rig.js') });
    await page.addScriptTag({ path: path.resolve('prototypes/photo-leg-rig.js') });
    const summitSrc = `data:image/png;base64,${fs.readFileSync(path.resolve('prototypes/ascent-summit-ledge-study.png')).toString('base64')}`;
    const finalSrc = `data:image/png;base64,${fs.readFileSync(path.resolve('prototypes/ascent-standing-pose-study.png')).toString('base64')}`;
    const plantSrc = `data:image/png;base64,${fs.readFileSync(path.resolve('prototypes/ascent-planting-pose-study.png')).toString('base64')}`;
    await page.evaluate(({ summitSrc, finalSrc, plantSrc }) => {
      window.rig = IceClimberRig.create(document.querySelector('svg'), document.querySelector('#world'), 10, { debug: false, photoTorso: true, summitSrc, finalSrc, plantSrc });
      document.querySelector('[data-rig-photo-torso] image').setAttribute('href', '/assets/media/ascent-climber-clean-frame-01.webp');
      window.photoLeg = PhotoLegRig.create(window.rig.body, '/assets/media');
    }, { summitSrc, finalSrc, plantSrc });
    await page.waitForTimeout(350);
    const cases = [0,.12,.25,.38,.5,.62,.75,.88,1,1.12,1.25,1.38,1.5,1.62,1.75,1.88,2,4,8,9.5,9.7,9.8,9.88,9.93,9.95,9.96,9.97,9.98,9.985,9.99,10];
    const images = [];
    for (const [index, progress] of cases.entries()) {
      const state = await page.evaluate(progress => {
        const state = window.rig.update(progress);
        window.photoLeg.update(state);
        document.querySelector('svg').setAttribute('viewBox', `0 ${state.origin.y - 480} 600 800`);
        return { step: state.step, moving: state.moving,
          feet: state.feet, tips: state.tips, knees: state.knees };
      }, progress);
      const filename = path.resolve('test-results', `photo-leg-prototype-${String(index).padStart(2, '0')}.png`);
      await page.screenshot({ path: filename });
      images.push({ filename, progress, state });
    }
    const contact = await browser.newPage({ viewport: { width: 1500, height: 1000 } });
    const cells = images.map(({ filename, progress, state }) => `<figure><img src="data:image/png;base64,${fs.readFileSync(filename).toString('base64')}"><figcaption>${progress.toFixed(2)} ${state.moving}</figcaption></figure>`).join('');
    await contact.setContent(`<style>body{margin:0;background:#10171e;color:white;font:14px sans-serif}main{display:grid;grid-template-columns:repeat(5,1fr)}figure{position:relative;margin:0;height:400px;overflow:hidden;border:1px solid #567;box-sizing:border-box}img{width:300px;height:400px;object-fit:cover}figcaption{position:absolute;bottom:4px;left:4px;background:#10171edd}</style><main>${cells}</main>`);
    await contact.screenshot({ path: 'test-results/photo-leg-prototype-contact.png', fullPage: true });
    console.log('test-results/photo-leg-prototype-contact.png');
    console.log(JSON.stringify(images.map(({ progress, state }) => ({ progress, step: state.step, moving: state.moving, feet: state.feet, tips: state.tips }))));
    await contact.close();
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
