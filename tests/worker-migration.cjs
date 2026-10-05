// Isolated local fixture: never modifies the generated production worker.
const { chromium } = require('playwright');
const http = require('node:http');
const fs = require('node:fs');
const assert = require('node:assert/strict');
let workerVersion = 'old';
const oldWorker = "self.addEventListener('install',()=>self.skipWaiting());self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));";
const migration = fs.readFileSync('sw.min.js', 'utf8');
const server = http.createServer((request, response) => {
  response.setHeader('Cache-Control', 'no-store');
  if (request.url === '/sw.min.js') {
    response.setHeader('Content-Type', 'application/javascript');
    response.end(workerVersion === 'old' ? oldWorker : migration);
  } else if (request.url === '/other-worker.js') {
    response.setHeader('Content-Type', 'application/javascript');
    response.end(oldWorker);
  } else if (request.url === '/site.js') {
    response.setHeader('Content-Type', 'application/javascript');
    response.end(fs.readFileSync('assets/js/site.js'));
  } else {
    response.setHeader('Content-Type', 'text/html');
    response.end('<!doctype html><html><head><meta name="theme-color" content="#09111f"></head><body data-baseurl=""><button class="menu-toggle" aria-expanded="false"></button><nav id="primary-nav"></nav><label><select id="theme-select"><option value="system">System</option></select></label><h1>Migration fixture</h1></body></html>');
  }
});
(async () => {
  await new Promise(resolve => server.listen(4174, '127.0.0.1', resolve));
  const browser = await chromium.launch({ headless: true, ...(process.env.CHROME_CHANNEL ? { channel: process.env.CHROME_CHANNEL } : {}) });
  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto('http://127.0.0.1:4174/');
    await page.evaluate(async () => { await navigator.serviceWorker.register('/sw.min.js'); await navigator.serviceWorker.ready; });
    workerVersion = 'new';
    await page.evaluate(async () => { const reg = await navigator.serviceWorker.getRegistration('/'); await reg.update(); });
    await page.waitForFunction(async () => !(await navigator.serviceWorker.getRegistration('/')));
    // Verify the page enhancement unregisters only the known legacy registration.
    workerVersion = 'old';
    await page.evaluate(async () => { await navigator.serviceWorker.register('/sw.min.js'); await navigator.serviceWorker.register('/other-worker.js', { scope: '/other/' }); });
    await page.addScriptTag({ url: '/site.js' });
    await page.waitForFunction(async () => {
      const regs = await navigator.serviceWorker.getRegistrations();
      return regs.length === 1 && regs[0].scope.endsWith('/other/');
    });
    console.log('PASS: replacement worker retires legacy registration; site JS preserves unrelated worker scope.');
  } finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
