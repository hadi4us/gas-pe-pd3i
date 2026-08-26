#!/usr/bin/env node
'use strict';

const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');
const expected = {
  scriptId: '1_EmuiShiCbQcaRmCxZcPySs5uIEzux-U9EQ2q9qEzUtac0SsTHBnbfol',
  deploymentId: 'AKfycbyvwxhm2ycZ-1R45QeTKSM4l5JQ9OIX7MqN9uBusGKhUM8McveAM5ydHXc5WaACD6Od',
  branch: 'overnight/simpel-ui-source-first-2026-08-25',
};
const timeoutMs = Number(process.env.PD3I_CLASP_TIMEOUT_MS || 120000);
const dryRun = process.argv.includes('--dry-run');

function run(bin, args, options = {}) {
  return execFileSync(bin, args, {
    cwd: options.cwd || repoRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout: options.timeout || timeoutMs,
    env: { ...process.env, CI: process.env.CI || '1' },
  });
}

function fail(code, details) {
  console.error(JSON.stringify({ ok: false, code, ...details }, null, 2));
  process.exit(1);
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, relativePath), 'utf8'));
}

function assertCanonicalWorktree() {
  const top = run('git', ['rev-parse', '--show-toplevel']).trim();
  if (top !== repoRoot) fail('DEPLOY_WORKTREE_NOT_CANONICAL', { top, expected: repoRoot });

  const branch = run('git', ['rev-parse', '--abbrev-ref', 'HEAD']).trim();
  if (branch !== expected.branch) fail('DEPLOY_BRANCH_UNEXPECTED', { branch, expected: expected.branch });

  const status = run('git', ['status', '--porcelain']).trim().split('\n').filter(Boolean);
  const sourceDirty = status.filter((line) => {
    const file = line.length > 3 ? line.slice(3) : line;
    return file.startsWith('src/') || file === '.clasp.json';
  });
  if (sourceDirty.length) fail('DEPLOY_WORKTREE_SOURCE_DIRTY', { sourceDirty });

  const clasp = readJson('.clasp.json');
  if (clasp.scriptId !== expected.scriptId || clasp.rootDir !== 'src') {
    fail('DEPLOY_TARGET_NOT_CANONICAL_DEV', { scriptId: clasp.scriptId, rootDir: clasp.rootDir, expected });
  }

  if (fs.existsSync(path.join(repoRoot, 'src', '.clasp.json'))) {
    const nested = readJson('src/.clasp.json');
    if (nested.scriptId === '1laS5GQZob0FQWsLdOGXdx6ea6iyxC7uHeaDE_wVl5rDV8fNQs-3jHUVu') {
      fail('DEPLOY_NESTED_CLASP_POINTS_TO_PRODUCTION', { path: 'src/.clasp.json' });
    }
  }

  return { branch, head: run('git', ['rev-parse', '--short', 'HEAD']).trim(), status };
}

function parseDeployment(output, id) {
  const line = output.split('\n').find((row) => row.includes(id));
  if (!line) return null;
  const version = (line.match(/@(\d+|HEAD)\b/) || [])[1] || null;
  return { line: line.trim(), version };
}

function clasp(args) {
  return run('npx', ['clasp', ...args], { timeout: timeoutMs });
}

function main() {
  const source = assertCanonicalWorktree();
  const deploymentsBefore = clasp(['deployments']);
  const targetBefore = parseDeployment(deploymentsBefore, expected.deploymentId);
  if (!targetBefore) fail('DEV_CANONICAL_DEPLOYMENT_MISSING', { deploymentId: expected.deploymentId });
  if (targetBefore.version === 'HEAD') fail('DEV_CANONICAL_DEPLOYMENT_IS_HEAD', { deploymentId: expected.deploymentId });

  if (dryRun) {
    console.log(JSON.stringify({
      ok: true,
      dryRun: true,
      DEPLOY_SOURCE_CANONICAL: 'YES',
      DEPLOY_HEAD_EXPECTED: source.head,
      DEPLOY_WORKTREE_CLEAN: source.status.length ? 'NO_NON_SOURCE_CHANGES_PRESENT' : 'YES',
      DEV_DEPLOYMENT_ID: expected.deploymentId,
      DEV_DEPLOY_VERSION: targetBefore.version,
      PROD_ALLOWED: 'NO',
      PROD_MUTATION: 'NO',
    }, null, 2));
    return;
  }

  run('npm', ['test'], { timeout: 180000 });
  run('git', ['diff', '--check']);
  clasp(['push']);
  const versionOutput = clasp(['version', `Dev source-first canonical release ${source.head}`]);
  const version = (versionOutput.match(/\b(\d+)\b/) || [])[1];
  if (!version) fail('DEV_VERSION_PARSE_FAILED', { versionOutput });
  clasp(['deploy', '--deploymentId', expected.deploymentId, '--versionNumber', version, '--description', `Dev source-first canonical ${source.head}`]);
  const deploymentsAfter = clasp(['deployments']);
  const targetAfter = parseDeployment(deploymentsAfter, expected.deploymentId);
  if (!targetAfter || targetAfter.version !== version) {
    fail('DEV_DEPLOY_VERIFICATION_FAILED', { expectedVersion: version, targetAfter });
  }
  console.log(JSON.stringify({
    ok: true,
    SOURCE_TEST_STATUS: 'PASS',
    DEV_DEPLOY_STATUS: 'PASS',
    DEV_DEPLOY_VERSION: version,
    DEV_DEPLOY_VERIFICATION: 'PASS',
    DEPLOY_SOURCE_HEAD: source.head,
    DEPLOY_WORKTREE: repoRoot,
    DEV_DEPLOYMENT_ID: expected.deploymentId,
    PROD_STATUS: 'LOCKED_NO_MUTATION',
  }, null, 2));
}

main();
