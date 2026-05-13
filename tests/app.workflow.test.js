const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const appHtml = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js.html'), 'utf8');
const authHtml = fs.readFileSync(path.join(__dirname, '..', 'src', 'auth.js.html'), 'utf8');
const loginHtml = fs.readFileSync(path.join(__dirname, '..', 'src', 'login.html'), 'utf8');
const pinHtml = fs.readFileSync(path.join(__dirname, '..', 'src', 'pin.html'), 'utf8');
const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'src', 'index.html'), 'utf8');
const workspaceSampelHtml = fs.readFileSync(path.join(__dirname, '..', 'src', 'workspace_sampel_form.html'), 'utf8');
const workspaceVerifikasiHtml = fs.readFileSync(path.join(__dirname, '..', 'src', 'workspace_verifikasi_form.html'), 'utf8');
const workspaceSearchHtml = fs.readFileSync(path.join(__dirname, '..', 'src', 'workspace_search.html'), 'utf8');
const styleHtml = fs.readFileSync(path.join(__dirname, '..', 'src', 'style.html'), 'utf8');

test('credential UI uses password wording and accepts non-numeric passwords', () => {
  assert.match(loginHtml, /Login petugas \(Password\) \+ Captcha/);
  assert.match(loginHtml, />Password Akses</);
  assert.match(loginHtml, /id="login-pin" type="password"/);
  assert.doesNotMatch(loginHtml, /id="login-pin"[^>]*inputmode="numeric"/);
  assert.match(pinHtml, /Ubah Password Akses/);
  assert.match(pinHtml, />Password Lama</);
  assert.match(pinHtml, />Password Baru</);
  assert.match(pinHtml, />Konfirmasi Password Baru</);
  assert.match(pinHtml, /id="pin-old" type="password"/);
  assert.match(pinHtml, /id="pin-new" type="password"/);
  assert.match(pinHtml, /id="pin-new2" type="password"/);
  assert.doesNotMatch(pinHtml, /id="pin-(old|new|new2)"[^>]*inputmode="numeric"/);
  assert.match(indexHtml, /Ubah Password/);
  assert.match(authHtml, /Username dan password wajib diisi\./);
  assert.match(authHtml, /Password baru minimal 6 karakter\./);
  assert.match(authHtml, /loginPin\.type = masked \? 'text' : 'password'/);
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

const routesJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'routes.js'), 'utf8');
const dashboardJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'dashboard.js'), 'utf8');
const dataJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'data.js'), 'utf8');
const appDashboardHtml = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.dashboard.js.html'), 'utf8');

test('record serialization hardens free-text values before writing to Sheets', () => {
  assert.match(dataJs, /function sanitizeSheetTextValue_\(value, header\)/);
  assert.match(dataJs, /replace\(\/\[\\x00-\\x08\\x0B\\x0C\\x0E-\\x1F\\x7F\]\+\/g, ""\)/);
  assert.match(dataJs, /FORMULA_INJECTION_PREFIX_RE_\s*=\s*\/\^\[=\\\+\\\-@\]/);
  assert.match(dataJs, /if \(FORMULA_INJECTION_PREFIX_RE_\.test\(text\)\) \{\s*text = "'" \+ text;/);
  assert.match(dataJs, /if \(text\.length > maxLength\) \{\s*text = text\.slice\(0, maxLength\);\s*\}/);
  assert.match(dataJs, /result\[h\] = sanitizeSerializedValueForSheet_\(val, h\);/);
});

test('dynamic table serialization sanitizes nested string cells before JSON storage', () => {
  assert.match(dataJs, /function sanitizeStructuredValueForSheet_\(value, header\)/);
  assert.match(dataJs, /Array\.isArray\(value\)[\s\S]*?return value\.map\(function \(item\) \{[\s\S]*?sanitizeStructuredValueForSheet_\(item, header\)/);
  assert.match(dataJs, /Object\.keys\(value\)\.forEach\(function \(key\) \{[\s\S]*?result\[key\] = sanitizeStructuredValueForSheet_\(value\[key\], key\)/);
  assert.match(dataJs, /val = sanitizeStructuredValueForSheet_\(val, h\);[\s\S]*?val = JSON\.stringify\(val\);/);
});

test('workflow stage saves follow queue-first blueprint and only offer PDF after EPID verification', () => {
  assert.match(appHtml, /refreshWorkflowInbox\(\{ forceRefresh: true \}\)/);
  assert.match(appHtml, /btnPrint\.classList\.add\("hidden", "opacity-60", "pointer-events-none"\)/);
  assert.match(appHtml, /btnPrint\.classList\.remove\("hidden", "opacity-60", "pointer-events-none"\)/);
  assert.match(appHtml, /activeStageNormalized === 'section-verifikasi'[\s\S]*?openSidebarWorkspace\('verifikasi', \{ scroll: false, skipRecordReload: true \}\)[\s\S]*?verificationStatusSaved === 'Terverifikasi' && printUrl[\s\S]*?PDF PE sudah tersedia setelah verifikasi EPID[\s\S]*?showSuccessModal\(/);
  assert.match(appHtml, /activeStageNormalized === 'section-verifikasi'[\s\S]*?else \{[\s\S]*?Daftar verifikasi sudah diperbarui/);
  assert.match(appHtml, /activeStageNormalized === 'section-sampel'[\s\S]*?openSidebarWorkspace\('sampel', \{ scroll: true, skipRecordReload: true \}\)/);
  assert.match(appHtml, /activeStageNormalized === 'section-status'[\s\S]*?openSidebarWorkspace\('status', \{ scroll: true, skipRecordReload: true \}\)/);
});

test('workflow inbox can bypass cache after mutations and uses short operational ttl', () => {
  assert.match(dashboardJs, /function getWorkflowInbox\(dx, token, options\)/);
  assert.match(dashboardJs, /const forceRefresh = !!\(options\.forceRefresh \|\| options\.noCache \|\| options\.bustCache\)/);
  assert.match(dashboardJs, /if \(cache && !forceRefresh\)/);
  assert.match(dashboardJs, /cache\.put\(cacheKey, JSON\.stringify\(cachedResult\), 15\)/);
  assert.match(appHtml, /\.getWorkflowInbox\(dx, SESSION_TOKEN, \{ forceRefresh: !!options\.forceRefresh \}\)/);
});

test('workflow inbox returns complete queues so workspace filters can find older kelurahan matches', () => {
  assert.match(dashboardJs, /truncating to the first few newest rows makes valid filtered cases disappear/);
  assert.match(dashboardJs, /pendingVerification: result\.pendingVerification \|\| \[\]/);
  assert.match(dashboardJs, /revisionQueue: result\.revisionQueue \|\| \[\]/);
  assert.match(dashboardJs, /verificationDone: result\.verificationDone \|\| \[\]/);
  assert.match(dashboardJs, /sampleQueue: result\.sampleQueue \|\| \[\]/);
  assert.match(dashboardJs, /statusQueue: result\.statusQueue \|\| \[\]/);
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
  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'src', 'index.html'), 'utf8');
  const rawSchemaJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'raw_schema.js'), 'utf8');
  assert.match(indexHtml, /data-sidebar-workspace="search"[\s\S]*?>List Kasus</);
  assert.doesNotMatch(indexHtml, /data-sidebar-workspace="edit"[\s\S]*?>Koreksi Data Awal</);
  assert.match(appHtml, /search:\s*'saveInitialReportEdit'/);
  assert.match(appHtml, /__editMode = 'initial_report'/);
  assert.match(routesJs, /function updateInitialReport\(token, payload\)/);
  assert.match(routesJs, /function _sanitizeInitialReportEditPayload_/);
  assert.match(rawSchemaJs, /"Edited At"/);
  assert.match(rawSchemaJs, /"Edit Inputan Perlu Review Ulang"/);
});

test('workflow route exposes one List Kasus workspace while preserving internal edit saves and stage-specific queues', () => {
  assert.match(routesJs, /"overview", "search", "input", "verifikasi", "sampel", "status", "guide"/);
  assert.doesNotMatch(routesJs, /"overview", "search", "input", "edit", "verifikasi", "sampel", "status", "guide"/);
  assert.match(appHtml, /\['search', 'edit', 'verifikasi', 'sampel', 'status'\]\.includes\(normalized\)/);
  assert.match(appHtml, /const allowed = new Set\(\['overview', 'search', 'input', 'guide'\]\)/);
  assert.match(appHtml, /requestedWorkspace === 'edit' \? 'edit' : 'search'/);
});

test('List Kasus replaces duplicate search/edit menu and supports multi-variable filters plus edit/delete actions', () => {
  assert.match(indexHtml, /data-sidebar-workspace="search"[\s\S]*?>List Kasus</);
  assert.doesNotMatch(indexHtml, /data-sidebar-workspace="edit"[\s\S]*?>Koreksi Data Awal</);
  assert.match(appHtml, /title: 'List Kasus'/);
  assert.match(appHtml, /search: 'List Kasus'/);
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
  assert.match(routesJs, /role === 'admin'\) return true/);
  assert.match(routesJs, /viewer", "readonly", "read_only", "read-only"/);
  assert.match(routesJs, /verificationStatus === 'PENDING'/);
  assert.match(routesJs, /_canSessionReadRecordByScope_\(sess, dx, data \|\| \{\}\)/);
  assert.match(routesJs, /item\.canDelete = _canSessionDeleteCaseRecord_\(sess, dxItem, record\)/);
  assert.match(routesJs, /["']Deleted At["']/);
  assert.match(routesJs, /const diagnosisNeedle = String\(filters\.diagnosis \|\| filters\.dxFilter \|\| ''\)/);
  assert.match(routesJs, /if \(diagnosisNeedle && diagnosisNeedle !== 'ALL' && String\(item\.dx \|\| ''\)\.toUpperCase\(\) !== diagnosisNeedle\) return;/);
  assert.match(routesJs, /function getWorkflowFilterOptions\(token\)/);
  assert.match(routesJs, /getSheetOrNull_\('REF_PENGAMPU'\)/);
  assert.match(routesJs, /const canSeeAllReferenceWilayah = role === 'admin' \|\| scopeLevel === 'dinkes'/);
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
  assert.match(appHtml, /role === "admin"[\s\S]*?allowed\.add\('dashboard'\)/);
  assert.match(appHtml, /role === "admin"[\s\S]*?allowed\.add\('verifikasi'\)/);
  assert.match(appHtml, /if \(caps\.writeStages\.indexOf\('section-sampel'\) !== -1\) allowed\.add\('sampel'\)/);
  assert.match(appHtml, /quickActions[\s\S]*?allowedWorkspaces\.has\(item\.workspace\)/);
  assert.match(appHtml, /document\.querySelectorAll\('\.pd3i-nav-link\[data-sidebar-workspace\]'\)[\s\S]*?getAllowedSidebarWorkspacesForUser\(SESSION_USER\)[\s\S]*?link\.classList\.toggle\('hidden', !allowedWorkspaces\.has\(workspace\)\)/);
  assert.match(appHtml, /if \(SESSION_USER && !canAccessSidebarWorkspace\(normalized, SESSION_USER\)\)[\s\S]*?openSidebarWorkspace\('overview'/);
  assert.match(appDashboardHtml, /if \(typeof canAccessSidebarWorkspace === 'function' && !canAccessSidebarWorkspace\('dashboard', SESSION_USER\)\)/);
});

test('sample workspace lists admin-verified cases and offers PE print only when EPID exists', () => {
  assert.match(appHtml, /const visibleSampleVerified = workspace === 'sampel' \? filterQueueItemsForWorkspace\(verificationDone, workspace\) : \[\]/);
  assert.match(appHtml, /Kasus sudah diverifikasi admin/);
  assert.match(appHtml, /function renderVerifiedSampleCaseTable\(items\)/);
  assert.match(appHtml, /buildClientPrintUrl\(item && item\.dx, item && item\.epid, SESSION_TOKEN\)/);
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
  assert.match(routesJs, /default: throw new Error\('Aksi workflow tidak dikenal: ' \+ action\);/);
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
});


test('workflow process markers make every queue transition explicit and persisted in Raw schema', () => {
  const rawSchemaJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'raw_schema.js'), 'utf8');
  const dataJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'data.js'), 'utf8');
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
  assert.match(dashboardJs, /role === 'admin' \|\| scopeMatch \|\| inputerMatch/);
  assert.match(routesJs, /data\["Diinput Oleh"\] = String\(user\.username \|\| actorName/);
  assert.match(routesJs, /function _isSessionOriginalInputer_\(sess, data\)/);
  assert.match(routesJs, /data\['Diinput Oleh'\]/);
  assert.match(routesJs, /data\['Input Awal Diisi Oleh'\]/);
  assert.match(routesJs, /verificationStatus === 'PERLU REVISI' \|\| verificationStatus === 'DITOLAK'/);
  assert.match(routesJs, /_isSessionOriginalInputer_\(sess, data \|\| \{\}\)\) return true;/);
});

test('List Kasus direct search can show pending records created by the logged-in petugas without widening all-status reads', () => {
  assert.match(routesJs, /\['Diinput Oleh'\]/);
  assert.match(routesJs, /\['Input Awal Diisi Oleh'\]/);
  assert.match(routesJs, /function _isSessionOriginalInputerUsername_\(sess, data\)/);
  assert.match(routesJs, /verificationStatus === 'PENDING' && _isSessionOriginalInputerUsername_\(sess, data \|\| \{\}\)\) return true;/);
  assert.doesNotMatch(routesJs, /if \(_isSessionOriginalInputer_\(sess, data \|\| \{\}\)\) return true;/);
});

test('List Kasus search is paginated at 10 records per page with next and previous controls', () => {
  assert.match(routesJs, /const pageSize = Math\.min\(100, Math\.max\(1, parseInt\(filters\.pageSize, 10\) \|\| 10\)\);/);
  assert.match(appHtml, /const SEARCH_RESULTS_PAGE_SIZE = 10;/);
  assert.match(appHtml, /filters\.page = Math\.max\(1, parseInt\(page, 10\) \|\| 1\);/);
  assert.match(appHtml, /filters\.pageSize = SEARCH_RESULTS_PAGE_SIZE;/);
  assert.match(appHtml, /_renderSearchResultsList\(data, dx\);/);
  assert.match(appHtml, /data-search-page-target="\$\{Math\.max\(1, page - 1\)\}"/);
  assert.match(appHtml, /data-search-page-target="\$\{Math\.min\(totalPages, page \+ 1\)\}"/);
  assert.match(appHtml, /Halaman \$\{page\} dari \$\{totalPages\}/);
  assert.match(appHtml, /Menampilkan \$\{startNumber\}–\$\{endNumber\} dari \$\{total\} record/);
});

test('verified cases leave verification queue and enter exactly sample or monitoring queue by marker', () => {
  assert.match(dashboardJs, /role === 'admin' && normalizedStatus === 'PENDING'/);
  assert.match(dashboardJs, /sampleStagePending = normalizedStatus === 'TERVERIFIKASI'[\s\S]*?sampleRelevant[\s\S]*?!sampleDone/);
  assert.match(dashboardJs, /normalizedStatus === 'TERVERIFIKASI' && !isFinalStatus && !sampleStagePending && \(role === 'admin' \|\| scopeMatch\)/);
  assert.match(routesJs, /samplePending[\s\S]*?currentQueue = 'input_pemeriksaan'[\s\S]*?!isFinalStatus[\s\S]*?currentQueue = 'pemantauan'/);
});


test('rejected and revision cases are not rendered in verification workspace', () => {
  assert.match(routesJs, /workflowIntent === 'section-verifikasi' \|\| workspace === 'verifikasi'\) \{\s*allowedVerificationStatuses = \['PENDING'\]/);
  assert.doesNotMatch(appHtml, /const visibleRevision = workspace === 'verifikasi'\s*\?[\s\S]*?filterQueueItemsForWorkspace\(revisionQueue, workspace\)/);
  assert.match(appHtml, /\['input', 'edit', 'search'\]\.includes\(workspace\)[\s\S]*?filterQueueItemsForWorkspace\(revisionQueue, workspace\)/);
  assert.match(appHtml, /Kasus ditolak \/ perlu perbaikan/);
});


test('workflow marker backfill helpers are admin guarded, preview-first, and backup by default', () => {
  const migrationJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'migration.js'), 'utf8');
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
  assert.match(appHtml, /window\.__PD3I_SUBMIT_WORKFLOW_CLICK = function\(ev, mode\)/);
  assert.match(appHtml, /ev\.stopImmediatePropagation\(\)/);
  assert.match(appHtml, /const activeFormElement = submitMode === 'input'[\s\S]*?\? inputFormElement[\s\S]*?submitMode === 'verifikasi'[\s\S]*?\? formElementVerifikasi/);
  assert.match(appHtml, /validateNumericOnlyRequiredFields\(activeFormElement\)/);
  assert.match(appHtml, /validateAndApplyBirthUI\(\{ silent: false, hard: true, scope: activeFormElement \}\)/);
  assert.match(appHtml, /validateDxBusinessRules\(activeFormElement\)/);
  assert.match(appHtml, /findScopedFieldControl\("Nama unit pelapor", activeFormElement\)/);
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
  const commonConfigHtml = fs.readFileSync(path.join(__dirname, '..', 'src', 'config_common.html'), 'utf8');
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
  const commonConfigHtml = fs.readFileSync(path.join(__dirname, '..', 'src', 'config_common.html'), 'utf8');
  assert.match(commonConfigHtml, /id: "Nomor EPID"[\s\S]*?hideInWorkspaces: \["input"\]/);
  assert.match(appHtml, /COMMON\.pasien \|\| \[\]\)\.filter\(function\(f\) \{\s*return !f\.hideInWorkspaces \|\| f\.hideInWorkspaces\.indexOf\(normalizedMode\) === -1;\s*\}\)\.map\(generateHTML\)\.join\(''\)/);
  assert.match(appHtml, /findScopedFieldControl\('Nomor EPID Final'/);
  assert.match(appHtml, /findScopedFieldControl\('Nomor EPID'/);
});

test('performance tuning avoids repeated DOM reparsing and full row deserialization in search lists', () => {
  assert.doesNotMatch(appHtml, /refs\.(pelaporContainer|pasienContainer|verifikasiContainer|sampelContainer|statusContainer)\.innerHTML \+= generateHTML/);
  assert.match(appHtml, /refs\.pelaporContainer\.innerHTML = \(COMMON\.pelapor \|\| \[\]\)\.map\(generateHTML\)\.join\(''\)/);
  assert.match(appHtml, /refs\.sampelContainer\.innerHTML = sampleFields\.map\(generateHTML\)\.join\(''\)/);
  assert.match(routesJs, /function _buildSearchProjectionRecord_\(headers, row\)/);
  assert.match(routesJs, /const record = _buildSearchProjectionRecord_\(headers, row\);\s*record\.RAW_ROW_NUMBER = rowIdx \+ 2;[\s\S]*?_canSessionReadRecordByScope_\(sess, dxItem, record\)/);
  assert.match(dashboardJs, /function _getPengampuByWilayahCachedForDashboard_\(kecamatan, kelurahan, kabKota\)/);
  assert.match(dashboardJs, /_getPengampuByWilayahCachedForDashboard_\(normKecamatan, normKelurahan, normKabKota\)/);
  assert.match(dashboardJs, /function _buildWorkflowInboxData_\(sess, dx, options\)/);
  assert.match(dashboardJs, /const summaryOnly = !!options\.summaryOnly/);
  assert.match(dashboardJs, /if \(summaryOnly\) \{[\s\S]*?pendingVerificationCount \+= 1;[\s\S]*?return;[\s\S]*?\}/);
  assert.match(dashboardJs, /_buildWorkflowInboxData_\(sess, '', \{ summaryOnly: true \}\)/);
  assert.doesNotMatch(dashboardJs, /getOverviewSummary[\s\S]*?pendingVerification: \(result\.pendingVerification \|\| \[\]\)\.slice\(0, 6\)/);
});

test('session restore does not leave auth boot overlay loading indefinitely', () => {
  assert.match(authHtml, /const AUTH_RESTORE_TIMEOUT_MS = 8000;/);
  assert.match(authHtml, /const restoreTimeout = window\.setTimeout\(function \(\) \{[\s\S]*?setLoggedOutUI\(\);[\s\S]*?Pemeriksaan sesi terlalu lama\. Silakan login ulang\./);
  assert.match(authHtml, /function finishRestoreSession\(action\) \{[\s\S]*?if \(restoreFinished\) return false;[\s\S]*?window\.clearTimeout\(restoreTimeout\);/);
  assert.match(authHtml, /withSuccessHandler\(function \(res\) \{\s*finishRestoreSession\(function \(\) \{/);
  assert.match(authHtml, /withFailureHandler\(function \(\) \{\s*finishRestoreSession\(function \(\) \{\s*setLoggedOutUI\(\);/);
});

test('dynamic tables remain horizontally scrollable on mobile forms', () => {
  const styleHtml = fs.readFileSync(path.join(__dirname, '..', 'src', 'style.html'), 'utf8');
  assert.match(appHtml, /class="table-container pd3i-dynamic-table-container overflow-x-auto/);
  assert.match(appHtml, /aria-label="Geser tabel \$\{field\.label\} ke kanan\/kiri"/);
  assert.match(appHtml, /class="pd3i-table-scroll-hint md:hidden"/);
  assert.match(appHtml, /<table class="pd3i-dynamic-table w-full/);
  assert.match(styleHtml, /\.pd3i-dynamic-table-container \{[\s\S]*?overflow-x: auto !important;[\s\S]*?-webkit-overflow-scrolling: touch;[\s\S]*?touch-action: pan-x pan-y;/);
  assert.match(styleHtml, /\.pd3i-dynamic-table-container \.pd3i-dynamic-table \{[\s\S]*?width: max-content !important;[\s\S]*?min-width: 100%;/);
  assert.match(styleHtml, /@media \(max-width: 768px\) \{[\s\S]*?\.pd3i-dynamic-table-container \.pd3i-dynamic-table \{\s*min-width: 56rem;\s*\}/);
});

test('sample result specimen field supports more than one examination type in one save', () => {
  const commonConfigHtml = fs.readFileSync(path.join(__dirname, '..', 'src', 'config_common.html'), 'utf8');
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
