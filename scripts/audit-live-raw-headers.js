#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const https = require('https');

const ROOT = path.resolve(__dirname, '..');
const DEFAULT_SPREADSHEET_ID = '1ck-98iYBxvNrHV7NxgcBSwiMxzmJ2zORVA93xuT9hIs';
const DXS = ['MR', 'DIF', 'PERT', 'TN', 'AFP'];

function parseArgs(argv) {
  const out = {
    spreadsheetId: DEFAULT_SPREADSHEET_ID,
    format: 'json'
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--spreadsheet-id' && argv[i + 1]) out.spreadsheetId = argv[++i];
    else if (arg === '--format' && argv[i + 1]) out.format = String(argv[++i]).trim().toLowerCase();
  }
  return out;
}

function parseCsvLine(line) {
  const out = [];
  let current = '';
  let i = 0;
  let inQuotes = false;
  while (i < line.length) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i += 1;
        continue;
      }
      current += ch;
      i += 1;
      continue;
    }
    if (ch === ',') {
      out.push(current);
      current = '';
      i += 1;
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      i += 1;
      continue;
    }
    current += ch;
    i += 1;
  }
  out.push(current);
  return out;
}

function fetch(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => resolve(body));
    }).on('error', reject);
  });
}

function loadCanonicalHeaderGetter() {
  const file = fs.readFileSync(path.join(ROOT, 'src', 'raw_schema.js'), 'utf8');
  const sandbox = {};
  vm.createContext(sandbox);
  vm.runInContext(file + '\nthis.__audit = { getCanonicalRawHeaderOrder_ };', sandbox);
  return sandbox.__audit.getCanonicalRawHeaderOrder_;
}

function loadAliasMap() {
  const file = fs.readFileSync(path.join(ROOT, 'src', 'data.js'), 'utf8');
  const aliasMap = {};
  const regex = /putIfMissing\("([^"]+)",\s*\[(.*?)\]\);/gs;
  for (const match of file.matchAll(regex)) {
    const targetHeader = match[1];
    const sourceHeaders = [...match[2].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
    sourceHeaders.forEach((sourceHeader) => {
      aliasMap[sourceHeader] = targetHeader;
    });
  }
  return aliasMap;
}

async function inspectSheet(spreadsheetId, dx, getCanonical, aliasMap) {
  const sheetName = `${dx}_Raw`;
  const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}&range=1:2`;
  const body = await fetch(url);
  const firstLine = body.split(/\r?\n/)[0] || '';
  const headers = parseCsvLine(firstLine);
  const canonicalHeaders = getCanonical(dx);
  const blankHeaderIndexes = [];
  headers.forEach((header, idx) => {
    if (!String(header || '').trim()) blankHeaderIndexes.push(idx + 1);
  });
  const nonCanonicalHeaders = headers.filter((header) => header && !canonicalHeaders.includes(header));
  const missingCanonicalHeaders = canonicalHeaders.filter((header) => !headers.includes(header));
  const aliasLegacyHeaders = headers
    .filter((header) => aliasMap[header])
    .map((header) => ({ header, targetHeader: aliasMap[header] }));

  return {
    dx,
    sheetName,
    sourceUrl: url,
    columnCount: headers.length,
    blankHeaderCount: blankHeaderIndexes.length,
    blankHeaderIndexes,
    aliasLegacyHeaderCount: aliasLegacyHeaders.length,
    aliasLegacyHeaders,
    nonCanonicalHeaderCount: nonCanonicalHeaders.length,
    nonCanonicalHeaders,
    missingCanonicalHeaderCount: missingCanonicalHeaders.length,
    missingCanonicalHeaders,
    headers
  };
}

function buildSummary(audits) {
  return audits.map((audit) => ({
    dx: audit.dx,
    columnCount: audit.columnCount,
    blankHeaderCount: audit.blankHeaderCount,
    aliasLegacyHeaderCount: audit.aliasLegacyHeaderCount,
    nonCanonicalHeaderCount: audit.nonCanonicalHeaderCount,
    missingCanonicalHeaderCount: audit.missingCanonicalHeaderCount
  }));
}

function toMarkdown(report) {
  const lines = [];
  lines.push('# Live Raw Header Audit');
  lines.push('');
  lines.push('- Spreadsheet ID: `' + report.spreadsheetId + '`');
  lines.push('- Inspected at: ' + report.inspectedAt);
  lines.push('- Source: public `gviz/tq?tqx=out:csv` header read per `*_Raw` sheet');
  lines.push('');
  lines.push('## Ringkasan');
  lines.push('');
  lines.push('| DX | Cols | Blank headers | Alias legacy live | Non-canonical live | Missing canonical |');
  lines.push('| --- | ---: | ---: | ---: | ---: | ---: |');
  report.summary.forEach((item) => {
    lines.push(`| ${item.dx} | ${item.columnCount} | ${item.blankHeaderCount} | ${item.aliasLegacyHeaderCount} | ${item.nonCanonicalHeaderCount} | ${item.missingCanonicalHeaderCount} |`);
  });
  lines.push('');
  report.audits.forEach((audit) => {
    lines.push(`## ${audit.dx}`);
    lines.push('');
    lines.push('- Sheet: `' + audit.sheetName + '`');
    lines.push('- Total kolom live: ' + audit.columnCount);
    lines.push('- Blank header: ' + audit.blankHeaderCount + (audit.blankHeaderCount ? ' (kolom ke ' + audit.blankHeaderIndexes.join(', ') + ')' : ''));
    lines.push('- Alias legacy yang masih live: ' + audit.aliasLegacyHeaderCount);
    lines.push('- Header non-canonical: ' + audit.nonCanonicalHeaderCount);
    lines.push('- Header canonical yang masih hilang: ' + audit.missingCanonicalHeaderCount);
    if (audit.aliasLegacyHeaders.length) {
      lines.push('');
      lines.push('### Alias legacy yang masih dipakai');
      lines.push('');
      audit.aliasLegacyHeaders.forEach((item) => {
        lines.push('- `' + item.header + '` → `' + item.targetHeader + '`');
      });
    }
    if (audit.nonCanonicalHeaders.length) {
      lines.push('');
      lines.push('### Header non-canonical yang terdeteksi');
      lines.push('');
      audit.nonCanonicalHeaders.forEach((header) => {
        lines.push('- `' + header + '`');
      });
    }
    if (audit.missingCanonicalHeaders.length) {
      lines.push('');
      lines.push('### Header canonical yang belum ada di sheet live');
      lines.push('');
      audit.missingCanonicalHeaders.forEach((header) => {
        lines.push('- `' + header + '`');
      });
    }
    lines.push('');
  });
  return lines.join('\n');
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const getCanonical = loadCanonicalHeaderGetter();
  const aliasMap = loadAliasMap();
  const audits = [];
  for (const dx of DXS) {
    audits.push(await inspectSheet(args.spreadsheetId, dx, getCanonical, aliasMap));
  }
  const report = {
    spreadsheetId: args.spreadsheetId,
    inspectedAt: new Date().toISOString(),
    summary: buildSummary(audits),
    audits
  };
  if (args.format === 'md' || args.format === 'markdown') {
    process.stdout.write(toMarkdown(report));
    return;
  }
  process.stdout.write(JSON.stringify(report, null, 2));
}

main().catch((err) => {
  console.error(err && err.stack ? err.stack : String(err));
  process.exit(1);
});
