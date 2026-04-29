#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, '..', 'src', 'app.js.html');
const source = fs.readFileSync(appPath, 'utf8');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const selectChoiceMatch = source.match(/window\.__pd3iSelectChoice\s*=\s*function\s*\(([^)]*)\)\s*{([\s\S]*?)^\s*};/m);
assert(selectChoiceMatch, 'window.__pd3iSelectChoice function not found');
const params = selectChoiceMatch[1].split(',').map((p) => p.trim()).filter(Boolean);
const body = selectChoiceMatch[2];

assert(
  params.length >= 3,
  '__pd3iSelectChoice must accept a scope/trigger parameter so duplicate field IDs in separate workspace forms update the active form, not the first DOM match.'
);
assert(
  !/document\.getElementById\s*\(\s*fieldId\s*\)/.test(body),
  '__pd3iSelectChoice must not use unscoped document.getElementById(fieldId); it breaks when dynamic-form and dynamic-form-verifikasi both render Status Verifikasi EPID.'
);
assert(
  /closest\s*\(\s*['"][^'"]*dynamic-form-verifikasi/.test(source),
  'choice button click handler must derive a workspace/form scope that includes #dynamic-form-verifikasi.'
);
assert(
  /findScopedFieldControl\s*\(\s*fieldId\s*,\s*scope\s*\)/.test(body) && /querySelectorAll\s*\(\s*['"]input, select, textarea['"]\s*\)/.test(source) && /dataset\s*&&\s*el\.dataset\.fieldId/.test(source),
  '__pd3iSelectChoice should locate controls by data-field-id inside the active form scope.'
);

console.log('PASS: choice button selection is scoped to the active workspace form.');
