const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const src = fs.readFileSync(path.join(__dirname, '..', 'src', 'Controllers', 'dashboard.js'), 'utf8');
const start = src.indexOf('function _buildDashboardRecordSummary_');
const end = src.indexOf('// ─── exportToCsv', start);
const code = src.slice(start, end);

function makeContext() {
  const cache = new Map();
  const sheets = {
    MR_Raw: {
      headers: ['Tanggal Pelacakan', 'Kab/Kota Pasien', 'Kecamatan', 'Kelurahan', 'RW', 'RT', 'Puskesmas Pengampu', 'KodeFaskes Pengampu', 'ID Registrasi Kasus', 'Nomor EPID', 'Nama', 'Alamat lengkap', 'Status Verifikasi EPID', 'Status Pasien/Kasus', 'Timestamp', 'Updated At'],
      rows: [
        ['2026-01-02', 'Depok', 'Pancoran Mas', 'Depok Jaya', '', '', '', '', 'A', 'EP-A', 'User A', '', 'Terverifikasi', 'KLINIS', '2026-01-02', '2026-01-03'],
        ['2026-01-03', 'Bogor', 'Cibinong', 'Pakansari', '', '', '', '', 'B', 'EP-B', 'User B', '', 'Terverifikasi', 'KLINIS', '2026-01-03', '2026-01-04'],
        ['2025-01-04', 'Depok', 'Pancoran Mas', 'Depok Jaya', '', '', '', '', 'OLD', 'EP-OLD', 'Old', '', 'Terverifikasi', 'KLINIS', '2025-01-04', '2025-01-05']
      ]
    }
  };
  const tokens = {
    depokKec: { ok: true, user: { role: 'petugas', unitKerja: 'RS Sama', kodePuskesmas: 'X1', scopeLevel: 'kecamatan', kecamatan: 'Pancoran Mas', kabKota: 'Depok' } },
    cibinongKec: { ok: true, user: { role: 'petugas', unitKerja: 'RS Sama', kodePuskesmas: 'X1', scopeLevel: 'kecamatan', kecamatan: 'Cibinong', kabKota: 'Bogor' } },
    depokKab: { ok: true, user: { role: 'petugas', unitKerja: 'RS Sama', kodePuskesmas: 'X1', scopeLevel: 'kabkota', kecamatan: '', kabKota: 'Depok' } },
    bogorKab: { ok: true, user: { role: 'petugas', unitKerja: 'RS Sama', kodePuskesmas: 'X1', scopeLevel: 'kabkota', kecamatan: '', kabKota: 'Bogor' } },
    admin: { ok: true, user: { role: 'admin' } },
    superAdmin: { ok: true, user: { role: 'super-admin' } }
  };
  const ctx = {
    console,
    Date,
    JSON,
    parseInt,
    isNaN,
    SUPPORTED_DX_: ['MR'],
    CacheService: { getScriptCache: () => ({ get: (k) => cache.get(k) || null, put: (k, v) => cache.set(k, v) }) },
    _getSessionFromToken_: (token) => tokens[token] || { ok: false, message: 'bad session' },
    _readSheetWithCache_: (name) => sheets[name] || null,
    getPengampuByWilayah_: () => ({ found: false }),
    _normalizeWilayahKey_: (v) => String(v || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, ''),
    _findFirstHeaderIndex_: (headers, names) => names.map((n) => headers.indexOf(n)).find((i) => i !== -1) ?? -1,
    _formatDateValue_: (v) => String(v || '').slice(0, 10),
    _formatDateTimeValue_: (v) => String(v || ''),
    _parseCoordinateNumber_: () => null,
    _isValidLatLon_: () => false,
    _incrementCounter_: (obj, key) => { obj[key || 'Tidak diketahui'] = (obj[key || 'Tidak diketahui'] || 0) + 1; },
    _classifySurveillanceAgeGroup_: () => 'Usia tidak diketahui',
    _ageTotalDaysForDashboard_: () => null,
    _diffDays_: () => null,
    _medianNumber_: () => null,
    _buildTopEntries_: (obj) => Object.keys(obj).map((label) => ({ label, count: obj[label] })).sort((a, b) => b.count - a.count),
    _readLastNonEmptyHeaderValue_: () => ''
  };
  vm.createContext(ctx);
  vm.runInContext(code, ctx);
  return ctx;
}

test('dashboard stats cache isolates all territorial scope inputs and still hits identical scope', () => {
  const ctx = makeContext();
  assert.equal(ctx.getDashboardStats('MR', 2026, 'depokKec').totalKasus, 1);
  assert.equal(JSON.stringify(ctx.getDashboardStats('MR', 2026, 'cibinongKec').perKecamatan), JSON.stringify({ Cibinong: 1 }));
  assert.equal(JSON.stringify(ctx.getDashboardStats('MR', 2026, 'depokKab').perKecamatan), JSON.stringify({ 'Pancoran Mas': 1 }));
  assert.equal(JSON.stringify(ctx.getDashboardStats('MR', 2026, 'bogorKab').perKecamatan), JSON.stringify({ Cibinong: 1 }));
  assert.equal(ctx.getDashboardStats('MR', 2026, 'depokKec').totalKasus, 1);
});

test('dashboard admin and super-admin stats include all scoped rows', () => {
  const ctx = makeContext();
  assert.equal(ctx.getDashboardStats('MR', 2026, 'admin').totalKasus, 2);
  assert.equal(ctx.getDashboardStats('MR', 2026, 'superAdmin').totalKasus, 2);
});

test('dashboard guards reject invalid session and unsupported DX', () => {
  const ctx = makeContext();
  assert.equal(ctx.getDashboardStats('MR', 2026, 'bad').status, 'error');
  assert.equal(ctx.getDashboardStats('BAD', 2026, 'admin').status, 'error');
  assert.equal(ctx.getDashboardDrilldown('MR', 2026, { type: 'kecamatan', key: 'Pancoran Mas' }, 'bad').status, 'error');
  assert.equal(ctx.getDashboardDrilldown('BAD', 2026, { type: 'kecamatan', key: 'Pancoran Mas' }, 'admin').status, 'error');
});

test('dashboard drilldown applies scope, dimension, and year with stats parity', () => {
  const ctx = makeContext();
  const a = ctx.getDashboardDrilldown('MR', 2026, { type: 'kecamatan', key: 'Pancoran Mas' }, 'depokKec');
  const b = ctx.getDashboardDrilldown('MR', 2026, { type: 'kecamatan', key: 'Pancoran Mas' }, 'cibinongKec');
  const old = ctx.getDashboardDrilldown('MR', 2025, { type: 'kecamatan', key: 'Pancoran Mas' }, 'depokKec');
  assert.equal(a.total, ctx.getDashboardStats('MR', 2026, 'depokKec').perKecamatan['Pancoran Mas']);
  assert.equal(a.items[0].recordId, 'A');
  assert.equal(b.total, 0);
  assert.equal(old.total, 1);
});
