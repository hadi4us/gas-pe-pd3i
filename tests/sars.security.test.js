const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'SARS', 'submit_sars.js'), 'utf8');
function extractFunction(text, name) {
  const start = text.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `${name} not found`);
  const brace = text.indexOf('{', start);
  let depth = 0;
  for (let i = brace; i < text.length; i++) {
    if (text[i] === '{') depth++;
    if (text[i] === '}') {
      depth--;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  throw new Error(`Could not extract ${name}`);
}

function makeSubmit(session) {
  const sandbox = {
    _sTrim_: v => String(v ?? '').trim(),
    _sRequire_: (condition, message) => { if (!condition) throw new Error(message); },
    _sIsObj_: v => v && typeof v === 'object' && !Array.isArray(v),
    _sToInt_: v => Number.isFinite(Number(v)) ? Math.floor(Number(v)) : NaN,
    _getSessionFromToken_: token => token ? session : { ok: false, message: 'Sesi tidak valid.' },
    _normalizePd3iRole_: role => String(role || '').toLowerCase().replace(/[_\s]+/g, '-'),
    _normKey_: value => String(value || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, ''),
    getSarsFacilityForActiveUser: () => ({ status: 'success', key: 'FASKES-A', nama: 'Faskes A' })
  };
  const helper = extractFunction(source, '_getSarsSubmitSession_');
  const roles = source.match(/const SARS_SUBMIT_ROLES_ = \[[^;]+\];/)[0];
  vm.runInNewContext(`${roles}; ${helper}; ${extractFunction(source, 'submitSARS')}; this.submitSARS = submitSARS;`, sandbox);
  return sandbox.submitSARS;
}

const basePayload = {
  mingguEpid: 1, namaPelapor: 'client', noWA: '0800', unitPelapor: 'client-unit',
  jenisFaskes: 'klinik', asalFaskes: 'Faskes A', cases: []
};

test('submitSARS rejects missing token at runtime boundary', () => {
  const submit = makeSubmit(null);
  assert.throws(() => submit(basePayload), /Sesi tidak valid/);
});

test('submitSARS rejects unauthorized role at runtime boundary', () => {
  const submit = makeSubmit({ ok: true, user: { role: 'viewer', email: 'user@example.com' } });
  assert.throws(() => submit({ ...basePayload, __token: 'token' }), /Role tidak berwenang/);
});

test('submitSARS rejects facility mismatch before write path', () => {
  const submit = makeSubmit({ ok: true, user: { role: 'petugas', email: 'user@example.com', nama: 'Session User', unitKerja: 'Session Unit', kodePuskesmas: 'FASKES-A' } });
  assert.throws(() => submit({ ...basePayload, __token: 'token', asalFaskes: 'Other Facility' }), /Fasilitas laporan tidak sesuai/);
});

test('submitSARS reaches validated write path with matching session facility', () => {
  const submit = makeSubmit({ ok: true, user: { role: 'petugas', email: 'user@example.com', nama: 'Session User', unitKerja: 'Session Unit', kodePuskesmas: 'FASKES-A' } });
  assert.throws(() => submit({ ...basePayload, __token: 'token', asalFaskes: 'Faskes A' }), /ReferenceError: _getCfg_|_getCfg_/);
});
