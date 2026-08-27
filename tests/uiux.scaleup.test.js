const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const indexHtml = read('src/Views/index.html');
const styleHtml = read('src/Views/style.html');
const appJs = read('src/Views/app.js.html') + read('src/Views/app.init.js.html');

test('new UI baseline keeps navigation hooks and responsive shell', () => {
  for (const workspace of ['overview','input','search','verifikasi','sampel','status','zero-reporting-form','zero-reporting-dashboard','pie','settings','guide']) {
    assert.match(indexHtml, new RegExp(`data-sidebar-workspace="${workspace}"`));
  }
  assert.match(styleHtml, /\.pd3i-app\{/);
  assert.match(styleHtml, /\.pd3i-sidebar\{/);
  assert.match(styleHtml, /@media\(max-width:900px\)/);
  assert.match(styleHtml, /\.pd3i-sidebar-open \.pd3i-sidebar/);
});

test('new UI baseline keeps runtime state and action hooks', () => {
  for (const hook of ['pd3i-toast-stack','pd3i-sidebar-overlay','pd3i-mobile-nav-toggle','pd3i-nav-link','pd3i-btn','pd3i-search-result-action']) {
    assert.match(styleHtml, new RegExp(`\\.${hook}`));
  }
  assert.match(appJs, /openSidebarWorkspace\(/);
  assert.match(appJs, /updateSidebarActiveState\(/);
});

test('new UI baseline has no presentation reset-era markers', () => {
  assert.doesNotMatch(styleHtml, /phase [0-9]+|CANONICAL|Bootstrap|Tailwind|Tabler|legacy|obsolete|hotfix/i);
  assert.doesNotMatch(indexHtml, /data-legacy-section-id|reference-skin/);
});


test('remaining workflow pages keep polished card density and zero reporting grid', () => {
  assert.match(styleHtml, /\.pd3i-field-grid\{gap:16px 20px\}/);
  assert.match(styleHtml, /\.pd3i-submit-button\{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:44px;border-radius:10px;font-weight:800;line-height:1\.2\}/);
  assert.match(styleHtml, /\.pd3i-zero-reporting-form label\{display:block;margin-bottom:6px;color:#334155;font-size:\.78rem;font-weight:800\}/);
  assert.match(styleHtml, /\.pd3i-zero-reporting-grid,\.pd3i-case-grid\{display:grid;grid-template-columns:repeat\(6,minmax\(0,1fr\)\);gap:14px\}/);
  assert.match(styleHtml, /\.pd3i-zero-reporting-grid>div\{grid-column:span 2\}/);
  assert.match(styleHtml, /\.pd3i-case-span-3\{grid-column:span 3\}/);
  assert.match(styleHtml, /@media\(max-width:800px\)[\s\S]*\.pd3i-zero-reporting-grid,\.pd3i-case-grid\{grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
});


test('dashboard keeps Beranda-aligned dense card system and mobile containment', () => {
  assert.match(styleHtml, /#section-dashboard \.pd3i-dashboard-shell\{display:grid;gap:18px;padding:24px\}/);
  assert.match(styleHtml, /#section-dashboard \.pd3i-dashboard-case-kpi-compact\{grid-template-columns:repeat\(auto-fit,minmax\(150px,1fr\)\);gap:12px\}/);
  assert.match(styleHtml, /#section-dashboard \.pd3i-dashboard-metric-card::after\{content:'';position:absolute;right:-22px;bottom:-30px;width:86px;height:86px;border-radius:50%;background:currentColor;opacity:\.06\}/);
  assert.match(styleHtml, /#section-dashboard \.pd3i-dashboard-region-main strong\{white-space:normal;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical\}/);
  assert.match(styleHtml, /@media\(max-width:560px\)[\s\S]*#section-dashboard \.pd3i-dashboard-case-kpi-compact\{grid-template-columns:1fr\}/);
});


test('boot session spinner is centered near top of viewport', () => {
  assert.match(styleHtml, /#auth-boot-overlay\{position:fixed!important;inset:0!important;display:flex!important;align-items:flex-start!important;justify-content:center!important;width:100vw!important;min-height:100dvh!important;padding:2rem 1rem 1rem!important\}/);
  assert.match(styleHtml, /#auth-boot-overlay\.hidden\{display:none!important\}/);
  assert.match(styleHtml, /#auth-boot-overlay \.pd3i-login-card\{margin:0 auto!important;padding:1\.8rem 2rem;text-align:center\}/);
  assert.match(styleHtml, /#auth-boot-overlay \.pd3i-login-mark\{margin:\.5rem auto \.75rem\}/);
  assert.match(styleHtml, /#auth-boot-overlay \.pd3i-login-title,#auth-boot-overlay \.pd3i-login-subtitle\{text-align:center\}/);
});


test('shared spacing contract keeps cards and frames separated across pages', () => {
  assert.match(styleHtml, /\/\* Shared spacing contract: prevent cards\/frames from visually touching across pages\. \*\//);
  assert.match(styleHtml, /\.pd3i-workspace-section\{gap:8px\}/);
  assert.match(styleHtml, /\.pd3i-workspace-section\.mt-6\{margin-top:8px!important\}/);
  assert.match(styleHtml, /\.pd3i-shell-card\+\.pd3i-shell-card,\.pd3i-card\+\.pd3i-card,\.pd3i-form-card-section\+\.pd3i-form-card-section\{margin-top:8px\}/);
  assert.match(styleHtml, /#section-dashboard \.pd3i-dashboard-case-kpi-compact,#section-dashboard \.pd3i-dashboard-region-two-column,#section-dashboard \.pd3i-dashboard-age-two-column[\s\S]*\{gap:18px\}/);
  assert.match(styleHtml, /@media\(max-width:700px\)[\s\S]*\.pd3i-workspace-section[\s\S]*row-gap:8px/);
});
