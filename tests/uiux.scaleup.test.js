const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const indexHtml = fs.readFileSync(path.join(root, 'src', 'Views', 'index.html'), 'utf8');
const appJsRaw = fs.readFileSync(path.join(root, 'src', 'Views', 'app.js.html'), 'utf8');
const appInitJsRaw = fs.readFileSync(path.join(root, 'src', 'Views', 'app.init.js.html'), 'utf8');
const appJs = appJsRaw + '\n' + appInitJsRaw;
const utilsJs = fs.readFileSync(path.join(root, 'src', 'Views', 'utils.js.html'), 'utf8');
const styleHtml = fs.readFileSync(path.join(root, 'src', 'Views', 'style.html'), 'utf8');
const authLoginHtml = fs.readFileSync(path.join(root, 'src', 'Auth', 'login.html'), 'utf8');
const authJsHtml = fs.readFileSync(path.join(root, 'src', 'Auth', 'auth.js.html'), 'utf8');
const workspacePieHtml = fs.readFileSync(path.join(root, 'src', 'Views', 'workspace_pie.html'), 'utf8');
const workspaceDashboardHtml = fs.readFileSync(path.join(root, 'src', 'Views', 'workspace_dashboard.html'), 'utf8');
const workspaceOverviewHtml = fs.readFileSync(path.join(root, 'src', 'Views', 'workspace_overview.html'), 'utf8');
const workspaceGuideHtml = fs.readFileSync(path.join(root, 'src', 'Views', 'workspace_guide.html'), 'utf8');
const workspaceVerifikasiHtml = fs.readFileSync(path.join(root, 'src', 'Views', 'workspace_verifikasi_form.html'), 'utf8');
const workspaceInputHtml = fs.readFileSync(path.join(root, 'src', 'Views', 'workspace_input_form.html'), 'utf8');
const workspaceSampelHtml = fs.readFileSync(path.join(root, 'src', 'Views', 'workspace_sampel_form.html'), 'utf8');
const workspaceStatusHtml = fs.readFileSync(path.join(root, 'src', 'Views', 'workspace_status_form.html'), 'utf8');
const searchHtml = fs.readFileSync(path.join(root, 'src', 'Views', 'workspace_search.html'), 'utf8');
const appDashboardJs = fs.readFileSync(path.join(root, 'src', 'Views', 'app.dashboard.js.html'), 'utf8');

test('scale-up UI/UX quick wins standardize PD3I sidebar labels without changing routes', () => {
  assert.match(indexHtml, /data-sidebar-workspace="search"[\s\S]*?<span>Daftar Kasus<\/span>/);
  assert.match(indexHtml, /data-sidebar-workspace="sampel"[\s\S]*?<span>Pemeriksaan Laboratorium<\/span>/);
  assert.match(indexHtml, /data-sidebar-workspace="status"[\s\S]*?<span>Status dan Klasifikasi<\/span>/);
  assert.doesNotMatch(indexHtml, /<span>List Kasus<\/span>/);
  assert.doesNotMatch(indexHtml, /<span>Hasil Pemeriksaan<\/span>/);
  assert.doesNotMatch(indexHtml, /<span>Status Pasien\/Kasus<\/span>/);
});

test('scale-up UI/UX quick wins keep PD3I sidebar grouped without dropdowns', () => {
  assert.match(indexHtml, /data-nav-group-label="pd3i-cases"[\s\S]*?<span>Surveilans PD3I<\/span>/);
  assert.match(indexHtml, /id="pd3i-cases-nav-children"/);
  assert.match(indexHtml, /data-sidebar-workspace="dashboard"[\s\S]*?<span>Dashboard PD3I<\/span>/);
  assert.match(indexHtml, /class="pd3i-nav-link pd3i-nav-child"/);
  assert.doesNotMatch(indexHtml, /Navigasi Cepat/);
  assert.doesNotMatch(indexHtml, /id="pd3i-cases-nav-toggle"/);
  assert.doesNotMatch(indexHtml, /id="pd3i-reporting-nav-toggle"/);
  assert.doesNotMatch(indexHtml, /id="pd3i-pie-nav-toggle"/);
  assert.doesNotMatch(indexHtml, /id="pd3i-tools-nav-toggle"/);
});

test('scale-up UI/UX quick wins harden focus and active state styling', () => {
  assert.match(styleHtml, /\.pd3i-nav-link:focus-visible/);
  assert.match(styleHtml, /outline: 3px solid var\(--color-focus-ring-dark\)/);
  assert.match(styleHtml, /\.pd3i-nav-children\.is-collapsed/);
  assert.match(styleHtml, /\.pd3i-nav-link-zero-reporting \{\s*background: transparent;/);
  assert.match(styleHtml, /\.pd3i-nav-link\.is-active \{\s*box-shadow: inset 3px 0 0 #60a5fa;/);
});

test('scale-up UI/UX foundation exposes design tokens and breadcrumb page context', () => {
  ['--color-primary-700: #0f5f5a', '--color-page: #f5f7f8', '--color-surface: #ffffff', '--color-border: #dce3e7', '--color-text: #172126', '--space-4: 16px', '--radius-md: 10px', '--header-height: 64px', '--sidebar-width: 252px'].forEach((token) => {
    assert.match(styleHtml, new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  });
  assert.match(indexHtml, /id="pd3i-breadcrumb"/);
  assert.match(indexHtml, /aria-label="Breadcrumb"/);
  assert.match(indexHtml, /id="pd3i-breadcrumb-current"/);
  assert.match(styleHtml, /\.pd3i-breadcrumb \{/);
  assert.match(appJs, /setSummaryText\('pd3i-breadcrumb-current', getWorkspaceDisplayLabel\(workspace\)\)/);
});

test('scale-up UI/UX shell header uses standardized Indonesian labels', () => {
  assert.match(appJs, /search: 'Daftar Kasus'/);
  assert.match(appJs, /sampel: 'Pemeriksaan Laboratorium'/);
  assert.match(appJs, /status: 'Status dan Klasifikasi'/);
  assert.match(appJs, /search: \['DAFTAR KASUS'/);
  assert.match(appJs, /sampel: \['LABORATORIUM', 'Pemeriksaan Laboratorium'/);
  assert.match(appJs, /status: \['FOLLOW UP', 'Status dan Klasifikasi'/);
});

test('scale-up UI/UX state component standardizes loading empty error success states', () => {
  const utilsJs = fs.readFileSync(path.join(root, 'src', 'Views', 'utils.js.html'), 'utf8');
  assert.match(utilsJs, /function renderPd3iUiState\(options\)/);
  assert.match(utilsJs, /function setPd3iUiState\(target, options\)/);
  assert.match(utilsJs, /role=\"status\" aria-live=\"polite\"/);
  ['is-loading', 'is-empty', 'is-error', 'is-success'].forEach((klass) => {
    assert.match(utilsJs + styleHtml, new RegExp(klass));
  });
  assert.match(styleHtml, /\.pd3i-ui-state \{/);
  assert.match(styleHtml, /\.pd3i-state-action:focus-visible/);
});

test('overview uses standardized loading, empty session, and timeout states', () => {
  assert.match(appJs, /renderPd3iSkeleton\(\{ title: 'Memuat KPI operasional…'/);
  assert.match(appJs, /renderPd3iSkeleton\(\{ title: 'Memuat prioritas kerja…'/);
  assert.match(appJs, /renderPd3iUiState\(\{ type: 'empty', title: 'KPI beranda belum tersedia'/);
  assert.match(appJs, /renderPd3iUiState\(\{ type: 'error', title: 'KPI beranda terlalu lama dimuat'/);
});

test('mobile drawer has accessible controls, overlay semantics, and focus hooks', () => {
  assert.match(indexHtml, /id="pd3i-sidebar-overlay"[^>]*aria-hidden="true"/);
  assert.match(indexHtml, /id="pd3i-sidebar"[^>]*aria-label="Navigasi aplikasi"[^>]*tabindex="-1"/);
  assert.match(indexHtml, /id="btn-sidebar-toggle"[^>]*aria-controls="pd3i-sidebar"[^>]*aria-expanded="false"/);
  assert.match(appJs, /const sidebar = document\.getElementById\("pd3i-sidebar"\)/);
  assert.match(appJs, /btnSidebarToggle\.setAttribute\('aria-expanded', 'true'\)/);
  assert.match(appJs, /btnSidebarToggle\.setAttribute\('aria-expanded', 'false'\)/);
  assert.match(appJs, /sidebar\.focus\(\)/);
  assert.match(appJs, /btnSidebarToggle\.focus\(\)/);
  assert.match(appJs, /e\.key === 'Escape'/);
  assert.match(appJs, /closeSidebarDrawer\(\{ restoreFocus: false \}\)/);
});

test('mobile drawer styling follows scale-up touch and motion requirements', () => {
  assert.match(styleHtml, /grid-template-columns: var\(--sidebar-width\) minmax\(0, 1fr\)/);
  assert.match(styleHtml, /\.pd3i-sidebar-overlay[\s\S]*cursor: pointer;/);
  assert.match(styleHtml, /min-width: 44px;[\s\S]*width: 44px;[\s\S]*height: 44px;/);
  assert.match(styleHtml, /\.pd3i-sidebar:focus-visible[\s\S]*outline: 3px solid var\(--color-focus-ring-dark\)/);
  assert.match(styleHtml, /@media \(prefers-reduced-motion: reduce\)/);
});

test('reusable table and filter foundation is available for scale-up line lists', () => {
  const searchHtml = fs.readFileSync(path.join(root, 'src', 'Views', 'workspace_search.html'), 'utf8');
  assert.match(searchHtml, /class="pd3i-search-toolbar pd3i-filter-toolbar" data-component="FilterToolbar"/);
  ['.pd3i-filter-toolbar', '.pd3i-data-list', '.pd3i-data-table-wrap', '.pd3i-data-table', '.pd3i-mobile-list-card'].forEach((selector) => {
    assert.match(styleHtml, new RegExp(selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  });
  assert.match(styleHtml, /\.pd3i-data-table th[\s\S]*position: sticky;/);
  assert.match(styleHtml, /@media \(max-width: 640px\)[\s\S]*\.pd3i-data-list\[data-mobile-mode="card"\]/);
});

test('PD3I case search results use reusable data-list and mobile-card hooks', () => {
  assert.match(appJs, /pd3i-search-results-wrap pd3i-data-list/);
  assert.match(appJs, /data-component="DataTable"/);
  assert.match(appJs, /data-mobile-mode="card"/);
  assert.match(appJs, /pd3i-search-result-card pd3i-mobile-list-card/);
  assert.match(appJs, /data-row-action="open-case"/);
  assert.match(appJs, /renderPd3iUiState\(\{ type: 'error', title: 'List kasus gagal dirender'/);
});

test('confirm dialog replaces browser confirm for destructive case delete', () => {
  const utilsJs = fs.readFileSync(path.join(root, 'src', 'Views', 'utils.js.html'), 'utf8');
  assert.match(utilsJs, /function pd3iConfirmDialog\(options\)/);
  assert.match(utilsJs, /role=\"dialog\" aria-modal=\"true\"/);
  assert.match(utilsJs, /data-pd3i-confirm=\"ok\"/);
  assert.match(styleHtml, /\.pd3i-confirm-backdrop/);
  assert.match(styleHtml, /\.pd3i-confirm-btn\.is-danger/);
  assert.match(appJs, /async function deleteCaseRecordFromList/);
  assert.match(appJs, /await pd3iConfirmDialog\(\{/);
  assert.match(appJs, /title: 'Hapus data kasus ini\?'/);
  assert.doesNotMatch(appJs, /window\.confirm\('Hapus data kasus ini\?/);
});

test('queue tables and SARING-PIE entity lists use reusable table/list hooks', () => {
  const pieHtml = fs.readFileSync(path.join(root, 'src', 'Views', 'workspace_pie.html'), 'utf8');
  assert.match(appJs, /pd3i-queue-table-wrap pd3i-component-table pd3i-data-table-wrap/);
  assert.match(appJs, /pd3i-queue-table pd3i-data-table/);
  ['pie-specimen-list', 'pie-lab-list', 'pie-cluster-list', 'pie-onehealth-list'].forEach((id) => {
    assert.match(pieHtml, new RegExp(`id="${id}"[^>]*pd3i-data-list[^>]*data-component="DataTable"[^>]*data-mobile-mode="card"`));
  });
  assert.match(pieHtml, /id="pie-case-list"[^>]*pd3i-data-table-wrap[^>]*data-component="DataTable"[^>]*data-mobile-mode="scroll"/);
  assert.match(pieHtml, /table table-sm pd3i-data-table/);
});

test('admin retry and repair actions use standard confirm dialog instead of browser confirm', () => {
  ['Retry sinkronisasi pengampu?', 'Retry notifikasi kasus baru?', 'Retry Telegram kasus baru?', 'Retry notifikasi revisi?', 'Retry Telegram revisi?', 'Jalankan repair PERT Raw?'].forEach((title) => {
    assert.match(appJs, new RegExp(title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  });
  assert.match(appJs, /withSuccessHandler\(async function\(previewRes\)/);
  assert.match(appJs, /btnRetrySync\.addEventListener\("click", async function\(\) \{/);
  assert.match(appJs, /btnRetryRevisionTelegram\.addEventListener\("click", async function\(\) \{/);
  assert.doesNotMatch(appJs, /confirm\("Jalankan retry/);
  assert.doesNotMatch(appJs, /if \(!confirm\(confirmMsg\)\)/);
});

test('banner and toast helper aliases are available for microcopy migration', () => {
  const utilsJs = fs.readFileSync(path.join(root, 'src', 'Views', 'utils.js.html'), 'utf8');
  assert.match(utilsJs, /function showPd3iBanner\(message, options\)/);
  assert.match(utilsJs, /function showPd3iToast\(message, options\)/);
  assert.match(utilsJs, /window\.showPd3iBanner = showPd3iBanner/);
  assert.match(utilsJs, /window\.showPd3iToast = showPd3iToast/);
});

test('Zero Reporting workspace uses banner and standard confirm helpers instead of browser alerts', () => {
  const sarsHtml = fs.readFileSync(path.join(root, 'src', 'Views', 'workspace_sars.html'), 'utf8');
  assert.match(sarsHtml, /id="sars-inline-banner"[^>]*role="status"[^>]*aria-live="polite"/);
  assert.match(sarsHtml, /function showSarsBanner\(message, options\)/);
  assert.match(sarsHtml, /async function confirmSarsAction\(options\)/);
  assert.match(sarsHtml, /async function removeRow\(btn\)/);
  assert.match(sarsHtml, /onsubmit = async function\(e\)/);
  assert.match(sarsHtml, /await confirmSarsAction\(\{ title: 'Hapus baris kasus\?'/);
  assert.match(sarsHtml, /await confirmSarsAction\(\{ title: 'Kirim laporan Zero Reporting\?'/);
  assert.match(sarsHtml, /showSarsBanner\('Laporan Zero Reporting berhasil disimpan dan dikirim\.', \{ type: 'success' \}\)/);
  const withoutFallback = sarsHtml.replace(/return Promise\.resolve\(window\.confirm[\s\S]*?\);/, '');
  assert.doesNotMatch(withoutFallback, /\balert\(/);
  assert.doesNotMatch(withoutFallback, /\bconfirm\(/);
});

test('real toast stack is available for non-blocking success/error microcopy', () => {
  const utilsJs = fs.readFileSync(path.join(root, 'src', 'Views', 'utils.js.html'), 'utf8');
  assert.match(indexHtml, /id="pd3i-toast-stack"[^>]*aria-live="polite"[^>]*aria-atomic="false"/);
  assert.match(utilsJs, /function showPd3iToast\(message, options\)/);
  assert.match(utilsJs, /document\.createElement\('div'\)/);
  assert.match(utilsJs, /className = 'pd3i-toast is-'/);
  assert.match(utilsJs, /pd3i-toast-close/);
  assert.match(utilsJs, /setTimeout\(close, ttl\)/);
  ['.pd3i-toast-stack', '.pd3i-toast', '.pd3i-toast-icon', '.pd3i-toast-close', '@keyframes pd3iToastIn'].forEach((needle) => {
    assert.match(styleHtml, new RegExp(needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  });
});

test('selected success microcopy uses toast instead of top banner', () => {
  assert.match(appJs, /showPd3iToast\("Draft sebelumnya berhasil dipulihkan\.", \{ type: "success" \}\)/);
  assert.match(appJs, /showPd3iToast\('Data kasus sudah ditandai terhapus\.', \{ type: 'success' \}\)/);
  assert.match(appJs, /showPd3iToast\('Form input baru sudah direset\.', \{ type: 'success' \}\)/);
  assert.match(appJs, /showPd3iToast\(`Retry sync selesai\./);
  assert.doesNotMatch(appJs, /showTopAlert\("Draft sebelumnya berhasil dipulihkan\.", true\)/);
  assert.doesNotMatch(appJs, /showTopAlert\('Data kasus sudah ditandai terhapus\.', true\)/);
});

test('Zero Reporting dashboard detail table uses reusable filter/table/mobile hooks', () => {
  const sarsHtml = fs.readFileSync(path.join(root, 'src', 'Views', 'workspace_sars.html'), 'utf8');
  assert.match(sarsHtml, /class="tableBar pd3i-filter-toolbar" data-component="FilterToolbar"/);
  assert.match(sarsHtml, /id="table" data-component="DataTable" data-mobile-mode="scroll"/);
  assert.match(sarsHtml, /window\.renderPd3iUiState === 'function'[\s\S]*title: 'Tidak ada data detail'/);
  assert.match(sarsHtml, /let html = `<table class="pd3i-data-table"><thead><tr>`/);
  assert.match(sarsHtml, /<tr class="pd3i-mobile-list-card" data-row-action="sars-detail">/);
});

test('Zero Reporting success microcopy routes to toast when available', () => {
  const sarsHtml = fs.readFileSync(path.join(root, 'src', 'Views', 'workspace_sars.html'), 'utf8');
  assert.match(sarsHtml, /cfg\.type === 'success' && typeof window\.showPd3iToast === 'function'/);
  assert.match(sarsHtml, /window\.showPd3iToast\(message, cfg\)/);
  assert.match(sarsHtml, /showSarsBanner\('Laporan Zero Reporting berhasil disimpan dan dikirim\.', \{ type: 'success' \}\)/);
});

test('reusable action button pattern covers primary secondary danger and disabled states', () => {
  ['.pd3i-btn', '.pd3i-action-btn', '.pd3i-btn.is-primary', '.pd3i-btn.is-secondary', '.pd3i-btn.is-danger', '.pd3i-row-actions'].forEach((selector) => {
    assert.match(styleHtml, new RegExp(selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  });
  assert.match(styleHtml, /min-height: 40px;/);
  assert.match(styleHtml, /\.pd3i-btn:focus-visible/);
  assert.match(styleHtml, /\.pd3i-btn:disabled/);
});

test('PD3I search row actions and Zero Reporting form buttons use reusable action classes', () => {
  const sarsHtml = fs.readFileSync(path.join(root, 'src', 'Views', 'workspace_sars.html'), 'utf8');
  assert.match(appJs, /pd3i-search-result-action is-edit pd3i-action-btn is-secondary/);
  assert.match(appJs, /pd3i-search-result-action is-danger pd3i-action-btn/);
  assert.match(sarsHtml, /class="pd3i-zero-reporting-btn-add pd3i-btn is-secondary"/);
  assert.match(sarsHtml, /class="pd3i-zero-reporting-remove-btn pd3i-btn is-danger"/);
  assert.match(sarsHtml, /class="btn pd3i-btn is-primary" id="submitBtn"/);
});

test('reusable status chip and risk badge pattern is available', () => {
  ['.pd3i-status-chip', '.pd3i-risk-badge', '.pd3i-status-chip.is-success', '.pd3i-status-chip.is-warning', '.pd3i-status-chip.is-danger', '.pd3i-risk-badge.is-high'].forEach((selector) => {
    assert.match(styleHtml, new RegExp(selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  });
  assert.match(styleHtml, /border-radius: var\(--radius-pill\);/);
});

test('SARING-PIE buttons and status badges use reusable UI hooks', () => {
  const pieHtml = fs.readFileSync(path.join(root, 'src', 'Views', 'workspace_pie.html'), 'utf8');
  assert.match(pieHtml, /id="btn-pie-submit"[^>]*pd3i-btn is-primary/);
  assert.match(pieHtml, /id="btn-pie-eval"[^>]*pd3i-btn is-secondary/);
  assert.match(pieHtml, /id="btn-pie-save-lab"[^>]*pd3i-btn is-secondary/);
  assert.match(pieHtml, /id="btn-pie-add-onehealth"[^>]*pd3i-btn is-secondary/);
  assert.match(pieHtml, /pd3i-btn is-secondary" data-pie-resolve-alert="'\+pieHtml\(a\.alert_id\)\+'/);
  assert.match(pieHtml, /pd3i-risk-badge is-high/);
  assert.match(pieHtml, /pd3i-status-chip is-info/);
});

test('prompt dialog supports accessible text input for reason capture', () => {
  const utilsJs = fs.readFileSync(path.join(root, 'src', 'Views', 'utils.js.html'), 'utf8');
  assert.match(utilsJs, /function pd3iPromptDialog\(options\)/);
  assert.match(utilsJs, /role=\"dialog\" aria-modal=\"true\"/);
  assert.match(utilsJs, /id=\"pd3i-prompt-input\"/);
  assert.match(utilsJs, /Keterangan wajib diisi/);
  assert.match(utilsJs, /window\.pd3iPromptDialog = pd3iPromptDialog/);
  assert.match(styleHtml, /\.pd3i-prompt-input/);
  assert.match(styleHtml, /\.pd3i-prompt-error/);
});

test('SARING-PIE archive reason uses prompt dialog instead of browser prompt', () => {
  const pieHtml = fs.readFileSync(path.join(root, 'src', 'Views', 'workspace_pie.html'), 'utf8');
  assert.match(pieHtml, /document\.addEventListener\('click', async function\(e\)/);
  assert.match(pieHtml, /await pd3iPromptDialog\(\{ title:'Arsipkan kasus PIE\?'/);
  assert.match(pieHtml, /message:'Tuliskan alasan arsip\. Alasan akan masuk audit/);
  assert.match(pieHtml, /confirmLabel:'Arsipkan kasus'/);
  assert.doesNotMatch(pieHtml, /prompt\('Alasan arsip kasus PIE\?'/);
});

test('reusable form section and field pattern is available', () => {
  ['.pd3i-form-section', '.pd3i-form-section-title', '.pd3i-form-section-help', '.pd3i-form-grid', '.pd3i-form-field', '.pd3i-field-help', '.pd3i-field-error'].forEach((selector) => {
    assert.match(styleHtml, new RegExp(selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  });
  assert.match(styleHtml, /grid-template-columns: repeat\(auto-fit, minmax\(220px, 1fr\)\)/);
  assert.match(styleHtml, /\.pd3i-form-field input:focus-visible/);
});

test('SARING-PIE and Zero Reporting forms use reusable form hooks without changing IDs', () => {
  const pieHtml = fs.readFileSync(path.join(root, 'src', 'Views', 'workspace_pie.html'), 'utf8');
  const sarsHtml = fs.readFileSync(path.join(root, 'src', 'Views', 'workspace_sars.html'), 'utf8');
  assert.match(pieHtml, /id="pie-name" class="pd3i-shell-input"/);
  assert.match(pieHtml, /class="form-label pd3i-form-field">(?:Nama pasien|<span class="pie-field-label-text">Nama pasien)/);
  assert.match(pieHtml, /shadow-sm pd3i-form-section pie-inner-card" data-pie-tab-section="screening"/);
  assert.match(pieHtml, /pd3i-form-grid/);
  assert.match(sarsHtml, /<form id="sarsForm" class="pd3i-form-section pd3i-zero-reporting-form"/);
  assert.match(sarsHtml, /class="pd3i-zero-reporting-grid pd3i-form-grid"/);
});

test('cross-module Bootstrap controls are normalized to canonical PD3I UI tokens', () => {
  assert.doesNotMatch(indexHtml, /bootstrap@5\.3\.3\/dist\/css\/bootstrap\.min\.css/);
  assert.doesNotMatch(indexHtml, /bootstrap@5\.3\.3\/dist\/js\/bootstrap\.bundle\.min\.js/);
  assert.doesNotMatch(indexHtml, /@tabler\/core/);
  assert.doesNotMatch(indexHtml, /cdn\.tailwindcss\.com/);
  assert.match(styleHtml, /CANONICAL PD3I UI SYSTEM — FINAL OVERRIDE LAYER/);
  assert.match(styleHtml, /Bootstrap 5 consistency layer: local aliases for old Tailwind utility markup/);
  assert.match(styleHtml, /BOOTSTRAP 5 ADOPTION LAYER — PD3I CANONICAL MAPPING/);
  assert.match(styleHtml, /--bs-primary: var\(--color-primary-700\)/);
  assert.doesNotMatch(styleHtml, /\.pd3i-body :where\(\.container,/);
  assert.doesNotMatch(styleHtml, /\.pd3i-body :where\(\.card\)/);
  assert.match(styleHtml, /\.pd3i-body :where\(\.modal-content,/);
  assert.match(styleHtml, /\.pd3i-body :where\(\.accordion-item\)/);
  assert.match(styleHtml, /\.pd3i-body \.pd3i-mobile-nav-toggle,[\s\S]*display: none !important/);
  assert.match(styleHtml, /@media \(max-width: 768px\)[\s\S]*\.pd3i-body \.pd3i-mobile-nav-toggle,[\s\S]*display: inline-flex !important/);
  assert.match(styleHtml, /\.pd3i-body \.pd3i-search-filter-grid \{[\s\S]*grid-template-columns: minmax\(280px, 1\.45fr\) repeat\(2, minmax\(190px, 1fr\)\)/);
  assert.match(styleHtml, /\.pd3i-body \.pd3i-search-actions \{[\s\S]*grid-template-columns: minmax\(170px, auto\) minmax\(150px, auto\) minmax\(240px, 1fr\)/);
  assert.match(styleHtml, /Canonical UI hard reset v2/);
  assert.match(styleHtml, /\.pd3i-body :where\(\.pd3i-btn,[\s\S]*button\[type="button"\]/);
  assert.match(styleHtml, /\.pd3i-body :where\(\.pd3i-btn\.btn-sm,[\s\S]*\.pd3i-action-btn\.btn-sm/);
  assert.match(styleHtml, /\.pd3i-body :where\(\.pd3i-btn\.is-primary,[\s\S]*var\(--ui-primary\)/);
  assert.match(styleHtml, /\.pd3i-body :where\(\.pd3i-btn\.is-secondary,[\s\S]*var\(--ui-border-strong\)/);
  assert.match(styleHtml, /\.pd3i-body :where\(input,[\s\S]*select,[\s\S]*textarea\)/);
  assert.doesNotMatch(styleHtml, /\.pd3i-body :where\([\s\S]*\.form-control,[\s\S]*\.form-select\)/);
  assert.match(styleHtml, /\.pd3i-body \.rounded\s*\{/);
});

test('reusable skeleton loader is available for dashboard and list loading states', () => {
  const utilsJs = fs.readFileSync(path.join(root, 'src', 'Views', 'utils.js.html'), 'utf8');
  assert.match(utilsJs, /function renderPd3iSkeleton\(options\)/);
  assert.match(utilsJs, /role="status" aria-live="polite" aria-label="Memuat data"/);
  assert.match(utilsJs, /window\.renderPd3iSkeleton = renderPd3iSkeleton/);
  ['.pd3i-skeleton', '.pd3i-skeleton-title', '.pd3i-skeleton-row', '@keyframes pd3iSkeletonPulse'].forEach((needle) => {
    assert.match(styleHtml, new RegExp(needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  });
  assert.match(styleHtml, /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.pd3i-skeleton-title/);
});

test('dashboard search and SARING-PIE hotspots use skeleton loading', () => {
  const pieHtml = fs.readFileSync(path.join(root, 'src', 'Views', 'workspace_pie.html'), 'utf8');
  assert.match(appJs, /kpiWrap\.innerHTML = renderPd3iSkeleton\(\{ title: 'Memuat KPI operasional…'/);
  assert.match(appJs, /summaryWrap\.innerHTML = renderPd3iSkeleton\(\{ title: 'Memuat prioritas kerja…'/);
  assert.match(appJs, /searchResultsBox\.innerHTML = renderPd3iSkeleton/);
  assert.match(appJs, /renderPd3iSkeleton\(\{ title: 'Memuat daftar kerja…'/);
  assert.match(pieHtml, /id="pie-alert-list"[\s\S]*pd3i-skeleton/);
  assert.match(pieHtml, /id="pie-case-list"[\s\S]*pd3i-skeleton/);
  assert.match(pieHtml, /renderPd3iSkeleton\(\{ title:'Memuat timeline kasus '/);
});

test('Zero Reporting terminology replaces user-facing SARS labels while preserving internal routes', () => {
  assert.match(indexHtml, /data-nav-group-label="pd3i-reporting"[\s\S]*?<span>Pelaporan Rutin<\/span>[\s\S]*?<span>Input Zero Reporting<\/span>[\s\S]*?<span>Dashboard Zero Reporting<\/span>/);
  assert.match(indexHtml, /<span>Input Zero Reporting<\/span>/);
  assert.match(indexHtml, /<span>Dashboard Zero Reporting<\/span>/);
  assert.match(appJs, /'zero-reporting-form': 'Form Zero Reporting'/);
  assert.match(appJs, /'zero-reporting-dashboard': 'Dashboard Zero Reporting'/);
  assert.match(appJs, /'zero-reporting-form': \['ZERO REPORTING', 'Form Zero Reporting Mingguan'/);
  assert.match(appJs, /'zero-reporting-dashboard': \['ZERO REPORTING', 'Dashboard Zero Reporting'/);
  const sarsHtml = fs.readFileSync(path.join(root, 'src', 'Views', 'workspace_sars.html'), 'utf8');
  assert.match(sarsHtml, /Kirim laporan Zero Reporting\?/);
  assert.match(sarsHtml, /Laporan Zero Reporting berhasil disimpan dan dikirim\./);
  assert.doesNotMatch(indexHtml, /Surveilans Aktif SARS|Input SARS Mingguan|Dashboard SARS/);
});

test('PD3I microcopy routes common success to toast and actionable errors to banner', () => {
  assert.match(appJs, /showPd3iToast\(successMessage, \{ type: 'success' \}\)/);
  assert.match(appJs, /showPd3iToast\(verificationDoneMessage, \{ type: 'success' \}\)/);
  assert.match(appJs, /showPd3iToast\('Hasil pemeriksaan berhasil disimpan/);
  assert.match(appJs, /showPd3iToast\(res\.message \|\| 'Update status berhasil disimpan/);
  assert.match(appJs, /showPd3iToast\(`Data berhasil dimuat\. \$\{getWorkflowSearchOpenSuccessMessage\(preferredStage\)\}`/);
  assert.match(appJs, /showPd3iBanner\('Isi minimal satu kriteria pencarian sebelum mencari data\.', \{ type: 'error' \}\)/);
  assert.match(appJs, /showPd3iBanner\('Data belum berhasil dimuat\. Periksa koneksi, lalu coba kembali\.', \{ type: 'error' \}\)/);
  assert.match(appJs, /showPd3iBanner\('Record belum berhasil dibuka\. Coba ulangi dari hasil pencarian\.', \{ type: 'error' \}\)/);
  assert.doesNotMatch(appJs, /showTopAlert\(successMessage, true\)/);
  assert.doesNotMatch(appJs, /showTopAlert\("Data tidak ditemukan\.", false\)/);
});

test('visual audit tokenizes common semantic and focus colors', () => {
  ['--color-success-bg: #dcfce7', '--color-warning-bg: #fef3c7', '--color-danger-bg: #fee2e2', '--color-info-bg: #dbeafe', '--color-focus-ring: #2563eb', '--color-focus-ring-dark: #93c5fd'].forEach((token) => {
    assert.match(styleHtml, new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  });
  assert.match(styleHtml, /outline: 3px solid var\(--color-focus-ring\)/);
  assert.match(styleHtml, /outline: 3px solid var\(--color-focus-ring-dark\)/);
  assert.match(styleHtml, /background: var\(--color-danger-bg\)/);
  assert.match(styleHtml, /background: var\(--color-success-bg\)/);
  assert.match(styleHtml, /background: var\(--color-info-bg\)/);
});

test('UI blueprint documents scale-up rollout checklist and Zero Reporting terminology', () => {
  const uiBlueprint = fs.readFileSync(path.join(root, 'docs', 'UI-BLUEPRINT.md'), 'utf8');
  assert.match(uiBlueprint, /Scale-up UI\/UX SARING-PIE \+ PD3I — Progress 2026-07-11/);
  assert.match(uiBlueprint, /Zero Reporting/);
  assert.match(uiBlueprint, /showPd3iToast\(\)/);
  assert.match(uiBlueprint, /renderPd3iSkeleton\(\)/);
  assert.match(uiBlueprint, /Rollout checklist sebelum stable `\/exec`/);
  assert.match(uiBlueprint, /Stable `\/exec` versioned deployment hanya dilakukan setelah browser QA dev lulus\./);
});

test('visual audit tokenizes common radius values for cards and pills', () => {
  assert.match(styleHtml, /--radius-card: 18px/);
  assert.match(styleHtml, /--radius-xl: 24px/);
  assert.match(styleHtml, /--radius-pill: 999px/);
  assert.match(styleHtml, /border-radius: var\(--radius-card\)/);
  assert.match(styleHtml, /border-radius: var\(--radius-xl\)/);
  assert.match(styleHtml, /border-radius: var\(--radius-pill\)/);
  assert.doesNotMatch(styleHtml, /border-radius: 999px;/);
  assert.doesNotMatch(styleHtml, /border-radius: 18px;/);
  assert.doesNotMatch(styleHtml, /border-radius: 24px;/);
});

test('visual audit tokenizes common spacing values for gaps and padding', () => {
  assert.match(styleHtml, /--space-3: 12px/);
  assert.match(styleHtml, /--space-4: 16px/);
  assert.match(styleHtml, /gap: var\(--space-3\)/);
  assert.match(styleHtml, /gap: var\(--space-4\)/);
  assert.match(styleHtml, /padding: var\(--space-3\)/);
  assert.match(styleHtml, /padding: var\(--space-4\)/);
  assert.match(styleHtml, /margin-bottom: var\(--space-4\)/);
  assert.match(styleHtml, /--sars-field-gap: var\(--space-4\)/);
  assert.doesNotMatch(styleHtml, /gap: 1rem;/);
  assert.doesNotMatch(styleHtml, /gap: 0\.75rem;/);
  assert.doesNotMatch(styleHtml, /padding: 1rem;/);
  assert.doesNotMatch(styleHtml, /margin-bottom: 1rem;/);
});


test('global soft theme polish covers pages menus cards and controls', () => {
  assert.match(styleHtml, /Global soft theme polish: pages, menus, cards/);
  assert.match(styleHtml, /--pd3i-soft-surface: rgba\(255, 255, 255, 0\.88\)/);
  assert.match(styleHtml, /\.pd3i-sidebar \{/);
  assert.match(styleHtml, /backdrop-filter: blur\(16px\) saturate\(1\.08\)/);
  assert.match(styleHtml, /\.pd3i-nav-link:hover,[\s\S]*transform: translateY\(-1px\)/);
  assert.match(styleHtml, /\.pd3i-topbar,[\s\S]*\.pd3i-zero-reporting-host \.pd3i-zero-reporting-card,[\s\S]*\.accordion-item \{[\s\S]*border-radius: var\(--pd3i-soft-radius\) !important/);
  assert.match(styleHtml, /\.pd3i-dashboard-metric-card:hover,[\s\S]*transform: translateY\(-2px\)/);
  assert.match(styleHtml, /textarea:focus\)[\s\S]*box-shadow: 0 0 0 4px rgba\(14, 165, 233, 0\.13\)/);
  assert.match(styleHtml, /\.pd3i-primary-action,[\s\S]*background: linear-gradient\(135deg, #2563eb 0%, #0ea5e9 58%, #14b8a6 100%\) !important/);
});

test('browser QA refinement keeps login CTA strong and proportions softer', () => {
  assert.match(styleHtml, /Browser QA refinement: make live login CTA and proportions clearer/);
  assert.match(styleHtml, /\.pd3i-login-card \{[\s\S]*width: min\(100%, 26\.5rem\) !important/);
  assert.match(styleHtml, /\.pd3i-login-subtitle \{[\s\S]*font-weight: 480 !important/);
  assert.match(styleHtml, /\.pd3i-login-submit \{[\s\S]*background: linear-gradient\(135deg, #147d73 0%, #0ea5e9 100%\) !important/);
  assert.match(styleHtml, /\.pd3i-login-footer \{[\s\S]*letter-spacing: \.08em !important/);
});


test('browser QA compact viewport keeps login CTA above fold', () => {
  assert.match(styleHtml, /@media \(max-height: 560px\)/);
  assert.match(styleHtml, /\.pd3i-login-form \{[\s\S]*margin-top: \.95rem !important/);
  assert.match(styleHtml, /\.pd3i-login-input,\s*\.pd3i-login-submit \{[\s\S]*min-height: 42px !important/);
  assert.match(styleHtml, /max-height: 560px[\s\S]*\.pd3i-login-submit \{ min-height: 38px !important/);
});

test('PD3I reusable modal focus trap is wired to confirm and prompt dialogs', () => {
  assert.match(utilsJs, /function createPd3iModalFocusTrap\(modalRoot, options\)/);
  assert.match(utilsJs, /const previousFocus = document\.activeElement/);
  assert.match(utilsJs, /if \(e\.key !== 'Tab'\) return/);
  assert.match(utilsJs, /last\.focus\(\)/);
  assert.match(utilsJs, /first\.focus\(\)/);
  assert.match(utilsJs, /window\.createPd3iModalFocusTrap = createPd3iModalFocusTrap/);
  const trapUses = (utilsJs.match(/createPd3iModalFocusTrap\(card\)/g) || []).length;
  assert.equal(trapUses, 2);
  const releases = (utilsJs.match(/releaseFocusTrap\(\)/g) || []).length;
  assert.equal(releases, 2);
});

test('SARING-PIE analytics dashboard uses responsive density polish', () => {
  const pieHtml = fs.readFileSync(path.join(root, 'src', 'Views', 'workspace_pie.html'), 'utf8');
  assert.match(pieHtml, /class="pie-command-overview pie-analytics-density mb-4 pie-inner-card"/);
  assert.match(pieHtml, /grid-template-columns:repeat\(auto-fit,minmax\(150px,1fr\)\)/);
  assert.match(pieHtml, /grid-template-columns:repeat\(auto-fit,minmax\(260px,1fr\)\)/);
  assert.match(pieHtml, /font-size:clamp\(1\.45rem,4vw,2rem\)/);
  assert.match(pieHtml, /overflow-wrap:anywhere/);
  assert.match(pieHtml, /@media\(max-width:640px\)/);
  assert.match(pieHtml, /\.pie-analytics-density \[id\$="-bars"\]/);
});

test('PD3I form has sticky validation summary bridge toward review flow', () => {
  const formHtml = fs.readFileSync(path.join(root, 'src', 'Views', 'workspace_form.html'), 'utf8');
  assert.match(formHtml, /id="pd3i-validation-summary"/);
  assert.match(formHtml, /role="status" aria-live="polite"/);
  assert.match(formHtml, /id="pd3i-validation-summary-badge"/);
  assert.match(formHtml, /id="pd3i-validation-summary-list"/);
  assert.match(styleHtml, /\.pd3i-validation-summary/);
  assert.match(styleHtml, /\.pd3i-validation-summary\.is-clear/);
  assert.match(styleHtml, /\.pd3i-validation-summary\.is-error/);
  assert.match(appJs, /function renderPd3iValidationSummary\(issues, options\)/);
  assert.match(appJs, /checkConsistencyWarnings\(\) \|\| \[\]/);
  assert.match(appJs, /validateDxBusinessRules\(\)/);
  assert.match(appJs, /renderPd3iValidationSummary\(validationIssues, \{ hasError: validationHasError \}\)/);
});

test('PD3I submit flow skips blocking pre-submit review dialog before server save', () => {
  assert.match(appJs, /function getPd3iSubmitReviewItems\(submitMode, activeStageOnSubmit, warnings\)/);
  assert.match(appJs, /async function pd3iReviewBeforeSubmit\(submitMode, activeStageOnSubmit, warnings\)/);
  assert.doesNotMatch(appJs, /title: 'Tinjau sebelum simpan'/);
  assert.doesNotMatch(appJs, /confirmLabel: 'Ya, simpan data'/);
  assert.doesNotMatch(appJs, /const reviewOk = await (?:withWorkflowSaveTimeout\()?pd3iReviewBeforeSubmit\(submitMode, activeStageOnSubmit, warnings\)/);
  assert.doesNotMatch(appJs, /Penyimpanan dibatalkan\. Periksa kembali data bila perlu\./);
  assert.match(appJs, /showPd3iBanner\(warnings\.join\(" "\), \{ type: 'warning' \}\)/);
});

test('PD3I submit review dialog legacy code is not used in save path', () => {
  assert.match(utilsJs, /const message = cfg\.htmlMessage \? String\(cfg\.htmlMessage\) : escapeHtml\(cfg\.message/);
  assert.match(appJs, /function getPd3iSubmitReviewItems\(submitMode, activeStageOnSubmit, warnings\)/);
  assert.match(appJs, /renderPd3iSubmitReviewPanel\(submitMode, activeStageOnSubmit, warnings\)/);
  assert.doesNotMatch(appJs, /const htmlMessage = '<dl class="pd3i-confirm-message-list">'/);
  assert.doesNotMatch(appJs, /pd3iConfirmDialog\(\{[\s\S]*?title: 'Tinjau sebelum simpan'/);
});



test('PD3I dynamic contact tables keep readable spacing on narrow review screens', () => {
  assert.match(styleHtml, /\.pd3i-dynamic-table-container th,[\s\S]*?padding-left: 0\.75rem !important;[\s\S]*?padding-right: 0\.75rem !important;/);
  assert.match(styleHtml, /\.pd3i-dynamic-table-container th \{[\s\S]*?min-width: 8\.5rem;/);
  assert.match(styleHtml, /@media \(max-width: 768px\) \{[\s\S]*?\.pd3i-dynamic-table-container \.pd3i-dynamic-table \{\s*min-width: 72rem;/);
});

test('SARING-PIE tabs isolate panels instead of showing one long page', () => {
  const pieHtml = fs.readFileSync(path.join(root, 'src', 'Views', 'workspace_pie.html'), 'utf8');
  assert.match(pieHtml, /data-pie-tab-section="screening" data-pie-panel="rs"/);
  assert.match(pieHtml, /id="pie-dashboard" data-pie-tab-section="dashboard"/);
  assert.match(pieHtml, /data-pie-tab-section="operations lab"/);
  assert.match(pieHtml, /data-pie-tab-section="operations" data-pie-panel="dinkes"/);
  assert.match(pieHtml, /el\.setAttribute\('aria-hidden', inactive \? 'true' : 'false'\)/);
  assert.match(styleHtml, /#section-pie \[data-pie-tab-section\]\.hidden/);
  assert.match(styleHtml, /#section-pie \[data-pie-subtab\]\.hidden/);
  assert.match(styleHtml, /#section-pie \[data-pie-tab-section\]\[aria-hidden="true"\]/);
});

test('Zero Reporting form avoids duplicate page header and accessory strip under app breadcrumb', () => {
  const sarsHtml = fs.readFileSync(path.join(root, 'src', 'Views', 'workspace_sars.html'), 'utf8');
  assert.doesNotMatch(sarsHtml, /<h1>FORM Pelaporan Surveilans Aktif-PD3I<\/h1>/);
  assert.doesNotMatch(sarsHtml, /class="header"/);
  assert.doesNotMatch(sarsHtml, /Status formulir/);
  assert.doesNotMatch(sarsHtml, /format laporan nihil mingguan/);
  assert.match(styleHtml, /\.pd3i-local-status-strip/);
  assert.match(styleHtml, /App shell owns page title/);
});

test('root workspace page headers are demoted so breadcrumb owns page title', () => {
  const pieHtml = fs.readFileSync(path.join(root, 'src', 'Views', 'workspace_pie.html'), 'utf8');
  const settingsHtml = fs.readFileSync(path.join(root, 'src', 'Views', 'workspace_settings.html'), 'utf8');
  const sarsHtml = fs.readFileSync(path.join(root, 'src', 'Views', 'workspace_sars.html'), 'utf8');
  assert.doesNotMatch(pieHtml, /pd3i-section-title|Skrining Penyakit Infeksi Emerging\/Zoonosis/);
  assert.doesNotMatch(settingsHtml, /pd3i-section-title|Pengaturan PD3I \/ SARING-PIE/);
  assert.doesNotMatch(sarsHtml, /<h1>|Dashboard Zero Reporting PD3I|FORM Pelaporan Surveilans Aktif-PD3I/);
  assert.match(pieHtml, /aria-label="Status modul SARING-PIE"/);
  assert.match(settingsHtml, /aria-label="Status pengaturan sistem"/);
  assert.match(sarsHtml, /aria-label="Status dashboard Zero Reporting"/);
});

test('SARING-PIE operations are split into focused subpanels', () => {
  const pieHtml = fs.readFileSync(path.join(root, 'src', 'Views', 'workspace_pie.html'), 'utf8');
  ['alerts','tasks','classification','pe','cases'].forEach((panel) => {
    assert.match(pieHtml, new RegExp(`data-pie-ops-tab="${panel}"|data-pie-ops-panel="${panel}"`));
  });
  assert.match(pieHtml, /function\(panel\)[\s\S]*window\.__PIE_ACTIVE_OPS_PANEL=panel/);
  assert.match(pieHtml, /\[data-pie-ops-panel\]/);
  assert.match(pieHtml, /aria-selected/);
  assert.match(pieHtml, /window\.applyPieOpsPanel\(window\.__PIE_ACTIVE_OPS_PANEL\|\|'alerts'\)/);
  assert.match(styleHtml, /\.pie-ops-subnav/);
  assert.match(styleHtml, /\.pie-ops-panel\.hidden/);
});

test('PD3I wizard removes diagnosis-aware step guide from visible UI', () => {
  const formHtml = fs.readFileSync(path.join(root, 'src', 'Views', 'workspace_form.html'), 'utf8');
  assert.doesNotMatch(formHtml, /id="pd3i-diagnosis-step-guide"/);
  assert.doesNotMatch(formHtml, /id="pd3i-dx-step-guide-list"/);
});

test('PD3I submit area has full review panel before save action', () => {
  const formHtml = fs.readFileSync(path.join(root, 'src', 'Views', 'workspace_form.html'), 'utf8');
  assert.match(formHtml, /id="pd3i-submit-review-panel"/);
  assert.match(formHtml, /id="pd3i-submit-review-list"/);
  assert.ok(formHtml.indexOf('id="pd3i-submit-review-panel"') < formHtml.indexOf('id="btn-submit"'), 'review panel must appear before submit button');
  assert.match(appJs, /function renderPd3iSubmitReviewPanel\(submitMode, activeStageOnSubmit, warnings\)/);
  assert.match(appJs, /getPd3iSubmitReviewItems\(mode, stage, ruleState\)/);
  assert.match(appJs, /renderPd3iSubmitReviewPanel\(submitMode, activeStageOnSubmit, warnings\)/);
  assert.match(styleHtml, /\.pd3i-submit-review-panel/);
  assert.match(styleHtml, /\.pd3i-submit-review-panel\.has-warning/);
});

test('PD3I diagnosis step guide summarizes diagnosis-specific sections and status options', () => {
  assert.match(appJs, /function summarizeDiagnosisSections\(cfg\)/);
  assert.match(appJs, /function countDiagnosisSpecificFields\(cfg\)/);
  assert.match(appJs, /function getDiagnosisStatusOptionCount\(dx\)/);
  assert.match(appJs, /cfg\.sections\.reduce/);
  assert.match(appJs, /sectionNames\.join\(', '\)/);
  assert.match(appJs, /getCaseStatusOptions\(code\)/);
  assert.match(appJs, /Pilih dari \$\{statusCount\} opsi status/);
});

test('PD3I diagnosis step guide items are keyboard-accessible navigation controls', () => {
  assert.match(appJs, /<button type=\"button\" class=\"\$\{cls\}\" data-guide-step=/);
  assert.match(appJs, /aria-current=\"\$\{item\.id === active \? 'step' : 'false'\}\"/);
  assert.match(appJs, /closest\('\[data-guide-step\]'\)/);
  assert.match(appJs, /goToWorkflowStep\(stepId\)/);
  assert.match(styleHtml, /\.pd3i-dx-step-guide-item:focus-visible/);
  assert.match(styleHtml, /cursor: pointer/);
});

test('PD3I submit review panel shows required-field completion snapshot per workflow step', () => {
  assert.match(appJs, /function renderPd3iSubmitCompletionSnapshot\(activeStageOnSubmit\)/);
  assert.match(appJs, /countRequiredCompletionForSections\(step\.sections \|\| \[\]\)/);
  assert.match(appJs, /pd3i-submit-review-completion/);
  assert.match(appJs, /pd3i-submit-review-meter/);
  assert.match(appJs, /renderPd3iSubmitCompletionSnapshot\(stage\)/);
  assert.match(styleHtml, /\.pd3i-submit-review-completion/);
  assert.match(styleHtml, /\.pd3i-submit-review-step\.is-active/);
  assert.match(styleHtml, /\.pd3i-submit-review-meter span/);
});

test('PD3I submit review panel exposes readiness state for ready warning and blocked cases', () => {
  assert.match(appJs, /function getPd3iSubmitReadinessState\(warnings\)/);
  assert.match(appJs, /getFirstInvalidRequiredVisibleField\(activeFormForRequired\)/);
  assert.match(appJs, /state === 'blocked' \? 'Belum siap simpan'/);
  assert.match(appJs, /function renderPd3iSubmitReadinessBadge\(readiness\)/);
  assert.match(appJs, /pd3i-submit-readiness is-/);
  assert.match(appJs, /panel\.classList\.toggle\('has-error', readiness\.state === 'blocked'\)/);
  assert.match(styleHtml, /\.pd3i-submit-review-panel\.has-error/);
  assert.match(styleHtml, /\.pd3i-submit-readiness\.is-ready/);
  assert.match(styleHtml, /\.pd3i-submit-readiness\.is-warning/);
  assert.match(styleHtml, /\.pd3i-submit-readiness\.is-blocked/);
});

test('PD3I submit review readiness refreshes live when form values change', () => {
  assert.match(appJs, /let PD3I_SUBMIT_REVIEW_REFRESH_TIMER = null/);
  assert.match(appJs, /function schedulePd3iSubmitReviewRefresh\(reason\)/);
  assert.match(appJs, /setTimeout\(function\(\)/);
  assert.match(appJs, /renderPd3iSubmitReviewPanel\(ACTIVE_SIDEBAR_WORKSPACE, activeStep\)/);
  assert.match(appJs, /schedulePd3iSubmitReviewRefresh\(\);/);
  assert.match(appJs, /schedulePd3iSubmitReviewRefresh\(e\.target\.id === "form-selector" \? "immediate" : "change"\)/);
});

test('PD3I submit review blocker can jump to first invalid field without live focus side effects', () => {
  assert.match(appJs, /function getFirstInvalidRequiredVisibleField\(form\)/);
  assert.match(appJs, /firstBlockerId: firstBlockerId/);
  assert.match(appJs, /data-submit-review-jump/);
  assert.match(appJs, /goToWorkflowStep\(stepRoot\.id\)/);
  assert.match(appJs, /target\.focus\(\{ preventScroll: true \}\)/);
  assert.match(styleHtml, /\.pd3i-submit-review-jump/);
  assert.match(styleHtml, /\.pd3i-submit-review-jump:focus-visible/);
});

test('PD3I form has mobile sticky submit review affordance', () => {
  const formHtml = fs.readFileSync(path.join(root, 'src', 'Views', 'workspace_form.html'), 'utf8');
  assert.match(formHtml, /id="pd3i-mobile-submit-bar"/);
  assert.match(formHtml, /id="pd3i-mobile-submit-state"/);
  assert.match(formHtml, /id="pd3i-mobile-submit-detail"/);
  assert.match(formHtml, /id="pd3i-mobile-submit-jump"/);
  assert.match(appJs, /function updatePd3iMobileSubmitBar\(readiness\)/);
  assert.match(appJs, /updatePd3iMobileSubmitBar\(readiness\)/);
  assert.match(appJs, /closest\('#pd3i-mobile-submit-jump'\)/);
  assert.match(styleHtml, /\.pd3i-mobile-submit-bar/);
  assert.match(styleHtml, /position: sticky/);
  assert.match(styleHtml, /min-height: 44px/);
});

test('PD3I mobile submit bar jumps to first blocker when available', () => {
  assert.match(appJs, /function jumpToPd3iSubmitBlocker\(id\)/);
  assert.match(appJs, /bar\.setAttribute\('data-first-blocker-id', readiness\.firstBlockerId \|\| ''\)/);
  assert.match(appJs, /jumpBtn\.textContent = readiness\.firstBlockerId \? 'Perbaiki' : 'Review'/);
  assert.match(appJs, /const blockerId = bar \? bar\.getAttribute\('data-first-blocker-id'\) : ''/);
  assert.match(appJs, /if \(blockerId && jumpToPd3iSubmitBlocker\(blockerId\)\) return/);
  assert.match(appJs, /panel\.scrollIntoView\(\{ behavior: 'smooth', block: 'center' \}\)/);
});

test('PD3I validation summary items are actionable jump controls', () => {
  assert.match(appJs, /function findPd3iValidationIssueTarget\(issue\)/);
  assert.match(appJs, /function jumpToPd3iValidationIssue\(issue\)/);
  assert.match(appJs, /class="pd3i-validation-summary-action"/);
  assert.match(appJs, /data-validation-issue=/);
  assert.match(appJs, /closest\('\[data-validation-issue\]'\)/);
  assert.match(appJs, /jumpToPd3iValidationIssue\(issue\)/);
  assert.match(styleHtml, /\.pd3i-validation-summary-action/);
  assert.match(styleHtml, /\.pd3i-validation-summary-action:focus-visible/);
});

test('PD3I validation issue jump uses explicit target hints for business rules', () => {
  assert.match(appJs, /const PD3I_VALIDATION_TARGET_HINTS = \[/);
  assert.match(appJs, /match: 'tanggal terima laporan', field: 'Tanggal terima laporan'/);
  assert.match(appJs, /match: 'status verifikasi epid', field: 'Status Verifikasi EPID'/);
  assert.match(appJs, /match: 'jenis antibiotik', field: 'Jenis Antibiotik'/);
  assert.match(appJs, /match: 'kelemahan\/kelumpuhan akut', field: 'Kelemahan\/Kelumpuhan Akut'/);
  assert.match(appJs, /function findPd3iControlByLabelText\(labelText\)/);
  assert.match(appJs, /const hinted = PD3I_VALIDATION_TARGET_HINTS\.find/);
  assert.match(appJs, /findPd3iControlByLabelText\(hinted\.field\)/);
});

test('PD3I jump targets get temporary visual highlight', () => {
  assert.match(appJs, /function highlightPd3iFieldTarget\(target\)/);
  assert.match(appJs, /wrapper\.classList\.add\('pd3i-field-jump-highlight'\)/);
  assert.match(appJs, /wrapper\.classList\.remove\('pd3i-field-jump-highlight'\)/);
  assert.match(appJs, /highlightPd3iFieldTarget\(target\)/);
  assert.match(styleHtml, /\.pd3i-field-jump-highlight/);
  assert.match(styleHtml, /@keyframes pd3iFieldJumpPulse/);
  assert.match(styleHtml, /prefers-reduced-motion: reduce/);
});

test('PD3I submit review panel can collapse details accessibly', () => {
  const formHtml = fs.readFileSync(path.join(root, 'src', 'Views', 'workspace_form.html'), 'utf8');
  assert.match(formHtml, /id="pd3i-submit-review-panel"[^>]*data-collapsed="false"/);
  assert.match(formHtml, /id="pd3i-submit-review-toggle"/);
  assert.match(formHtml, /aria-expanded="true"/);
  assert.match(formHtml, /aria-controls="pd3i-submit-review-list"/);
  assert.match(appJs, /function setPd3iSubmitReviewCollapsed\(collapsed, options\)/);
  assert.match(appJs, /list\.hidden = isCollapsed/);
  assert.match(appJs, /toggle\.setAttribute\('aria-expanded'/);
  assert.match(appJs, /closest\('#pd3i-submit-review-toggle'\)/);
  assert.match(styleHtml, /\.pd3i-submit-review-head/);
  assert.match(styleHtml, /\.pd3i-submit-review-toggle:focus-visible/);
});

test('PD3I submit review auto-expands when warning or blocker exists', () => {
  assert.match(appJs, /readiness\.state === 'warning' \|\| readiness\.state === 'blocked'/);
  assert.match(appJs, /setPd3iSubmitReviewCollapsed\(false\)/);
  const autoExpandIndex = appJs.indexOf("setPd3iSubmitReviewCollapsed(false)");
  const renderIndex = appJs.indexOf('function renderPd3iSubmitReviewPanel');
  assert.ok(autoExpandIndex > renderIndex, 'auto expand should run from submit review render');
});

test('PD3I submit review preserves user collapsed state only when safe', () => {
  assert.match(appJs, /let PD3I_SUBMIT_REVIEW_USER_COLLAPSED = false/);
  assert.match(appJs, /function setPd3iSubmitReviewCollapsed\(collapsed, options\)/);
  assert.match(appJs, /if \(opts\.user === true\) PD3I_SUBMIT_REVIEW_USER_COLLAPSED = isCollapsed/);
  assert.match(appJs, /const willExpand = panel && panel\.getAttribute\('data-collapsed'\) === 'true'/);
  assert.match(appJs, /if \(willExpand && list && !String\(list\.innerHTML \|\| ''\)\.trim\(\)\)/);
  assert.match(appJs, /setPd3iSubmitReviewCollapsed\(!\(panel && panel\.getAttribute\('data-collapsed'\) === 'true'\), \{ user: true \}\)/);
  assert.match(appJs, /else if \(PD3I_SUBMIT_REVIEW_USER_COLLAPSED\) setPd3iSubmitReviewCollapsed\(true\)/);
  assert.match(appJs, /if \(readiness\.state === 'warning' \|\| readiness\.state === 'blocked'\) setPd3iSubmitReviewCollapsed\(false\)/);
});

test('SARING-PIE role visibility does not clobber tab visibility for operations and lab', () => {
  const pieHtml = fs.readFileSync(path.join(root, 'src', 'Views', 'workspace_pie.html'), 'utf8');
  assert.match(pieHtml, /pie-role-hidden/);
  assert.doesNotMatch(pieHtml, /data-pie-panel="dinkes"\]\'\)\.forEach\(function\(el\)\{ el\.classList\.toggle\('hidden'/);
  assert.match(pieHtml, /window\.applyPieRoleUi\(\); window\.applyPieTab\(window\.__PIE_ACTIVE_TAB\|\|window\.getPieDefaultTabForRole\(\)\)/);
  assert.match(pieHtml, /window\.refreshPieOperational = function\(\)\{ const token=window\.getPieSessionToken\(\); window\.applyPieRoleUi\(\); window\.applyPieTab/);
  assert.match(styleHtml, /#section-pie \.pie-role-hidden/);
});

test('SARING-PIE active operations and lab tabs have visible content guard', () => {
  const pieHtml = fs.readFileSync(path.join(root, 'src', 'Views', 'workspace_pie.html'), 'utf8');
  assert.match(pieHtml, /window\.ensurePieActiveTabHasVisibleContent = function\(tab\)/);
  assert.match(pieHtml, /\[data-pie-subtab="operations"\] \[data-pie-ops-panel\]/);
  assert.match(pieHtml, /if\(!hasVisibleOps\)\{ window\.applyPieOpsPanel\(window\.__PIE_ACTIVE_OPS_PANEL\|\|'alerts'\)/);
  assert.match(pieHtml, /\[data-pie-subtab="lab"\]/);
  assert.match(pieHtml, /window\.ensurePieActiveTabHasVisibleContent\(tab\)/);
  assert.match(pieHtml, /window\.ensurePieActiveTabHasVisibleContent\(window\.__PIE_ACTIVE_TAB\)/);
});

test('SARING-PIE visible list fallbacks prevent blank operations and lab panels', () => {
  const pieHtml = fs.readFileSync(path.join(root, 'src', 'Views', 'workspace_pie.html'), 'utf8');
  assert.match(pieHtml, /window\.renderPieEmptyState = function\(title, detail\)/);
  assert.match(pieHtml, /window\.ensurePieVisibleListFallbacks = function\(\)/);
  ['pie-alert-list','pie-task-list','pie-classification-list','pie-pe-list','pie-case-list','pie-specimen-list','pie-lab-list','pie-cluster-list','pie-onehealth-list'].forEach((id) => {
    assert.match(pieHtml, new RegExp(`'${id}'`));
  });
  assert.match(pieHtml, /window\.ensurePieVisibleListFallbacks\(\);/);
  assert.match(styleHtml, /#section-pie \.pie-empty-state/);
  assert.match(styleHtml, /border: 1px dashed var\(--color-border\)/);
});

test('SARING-PIE active tab self-check shows health banner if content stays hidden', () => {
  const pieHtml = fs.readFileSync(path.join(root, 'src', 'Views', 'workspace_pie.html'), 'utf8');
  assert.match(pieHtml, /id="pie-tab-health"/);
  assert.match(pieHtml, /role="status"/);
  assert.match(pieHtml, /window\.setPieTabHealth = function\(message\)/);
  assert.match(pieHtml, /Panel SARING-PIE belum menampilkan konten/);
  assert.match(pieHtml, /const ok=activePanels\.some\(visible\)/);
  assert.match(pieHtml, /return ok \|\| recovered/);
  assert.match(styleHtml, /#section-pie \.pie-tab-health/);
  assert.match(styleHtml, /var\(--color-warning-bg\)/);
});

test('SARING-PIE operations subnav uses accessible tabs and panels', () => {
  const pieHtml = fs.readFileSync(path.join(root, 'src', 'Views', 'workspace_pie.html'), 'utf8');
  assert.match(pieHtml, /role="tablist" aria-label="Submenu Operasional SARING-PIE"/);
  ['alerts','tasks','classification','pe','cases'].forEach((panel) => {
    assert.match(pieHtml, new RegExp(`id="pie-ops-tab-${panel}"[^>]+role="tab"[^>]+aria-controls="pie-ops-panel-${panel}"[^>]+data-pie-ops-tab="${panel}"`));
    assert.match(pieHtml, new RegExp(`id="pie-ops-panel-${panel}"[^>]+role="tabpanel"[^>]+aria-labelledby="pie-ops-tab-${panel}"[^>]+data-pie-ops-panel="${panel}"`));
  });
  assert.match(pieHtml, /el\.setAttribute\('tabindex', active \? '0' : '-1'\)/);
  assert.match(pieHtml, /window\.ensurePieActiveTabHasVisibleContent\(window\.__PIE_ACTIVE_TAB\|\|'operations'\)/);
});

test('SARING-PIE main nav exposes active tab with aria-current', () => {
  const indexHtml = fs.readFileSync(path.join(root, 'src', 'Views', 'index.html'), 'utf8');
  const pieHtml = fs.readFileSync(path.join(root, 'src', 'Views', 'workspace_pie.html'), 'utf8');
  ['screening','dashboard','operations','lab'].forEach((tab) => {
    assert.match(indexHtml, new RegExp(`data-sidebar-workspace="pie" data-pie-tab="${tab}"`));
  });
  assert.match(pieHtml, /const active=String\(el\.getAttribute\('data-pie-tab'\)\|\|''\)===tab/);
  assert.match(pieHtml, /if\(active\) el\.setAttribute\('aria-current','page'\); else el\.removeAttribute\('aria-current'\)/);
});

test('SARING-PIE operations subnav supports keyboard arrow navigation', () => {
  const pieHtml = fs.readFileSync(path.join(root, 'src', 'Views', 'workspace_pie.html'), 'utf8');
  assert.match(pieHtml, /window\.handlePieOpsTabKeydown = function\(e\)/);
  assert.match(pieHtml, /'ArrowRight','ArrowDown','ArrowLeft','ArrowUp','Home','End'/);
  assert.match(pieHtml, /document\.querySelectorAll\('\[data-pie-ops-tab\]'\)/);
  assert.match(pieHtml, /window\.applyPieOpsPanel\(next\.getAttribute\('data-pie-ops-tab'\)\)/);
  assert.match(pieHtml, /window\.ensurePieActiveTabHasVisibleContent\(window\.__PIE_ACTIVE_TAB\|\|'operations'\)/);
  assert.match(pieHtml, /next\.focus\(\)/);
  assert.match(pieHtml, /document\.addEventListener\('keydown', window\.handlePieOpsTabKeydown\)/);
});

test('SARING-PIE operations and lab panels are not nested inside screening-only wrapper', () => {
  const pieHtml = fs.readFileSync(path.join(root, 'src', 'Views', 'workspace_pie.html'), 'utf8');
  assert.doesNotMatch(pieHtml, /<div class="space-y-4" data-pie-tab-section="screening" data-pie-panel="rs">[\s\S]*data-pie-tab-section="operations lab"/);
  assert.match(pieHtml, /<div class="pie-screening-output-stack">[\s\S]*id="pie-result-card"[^>]+data-pie-tab-section="screening"[^>]+data-pie-panel="rs"[\s\S]*data-pie-tab-section="operations lab"/);
  assert.match(pieHtml, /id="pie-dashboard" data-pie-tab-section="dashboard"/);
  assert.match(pieHtml, /data-pie-tab-section="operations lab" data-pie-panel="dinkes"/);
});

test('SARING-PIE Form PE tab exposes template preview before draft exists', () => {
  const pieHtml = fs.readFileSync(path.join(root, 'src', 'Views', 'workspace_pie.html'), 'utf8');
  assert.match(pieHtml, /data-component="PiePeTemplatePreview"/);
  assert.match(pieHtml, /id="pie-pe-template-preview-select"/);
  assert.match(pieHtml, /id="pie-pe-template-preview"/);
  assert.match(pieHtml, /window\.PIE_PE_TEMPLATE_PREVIEW_OPTIONS/);
  ['FLU_BURUNG_RESPIRATORY','RABIES','LEPTOSPIROSIS','NEUROLOGIC_ZOONOSIS','CLUSTER_KLB','GENERAL'].forEach((template) => {
    assert.match(pieHtml, new RegExp(template));
  });
  assert.match(pieHtml, /window\.renderPiePeTemplatePreview = function\(template\)/);
  assert.match(pieHtml, /window\.initPiePeTemplatePreview = function\(\)/);
  assert.match(pieHtml, /window\.initPiePeTemplatePreview\(\)/);
});

test('SARING-PIE classification panel is triage-only and case actions live in Daftar Kasus', () => {
  const pieHtml = fs.readFileSync(path.join(root, 'src', 'Views', 'workspace_pie.html'), 'utf8');
  assert.match(pieHtml, /Panel ini untuk triage cepat/);
  assert.match(pieHtml, /data-pie-open-cases/);
  assert.match(pieHtml, /data-pie-case-row/);
  const clsStart = pieHtml.indexOf("const clsBox=document.getElementById('pie-classification-list')");
  const caseStart = pieHtml.indexOf("document.getElementById('pie-case-list').innerHTML", clsStart);
  assert.ok(clsStart !== -1 && caseStart !== -1);
  const clsRender = pieHtml.slice(clsStart, caseStart);
  assert.doesNotMatch(clsRender, /data-pie-classify-btn/);
  assert.doesNotMatch(clsRender, /data-pie-archive-case/);
  const caseRender = pieHtml.slice(caseStart, pieHtml.indexOf("; };", caseStart));
  ['UNDER_REVIEW','SUSPECT','PROBABLE','CONFIRMED','DISCARDED'].forEach((status) => {
    assert.match(caseRender, new RegExp(`data-pie-classify-btn="${status}"`));
  });
  assert.match(caseRender, /data-pie-archive-case/);
  assert.match(caseRender, /data-pie-prefill-lab/);
  assert.match(caseRender, /data-pie-timeline/);
});


test('Zero Reporting internal workspace naming uses zero-reporting aliases while preserving legacy compatibility', () => {
  const sarsHtml = fs.readFileSync(path.join(root, 'src', 'Views', 'workspace_sars.html'), 'utf8');
  const routesJs = fs.readFileSync(path.join(root, 'src', 'Controllers', 'routes.js'), 'utf8');
  assert.match(indexHtml, /data-sidebar-workspace="zero-reporting-form"/);
  assert.match(indexHtml, /data-sidebar-workspace="zero-reporting-dashboard"/);
  assert.match(sarsHtml, /id="section-zero-reporting-form"/);
  assert.match(sarsHtml, /id="section-zero-reporting-dashboard"/);
  assert.match(styleHtml, /body\[data-active-workspace="zero-reporting-form"\] #section-zero-reporting-form/);
  assert.match(appJs, /'sars-form': 'zero-reporting-form'/);
  assert.match(appJs, /'section-sars-form': 'zero-reporting-form'/);
  assert.match(routesJs, /page === "zero-reporting-form"/);
  assert.match(routesJs, /page === "zero-reporting-dashboard"/);
});

test('canonical PD3I UI system overrides legacy controls consistently across modules', () => {
  assert.match(styleHtml, /CANONICAL PD3I UI SYSTEM — FINAL OVERRIDE LAYER/);
  ['--ui-control-height: 42px', '--ui-control-radius: 12px', '--ui-card-radius: 18px', '--ui-card-pad: 16px'].forEach((token) => {
    assert.match(styleHtml, new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  });
  assert.match(styleHtml, /Legacy Bootstrap\/Tailwind\/older PD3I classes are aliases only/);
  assert.match(styleHtml, /\.pd3i-body :where\(\.btn,[\s\S]*\.pd3i-action-btn,[\s\S]*button\[type="button"\]/);
  assert.match(styleHtml, /\.pd3i-body :where\(input,[\s\S]*select,[\s\S]*textarea\)/);
  assert.match(styleHtml, /\.pd3i-body :where\(\.pd3i-shell-card,[\s\S]*\.pd3i-zero-reporting-card,[\s\S]*\.bg-white\.border/);
  assert.match(styleHtml, /\.pd3i-body :where\(\.pd3i-data-table th\)/);
});

test('user-facing case list terminology is Daftar Kasus, not List Kasus', () => {
  const viewFiles = ['src/Views/app.js.html', 'src/Views/index.html', 'src/Views/workspace_guide.html', 'src/Views/workspace_input_form.html', 'src/Views/workspace_search.html'];
  viewFiles.forEach((rel) => {
    const content = fs.readFileSync(path.join(root, rel), 'utf8');
    assert.doesNotMatch(content, />[^<]*List Kasus[^<]*</, `${rel} must not render List Kasus`);
  });
  assert.match(indexHtml, /Daftar Kasus/);
  assert.match(fs.readFileSync(path.join(root, 'src', 'Views', 'workspace_search.html'), 'utf8'), /Daftar Kasus/);
});

test('canonical UI hard reset beats legacy module selectors for controls and cards', () => {
  assert.match(styleHtml, /Canonical UI hard reset v2/);
  assert.match(styleHtml, /\.pd3i-body \.pd3i-zero-reporting-remove-btn\.pd3i-btn[\s\S]*border-radius: 10px !important/);
  assert.match(styleHtml, /\.pd3i-body \.sars-form input:not\(\[type="checkbox"\]\):not\(\[type="radio"\]\)/);
  assert.match(styleHtml, /\.pd3i-body \.pd3i-zero-reporting-host input:not\(\[type="checkbox"\]\):not\(\[type="radio"\]\)/);
  assert.match(styleHtml, /\.pd3i-body input\[type="checkbox"\][\s\S]*accent-color: var\(--ui-primary\) !important/);
  assert.match(styleHtml, /\.pd3i-body \.pie-ops-panel,[\s\S]*\.pd3i-body \.pie-empty-state/);
});

test('SARING-PIE operation failures render explicit error card, not blank risk result', () => {
  const pieHtml = fs.readFileSync(path.join(root, 'src', 'Views', 'workspace_pie.html'), 'utf8');
  assert.match(pieHtml, /if\(x && x\.ok===false\)/);
  assert.match(pieHtml, /Operasi SARING-PIE gagal/);
  assert.match(pieHtml, /Operasi gagal/);
  assert.match(pieHtml, /border-red-400 bg-red-50/);
});

test('PD3I input form renderer initializes COMMON before rendering fields', () => {
  const commonStart = appJs.indexOf('const COMMON = getCommonConfigSafe();');
  const renderStart = appJs.indexOf('function renderDxWorkspaceForm(dx, mode)');
  assert.notEqual(commonStart, -1);
  assert.notEqual(renderStart, -1);
  assert.ok(commonStart < renderStart, 'COMMON must be initialized before renderDxWorkspaceForm executes');
  const renderBlock = appJs.slice(renderStart, appJs.indexOf('function getRequiredFieldNamesForDx', renderStart));
  assert.match(renderBlock, /COMMON\.pelapor/);
  assert.match(renderBlock, /COMMON\.pasien/);
});

test('PD3I submit review falls back to dynamic input form when legacy section ids are absent', () => {
  const fnStart = appJs.indexOf('function countRequiredCompletionForSections(sectionIds)');
  assert.notEqual(fnStart, -1);
  const fnBlock = appJs.slice(fnStart, appJs.indexOf('function getFieldValueSafe', fnStart));
  assert.match(fnBlock, /function countRootRequired\(root\)/);
  assert.match(fnBlock, /total === 0 && ids\.some/);
  assert.match(fnBlock, /document\.getElementById\("dynamic-form-input"\)/);
  assert.match(fnBlock, /section-pelapor/);
  assert.match(fnBlock, /section-pasien/);
  assert.match(fnBlock, /section-specific/);
});

test('PD3I input form has wizard blocks for guided medical entry', () => {
  assert.match(appJs, /const PD3I_INPUT_WIZARD_BLOCKS = \[/);
  assert.match(appJs, /pd3i-form-card-pelapor/);
  assert.match(appJs, /pd3i-form-card-pasien/);
  assert.match(appJs, /pd3i-form-card-specific/);
  assert.match(appJs, /function updateInputWizardBlock\(activeId\)/);
  assert.match(appJs, /data-input-wizard-next/);
  assert.match(appJs, /Cek Review sebelum simpan/);
  assert.match(styleHtml, /\.pd3i-input-wizard-tabs/);
  assert.match(styleHtml, /\.pd3i-input-wizard-hidden/);
});

test('PD3I long select fields expose local filter input for location-heavy forms', () => {
  assert.match(appJs, /function enhanceLongSelectsWithFilter\(root\)/);
  assert.match(appJs, /select\.pd3i-generated-control/);
  assert.match(appJs, /options\.length < 12/);
  assert.match(appJs, /Ketik untuk saring pilihan/);
  assert.match(appJs, /opt\.hidden/);
  assert.match(styleHtml, /\.pd3i-select-filter-wrap/);
  assert.match(styleHtml, /\.pd3i-select-filter-input/);
});

test('PD3I submit readiness reads active workspace form and jumps input wizard block', () => {
  assert.match(appJs, /activeWorkspaceForRequired = normalizeSidebarWorkspace\(ACTIVE_SIDEBAR_WORKSPACE \|\| 'input'\)/);
  assert.match(appJs, /getWorkspaceFormRefs\(activeWorkspaceForRequired\)/);
  assert.match(appJs, /activeRefsForRequired && activeRefsForRequired\.formElement/);
  assert.match(appJs, /target\.closest\('\.pd3i-form-card-pelapor, \.pd3i-form-card-pasien, \.pd3i-form-card-specific'\)/);
  assert.match(appJs, /updateInputWizardBlock\(wizardBlock\)/);
});

test('SARING-PIE guides post-screening workflow from result to PE specimen and lab', () => {
  assert.match(workspacePieHtml, /function\(d\).*Alur tindak lanjut otomatis|window\.renderPieGuidedNextActions = function\(d\)/s);
  assert.match(workspacePieHtml, /data-pie-guided-workflow/);
  assert.match(workspacePieHtml, /1 Hasil/);
  assert.match(workspacePieHtml, /2 Tindakan/);
  assert.match(workspacePieHtml, /3 Form PE/);
  assert.match(workspacePieHtml, /4 Spesimen/);
  assert.match(workspacePieHtml, /5 Lab/);
  assert.match(workspacePieHtml, /data-pie-start-pe/);
  assert.match(workspacePieHtml, /data-pie-prefill-lab/);
});

test('SARING-PIE lab and One Health use searchable pickers instead of manual case/specimen IDs', () => {
  assert.match(workspacePieHtml, /id="pie-lab-case-search"/);
  assert.match(workspacePieHtml, /id="pie-lab-case-select"/);
  assert.match(workspacePieHtml, /id="pie-lab-case" type="hidden"/);
  assert.match(workspacePieHtml, /id="pie-lab-specimen-search"/);
  assert.match(workspacePieHtml, /id="pie-lab-specimen-select"/);
  assert.match(workspacePieHtml, /id="pie-lab-specimen" type="hidden"/);
  assert.match(workspacePieHtml, /id="pie-oh-case-search"/);
  assert.match(workspacePieHtml, /window\.updatePieCasePickers/);
  assert.match(workspacePieHtml, /window\.updatePieSpecimenPicker/);
  assert.match(workspacePieHtml, /window\.resolvePiePickerSearch/);
});

test('browser audit hardens visible labels and sidebar touch targets', () => {
  assert.doesNotMatch(indexHtml, /pd3i-sr-only" aria-hidden="true">Daftar Kasus/);
  assert.match(fs.readFileSync(path.join(root, 'src', 'Views', 'workspace_search.html'), 'utf8'), /id="search-sort"[^>]+aria-label="Urutkan Daftar Kasus"/);
  assert.match(fs.readFileSync(path.join(root, 'src', 'Views', 'workspace_sars.html'), 'utf8'), /id="jenisFaskes"[^>]+aria-label="Jenis faskes pelapor"/);
  assert.match(fs.readFileSync(path.join(root, 'src', 'Views', 'workspace_sars.html'), 'utf8'), /id="rowsPerPage"[^>]+aria-label="Jumlah baris per halaman"/);
  assert.match(workspacePieHtml, /id="pie-specimen-filter-status"[^>]+aria-label="Filter status spesimen"/);
  assert.match(workspacePieHtml, /id="pie-lab-filter-result"[^>]+aria-label="Filter hasil lab"/);
  assert.match(workspacePieHtml, /id="pie-oh-filter-type"[^>]+aria-label="Filter tipe One Health"/);
  assert.match(styleHtml, /\.pd3i-nav-link \{\n  min-height: 40px !important;/);
});

test('browser visual audit hardens Zero Reporting hidden fields and dynamic labels', () => {
  const sarsHtml = fs.readFileSync(path.join(root, 'src', 'Views', 'workspace_sars.html'), 'utf8');
  assert.match(styleHtml, /\.sars-hidden-faskes-fields \{\n  display: none !important;/);
  assert.match(styleHtml, /\.pd3i-btn,\nbutton\.pd3i-btn,\n\.btn\.pd3i-btn \{\n  min-height: 40px !important;/);
  assert.match(sarsHtml, /function annotateZeroReportingDynamicFields\(\)/);
  assert.match(sarsHtml, /previousElementSibling/);
  assert.match(sarsHtml, /setAttribute\('aria-label'/);
  assert.match(sarsHtml, /MutationObserver/);
});

test('browser visual audit hardens Zero Reporting hidden fields and dynamic labels', () => {
  const sarsHtml = fs.readFileSync(path.join(root, 'src', 'Views', 'workspace_sars.html'), 'utf8');
  assert.match(styleHtml, /\.sars-hidden-faskes-fields \{\n  display: none !important;/);
  assert.match(styleHtml, /\.pd3i-btn,\nbutton\.pd3i-btn,\n\.btn\.pd3i-btn \{\n  min-height: 40px !important;/);
  assert.match(sarsHtml, /function annotateZeroReportingDynamicFields\(\)/);
  assert.match(sarsHtml, /previousElementSibling/);
  assert.match(sarsHtml, /setAttribute\('aria-label'/);
  assert.match(sarsHtml, /MutationObserver/);
});

test('PD3I core menus expose command-center workflow guide and non-duplicative labels', () => {
  const searchHtml = fs.readFileSync(path.join(root, 'src', 'Views', 'workspace_search.html'), 'utf8');
  assert.match(searchHtml, /id="pd3i-core-workflow-guide"/);
  assert.match(searchHtml, /Panduan cepat workflow PD3I/);
  assert.match(appJs, /function updatePd3iCoreWorkflowGuide\(workspace\)/);
  assert.match(appJs, /Command center kasus/);
  assert.match(appJs, /Saring data tersimpan/);
  assert.match(appJs, /Data tersimpan/);
  assert.match(styleHtml, /\.pd3i-core-workflow-guide/);
});


test('PD3I search keyword field has explicit accessibility label', () => {
  const searchHtml = fs.readFileSync(path.join(root, 'src', 'Views', 'workspace_search.html'), 'utf8');
  assert.match(searchHtml, /id="search-epid"[^>]*aria-label="Cari EPID, ID registrasi, nama pasien, alamat, kelurahan, atau orang tua"/);
});


test('Overview exposes Dinkes task inbox cards with direct workspace actions', () => {
  assert.match(appJs, /const taskCards = \[/);
  assert.match(appJs, /Pending verifikasi/);
  assert.match(appJs, /Menunggu hasil lab/);
  assert.match(appJs, /Siap update status/);
  assert.match(appJs, /data-overview-task-workspace/);
  assert.match(styleHtml, /\.pd3i-overview-task-card/);
  assert.match(styleHtml, /\.pd3i-overview-task-action/);
});


test('Overview render uses SESSION_USER for settings capability without undefined user reference', () => {
  assert.doesNotMatch(appJs, /isSuperAdminUiRole\(user && user\.role\)/);
  assert.match(appJs, /isSuperAdminUiRole\(SESSION_USER && SESSION_USER\.role\)/);
});


test('Daftar Kasus result cards make primary case action prominent', () => {
  assert.match(appJs, /if \(workspace === 'search'\) return 'Edit kasus'/);
  assert.match(appJs, /pd3i-search-result-action-label/);
  assert.match(appJs, /pd3i-search-result-action is-edit pd3i-action-btn is-primary/);
  assert.match(appJs, /function getWorkflowSearchActionLabel\(\)/);
  assert.match(styleHtml, /\.pd3i-search-result-action\.is-primary/);
});


test('Input Kasus removes lifecycle progress from visible UI', () => {
  const inputHtml = fs.readFileSync(path.join(root, 'src', 'Views', 'workspace_input_form.html'), 'utf8');
  assert.doesNotMatch(inputHtml, /id="pd3i-input-lifecycle-card"/);
  assert.doesNotMatch(inputHtml, /Progress lintas workflow/);
});


test('Overview task inbox includes Zero Reporting and SARING-PIE indicators', () => {
  assert.match(appJs, /data-overview-cross-module/);
  assert.match(appJs, /Zero Reporting belum lapor/);
  assert.match(appJs, /SARING-PIE E3\/EX/);
  assert.match(appJs, /PIE PE\/lab pending/);
  assert.match(appJs, /getEpiMetaForDashboard\(new Date\(\)\.getFullYear\(\)\)/);
  assert.match(appJs, /getDashboardData\(reportYear, reportWeek, 'all', 'all'(?:, sessionToken)?\)/);
  assert.match(appJs, /pieGetOperationalDashboard\(sessionToken\)/);
  assert.match(appJs, /data-overview-task-tab/);
  assert.match(styleHtml, /\.pd3i-overview-task-card\.is-cross-module/);
});


test('Final QA hardens compact PIE action buttons to 40px touch target', () => {
  assert.match(styleHtml, /Final QA touch-target hardening for compact PIE action buttons/);
  assert.match(styleHtml, /\.pd3i-body \.btn\.pd3i-btn\.btn-sm/);
  assert.match(styleHtml, /\[id\^="btn-pie-"\]/);
  assert.match(styleHtml, /min-height:\s*40px !important/);
});


test('Sumber Laporan select keeps canonical options after dynamic render', () => {
  assert.match(appJs, /function ensureSumberLaporanOptions/);
  assert.match(appJs, /RUMAH SAKIT/);
  assert.match(appJs, /PUSKESMAS/);
  assert.match(appJs, /LAINNYA/);
  assert.match(appJs, /ensureSumberLaporanOptions\(refs\.formElement\)/);
});

test('local status strip stays inset and compact inside outer cards', () => {
  const style = fs.readFileSync(path.join(__dirname, '..', 'src', 'Views', 'style.html'), 'utf8');
  assert.match(style, /\.pd3i-local-status-strip \{[\s\S]*?width: calc\(100% - \(var\(--space-4\) \* 2\)\);[\s\S]*?margin: var\(--space-4\) var\(--space-4\) var\(--space-4\);[\s\S]*?padding: var\(--space-3\);[\s\S]*?border-radius: var\(--radius-md\);[\s\S]*?\}/);
  assert.match(style, /@media \(max-width: 640px\) \{[\s\S]*?\.pd3i-local-status-strip \{[\s\S]*?width: 100%;[\s\S]*?margin-inline: 0;[\s\S]*?\}/);
});

test('PIE main boxes use shared inset inner-card spacing', () => {
  const pieHtml = fs.readFileSync(path.join(__dirname, '..', 'src', 'Views', 'workspace_pie.html'), 'utf8');
  const innerCards = pieHtml.match(/pie-inner-card/g) || [];
  assert.ok(innerCards.length >= 6, 'SARING-PIE section/result/operations cards use shared inset spacing');
  assert.match(pieHtml, /#section-pie \.pie-inner-card\{min-width:0\}/);
  assert.match(pieHtml, /@media \(max-width:640px\)\{#section-pie \.pie-inner-card\{width:100%;max-width:100%;margin-left:0;margin-right:0\}\}/);
});


test('PIE mode selector cards are removed from user UI', () => {
  const pieHtml = fs.readFileSync(path.join(__dirname, '..', 'src', 'Views', 'workspace_pie.html'), 'utf8');
  assert.doesNotMatch(pieHtml, /Mode RS\/Faskes/);
  assert.doesNotMatch(pieHtml, /Mode Dinkes\/Surveilans/);
  assert.doesNotMatch(pieHtml, /pie-mode-card/);
});

test('PIE rendered result states preserve inset width class', () => {
  const pieHtml = fs.readFileSync(path.join(__dirname, '..', 'src', 'Views', 'workspace_pie.html'), 'utf8');
  assert.match(pieHtml, /el\.className='mt-3 p-3 border text-sm pie-inner-card '\+tone/);
  assert.match(pieHtml, /el\.className='mt-3 p-3 border text-sm border-red-400 bg-red-50 pie-inner-card'/);
  assert.match(pieHtml, /el\.className='mt-3 p-3 border text-sm pie-inner-card '\+\(v\.complete\?/);
  assert.match(pieHtml, /el\.className='mt-3 p-3 border text-sm border-blue-300 bg-blue-50 pie-inner-card'/);
});

test('Zero Reporting weekly form content stays visible in active workspace', () => {
  const style = fs.readFileSync(path.join(__dirname, '..', 'src', 'Views', 'style.html'), 'utf8');
  const sarsHtml = fs.readFileSync(path.join(__dirname, '..', 'src', 'Views', 'workspace_sars.html'), 'utf8');
  assert.match(sarsHtml, /<form id="sarsForm"/);
  assert.match(sarsHtml, /disease-section/);
  assert.match(style, /body\[data-active-workspace="zero-reporting-form"\] #section-zero-reporting-form \.pd3i-zero-reporting-form-host \.container[\s\S]*?display: block !important;[\s\S]*?visibility: visible !important;[\s\S]*?opacity: 1 !important;/);
  assert.match(style, /body\[data-active-workspace="zero-reporting-form"\] #section-zero-reporting-form #sarsForm[\s\S]*?body\[data-active-workspace="zero-reporting-form"\] #section-zero-reporting-form \.disease-section[\s\S]*?display: block !important;/);
  assert.match(style, /body\[data-active-workspace="zero-reporting-form"\] #section-zero-reporting-form \.pd3i-form-grid[\s\S]*?display: grid !important;/);
});


test('Detail kasus panel follows operational case profile blueprint', () => {
  const formHtml = fs.readFileSync(path.join(root, 'src', 'Views', 'workspace_form.html'), 'utf8');
  assert.match(formHtml, /id="viewer-badge"/);
  assert.match(formHtml, /id="dynamic-form"/);
  assert.match(formHtml, /Review sebelum simpan/);
  assert.match(formHtml, /pd3i-submit-review-panel/);
  assert.match(styleHtml, /Detail kasus phase 10: operational case profile/);
  assert.match(styleHtml, /Detail kasus phase 11: role-aware next action panel/);
  assert.match(styleHtml, /Detail kasus phase 18: lab and audit summary/);
  assert.match(styleHtml, /#summary-epid,[\s\S]*?font-variant-numeric: tabular-nums/);
  assert.match(styleHtml, /\.pd3i-workflow-status-value {[\s\S]*?border-radius: var\(--radius-pill\)/);
  assert.match(styleHtml, /\.pd3i-next-action-grid {[\s\S]*?grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
});



test('Detail kasus phase 43 follows safety checklist strip blueprint', () => {
  const formHtml = fs.readFileSync(path.join(root, 'src', 'Views', 'workspace_form.html'), 'utf8');
  assert.match(formHtml, /id="viewer-badge"/);
  ['EPID:', 'Status:', 'Review sebelum simpan'].forEach((copy) => {
    assert.match(formHtml, new RegExp(copy));
  });
  assert.match(styleHtml, /Detail kasus phase 43: safety checklist strip/);
  assert.match(styleHtml, /\.pd3i-detail-safety-strip \{[\s\S]*grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/);
  assert.match(styleHtml, /@media \(max-width: 760px\) \{[\s\S]*\.pd3i-detail-safety-strip \{[\s\S]*grid-template-columns: 1fr/);
});

test('Dashboard statistik phase 2 follows epidemiology command panel blueprint', () => {
  const dashboardJs = fs.readFileSync(path.join(root, 'src', 'Views', 'app.dashboard.js.html'), 'utf8');
  assert.match(dashboardJs, /KPI KASUS SURVEILANS/);
  assert.match(dashboardJs, /Analisis kasus/);
  assert.doesNotMatch(dashboardJs, /KPI operasional\/antrian tersedia di Beranda/);
  assert.match(dashboardJs, /pd3i-dashboard-state is-loading/);
  assert.doesNotMatch(dashboardJs, /pd3i-dashboard-keadaan is-loading/);
  assert.match(dashboardJs, /Peta distribusi penyakit per kelurahan|Peta sebaran kasus/);
  assert.match(dashboardJs, /Kurva epidemiologi mingguan/);
  assert.match(dashboardJs, /W1, W2, W3/);
  assert.match(dashboardJs, /curveType: 'function'/);
  assert.doesNotMatch(dashboardJs, /Antrean verifikasi dan tindak lanjut/);
  assert.match(dashboardJs, /Distribusi kecamatan teratas/);
  assert.doesNotMatch(dashboardJs, /Urgent/);
  assert.doesNotMatch(dashboardJs, /text-rose-500 mr-1 animate-pulse/);
  assert.match(styleHtml, /Dashboard statistik phase 11: epidemiology command panel/);
  assert.match(styleHtml, /\.pd3i-dashboard-metric-card \[class\*=\"text-3xl\"\],[\s\S]*?font-variant-numeric: tabular-nums/);
  assert.match(styleHtml, /\.pd3i-dashboard-status-chip {[\s\S]*?background: var\(--color-surface-subtle\)/);
});



test('Dashboard statistik removes reading-order cards from analysis intro', () => {
  assert.match(appDashboardJs, /Analisis kasus/);
  assert.doesNotMatch(appDashboardJs, /pd3i-dashboard-reading-strip/);
  assert.doesNotMatch(appDashboardJs, /Beban kasus/);
  assert.doesNotMatch(appDashboardJs, /Epidemiologi<\/span>/);
  assert.doesNotMatch(appDashboardJs, /Verifikasi, lab, klaster, kematian/);
});

test('Daftar Kasus phase 2 follows operational registry refinement blueprint', () => {
  const searchHtml = fs.readFileSync(path.join(root, 'src', 'Views', 'workspace_search.html'), 'utf8');
  assert.match(appJs, /Daftar operasional kasus sesuai filter aktif, hak akses, dan urutan terbaru/);
  assert.match(appJs, /pd3i-search-results-summary/);
  assert.match(appJs, /pd3i-search-summary-pill/);
  assert.match(appJs, /Tindak lanjut/);
  assert.match(appJs, /Dokumen PE/);
  assert.doesNotMatch(appJs, /Tidak ada record yang cocok/);
  assert.match(searchHtml, /pd3i-search-safety-brief/);
  ['Cek duplikasi', 'Buka kasus yang tepat', 'Aksi sesuai tahap'].forEach((copy) => {
    assert.match(searchHtml, new RegExp(copy));
  });
  assert.match(styleHtml, /Daftar Kasus phase 12: operational registry refinement/);
  assert.match(styleHtml, /\.pd3i-search-safety-brief \{[\s\S]*grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/);
  assert.match(styleHtml, /\.pd3i-search-summary-pill \{[\s\S]*?font-variant-numeric: tabular-nums/);
  assert.match(styleHtml, /\.pd3i-search-result-card:focus-within/);
  assert.match(styleHtml, /\.pd3i-search-result-badge:not\(\.is-status\):not\(\.is-verify\):not\(\.is-sample\)/);
});


test('Form wizard phase 2 keeps guided clinical entry without visible stepper', () => {
  const formHtml = fs.readFileSync(path.join(root, 'src', 'Views', 'workspace_form.html'), 'utf8');
  const inputFormHtml = fs.readFileSync(path.join(root, 'src', 'Views', 'workspace_input_form.html'), 'utf8');
  assert.doesNotMatch(formHtml, /Tahap kerja kasus/);
  assert.doesNotMatch(formHtml, /Sumber laporan, pasien, dan data klinis awal/);
  assert.doesNotMatch(formHtml, /Validasi data dan pengesahan EPID/);
  assert.match(formHtml, /Review dan simpan/);
  assert.match(inputFormHtml, /Input kasus awal/);
  assert.doesNotMatch(inputFormHtml, /Gunakan ruang ini untuk membuat kasus baru/);
  assert.match(inputFormHtml, /Review dan simpan input awal/);
  assert.match(styleHtml, /Form wizard phase 13: guided clinical entry refinement/);
  assert.match(styleHtml, /#dynamic-form \.pd3i-submit-review-panel\.has-warning/);
  assert.match(styleHtml, /#dynamic-form \.pd3i-wizard-button,[\s\S]*?min-height: 42px/);
});


test('Administrasi phase 2 follows secure operations refinement blueprint', () => {
  const settingsHtml = fs.readFileSync(path.join(root, 'src', 'Views', 'workspace_settings.html'), 'utf8');
  assert.match(settingsHtml, /Administrasi sistem/);
  assert.match(settingsHtml, /pd3i-admin-ops-summary/);
  assert.match(settingsHtml, /Akses pengguna/);
  assert.match(settingsHtml, /Integrasi aman/);
  assert.match(settingsHtml, /Operasi sensitif/);
  assert.match(settingsHtml, /Checklist sebelum simpan/);
  assert.match(settingsHtml, /Jejak audit/);
  assert.match(settingsHtml, /Kontrol risiko/);
  assert.match(settingsHtml, /Simpan konfigurasi/);
  assert.match(settingsHtml, /Tambah \/ edit pengguna/);
  assert.match(styleHtml, /Administrasi phase 14: secure operations refinement/);
  assert.match(styleHtml, /#section-settings \.pd3i-admin-ops-summary \{[\s\S]*?grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/);
  assert.match(styleHtml, /#section-settings \.pd3i-admin-ops-item\.is-sensitive/);
  assert.match(styleHtml, /#section-settings \.pd3i-btn,[\s\S]*?min-height: 40px/);
});


test('Zero Reporting form stays focused without explanatory accessory cards', () => {
  const sarsHtml = fs.readFileSync(path.join(root, 'src', 'Views', 'workspace_sars.html'), 'utf8');
  assert.doesNotMatch(sarsHtml, /pd3i-zero-reporting-ops-summary/);
  assert.doesNotMatch(sarsHtml, /Periode laporan/);
  assert.doesNotMatch(sarsHtml, /Isi atau nihil/);
  assert.doesNotMatch(sarsHtml, /Laporan segera/);
  assert.doesNotMatch(sarsHtml, /pd3i-zero-reporting-review-brief/);
  ['Cek minggu', 'Cek faskes', 'Cek nihil'].forEach((copy) => {
    assert.doesNotMatch(sarsHtml, new RegExp(copy));
  });
  assert.match(sarsHtml, /Identitas laporan/);
  assert.match(sarsHtml, /Simpan dan kirim laporan/);
  assert.match(sarsHtml, /id="chipMode" class="hidden"/);
  assert.match(sarsHtml, /id="chipUpdate" class="hidden"/);
  assert.match(styleHtml, /#section-zero-reporting-form \.pd3i-zero-reporting-host #submitBtn \{[\s\S]*?min-height: 44px/);
});


test('SARING-PIE dashboard phase 2 follows epidemiology command refinement blueprint', () => {
  const pieHtml = fs.readFileSync(path.join(root, 'src', 'Views', 'workspace_pie.html'), 'utf8');
  assert.match(pieHtml, /Panel komando epidemiologi/);
  assert.match(pieHtml, /pie-command-priority/);
  assert.match(pieHtml, /pie-command-review/);
  assert.match(pieHtml, /Prioritas dashboard SARING-PIE/);
  ['Triage risiko', 'Rencana PE', 'Kualitas data'].forEach((copy) => {
    assert.match(pieHtml, new RegExp(copy));
  });
  assert.match(pieHtml, /Ekspor kasus CSV/);
  assert.match(pieHtml, /Ekspor ringkasan/);
  assert.doesNotMatch(pieHtml, /pie-kpi-card rose/);
  assert.match(pieHtml, /#section-pie \.pie-command-priority\{display:grid;grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
  assert.match(pieHtml, /#section-pie \.pie-command-review\{display:grid;grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
  assert.match(pieHtml, /#section-pie \.pie-kpi-card b\{[\s\S]*?font-family:var\(--font-data\);font-variant-numeric:tabular-nums/);
  assert.match(pieHtml, /@media\(max-width:900px\)\{#section-pie \.pie-command-priority,#section-pie \.pie-command-review\{grid-template-columns:1fr\}\}/);
});



test('Dashboard statistik phase 45 follows external reference visual skin without borrowed brand', () => {
  assert.match(workspaceDashboardHtml, /pd3i-dashboard-reference-skin/);
  assert.doesNotMatch(workspaceDashboardHtml, /pd3i-dashboard-context-chips/);
  ['Wilayah kerja aktif', 'Prioritas harian', 'Data surveilans', 'Tampilan komando'].forEach((copy) => {
    assert.doesNotMatch(workspaceDashboardHtml, new RegExp(copy));
  });
  assert.match(appDashboardJs, /Ringkasan komando untuk memantau laporan faskes ini/);
  assert.match(appDashboardJs, /Ringkasan komando untuk memantau kasus dalam wilayah pengampu/);
  assert.match(styleHtml, /Dashboard statistik phase 45: external reference visual skin/);
  assert.match(styleHtml, /--dashboard-ref-teal-900: #07343b/);
  assert.match(styleHtml, /\.pd3i-dashboard-reference-skin \.pd3i-dashboard-shell \{[\s\S]*background: var\(--dashboard-ref-page\)/);
  assert.match(styleHtml, /\.pd3i-dashboard-reference-skin \.pd3i-dashboard-metric-card::before/);
});

test('Dashboard statistik phase 3 keeps case KPI cards but removes operational KPI strip', () => {
  assert.doesNotMatch(appDashboardJs, /pd3i-dashboard-situation-strip mb-4/);
  assert.doesNotMatch(appDashboardJs, /Ringkasan situasi dashboard PD3I/);
  assert.doesNotMatch(appDashboardJs, /Antrean kerja/);
  assert.doesNotMatch(appDashboardJs, /Kelengkapan proses/);
  assert.doesNotMatch(appDashboardJs, /Kendali operasional admin dan pengampu/);
  assert.match(appDashboardJs, /KPI KASUS SURVEILANS/);
  ['Total Kasus Pengampu', 'Kasus suspek baru', 'Kasus aktif', 'Kasus konfirmasi', 'Sembuh', 'Meninggal'].forEach((copy) => {
    assert.match(appDashboardJs, new RegExp(copy));
  });
  assert.doesNotMatch(appDashboardJs, /KPI operasional\/antrian tersedia di Beranda/);
  assert.match(appDashboardJs, /Choropleth Depok|Sebaran wilayah/);
  assert.match(appDashboardJs, /Kurva epidemiologi/);
  assert.match(appDashboardJs, /perMinggu/);
});


test('Dashboard statistik phase 4 follows light command dashboard blueprint', () => {
  assert.match(workspaceDashboardHtml, /section-dashboard" class="pd3i-dashboard-section pd3i-dashboard-light-room/);
  assert.doesNotMatch(workspaceDashboardHtml, /(?:Dashboard light mode untuk membaca kurva epidemiologi|Ringkasan komando surveilans untuk membaca tren PD3I)/);
  assert.doesNotMatch(workspaceDashboardHtml, /pd3i-dashboard-mode-chip">(?:Light mode|Tampilan komando)/);
  assert.match(appDashboardJs, /(?:Dashboard light mode|Ringkasan komando) untuk memantau laporan faskes ini/);
  assert.match(appDashboardJs, /(?:Dashboard light mode|Ringkasan komando) untuk memantau kasus dalam wilayah pengampu/);
  assert.match(styleHtml, /Dashboard statistik phase 4: light command dashboard foundation/);
  assert.match(styleHtml, /\.pd3i-dashboard-light-room \.pd3i-dashboard-shell \{[\s\S]*linear-gradient\(180deg, #ffffff 0%, #f8fafc 100%\)/);
  assert.match(styleHtml, /\.pd3i-dashboard-light-room \.pd3i-dashboard-mode-chip \{[\s\S]*#0f766e/);
});


test('Workflow queues phase 16 follows operational workbench clarity blueprint', () => {
  assert.match(appJs, /function getQueueAgeText/);
  assert.match(appJs, /Umur antrean:/);
  assert.match(appJs, /pd3i-queue-next-action/);
  assert.match(appJs, /pd3i-workflow-queue-summary/);
  ['Review dan tetapkan EPID', 'Input hasil pemeriksaan', 'Tentukan klasifikasi akhir', 'Perbaiki data wajib', 'Antrian aktif', 'Selesai tahap ini', 'Workspace aktif'].forEach((copy) => {
    assert.match(appJs, new RegExp(copy));
  });
  assert.match(styleHtml, /Workflow queues phase 16: operational workbench clarity/);
  assert.match(styleHtml, /Workflow queues phase 19: queue summary cards/);
  assert.match(styleHtml, /#workflow-inbox \.pd3i-card-eyebrow \{[\s\S]*display: none !important/);
  assert.match(styleHtml, /\.pd3i-queue-next-action \{[\s\S]*border-radius: var\(--radius-pill\)/);
  assert.match(styleHtml, /\.pd3i-workflow-queue-summary \{[\s\S]*grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/);
});

test('Workflow forms remove operational stage strips for clean UI', () => {
  assert.doesNotMatch(workspaceVerifikasiHtml, /pd3i-workflow-stage-strip/);
  assert.doesNotMatch(workspaceSampelHtml, /pd3i-workflow-stage-strip/);
  assert.doesNotMatch(workspaceStatusHtml, /pd3i-workflow-stage-strip/);
});



test('Workflow queues phase 42 follows role-safe queue brief blueprint', () => {
  assert.match(appJs, /pd3i-workflow-queue-brief/);
  ['Identitas dipindai', 'Aksi aman berikutnya', 'Status', 'Review data, tetapkan EPID, atau kembalikan untuk revisi', 'Input hasil pemeriksaan atau tandai tidak diperiksa', 'Tentukan klasifikasi akhir dan tindak lanjut pasien'].forEach((copy) => {
    assert.match(appJs, new RegExp(copy));
  });
  assert.match(styleHtml, /Workflow queues phase 42: role-safe queue brief/);
  assert.match(styleHtml, /\.pd3i-workflow-queue-brief \{[\s\S]*grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/);
});

test('Panduan Aplikasi phase 7 follows searchable FAQ foundation blueprint', () => {
  assert.match(workspaceGuideHtml, /pd3i-guide-faq-panel/);
  assert.match(workspaceGuideHtml, /Cari panduan cepat/);
  assert.match(workspaceGuideHtml, /id="pd3i-guide-search-input"/);
  assert.match(workspaceGuideHtml, /placeholder="Contoh: verifikasi EPID"/);
  assert.match(workspaceGuideHtml, /Filter visual lokal\. Tidak mengubah data aplikasi\./);
  ['pd3i-guide-topic-input', 'pd3i-guide-topic-verifikasi', 'pd3i-guide-topic-lab', 'pd3i-guide-topic-status', 'pd3i-guide-topic-dashboard'].forEach((id) => {
    assert.match(workspaceGuideHtml, new RegExp(`id="${id}"`));
    assert.match(workspaceGuideHtml, new RegExp(`#${id}`));
  });
  assert.match(styleHtml, /Panduan Aplikasi fase 7: searchable FAQ foundation/);
  assert.match(styleHtml, /\.pd3i-guide-faq-panel \{[\s\S]*grid-template-columns: minmax\(0, 1\.15fr\) minmax\(260px, 0\.85fr\)/);
  assert.match(styleHtml, /\.pd3i-guide-search-input:focus \{[\s\S]*var\(--color-focus-ring\)/);
  assert.match(styleHtml, /\.pd3i-guide-card:target \{[\s\S]*var\(--color-info\)/);
});


test('Panduan Aplikasi phase 17 adds role-specific steps without eyebrow clutter', () => {
  assert.match(workspaceGuideHtml, /pd3i-guide-role-panel/);
  assert.match(workspaceGuideHtml, /pd3i-guide-role-safety/);
  ['Petugas faskes\/puskesmas', 'Admin\/verifikator EPID', 'Laboratorium', 'Pengelola status'].forEach((copy) => {
    assert.match(workspaceGuideHtml, new RegExp(copy));
  });
  ['Cari dulu', 'Simpan sesuai tahap', 'Data sensitif'].forEach((copy) => {
    assert.match(workspaceGuideHtml, new RegExp(copy));
  });
  assert.doesNotMatch(workspaceGuideHtml, /<div class="pd3i-card-eyebrow">Peran<\/div>/);
  assert.doesNotMatch(workspaceGuideHtml, /<div class="pd3i-card-eyebrow">Input Kasus<\/div>/);
  assert.match(styleHtml, /Panduan Aplikasi phase 17: role-specific steps without eyebrow clutter/);
  assert.match(styleHtml, /#section-guide \.pd3i-card-eyebrow,[\s\S]*display: none !important/);
  assert.match(styleHtml, /\.pd3i-guide-role-grid \{[\s\S]*grid-template-columns: repeat\(4, minmax\(0, 1fr\)\)/);
  assert.match(styleHtml, /\.pd3i-guide-role-safety \{[\s\S]*grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/);
  assert.match(styleHtml, /\.pd3i-guide-role-safety > div\.is-warning \{/);
});

test('Login removes OTP access stepper while keeping trust panel', () => {
  assert.doesNotMatch(authLoginHtml, /pd3i-login-access-strip/);
  assert.doesNotMatch(authLoginHtml, /Tahap akses aplikasi/);
  assert.match(authLoginHtml, /pd3i-login-trust-panel/);
  ['Akses resmi', 'Sesi berbasis peran', 'Data medis rahasia'].forEach((copy) => {
    assert.match(authLoginHtml, new RegExp(copy));
  });
});


test('Login phase 10 follows account request official compact refinement blueprint', () => {
  assert.match(authLoginHtml, /account-request-security-strip/);
  ['Identitas', 'Unit kerja', 'Persetujuan'].forEach((copy) => {
    assert.match(authLoginHtml, new RegExp(copy));
  });
  assert.match(authLoginHtml, /account-request-form-summary/);
  ['Email aktif', 'Unit\/faskes resmi', 'Role ditetapkan admin'].forEach((copy) => {
    assert.match(authLoginHtml, new RegExp(copy));
  });
  assert.match(authLoginHtml, /Permohonan diverifikasi administrator sebelum akses aktif\./);
  assert.match(styleHtml, /Login fase 10: account request official compact refinement/);
  assert.match(styleHtml, /\.account-request-security-strip \{[\s\S]*grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/);
  assert.match(styleHtml, /\.account-request-form-summary span \{[\s\S]*min-height: 40px/);
  assert.match(styleHtml, /@media \(max-width: 760px\) \{[\s\S]*\.account-request-security-strip,[\s\S]*grid-template-columns: 1fr/);
});

test('Login phase 13 cleans email Telegram OTP flow visibility without visible stepper', () => {
  assert.doesNotMatch(authLoginHtml, /id="pd3i-login-flow-strip"/);
  assert.match(authLoginHtml, /pd3i-login-primary-actions/);
  assert.match(authJsHtml, /function setLoginFlowStage/);
  assert.match(authJsHtml, /requestTelegramPairing\(email\)/);
  assert.match(authJsHtml, /Pilih kanal OTP/);
  assert.match(authJsHtml, /Kirim OTP ke email/);
  assert.match(authJsHtml, /Hubungkan Telegram/);
  assert.match(authJsHtml, /setLoginFlowStage\('otp', channel\)/);
  assert.match(styleHtml, /Login phase 13: cleaner email-to-OTP flow and action visibility/);
  assert.match(styleHtml, /#login-card\[data-login-stage="otp"\] \.pd3i-login-primary-actions,[\s\S]*display: none !important/);
  assert.match(styleHtml, /#login-card\[data-login-stage="otp"\] #otp-section,[\s\S]*display: grid !important/);
});

test('Login phase 12 keeps Kirim OTP CTA readable', () => {
  assert.match(authLoginHtml, /id="btn-send-otp"[\s\S]*<span>Kirim OTP<\/span>/);
  assert.match(styleHtml, /Login phase 12: OTP CTA contrast fix/);
  assert.match(styleHtml, /#btn-send-otp\.pd3i-login-submit:not\(:disabled\) \{[\s\S]*color: #ffffff !important/);
  assert.match(styleHtml, /#btn-send-otp\.pd3i-login-submit:not\(:disabled\) span,[\s\S]*color: #ffffff !important/);
  assert.match(styleHtml, /#btn-send-otp\.pd3i-login-submit:disabled span,[\s\S]*color: #64748b !important/);
});

test('Login phase 11 reduces decorative eyebrow density', () => {
  assert.doesNotMatch(authLoginHtml, /<div class="pd3i-login-kicker">SIMPEL Surveilans Kota Depok<\/div>/);
  assert.match(authLoginHtml, /<h1 class="pd3i-login-title">SIMPEL Surveilans Kota Depok<\/h1>/);
  assert.match(authLoginHtml, /<p class="pd3i-login-subtitle">Sistem Informasi Monitoring, Penyelidikan Epidemiologi, dan Laporan\.<\/p>/);
  assert.match(authLoginHtml, /pd3i-login-footer-compact/);
  assert.match(authLoginHtml, /Akses resmi berbasis peran. Data medis rahasia./);
  assert.match(authLoginHtml, /<div class="pd3i-login-trust-panel hidden" aria-hidden="true">/);
  assert.match(styleHtml, /Login phase 11: reduce decorative eyebrow density/);
  assert.match(styleHtml, /\.pd3i-login-card \.pd3i-login-kicker \{[\s\S]*display: none !important/);
});


test('Beranda phase 11 follows operational situation strip blueprint', () => {
  assert.match(workspaceOverviewHtml, /id="overview-situation-strip" class="pd3i-overview-situation-strip"/);
  assert.match(appJs, /Cakupan data/);
  assert.match(appJs, /Beban kerja/);
  assert.match(appJs, /Kelengkapan verifikasi/);
  assert.match(appJs, /Verifikasi, revisi, lab, status/);
  assert.match(styleHtml, /Beranda fase 11: operational situation strip/);
  assert.match(styleHtml, /\.pd3i-overview-situation-strip \{[\s\S]*grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/);
  assert.match(styleHtml, /\.pd3i-overview-situation-item strong \{[\s\S]*font-variant-numeric: tabular-nums/);
  assert.match(styleHtml, /@media \(max-width: 900px\) \{[\s\S]*\.pd3i-overview-situation-strip \{ grid-template-columns: 1fr; \}/);
});


test('Dashboard statistik phase 12 moves verification KPI away from analysis dashboard', () => {
  assert.doesNotMatch(appDashboardJs, /pd3i-dashboard-verification-panel/);
  assert.doesNotMatch(appDashboardJs, /Status verifikasi/);
  ['Kasus terverifikasi', 'Pending verifikasi', 'Perlu revisi', 'Menunggu hasil lab'].forEach((copy) => {
    assert.match(appJs, new RegExp(copy));
  });
  assert.match(appJs, /overview-kpi-grid/);
  assert.match(styleHtml, /Dashboard statistik phase 12: verification status panel/);
});


test('Daftar Kasus removes search readiness strip for clean UI', () => {
  assert.doesNotMatch(searchHtml, /pd3i-search-readiness-strip/);
  assert.doesNotMatch(searchHtml, /Panduan kesiapan pencarian Daftar Kasus/);
});


test('Form wizard removes input readiness strip for clean UI', () => {
  const inputFormHtml = fs.readFileSync(path.join(root, 'src', 'Views', 'workspace_input_form.html'), 'utf8');
  assert.doesNotMatch(inputFormHtml, /pd3i-input-readiness-strip/);
  assert.doesNotMatch(inputFormHtml, /Kesiapan input kasus awal/);
});


test('Administrasi phase 15 follows secure guardrail strip blueprint', () => {
  const settingsHtml = fs.readFileSync(path.join(root, 'src', 'Views', 'workspace_settings.html'), 'utf8');
  assert.match(settingsHtml, /pd3i-admin-guardrail-strip/);
  ['Verifikasi akses', 'Audit perubahan', 'Uji konfigurasi', 'Operasi terbatas', 'Setup sheet, rule, dan super-admin tidak untuk perubahan rutin'].forEach((copy) => {
    assert.match(settingsHtml, new RegExp(copy));
  });
  assert.match(styleHtml, /Administrasi phase 15: secure guardrail strip/);
  assert.match(styleHtml, /\.pd3i-admin-audit-brief \{[\s\S]*grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/);
  assert.match(styleHtml, /\.pd3i-admin-guardrail-strip \{[\s\S]*grid-template-columns: repeat\(4, minmax\(0, 1fr\)\)/);
  assert.match(styleHtml, /\.pd3i-admin-guardrail-item\.is-sensitive \{[\s\S]*var\(--color-warning-bg\)/);
  assert.match(styleHtml, /@media \(max-width: 640px\) \{[\s\S]*\.pd3i-admin-guardrail-strip \{ grid-template-columns: 1fr; \}/);
});


test('Hasil pemeriksaan uses clean lab page without safety brief clutter', () => {
  assert.doesNotMatch(workspaceSampelHtml, /pd3i-sampel-lab-brief/);
  ['Cek kasus', 'Cek sampel', 'Cek final'].forEach((copy) => {
    assert.doesNotMatch(workspaceSampelHtml, new RegExp(copy));
  });
});


test('Status dan klasifikasi uses clean status page without review brief clutter', () => {
  assert.doesNotMatch(workspaceStatusHtml, /pd3i-status-review-brief/);
  ['Cek kondisi akhir', 'Cek klasifikasi', 'Cek tindak lanjut'].forEach((copy) => {
    assert.doesNotMatch(workspaceStatusHtml, new RegExp(copy));
  });
});


test('Input Kasus uses clean entry page without safety brief clutter', () => {
  assert.doesNotMatch(workspaceInputHtml, /pd3i-input-entry-brief/);
  ['Cek identitas', 'Cek gejala awal', 'Cek duplikasi'].forEach((copy) => {
    assert.doesNotMatch(workspaceInputHtml, new RegExp(copy));
  });
});


test('Verifikasi EPID keeps action box without review brief clutter', () => {
  assert.doesNotMatch(workspaceVerifikasiHtml, /pd3i-verifikasi-review-brief/);
  ['Cek sumber laporan', 'Cek kelayakan EPID', 'Cek alasan revisi'].forEach((copy) => {
    assert.doesNotMatch(workspaceVerifikasiHtml, new RegExp(copy));
  });
});


test('Detail kasus pascaverifikasi memakai approval workflow, bukan edit langsung', () => {
  const routesHtml = fs.readFileSync(path.join(root, 'src', 'Controllers', 'routes.js'), 'utf8');
  const appHtml = fs.readFileSync(path.join(root, 'src', 'Views', 'app.js.html'), 'utf8');
  const initHtml = fs.readFileSync(path.join(root, 'src', 'Views', 'app.init.js.html'), 'utf8');
  assert.match(routesHtml, /function requestInitialReportEdit\s*\(/);
  assert.match(routesHtml, /Kasus sudah terverifikasi\. Ajukan permintaan perubahan kepada admin\./);
  assert.match(routesHtml, /function approveInitialReportEdit\s*\(/);
  assert.match(routesHtml, /function rejectInitialReportEdit\s*\(/);
  assert.match(routesHtml, /function cancelInitialReportEdit\s*\(/);
  assert.match(routesHtml, /Snapshot Hash/);
  assert.match(routesHtml, /Tidak ada perubahan data untuk diajukan/);
  assert.match(routesHtml, /Data kasus berubah setelah permintaan diajukan/);
  assert.match(appHtml, /requestInitialReportEdit/);
  assert.match(appHtml, /__approvalRequest/);
  assert.match(initHtml, /Ajukan perubahan/);
});


test('Beranda uses clean operational page without priority brief clutter', () => {
  assert.doesNotMatch(workspaceOverviewHtml, /pd3i-overview-ops-brief/);
  ['Cek antrian', 'Cek cakupan', 'Cek yang macet'].forEach((copy) => {
    assert.doesNotMatch(workspaceOverviewHtml, new RegExp(copy));
  });
});


test('Dashboard statistik uses clean analysis page without analysis brief clutter', () => {
  assert.doesNotMatch(workspaceDashboardHtml, /pd3i-dashboard-analysis-brief/);
  ['Cek tren', 'Cek wilayah', 'Cek sinyal bahaya'].forEach((copy) => {
    assert.doesNotMatch(workspaceDashboardHtml, new RegExp(copy));
  });
});


test('Shell phase 27 keeps topbar clean without session context card', () => {
  assert.doesNotMatch(indexHtml, /pd3i-session-context/);
  assert.doesNotMatch(indexHtml, /Sesi aktif/);
  assert.doesNotMatch(indexHtml, /Peran, unit, dan cakupan mengikuti akun masuk/);
});


test('Sidebar phase 28 clarifies role-based navigation groups', () => {
  assert.match(indexHtml, /data-nav-group-label="pd3i-cases"[\s\S]*?<span>Surveilans PD3I<\/span>[\s\S]*?<small>Kasus, verifikasi, lab, status<\/small>/);
  assert.match(indexHtml, /data-nav-group-label="pd3i-pie"[\s\S]*?<span>Surveilans PIE<\/span>[\s\S]*?<small>Skrining, operasi PE, lab<\/small>/);
  assert.match(indexHtml, /data-nav-group-label="pd3i-admin"[\s\S]*?<span>Administrasi<\/span>[\s\S]*?<small>Akun, konfigurasi, audit<\/small>/);
  assert.match(styleHtml, /\.pd3i-nav-group-label \{[\s\S]*display: flex;[\s\S]*flex-direction: column/);
  assert.match(styleHtml, /\.pd3i-nav-group-label small \{[\s\S]*text-transform: none/);
});


test('Content phase 29 keeps workflow forms at comfortable reading width', () => {
  assert.match(workspaceInputHtml, /id="section-input-form-shell"[^>]*pd3i-form-shell/);
  assert.match(workspaceVerifikasiHtml, /id="section-verifikasi-form-shell"[^>]*pd3i-form-shell/);
  assert.match(workspaceSampelHtml, /id="section-sampel-form-shell"[^>]*pd3i-form-shell/);
  assert.match(workspaceStatusHtml, /id="section-status-form-shell"[^>]*pd3i-form-shell/);
  assert.match(styleHtml, /Content phase 29: comfortable form reading width/);
  assert.match(styleHtml, /\.pd3i-form-shell \{[\s\S]*max-width: 1120px/);
  assert.match(styleHtml, /\.pd3i-form-shell \{[\s\S]*margin-left: auto;[\s\S]*margin-right: auto/);
  assert.match(styleHtml, /@media \(max-width: 1180px\) \{[\s\S]*\.pd3i-form-shell \{[\s\S]*max-width: 100%/);
});


test('Daftar Kasus phase 30 keeps case registry at readable list width', () => {
  assert.match(searchHtml, /id="section-search-shell"[^>]*pd3i-list-shell/);
  assert.match(styleHtml, /\.pd3i-list-shell \{[\s\S]*max-width: 1240px/);
  assert.match(styleHtml, /\.pd3i-list-shell \{[\s\S]*margin-left: auto;[\s\S]*margin-right: auto/);
  assert.match(styleHtml, /@media \(max-width: 1280px\) \{[\s\S]*\.pd3i-list-shell \{[\s\S]*max-width: 100%/);
});


test('Administrasi phase 31 keeps user management table readable and auditable', () => {
  const settingsHtml = fs.readFileSync(path.join(root, 'src', 'Views', 'workspace_settings.html'), 'utf8');
  assert.match(settingsHtml, /pd3i-admin-users-table-wrap/);
  assert.match(settingsHtml, /aria-label="Tabel kelola pengguna SIMPEL"/);
  assert.match(settingsHtml, /class="pd3i-table pd3i-admin-users-table/);
  assert.match(styleHtml, /Administrasi phase 31: readable user management table/);
  assert.match(styleHtml, /\.pd3i-admin-users-table \{[\s\S]*min-width: 1180px/);
  assert.match(styleHtml, /\.pd3i-admin-users-table th \{[\s\S]*position: sticky;[\s\S]*top: 0/);
  assert.match(styleHtml, /\.pd3i-admin-users-table th,[\s\S]*\.pd3i-admin-users-table td \{[\s\S]*vertical-align: top/);
});


test('Administrasi phase 32 keeps approval review tables readable', () => {
  const settingsHtml = fs.readFileSync(path.join(root, 'src', 'Views', 'workspace_settings.html'), 'utf8');
  assert.match(settingsHtml, /id="account-request-admin-list"[^>]*pd3i-approval-table-wrap/);
  assert.match(settingsHtml, /aria-label="Tabel approval permohonan akun"/);
  assert.match(settingsHtml, /id="facility-correction-admin-list"[^>]*pd3i-approval-table-wrap/);
  assert.match(settingsHtml, /aria-label="Tabel review koreksi faskes"/);
  assert.match(styleHtml, /Administrasi phase 32: readable approval review tables/);
  assert.match(styleHtml, /\.pd3i-approval-table-wrap \/?\.account-approval-table|\.pd3i-approval-table-wrap \.account-approval-table \{[\s\S]*min-width: 820px/);
  assert.match(styleHtml, /\.pd3i-approval-table-wrap \.account-approval-table th \{[\s\S]*position: sticky;[\s\S]*top: 0/);
  assert.match(styleHtml, /\.pd3i-approval-table-wrap \.account-approval-table th,[\s\S]*\.pd3i-approval-table-wrap \.account-approval-table td \{[\s\S]*vertical-align: top/);
});


test('Panduan Aplikasi phase 33 keeps guide topic cards readable', () => {
  assert.match(workspaceGuideHtml, /pd3i-guide-card/);
  assert.match(styleHtml, /Panduan Aplikasi phase 33: readable guide topic cards/);
  assert.match(styleHtml, /\.pd3i-guide-card \{[\s\S]*display: flex;[\s\S]*flex-direction: column;[\s\S]*gap: var\(--space-3\)/);
  assert.match(styleHtml, /\.pd3i-guide-card \.pd3i-card-header-row \{[\s\S]*margin-bottom: 0/);
  assert.match(styleHtml, /\.pd3i-guide-card \.pd3i-card-title \{[\s\S]*line-height: 1\.25/);
  assert.match(styleHtml, /\.pd3i-guide-card \.pd3i-guide-note \{[\s\S]*margin-top: auto/);
});


test('Beranda phase 34 keeps operational summary cards readable', () => {
  assert.match(workspaceOverviewHtml, /id="overview-kpi-grid" class="pd3i-overview-summary-grid/);
  assert.match(workspaceOverviewHtml, /id="overview-work-summary" class="pd3i-overview-summary-grid/);
  assert.match(styleHtml, /Beranda phase 34: readable operational summary cards/);
  assert.match(styleHtml, /\.pd3i-overview-summary-card \{[\s\S]*display: flex;[\s\S]*flex-direction: column;[\s\S]*justify-content: space-between;[\s\S]*gap: var\(--space-2\)/);
  assert.match(styleHtml, /\.pd3i-overview-summary-card \.pd3i-mini-stat-label \{[\s\S]*line-height: 1\.3/);
  assert.match(styleHtml, /\.pd3i-overview-summary-card small,[\s\S]*\.pd3i-overview-summary-card \.pd3i-helper-text \{[\s\S]*line-height: 1\.45/);
});


test('Beranda phase 35 keeps quick action cards readable and accessible', () => {
  assert.match(workspaceOverviewHtml, /id="overview-quick-actions" class="pd3i-overview-actions"/);
  assert.match(styleHtml, /Beranda phase 35: readable quick action cards/);
  assert.match(styleHtml, /\.pd3i-overview-action-btn \{[\s\S]*gap: var\(--space-3\);[\s\S]*text-align: left;[\s\S]*border: 1px solid var\(--color-border\)/);
  assert.match(styleHtml, /\.pd3i-overview-action-btn:hover:not\(:disabled\) \{[\s\S]*border-color: rgba\(37, 99, 235, 0\.42\)/);
  assert.match(styleHtml, /\.pd3i-overview-action-btn:focus-visible \{[\s\S]*outline: 3px solid var\(--color-focus-ring\);[\s\S]*outline-offset: 2px/);
});


test('Dashboard statistik phase 36 keeps analysis panels and charts readable', () => {
  assert.match(appDashboardJs, /pd3i-dashboard-panel/);
  assert.match(appDashboardJs, /pd3i-dashboard-chart-state/);
  assert.match(styleHtml, /Dashboard statistik phase 36: readable analysis panels and charts/);
  assert.match(styleHtml, /\.pd3i-dashboard-panel \{[\s\S]*min-width: 0;[\s\S]*border: 1px solid var\(--color-border\)/);
  assert.match(styleHtml, /\.pd3i-dashboard-panel-table \{[\s\S]*overflow-x: auto;[\s\S]*-webkit-overflow-scrolling: touch/);
  assert.match(styleHtml, /\.pd3i-dashboard-panel-table table \{[\s\S]*min-width: 720px/);
  assert.match(styleHtml, /\.pd3i-dashboard-chart-state \{[\s\S]*min-height: 260px;[\s\S]*border-radius: var\(--radius-lg\)/);
  assert.match(styleHtml, /@media \(max-width: 900px\) \{[\s\S]*\.pd3i-dashboard-chart-state \{[\s\S]*min-height: 220px/);
});


test('Daftar Kasus phase 37 keeps filter actions readable on mobile', () => {
  assert.match(searchHtml, /class="pd3i-search-toolbar pd3i-filter-toolbar" data-component="FilterToolbar"/);
  assert.match(searchHtml, /id="btn-search-epid" class="pd3i-primary-button pd3i-inline-button"/);
  assert.match(searchHtml, /id="search-sort"[^>]*pd3i-search-sort-select/);
  assert.match(styleHtml, /Daftar Kasus phase 37: readable filter actions and mobile touch targets/);
  assert.match(styleHtml, /\.pd3i-search-actions \{[\s\S]*display: flex;[\s\S]*flex-wrap: wrap;[\s\S]*gap: var\(--space-3\)/);
  assert.match(styleHtml, /\.pd3i-search-actions \.pd3i-inline-button,[\s\S]*\.pd3i-search-actions \.pd3i-search-sort-select \{[\s\S]*min-height: 44px/);
  assert.match(styleHtml, /\.pd3i-search-sort-select \{[\s\S]*min-width: min\(100%, 260px\)/);
  assert.match(styleHtml, /@media \(max-width: 640px\) \{[\s\S]*\.pd3i-search-actions \{[\s\S]*display: grid;[\s\S]*grid-template-columns: 1fr/);
});


test('Panduan Aplikasi phase 38 keeps quick-reference cards compact and touchable', () => {
  assert.match(workspaceGuideHtml, /pd3i-guide-overview-grid/);
  assert.match(workspaceGuideHtml, /pd3i-guide-topic-chip/);
  assert.match(styleHtml, /Panduan Aplikasi phase 38: compact quick-reference cards/);
  assert.match(styleHtml, /\.pd3i-guide-summary-card,[\s\S]*\.pd3i-guide-card \{[\s\S]*min-width: 0;[\s\S]*border: 1px solid var\(--color-border\)/);
  assert.match(styleHtml, /\.pd3i-guide-summary-card p,[\s\S]*\.pd3i-guide-list li,[\s\S]*\.pd3i-guide-note \{[\s\S]*line-height: 1\.5/);
  assert.match(styleHtml, /\.pd3i-guide-topic-chip \{[\s\S]*min-height: 40px;[\s\S]*display: inline-flex;[\s\S]*align-items: center/);
  assert.match(styleHtml, /@media \(max-width: 640px\) \{[\s\S]*\.pd3i-guide-faq-chips \{[\s\S]*display: grid;[\s\S]*grid-template-columns: 1fr/);
});


test('Status dan Klasifikasi phase 39 keeps status action panel readable on mobile', () => {
  assert.match(workspaceStatusHtml, /id="dynamic-form-status"/);
  assert.match(workspaceStatusHtml, /id="btn-submit-status"/);
  assert.match(styleHtml, /Status dan Klasifikasi phase 39: readable status action panel/);
  assert.match(styleHtml, /#dynamic-form-status \.pd3i-form-card-status,[\s\S]*#dynamic-form-status \.pd3i-action-panel-card \{[\s\S]*min-width: 0;[\s\S]*border: 1px solid var\(--color-border\)/);
  assert.match(styleHtml, /#dynamic-form-status \.pd3i-submit-stack \{[\s\S]*display: flex;[\s\S]*flex-wrap: wrap;[\s\S]*gap: var\(--space-3\)/);
  assert.match(styleHtml, /#dynamic-form-status #btn-submit-status \{[\s\S]*min-height: 44px;[\s\S]*white-space: normal/);
  assert.match(styleHtml, /@media \(max-width: 640px\) \{[\s\S]*#dynamic-form-status \.pd3i-action-panel-card \.pd3i-card-header-row,[\s\S]*#dynamic-form-status \.pd3i-submit-stack \{[\s\S]*display: grid;[\s\S]*grid-template-columns: 1fr;[\s\S]*#dynamic-form-status #btn-submit-status \{[\s\S]*width: 100%/);
});


test('Hasil Pemeriksaan phase 40 keeps lab action panel readable on mobile', () => {
  assert.match(workspaceSampelHtml, /id="dynamic-form-sampel"/);
  assert.match(workspaceSampelHtml, /id="btn-submit-sampel"/);
  assert.match(styleHtml, /Hasil Pemeriksaan phase 40: readable lab action panel/);
  assert.match(styleHtml, /#dynamic-form-sampel \.pd3i-form-card-sampel,[\s\S]*#dynamic-form-sampel \.pd3i-action-panel-card \{[\s\S]*min-width: 0;[\s\S]*border: 1px solid var\(--color-border\)/);
  assert.match(styleHtml, /#dynamic-form-sampel \.pd3i-submit-stack \{[\s\S]*display: flex;[\s\S]*flex-wrap: wrap;[\s\S]*gap: var\(--space-3\)/);
  assert.match(styleHtml, /#dynamic-form-sampel #btn-submit-sampel \{[\s\S]*min-height: 44px;[\s\S]*white-space: normal/);
  assert.match(styleHtml, /@media \(max-width: 640px\) \{[\s\S]*#dynamic-form-sampel \.pd3i-action-panel-card \.pd3i-card-header-row,[\s\S]*#dynamic-form-sampel \.pd3i-submit-stack \{[\s\S]*display: grid;[\s\S]*grid-template-columns: 1fr;[\s\S]*#dynamic-form-sampel #btn-submit-sampel \{[\s\S]*width: 100%/);
});


test('Verifikasi EPID phase 41 keeps verification action panel readable on mobile', () => {
  assert.match(workspaceVerifikasiHtml, /id="dynamic-form-verifikasi"/);
  assert.match(workspaceVerifikasiHtml, /id="btn-submit-verifikasi"/);
  assert.match(workspaceVerifikasiHtml, /id="workflow-submit-status-verifikasi"/);
  assert.match(styleHtml, /Verifikasi EPID phase 41: readable verification action panel/);
  assert.match(styleHtml, /#dynamic-form-verifikasi \.pd3i-form-card-verifikasi,[\s\S]*#dynamic-form-verifikasi \.pd3i-action-panel-card \{[\s\S]*min-width: 0;[\s\S]*border: 1px solid var\(--color-border\)/);
  assert.match(styleHtml, /#dynamic-form-verifikasi \.pd3i-submit-stack \{[\s\S]*display: flex;[\s\S]*flex-wrap: wrap;[\s\S]*gap: var\(--space-3\)/);
  assert.match(styleHtml, /#dynamic-form-verifikasi #btn-submit-verifikasi \{[\s\S]*min-height: 44px;[\s\S]*white-space: normal/);
  assert.match(styleHtml, /#dynamic-form-verifikasi #workflow-submit-status-verifikasi \{[\s\S]*min-width: 0;[\s\S]*line-height: 1\.45/);
  assert.match(styleHtml, /@media \(max-width: 640px\) \{[\s\S]*#dynamic-form-verifikasi \.pd3i-action-panel-card \.pd3i-card-header-row,[\s\S]*#dynamic-form-verifikasi \.pd3i-submit-stack \{[\s\S]*display: grid;[\s\S]*grid-template-columns: 1fr;[\s\S]*#dynamic-form-verifikasi #btn-submit-verifikasi \{[\s\S]*width: 100%/);
});

test('Dashboard statistik phase 45 does not expose external preview brand in user UI', () => {
  assert.doesNotMatch(workspaceDashboardHtml, /SIGAP|Sigap|sigap/);
  assert.doesNotMatch(appDashboardJs, /SIGAP|Sigap|sigap/);
});





test('Dashboard statistik phase 48 compacts legacy case KPI cards after reference command KPIs', () => {
  assert.match(appDashboardJs, /pd3i-dashboard-case-kpi-compact/);
  assert.match(appDashboardJs, /aria-label="KPI kasus surveilans ringkas"/);
  assert.match(appDashboardJs, /pd3i-dashboard-metric-card tone-blue is-compact/);
  assert.match(appDashboardJs, /pd3i-dashboard-metric-card tone-rose is-compact/);
  assert.doesNotMatch(appDashboardJs, /perKec/);
  assert.match(appDashboardJs, /wilayahPrioritasCount/);
  assert.match(styleHtml, /Dashboard statistik phase 48: compact legacy case KPI strip/);
  assert.match(styleHtml, /\.pd3i-dashboard-case-kpi-compact \{[\s\S]*grid-template-columns: repeat\(6, minmax\(0, 1fr\)\)/);
  assert.match(styleHtml, /\.pd3i-dashboard-case-kpi-compact \.pd3i-dashboard-metric-card\.is-compact \{[\s\S]*box-shadow: none/);
  assert.match(styleHtml, /text-\\\[11px\\\]/);
  assert.match(styleHtml, /display: none/);
});
test('Dashboard statistik phase 47 follows reference body and case table layout without borrowed brand', () => {
  assert.match(appDashboardJs, /pd3i-dashboard-reference-body-grid/);
  assert.match(appDashboardJs, /pd3i-dashboard-chart-panel/);
  assert.doesNotMatch(appDashboardJs, /pd3i-dashboard-today-panel/);
  assert.doesNotMatch(appDashboardJs, /pd3i-dashboard-command-priorities/);
  assert.match(appDashboardJs, /pd3i-dashboard-reference-cases-card/);
  assert.match(appDashboardJs, /Daftar kasus ringkas/);
  assert.match(appDashboardJs, /Cari nama, EPID, wilayah/);
  assert.match(appDashboardJs, /top-kecamatan-list/);
  assert.match(appDashboardJs, /dashboard-hotspot-map/);
  assert.doesNotMatch(appDashboardJs, /SIGAP|Sigap|sigap/);
  assert.match(styleHtml, /Dashboard statistik phase 47: reference body and case table/);
  assert.match(styleHtml, /\.pd3i-dashboard-reference-body-grid \{[\s\S]*grid-template-columns: minmax\(0, 1\.65fr\) minmax\(300px, 0\.75fr\)/);
  assert.match(styleHtml, /\.pd3i-dashboard-reference-body-grid\.is-chart-only \{[\s\S]*grid-template-columns: minmax\(0, 1fr\)/);
  assert.match(styleHtml, /\.pd3i-dashboard-reference-cases-card \{[\s\S]*box-shadow: var\(--dashboard-ref-shadow\)/);
  assert.match(styleHtml, /\.pd3i-dashboard-reference-table thead tr \{[\s\S]*background: #f8fafc|\.pd3i-dashboard-region-card-head \{[\s\S]*background: #f8fafc/);
  assert.match(styleHtml, /@media \(max-width: 960px\) \{[\s\S]*\.pd3i-dashboard-reference-body-grid \{[\s\S]*grid-template-columns: 1fr/);
});

test('Dashboard statistik uses fast first paint before heavy map render', () => {
  assert.match(appDashboardJs, /renderHtmlFallbackChart\(stats\);/);
  assert.match(appDashboardJs, /deferDashboardHeavyRender\(function\(\) \{[\s\S]*renderHotspotMap\(stats, dx, tahun\)/);
  assert.match(appDashboardJs, /requestIdleCallback|requestAnimationFrame/);
});

test('Dashboard statistik removes duplicated surveillance summary command block', () => {
  assert.doesNotMatch(appDashboardJs, /pd3i-dashboard-reference-command/);
  assert.doesNotMatch(appDashboardJs, /Ringkasan surveilans/);
  assert.doesNotMatch(appDashboardJs, /Monitor beban kasus, tindak lanjut, risiko tinggi, dan kelengkapan data/);
  assert.doesNotMatch(appDashboardJs, /pd3i-dashboard-command-filterbar/);
  assert.doesNotMatch(appDashboardJs, /pd3i-dashboard-command-kpis/);
});

test('Dashboard statistik phase 49 matches full screenshot hierarchy without duplicate priority alert', () => {
  assert.match(appDashboardJs, /pd3i-dashboard-age-analysis/);
  assert.match(appDashboardJs, /pd3i-dashboard-age-card/);
  assert.match(appDashboardJs, /pd3i-dashboard-epi-age-card/);
  assert.doesNotMatch(appDashboardJs, /Prioritas tindak lanjut/);
  assert.doesNotMatch(appDashboardJs, /Prioritas hari ini/);
  assert.doesNotMatch(appDashboardJs, /pd3i-dashboard-today-panel/);
  assert.match(appDashboardJs, /pd3i-dashboard-reference-body-grid is-chart-only/);
  assert.match(styleHtml, /Dashboard statistik phase 49: full-page screenshot parity spacing/);
  assert.match(styleHtml, /\.pd3i-dashboard-reference-body-grid\.is-chart-only \{[\s\S]*grid-template-columns: minmax\(0, 1fr\)/);
  assert.match(styleHtml, /\.pd3i-dashboard-reference-body-grid\.is-chart-only \.pd3i-dashboard-reference-chart \{[\s\S]*min-height: 24rem/);
  assert.match(styleHtml, /\.pd3i-dashboard-age-card,[\s\S]*\.pd3i-dashboard-epi-age-card \{[\s\S]*padding: var\(--space-5\)/);
  assert.match(styleHtml, /\.pd3i-dashboard-age-card \.pd3i-dashboard-month-row \{[\s\S]*padding: var\(--space-3\) 0/);
  assert.match(styleHtml, /\.pd3i-dashboard-reference-skin \.pd3i-dashboard-alert \{[\s\S]*display: none !important/);
});

test('Dashboard statistik phase 50 places age distribution panels in two columns on desktop', () => {
  assert.match(appDashboardJs, /pd3i-dashboard-age-two-column/);
  assert.match(appDashboardJs, /aria-label="Distribusi usia dan kelompok umur epidemiologis"/);
  assert.match(styleHtml, /Dashboard statistik phase 50: age distributions two-column layout/);
  assert.match(styleHtml, /\.pd3i-dashboard-age-two-column \{[\s\S]*display: grid;[\s\S]*grid-template-columns: minmax\(0, 1\.35fr\) minmax\(320px, 0\.85fr\)/);
  assert.match(styleHtml, /@media \(max-width: 1100px\) \{[\s\S]*\.pd3i-dashboard-age-two-column \{[\s\S]*grid-template-columns: 1fr/);
});

test('Dashboard statistik phase 51 shows kecamatan and Depok kelurahan rankings in two clean columns', () => {
  assert.match(appDashboardJs, /topKelurahan/);
  assert.match(appDashboardJs, /pd3i-dashboard-region-two-column/);
  assert.match(appDashboardJs, /10 kecamatan terbanyak/);
  assert.match(appDashboardJs, /10 kelurahan terbanyak/);
  assert.match(appDashboardJs, /luar\\s\+depok\|non\\s\+depok/);
  assert.match(appDashboardJs, /top-kecamatan-list/);
  assert.match(appDashboardJs, /top-kelurahan-list/);
  assert.match(styleHtml, /Dashboard statistik phase 51: clean reference cards and two-column wilayah ranking/);
  assert.match(styleHtml, /\.pd3i-dashboard-analysis-brief > div \{[\s\S]*overflow: hidden;[\s\S]*border: 1px solid var\(--dashboard-ref-border\) !important/);
  assert.match(styleHtml, /\.pd3i-dashboard-region-two-column \{[\s\S]*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(styleHtml, /\.pd3i-dashboard-region-main strong \{[\s\S]*overflow-wrap: anywhere/);
  assert.match(styleHtml, /@media \(max-width: 900px\) \{[\s\S]*\.pd3i-dashboard-region-two-column \{[\s\S]*grid-template-columns: 1fr/);
});

test('Dashboard statistik phase 52 renders Depok kelurahan choropleth from shapefile asset', () => {
  const geoAsset = fs.readFileSync(path.join(root, 'src', 'Views', 'depok_kelurahan.geojson.js.html'), 'utf8');
  assert.match(indexHtml, /include\('depok_kelurahan\.geojson\.js'\)/);
  assert.match(geoAsset, /PD3I_DEPOK_KELURAHAN_GEOJSON/);
  assert.match(geoAsset, /"name":"depok_kelurahan_2010"/);
  assert.match(geoAsset, /"DESA":"PENGASINAN"/);
  assert.match(geoAsset, /"KABKOT":"DEPOK"/);
  assert.match(appDashboardJs, /Peta distribusi penyakit per kelurahan/);
  assert.match(appDashboardJs, /kelurahanCounts/);
  assert.match(appDashboardJs, /window\.L\.geoJSON\(geojson/);
  assert.match(appDashboardJs, /openDashboardDrilldown\('kelurahan'/);
  assert.match(styleHtml, /Dashboard statistik phase 52: kelurahan choropleth map from Depok shapefile/);
  assert.match(styleHtml, /\.pd3i-map-empty-overlay/);
});

test('Dashboard statistik phase 53 matches compact kelurahan names like BAKTIJAYA to spaced shapefile labels', () => {
  assert.match(appDashboardJs, /normalizeMapCompactKey/);
  assert.match(appDashboardJs, /addKelurahanCount\(desa, value\)/);
  assert.match(appDashboardJs, /kelurahanCounts\[normalizeMapCompactKey\(desa\)\]/);
});

test('Route phase 54 keeps current workspace after browser refresh but defaults beranda after login', () => {
  assert.match(appJs, /PD3I_LAST_WORKSPACE_KEY = 'pd3i:last-workspace:v1'/);
  assert.match(appJs, /isBrowserReloadNavigation\(\) \? \(getLastWorkspace\(\) \|\| bootWorkspace \|\| 'overview'\) : bootWorkspace/);
  assert.match(appJs, /if \(opts\.persist !== false\) saveLastWorkspace\(normalized\)/);
  assert.match(appJs, /if \(normalized === 'overview'\) return appUrl/);
  assert.match(appJs, /appUrl \? appUrl \+ '\?workspace=' \+ encodeURIComponent\(normalized\)/);
  assert.match(appDashboardJs, /openSidebarWorkspace\('dashboard', \{ autoLoad: false, useRoute: true \}\)/);
});

test('Panduan Aplikasi phase 55 follows operational FAQ page intro without decorative hero', () => {
  assert.match(workspaceGuideHtml, /pd3i-guide-page-intro/);
  assert.match(workspaceGuideHtml, /Jawab cepat: menu apa yang dibuka, siapa yang bertindak, status apa yang dicek, dan langkah aman berikutnya/);
  ['Menu kerja', 'Status kasus', 'Aksi aman'].forEach((copy) => {
    assert.match(workspaceGuideHtml, new RegExp(copy));
  });
  assert.doesNotMatch(workspaceGuideHtml, /pd3i-hero-card pd3i-guide-hero/);
  assert.match(workspaceGuideHtml, /Tidak membaca, menulis, atau mengubah data kasus/);
  assert.match(styleHtml, /Panduan Aplikasi phase 55: operational FAQ page intro/);
  assert.match(styleHtml, /\.pd3i-guide-page-intro \{[\s\S]*grid-template-columns: minmax\(0, 1\.35fr\) minmax\(260px, 0\.65fr\)/);
  assert.match(styleHtml, /\.pd3i-guide-intro-checks span \{[\s\S]*min-height: 40px/);
});

test('Daftar Kasus uses clean registry without orientation strip clutter', () => {
  assert.doesNotMatch(searchHtml, /pd3i-search-registry-orientation/);
  ['Identitas dulu', 'Status terbaca', 'Aksi utama jelas'].forEach((copy) => {
    assert.doesNotMatch(searchHtml, new RegExp(copy));
  });
});

test('Beranda phase 57 shows next safe action on priority work cards', () => {
  ['Langkah aman: buka verifikasi, cek kelengkapan, lalu putuskan EPID', 'Langkah aman: buka Daftar Kasus, cocokkan identitas, lalu koreksi field yang diminta', 'Langkah aman: buka lab, cocokkan kasus, lalu isi hasil sesuai dokumen pemeriksaan', 'Langkah aman: buka status, cek kondisi akhir, lalu simpan klasifikasi terbaru'].forEach((copy) => {
    assert.match(appJs, new RegExp(copy));
  });
  assert.match(appJs, /pd3i-overview-task-next/);
  assert.match(styleHtml, /Beranda phase 57: next safe action on priority cards/);
  assert.match(styleHtml, /\.pd3i-overview-task-next \{[\s\S]*font-weight: 700/);
});

test('Administrasi phase 58 adds sensitive decision gate before system changes', () => {
  const settingsHtml = fs.readFileSync(path.join(root, 'src', 'Views', 'workspace_settings.html'), 'utf8');
  assert.match(settingsHtml, /pd3i-admin-decision-gate/);
  ['1. Validasi pemohon', '2. Nilai dampak', '3. Simpan hanya bila siap diaudit'].forEach((copy) => {
    assert.match(settingsHtml, new RegExp(copy.replace('.', '\\.')));
  });
  assert.match(settingsHtml, /Jika alasan, pelaku, atau dampak belum jelas, tunda perubahan/);
  assert.match(styleHtml, /Administrasi phase 58: sensitive decision gate/);
  assert.match(styleHtml, /\.pd3i-admin-decision-gate \{[\s\S]*grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/);
  assert.match(styleHtml, /\.pd3i-admin-decision-gate > div\.is-sensitive \{/);
  assert.match(styleHtml, /@media \(max-width: 900px\) \{[\s\S]*\.pd3i-admin-decision-gate \{[\s\S]*grid-template-columns: 1fr/);
});

test('Zero Reporting form removes weekly decision gate accessory copy', () => {
  const zeroReportingHtml = fs.readFileSync(path.join(root, 'src', 'Views', 'workspace_sars.html'), 'utf8');
  assert.doesNotMatch(zeroReportingHtml, /pd3i-zero-reporting-weekly-gate/);
  ['1. Tetapkan periode', '2. Audit sumber kasus', '3. Kirim keputusan akhir'].forEach((copy) => {
    assert.doesNotMatch(zeroReportingHtml, new RegExp(copy.replace('.', '\\.')));
  });
  assert.doesNotMatch(zeroReportingHtml, /Cek register poli, IGD, rawat inap, laboratorium, dan laporan jejaring sebelum nihil/);
  assert.doesNotMatch(zeroReportingHtml, /Centang nihil hanya setelah semua sumber dicek/);
});

test('Hasil pemeriksaan submit area stays clean without next-action note', () => {
  const sampelHtml = fs.readFileSync(path.join(root, 'src', 'Views', 'workspace_sampel_form.html'), 'utf8');
  assert.doesNotMatch(sampelHtml, /pd3i-sampel-next-action/);
  assert.doesNotMatch(sampelHtml, /Langkah aman sebelum simpan/);
});

test('Shared SIRFK component contract exists for tables, fields, and UI states', () => {
  const utilsHtml = fs.readFileSync(path.join(root, 'src', 'Views', 'utils.js.html'), 'utf8');
  const appHtml = fs.readFileSync(path.join(root, 'src', 'Views', 'app.js.html'), 'utf8');
  assert.match(utilsHtml, /function renderPd3iTable\(options\)/);
  assert.match(utilsHtml, /data-table-model="sirfk"/);
  assert.match(utilsHtml, /function renderPd3iField\(options\)/);
  assert.match(utilsHtml, /window\.renderPd3iTable = renderPd3iTable/);
  assert.match(styleHtml, /\.pd3i-component-table \{/);
  assert.match(styleHtml, /\.pd3i-component-field \{/);
  assert.match(appHtml, /data-component="DynamicFieldset"/);
  assert.match(appHtml, /data-table-model="sirfk"/);
  assert.match(appHtml, /class="pd3i-dynamic-table[^\"]*pd3i-data-table/);
});

test('Dashboard statistik never leaves spinner stuck when server stalls', () => {
  const dashboardJs = fs.readFileSync(path.join(root, 'src', 'Views', 'app.dashboard.js.html'), 'utf8');
  assert.match(dashboardJs, /const timeoutId = setTimeout\(function\(\) \{/);
  assert.match(dashboardJs, /Dashboard belum merespons\. Klik Muat data lagi dalam beberapa detik\./);
  assert.match(dashboardJs, /content\.dataset\.loadingKey = '';[\s\S]*content\.dataset\.loadingStarted = '';/);
  assert.match(dashboardJs, /clearTimeout\(timeoutId\);/);
  assert.doesNotMatch(dashboardJs, /createWorkspaceRuntimeGuard\('dashboard'\)/);
});
