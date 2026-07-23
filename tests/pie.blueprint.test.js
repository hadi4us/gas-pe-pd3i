const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const workspacePieHtml = fs.readFileSync(path.join(root, 'src', 'Views', 'workspace_pie.html'), 'utf8');
const pieServiceJs = fs.readFileSync(path.join(root, 'src', 'PIE', 'service.js'), 'utf8');
const pieSchemaJs = fs.readFileSync(path.join(root, 'src', 'PIE', 'schema.js'), 'utf8');

test('SARING-PIE sidebar pages are separated into dashboard, screening, operations, and lab subtabs', () => {
  assert.match(workspacePieHtml, /data-pie-tab-section="dashboard"/);
  assert.match(workspacePieHtml, /data-pie-tab-section="screening"/);
  assert.match(workspacePieHtml, /data-pie-tab-section="operations lab"/);
  assert.match(workspacePieHtml, /data-pie-subtab="operations"/);
  assert.match(workspacePieHtml, /data-pie-subtab="lab"/);
  assert.match(workspacePieHtml, /String\(el\.getAttribute\('data-pie-tab-section'\)\|\|''\)\.toLowerCase\(\)\.split\(\/\\s\+\//);
  assert.match(workspacePieHtml, /String\(el\.getAttribute\('data-pie-subtab'\)\|\|''\)\.toLowerCase\(\)\.split\(\/\\s\+\//);
});

test('SARING-PIE lab and One Health entity lists have filters and filtered CSV exports', () => {
  ['pie-specimen-filter-q', 'pie-specimen-filter-status', 'pie-lab-filter-q', 'pie-lab-filter-result', 'pie-cluster-filter-q', 'pie-cluster-filter-rel', 'pie-oh-filter-q', 'pie-oh-filter-type'].forEach((id) => {
    assert.match(workspacePieHtml, new RegExp(`id="${id}"`));
  });
  assert.match(workspacePieHtml, /function\(\)\{ window\.exportPieRowsCsv\(window\.getFilteredPieSpecimens\?window\.getFilteredPieSpecimens\(\)/);
  assert.match(workspacePieHtml, /function\(\)\{ window\.exportPieRowsCsv\(window\.getFilteredPieLabs\?window\.getFilteredPieLabs\(\)/);
  assert.match(workspacePieHtml, /function\(\)\{ window\.exportPieRowsCsv\(window\.getFilteredPieClusters\?window\.getFilteredPieClusters\(\)/);
  assert.match(workspacePieHtml, /function\(\)\{ window\.exportPieRowsCsv\(window\.getFilteredPieOneHealth\?window\.getFilteredPieOneHealth\(\)/);
});

test('SARING-PIE case timeline and audit endpoint connects UI to PIE_AUDIT and related entities', () => {
  assert.match(pieSchemaJs, /PIE_AUDIT: \['audit_id','entity_type','entity_id','action','actor','occurred_at','summary','before_json','after_json'\]/);
  assert.match(pieServiceJs, /function pieGetCaseTimeline\(token, caseId\)/);
  ['PIE_PE_FORM', 'PIE_SPECIMEN', 'PIE_LAB_RESULT', 'PIE_ALERT', 'PIE_ACTION_TASK', 'PIE_CLASSIFICATION_HISTORY', 'PIE_CLUSTER_LINK', 'PIE_ONEHEALTH_SIGNAL', 'PIE_AUDIT'].forEach((sheet) => {
    assert.match(pieServiceJs, new RegExp(`pieReadRows_\\('${sheet}'`));
  });
  assert.match(workspacePieHtml, /data-pie-timeline/);
  assert.match(workspacePieHtml, /function\(res\).*Timeline kasus/s);
  assert.match(workspacePieHtml, /\.pieGetCaseTimeline\(window\.getPieSessionToken\(\), caseId\)/);
});

test('SARING-PIE dashboard exposes blueprint analytics and summary report export', () => {
  ['by_week', 'by_month', 'by_faskes', 'by_archive_reason'].forEach((key) => {
    assert.match(pieServiceJs, new RegExp(key));
  });
  ['sla_alert_ack_24h_pct', 'sla_specimen_to_lab_72h_pct', 'ppv_classification_proxy_pct', 'discarded_or_archived_cases'].forEach((key) => {
    assert.match(pieServiceJs, new RegExp(key));
    assert.match(workspacePieHtml, new RegExp(key));
  });
  ['pie-period-bars', 'pie-sla-bars', 'pie-faskes-bars', 'pie-archive-bars', 'btn-pie-export-summary-csv'].forEach((id) => {
    assert.match(workspacePieHtml, new RegExp(`id="${id}"`));
  });
  assert.match(workspacePieHtml, /window\.exportPieSummaryCsv = function\(\)/);
  assert.match(workspacePieHtml, /pie-summary-report-/);
});


test('SARING-PIE SOP matches current menu split, setup location, and production readiness checklist', () => {
  const sop = fs.readFileSync(path.join(root, 'docs', 'SARING_PIE_MVP_SOP.md'), 'utf8');
  ['Skrining PIE', 'Dashboard PIE', 'Operasional & PE', 'Lab & One Health', 'Pengaturan PD3I / SARING-PIE'].forEach((label) => {
    assert.match(sop, new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  });
  assert.match(sop, /Click \*\*Siapkan Sheet PIE\*\*/);
  assert.match(sop, /Cek Config Telegram PIE/);
  assert.match(sop, /Case timeline\/audit loads/);
  assert.match(sop, /All CSV exports work/);
  assert.match(sop, /versioned Apps Script deployment/);
});
