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
