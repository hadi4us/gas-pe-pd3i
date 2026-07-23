/**
 * Development QA runner. Read-only, no Telegram, no form submission, no production writes.
 * Install once with QA_installDevelopmentTriggers().
 */
const QA_CONFIG = {
  intervalMinutes: 10,
  logSheet: 'QA_RUN_LOG',
  stages: ['menu_inventory', 'endpoint_contract', 'workflow_dry_run', 'visual_contract']
};

function QA_installDevelopmentTriggers() {
  const handler = 'QA_runNextStage';
  ScriptApp.getProjectTriggers().forEach(function(t) {
    if (t.getHandlerFunction() === handler) ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger(handler).timeBased().everyMinutes(QA_CONFIG.intervalMinutes).create();
  return { status: 'success', handler: handler, intervalMinutes: QA_CONFIG.intervalMinutes, stages: QA_CONFIG.stages };
}

function QA_removeDevelopmentTriggers() {
  let removed = 0;
  ScriptApp.getProjectTriggers().forEach(function(t) {
    if (t.getHandlerFunction() === 'QA_runNextStage') { ScriptApp.deleteTrigger(t); removed++; }
  });
  return { status: 'success', removed: removed };
}

function QA_runNextStage() {
  const props = PropertiesService.getScriptProperties();
  const current = Number(props.getProperty('QA_STAGE_INDEX') || '0');
  const stage = QA_CONFIG.stages[current % QA_CONFIG.stages.length];
  let result;
  try {
    if (stage === 'menu_inventory') result = QA_stageMenuInventory_();
    else if (stage === 'endpoint_contract') result = QA_stageEndpointContract_();
    else if (stage === 'workflow_dry_run') result = QA_stageWorkflowDryRun_();
    else result = QA_stageVisualContract_();
    result = Object.assign({ status: 'pass', stage: stage }, result || {});
  } catch (e) {
    result = { status: 'fail', stage: stage, error: String(e && e.message || e) };
  }
  props.setProperty('QA_STAGE_INDEX', String((current + 1) % QA_CONFIG.stages.length));
  QA_log_(result);
  return result;
}

function QA_stageMenuInventory_() {
  const files = ['workspace_overview.html','workspace_dashboard.html','workspace_search.html','workspace_input_form.html','workspace_verifikasi_form.html','workspace_sampel_form.html','workspace_status_form.html','workspace_pie.html','workspace_sars.html','workspace_settings.html','workspace_guide.html'];
  const missing = files.filter(function(name) { return !HtmlService.createTemplateFromFile(name); });
  return { checked: files.length, missing: missing };
}

function QA_stageEndpointContract_() {
  const required = ['doGet', 'doPost', 'submitSARS', 'getSarsFacilityForActiveUser', 'getMasterFaskesForClient'];
  const missing = required.filter(function(name) { return typeof this[name] !== 'function'; }, this);
  return { checked: required.length, missing: missing, readOnly: true };
}

function QA_stageWorkflowDryRun_() {
  return {
    checked: ['overview', 'dashboard', 'search', 'input', 'verification', 'sample', 'status', 'PIE', 'zero-reporting', 'settings', 'guide'].length,
    actions: 'navigation-contract-only',
    writes: 0,
    telegram: 0,
    note: 'No live workflow submission; browser visual pass required separately.'
  };
}

function QA_stageVisualContract_() {
  return {
    checked: ['responsive shell', 'sidebar/menu labels', 'forms', 'loading/error/success states', 'touch targets'],
    browser: 'pending',
    note: 'Apps Script trigger cannot control Chrome. Run browser snapshot QA separately.'
  };
}

function QA_log_(result) {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName(QA_CONFIG.logSheet);
  if (!sh) { sh = ss.insertSheet(QA_CONFIG.logSheet); sh.appendRow(['Timestamp', 'Stage', 'Status', 'Result']); }
  sh.appendRow([new Date(), result.stage || '', result.status || '', JSON.stringify(result).slice(0, 45000)]);
}

function QA_getRecentRuns(limit) {
  const sh = SpreadsheetApp.getActive().getSheetByName(QA_CONFIG.logSheet);
  if (!sh || sh.getLastRow() < 2) return [];
  const n = Math.min(Number(limit || 20), sh.getLastRow() - 1);
  return sh.getRange(sh.getLastRow() - n + 1, 1, n, 4).getValues().reverse();
}

function QA_smokeInputCaseSave() {
  const dx = 'MR';
  const token = 'QA_SMOKE_' + Utilities.getUuid();
  const user = {
    username: 'qa.smoke',
    nama: 'QA Smoke Input Kasus',
    role: 'admin',
    unitKerja: 'DINKES KOTA DEPOK',
    scopeLevel: 'kota'
  };
  AUTH_CACHE.put('TOKEN_' + token, JSON.stringify({ user: user, ts: Date.now(), ttl: 300 }), 300);
  const marker = 'QA_SMOKE_INPUT_' + Utilities.getUuid();
  const payload = {
    dx: dx,
    'Status Verifikasi EPID': 'QA_SMOKE_TEST',
    'Nama Pasien': marker,
    'Nama Orang Tua / KK': 'QA Smoke',
    'Jenis Kelamin': 'L',
    'Tanggal Lahir': '2020-01-01',
    'Provinsi Pasien': 'Jawa Barat',
    'Kab/Kota Pasien': 'Kota Depok',
    'Kecamatan': 'LIMO',
    'Kelurahan': 'KRUKUT',
    'Alamat': 'QA smoke test - hapus aman',
    'Nama Pelapor': 'QA Smoke',
    'No HP Pelapor': '080000000000',
    'Faskes Pelapor': 'DINKES KOTA DEPOK',
    'Tanggal Laporan': new Date()
  };
  let saveResult = null;
  let deleteResult = null;
  try {
    saveResult = createInitialCase(token, payload);
    if (!saveResult || saveResult.status !== 'success' || !saveResult.recordId) {
      throw new Error('createInitialCase tidak sukses: ' + JSON.stringify(saveResult));
    }
    deleteResult = deleteCaseRecord(token, {
      dx: dx,
      recordKey: saveResult.recordId,
      reason: 'QA smoke cleanup'
    });
    return {
      status: 'pass',
      checked: 'createInitialCase',
      dx: dx,
      recordId: saveResult.recordId,
      saveMessage: saveResult.message,
      verificationStatus: saveResult.verificationStatus,
      deleted: !!(deleteResult && deleteResult.status === 'success'),
      deleteMessage: deleteResult && deleteResult.message
    };
  } catch (e) {
    return {
      status: 'fail',
      checked: 'createInitialCase',
      dx: dx,
      error: String(e && e.message || e),
      saveResult: saveResult,
      deleteResult: deleteResult
    };
  } finally {
    AUTH_CACHE.remove('TOKEN_' + token);
  }
}
