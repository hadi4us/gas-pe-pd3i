const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');

const url = process.env.SIMPEL_DEV_URL || 'https://script.google.com/macros/s/AKfycbyvwxhm2ycZ-1R45QeTKSM4l5JQ9OIX7MqN9uBusGKhUM8McveAM5ydHXc5WaACD6Od/exec';
const outDir = path.resolve(process.env.VISUAL_OUT_DIR || 'artifacts/visual-smoke');
fs.mkdirSync(outDir, { recursive: true });

(async () => {
  const userDataDir = path.resolve(process.env.PLAYWRIGHT_USER_DATA_DIR || '.playwright/dev-profile');
  fs.mkdirSync(userDataDir, { recursive: true });
  const context = await chromium.launchPersistentContext(userDataDir, { headless: true });
  const results = [];
  for (const view of [
    { name: 'desktop', width: 1440, height: 900, isMobile: false },
    { name: 'mobile', width: 390, height: 844, isMobile: true },
  ]) {
    const page = await context.newPage({ viewport: { width: view.width, height: view.height }, isMobile: view.isMobile });
    const consoleErrors = [];
    const failedRequests = [];
    page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
    page.on('requestfailed', req => failedRequests.push({ url: req.url(), error: req.failure()?.errorText || 'unknown' }));
    const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.screenshot({ path: path.join(outDir, `${view.name}.png`), fullPage: true });
    fs.writeFileSync(path.join(outDir, `${view.name}.html`), await page.content());
    const snapshot = await page.evaluate(() => ({
      title: document.title,
      sections: [...document.querySelectorAll('[data-workspace]')].map(el => ({ id: el.id, workspace: el.dataset.workspace, hidden: el.classList.contains('hidden') })),
      horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      bodyText: document.body.innerText.slice(0, 500),
    }));
    results.push({ view: view.name, status: response?.status(), finalUrl: page.url(), ...snapshot, consoleErrors, failedRequests });
    await page.close();
  }
  await context.close();
  const report = { url, generatedAt: new Date().toISOString(), results };
  fs.writeFileSync(path.join(outDir, 'report.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  if (results.some(r => !r.status || r.status >= 400)) process.exitCode = 1;
})();
