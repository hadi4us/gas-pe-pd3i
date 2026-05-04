const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const appHtml = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js.html'), 'utf8');

test('verification success modal replaces original action buttons to avoid resetForNewEntry listener', () => {
  assert.match(appHtml, /function replaceVerificationSuccessButton\(button, label, modal\)/);
  assert.match(appHtml, /const clone = button\.cloneNode\(true\);/);
  assert.match(appHtml, /delete clone\.dataset\.bound;/);
  assert.match(appHtml, /ev\.stopImmediatePropagation/);
  assert.match(appHtml, /button\.parentNode\.replaceChild\(clone, button\);/);
  assert.match(appHtml, /returnToVerificationQueueAfterSave\(\);/);
});

test('verification modal buttons are resolved by stable ids after original showSuccessModal binds them', () => {
  assert.match(appHtml, /document\.getElementById\('btn-new-entry'\)/);
  assert.match(appHtml, /document\.getElementById\('btn-close-success'\)/);
  assert.match(appHtml, /Kembali ke Daftar Verifikasi/);
  assert.match(appHtml, /Tetap di Daftar Verifikasi/);
});

const routesJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'routes.js'), 'utf8');

test('deferred workflow saves can target pending records by registration id before final EPID exists', () => {
  assert.match(routesJs, /data\["ID Registrasi Kasus"\]/);
  assert.match(routesJs, /data\.RAW_ROW_NUMBER/);
  assert.match(routesJs, /data\["Nomor EPID"\]/);
  assert.doesNotMatch(routesJs, /normalizedStage !== "section-pelapor" && !String\(\(data && data\["Nomor EPID"\]\)/);
});
