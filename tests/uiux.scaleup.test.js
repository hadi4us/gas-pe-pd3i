const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const indexHtml = read('src/Views/index.html');
const styleHtml = read('src/Views/style.html');
const appJs = read('src/Views/app.js.html') + read('src/Views/app.init.js.html');
const searchInitJs = read('src/Views/app.init.js.html');

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

test('search UI keeps native responsive grid and list-card results', () => {
  assert.match(styleHtml, /#section-search-shell \.pd3i-search-filter-grid\{[^}]*display:grid[^}]*grid-template-columns:repeat\(auto-fit,minmax\(min\(100%,220px\),1fr\)\)/);
  assert.match(styleHtml, /\.pd3i-search-results-wrap\{display:grid;gap:10px;padding:12px;background:#f8fafc\}/);
  assert.match(styleHtml, /\.pd3i-search-result-card\{[^}]*grid-template-columns:minmax\(0,1\.25fr\) minmax\(230px,\.75fr\)[^}]*grid-template-areas:"case actions" "location actions" "status sample"[^}]*padding:16px[^}]*border-radius:14px/);
  assert.match(styleHtml, /\.pd3i-search-result-main\{display:grid;gap:4px;min-width:0\}/);
  assert.match(styleHtml, /\.pd3i-search-result-location\{grid-area:location;display:flex;flex-wrap:wrap;align-items:center;gap:6px 8px;min-width:0;padding-top:8px;border-top:1px solid #f1f5f9/);
  assert.match(styleHtml, /\.pd3i-search-result-location small\{[^}]*white-space:normal[^}]*overflow-wrap:anywhere/);
  assert.match(styleHtml, /@media\(max-width:900px\)\{[^}]*\.pd3i-search-result-card\{grid-template-columns:minmax\(0,1fr\);grid-template-areas:"case" "location" "status" "sample" "actions"[^}]*padding:14px/);
  assert.match(styleHtml, /@media\(max-width:900px\)[\s\S]*\.pd3i-search-result-location small\{[^}]*-webkit-line-clamp:3/);
  assert.match(styleHtml, /@media\(max-width:800px\)\{[^}]*#section-search-shell \.pd3i-search-filter-grid\{grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(styleHtml, /@media\(max-width:560px\)\{[^\n]*#section-search-shell \.pd3i-search-filter-grid\{grid-template-columns:minmax\(0,1fr\)/);
  assert.doesNotMatch(searchInitJs, /data-component="DataTable" data-table-model="sirfk"/);
  assert.match(searchInitJs, /data-component="DataList" data-mobile-mode="card"/);
});

test('new UI baseline has no presentation reset-era markers', () => {
  assert.doesNotMatch(styleHtml, /phase [0-9]+|CANONICAL|Bootstrap|Tailwind|Tabler|legacy|obsolete|hotfix/i);
  assert.doesNotMatch(indexHtml, /data-legacy-section-id|reference-skin/);
});



test('search touched decorative icons are hidden from accessibility tree', () => {
  assert.match(read('src/Views/workspace_search.html'), /<i class="fas fa-filter" aria-hidden="true"><\/i> Terapkan Filter/);
  assert.match(read('src/Views/workspace_search.html'), /<i class="fas fa-filter-circle-xmark" aria-hidden="true"><\/i> Reset Filter/);
  assert.match(styleHtml, /#section-search-shell #btn-search-reset\{min-height:40px;padding:9px 13px;border:1px solid #cbd5e1;border-radius:10px;background:#fff;color:#334155;box-shadow:none\}/);
  assert.match(appJs, /<i class="fas fa-chevron-left" aria-hidden="true"><\/i> Sebelumnya/);
  assert.match(appJs, /Berikutnya <i class="fas fa-chevron-right" aria-hidden="true"><\/i>/);
});
