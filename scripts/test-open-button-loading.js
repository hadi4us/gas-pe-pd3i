#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const app = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js.html'), 'utf8');
const dashboard = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.dashboard.js.html'), 'utf8');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(
  /window\._loadRecordFromSearch_\([^)]*\{\s*triggerButton:\s*this\s*\}/.test(app),
  'Queue/search Buka buttons must pass the clicked button as triggerButton.'
);
assert(
  /const\s+triggerButton\s*=\s*opts\.triggerButton/.test(app),
  '_loadRecordFromSearch_ must read opts.triggerButton.'
);
assert(
  /function\s+setOpenTriggerLoading\s*\(\s*\)/.test(app) && /Membuka\.\.\./.test(app),
  '_loadRecordFromSearch_ must set a visible Membuka... loading state on the clicked Buka button.'
);
assert(
  /pd3i-open-record-loading/.test(app) && /Membuka form\.\.\./.test(app) && /showOpenRecordLoadingOverlay/.test(app),
  '_loadRecordFromSearch_ must show a visible global overlay while the form is being opened.'
);
assert(
  /hideOpenRecordLoadingOverlay/.test(app) && /document\.body\.classList\.remove\('pd3i-record-loading-open'\)/.test(app),
  '_loadRecordFromSearch_ must hide the global opening overlay on completion paths.'
);
assert(
  /triggerButton\.disabled\s*=\s*true/.test(app) && /aria-busy/.test(app),
  'Clicked Buka button must be disabled and marked aria-busy while loading.'
);
assert(
  /function\s+resetOpenTriggerLoading\s*\(\s*\)/.test(app) && /resetOpenTriggerLoading\s*\(\s*\)/.test(app),
  '_loadRecordFromSearch_ must reset the clicked button on success/failure/timeout.'
);
assert(
  /__openAdminQueueRecord\([^)]*this\)/.test(dashboard) && /_loadRecordFromSearch_\([^)]*\{\s*triggerButton:\s*triggerButton\s*\}/.test(dashboard),
  'Dashboard drilldown Buka buttons must forward the clicked button to _loadRecordFromSearch_.'
);

console.log('PASS: Buka buttons show loading feedback while records open.');
