#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const srcRoot = path.join(repoRoot, 'src');

const requiredDirs = [
  'Core',
  'Auth',
  'DataWarehouse',
  'Finance',
  'BPJS',
  'Pharmacy',
  'AI',
  'Controllers',
  'Views'
];

const disallowedSrcRootPatterns = [
  /\.test\.js$/,
  /\.md$/,
  /^node_modules$/,
  /^docs$/,
  /^tests$/,
  /^scripts$/
];

function fail(message) {
  console.error(`✗ ${message}`);
  process.exitCode = 1;
}

function pass(message) {
  console.log(`✓ ${message}`);
}

function exists(relativePath) {
  return fs.existsSync(path.join(repoRoot, relativePath));
}

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

for (const dir of requiredDirs) {
  const fullPath = path.join(srcRoot, dir);
  if (!fs.existsSync(fullPath) || !fs.statSync(fullPath).isDirectory()) {
    fail(`missing required source directory: src/${dir}`);
  }
}
if (!process.exitCode) pass('required modular source directories exist');

for (const file of ['.clasp.json', '.claspignore', 'src/appsscript.json']) {
  if (!exists(file)) fail(`missing required Apps Script/clasp file: ${file}`);
}
if (!process.exitCode) pass('required Apps Script/clasp files exist');

const claspConfig = JSON.parse(read('.clasp.json'));
if (claspConfig.rootDir !== 'src') {
  fail(`.clasp.json rootDir must be "src", found ${JSON.stringify(claspConfig.rootDir)}`);
} else {
  pass('.clasp.json rootDir points to src');
}
if (claspConfig.scriptId && /REDACTED/i.test(claspConfig.scriptId)) {
  fail('.clasp.json scriptId still looks redacted');
}

const claspIgnore = read('.claspignore');
for (const pattern of ['src/node_modules/**', 'docs/**', 'tests/**', 'scripts/**']) {
  if (!claspIgnore.includes(pattern)) {
    fail(`.claspignore must contain ${pattern}`);
  }
}
if (!process.exitCode) pass('.claspignore keeps non-runtime files out of clasp push');

const rootEntries = fs.readdirSync(srcRoot, { withFileTypes: true });
const badRootEntries = [];
for (const entry of rootEntries) {
  if (entry.name === 'appsscript.json' || entry.name === '.clasp.json' || entry.name === '.claspignore') continue;
  if (requiredDirs.includes(entry.name)) continue;
  if (disallowedSrcRootPatterns.some((pattern) => pattern.test(entry.name))) {
    badRootEntries.push(entry.name);
  }
}
if (badRootEntries.length) {
  fail(`source root contains non-runtime/hygiene entries: ${badRootEntries.join(', ')}`);
} else {
  pass('source root has no known non-runtime/hygiene entries');
}

const topLevelJsHtml = rootEntries
  .filter((entry) => entry.isFile() && /\.(js|html)$/.test(entry.name))
  .map((entry) => entry.name);
if (topLevelJsHtml.length) {
  fail(`runtime JS/HTML files should live in domain folders, found at src root: ${topLevelJsHtml.join(', ')}`);
} else {
  pass('runtime JS/HTML files are organized under domain folders');
}

const utilsJs = read('src/Core/utils.js');
if (!utilsJs.includes('function resolveHtmlFileName_') || !utilsJs.includes('function createTemplateFromFile_')) {
  fail('src/Core/utils.js must expose HTML resolver helpers for subfolder templates');
} else {
  pass('HTML resolver helpers are present');
}

const testsDir = path.join(repoRoot, 'tests');
const nodeTests = fs.readdirSync(testsDir).filter((name) => name.endsWith('.test.js'));
if (!nodeTests.length) {
  fail('tests/ must contain at least one Node regression test');
} else {
  pass(`Node regression tests discovered: ${nodeTests.join(', ')}`);
}

if (process.exitCode) {
  console.error('\nProject hygiene check failed. Fix the items above before deploy.');
} else {
  console.log('\nProject hygiene check passed.');
}
