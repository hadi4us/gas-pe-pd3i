const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const appHtmlRaw = fs.readFileSync(path.join(__dirname, '..', 'src', 'Views', 'app.js.html'), 'utf8');
const appInitHtmlRaw = fs.readFileSync(path.join(__dirname, '..', 'src', 'Views', 'app.init.js.html'), 'utf8');
const appHtml = appHtmlRaw + '\n' + appInitHtmlRaw;
const authHtml = fs.readFileSync(path.join(__dirname, '..', 'src', 'Auth', 'auth.js.html'), 'utf8');
const loginHtml = fs.readFileSync(path.join(__dirname, '..', 'src', 'Auth', 'login.html'), 'utf8');
const pinHtml = fs.readFileSync(path.join(__dirname, '..', 'src', 'Auth', 'pin.html'), 'utf8');
const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'src', 'Views', 'index.html'), 'utf8');
const workspaceSampelHtml = fs.readFileSync(path.join(__dirname, '..', 'src', 'Views', 'workspace_sampel_form.html'), 'utf8');
const workspaceVerifikasiHtml = fs.readFileSync(path.join(__dirname, '..', 'src', 'Views', 'workspace_verifikasi_form.html'), 'utf8');
const workspaceSearchHtml = fs.readFileSync(path.join(__dirname, '..', 'src', 'Views', 'workspace_search.html'), 'utf8');
const styleHtml = fs.readFileSync(path.join(__dirname, '..', 'src', 'Views', 'style.html'), 'utf8');
const utilsHtml = fs.readFileSync(path.join(__dirname, '..', 'src', 'Views', 'utils.js.html'), 'utf8');
const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
const endpointSecurityScript = fs.readFileSync(path.join(__dirname, '..', 'scripts', 'check-endpoint-security.js'), 'utf8');

test('credential UI uses email OTP login like e-PWS Imunisasi', () => {
  assert.match(loginHtml, /Sistem Surveilans Penyakit yang Dapat Dicegah Dengan Imunisasi/);
  assert.match(loginHtml, />Email</);
  assert.match(loginHtml, /id="login-email" type="email"/);
  assert.match(loginHtml, /placeholder="Masukkan email Anda"/);
  assert.match(loginHtml, /id="btn-send-otp"/);
  assert.match(loginHtml, />Kirim OTP</);
  assert.match(loginHtml, /id="login-otp" type="text" inputmode="numeric" maxlength="6"/);
  assert.match(pinHtml, /Ubah Password Akses/);
  assert.match(pinHtml, />Password Lama</);
  assert.match(pinHtml, />Password Baru</);
  assert.match(pinHtml, />Konfirmasi Password Baru</);
  assert.match(pinHtml, /id="pin-old" type="password"/);
  assert.match(pinHtml, /id="pin-new" type="password"/);
  assert.match(pinHtml, /id="pin-new2" type="password"/);
  assert.doesNotMatch(pinHtml, /id="pin-(old|new|new2)"[^>]*inputmode="numeric"/);
  assert.doesNotMatch(indexHtml, /Ubah Password/);
  assert.match(indexHtml, /id="btn-logout"[\s\S]*Keluar/);
  assert.match(authHtml, /Email dan OTP wajib diisi\./);
  assert.match(authHtml, /requestLoginOtp\(email\)/);
  assert.match(authHtml, /verifyLoginOtp\(email, otp\)/);
  assert.match(authHtml, /Password baru minimal 6 karakter\./);
});

test('verification success modal replaces original action buttons to avoid resetForNewEntry listener', () => {
  assert.match(appHtml, /function replaceVerificationSuccessButton\(button, label, modal, action\)/);
  assert.match(appHtml, /const clone = button\.cloneNode\(true\);/);
  assert.match(appHtml, /delete clone\.dataset\.bound;/);
  assert.match(appHtml, /ev\.stopImmediatePropagation/);
  assert.match(appHtml, /button\.parentNode\.replaceChild\(clone, button\);/);
  assert.match(appHtml, /if \(action === 'queue'\) \{\s*returnToVerificationQueueAfterSave\(\);\s*\}/);
});

test('verification modal redirect buttons have distinct actions after original showSuccessModal binds them', () => {
  assert.match(appHtml, /document\.getElementById\('btn-new-entry'\)/);
  assert.match(appHtml, /document\.getElementById\('btn-close-success'\)/);
  assert.match(appHtml, /replaceVerificationSuccessButton\(queueBtn, 'Kembali ke Daftar Verifikasi', refs\.modal, 'queue'\)/);
  assert.match(appHtml, /replaceVerificationSuccessButton\(stayBtn, 'Tetap di Halaman Verifikasi', refs\.modal, 'stay'\)/);
  assert.doesNotMatch(appHtml, /const result = arguments\[0\] \|\| \{\};\s*const shouldReturnToQueue = isVerificationWorkspaceActive\(\);/);
});

test('successful workflow save resets submit button before success modal or queue refresh leaves UI idle', () => {
  assert.match(appHtml, /if \(res && res\.status === "success"\) \{[\s\S]*?clearFormDraft\(\);[\s\S]*?resetSubmitButtonByMode\(submitMode\);[\s\S]*?showSuccessModal\(/);
});

test('verification save gives local feedback, timeout, and modal confirmation for every outcome', () => {
  assert.match(workspaceVerifikasiHtml, /id="workflow-submit-status-verifikasi"[^>]*role="status"[^>]*aria-live="polite"/);
  assert.match(appHtml, /const WORKFLOW_SAVE_TIMEOUT_MS = 45000/);
  assert.match(appHtml, /function withWorkflowSaveTimeout\(promise, label\)/);
  assert.match(appHtml, /setWorkflowSubmitFeedback\(submitMode, 'Menyimpan verifikasi ke server\.\.\.', null\)/);
  assert.match(appHtml, /showWorkflowSubmitError\(submitMode, 'Pada tahap verifikasi admin harus memilih status Terverifikasi atau Perlu Revisi\.'\)/);
  assert.match(appHtml, /res = await withWorkflowSaveTimeout\(saveFormViaGsRun\(dataObj\), 'Simpan verifikasi EPID'\)/);
  assert.match(appHtml, /if \(!\/google\\\.script\\\.run tidak tersedia\/i\.test\(gsMessage\)\) \{\s*throw gsErr;\s*\}/);
  assert.match(appHtml, /const verificationDoneMessage = \(res\.nextWorkflowLabel \|\| res\.message \|\| 'Verifikasi selesai'\) \+ '\. Daftar verifikasi sudah diperbarui\.'/);
  assert.match(appHtml, /showSuccessModal\(\s*verificationDoneMessage,\s*'',\s*\{ dx: dxSaved, epid: epidSaved, token: SESSION_TOKEN \}\s*\)/);
  assert.match(styleHtml, /\.pd3i-helper-text\.is-loading[\s\S]*?color: #1d4ed8/);
  assert.match(styleHtml, /\.pd3i-helper-text\.is-success[\s\S]*?color: #047857/);
  assert.match(styleHtml, /\.pd3i-helper-text\.is-error[\s\S]*?color: #b91c1c/);
});

const routesJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'Controllers', 'routes.js'), 'utf8');
const authJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'Auth', 'auth.js'), 'utf8');
const dashboardJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'Controllers', 'dashboard.js'), 'utf8');
const dataJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'DataWarehouse', 'data.js'), 'utf8');
const printJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'Controllers', 'print.js'), 'utf8');
const appDashboardHtml = fs.readFileSync(path.join(__dirname, '..', 'src', 'Views', 'app.dashboard.js.html'), 'utf8');

test('record serialization hardens free-text values before writing to Sheets', () => {
  assert.match(dataJs, /function sanitizeSheetTextValue_\(value, header\)/);
  assert.match(dataJs, /replace\(\/\[\\x00-\\x08\\x0B\\x0C\\x0E-\\x1F\\x7F\]\+\/g, ""\)/);
  assert.match(dataJs, /FORMULA_INJECTION_PREFIX_RE_\s*=\s*\/\^\[=\\\+\\\-@\]/);
  assert.match(dataJs, /if \(FORMULA_INJECTION_PREFIX_RE_\.test\(text\)\) \{\s*text = "'" \+ text;/);
  assert.match(dataJs, /if \(text\.length > maxLength\) \{\s*text = text\.slice\(0, maxLength\);\s*\}/);
  assert.match(dataJs, /result\[h\] = sanitizeSerializedValueForSheet_\(val, h\);/);
});

test('print endpoint routes each diagnosis to its own PDF template', () => {
  assert.match(printJs, /const templateByDx = \{/);
  ['MR', 'DIF', 'PERT', 'TN', 'AFP'].forEach((dx) => {
    assert.match(printJs, new RegExp(dx + ': "Views/print_' + dx + '"'));
  });
  assert.match(printJs, /return templateByDx\[dx\] \|\| "Views\/print_MR"/);
});

test('dynamic table serialization sanitizes nested string cells before JSON storage', () => {
  assert.match(dataJs, /function sanitizeStructuredValueForSheet_\(value, header\)/);
  assert.match(dataJs, /Array\.isArray\(value\)[\s\S]*?return value\.map\(function \(item\) \{[\s\S]*?sanitizeStructuredValueForSheet_\(item, header\)/);
  assert.match(dataJs, /Object\.keys\(value\)\.forEach\(function \(key\) \{[\s\S]*?result\[key\] = sanitizeStructuredValueForSheet_\(value\[key\], key\)/);
  assert.match(dataJs, /val = sanitizeStructuredValueForSheet_\(val, h\);[\s\S]*?val = JSON\.stringify\(val\);/);
});

test('workflow stage saves follow queue-first blueprint and only offer PDF after EPID verification', () => {
  assert.match(routesJs, /notifyWaha: true/);
  assert.match(routesJs, /const shouldNotifyWaha = policy\.notifyWaha && !\(isSameFingerprint && prevWahaStatus === "SENT"\)/);
  assert.match(routesJs, /_sendWahaPd3iNotification_\(dx, savedRecord, saved, printUrl\)/);
  assert.match(routesJs, /"Status Notifikasi WAHA": wahaNotify\.sent \? "SENT"/);
  assert.match(appHtml, /refreshWorkflowInbox\(\{ forceRefresh: true \}\)/);
  assert.match(appHtml, /btnPrint\.classList\.add\("hidden", "opacity-60", "pointer-events-none"\)/);
  assert.match(appHtml, /btnPrint\.classList\.remove\("hidden", "opacity-60", "pointer-events-none"\)/);
  assert.match(appHtml, /activeStageNormalized === 'section-verifikasi'[\s\S]*?openSidebarWorkspace\('verifikasi', \{ scroll: false, skipRecordReload: true \}\)[\s\S]*?verificationStatusSaved === 'Terverifikasi' && printUrl[\s\S]*?PDF PE sudah tersedia setelah verifikasi EPID[\s\S]*?showSuccessModal\(/);
  assert.match(appHtml, /activeStageNormalized === 'section-verifikasi'[\s\S]*?else \{[\s\S]*?Daftar verifikasi sudah diperbarui/);
  assert.match(appHtml, /activeStageNormalized === 'section-sampel'[\s\S]*?openSidebarWorkspace\('sampel', \{ scroll: true, skipRecordReload: true \}\)/);
  assert.match(appHtml, /activeStageNormalized === 'section-status'[\s\S]*?openSidebarWorkspace\('status', \{ scroll: true, skipRecordReload: true \}\)/);
});



test('queue workspaces reset stale diagnosis filters to show all diagnoses', () => {
  assert.match(appHtml, /const diagnosisFilter = document\.getElementById\('search-diagnosis'\);/);
  assert.match(appHtml, /\['verifikasi', 'sampel', 'status'\]\.includes\(normalized\) && diagnosisFilter/);
  assert.match(appHtml, /diagnosisFilter\.value = 'ALL';/);
  assert.match(appHtml, /if \(saved\) \{[\s\S]*?applyWorkflowSearchFilters\(saved\);[\s\S]*?applySearchDefaultsForWorkspace\(normalized\);[\s\S]*?saveWorkflowSearchFiltersForWorkspace\(normalized\);[\s\S]*?\} else \{/);
});

test('workflow inbox can bypass cache after mutations and uses short operational ttl', () => {
  assert.match(dashboardJs, /function getWorkflowInbox\(dx, token, options\)/);
  assert.match(dashboardJs, /const forceRefresh = !!\(options\.forceRefresh \|\| options\.noCache \|\| options\.bustCache\)/);
  assert.match(dashboardJs, /if \(cache && !forceRefresh\)/);
  assert.match(dashboardJs, /cache\.put\(cacheKey, JSON\.stringify\(cachedResult\), 15\)/);
  assert.match(appHtml, /\.getWorkflowInbox\(dx, SESSION_TOKEN, \{ forceRefresh: !!options\.forceRefresh, workspace: workspace \}\)/);
});

test('workflow inbox refresh never skips a newer menu request while loading', () => {
  assert.match(appHtml, /var _PD3I_WORKFLOW_INBOX_CALL_ID = 0/);
  assert.match(appHtml, /const callId = \+\+_PD3I_WORKFLOW_INBOX_CALL_ID/);
  assert.match(appHtml, /if \(callId !== _PD3I_WORKFLOW_INBOX_CALL_ID\) \{ pd3iDebugLog_\('\[PD3I v2\] superseded call, ignoring'\); return; \}/);
  assert.doesNotMatch(appHtml, /WORKFLOW_INBOX_CALL_ACTIVE/);
  assert.doesNotMatch(appHtml, /refreshWorkflowInbox call superseded by newer call, skipping/);
});

test('workflow inbox returns complete queues so workspace filters can find older kelurahan matches', () => {
  assert.match(dashboardJs, /Client-side filters need full/);
  assert.match(dashboardJs, /pendingVerification: \(workspace === 'verifikasi' \|\| !workspace\) \? \(result\.pendingVerification \|\| \[\]\) : \[\]/);
  assert.match(dashboardJs, /revisionQueue: \(workspace === 'verifikasi' \|\| workspace === 'input' \|\| workspace === 'edit' \|\| workspace === 'search' \|\| !workspace\) \? \(result\.revisionQueue \|\| \[\]\) : \[\]/);
  assert.match(dashboardJs, /verificationDone: \(workspace === 'verifikasi' \|\| workspace === 'sampel' \|\| !workspace\) \? \(result\.verificationDone \|\| \[\]\) : \[\]/);
  assert.match(dashboardJs, /sampleQueue: \(workspace === 'sampel' \|\| !workspace\) \? \(result\.sampleQueue \|\| \[\]\) : \[\]/);
  assert.match(dashboardJs, /statusQueue: \(workspace === 'status' \|\| !workspace\) \? \(result\.statusQueue \|\| \[\]\) : \[\]/);
  assert.doesNotMatch(dashboardJs, /pendingVerification: \(result\.pendingVerification \|\| \[\]\)\.slice\(0, 8\)/);
  assert.doesNotMatch(dashboardJs, /statusQueue: \(result\.statusQueue \|\| \[\]\)\.slice\(0, 8\)/);
});

test('deferred workflow saves can target pending records by registration id before final EPID exists', () => {
  assert.match(routesJs, /data\["ID Registrasi Kasus"\]/);
  assert.match(routesJs, /data\.RAW_ROW_NUMBER/);
  assert.match(routesJs, /data\["Nomor EPID"\]/);
  assert.doesNotMatch(routesJs, /normalizedStage !== "section-pelapor" && !String\(\(data && data\["Nomor EPID"\]\)/);
});


test('Edit Inputan has its own workspace and safe initial-report save marker', () => {
  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'src', 'Views', 'index.html'), 'utf8');
  const rawSchemaJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'Core', 'raw_schema.js'), 'utf8');
  assert.match(indexHtml, /data-sidebar-workspace="search"[\s\S]*?>Daftar Kasus</);
  assert.doesNotMatch(indexHtml, /data-sidebar-workspace="edit"[\s\S]*?>Koreksi Data Awal</);
  assert.match(appHtml, /search:\s*'saveInitialReportEdit'/);
  assert.match(appHtml, /__editMode = 'initial_report'/);
  assert.match(routesJs, /function updateInitialReport\(token, payload\)/);
  assert.match(routesJs, /function _sanitizeInitialReportEditPayload_/);
  assert.match(rawSchemaJs, /"Edited At"/);
  assert.match(rawSchemaJs, /"Edit Inputan Perlu Review Ulang"/);
});

test('workflow route exposes one Daftar Kasus workspace while preserving internal edit saves and stage-specific queues', () => {
  assert.match(routesJs, /"overview", "search", "input", "verifikasi", "sampel", "status", "zero-reporting-form", "zero-reporting-dashboard", "sars-form", "sars-dashboard", "guide", "pie"/);
  assert.doesNotMatch(routesJs, /"overview", "search", "input", "edit", "verifikasi", "sampel", "status", "guide"/);
  assert.match(appHtml, /\['search', 'edit', 'verifikasi', 'sampel', 'status'\]\.includes\(normalized\)/);
  assert.match(appHtml, /const allowed = new Set\(\['overview', 'search', 'edit', 'input', 'zero-reporting-form', 'zero-reporting-dashboard', 'pie', 'guide'\]\)/);
  assert.match(appHtml, /if \(isSuperAdminUiRole\(role\)\) allowed\.add\('settings'\)/);
  assert.match(appHtml, /requestedWorkspace === 'edit' \? 'edit' : 'search'/);
});

test('Daftar Kasus replaces duplicate search/edit menu and supports multi-variable filters plus edit/delete actions', () => {
  assert.match(indexHtml, /data-sidebar-workspace="search"[\s\S]*?>Daftar Kasus</);
  assert.doesNotMatch(indexHtml, /data-sidebar-workspace="edit"[\s\S]*?>Koreksi Data Awal</);
  assert.match(appHtml, /title: 'Daftar Kasus'/);
  assert.match(appHtml, /search: 'Daftar Kasus'/);
  assert.match(appHtml, /isViewerMode \? 'Buka \/ Lihat' : 'Edit'/);
  assert.match(appHtml, /class=\"pd3i-search-result-action is-edit\"/);
  assert.match(styleHtml, /\.pd3i-search-result-cta-wrap \{[\s\S]*?gap: 0\.7rem;[\s\S]*?flex-wrap: wrap;/);
  assert.match(styleHtml, /\.pd3i-search-result-action\.is-edit \{[\s\S]*?#3b82f6[\s\S]*?#1d4ed8/);
  assert.match(styleHtml, /\.pd3i-search-result-action\.is-danger \{[\s\S]*?#ef4444[\s\S]*?#dc2626/);
  assert.match(workspaceSearchHtml, /id="search-diagnosis"/);
  assert.match(workspaceSearchHtml, /<select id="search-kecamatan"[\s\S]*?Semua kecamatan/);
  assert.match(workspaceSearchHtml, /<select id="search-kelurahan"[\s\S]*?Semua kelurahan/);
  assert.match(workspaceSearchHtml, /<select id="search-status-kasus"[\s\S]*?Semua status kasus\/pasien/);
  assert.doesNotMatch(workspaceSearchHtml, /<input[^>]+id="search-(kecamatan|kelurahan|status-kasus)"/);
  assert.match(appHtml, /function populateWorkflowFilterDropdowns\(preservedValues\)/);
  assert.match(appHtml, /\.getWorkflowFilterOptions\(SESSION_TOKEN\)/);
  assert.match(appHtml, /populateWorkflowKelurahanFilterOptions\(''\)/);
  assert.match(appHtml, /populateWorkflowStatusKasusFilterOptions\(''\)/);
  assert.match(authHtml, /window\.loadWorkflowFilterOptions\) window\.loadWorkflowFilterOptions\(true\)/);
  assert.match(appHtml, /diagnosis: \(document\.getElementById\('search-diagnosis'\)/);
  assert.match(appHtml, /kelurahan: \(document\.getElementById\('search-kelurahan'\)/);
  assert.match(appHtml, /function deleteCaseRecordFromList\(recordKey, dx, triggerButton\)/);
  assert.match(appHtml, /item\.canDelete === true/);
  assert.match(appHtml, /isPendingVerification/);
  assert.match(appHtml, /typeof item\.canDelete === 'undefined' && !isViewerMode && \(isAdminMode \|\| isPendingVerification\)/);
  assert.match(appHtml, /Mode lihat tidak dapat menghapus data kasus/);
  assert.match(appHtml, /Hapus data kasus ini/);
  assert.match(appHtml, /\.deleteCaseRecord\(SESSION_TOKEN, \{ dx: dx, recordKey: recordKey \}\)/);
  assert.match(routesJs, /case 'deleteCaseRecord': return deleteCaseRecord\(token, payload\);/);
  assert.match(routesJs, /function deleteCaseRecord\(token, payload\)/);
  assert.match(routesJs, /function _canSessionDeleteCaseRecord_\(sess, dx, data\)/);
  assert.match(routesJs, /_isAdminRole_\(role\)\) return true/);
  assert.match(routesJs, /viewer", "readonly", "read_only", "read-only"/);
  assert.match(routesJs, /verificationStatus === 'PENDING'/);
  assert.match(routesJs, /_canSessionReadRecordByScope_\(sess, dx, data \|\| \{\}\)/);
  assert.match(routesJs, /item\.canDelete = _canSessionDeleteCaseRecord_\(sess, dxItem, record\)/);
  assert.match(routesJs, /["']Deleted At["']/);
  assert.match(routesJs, /const diagnosisNeedle = String\(filters\.diagnosis \|\| filters\.dxFilter \|\| ''\)/);
  assert.match(routesJs, /if \(diagnosisNeedle && diagnosisNeedle !== 'ALL' && String\(item\.dx \|\| ''\)\.toUpperCase\(\) !== diagnosisNeedle\) return;/);
  assert.match(routesJs, /function getWorkflowFilterOptions\(token\)/);
  assert.match(routesJs, /getSheetOrNull_\('REF_PENGAMPU'\)/);
  assert.match(routesJs, /const canSeeAllReferenceWilayah = _isAdminRole_\(role\) \|\| scopeLevel === 'dinkes'/);
  assert.match(routesJs, /const isRowInUserScope = function\(row\)/);
  assert.match(routesJs, /if \(!isRowInUserScope\(row\)\) return;/);
  assert.match(routesJs, /userKodePuskesmas && rowKode && userKodePuskesmas === rowKode/);
  assert.match(routesJs, /userUnitKerja && rowNama && userUnitKerja === rowNama/);
  assert.match(routesJs, /replace\(\/\\b\(PKM\|PUSKESMAS\)\\b\/g, ''\)/);
  assert.match(routesJs, /userUnitAlias && rowNamaAlias && userUnitAlias === rowNamaAlias/);
  assert.match(routesJs, /kelurahanByKecamatan/);
  assert.match(routesJs, /const kecamatanNeedle = String\(filters\.kecamatan \|\| ''\)/);
  assert.match(routesJs, /const statusKasusNeedle = String\(filters\.statusKasus \|\| ''\)/);
});

test('sidebar hides admin-only dashboard and verification menus for petugas/puskesmas sessions', () => {
  assert.match(appHtml, /function getAllowedSidebarWorkspacesForUser\(user\)/);
  assert.match(appHtml, /isAdminUiRole\(role\)[\s\S]*?allowed\.add\('dashboard'\)/);
  assert.match(appHtml, /isAdminUiRole\(role\)[\s\S]*?allowed\.add\('verifikasi'\)/);
  assert.match(appHtml, /if \(caps\.writeStages\.indexOf\('section-sampel'\) !== -1\) allowed\.add\('sampel'\)/);
  assert.match(appHtml, /quickActions[\s\S]*?allowedWorkspaces\.has\(item\.workspace\)/);
  assert.match(appHtml, /document\.querySelectorAll\('\.pd3i-nav-link\[data-sidebar-workspace\]'\)[\s\S]*?getAllowedSidebarWorkspacesForUser\(SESSION_USER\)[\s\S]*?link\.classList\.toggle\('hidden', !allowedWorkspaces\.has\(workspace\)\)/);
  assert.match(appHtml, /if \(SESSION_USER && !canAccessSidebarWorkspace\(normalized, SESSION_USER\)\)[\s\S]*?openSidebarWorkspace\('overview'/);
  assert.match(appDashboardHtml, /if \(typeof canAccessSidebarWorkspace === 'function' && !canAccessSidebarWorkspace\('dashboard', SESSION_USER\)\)/);
});

test('sample workspace lists admin-verified cases and offers PE print only when EPID exists', () => {
  assert.match(appHtml, /const visibleVerified = \['verifikasi', 'sampel'\]\.includes\(workspace\) \? filterQueueItemsForWorkspace\(verificationDone, workspace\) : \[\]/);
  assert.match(appHtml, /Kasus sudah diverifikasi admin/);
  assert.match(appHtml, /function renderVerifiedSampleCaseTable\(items\)/);
  assert.match(appHtml, /buildClientPrintUrl\(item && item\.dx, item && item\.epid, SESSION_TOKEN\)/);
  assert.doesNotMatch(dashboardJs, /Nomor EPID Final/);
  assert.match(dashboardJs, /const epid = epidMain/);
  assert.match(appHtml, /item && item\.epid[\s\S]*?Cetak Form PE/);
  assert.match(appHtml, /Nomor EPID belum tersedia/);
});

test('switching sidebar menus ends the currently opened case form session', () => {
  assert.match(appHtml, /function shouldClearActiveRecordOnWorkspaceChange\(previousWorkspace, nextWorkspace, options\)/);
  assert.match(appHtml, /previousNormalized !== nextNormalized/);
  assert.match(appHtml, /opts\.skipRecordReload \|\| opts\.preserveOpenRecord/);
  assert.match(appHtml, /shouldClearActiveRecordOnWorkspaceChange\(previousWorkspace, normalized, opts\)[\s\S]*?clearActiveRecordContext\(\{ skipLayout: true \}\)/);
  assert.doesNotMatch(appHtml, /if \(!opts\.skipRecordReload && \['search', 'edit', 'verifikasi', 'sampel', 'status'\]\.includes\(normalized\) && activeRecordKey/);
});



test('Daftar Kasus and Verifikasi back-to-list controls clear open record without stale detail', () => {
  assert.match(appHtmlRaw, /\[data-pd3i-back-to-case-list\]/);
  assert.match(appHtmlRaw, /clearActiveRecordContext\(\{ workspace: workspaceKey, keepSearchResults: true \}\)/);
  assert.match(appHtmlRaw, /window\.__PD3I_WORKFLOW_LIST_COLLAPSED__\[workspaceKey\] = false/);
  assert.match(appHtmlRaw, /openSidebarWorkspace\(\['verifikasi', 'sampel', 'status'\]\.includes\(workspaceKey\) \? workspaceKey : 'search', \{ scroll: true, skipRecordReload: true \}\)/);
  assert.match(workspaceSearchHtml + workspaceVerifikasiHtml, /Kembali ke daftar kasus|Kembali ke daftar verifikasi/);
  assert.match(styleHtml, /\.pd3i-back-to-list-btn/);
});

test('opening Daftar Kasus or Verifikasi menu resets active detail to list-first view', () => {
  assert.match(appHtmlRaw, /if \(normalized === 'search' \|\| normalized === 'edit'\) \{[\s\S]*?clearActiveRecordContext\(\{ workspace: normalized, skipLayout: true \}\)/);
  assert.match(appHtmlRaw, /if \(\['verifikasi', 'sampel', 'status'\]\.includes\(normalized\) && !opts\.skipRecordReload && !opts\.preserveOpenRecord[\s\S]*?clearActiveRecordContext\(\{ workspace: normalized, skipLayout: true \}\)/);
  assert.match(appHtmlRaw, /window\.__PD3I_WORKFLOW_LIST_COLLAPSED__\[normalized\] = false/);
});



test('Daftar Kasus row action opens edit workspace and does not render workflow inbox after edit load', () => {
  assert.match(appInitHtmlRaw, /workspace: &quot;edit&quot;, workflowIntent: &quot;section-pelapor&quot;, skipWorkflowInboxRefresh: true/);
  assert.match(fs.readFileSync(path.join(__dirname, '..', 'src', 'Views', 'app.dashboard.js.html'), 'utf8'), /window\._loadRecordFromSearch_\(recordKey, dxValue \|\| dx \|\| 'MR', \{[\s\S]*?workspace: 'edit',[\s\S]*?workflowIntent: 'section-pelapor',[\s\S]*?skipWorkflowInboxRefresh: true/);
  assert.match(appInitHtmlRaw, /const requestedStageBeforeLoad = opts\.workflowIntent[\s\S]*?normalizeWorkflowStepId\(opts\.workflowIntent\)/);
  assert.match(appInitHtmlRaw, /if \(!opts\.skipWorkflowInboxRefresh && \['verifikasi', 'sampel', 'status'\]\.includes\(openedWorkspace\)\) \{\s*refreshWorkflowInbox\(\);\s*\}/);
  assert.match(appInitHtmlRaw, /openSidebarWorkspace\(openedWorkspace, \{ scroll: false, skipRecordReload: true, preserveOpenRecord: true \}\)/);
  assert.match(appHtmlRaw, /if \(workspace === 'search'\) return 'Edit kasus'/);
});

test('Daftar Kasus menu loads revision workflow inbox but edit workspace clears it', () => {
  assert.match(appHtmlRaw, /if \(normalized === 'search'\) \{\s*refreshWorkflowInbox\(\);\s*\} else \{\s*clearWorkflowInboxUi\(\);\s*\}/);
  assert.match(appHtmlRaw, /if \(\['search', 'verifikasi', 'sampel', 'status'\]\.includes\(workspace\)\) \{[\s\S]*?renderPd3iSkeleton\(\{ title: 'Memuat daftar kerja…'/);
});

test('Daftar Kasus search uses short client cache and refined loading skeleton', () => {
  assert.match(appHtmlRaw, /let WORKSPACE_SEARCH_RESULT_CACHE = \{\}/);
  assert.match(appHtmlRaw, /function getWorkspaceSearchResultCache\(workspace, dx, filters\)/);
  assert.match(appHtmlRaw, /Date\.now\(\) - entry\.at\) > 20000/);
  assert.match(appInitHtmlRaw, /const cachedSearchData = typeof getWorkspaceSearchResultCache === 'function'/);
  assert.match(appInitHtmlRaw, /setWorkspaceSearchResultCache\(workspace, dx, filters, data\)/);
  assert.match(appInitHtmlRaw, /Memuat daftar kasus halaman/);
  assert.match(utilsHtml, /pd3i-skeleton-spinner/);
  assert.match(styleHtml, /@keyframes pd3iSpinner/);
});

test('each sidebar menu has a dedicated spreadsheet-backed backend API', () => {
  [
    'createInitialCase',
    'getEditableRecords',
    'getEditableRecord',
    'saveInitialReportEdit',
    'getVerificationQueue',
    'getVerificationRecord',
    'saveVerificationDecision',
    'getSampleQueue',
    'getSampleRecord',
    'saveSampleResult',
    'getStatusQueue',
    'getStatusRecord',
    'saveCaseStatusUpdate'
  ].forEach((fn) => assert.match(routesJs, new RegExp('function\\s+' + fn + '\\s*\\('), fn + ' should exist'));
  assert.match(routesJs, /function _searchRecordsDirectFromSheet_\(dx, filters, token\)/);
  assert.match(routesJs, /getSheetOrThrow_\(dxItem \+ '_Raw'\)[\s\S]*?getDataRange\(\)\.getValues\(\)/);
  assert.match(routesJs, /default: throw new Error\('Aksi workflow tidak dikenal\.'\);/);
  assert.doesNotMatch(routesJs, /default: throw new Error\('Aksi workflow tidak dikenal: ' \+ action\);/);
  assert.doesNotMatch(routesJs, /default: return saveFormPayload_\(payload\);/);
  assert.doesNotMatch(routesJs, /function _searchRecordsDirectFromSheet_[\s\S]*?_readSheetWithCache_/);
});

test('workflow form submit dispatches to menu-specific save actions instead of generic-only saveFormData', () => {
  assert.match(appHtml, /function getWorkflowSaveActionForMode\(submitMode\)/);
  assert.match(appHtml, /verifikasi:\s*'saveVerificationDecision'/);
  assert.match(appHtml, /sampel:\s*'saveSampleResult'/);
  assert.match(appHtml, /status:\s*'saveCaseStatusUpdate'/);
  assert.match(appHtml, /input:\s*'createInitialCase'/);
  assert.match(appHtml, /edit:\s*'saveInitialReportEdit'/);
  assert.match(appHtml, /dataObj\.__action = getWorkflowSaveActionForMode\(submitMode\);/);
  assert.match(appHtml, /\.saveVerificationDecision\(SESSION_TOKEN, payload\)/);
  assert.match(appHtml, /\.saveSampleResult\(SESSION_TOKEN, payload\)/);
  assert.match(appHtml, /\.saveCaseStatusUpdate\(SESSION_TOKEN, payload\)/);
  assert.match(appHtml, /function safeHandleMainFormSubmit\(mode\)/);
  assert.match(appHtml, /submit handler failed before server save/);
  assert.match(appHtml, /showWorkflowSubmitError\(submitMode, errMessage \|\| 'Gagal menyimpan data\.'\)/);
});


test('workflow process markers make every queue transition explicit and persisted in Raw schema', () => {
  const rawSchemaJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'Core', 'raw_schema.js'), 'utf8');
  const dataJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'DataWarehouse', 'data.js'), 'utf8');
  [
    'Workflow Current Queue',
    'Workflow Current Label',
    'Status Proses Verifikasi EPID',
    'Status Proses Pemeriksaan',
    'Status Proses Pemantauan',
    'Status Proses Perbaikan',
    'Workflow Selesai'
  ].forEach((field) => {
    assert.match(rawSchemaJs, new RegExp(JSON.stringify(field).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    assert.match(dataJs, new RegExp(JSON.stringify(field).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  });
  assert.match(routesJs, /function _applyWorkflowProcessMarkers_\(record\)/);
  assert.match(routesJs, /currentQueue = 'verifikasi_epid'/);
  assert.match(routesJs, /currentQueue = 'input_pemeriksaan'/);
  assert.match(routesJs, /currentQueue = 'pemantauan'/);
  assert.match(routesJs, /currentQueue = 'kasus_ditolak'/);
  assert.match(routesJs, /currentQueue = 'selesai'/);
});

test('rejected cases stay visible and readable to both original inputer and mapped puskesmas pengampu', () => {
  assert.match(dashboardJs, /function _isDashboardInputerMatch_\(sess, inputerUsername, inputerName\)/);
  assert.match(dashboardJs, /normalizedStatus === 'PERLU REVISI' \|\| normalizedStatus === 'DITOLAK'/);
  assert.match(dashboardJs, /super-admin[\s\S]*?scopeMatch[\s\S]*?inputerMatch/);
  assert.match(routesJs, /data\["Diinput Oleh"\] = String\(user\.username \|\| actorName/);
  assert.match(routesJs, /function _isSessionOriginalInputer_\(sess, data\)/);
  assert.match(routesJs, /data\['Diinput Oleh'\]/);
  assert.match(routesJs, /data\['Input Awal Diisi Oleh'\]/);
  assert.match(routesJs, /verificationStatus === 'PERLU REVISI' \|\| verificationStatus === 'DITOLAK'/);
  assert.match(routesJs, /_isSessionOriginalInputer_\(sess, data \|\| \{\}\)\) return true;/);
});

test('Daftar Kasus direct search can show pending records created by the logged-in petugas without widening all-status reads', () => {
  assert.match(routesJs, /\['Diinput Oleh'\]/);
  assert.match(routesJs, /\['Input Awal Diisi Oleh'\]/);
  assert.match(routesJs, /function _isSessionOriginalInputerUsername_\(sess, data\)/);
  assert.match(routesJs, /verificationStatus === 'PENDING' && _isSessionOriginalInputerUsername_\(sess, data \|\| \{\}\)\) return true;/);
  assert.doesNotMatch(routesJs, /if \(_isSessionOriginalInputer_\(sess, data \|\| \{\}\)\) return true;/);
});

test('Daftar Kasus search is paginated at 10 records per page with next and previous controls', () => {
  assert.match(routesJs, /const pageSize = Math\.min\(100, Math\.max\(1, parseInt\(filters\.pageSize, 10\) \|\| 10\)\);/);
  assert.match(appHtml, /const SEARCH_RESULTS_PAGE_SIZE = 10;/);
  assert.match(appHtml, /filters\.page = Math\.max\(1, parseInt\(page, 10\) \|\| 1\);/);
  assert.match(appHtml, /filters\.pageSize = SEARCH_RESULTS_PAGE_SIZE;/);
  assert.match(appHtml, /_renderSearchResultsList\(data, dx\);/);
  assert.match(appHtml, /data-search-page-target="\$\{Math\.max\(1, page - 1\)\}"/);
  assert.match(appHtml, /data-search-page-target="\$\{Math\.min\(totalPages, page \+ 1\)\}"/);
  assert.match(appHtml, /Halaman \$\{page\} dari \$\{totalPages\}/);
  assert.match(appHtml, /\$\{startNumber\}–\$\{endNumber\} dari \$\{total\} kasus/);
});

test('verified cases leave verification queue and enter exactly sample or monitoring queue by marker', () => {
  assert.match(dashboardJs, /super-admin[\s\S]*?isPendingVerificationStatus/);
  assert.match(dashboardJs, /sampleStagePending = normalizedStatus === 'TERVERIFIKASI'[\s\S]*?sampleRelevant[\s\S]*?!sampleDone/);
  assert.match(dashboardJs, /normalizedStatus === 'TERVERIFIKASI' && !isFinalStatus && !sampleStagePending && \(\(role === 'admin' \|\| role === 'super-admin' \|\| role === 'superadmin'\) \|\| scopeMatch\)/);
  assert.match(routesJs, /samplePending[\s\S]*?currentQueue = 'input_pemeriksaan'[\s\S]*?!isFinalStatus[\s\S]*?currentQueue = 'pemantauan'/);
});


test('verification workspace shows pending, approved, and rejected-returned cases', () => {
  assert.match(routesJs, /workflowIntent === 'section-verifikasi' \|\| workspace === 'verifikasi'\) \{\s*allowedVerificationStatuses = \['PENDING', 'TERVERIFIKASI', 'PERLU REVISI', 'DITOLAK'\]/);
  assert.match(appHtml, /const visibleRevision = \['input', 'edit', 'search', 'verifikasi'\]\.includes\(workspace\)[\s\S]*?filterQueueItemsForWorkspace\(revisionQueue, workspace\)/);
  assert.match(appHtml, /const visibleVerified = \['verifikasi', 'sampel'\]\.includes\(workspace\) \? filterQueueItemsForWorkspace\(verificationDone, workspace\) : \[\]/);
  assert.match(appHtml, /Kasus approved \/ sudah diverifikasi/);
  assert.match(appHtml, /Kasus ditolak \/ perlu perbaikan/);
});


test('workflow marker backfill helpers are admin guarded, preview-first, and backup by default', () => {
  const migrationJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'Core', 'migration.js'), 'utf8');
  assert.match(migrationJs, /function previewWorkflowMarkerBackfill\(token, dxList, options\)/);
  assert.match(migrationJs, /function backfillWorkflowMarkers\(token, dxList, options\)/);
  assert.match(migrationJs, /previewWorkflowMarkerBackfill[\s\S]*?_requireAdminFromToken_\(token\)/);
  assert.match(migrationJs, /backfillWorkflowMarkers[\s\S]*?_requireAdminFromToken_\(token\)/);
  assert.match(migrationJs, /_copyRawSheetBackup_\(sheet, 'PRE_WORKFLOW_MARKER_BACKFILL'\)/);
  assert.match(migrationJs, /_applyWorkflowProcessMarkers_\(Object\.assign\(\{\}, record\)\)/);
  assert.match(migrationJs, /_ensureSheetHeaders_\(sheet, WORKFLOW_MARKER_BACKFILL_HEADERS_\)/);
  assert.match(migrationJs, /Cache_Manager\.invalidateSheetCache\(dx \+ '_Raw'\)/);
});


test('workflow saves prefer current google.script.run deployment before hardcoded POST exec fallback', () => {
  assert.match(appHtml, /res = await withWorkflowSaveTimeout\(saveFormViaGsRun\(dataObj\), 'Simpan verifikasi EPID'\);[\s\S]*?catch \(gsErr\) \{[\s\S]*?google\.script\.run tidak tersedia[\s\S]*?fallback ke POST \/exec[\s\S]*?res = await withWorkflowSaveTimeout\(postJsonToWebApp\(GOOGLE_SCRIPT_URL, dataObj\), 'Simpan verifikasi EPID'\);/);
  assert.match(appHtml, /if \(!\/google\\\.script\\\.run tidak tersedia\/i\.test\(gsMessage\)\) \{\s*throw gsErr;\s*\}/);
  assert.doesNotMatch(appHtml, /res = await postJsonToWebApp\(GOOGLE_SCRIPT_URL, dataObj\);[\s\S]*?fallback ke google\.script\.run\.saveFormData/);
});


test('record hydration scopes duplicate generated field ids to the opened workspace form', () => {
  assert.match(appHtml, /async function hydrateRecordToForm\(record, formRoot\)/);
  assert.match(appHtml, /const hydrateRoot = formRoot && formRoot\.querySelectorAll \? formRoot : document;/);
  assert.match(appHtml, /const el = findScopedFieldControl\(key, hydrateRoot\);/);
  assert.match(appHtml, /await hydrateRecordToForm\(record, openedFormRoot\);/);
  assert.match(appHtml, /hydrateDynamicTables\(record, openedFormRoot\);/);
  assert.match(appHtml, /if \(!getWilayahNextFieldId\(fieldId\)\) \{\s*el\.dispatchEvent\(new Event\("change", \{ bubbles: true \}\)\);\s*\}/);
  assert.match(appHtml, /await hydrateWilayahChain\(\["Provinsi", "Kab\/Kota"\], record, hydrateRoot\);/);
  assert.match(appHtml, /await hydrateWilayahChain\(\["Provinsi Pasien", "Kab\/Kota Pasien", "Kecamatan", "Kelurahan"\], record, hydrateRoot\);/);
});



test('workflow verification review hydrates Kontak Erat from scoped tbody and legacy JSON alias', () => {
  assert.match(appHtml, /record\["Kontak Erat"\] \|\| record\["KontakEratJSON"\] \|\| record\["KontakEratJson"\] \|\| record\["kontakEratJSON"\]/);
  assert.match(appHtml, /window\.addDynamicRow = function\(tableId, presetRow, targetRootOrTbody\)/);
  assert.match(appHtml, /addDynamicRow\(tableId, item, tbody\)/);
  assert.match(appHtml, /function hydrateDynamicTablesWhenReady\(record, formRoot\)/);
  assert.match(appHtml, /hydrateDynamicTablesWhenReady\(record, openedFormRoot\)/);
});

test('dedicated workflow saves only write columns owned by that step and preserve existing state for markers', () => {
  assert.match(routesJs, /function _getWorkflowStageAllowedUpdateFields_\(workflowStage\)/);
  assert.match(routesJs, /'section-verifikasi':[\s\S]*?'Status Verifikasi EPID'[\s\S]*?'Catatan Verifikasi EPID'/);
  assert.match(routesJs, /'section-sampel':[\s\S]*?'Pemeriksaan Sampel Dilakukan'[\s\S]*?'Interpretasi Hasil Sampel'/);
  assert.match(routesJs, /'section-status':[\s\S]*?'Status Pasien\/Kasus'[\s\S]*?'Riwayat Status Kasus'/);
  assert.match(routesJs, /function _sanitizeDedicatedWorkflowStagePayload_\(dx, data, sess\)/);
  assert.match(routesJs, /Object\.assign\(\{\}, data\.__existingRecordForWorkflow \|\| \{\}, data\)/);
});

test('patch-only workflow marker saves preserve canonical verification status instead of resetting to Pending', () => {
  assert.match(dataJs, /const incomingVerificationStatus = String\(data\["Status Verifikasi EPID"\] \|\| ""\)\.trim\(\);/);
  assert.match(dataJs, /if \(existingRowObject\) \{[\s\S]*?if \(!incomingVerificationStatus\) \{[\s\S]*?existingRowObject\['Status Verifikasi EPID'\][\s\S]*?data\['Status Verifikasi EPID'\] = verificationStatus;/);
  assert.doesNotMatch(dataJs, /const verificationStatus = String\(data\["Status Verifikasi EPID"\] \|\| ""\)\.trim\(\) \|\| "Pending";\s*data\["Status Verifikasi EPID"\] = verificationStatus;/);
  assert.match(routesJs, /"Status Verifikasi EPID": String\(\(savedRecord && savedRecord\["Status Verifikasi EPID"\]\) \|\| ''\)\.trim\(\)/);
});

test('verification helper updates and EPID recommendation use the active form scope, not duplicate global ids', () => {
  assert.match(appHtml, /function updateVerificationSectionState\(scope\)/);
  assert.match(appHtml, /const statusEl = findScopedFieldControl\('Status Verifikasi EPID', formScope\)/);
  assert.match(appHtml, /function refreshRecommendedEpidPreview\(options, scope\)/);
  assert.match(appHtml, /const payload = collectCurrentFormPayload\(formScope\)/);
  assert.match(appHtml, /updateVerificationSectionState\(openedFormRoot\)/);
  assert.match(appHtml, /refreshRecommendedEpidPreview\(\{ silentLoading: true \}, openedFormRoot\)/);
});

test('verification workspace keeps address and GPS context fields editable for admin correction', () => {
  assert.match(appHtml, /function setBrowserAutofillReviewFieldLock\(workspace\)/);
  assert.match(appHtml, /if \(normalizedWorkspace === 'verifikasi'\) return;/);
  assert.doesNotMatch(appHtml, /\['verifikasi', 'sampel', 'status'\]\.indexOf\(normalizedWorkspace\) === -1/);
});

test('verification submit button has direct fallback handler and saves the active form scope', () => {
  assert.match(workspaceVerifikasiHtml, /id="btn-submit-verifikasi"[^>]*onclick="return window\.__PD3I_SUBMIT_WORKFLOW_CLICK/);
  assert.match(fs.readFileSync(path.join(__dirname, '..', 'src', 'Views', 'workspace_input_form.html'), 'utf8'), /id="btn-submit-input"[^>]*onclick="return window\.__PD3I_SUBMIT_WORKFLOW_CLICK/);
  assert.match(fs.readFileSync(path.join(__dirname, '..', 'src', 'Views', 'workspace_form.html'), 'utf8'), /id="btn-submit"[^>]*onclick="return window\.__PD3I_SUBMIT_WORKFLOW_CLICK/);
  assert.match(fs.readFileSync(path.join(__dirname, '..', 'src', 'Views', 'workspace_sampel_form.html'), 'utf8'), /id="btn-submit-sampel"[^>]*onclick="return window\.__PD3I_SUBMIT_WORKFLOW_CLICK/);
  assert.match(fs.readFileSync(path.join(__dirname, '..', 'src', 'Views', 'workspace_status_form.html'), 'utf8'), /id="btn-submit-status"[^>]*onclick="return window\.__PD3I_SUBMIT_WORKFLOW_CLICK/);
  assert.match(appHtml, /window\.__PD3I_SUBMIT_WORKFLOW_CLICK = function\(ev, mode\)/);
  assert.match(appHtml, /ev\.stopImmediatePropagation\(\)/);
  assert.match(appHtml, /const activeFormElement = submitMode === 'input'[\s\S]*?\? inputFormElement[\s\S]*?submitMode === 'verifikasi'[\s\S]*?\? formElementVerifikasi/);
  assert.match(appHtml, /validateNumericOnlyRequiredFields\(activeFormElement\)/);
  assert.match(appHtml, /validateAndApplyBirthUI\(\{ silent: false, hard: true, scope: activeFormElement \}\)/);
  assert.match(appHtml, /validateDxBusinessRules\(activeFormElement\)/);
  assert.match(appHtml, /findScopedFieldControl\("Nama unit pelapor", activeFormElement\)/);
});


test('input form showIf lookup stays scoped so Pertusis specimen date fields can be shown', () => {
  const pertConfigHtml = fs.readFileSync(path.join(__dirname, '..', 'src', 'Views', 'config_PERT.html'), 'utf8');
  assert.match(pertConfigHtml, /id: "Spesimen pertusis diambil\?"/);
  assert.match(pertConfigHtml, /id: "Tanggal ambil spesimen pertusis"[\s\S]*?type: "date"[\s\S]*?showIf: \{ field: "Spesimen pertusis diambil\?", values: \["Ya"\] \}/);
  assert.match(pertConfigHtml, /id: "Tanggal kirim spesimen pertusis"[\s\S]*?type: "date"[\s\S]*?showIf: \{ field: "Spesimen pertusis diambil\?", values: \["Ya"\] \}/);
  assert.match(appHtml, /const scope = getFormScopeForElement\(wrapper\);/);
  assert.match(appHtml, /const parent = findScopedFieldControl\(parentId, scope\) \|\| document\.getElementById\(parentId\);/);
  assert.match(appHtml, /const parentValue = getShowIfParentValue\(parentId, scope\);/);
  assert.doesNotMatch(appHtml, /const parent = document\.getElementById\(parentId\);\s*const parentValue = getShowIfParentValue\(parentId\);/);
});

test('PERT PE print renders dynamic imunisasi and kontak erat tables', () => {
  const printPertHtml = fs.readFileSync(path.join(__dirname, '..', 'src', 'Views', 'print_PERT.html'), 'utf8');
  assert.match(printPertHtml, /var imunRows=parseRows_\(pick_\(\['Riwayat Imunisasi'\]\)\)/);
  assert.match(printPertHtml, /function imunStatus_\(labels, legacyKeys\)/);
  assert.match(printPertHtml, /function imunDate_\(labels, legacyKeys\)/);
  assert.match(printPertHtml, /DPT-HB-HIB 1/);
  assert.match(printPertHtml, /DPT-HB-HIB 4/);
  assert.match(printPertHtml, /Tanggal Vaksinasi DPT-HB-HiB terakhir[\s\S]*?imunDate_/);
  assert.match(printPertHtml, /CONTACTS\.length\)\?CONTACTS:parseRows_/);
  assert.match(printPertHtml, /<td class="section" colspan="3">Kontak Erat<\/td>/);
  assert.match(printPertHtml, /Jumlah Imunisasi Terkait/);
  assert.match(printJs, /let contactsRaw = data\["Kontak Erat"\] \|\| data\["KontakEratJSON"\] \|\| data\["KontakEratJson"\] \|\| data\["kontakEratJSON"\] \|\| "";/);
  assert.match(printJs, /norm\.indexOf\("kontakerat"\)/);
  assert.match(printJs, /Array\.isArray\(contacts\.rows\)/);
});

test('Hasil Sampel workspace shows a case summary instead of the full initial input context form', () => {
  assert.match(workspaceSampelHtml, /id="sampel-case-summary"/);
  assert.match(workspaceSampelHtml, /Ringkasan kasus/);
  assert.doesNotMatch(workspaceSampelHtml, /id="pelapor-fields-container-sampel"/);
  assert.doesNotMatch(workspaceSampelHtml, /id="pasien-fields-container-sampel"/);
  assert.doesNotMatch(workspaceSampelHtml, /id="specific-fields-container-sampel"/);
  assert.match(appHtml, /function renderSampelCaseSummary\(record\)/);
  assert.match(appHtml, /pelaporContainer:\s*null,[\s\S]*?pasienContainer:\s*null,[\s\S]*?specificContainer:\s*null/);
  assert.match(appHtml, /if \(refs\.pelaporContainer\) \{[\s\S]*?COMMON\.pelapor/);
  assert.match(appHtml, /if \(refs\.specificContainer\) \{\s*renderDiagnosisSections\(cfg, refs\.specificContainer\);\s*\}/);
  assert.match(appHtml, /if \(openedWorkspace === 'sampel'\) \{\s*renderSampelCaseSummary\(record\);\s*\}/);
});

test('dashboard keeps epidemiologic age group and adds surveillance age distribution analysis', () => {
  assert.match(dashboardJs, /const DASHBOARD_SURVEILLANCE_AGE_GROUPS_ = \[/);
  ['<1 tahun', '1–4 tahun', '5–9 tahun', '10–14 tahun', '15–19 tahun', '20–44 tahun', '45–59 tahun', '≥60 tahun'].forEach((label) => {
    assert.match(dashboardJs, new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  });
  assert.match(dashboardJs, /function _classifySurveillanceAgeGroup_\(totalDays\)/);
  assert.match(dashboardJs, /perKelompokUmur: perKelompokUmur/);
  assert.match(dashboardJs, /perKelompokUsiaSurveilans: perKelompokUsiaSurveilans/);
  assert.match(appDashboardHtml, /Analisis Distribusi Kasus Berdasarkan Usia/);
  assert.match(appDashboardHtml, /Interval analisis surveilans/);
  assert.match(appDashboardHtml, /Distribusi Kelompok Umur Epidemiologis/);
});

test('sample result fields adapt labels and specimen options to the active diagnosis', () => {
  const commonConfigHtml = fs.readFileSync(path.join(__dirname, '..', 'src', 'Views', 'config_common.html'), 'utf8');
  assert.match(commonConfigHtml, /const SAMPLE_FIELDS_BY_DX = \{/);
  ['MR', 'DIF', 'PERT', 'AFP', 'TN'].forEach((dx) => assert.match(commonConfigHtml, new RegExp(dx + ': \\{')));
  assert.match(commonConfigHtml, /MR:[\s\S]*?Swab tenggorok[\s\S]*?Urine/);
  assert.match(commonConfigHtml, /DIF:[\s\S]*?Swab tenggorokan[\s\S]*?Swab hidung/);
  assert.match(commonConfigHtml, /PERT:[\s\S]*?Swab nasofaring[\s\S]*?Aspirat nasofaring/);
  assert.match(commonConfigHtml, /AFP:[\s\S]*?Tinja 1[\s\S]*?Tinja 2/);
  assert.match(commonConfigHtml, /TN:[\s\S]*?Tidak ada pemeriksaan lab rutin/);
  assert.match(commonConfigHtml, /function getSampleFieldsForDx\(dx\)/);
  assert.match(appHtml, /const sampleFields = \(typeof getSampleFieldsForDx === 'function'\)[\s\S]*?getSampleFieldsForDx\(dx\)/);
  assert.match(commonConfigHtml, /id: "Rincian Hasil Sampel"[\s\S]*?type: "dynamic_table"/);
  assert.match(commonConfigHtml, /name: "Jenis Spesimen"[\s\S]*?options: cfg\.specimenOptions/);
});

test('initial input workspace does not render Nomor EPID because EPID is assigned during verification', () => {
  const commonConfigHtml = fs.readFileSync(path.join(__dirname, '..', 'src', 'Views', 'config_common.html'), 'utf8');
  assert.match(commonConfigHtml, /id: "Nomor EPID"[\s\S]*?hideInWorkspaces: \["input"\]/);
  assert.match(appHtml, /COMMON\.pasien \|\| \[\]\)\.filter\(function\(f\) \{\s*return !f\.hideInWorkspaces \|\| f\.hideInWorkspaces\.indexOf\(normalizedMode\) === -1;\s*\}\)\.map\(generateHTML\)\.join\(''\)/);
  assert.match(appHtml, /findScopedFieldControl\('Nomor EPID'/);
  assert.match(appHtml, /findScopedFieldControl\('Nomor EPID'/);
});

test('performance tuning avoids repeated DOM reparsing and full row deserialization in search lists', () => {
  assert.doesNotMatch(appHtml, /refs\.(pelaporContainer|pasienContainer|verifikasiContainer|sampelContainer|statusContainer)\.innerHTML \+= generateHTML/);
  assert.match(appHtml, /refs\.pelaporContainer\.innerHTML = \(COMMON\.pelapor \|\| \[\]\)\.map\(generateHTML\)\.join\(''\)/);
  assert.match(appHtml, /refs\.sampelContainer\.innerHTML = sampleFields\.map\(generateHTML\)\.join\(''\)/);
  assert.match(routesJs, /function _buildSearchProjectionRecord_\(headers, row\)/);
  assert.match(routesJs, /function _getSearchProjectionIndexMap_\(headers\)/);
  assert.match(routesJs, /_getSearchProjectionIndexMap_\._cache/);
  assert.match(routesJs, /const record = _buildSearchProjectionRecord_\(headers, row\);\s*record\.RAW_ROW_NUMBER = rowIdx \+ 2;[\s\S]*?_canSessionReadRecordByScope_\(sess, dxItem, record\)/);
  assert.match(dashboardJs, /function _getPengampuByWilayahCachedForDashboard_\(kecamatan, kelurahan, kabKota\)/);
  assert.match(dashboardJs, /_getPengampuByWilayahCachedForDashboard_\(normKecamatan, normKelurahan, normKabKota\)/);
  assert.match(dashboardJs, /function _buildWorkflowInboxData_\(sess, dx, options\)/);
  assert.match(dashboardJs, /const summaryOnly = !!options\.summaryOnly/);

  assert.match(dashboardJs, /const effectiveDx = \['verifikasi', 'sampel', 'status', 'search'\]\.indexOf\(workspace\) !== -1 \? '' : dx;/);
  assert.match(dashboardJs, /const result = _buildWorkflowInboxData_\(sess, effectiveDx\);/);
  assert.match(dashboardJs, /function _queueDxCount_\(queue, dx\)/);
  assert.match(dashboardJs, /const allQueuesFull = false; \/\/ Do not let one diagnosis fill the global queue and block later DX sheets\./);
  assert.match(dashboardJs, /_queueDxCount_\(pendingVerification, dxItem\) < QUEUE_LIMIT/);
  assert.match(dashboardJs, /if \(!recordKey && !summaryOnly\) continue;/);
  assert.match(dashboardJs, /const statusVerifikasi = _readLastNonEmptyHeaderValue_\(row, idxVerifikasiList\);/);
  assert.match(dashboardJs, /const normalizedWorkflowQueue = String\(workflowQueue \|\| ''\)\.trim\(\)\.toLowerCase\(\);/);
  assert.match(dashboardJs, /const normalizedProsesVerifikasi = String\(prosesVerifikasi \|\| ''\)\.trim\(\)\.toUpperCase\(\);/);
  assert.match(dashboardJs, /normalizedWorkflowQueue === 'verifikasi_epid'/);
  assert.match(dashboardJs, /\['PENDING', 'BELUM DIVERIFIKASI', 'BELUM VERIFIKASI', 'MENUNGGU VERIFIKASI'\]\.indexOf\(normalizedProsesVerifikasi\) !== -1/);
  assert.match(dashboardJs, /if \(summaryOnly\) \{[\s\S]*?pendingVerificationCount \+= 1;[\s\S]*?continue;[\s\S]*?\}/);
  assert.match(dashboardJs, /_buildWorkflowInboxData_\(sess, '', \{ summaryOnly: true \}\)/);
  assert.doesNotMatch(dashboardJs, /getOverviewSummary[\s\S]*?pendingVerification: \(result\.pendingVerification \|\| \[\]\)\.slice\(0, 6\)/);
});

test('Daftar Kasus search projection can read PERT pengampu and updated aliases', () => {
  assert.match(routesJs, /\['KodeFaskes Pengampu'\]/);
  assert.match(routesJs, /\['Puskesmas Pengampu'\]/);
  assert.match(routesJs, /\['Updated At', 'Last Updated At', 'Tanggal Update'\]/);
  assert.match(routesJs, /updatedAt: getFirst\(\['Updated At', 'Last Updated At', 'Tanggal Update'\]\)/);
  assert.match(routesJs, /const recordKodePengampu = _normalizeAccessScopeKey_\(\(data && data\['KodeFaskes Pengampu'\]\) \|\| ''\);/);
  assert.match(routesJs, /const recordPuskesmasPengampu = _normalizeAccessScopeKey_\(\(data && data\['Puskesmas Pengampu'\]\) \|\| ''\);/);
  assert.match(routesJs, /if \(userKodePuskesmas && recordKodePengampu && userKodePuskesmas === recordKodePengampu\) return true;/);
  assert.match(routesJs, /if \(userUnitKerja && recordPuskesmasPengampu && userUnitKerja === recordPuskesmasPengampu\) return true;/);
});

test('workflow inbox can surface PERT rows before registration id or EPID exists', () => {
  assert.match(dashboardJs, /const rowHasContent = \(row \|\| \[\]\)\.some\(function\(cell\) \{ return String\(cell \|\| ''\)\.trim\(\) !== ''; \}\);/);
  assert.match(dashboardJs, /if \(!rowHasContent\) continue;/);
  assert.match(dashboardJs, /const rowRecordKey = 'ROW:' \+ String\(ri \+ 2\);/);
  assert.match(dashboardJs, /const recordKey = recordId \|\| epid \|\| rowRecordKey;/);
  assert.match(dashboardJs, /dxBreakdown: { MR: 0, DIF: 0, PERT: 0, TN: 0, AFP: 0 }/);
});

test('Beranda summary scans all rows instead of stopping after first valid record', () => {
  assert.match(dashboardJs, /if \(summaryOnly\) \{[\s\S]*?continue;[\s\S]*?\}\n\n      const item = \{/);
  assert.doesNotMatch(dashboardJs, /if \(summaryOnly\) \{[\s\S]*?return;[\s\S]*?\}\n\n      const item = \{/);
});

test('production client logs do not leak captcha answers or noisy workflow debug data', () => {
  const utilsHtml = fs.readFileSync(path.join(__dirname, '..', 'src', 'Views', 'utils.js.html'), 'utf8');
  assert.doesNotMatch(utilsHtml, /console\.log\(["'](?:Login|PIN) captcha:/);
  assert.match(appHtml, /function pd3iDebugLog_\(\)/);
  assert.match(appHtml, /window\.PD3I_DEBUG === true/);
  assert.doesNotMatch(appHtml, /console\.log\(["']Save response:/);
  assert.doesNotMatch(appHtml, /console\.log\('\[PD3I v2\] refreshWorkflowInbox/);
});

test('session restore does not leave auth boot overlay loading indefinitely', () => {
  const styleHtml = fs.readFileSync(path.join(__dirname, '..', 'src', 'Views', 'style.html'), 'utf8');
const utilsHtml = fs.readFileSync(path.join(__dirname, '..', 'src', 'Views', 'utils.js.html'), 'utf8');
  assert.ok(styleHtml.indexOf('.hidden { display: none !important; }') > styleHtml.indexOf('.flex { display: flex !important; }'));
  assert.match(authHtml, /const AUTH_RESTORE_TIMEOUT_MS = 8000;/);
  assert.match(authHtml, /const restoreTimeout = window\.setTimeout\(function \(\) \{[\s\S]*?setLoggedOutUI\(\);[\s\S]*?Pemeriksaan sesi terlalu lama\. Silakan login ulang\./);
  assert.match(authHtml, /function finishRestoreSession\(action\) \{[\s\S]*?if \(restoreFinished\) return false;[\s\S]*?window\.clearTimeout\(restoreTimeout\);/);
  assert.match(authHtml, /withSuccessHandler\(function \(res\) \{\s*finishRestoreSession\(function \(\) \{/);
  assert.match(authHtml, /withFailureHandler\(function \(\) \{\s*finishRestoreSession\(function \(\) \{\s*setLoggedOutUI\(\);/);
});

test('account request faskes master reloads when modal opens', () => {
  assert.match(authHtml, /function loadAccountRequestMaster\(options\)/);
  assert.match(authHtml, /if \(accountRequestMaster\.length && !opts\.force\) return;/);
  assert.match(authHtml, /loadAccountRequestMaster\(\{ force: true \}\);/);
});

test('Input Kasus submit shows inline errors near save button', () => {
  const inputHtml = fs.readFileSync(path.join(__dirname, '..', 'src', 'Views', 'workspace_input_form.html'), 'utf8');
  assert.match(inputHtml, /id="workflow-submit-status-input"/);
  assert.match(appInitHtmlRaw, /if \(submitMode === 'input'\) return document\.getElementById\('workflow-submit-status-input'\);/);
  assert.match(appInitHtmlRaw, /if \(activeSubmitButton\.getAttribute\('aria-busy'\) === 'true'\) \{[\s\S]*?Proses simpan sebelumnya masih berjalan/);
  assert.doesNotMatch(appInitHtmlRaw, /Menyiapkan review sebelum simpan/);
});

test('OTP login does not stay stuck on mobile when google.script.run stalls', () => {
  assert.match(authHtml, /verifyLoginOtp timeout, trying POST fallback/);
  assert.match(authHtml, /function verifyLoginViaPost\(\) \{[\s\S]*?fetch\(url, \{[\s\S]*?JSON\.stringify\(\{ action: "verifyLoginOtp", email: email, otp: otp \}\)/);
  assert.match(authHtml, /function finishLoginOnce\(fn\) \{[\s\S]*?if \(loginFinished\) return false;[\s\S]*?window\.clearTimeout\(loginTimeout\);/);
  assert.match(routesJs, /if \(action === "verifyLoginOtp"\) \{\s*return responseJSON\(verifyLoginOtp\(data\.email, data\.otp\)\);\s*\}/);
});

test('login session lasts 6 hours and is shared across same-browser tabs', () => {
  const utilsHtml = fs.readFileSync(path.join(__dirname, '..', 'src', 'Views', 'utils.js.html'), 'utf8');
  const coreUtils = fs.readFileSync(path.join(__dirname, '..', 'src', 'Core', 'utils.js'), 'utf8');
  assert.match(utilsHtml, /const IDLE_TIMEOUT_MS = 6 \* 60 \* 60 \* 1000; \/\/ 6 jam/);
  assert.match(coreUtils, /const defaults = \{ admin: 21600, "super-admin": 21600, superadmin: 21600, petugas: 21600, viewer: 21600 \};/);
  assert.match(coreUtils, /"super-admin": "SESSION_TTL_ADMIN"/);
  assert.match(coreUtils, /superadmin: "SESSION_TTL_ADMIN"/);
  assert.match(utilsHtml, /function getBrowserSessionStore\(\) \{[\s\S]*?window\.localStorage[\s\S]*?return window\.localStorage;[\s\S]*?window\.sessionStorage/);
  assert.match(utilsHtml, /function getSessionTokenFromBrowser\(\) \{[\s\S]*?window\.localStorage\.getItem\(SESSION_STORAGE_KEY\)[\s\S]*?window\.sessionStorage\.getItem\(SESSION_STORAGE_KEY\)/);
  assert.match(utilsHtml, /function clearSessionFromBrowser\(\) \{[\s\S]*?window\.localStorage[\s\S]*?removeItem\(SESSION_STORAGE_KEY\)[\s\S]*?window\.sessionStorage[\s\S]*?removeItem\(SESSION_STORAGE_KEY\)/);
  assert.match(authHtml, /SESSION_TOKEN = \(res && res\.token\) \|\| savedToken;/);
  assert.match(authHtml, /if \(savedUser\) \{[\s\S]*?SESSION_TOKEN = savedToken;[\s\S]*?setLoggedInUI\(SESSION_USER\);[\s\S]*?return;/);
  assert.match(authJs, /AUTH_CACHE\.put\("TOKEN_" \+ token, JSON\.stringify\(obj\), ttl\);[\s\S]*?token: token/);
  const authCheckBody = authJs.match(/function authCheck\(token\) \{[\s\S]*?\n\}\n\nfunction authLogout/)[0];
  assert.doesNotMatch(authCheckBody, /AUTH_CACHE\.remove\("TOKEN_" \+ token\)/);
});

test('dynamic tables remain horizontally scrollable on mobile forms', () => {
  const styleHtml = fs.readFileSync(path.join(__dirname, '..', 'src', 'Views', 'style.html'), 'utf8');
const utilsHtml = fs.readFileSync(path.join(__dirname, '..', 'src', 'Views', 'utils.js.html'), 'utf8');
  assert.match(appHtml, /class="table-container pd3i-dynamic-table-container overflow-x-auto/);
  assert.match(appHtml, /aria-label="Geser tabel \$\{field\.label\} ke kanan\/kiri"/);
  assert.match(appHtml, /class="pd3i-table-scroll-hint md:hidden"/);
  assert.match(appHtml, /<table class="pd3i-dynamic-table w-full/);
  assert.match(styleHtml, /\.pd3i-dynamic-table-container \{[\s\S]*?overflow-x: auto !important;[\s\S]*?-webkit-overflow-scrolling: touch;[\s\S]*?touch-action: pan-x pan-y;/);
  assert.match(styleHtml, /\.pd3i-dynamic-table-container \.pd3i-dynamic-table \{[\s\S]*?width: max-content !important;[\s\S]*?min-width: 100%;/);
  assert.match(styleHtml, /@media \(max-width: 768px\) \{[\s\S]*?\.pd3i-dynamic-table-container \.pd3i-dynamic-table \{\s*min-width: 72rem;\s*\}/);
});

test('quality gate includes endpoint security inventory with no review-needed callable functions', () => {
  assert.equal(packageJson.scripts.test, 'npm run test:node && npm run check:hygiene && npm run check:endpoints');
  assert.equal(packageJson.scripts['check:endpoints'], 'node scripts/check-endpoint-security.js > docs/ENDPOINT_SECURITY_MATRIX.generated.json');
  assert.match(endpointSecurityScript, /const publicFunctions = \[/);
  assert.match(endpointSecurityScript, /'saveFormData'/);
  assert.match(endpointSecurityScript, /'getPdfPrintUrl'/);
  assert.match(endpointSecurityScript, /'setupConfig'/);
  const endpointSecurityMatrix = JSON.parse(execFileSync(process.execPath, ['scripts/check-endpoint-security.js'], {
    cwd: path.join(__dirname, '..'),
    encoding: 'utf8'
  }));
  assert.equal(endpointSecurityMatrix.reviewNeeded.length, 0);
  assert.ok(endpointSecurityMatrix.rows.length >= 50);
  const byName = Object.fromEntries(endpointSecurityMatrix.rows.map((row) => [row.name, row]));
  assert.equal(byName.authLogin.guard, 'public-login');
  assert.equal(byName.saveFormData.guard, 'token-or-save-payload');
  assert.equal(byName.getPdfPrintUrl.guard, 'token-scope');
  assert.equal(byName.setupConfig.guard, 'admin');
});

test('public write entry validates session token before sheet writes', () => {
  assert.match(routesJs, /function saveFormPayload_\(data\) \{\s*const token = String\(data\.__token \|\| ""\)\.trim\(\);\s*const sess = _getSessionFromToken_\(token\);\s*if \(!sess\.ok\) \{\s*return \{ status: "error", message: sess\.message \|\| "Sesi habis\. Silakan login ulang\." \};\s*\}\s*_requireWriteAccessFromSession_\(sess, data\.__workflowStage, data\);[\s\S]*?const saved = saveDxRecord_\(dx, data\);/);
});

test('public write entry caches identical successful submissions to reduce double-submit duplicates', () => {
  assert.match(routesJs, /function _buildSubmissionIdempotencyKey_\(dx, data, sess\)/);
  assert.match(routesJs, /actor: String\(\(sess && sess\.user && sess\.user\.username\) \|\| ''\)\.trim\(\)\.toLowerCase\(\)/);
  assert.match(routesJs, /payload\[key\] = _normalizeSubmissionFingerprintValue_\(data\[key\]\);/);
  assert.match(routesJs, /const submissionCacheKey = _buildSubmissionIdempotencyKey_\(dx, data, sess\);\s*const cachedSubmission = _getCachedSubmissionResult_\(submissionCacheKey\);\s*if \(cachedSubmission\) return cachedSubmission;\s*\n\s*data = _applyWorkflowStageAuditFields_/);
  assert.match(routesJs, /function _getCachedSubmissionResult_\(cacheKey\)[\s\S]*?cached\.submissionIdempotent = true;[\s\S]*?cached\.duplicateSubmission = true;/);
  assert.match(routesJs, /function _cacheSubmissionResult_\(cacheKey, result\)[\s\S]*?CacheService\.getScriptCache\(\)\.put\(cacheKey, JSON\.stringify\(toCache\), 600\);/);
  assert.match(routesJs, /submissionIdempotent: false,\s*duplicateSubmission: false\s*\};\s*_cacheSubmissionResult_\(submissionCacheKey, result\);\s*return result;/);
});

test('public endpoints sanitize unexpected exception messages before returning to clients', () => {
  assert.match(routesJs, /function _publicWorkflowError_\(err, fallbackMessage\)/);
  assert.match(routesJs, /\{ pattern: \/\^Petugas hanya boleh\/i, message: "Petugas hanya boleh memproses data sesuai kewenangan wilayahnya\." \}/);
  assert.match(routesJs, /\{ pattern: \/\^Mapping REF_PENGAMPU\/i, message: "Mapping pengampu untuk domisili pasien belum ditemukan\." \}/);
  assert.match(routesJs, /const matched = safeMessages\.filter\(function\(item\) \{ return item\.pattern\.test\(raw\); \}\)\[0\];/);
  assert.match(routesJs, /console\.error\("Public workflow endpoint error:", err\)/);
  assert.match(routesJs, /function doPost\(e\) \{[\s\S]*?catch \(err\) \{\s*return responseJSON\(_publicWorkflowError_\(err\)\);\s*\}[\s\S]*?function saveFormData\(data\)/);
  assert.match(routesJs, /function saveFormData\(data\) \{[\s\S]*?catch \(err\) \{\s*return _publicWorkflowError_\(err\);\s*\}[\s\S]*?function _routeDedicatedWorkflowAction_/);
  assert.doesNotMatch(routesJs, /Aksi workflow tidak dikenal: ' \+ action/);

  assert.match(authJs, /function _publicAuthError_\(err, fallbackMessage\)/);
  assert.match(authJs, /console\.error\("Public auth endpoint error:", err\)/);
  assert.match(authJs, /return _publicAuthError_\(e\);/);
  assert.match(authJs, /return _publicAuthError_\(e, "Sesi belum bisa diperiksa\. Silakan login ulang\."\);/);
  assert.match(authJs, /return _publicAuthError_\(e, "Logout belum bisa diproses\. Silakan coba lagi\."\);/);
  assert.match(authJs, /return _publicAuthError_\(e, "Ubah password belum bisa diproses\. Silakan coba lagi atau hubungi admin\."\);/);
  assert.doesNotMatch(authJs, /message: String\(e\)/);
});

test('sample result specimen field supports more than one examination type in one save', () => {
  const commonConfigHtml = fs.readFileSync(path.join(__dirname, '..', 'src', 'Views', 'config_common.html'), 'utf8');
  assert.match(commonConfigHtml, /id: "Rincian Hasil Sampel"[\s\S]*?type: "dynamic_table"/);
  assert.match(commonConfigHtml, /name: "Jenis Spesimen"[\s\S]*?name: "Nomor Spesimen"[\s\S]*?name: "Tanggal Hasil"[\s\S]*?name: "Hasil"/);
  assert.match(appHtml, /tableId === "Rincian Hasil Sampel"[\s\S]*?getSampleFieldsForDx\(dx\)/);
  assert.match(appHtml, /hydrateDynamicTableByJson\("Rincian Hasil Sampel", record\["Rincian Hasil Sampel"\], formRoot\)/);
  assert.match(appHtml, /if \(rowObj\["Jenis Spesimen"\] \|\| rowObj\["Nomor Spesimen"\] \|\| rowObj\["Tanggal Hasil"\] \|\| rowObj\["Hasil"\]\) tableData\.push\(rowObj\)/);
  assert.match(appHtml, /function syncSampleResultLegacyFieldsFromTable\(dataObj\)/);
  assert.match(appHtml, /dataObj\["Jenis Sampel Diuji"\] = joinUnique\(nonEmptyRows\.map\(function\(row\) \{ return row\["Jenis Spesimen"\]; \}\)\)/);
  assert.match(appHtml, /dataObj\["Hasil Pemeriksaan Sampel"\] = nonEmptyRows\.map/);
  assert.match(dataJs, /"Rincian Hasil Sampel"/);
  assert.match(routesJs, /'Pemeriksaan Sampel Dilakukan', 'Rincian Hasil Sampel', 'Jenis Sampel Diuji'/);
});

test('PIE quality data insight card is full-width below dashboard cards', () => {
  const pieHtml = fs.readFileSync(path.join(__dirname, '..', 'src', 'Views', 'workspace_pie.html'), 'utf8');
  assert.match(pieHtml, /pie-insight-card pie-insight-card-full[\s\S]*?<span>Kualitas data<\/span>/);
  assert.match(pieHtml, /#section-pie \.pie-insight-card-full\{grid-column:1 \/ -1\}/);
  assert.match(pieHtml, /#section-pie \.pie-quality-wide\{display:grid;grid-template-columns:repeat\(auto-fit,minmax\(220px,1fr\)\)/);
  assert.ok(pieHtml.indexOf('<span>Riwayat validasi</span>') < pieHtml.indexOf('<span>Kualitas data</span>'));
});

test('mobile sidebar overlay does not reserve desktop grid column', () => {
  const styleHtml = fs.readFileSync(path.join(__dirname, '..', 'src', 'Views', 'style.html'), 'utf8');
const utilsHtml = fs.readFileSync(path.join(__dirname, '..', 'src', 'Views', 'utils.js.html'), 'utf8');
  assert.match(styleHtml, /@media \(max-width: 1100px\) \{[\s\S]*?\.pd3i-app \{[\s\S]*?display: block;[\s\S]*?grid-template-columns: minmax\(0, 1fr\);/);
  assert.match(styleHtml, /@media \(max-width: 1100px\) \{[\s\S]*?\.pd3i-page \{[\s\S]*?width: 100%;[\s\S]*?min-width: 0;/);
  assert.match(styleHtml, /@media \(max-width: 1100px\) \{[\s\S]*?\.pd3i-sidebar \{[\s\S]*?position: fixed;[\s\S]*?transform: translateX\(-108%\);/);
});

test('PIE identity fields have consistent input box height', () => {
  const pieHtml = fs.readFileSync(path.join(__dirname, '..', 'src', 'Views', 'workspace_pie.html'), 'utf8');
  assert.match(pieHtml, /pie-identity-grid/);
  assert.match(pieHtml, /#section-pie \.pie-identity-grid>\.pd3i-form-field\{display:flex;flex-direction:column;min-height:5\.65rem;margin:0\}/);
  assert.match(pieHtml, /#section-pie \.pie-identity-grid>\.pd3i-form-field \.pd3i-shell-input,#section-pie \.pie-identity-grid>\.pd3i-form-field \.pd3i-shell-select\{height:2\.75rem;min-height:2\.75rem;margin-top:\.35rem\}/);
  assert.match(pieHtml, /pie-identity-hint/);
});

test('PIE clinical detail fields sit directly below clinical signs section', () => {
  const pieHtml = fs.readFileSync(path.join(__dirname, '..', 'src', 'Views', 'workspace_pie.html'), 'utf8');
  const clinicalHeader = pieHtml.indexOf('2. Tanda klinis & sindrom');
  const detailBlock = pieHtml.indexOf('id="pie-clinical-detail"');
  const exposureHeader = pieHtml.indexOf('3. Riwayat pajanan 0–14 hari');
  const complicationHeader = pieHtml.indexOf('4. Komplikasi & sinyal epidemiologi');
  assert.ok(clinicalHeader >= 0 && detailBlock > clinicalHeader);
  assert.ok(detailBlock < exposureHeader);
  assert.ok(detailBlock < complicationHeader);
});

test('PIE clinical detail fields map to their triggering checkboxes', () => {
  const pieHtml = fs.readFileSync(path.join(__dirname, '..', 'src', 'Views', 'workspace_pie.html'), 'utf8');
  assert.match(pieHtml, /data-key="travelRisk"/);
  assert.match(pieHtml, /data-key="humanContactRisk"/);
  assert.match(pieHtml, /data-pie-detail-for="symptoms"[\s\S]*?pie-symptom-notes/);
  assert.match(pieHtml, /data-pie-detail-for="travel"[\s\S]*?pie-travel-location/);
  assert.match(pieHtml, /data-pie-detail-for="humanContact"[\s\S]*?pie-contact-type/);
  assert.match(pieHtml, /data-pie-detail-for="cluster"[\s\S]*?pie-cluster-id/);
  assert.match(pieHtml, /const detailMap=\{ symptoms:symptoms, travel:!!\(facts\.travelRisk\), humanContact:!!\(facts\.humanContactRisk\|\|facts\.sexualCloseContact\|\|facts\.bodyFluidContact\|\|facts\.funeralContact\|\|facts\.contaminatedObject\|\|facts\.crowdDormitory\), cluster:!!facts\.clusterSevere \};/);
  assert.match(pieHtml, /document\.querySelectorAll\('\[data-pie-detail-for\]'\)\.forEach/);
});

test('PIE screening covers expanded zoonosis and emerging infection signals', () => {
  const pieHtml = fs.readFileSync(path.join(__dirname, '..', 'src', 'Views', 'workspace_pie.html'), 'utf8');
  const ruleEngine = fs.readFileSync(path.join(__dirname, '..', 'src', 'PIE', 'rule_engine.js'), 'utf8');
  const service = fs.readFileSync(path.join(__dirname, '..', 'src', 'PIE', 'service.js'), 'utf8');
  ['hemorrhage','skinLesion','livestock','carcass','unpasteurizedDairy','mosquitoVector','travelRisk','humanContactRisk'].forEach((fact) => {
    assert.match(pieHtml, new RegExp('data-key="' + fact + '"'));
    assert.match(service, new RegExp(fact + ': b\\(\'' + fact + '\'\\)'));
  });
  ['MERS_COV_OR_RESP_TRAVEL','ANTHRAX_SUSPECT','PLAGUE_OR_RODENT_FEVER','BRUCELLOSIS_SUSPECT','ARBOVIRUS_HEMORRHAGIC_SIGNAL'].forEach((disease) => {
    assert.match(ruleEngine, new RegExp("disease_code: '" + disease + "'"));
  });
  assert.match(ruleEngine, /facts\.respiratory && \(facts\.travelRisk \|\| facts\.humanContactRisk\)/);
  assert.match(ruleEngine, /facts\.skinLesion && \(facts\.livestock \|\| facts\.carcass\)/);
  assert.match(ruleEngine, /facts\.fever && facts\.rodent/);
  assert.match(ruleEngine, /facts\.fever && \(facts\.hemorrhage \|\| facts\.mosquitoVector\)/);
});

test('PIE required asterisks stay inline with identity labels', () => {
  const pieHtml = fs.readFileSync(path.join(__dirname, '..', 'src', 'Views', 'workspace_pie.html'), 'utf8');
  assert.match(pieHtml, /<span class="pie-field-label-text">Nama pasien <span class="text-red-500">\*<\/span><\/span><input id="pie-name"/);
  assert.match(pieHtml, /<span class="pie-field-label-text">Faskes pelapor <span class="text-red-500">\*<\/span><\/span><input id="pie-faskes"/);
  assert.match(pieHtml, /#section-pie \.pie-field-label-text\{display:inline-flex;align-items:baseline;gap:\.25rem;line-height:1\.2\}/);
});

test('PIE screening includes Hantavirus and Mpox signals', () => {
  const pieHtml = fs.readFileSync(path.join(__dirname, '..', 'src', 'Views', 'workspace_pie.html'), 'utf8');
  const ruleEngine = fs.readFileSync(path.join(__dirname, '..', 'src', 'PIE', 'rule_engine.js'), 'utf8');
  const service = fs.readFileSync(path.join(__dirname, '..', 'src', 'PIE', 'service.js'), 'utf8');
  ['vesicularRash','lymphadenopathy','sexualCloseContact'].forEach((fact) => {
    assert.match(pieHtml, new RegExp('data-key="' + fact + '"'));
    assert.match(service, new RegExp(fact + ': b\\(\'' + fact + '\'\\)'));
  });
  assert.match(ruleEngine, /disease_code: 'HANTAVIRUS_SUSPECT'/);
  assert.match(ruleEngine, /facts\.fever && facts\.rodent && \(facts\.respiratory \|\| facts\.aki \|\| facts\.hemorrhage\)/);
  assert.match(ruleEngine, /disease_code: 'MPOX_SUSPECT'/);
  assert.match(ruleEngine, /facts\.vesicularRash && \(facts\.fever \|\| facts\.lymphadenopathy \|\| facts\.humanContactRisk \|\| facts\.sexualCloseContact \|\| facts\.travelRisk\)/);
});

test('PIE result and follow-up cards use full-width stack without technical JSON panel', () => {
  const pieHtml = fs.readFileSync(path.join(__dirname, '..', 'src', 'Views', 'workspace_pie.html'), 'utf8');
  assert.match(pieHtml, /pie-screening-output-stack/);
  assert.match(pieHtml, /pie-eval-card/);
  assert.match(pieHtml, /pie-followup-card/);
  assert.match(pieHtml, /pie-followup-grid/);
  assert.doesNotMatch(pieHtml, /Data teknis JSON/);
  assert.doesNotMatch(pieHtml, /id="pie-debug-json"/);
  assert.doesNotMatch(pieHtml, /id="pie-result" class="mt-2 p-3 bg-slate-900/);
  assert.match(pieHtml, /#section-pie \.pie-screening-output-stack\{display:grid;grid-template-columns:minmax\(0,1fr\);gap:var\(--space-4\);width:100%;min-width:0;margin-top:var\(--space-4\)\}/);
});

test('PIE screening includes INFEM priority disease signals from PDF review', () => {
  const pieHtml = fs.readFileSync(path.join(__dirname, '..', 'src', 'Views', 'workspace_pie.html'), 'utf8');
  const ruleEngine = fs.readFileSync(path.join(__dirname, '..', 'src', 'PIE', 'rule_engine.js'), 'utf8');
  const service = fs.readFileSync(path.join(__dirname, '..', 'src', 'PIE', 'service.js'), 'utf8');
  const diseaseCodes = [
    'EBOLA_MARBURG_VHF_SUSPECT',
    'MENINGOCOCCAL_DISEASE_SUSPECT',
    'POLIO_AFP_SUSPECT',
    'CCHF_OR_VHF_TICK_LIVESTOCK',
    'YELLOW_FEVER_SUSPECT',
    'LASSA_FEVER_SUSPECT',
    'RIFT_VALLEY_FEVER_SUSPECT',
    'ZIKA_SUSPECT',
    'RICKETTSIOSIS_SUSPECT',
    'HFMD_EV71_SEVERE_SIGNAL',
    'LEGIONELLOSIS_CLUSTER_SIGNAL',
    'DISEASE_X_SEVERE_UNKNOWN_SIGNAL'
  ];
  diseaseCodes.forEach((code) => assert.match(ruleEngine, new RegExp("disease_code: '" + code + "'")));
  [
    'bodyFluidContact','funeralContact','contaminatedObject','severeVomitingDiarrhea','hepaticRenalImpairment',
    'neckStiffness','purpuraPetechiae','acuteFlaccidParalysis','tickBite','animalBloodContact','yellowFeverUnvaccinated',
    'maculopapularRash','conjunctivitis','arthralgia','handFootMouthVesicles','persistentVomiting','waterAerosolExposure',
    'crowdDormitory','lowPolioImmunization','pregnant','bushForestExposure'
  ].forEach((fact) => {
    assert.match(pieHtml, new RegExp('data-key="' + fact + '"'));
    assert.ok(service.includes(fact + ": b('" + fact + "')"));
  });
  assert.match(ruleEngine, /R-INFZOO-024/);
  assert.match(ruleEngine, /rule ini bukan diagnosis/);
});

test('PIE checkbox cards keep equal responsive dimensions', () => {
  const pieHtml = fs.readFileSync(path.join(__dirname, '..', 'src', 'Views', 'workspace_pie.html'), 'utf8');
  const grids = (pieHtml.match(/pie-choice-grid/g) || []).length;
  assert.ok(grids >= 3, 'clinical, exposure, and epidemiology checkbox groups use equal card grid');
  assert.match(pieHtml, /#section-pie \.pie-choice-grid\{display:grid;grid-template-columns:repeat\(auto-fit,minmax\(220px,1fr\)\);align-items:stretch;grid-auto-rows:minmax\(4\.1rem,auto\)\}/);
  assert.match(pieHtml, /#section-pie \.pie-choice\{display:grid;grid-template-columns:1\.1rem minmax\(0,1fr\);gap:\.45rem;align-items:flex-start;padding:\.5rem \.55rem;border:1px solid #e2e8f0;border-radius:\.7rem;background:#fff;transition:\.15s ease;cursor:pointer;min-height:4\.1rem;height:100%;width:100%;min-width:0\}/);
  assert.match(pieHtml, /#section-pie \.pie-choice small\{display:-webkit-box;-webkit-line-clamp:1;-webkit-box-orient:vertical;overflow:hidden;color:#64748b;line-height:1\.18;margin-top:\.08rem;font-size:\.74rem\}/);
});

test('PIE facts stay canonical without duplicate UI variables', () => {
  const pieHtml = fs.readFileSync(path.join(__dirname, '..', 'src', 'Views', 'workspace_pie.html'), 'utf8');
  const service = fs.readFileSync(path.join(__dirname, '..', 'src', 'PIE', 'service.js'), 'utf8');
  const ruleEngine = fs.readFileSync(path.join(__dirname, '..', 'src', 'PIE', 'rule_engine.js'), 'utf8');
  const uiFacts = [...pieHtml.matchAll(/data-key="([^"]+)"/g)].map((m) => m[1]);
  const duplicateUiFacts = Object.entries(uiFacts.reduce((acc, k) => { acc[k] = (acc[k] || 0) + 1; return acc; }, {})).filter(([, n]) => n > 1);
  assert.deepEqual(duplicateUiFacts, []);
  assert.doesNotMatch(pieHtml, /data-key="travelRisk21"/);
  assert.doesNotMatch(pieHtml, /data-key="healthcareExposure"/);
  assert.match(pieHtml, /data-key="travelRisk"/);
  assert.match(pieHtml, /data-key="humanContactRisk"/);
  assert.match(service, /travelRisk: b\('travelRisk'\) \|\| b\('travelRisk21'\)/);
  assert.match(service, /humanContactRisk: b\('humanContactRisk'\) \|\| b\('healthcareExposure'\)/);
  assert.doesNotMatch(ruleEngine, /travelRisk21|healthcareExposure/);
});

test('Zero Reporting workspace runtime reveals native form internals', () => {
  const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'Views', 'app.js.html'), 'utf8');
  assert.match(appJs, /function revealZeroReportingFormWorkspace\(\)/);
  assert.match(appJs, /sarsFormSection\.querySelector\('\.pd3i-zero-reporting-form-host'\)/);
  assert.match(appJs, /sarsFormSection\.querySelector\('#sarsForm'\)/);
  assert.match(appJs, /querySelectorAll\('\.disease-section,\.case-row,\.row,\.row-3,\.nihil-row'\)/);
  assert.match(appJs, /if \(isSarsFormWorkspace\) revealZeroReportingFormWorkspace\(\);/);
});

test('verification workspace is autonomous review-only with explicit action box', () => {
  assert.doesNotMatch(workspaceVerifikasiHtml, /Ruang kerja ini otonom/);
  assert.match(workspaceVerifikasiHtml, /data-pd3i-verifikasi-action="Terverifikasi"[\s\S]*Approved/);
  assert.match(workspaceVerifikasiHtml, /data-pd3i-verifikasi-action="Pending"[\s\S]*Pending/);
  assert.match(workspaceVerifikasiHtml, /data-pd3i-verifikasi-action="Perlu Revisi"[\s\S]*Tolak dan Perbaiki/);
  assert.match(appHtml, /function renderVerifikasiReviewMode\(formRoot, enabled\)/);
  assert.match(appHtml, /if \(actionRoot && actionRoot\.contains\(el\)\) return;/);
  assert.match(appHtml, /function syncVerificationActionButtons\(scope\)/);
  assert.match(appHtml, /data-pd3i-verifikasi-action/);
  assert.match(appHtml, /pd3i-verifikasi-hidden-technical-field/);
  assert.match(appHtml, /confirmVerificationEpidBeforeSave/);
  assert.match(appHtml, /Nomor EPID rekomendasi/);
  assert.match(dataJs, /verificationEpidLock\.waitLock\(20000\)/);
});

test('workflow queue open action preserves verification workspace instead of falling back to edit/search', () => {
  assert.match(appHtml, /const inferredIntentWorkspace = normalizeSidebarWorkspace\(WORKFLOW_SEARCH_INTENT \|\| ''\)/);
  assert.match(appHtml, /\['verifikasi', 'sampel', 'status'\]\.includes\(inferredIntentWorkspace\) \? inferredIntentWorkspace/);
  assert.match(appHtml, /const isDedicatedWorkflowWorkspace = \['verifikasi', 'sampel', 'status'\]\.includes\(requestedWorkspace\)/);
  assert.match(appHtml, /const openedWorkspace = isDedicatedWorkflowWorkspace\s*\? requestedWorkspace/);
  assert.match(appHtml, /workspace: \$\{JSON\.stringify\(actionWorkspace\)\}/);
  assert.match(appHtml, /actionLabel: 'Verifikasi'/);
});

test('Daftar Kasus clears workflow inbox carried from verification workspace', () => {
  assert.match(appHtml, /function clearWorkflowInboxUi\(\)/);
  assert.match(appHtml, /if \(normalized === 'search' \|\| normalized === 'edit'\)[\s\S]*?_PD3I_WORKFLOW_INBOX_CALL_ID\+\+/);
  assert.match(appHtml, /if \(normalized === 'search' \|\| normalized === 'edit'\)[\s\S]*?clearWorkflowInboxUi\(\)/);
});

test('rendering one workspace form does not clear sibling workspace forms', () => {
  assert.match(appInitHtmlRaw, /const refs = getWorkspaceFormRefs\(normalizedMode\);\s*clearRenderedFormRefs\(refs\);/);
  assert.doesNotMatch(appInitHtmlRaw, /\[searchFormRefs, inputFormRefs, verifikasiFormRefs, sampelFormRefs, statusFormRefs\]\.forEach\(function\(refItem\) \{\s*clearRenderedFormRefs\(refItem\);\s*\}\);/);
});

test('workflow inbox cache and active record meta are isolated per workspace', () => {
  assert.match(appHtml, /let WORKFLOW_INBOX_CACHE_BY_WORKSPACE = \{\};/);
  assert.match(appHtml, /let WORKSPACE_ACTIVE_RECORD_META = \{\};/);
  assert.match(appHtml, /function getWorkspaceInboxCache\(workspace\)/);
  assert.match(appHtml, /function setWorkspaceInboxCache\(workspace, data\)/);
  assert.match(appHtml, /function getWorkspaceActiveRecordMeta\(workspace\)/);
  assert.match(appHtml, /function setWorkspaceActiveRecordMeta\(workspace, record\)/);
  assert.match(appHtml, /setWorkspaceInboxCache\(workspace, res \|\| null\)/);
  assert.match(appHtml, /setWorkspaceActiveRecordMeta\(openedWorkspace, record \|\| \{\}\)/);
});

test('clearActiveRecordContext clears only requested workspace containers', () => {
  const clearFn = appHtml.match(/function clearActiveRecordContext\(options\) \{[\s\S]*?function resetForNewEntry\(\)/)?.[0] || '';
  assert.match(clearFn, /const targetWorkspace = normalizeSidebarWorkspace\(clearOptions\.workspace \|\| ACTIVE_SIDEBAR_WORKSPACE \|\| 'search'\)/);
  assert.match(clearFn, /const containerIdsByWorkspace = \{/);
  assert.match(clearFn, /containerIdsByWorkspace\[targetWorkspace\]/);
  assert.doesNotMatch(clearFn, /\['pelapor-fields-container'[\s\S]*'status-fields-container-workspace'\]\.forEach/);
});

test('SARS submit requires session token and server-owned facility identity', () => {
  const sarsSubmit = fs.readFileSync(path.join(__dirname, '..', 'src', 'SARS', 'submit_sars.js'), 'utf8');
  const workspaceSars = fs.readFileSync(path.join(__dirname, '..', 'src', 'Views', 'workspace_sars.html'), 'utf8');
  const standaloneSars = fs.readFileSync(path.join(__dirname, '..', 'src', 'SARS', 'index.html'), 'utf8');

  assert.match(sarsSubmit, /function _getSarsSubmitSession_\(formData\)/);
  assert.match(sarsSubmit, /const token = _sTrim_\(formData\.__token\)/);
  assert.match(sarsSubmit, /const session = _getSessionFromToken_\(token\)/);
  assert.match(sarsSubmit, /if \(!session\.ok \|\| !session\.user\)/);
  assert.match(sarsSubmit, /const sessionFacility =/);
  assert.match(sarsSubmit, /getSarsFacilityForActiveUser\(email\)/);
  assert.match(sarsSubmit, /Fasilitas laporan tidak sesuai dengan akun login/);
  assert.match(sarsSubmit, /const namaFasyankes = _sTrim_\(sessionFacility\.nama\)/);
  assert.match(workspaceSars, /__token:\s*String\(/);
  assert.match(standaloneSars, /__token:\s*String\(/);
  assert.doesNotMatch(sarsSubmit, /const email\s*=\s*_sTrim_\(formData\.email\)/);
  assert.doesNotMatch(sarsSubmit, /const namaFasyankes\s*=\s*_sTrim_\(formData\.asalFaskes\)/);
});

test('MR rejects duplicate campak case when NIK and fever onset date match', () => {
  assert.match(dataJs, /function _assertNoDuplicateMrNikDemam_\(sheet, headers, data, currentRecordId, currentEpid\)/);
  assert.match(dataJs, /const idxNik = headers\.indexOf\("NIK"\)/);
  assert.match(dataJs, /const idxDemam = headers\.indexOf\("Tanggal mulai demam"\)/);
  assert.match(dataJs, /if \(dx === "MR" && rowIndex === -1\) \{\s*_assertNoDuplicateMrNikDemam_\(sheet, headers, data, recordId, epidValue\);\s*\}/);
  assert.match(dataJs, /Input ditolak: kasus campak dengan NIK dan tanggal mulai demam yang sama sudah ada\. Kasus dianggap duplikat\./);
});
