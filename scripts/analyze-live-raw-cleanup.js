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
    format: 'json',
    maxExamples: 0
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--spreadsheet-id' && argv[i + 1]) out.spreadsheetId = argv[++i];
    else if (arg === '--format' && argv[i + 1]) out.format = String(argv[++i]).trim().toLowerCase();
    else if (arg === '--max-examples' && argv[i + 1]) out.maxExamples = Math.max(0, Number(argv[++i]) || 0);
  }
  return out;
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let current = '';
  let i = 0;
  let inQuotes = false;
  while (i < text.length) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
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
    if (ch === '"') {
      inQuotes = true;
      i += 1;
      continue;
    }
    if (ch === ',') {
      row.push(current);
      current = '';
      i += 1;
      continue;
    }
    if (ch === '\n') {
      row.push(current);
      rows.push(row);
      row = [];
      current = '';
      i += 1;
      continue;
    }
    if (ch === '\r') {
      i += 1;
      continue;
    }
    current += ch;
    i += 1;
  }
  row.push(current);
  if (row.length > 1 || row[0] !== '' || text.endsWith(',')) rows.push(row);
  return rows;
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

function trimCell(row, idx) {
  if (!row || idx < 0 || idx >= row.length) return '';
  return String(row[idx] == null ? '' : row[idx]).trim();
}

function inspectBlankColumns(headers, rows, maxExamples) {
  return headers
    .map((header, idx) => ({ header, idx }))
    .filter((item) => !String(item.header || '').trim())
    .map((item) => {
      const examples = [];
      let nonEmptyCount = 0;
      rows.forEach((row, rIdx) => {
        const value = trimCell(row, item.idx);
        if (!value) return;
        nonEmptyCount += 1;
        if (examples.length < maxExamples) {
          examples.push({ rowNumber: rIdx + 2, value });
        }
      });
      return {
        columnIndex: item.idx + 1,
        nonEmptyCount,
        examples
      };
    });
}

function inspectAliasBackfill(headers, rows, aliasMap, maxExamples) {
  const byHeader = new Map();
  headers.forEach((header, idx) => {
    if (!byHeader.has(header)) byHeader.set(header, []);
    byHeader.get(header).push(idx);
  });
  const out = [];
  Object.entries(aliasMap).forEach(([sourceHeader, targetHeader]) => {
    const sourceIdxs = byHeader.get(sourceHeader) || [];
    const targetIdxs = byHeader.get(targetHeader) || [];
    if (!sourceIdxs.length || !targetIdxs.length) return;
    const examples = [];
    let sourceNonEmptyTargetEmpty = 0;
    let sourceAndTargetDifferent = 0;
    rows.forEach((row, rIdx) => {
      const sourceValue = sourceIdxs.map((idx) => trimCell(row, idx)).find(Boolean) || '';
      const targetValue = targetIdxs.map((idx) => trimCell(row, idx)).find(Boolean) || '';
      if (sourceValue && !targetValue) {
        sourceNonEmptyTargetEmpty += 1;
        if (examples.length < maxExamples) examples.push({ rowNumber: rIdx + 2, sourceValue, targetValue });
      } else if (sourceValue && targetValue && sourceValue !== targetValue) {
        sourceAndTargetDifferent += 1;
        if (examples.length < maxExamples) examples.push({ rowNumber: rIdx + 2, sourceValue, targetValue });
      }
    });
    if (sourceNonEmptyTargetEmpty || sourceAndTargetDifferent) {
      out.push({
        sourceHeader,
        targetHeader,
        sourceColumns: sourceIdxs.map((idx) => idx + 1),
        targetColumns: targetIdxs.map((idx) => idx + 1),
        sourceNonEmptyTargetEmpty,
        sourceAndTargetDifferent,
        examples
      });
    }
  });
  return out.sort((a, b) =>
    (b.sourceNonEmptyTargetEmpty + b.sourceAndTargetDifferent) -
    (a.sourceNonEmptyTargetEmpty + a.sourceAndTargetDifferent)
  );
}

async function inspectDx(spreadsheetId, dx, getCanonical, aliasMap, maxExamples) {
  const sheetName = `${dx}_Raw`;
  const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;
  const body = await fetch(url);
  const parsed = parseCsv(body);
  const headers = (parsed[0] || []).map((v) => String(v || '').trim());
  const rows = parsed.slice(1);
  const canonicalHeaders = getCanonical(dx);
  const missingCanonicalHeaders = canonicalHeaders.filter((header) => !headers.includes(header));
  const nonCanonicalHeaders = headers.filter((header) => header && !canonicalHeaders.includes(header));
  const aliasLegacyHeaders = headers
    .filter((header) => aliasMap[header])
    .map((header) => ({ header, targetHeader: aliasMap[header] }));
  const blankColumns = inspectBlankColumns(headers, rows, maxExamples);
  const aliasBackfillCandidates = inspectAliasBackfill(headers, rows, aliasMap, maxExamples);
  return {
    dx,
    sheetName,
    rowCount: rows.length + 1,
    dataRowCount: rows.length,
    columnCount: headers.length,
    blankHeaderCount: blankColumns.length,
    blankColumns,
    aliasLegacyHeaderCount: aliasLegacyHeaders.length,
    aliasLegacyHeaders,
    aliasBackfillCandidateCount: aliasBackfillCandidates.length,
    aliasBackfillCandidates,
    nonCanonicalHeaderCount: nonCanonicalHeaders.length,
    nonCanonicalHeaders,
    missingCanonicalHeaderCount: missingCanonicalHeaders.length,
    missingCanonicalHeaders
  };
}

function buildSummary(audits) {
  return audits.map((audit) => ({
    dx: audit.dx,
    rows: audit.rowCount,
    cols: audit.columnCount,
    blankHeaders: audit.blankHeaderCount,
    blankHeadersWithData: audit.blankColumns.filter((col) => col.nonEmptyCount > 0).length,
    aliasLegacyLive: audit.aliasLegacyHeaderCount,
    aliasBackfillCandidates: audit.aliasBackfillCandidateCount,
    nonCanonicalLive: audit.nonCanonicalHeaderCount,
    missingCanonical: audit.missingCanonicalHeaderCount
  }));
}

function toMarkdown(report) {
  const lines = [];
  lines.push('# Live Raw Cleanup Analysis');
  lines.push('');
  lines.push('- Spreadsheet ID: `' + report.spreadsheetId + '`');
  lines.push('- Inspected at: ' + report.inspectedAt);
  lines.push('- Source: public `gviz/tq?tqx=out:csv` full-sheet read per `*_Raw` sheet');
  lines.push('');
  lines.push('## Ringkasan');
  lines.push('');
  lines.push('| DX | Rows | Cols | Blank headers | Blank headers with data | Alias legacy live | Alias backfill candidates | Non-canonical live | Missing canonical |');
  lines.push('| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |');
  report.summary.forEach((item) => {
    lines.push(`| ${item.dx} | ${item.rows} | ${item.cols} | ${item.blankHeaders} | ${item.blankHeadersWithData} | ${item.aliasLegacyLive} | ${item.aliasBackfillCandidates} | ${item.nonCanonicalLive} | ${item.missingCanonical} |`);
  });
  lines.push('');
  report.audits.forEach((audit) => {
    lines.push(`## ${audit.dx}`);
    lines.push('');
    lines.push(`- Sheet: \`${audit.sheetName}\``);
    lines.push(`- Rows read: ${audit.rowCount} (${audit.dataRowCount} data rows)`);
    lines.push(`- Total columns: ${audit.columnCount}`);
    lines.push(`- Missing canonical: ${audit.missingCanonicalHeaderCount}`);
    lines.push(`- Blank headers: ${audit.blankHeaderCount}`);
    if (audit.blankColumns.length) {
      lines.push('');
      lines.push('### Blank header columns');
      lines.push('');
      audit.blankColumns.forEach((col) => {
        lines.push(`- Column ${col.columnIndex}: ${col.nonEmptyCount} non-empty cells`);
        col.examples.forEach((ex) => {
          lines.push(`  - Row ${ex.rowNumber}: \`${String(ex.value).replace(/`/g, '\\`')}\``);
        });
      });
    }
    if (audit.aliasBackfillCandidates.length) {
      lines.push('');
      lines.push('### Alias backfill candidates');
      lines.push('');
      audit.aliasBackfillCandidates.forEach((item) => {
        lines.push(`- \`${item.sourceHeader}\` → \`${item.targetHeader}\`: source-filled/target-empty=${item.sourceNonEmptyTargetEmpty}, different=${item.sourceAndTargetDifferent}`);
        item.examples.forEach((ex) => {
          lines.push(`  - Row ${ex.rowNumber}: source=\`${String(ex.sourceValue).replace(/`/g, '\\`')}\`, target=\`${String(ex.targetValue).replace(/`/g, '\\`')}\``);
        });
      });
    }
    if (audit.aliasLegacyHeaders.length) {
      lines.push('');
      lines.push('### Alias legacy live');
      lines.push('');
      audit.aliasLegacyHeaders.forEach((item) => {
        lines.push(`- \`${item.header}\` → \`${item.targetHeader}\``);
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
    audits.push(await inspectDx(args.spreadsheetId, dx, getCanonical, aliasMap, args.maxExamples));
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
