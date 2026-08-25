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

test('search results collapse table grid before mobile card viewport', () => {
  assert.match(styleHtml, /\.pd3i-search-table-head,\.pd3i-search-result-card\{[^}]*grid-template-columns:minmax\(210px,1\.35fr\)[^}]*minmax\(168px,\.8fr\)[^}]*min-width:0/);
  assert.match(styleHtml, /@media\(max-width:800px\)\{[^}]*\.pd3i-search-results-head,\.pd3i-search-result-card\{grid-template-columns:1fr;display:grid/);
  assert.match(styleHtml, /@media\(max-width:800px\)\{[^\n]*\.pd3i-search-table-head\{display:none\}/);
});

test('new UI baseline has no presentation reset-era markers', () => {
  assert.doesNotMatch(styleHtml, /phase [0-9]+|CANONICAL|Bootstrap|Tailwind|Tabler|legacy|obsolete|hotfix/i);
  assert.doesNotMatch(indexHtml, /data-legacy-section-id|reference-skin/);
});
