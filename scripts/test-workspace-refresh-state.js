#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const app = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js.html'), 'utf8');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(
  /PD3I_LAST_WORKSPACE_KEY/.test(app) && /pd3i:last-workspace:v1/.test(app),
  'App must define a stable localStorage key for the last active workspace.'
);
assert(
  /function\s+saveLastWorkspace\s*\(/.test(app) && /localStorage\.setItem\(PD3I_LAST_WORKSPACE_KEY,\s*normalized\)/.test(app),
  'App must save the active workspace to localStorage.'
);
assert(
  /function\s+getLastWorkspace\s*\(/.test(app) && /localStorage\.getItem\(PD3I_LAST_WORKSPACE_KEY\)/.test(app),
  'App must read the last workspace from localStorage during boot.'
);
assert(
  /function\s+getUrlRequestedWorkspace\s*\(/.test(app) && /searchParams\.get\('workspace'\)/.test(app) && /searchParams\.get\('view'\)/.test(app),
  'App must still honor explicit workspace/view URL parameters before localStorage fallback.'
);
assert(
  /WORKSPACE_RUNTIME_SEQ \+= 1;\s*saveLastWorkspace\(ACTIVE_SIDEBAR_WORKSPACE\);/s.test(app),
  'beginWorkspaceRuntime must persist every workspace change.'
);
assert(
  /const\s+requestedWorkspace\s*=\s*urlWorkspace \|\| \(bootWorkspace !== 'overview' \? bootWorkspace : \(savedWorkspace \|\| bootWorkspace\)\)/.test(app),
  'Initial routing must restore saved workspace when the route defaults to overview.'
);

console.log('PASS: workspace stays on the last active page after browser refresh.');
