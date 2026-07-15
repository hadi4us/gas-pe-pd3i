#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const files = [
  'src/Auth/auth.js',
  'src/Controllers/routes.js',
  'src/Controllers/dashboard.js',
  'src/Controllers/print.js',
  'src/PIE/schema.js',
  'src/PIE/service.js',
  'src/Core/audit.js',
  'src/Core/config.js',
  'src/Core/migration.js',
  'src/DataWarehouse/data.js'
];

const publicFunctions = [
  'doGet',
  'doPost',
  'authLogin',
  'authCheck',
  'authLogout',
  'authChangePin',
  'saveFormData',
  'createInitialCase',
  'getEditableRecords',
  'getEditableRecord',
  'saveInitialReportEdit',
  'searchEditableRecords',
  'updateInitialReport',
  'deleteCaseRecord',
  'getVerificationQueue',
  'getVerificationRecord',
  'saveVerificationDecision',
  'getSampleQueue',
  'getSampleRecord',
  'saveSampleResult',
  'getStatusQueue',
  'getStatusRecord',
  'saveCaseStatusUpdate',
  'getRecordByKey',
  'getRecordByEpid',
  'getRefImunisasi',
  'fetchRefImunData',
  'getFaskesFromSheet',
  'getWorkflowFilterOptions',
  'searchRecords',
  'resolveLatestSavedMeta',
  'previewRecommendedEpid',
  'getWorkflowInbox',
  'getOverviewSummary',
  'getDashboardStats',
  'getDashboardDrilldown',
  'exportToCsv',
  'getPdfPrintUrl',
  'getRecordForPrint',
  'handlePrintRequest_',
  'getAuditLog',
  'setupConfig',
  'retryPengampuSync',
  'retryTelegramPd3iNotification',
  'retryPengampuNotification',
  'retryRevisionPengampuNotification',
  'retryRevisionTelegramNotification',
  'retryAllPendingPengampuSync',
  'retryAllFailedTelegramPd3iNotification',
  'retryAllPendingPengampuNotification',
  'retryAllPendingWahaPd3iNotification',
  'retryAllPendingRevisionPengampuNotification',
  'retryAllFailedRevisionTelegramNotification',
  'previewPertRawBlankHeaderRepair',
  'repairPertRawBlankHeader',
  'previewRawSheetHeaderReorder',
  'previewRawSheetHeaderAppend',
  'previewRawSheetAliasBackfill',
  'previewWorkflowMarkerBackfill',
  'repairReferenceSheetsToScopedAccessModel',
  'setupPieSheets',
  'pieEvaluateScreeningPayload',
  'pieCreateEncounter',
  'pieGetOperationalDashboard',
  'pieCompleteActionTask',
  'pieSetCaseClassification',
  'pieCreatePeFollowUp',
  'pieGetPeForm',
  'pieSavePeInvestigation',
  'pieCreateSpecimen',
  'pieSaveLabResult',
  'pieAddOneHealthSignal',
  'pieAddClusterLink',
  'pieArchiveCase',
  'pieAddKbRuleDraft',
  'pieApproveKbRule',
  'pieCalculateValidationMetrics',
  'pieTestKbRule',
  'pieAcknowledgeAlert',
  'pieResolveAlert',
  'pieGetNotificationConfigStatus',
  'pieSetupTelegramConfig',
  'pieSendTestNotification',
  'pieGetPd3iNotificationConfigStatus'
];

const expected = new Map([
  ['authLogin', 'public-login'],
  ['authLogout', 'token'],
  ['saveFormData', 'token-or-save-payload'],
  ['createInitialCase', 'token'],
  ['saveInitialReportEdit', 'token'],
  ['searchEditableRecords', 'token-scope'],
  ['updateInitialReport', 'token'],
  ['saveVerificationDecision', 'token'],
  ['saveSampleResult', 'token'],
  ['saveCaseStatusUpdate', 'token'],
  ['fetchRefImunData', 'token'],
  ['doGet', 'mixed-public-entry'],
  ['doPost', 'token-or-save-payload'],
  ['handlePrintRequest_', 'token-scope'],
  ['getRecordForPrint', 'token-scope'],
  ['setupConfig', 'admin'],
  ['previewPertRawBlankHeaderRepair', 'admin'],
  ['repairPertRawBlankHeader', 'admin'],
  ['previewRawSheetHeaderReorder', 'admin'],
  ['previewRawSheetHeaderAppend', 'admin'],
  ['previewRawSheetAliasBackfill', 'admin'],
  ['previewWorkflowMarkerBackfill', 'admin'],
  ['repairReferenceSheetsToScopedAccessModel', 'admin'],
  ['setupPieSheets', 'admin'],
  ['pieEvaluateScreeningPayload', 'token'],
  ['pieCreateEncounter', 'token'],
  ['pieGetOperationalDashboard', 'token'],
  ['pieCompleteActionTask', 'token'],
  ['pieSetCaseClassification', 'token'],
  ['pieCreatePeFollowUp', 'token'],
  ['pieGetPeForm', 'token'],
  ['pieSavePeInvestigation', 'token'],
  ['pieCreateSpecimen', 'token'],
  ['pieSaveLabResult', 'token'],
  ['pieAddOneHealthSignal', 'token'],
  ['pieAddClusterLink', 'token'],
  ['pieArchiveCase', 'token'],
  ['pieAddKbRuleDraft', 'token'],
  ['pieApproveKbRule', 'token'],
  ['pieCalculateValidationMetrics', 'token'],
  ['pieTestKbRule', 'token'],
  ['pieAcknowledgeAlert', 'token'],
  ['pieResolveAlert', 'token'],
  ['pieGetNotificationConfigStatus', 'admin'],
  ['pieSetupTelegramConfig', 'admin'],
  ['pieSendTestNotification', 'admin'],
  ['pieGetPd3iNotificationConfigStatus', 'admin'],
  ['retryAllPendingPengampuSync', 'admin'],
  ['retryAllFailedTelegramPd3iNotification', 'admin'],
  ['retryAllPendingPengampuNotification', 'admin'],
  ['retryAllPendingWahaPd3iNotification', 'admin'],
  ['retryAllPendingRevisionPengampuNotification', 'admin'],
  ['retryAllFailedRevisionTelegramNotification', 'admin']
]);

function read(relative) {
  return fs.readFileSync(path.join(repoRoot, relative), 'utf8');
}

function collectFunctions() {
  const index = new Map();
  for (const file of files) {
    const content = read(file);
    const lines = content.split(/\r?\n/);
    const re = /^function\s+([A-Za-z_$][\w$]*)\s*\(/gm;
    let match;
    while ((match = re.exec(content))) {
      const name = match[1];
      const line = content.slice(0, match.index).split(/\r?\n/).length;
      index.set(name, { file, line, content, body: extractFunctionBody(content, match.index) });
    }
  }
  return index;
}

function extractFunctionBody(content, startIndex) {
  const open = content.indexOf('{', startIndex);
  if (open === -1) return '';
  let depth = 0;
  for (let i = open; i < content.length; i++) {
    const ch = content[i];
    if (ch === '{') depth++;
    if (ch === '}') depth--;
    if (depth === 0) return content.slice(open + 1, i);
  }
  return content.slice(open + 1);
}

function classify(name, body) {
  if (expected.has(name)) return expected.get(name);
  if (/_requireAdminFromToken_\s*\(/.test(body)) return 'admin';
  if (/_canSession(Read|Write|Delete|Access|Manage)|_searchRecordsDirectFromSheet_|getRecordBy(Key|Epid)\s*\(/.test(body)) return 'token-scope';
  if (/_getSessionFromToken_\s*\(|authCheck\s*\(|Session_Manager\./.test(body)) return 'token';
  return 'review-needed';
}

function main() {
  const functions = collectFunctions();
  const missing = publicFunctions.filter((name) => !functions.has(name));
  if (missing.length) {
    console.error('Missing expected public/callable functions: ' + missing.join(', '));
    process.exitCode = 1;
  }

  const rows = [];
  for (const name of publicFunctions) {
    const info = functions.get(name);
    if (!info) continue;
    rows.push({ name, file: info.file, line: info.line, guard: classify(name, info.body) });
  }

  const reviewNeeded = rows.filter((row) => row.guard === 'review-needed');
  console.log(JSON.stringify({ rows, reviewNeeded }, null, 2));
  if (reviewNeeded.length) {
    console.error('Endpoint security analyzer found review-needed functions: ' + reviewNeeded.map((r) => r.name).join(', '));
    process.exitCode = 1;
  }
}

main();
