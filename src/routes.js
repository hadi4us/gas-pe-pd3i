function doGet(e) {
  const action = String((e && e.parameter && e.parameter.action) || "").trim().toLowerCase();

  if (action === "print") {
    return handlePrintRequest_(e);
  }

  const allowedWorkspaces = ["overview", "search", "input", "verifikasi", "sampel", "status", "guide"];
  const view = String((e && e.parameter && e.parameter.view) || "").trim().toLowerCase() === "dashboard"
    ? "dashboard"
    : "app";
  const requestedWorkspace = String((e && e.parameter && e.parameter.workspace) || "").trim().toLowerCase();
  const initialWorkspace = view === "dashboard"
    ? "dashboard"
    : (allowedWorkspaces.indexOf(requestedWorkspace) !== -1 ? requestedWorkspace : "overview");

  const serviceUrl = String(ScriptApp.getService().getUrl() || "").trim();
  const template = HtmlService.createTemplateFromFile("index");
  template.initialView = view;
  template.initialWorkspace = initialWorkspace;
  template.appUrl = serviceUrl || "";
  template.dashboardUrl = serviceUrl ? (serviceUrl + "?view=dashboard") : "";

  return template
    .evaluate()
    .setTitle(view === "dashboard" ? "Dashboard Statistik PD3I" : "Form PE Surveilans PD3I")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag("viewport", "width=device-width, initial-scale=1");
}

function doPost(e) {
  const lock = LockService.getScriptLock();

  try {
    lock.waitLock(30000);

    if (!e || !e.postData || !e.postData.contents) {
      return responseJSON({ status: "error", message: "Payload kosong." });
    }

    let data = {};
    try {
      data = JSON.parse(e.postData.contents || "{}");
    } catch (err) {
      return responseJSON({ status: "error", message: "Payload JSON tidak valid." });
    }

    data.__alreadyLocked = true;
    const action = String(data.__action || data.action || "").trim();
    const result = action ? _routeDedicatedWorkflowAction_(action, data) : saveFormPayload_(data);
    return responseJSON(result);
  } catch (err) {
    return responseJSON({ status: "error", message: String(err) });
  } finally {
    try { lock.releaseLock(); } catch (e2) {}
  }
}

function saveFormData(data) {
  const lock = LockService.getScriptLock();

  try {
    lock.waitLock(30000);
    return saveFormPayload_(data || {});
  } catch (err) {
    return { status: "error", message: String(err) };
  } finally {
    try { lock.releaseLock(); } catch (e2) {}
  }
}

function _routeDedicatedWorkflowAction_(action, payload) {
  action = String(action || '').trim();
  payload = Object.assign({}, payload || {});
  const token = String(payload.__token || '').trim();
  const dx = String(payload.dx || '').trim().toUpperCase();
  const recordKey = String(payload.recordKey || payload['ID Registrasi Kasus'] || payload.RAW_ROW_NUMBER || payload['Nomor EPID'] || payload['Nomor EPID Final'] || '').trim();
  const filters = payload.filters || payload;
  switch (action) {
    case 'createInitialCase': return createInitialCase(token, payload);
    case 'getEditableRecords': return getEditableRecords(token, dx, filters);
    case 'getEditableRecord': return getEditableRecord(token, dx, recordKey);
    case 'saveInitialReportEdit': return saveInitialReportEdit(token, payload);
    case 'deleteCaseRecord': return deleteCaseRecord(token, payload);
    case 'getVerificationQueue': return getVerificationQueue(dx, token, filters);
    case 'getVerificationRecord': return getVerificationRecord(dx, recordKey, token);
    case 'saveVerificationDecision': return saveVerificationDecision(token, payload);
    case 'getSampleQueue': return getSampleQueue(dx, token, filters);
    case 'getSampleRecord': return getSampleRecord(dx, recordKey, token);
    case 'saveSampleResult': return saveSampleResult(token, payload);
    case 'getStatusQueue': return getStatusQueue(dx, token, filters);
    case 'getStatusRecord': return getStatusRecord(dx, recordKey, token);
    case 'saveCaseStatusUpdate': return saveCaseStatusUpdate(token, payload);
    default: throw new Error('Aksi workflow tidak dikenal: ' + action);
  }
}

function _saveDedicatedWorkflowPayload_(token, payload, workflowStage, extra) {
  payload = Object.assign({}, payload || {}, extra || {});
  payload.__token = token || payload.__token || '';
  payload.__workflowStage = workflowStage;
  if (payload.__alreadyLocked) return saveFormPayload_(payload);
  return saveFormData(payload);
}

function createInitialCase(token, payload) {
  return _saveDedicatedWorkflowPayload_(token, payload, 'section-pelapor', { 'Status Verifikasi EPID': String((payload && payload['Status Verifikasi EPID']) || '').trim() || 'Pending' });
}

function getEditableRecords(token, dx, filters) {
  filters = Object.assign({}, filters || {}, { workspace: 'edit', workflowIntent: 'section-pelapor' });
  return _searchRecordsDirectFromSheet_(dx, filters, token);
}

function getEditableRecord(token, dx, recordKey) {
  return getRecordByKey(dx, recordKey, token);
}

function saveInitialReportEdit(token, payload) {
  return _saveDedicatedWorkflowPayload_(token, payload, 'section-pelapor', { __editMode: 'initial_report' });
}

function searchEditableRecords(token, dx, filters) {
  return getEditableRecords(token, dx, filters);
}

function updateInitialReport(token, payload) {
  return saveInitialReportEdit(token, payload);
}

function deleteCaseRecord(token, payload) {
  const user = _requireAdminFromToken_(token);
  payload = Object.assign({}, payload || {});
  const dx = String(payload.dx || '').trim().toUpperCase();
  const recordKey = String(payload.recordKey || payload['ID Registrasi Kasus'] || payload['Nomor EPID'] || '').trim();
  if (ALL_DX.indexOf(dx) === -1) throw new Error('Diagnosis tidak valid.');
  if (!recordKey) throw new Error('recordKey wajib diisi.');

  const sheet = getSheetOrThrow_(dx + '_Raw');
  let headers = getTrimmedHeaders_(sheet);
  headers = _ensureSheetHeaders_(sheet, ['Deleted At', 'Deleted By', 'Deleted Reason']);

  const values = sheet.getDataRange().getValues();
  if (!values || values.length < 2) throw new Error('Data kasus tidak ditemukan.');
  headers = values[0].map(function(h) { return String(h || '').trim(); });
  const idxRecordId = headers.indexOf('ID Registrasi Kasus');
  const idxEpid = headers.indexOf('Nomor EPID');
  const idxDeletedAt = headers.indexOf('Deleted At');
  const idxDeletedBy = headers.indexOf('Deleted By');
  const idxDeletedReason = headers.indexOf('Deleted Reason');
  const rowKeyMatch = recordKey.match(/^ROW:(\d+)$/i);
  let rowIndex = -1;

  if (rowKeyMatch) {
    const rowNumber = parseInt(rowKeyMatch[1], 10);
    if (!isNaN(rowNumber) && rowNumber >= 2 && rowNumber <= values.length) rowIndex = rowNumber;
  }
  if (rowIndex === -1) {
    for (let i = 1; i < values.length; i++) {
      const rowRecordId = idxRecordId !== -1 ? String(values[i][idxRecordId] || '').trim() : '';
      const rowEpid = idxEpid !== -1 ? String(values[i][idxEpid] || '').trim() : '';
      if ((rowRecordId && rowRecordId === recordKey) || (rowEpid && rowEpid === recordKey)) {
        rowIndex = i + 1;
        break;
      }
    }
  }
  if (rowIndex === -1) throw new Error('Data kasus tidak ditemukan.');

  const now = new Date();
  if (idxDeletedAt !== -1) sheet.getRange(rowIndex, idxDeletedAt + 1).setValue(now);
  if (idxDeletedBy !== -1) sheet.getRange(rowIndex, idxDeletedBy + 1).setValue(String(user.username || user.name || user.role || 'admin'));
  if (idxDeletedReason !== -1) sheet.getRange(rowIndex, idxDeletedReason + 1).setValue(String(payload.reason || 'Dihapus melalui List Kasus').trim());

  try { Cache_Manager.invalidateSheetCache(dx + '_Raw'); } catch (e) {}
  try {
    Audit_Logger.logChange(user, dx, recordKey, 'DELETE', { 'Deleted At': { old: '', new: String(now) } }, { source: 'List Kasus' });
  } catch (e) {}

  return { ok: true, status: 'success', dx: dx, recordKey: recordKey, rowIndex: rowIndex };
}

function getVerificationQueue(dx, token, filters) {
  filters = Object.assign({}, filters || {}, { workspace: 'verifikasi', workflowIntent: 'section-verifikasi' });
  return _searchRecordsDirectFromSheet_(dx, filters, token);
}

function getVerificationRecord(dx, recordKey, token) {
  return getRecordByKey(dx, recordKey, token);
}

function saveVerificationDecision(token, payload) {
  return _saveDedicatedWorkflowPayload_(token, payload, 'section-verifikasi');
}

function getSampleQueue(dx, token, filters) {
  filters = Object.assign({}, filters || {}, { workspace: 'sampel', workflowIntent: 'section-sampel' });
  return _searchRecordsDirectFromSheet_(dx, filters, token);
}

function getSampleRecord(dx, recordKey, token) {
  return getRecordByKey(dx, recordKey, token);
}

function saveSampleResult(token, payload) {
  return _saveDedicatedWorkflowPayload_(token, payload, 'section-sampel');
}

function getStatusQueue(dx, token, filters) {
  filters = Object.assign({}, filters || {}, { workspace: 'status', workflowIntent: 'section-status' });
  return _searchRecordsDirectFromSheet_(dx, filters, token);
}

function getStatusRecord(dx, recordKey, token) {
  return getRecordByKey(dx, recordKey, token);
}

function saveCaseStatusUpdate(token, payload) {
  return _saveDedicatedWorkflowPayload_(token, payload, 'section-status');
}

function _getRowObjectByEpid_(dx, epid) {
  const sheet = getSheetOrThrow_(String(dx || "").trim().toUpperCase() + "_Raw");
  const data = sheet.getDataRange().getValues();
  if (!data || data.length < 2) throw new Error("Sheet raw kosong.");
  const headers = data[0].map(h => String(h || "").trim());
  const idxEpid = headers.indexOf("Nomor EPID");
  if (idxEpid === -1) throw new Error("Kolom Nomor EPID tidak ditemukan.");

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][idxEpid] || "").trim() === String(epid || "").trim()) {
      const obj = {};
      headers.forEach((h, j) => { obj[h] = data[i][j]; });
      return obj;
    }
  }
  throw new Error("EPID tidak ditemukan: " + epid);
}

function _requireAdminFromToken_(token) {
  const sess = _getSessionFromToken_(token);
  if (!sess.ok || !sess.user) throw new Error(sess.message || "Sesi tidak valid.");
  const role = String(sess.user.role || "").trim().toLowerCase();
  if (role !== "admin") throw new Error("Aksi ini hanya untuk admin.");
  return sess.user;
}

function _normalizeRefKey_(value) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "");
}

function _normalizeFaskesJenis_(value) {
  var raw = String(value || '').trim().toUpperCase();
  if (!raw) return '';
  raw = raw.replace(/[\/_-]+/g, ' ').replace(/\s+/g, ' ').trim();
  if (raw === 'PKM' || raw.indexOf('PUSKESMAS') !== -1 || raw.indexOf('PUSKES') !== -1) return 'PUSKESMAS';
  if (raw === 'RS' || raw.indexOf('RUMAH SAKIT') !== -1 || raw.indexOf('HOSPITAL') !== -1 || raw.indexOf('RUMKIT') !== -1 || raw.startsWith('RS')) return 'RUMAH SAKIT';
  if (raw.indexOf('KLINIK') !== -1) return 'KLINIK';
  if (raw.indexOf('TPMB') !== -1 || raw.indexOf('BPM') !== -1 || raw.indexOf('BIDAN PRAKTIK') !== -1) return 'TPMB';
  if (raw.indexOf('TPMD') !== -1) return 'TPMD';
  if (raw.indexOf('PRAKTIK') !== -1 || raw.indexOf('DOKTER') !== -1) return 'PRAKTIK MANDIRI';
  if (raw.indexOf('LAB') !== -1) return 'LABORATORIUM';
  if (raw.indexOf('MASYARAKAT') !== -1) return 'MASYARAKAT';
  if (raw === 'DLL' || raw.indexOf('DLL') !== -1 || raw.indexOf('LAIN') !== -1) return 'LAINNYA';
  return raw;
}

function _resolveFaskesJenis_(jenisValue, namaValue) {
  var normalizedJenis = _normalizeFaskesJenis_(jenisValue);
  if (normalizedJenis) return normalizedJenis;
  return _normalizeFaskesJenis_(namaValue);
}

function getRecordByKey(dx, recordKey, token) {
  const sess = _getSessionFromToken_(token);
  if (!sess.ok) throw new Error(sess.message || "Sesi tidak valid.");

  dx = String(dx || "").trim().toUpperCase();
  recordKey = String(recordKey || "").trim();
  if (!dx) throw new Error("DX wajib diisi.");
  if (!recordKey) throw new Error("recordKey wajib diisi.");

  const sheet = getSheetOrThrow_(dx + "_Raw");
  const values = sheet.getDataRange().getValues();
  if (!values || values.length < 2) return null;

  const headers = values[0].map(function(h) { return String(h || "").trim(); });
  const idxRecordId = headers.indexOf("ID Registrasi Kasus");
  const idxEpid = headers.indexOf("Nomor EPID");
  const target = String(recordKey || "").trim();
  const rowKeyMatch = target.match(/^ROW:(\d+)$/i);

  if (rowKeyMatch) {
    const rowNumber = parseInt(rowKeyMatch[1], 10);
    if (!isNaN(rowNumber) && rowNumber >= 2 && rowNumber <= values.length) {
      const record = (typeof deserializeRecord_ === 'function')
        ? deserializeRecord_(values[rowNumber - 1], headers)
        : (function() {
            const obj = {};
            headers.forEach(function(h, idx) { obj[h] = values[rowNumber - 1][idx]; });
            return obj;
          })();
      record.dx = dx;
      record.RAW_ROW_NUMBER = rowNumber;
      if (!_canSessionReadRecordByScope_(sess, dx, record)) throw new Error('Akses record di luar wilayah kerja tidak diizinkan.');
      return record;
    }
  }

  for (let i = 1; i < values.length; i++) {
    const rowRecordId = idxRecordId !== -1 ? String(values[i][idxRecordId] || "").trim() : "";
    const rowEpid = idxEpid !== -1 ? String(values[i][idxEpid] || "").trim() : "";
    if (rowRecordId === target || rowEpid === target) {
      const record = (typeof deserializeRecord_ === 'function')
        ? deserializeRecord_(values[i], headers)
        : (function() {
            const obj = {};
            headers.forEach(function(h, idx) { obj[h] = values[i][idx]; });
            return obj;
          })();
      record.dx = dx;
      record.RAW_ROW_NUMBER = i + 1;
      if (!_canSessionReadRecordByScope_(sess, dx, record)) throw new Error('Akses record di luar wilayah kerja tidak diizinkan.');
      return record;
    }
  }

  return null;
}

function getRecordByEpid(dx, epid, token) {
  return getRecordByKey(dx, epid, token);
}

function getRefImunisasi(token) {
  const sess = _getSessionFromToken_(token);
  if (!sess.ok) throw new Error(sess.message || "Sesi tidak valid.");

  var raw = null;
  try {
    if (typeof Cache_Manager !== 'undefined' && Cache_Manager && typeof Cache_Manager.getSheetData === 'function') {
      raw = Cache_Manager.getSheetData('REF_IMUN');
    }
  } catch (e) {}

  if (!raw) {
    const sheet = getSheetOrNull_('REF_IMUN');
    if (!sheet) return [];
    raw = sheet.getDataRange().getValues();
    try {
      if (typeof Cache_Manager !== 'undefined' && Cache_Manager && typeof Cache_Manager.setSheetData === 'function') {
        Cache_Manager.setSheetData('REF_IMUN', raw);
      }
    } catch (e) {}
  }

  if (!raw || raw.length < 2) return [];

  const headers = raw[0].map(function(h) { return String(h || '').trim(); });
  const rows = raw.slice(1);
  const idxAktif = headers.indexOf('Aktif');

  return rows
    .map(function(row) {
      const aktif = idxAktif !== -1 ? String(row[idxAktif] || '').trim().toUpperCase() : 'YA';
      if (aktif && ['0', 'FALSE', 'NO', 'N', 'TIDAK', 'NONAKTIF'].indexOf(aktif) !== -1) return null;
      const item = {};
      headers.forEach(function(h, idx) {
        if (!h) return;
        item[h] = row[idx];
      });
      return item;
    })
    .filter(function(item) {
      return item && String(item.KodeImunisasi || '').trim() && String(item.LabelImunisasi || '').trim();
    });
}

function fetchRefImunData(token) {
  return getRefImunisasi(token);
}

function getFaskesFromSheet(token) {
  const sess = _getSessionFromToken_(token);
  if (!sess.ok) throw new Error(sess.message || "Sesi tidak valid.");

  var raw = null;
  try {
    if (typeof Cache_Manager !== 'undefined' && Cache_Manager && typeof Cache_Manager.getSheetData === 'function') {
      raw = Cache_Manager.getSheetData('REF_FASKES');
    }
  } catch (e) {}

  if (!raw) {
    const sheet = getSheetOrNull_('REF_FASKES');
    if (!sheet) return [];
    raw = sheet.getDataRange().getValues();
    try {
      if (typeof Cache_Manager !== 'undefined' && Cache_Manager && typeof Cache_Manager.setSheetData === 'function') {
        Cache_Manager.setSheetData('REF_FASKES', raw);
      }
    } catch (e) {}
  }

  if (!raw || raw.length < 2) return [];

  const headers = raw[0].map(function(h) { return String(h || '').trim(); });
  const rows = raw.slice(1);
  const findIdx = function(candidates) {
    for (var i = 0; i < candidates.length; i++) {
      var idx = headers.indexOf(candidates[i]);
      if (idx !== -1) return idx;
    }
    return -1;
  };

  const idxJenis = findIdx(['Jenis', 'JenisFaskes', 'Jenis Faskes', 'Jenis Fasyankes', 'Jenis Pelapor', 'Jenis Sumber Laporan', 'Sumber Laporan', 'Jenis Unit', 'Tipe', 'Tipe Faskes', 'Tipe Fasyankes', 'Kategori', 'Kelompok']);
  const idxNama = findIdx(['NamaFaskes', 'Nama Faskes', 'NamaFasyankes', 'Nama Fasyankes', 'Nama unit pelapor', 'Nama Unit', 'Nama Rumah Sakit', 'Nama']);
  const idxKey = findIdx(['FaskesKey', 'Key', 'Kode', 'Kode Faskes', 'KodeFaskes', 'Kode Fasyankes', 'ID']);
  const idxAktif = findIdx(['StatusAktif', 'Status Aktif', 'Aktif', 'IsActive', 'Active', 'Status']);

  return rows
    .map(function(row) {
      const nama = idxNama !== -1 ? String(row[idxNama] || '').trim() : '';
      const jenis = _resolveFaskesJenis_(idxJenis !== -1 ? row[idxJenis] : '', nama);
      const aktif = idxAktif !== -1 ? String(row[idxAktif] || '').trim().toUpperCase() : 'YA';
      const key = idxKey !== -1 ? String(row[idxKey] || '').trim() : _normalizeRefKey_(nama);
      if (!nama) return null;
      if (aktif && ['0', 'FALSE', 'NO', 'N', 'TIDAK', 'NONAKTIF'].indexOf(aktif) !== -1) return null;
      return {
        nama: nama,
        jenis: jenis,
        key: key
      };
    })
    .filter(Boolean)
    .sort(function(a, b) {
      const jenisA = String(a.jenis || '').localeCompare(String(b.jenis || ''));
      if (jenisA !== 0) return jenisA;
      return String(a.nama || '').localeCompare(String(b.nama || ''));
    });
}

// ─── Daftar semua DX yang didukung ───────────────────────────────────────────
const ALL_DX = ["MR", "DIF", "PERT", "TN", "AFP"];

function _searchNormalizeText_(value) {
  return String(value || "").trim().toUpperCase();
}

function _searchNormalizeDate_(value) {
  return String(value || "").trim().slice(0, 10);
}

function _searchIncludes_(haystack, needle) {
  const source = _searchNormalizeText_(haystack);
  const target = _searchNormalizeText_(needle);
  if (!target) return true;
  return source.indexOf(target) !== -1;
}

function _searchItemMatchesKeyword_(item, keyword) {
  const target = String(keyword || '').trim();
  if (!target) return true;
  const haystack = [
    item && item.epid,
    item && item.recordId,
    item && item.recordKey,
    item && item.namaSearch,
    item && item.nama,
    item && item.tanggalLahir,
    item && item.orangTua,
    item && item.alamat,
    item && item.kecamatan,
    item && item.kelurahan,
    item && item.statusKasus,
    item && item.statusVerifikasi
  ].filter(Boolean).join(' ');
  return _searchIncludes_(haystack, target);
}

function _normalizeVerificationStatus_(value) {
  const raw = _searchNormalizeText_(value);
  if (!raw) return 'PENDING';
  if (raw === 'TERVERIFIKASI') return 'TERVERIFIKASI';
  if (raw === 'PERLU REVISI') return 'PERLU REVISI';
  if (raw === 'PENDING') return 'PENDING';
  return raw;
}

function _buildSearchProjectionRecord_(headers, row) {
  const candidateGroups = [
    ['ID Registrasi Kasus'],
    ['Nomor EPID'],
    ['Nama Pasien', 'Nama'],
    ['Tanggal Lahir'],
    ['Nama Orang Tua/Wali', 'Nama orang tua/wali', 'Nama Orang Tua', 'Nama Ibu'],
    ['Alamat', 'Alamat Domisili', 'Alamat Lengkap'],
    ['Kab/Kota Pasien', 'Kab/Kota', 'Kabupaten/Kota'],
    ['Kecamatan'],
    ['Kelurahan', 'Kelurahan domisili', 'Kelurahan/Desa'],
    ['Status Pasien/Kasus', 'Keadaan saat ini'],
    ['Status Verifikasi EPID'],
    ['Sampel Diambil?', 'Apakah spesimen darah diambil', 'Apakah spesimen lain diambil'],
    ['Interpretasi Hasil', 'Interpretasi Sampel', 'Hasil Pemeriksaan', 'Hasil Lab'],
    ['Deleted At'],
    ['Diinput Oleh'],
    ['Input Awal Diisi Oleh'],
    ['Timestamp'],
    ['Updated At']
  ];
  const record = {};
  const idxMemo = {};
  candidateGroups.forEach(function(group) {
    group.forEach(function(key) {
      if (idxMemo[key] === undefined) idxMemo[key] = headers.indexOf(key);
      var idx = idxMemo[key];
      if (idx !== -1) record[key] = row[idx];
    });
  });
  return record;
}

function _mapSearchResultItem_(dx, record) {
  const getFirst = function(keys) {
    for (var i = 0; i < keys.length; i++) {
      var val = record[keys[i]];
      if (val !== undefined && val !== null && String(val).trim() !== '') {
        return String(val).trim();
      }
    }
    return '';
  };

  const recordId = getFirst(['ID Registrasi Kasus']);
  const epid = getFirst(['Nomor EPID']);
  const namaPasien = getFirst(['Nama Pasien', 'Nama']);
  return {
    dx: String(dx || '').trim().toUpperCase(),
    recordKey: recordId || epid,
    recordId: recordId,
    epid: epid,
    nama: namaPasien,
    namaSearch: namaPasien,
    tanggalLahir: getFirst(['Tanggal Lahir']),
    orangTua: getFirst(['Nama Orang Tua/Wali', 'Nama orang tua/wali', 'Nama Orang Tua', 'Nama Ibu']),
    alamat: getFirst(['Alamat', 'Alamat Domisili', 'Alamat Lengkap']),
    kelurahan: getFirst(['Kelurahan']),
    kecamatan: getFirst(['Kecamatan']),
    statusKasus: getFirst(['Status Pasien/Kasus', 'Keadaan saat ini']),
    statusVerifikasi: getFirst(['Status Verifikasi EPID']),
    sampelDilakukan: getFirst(['Sampel Diambil?', 'Apakah spesimen darah diambil', 'Apakah spesimen lain diambil']),
    interpretasiSampel: getFirst(['Interpretasi Hasil', 'Interpretasi Sampel', 'Hasil Pemeriksaan', 'Hasil Lab']),
    deletedAt: getFirst(['Deleted At']),
    inputAt: getFirst(['Timestamp']),
    updatedAt: getFirst(['Updated At'])
  };
}

function searchRecords(dx, filters, token) {
  const sess = _getSessionFromToken_(token);
  if (!sess.ok) throw new Error(sess.message || 'Sesi tidak valid.');

  dx = String(dx || '').trim().toUpperCase();
  filters = filters || {};
  const workspace = String(filters.workspace || '').trim().toLowerCase();
  const workflowIntent = String(filters.workflowIntent || '').trim().toLowerCase();
  const isLooseSearchWorkspace = workspace === 'search';
  const dxList = isLooseSearchWorkspace ? ALL_DX.slice() : (ALL_DX.indexOf(dx) !== -1 ? [dx] : ALL_DX.slice());
  const keywordNeedle = String(filters.keyword || filters.q || '').trim();
  const epidNeedle = String(filters.epid || '').trim();
  const namaNeedle = String(filters.nama || '').trim();
  const tanggalNeedle = _searchNormalizeDate_(filters.tanggalLahir || '');
  const orangTuaNeedle = String(filters.orangTua || '').trim();
  const alamatNeedle = String(filters.alamat || '').trim();
  const diagnosisNeedle = String(filters.diagnosis || filters.dxFilter || '').trim().toUpperCase();
  const kecamatanNeedle = String(filters.kecamatan || '').trim();
  const kelurahanNeedle = String(filters.kelurahan || '').trim();
  const statusKasusNeedle = String(filters.statusKasus || '').trim();
  const statusVerifikasiNeedle = String(filters.statusVerifikasi || '').trim();
  const sortBy = String(filters.sortBy || 'updated_desc').trim();
  const explicitStatus = _normalizeVerificationStatus_(statusVerifikasiNeedle);
  let allowedVerificationStatuses = null;

  if (!isLooseSearchWorkspace) {
    if (explicitStatus && explicitStatus !== 'PENDING') {
      allowedVerificationStatuses = [explicitStatus];
    } else if (statusVerifikasiNeedle) {
      allowedVerificationStatuses = [explicitStatus];
    } else if (workflowIntent === 'section-verifikasi' || workspace === 'verifikasi') {
      allowedVerificationStatuses = ['PENDING'];
    } else if (workspace === 'edit' || workflowIntent === 'section-pelapor') {
      allowedVerificationStatuses = ['PERLU REVISI', 'DITOLAK'];
    } else if (workflowIntent === 'section-sampel' || workspace === 'sampel' || workflowIntent === 'section-status' || workspace === 'status') {
      allowedVerificationStatuses = ['TERVERIFIKASI'];
    }
  }
  const page = Math.max(1, parseInt(filters.page, 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(filters.pageSize, 10) || 50));
  const results = [];

  dxList.forEach(function(dxItem) {
    var headers = [];
    var rows = [];

    if (typeof _readSheetWithCache_ === 'function') {
      var sheetData = _readSheetWithCache_(dxItem + '_Raw');
      if (!sheetData || !sheetData.headers || !sheetData.rows || !sheetData.rows.length) return;
      headers = sheetData.headers;
      rows = sheetData.rows;
    } else {
      var sheet = getSheetOrNull_(dxItem + '_Raw');
      if (!sheet) return;
      var values = sheet.getDataRange().getValues();
      if (!values || values.length < 2) return;
      headers = values[0].map(function(h) { return String(h || '').trim(); });
      rows = values.slice(1);
    }

    rows.forEach(function(row, rowIdx) {
      const record = _buildSearchProjectionRecord_(headers, row);
      record.RAW_ROW_NUMBER = rowIdx + 2;

      if (!_canSessionReadRecordByScope_(sess, dxItem, record)) return;

      const item = _mapSearchResultItem_(dxItem, record);
      if (String(item.deletedAt || '').trim()) return;
      if (diagnosisNeedle && diagnosisNeedle !== 'ALL' && String(item.dx || '').toUpperCase() !== diagnosisNeedle) return;
      if (!item.recordKey) {
        item.recordKey = 'ROW:' + String(record.RAW_ROW_NUMBER || '');
      }
      if (!item.recordKey) return;
      if (!_searchItemMatchesKeyword_(item, keywordNeedle)) return;
      if (!_searchIncludes_(item.epid + ' ' + item.recordId, epidNeedle)) return;
      if (!_searchIncludes_(item.namaSearch || item.nama, namaNeedle)) return;
      if (tanggalNeedle && _searchNormalizeDate_(item.tanggalLahir) !== tanggalNeedle) return;
      if (!_searchIncludes_(item.orangTua, orangTuaNeedle)) return;
      if (!_searchIncludes_(item.alamat, alamatNeedle)) return;
      if (!_searchIncludes_(item.kecamatan, kecamatanNeedle)) return;
      if (!_searchIncludes_(item.kelurahan, kelurahanNeedle)) return;
      if (!_searchIncludes_(item.statusKasus, statusKasusNeedle)) return;

      const normalizedVerificationStatus = _normalizeVerificationStatus_(item.statusVerifikasi || 'Pending');
      if (allowedVerificationStatuses && allowedVerificationStatuses.indexOf(normalizedVerificationStatus) === -1) return;
      if (!allowedVerificationStatuses && !_searchIncludes_(item.statusVerifikasi, statusVerifikasiNeedle)) return;

      results.push(item);
    });
  });

  const compareText = function(a, b) {
    return String(a || '').localeCompare(String(b || ''), 'id', { sensitivity: 'base' });
  };

  results.sort(function(a, b) {
    if (sortBy === 'name_asc') return compareText(a.nama, b.nama);
    if (sortBy === 'name_desc') return compareText(b.nama, a.nama);
    if (sortBy === 'birth_asc') return compareText(a.tanggalLahir, b.tanggalLahir);
    if (sortBy === 'birth_desc') return compareText(b.tanggalLahir, a.tanggalLahir);
    if (sortBy === 'epid_asc') return compareText(a.epid || a.recordId, b.epid || b.recordId);
    if (sortBy === 'epid_desc') return compareText(b.epid || b.recordId, a.epid || a.recordId);
    return compareText(b.updatedAt || b.inputAt, a.updatedAt || a.inputAt);
  });

  const total = results.length;
  const start = (page - 1) * pageSize;
  const pagedResults = results.slice(start, start + pageSize);
  return {
    results: pagedResults,
    total: total,
    page: page,
    pageSize: pageSize,
    totalPages: Math.ceil(total / pageSize)
  };
}

function _searchRecordsDirectFromSheet_(dx, filters, token) {
  const sess = _getSessionFromToken_(token);
  if (!sess.ok) throw new Error(sess.message || 'Sesi tidak valid.');

  dx = String(dx || '').trim().toUpperCase();
  filters = filters || {};
  const workspace = String(filters.workspace || '').trim().toLowerCase();
  const workflowIntent = String(filters.workflowIntent || '').trim().toLowerCase();
  const isLooseSearchWorkspace = workspace === 'search';
  const dxList = isLooseSearchWorkspace ? ALL_DX.slice() : (ALL_DX.indexOf(dx) !== -1 ? [dx] : ALL_DX.slice());
  const keywordNeedle = String(filters.keyword || filters.q || '').trim();
  const epidNeedle = String(filters.epid || '').trim();
  const namaNeedle = String(filters.nama || '').trim();
  const tanggalNeedle = _searchNormalizeDate_(filters.tanggalLahir || '');
  const orangTuaNeedle = String(filters.orangTua || '').trim();
  const alamatNeedle = String(filters.alamat || '').trim();
  const diagnosisNeedle = String(filters.diagnosis || filters.dxFilter || '').trim().toUpperCase();
  const kecamatanNeedle = String(filters.kecamatan || '').trim();
  const kelurahanNeedle = String(filters.kelurahan || '').trim();
  const statusKasusNeedle = String(filters.statusKasus || '').trim();
  const statusVerifikasiNeedle = String(filters.statusVerifikasi || '').trim();
  const sortBy = String(filters.sortBy || 'updated_desc').trim();
  const explicitStatus = _normalizeVerificationStatus_(statusVerifikasiNeedle);
  let allowedVerificationStatuses = null;

  if (!isLooseSearchWorkspace) {
    if (explicitStatus && explicitStatus !== 'PENDING') {
      allowedVerificationStatuses = [explicitStatus];
    } else if (statusVerifikasiNeedle) {
      allowedVerificationStatuses = [explicitStatus];
    } else if (workflowIntent === 'section-verifikasi' || workspace === 'verifikasi') {
      allowedVerificationStatuses = ['PENDING'];
    } else if (workspace === 'edit' || workflowIntent === 'section-pelapor') {
      allowedVerificationStatuses = ['PERLU REVISI', 'DITOLAK'];
    } else if (workflowIntent === 'section-sampel' || workspace === 'sampel' || workflowIntent === 'section-status' || workspace === 'status') {
      allowedVerificationStatuses = ['TERVERIFIKASI'];
    }
  }

  const page = Math.max(1, parseInt(filters.page, 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(filters.pageSize, 10) || 50));
  const results = [];

  dxList.forEach(function(dxItem) {
    var sheet = getSheetOrThrow_(dxItem + '_Raw');
    var values = sheet.getDataRange().getValues();
    if (!values || values.length < 2) return;
    var headers = values[0].map(function(h) { return String(h || '').trim(); });
    var rows = values.slice(1);

    rows.forEach(function(row, rowIdx) {
      const record = _buildSearchProjectionRecord_(headers, row);
      record.RAW_ROW_NUMBER = rowIdx + 2;

      if (!_canSessionReadRecordByScope_(sess, dxItem, record)) return;

      const item = _mapSearchResultItem_(dxItem, record);
      if (String(item.deletedAt || '').trim()) return;
      if (diagnosisNeedle && diagnosisNeedle !== 'ALL' && String(item.dx || '').toUpperCase() !== diagnosisNeedle) return;
      if (!item.recordKey) item.recordKey = 'ROW:' + String(record.RAW_ROW_NUMBER || '');
      if (!item.recordKey) return;
      if (!_searchItemMatchesKeyword_(item, keywordNeedle)) return;
      if (!_searchIncludes_(item.epid + ' ' + item.recordId, epidNeedle)) return;
      if (!_searchIncludes_(item.namaSearch || item.nama, namaNeedle)) return;
      if (tanggalNeedle && _searchNormalizeDate_(item.tanggalLahir) !== tanggalNeedle) return;
      if (!_searchIncludes_(item.orangTua, orangTuaNeedle)) return;
      if (!_searchIncludes_(item.alamat, alamatNeedle)) return;
      if (!_searchIncludes_(item.kecamatan, kecamatanNeedle)) return;
      if (!_searchIncludes_(item.kelurahan, kelurahanNeedle)) return;
      if (!_searchIncludes_(item.statusKasus, statusKasusNeedle)) return;

      const normalizedVerificationStatus = _normalizeVerificationStatus_(item.statusVerifikasi || 'Pending');
      if (allowedVerificationStatuses && allowedVerificationStatuses.indexOf(normalizedVerificationStatus) === -1) return;
      if (!allowedVerificationStatuses && !_searchIncludes_(item.statusVerifikasi, statusVerifikasiNeedle)) return;

      results.push(item);
    });
  });

  const compareText = function(a, b) {
    return String(a || '').localeCompare(String(b || ''), 'id', { sensitivity: 'base' });
  };
  results.sort(function(a, b) {
    if (sortBy === 'name_asc') return compareText(a.nama, b.nama);
    if (sortBy === 'name_desc') return compareText(b.nama, a.nama);
    if (sortBy === 'birth_asc') return compareText(a.tanggalLahir, b.tanggalLahir);
    if (sortBy === 'birth_desc') return compareText(b.tanggalLahir, a.tanggalLahir);
    if (sortBy === 'epid_asc') return compareText(a.epid || a.recordId, b.epid || b.recordId);
    if (sortBy === 'epid_desc') return compareText(b.epid || b.recordId, a.epid || a.recordId);
    return compareText(b.updatedAt || b.inputAt, a.updatedAt || a.inputAt);
  });

  const total = results.length;
  const start = (page - 1) * pageSize;
  return {
    results: results.slice(start, start + pageSize),
    total: total,
    page: page,
    pageSize: pageSize,
    totalPages: Math.ceil(total / pageSize),
    source: 'spreadsheet-direct'
  };
}

// ─── Pipeline policy per DX (Phase-1: config-driven orchestration) ───────────
const DX_PIPELINE_POLICY = {
  MR:   { notifyEmail: true, syncPengampu: true, notifyTelegram: true },
  DIF:  { notifyEmail: true, syncPengampu: true, notifyTelegram: true },
  PERT: { notifyEmail: true, syncPengampu: true, notifyTelegram: true },
  TN:   { notifyEmail: true, syncPengampu: true, notifyTelegram: true },
  AFP:  { notifyEmail: true, syncPengampu: true, notifyTelegram: true }
};

function _getDxPipelinePolicy_(dx) {
  dx = String(dx || "").trim().toUpperCase();
  const fallback = { notifyEmail: true, syncPengampu: true, notifyTelegram: true };
  return DX_PIPELINE_POLICY[dx] || fallback;
}

// ─── Batch_Processor ─────────────────────────────────────────────────────────
/**
 * Batch_Processor — mengelola eksekusi retry notifikasi dan sinkronisasi secara batch.
 *
 * Desain:
 *   - Satu lock tunggal untuk seluruh batch (bukan per item)
 *   - Baca sheet sekali per DX di awal (bukan per-iterasi)
 *   - Cek elapsed > 25 detik → kembalikan status "PARTIAL"
 *   - Kembalikan ringkasan { status, byDx, durationMs }
 *
 * Req 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7
 */
const Batch_Processor = (function () {

  /**
   * Kolom status dan nilai "sudah selesai" per batchType.
   */
  const BATCH_CONFIG = {
    sync:              { statusCol: "Status Sinkronisasi Pengampu",        doneValue: "SYNCED", keyCols: ["Nomor EPID"] },
    telegram:          { statusCol: "Status Notifikasi Telegram",          doneValue: "SENT",   keyCols: ["Nomor EPID"] },
    notify:            { statusCol: "Status Notifikasi Pengampu",          doneValue: "SENT",   keyCols: ["Nomor EPID"] },
    revision_notify:   { statusCol: "Status Notifikasi Revisi Pengampu",   doneValue: "SENT",   keyCols: ["ID Registrasi Kasus", "Nomor EPID"] },
    revision_telegram: { statusCol: "Status Notifikasi Revisi Telegram",   doneValue: "SENT",   keyCols: ["ID Registrasi Kasus", "Nomor EPID"] }
  };

  function _buildRecordPatchIdentity_(record, recordKey) {
    const patch = {};
    const recordId = String((record && record["ID Registrasi Kasus"]) || '').trim();
    const epid = String((record && record["Nomor EPID"]) || '').trim();
    if (recordId) patch["ID Registrasi Kasus"] = recordId;
    if (epid) patch["Nomor EPID"] = epid;
    if (!recordId && !epid && recordKey) {
      patch["ID Registrasi Kasus"] = String(recordKey || '').trim();
    }
    return patch;
  }

  /**
   * Proses satu item sesuai batchType (tanpa acquire lock sendiri).
   * @param {string} batchType - "sync" | "telegram" | "notify"
   * @param {string} dx
   * @param {string} epid
   * @param {Object} record - baris data sebagai objek header→nilai
   * @returns {{ ok: boolean }}
   */
  function _processItem_(batchType, dx, recordKey, record) {
    try {
      const identityPatch = _buildRecordPatchIdentity_(record, recordKey);
      const epid = String((record && record["Nomor EPID"]) || '').trim();
      const recordId = String((record && record["ID Registrasi Kasus"]) || '').trim();
      const printUrl = String(record["Link PDF"] || "").trim();
      if (batchType === "sync") {
        const res = _syncPengampuSpreadsheet_(dx, record, { epid: epid, recordId: recordId }, printUrl);
        const patch = Object.assign({}, identityPatch, {
          "Status Sinkronisasi Pengampu": res.synced ? "SYNCED" : (res.reason || "FAILED"),
          "Reason Sinkronisasi Pengampu": res.synced ? "" : (res.reason || ""),
          "Synced At Pengampu": new Date(),
          "Sync Target Pengampu": res.target || ""
        });
        saveDxRecord_(dx, patch);
        return { ok: !!res.synced };
      }
      if (batchType === "telegram") {
        const pUrl = printUrl || (epid ? safeGetPdfPrintUrl_(dx, epid, "") : '');
        const res = _sendTelegramPd3iNotification_(dx, record, { epid: epid, recordId: recordId }, pUrl);
        const currentRetry = Number(record["Telegram Retry Count"] || 0) || 0;
        const patch = Object.assign({}, identityPatch, {
          "Status Notifikasi Telegram": res.sent ? "SENT" : (res.reason || "FAILED"),
          "Reason Notifikasi Telegram": res.sent ? "" : (res.reason || ""),
          "Telegram Notified At": new Date(),
          "Telegram Target": res.target || "",
          "Telegram Retry Count": currentRetry + 1
        });
        saveDxRecord_(dx, patch);
        return { ok: !!res.sent };
      }
      if (batchType === "notify") {
        const res = _sendPengampuNotification_(dx, record, { epid: epid, recordId: recordId }, printUrl);
        const patch = Object.assign({}, identityPatch, {
          "Status Notifikasi Pengampu": res.sent ? "SENT" : (res.reason || "FAILED"),
          "Reason Notifikasi Pengampu": res.sent ? "" : (res.reason || ""),
          "Notified At Pengampu": new Date(),
          "Notified To Pengampu": res.to || ""
        });
        saveDxRecord_(dx, patch);
        return { ok: !!res.sent };
      }
      if (batchType === "revision_notify") {
        const res = _sendRevisionPengampuNotification_(dx, record, { epid: epid, recordId: recordId || recordKey });
        const patch = Object.assign({}, identityPatch, {
          "Status Notifikasi Revisi Pengampu": res.sent ? "SENT" : (res.reason || "FAILED"),
          "Reason Notifikasi Revisi Pengampu": res.sent ? "" : (res.reason || ""),
          "Revision Notified At Pengampu": new Date(),
          "Revision Notified To Pengampu": res.to || ""
        });
        saveDxRecord_(dx, patch);
        return { ok: !!res.sent };
      }
      if (batchType === "revision_telegram") {
        const res = _sendRevisionTelegramNotification_(dx, record, { epid: epid, recordId: recordId || recordKey });
        const patch = Object.assign({}, identityPatch, {
          "Status Notifikasi Revisi Telegram": res.sent ? "SENT" : (res.reason || "FAILED"),
          "Reason Notifikasi Revisi Telegram": res.sent ? "" : (res.reason || ""),
          "Revision Telegram Notified At": new Date(),
          "Revision Telegram Target": res.target || ""
        });
        saveDxRecord_(dx, patch);
        return { ok: !!res.sent };
      }
      return { ok: false };
    } catch (e) {
      console.error("Batch_Processor._processItem_ error [" + batchType + "/" + dx + "/" + recordKey + "]:", e);
      return { ok: false };
    }
  }

  /**
   * Jalankan batch retry untuk daftar DX dan batchType tertentu.
   * Mengakuisisi SATU lock untuk seluruh batch.
   *
   * @param {string[]} dxList - daftar DX yang akan diproses
   * @param {string} batchType - "sync" | "telegram" | "notify"
   * @param {string} token - token sesi admin
   * @returns {{ status: string, byDx: Object, durationMs: number }}
   */
  function runBatch(dxList, batchType, token) {
    const startMs = Date.now();
    const cfg = BATCH_CONFIG[batchType];
    if (!cfg) return { status: "error", message: "batchType tidak dikenal: " + batchType, byDx: {}, durationMs: 0 };

    const lock = LockService.getScriptLock();
    try {
      lock.waitLock(30000);
    } catch (lockErr) {
      return { status: "error", message: "Gagal mendapatkan lock: " + String(lockErr), byDx: {}, durationMs: Date.now() - startMs };
    }

    const byDx = {};
    let overallStatus = "success";

    try {
      _requireAdminFromToken_(token);

      for (let di = 0; di < dxList.length; di++) {
        const dx = String(dxList[di] || "").trim().toUpperCase();
        if (!dx) continue;

        // Cek elapsed sebelum mulai DX baru
        if (Date.now() - startMs > 25000) {
          overallStatus = "PARTIAL";
          break;
        }

        // Baca sheet sekali di awal per DX (Req 3.1)
        let values;
        try {
          const sheet = getSheetOrNull_(dx + "_Raw");
          if (!sheet) continue;
          values = sheet.getDataRange().getValues();
        } catch (sheetErr) {
          byDx[dx] = { total: 0, retried: 0, success: 0, failed: 0, error: String(sheetErr) };
          continue;
        }

        if (!values || values.length < 2) {
          byDx[dx] = { total: 0, retried: 0, success: 0, failed: 0 };
          continue;
        }

        const headers = values[0].map(function (h) { return String(h || "").trim(); });
        const idxStatus = headers.indexOf(cfg.statusCol);
        const keyIndexes = (cfg.keyCols || ["Nomor EPID"]).map(function(col) { return headers.indexOf(col); });

        // Kolom status / key tidak ada → skip DX ini
        if (idxStatus === -1 || keyIndexes.every(function(idx) { return idx === -1; })) continue;

        const total   = values.length - 1;
        let retried   = 0;
        let success   = 0;
        let failed    = 0;
        let partial   = false;

        for (let i = 1; i < values.length; i++) {
          // Cek elapsed setiap iterasi (Req 3.7)
          if (Date.now() - startMs > 25000) {
            overallStatus = "PARTIAL";
            partial = true;
            break;
          }

          const statusVal = String(values[i][idxStatus] || "").trim().toUpperCase();
          const recordKey = keyIndexes.reduce(function(found, idx) {
            if (found) return found;
            if (idx === -1) return found;
            return String(values[i][idx] || "").trim();
          }, "");
          if (!recordKey || statusVal === cfg.doneValue) continue;

          // Bangun objek record dari baris
          const record = {};
          headers.forEach(function (h, j) { record[h] = values[i][j]; });

          retried += 1;
          const res = _processItem_(batchType, dx, recordKey, record);
          if (res.ok) success += 1; else failed += 1;
        }

        byDx[dx] = { total: total, retried: retried, success: success, failed: failed };
        if (partial) break;
      }
    } catch (err) {
      return {
        status: "error",
        message: String(err),
        byDx: byDx,
        durationMs: Date.now() - startMs
      };
    } finally {
      try { lock.releaseLock(); } catch (e2) {}
    }

    return {
      status: overallStatus,
      byDx: byDx,
      durationMs: Date.now() - startMs
    };
  }

  return { runBatch: runBatch };
})();

// ─── Fungsi resolveLatestSavedMeta ───────────────────────────────────────────
function resolveLatestSavedMeta(payload) {
  const token = String((payload && payload.__token) || "").trim();
  const sess = _getSessionFromToken_(token);
  if (!sess.ok) return { status: "error", message: sess.message || "Sesi habis." };

  const dx = String((payload && payload.dx) || "").trim().toUpperCase();
  if (!dx) return { status: "error", message: "dx wajib diisi." };

  const sheet = getSheetOrThrow_(dx + "_Raw");
  const values = sheet.getDataRange().getValues();
  if (!values || values.length < 2) return { status: "error", message: "Data belum ada." };

  const headers = values[0].map(h => String(h || "").trim());
  const idxRecordId = headers.indexOf("ID Registrasi Kasus");
  const idxEpid = headers.indexOf("Nomor EPID");
  const idxNama = headers.indexOf("Nama");
  const idxPelacakan = headers.indexOf("Tanggal Pelacakan");
  const idxStatusVerif = headers.indexOf("Status Verifikasi EPID");
  const idxPdf = headers.indexOf("Link PDF");
  if (idxNama === -1) return { status: "error", message: "Kolom meta belum lengkap." };

  const targetRecordId = String((payload && payload["ID Registrasi Kasus"]) || "").trim();
  const targetNama = String((payload && payload["Nama"]) || "").trim();
  const targetPelacakan = String((payload && payload["Tanggal Pelacakan"]) || "").trim();
  const norm = (v) => String(v || "").trim().slice(0, 10);

  for (let i = values.length - 1; i >= 1; i--) {
    const rowRecordId = idxRecordId !== -1 ? String(values[i][idxRecordId] || "").trim() : "";
    const rowNama = String(values[i][idxNama] || "").trim();
    const rowPelacakan = idxPelacakan !== -1 ? String(values[i][idxPelacakan] || "").trim() : "";
    if (targetRecordId && rowRecordId && rowRecordId !== targetRecordId) continue;
    if (targetNama && rowNama !== targetNama) continue;
    if (targetPelacakan && rowPelacakan && norm(rowPelacakan) && norm(targetPelacakan) && norm(rowPelacakan) !== norm(targetPelacakan)) {
      continue;
    }
    const statusVerif = idxStatusVerif !== -1 ? String(values[i][idxStatusVerif] || '').trim() : '';
    let epid = idxEpid !== -1 ? String(values[i][idxEpid] || "").trim() : '';
    let printUrl = idxPdf !== -1 ? String(values[i][idxPdf] || "").trim() : "";
    if (!printUrl && epid) {
      printUrl = safeGetPdfPrintUrl_(dx, epid, token);
      if (idxPdf !== -1) sheet.getRange(i + 1, idxPdf + 1).setValue(printUrl || "");
    }
    return { status: "success", epid: epid, dx: dx, printUrl: printUrl, verificationStatus: statusVerif, recordId: rowRecordId };
  }

  return { status: "error", message: "Meta simpan terakhir tidak ditemukan." };
}

// ─── Single-item retry (tidak acquire lock sendiri; lock dikelola Batch_Processor) ──
/**
 * Retry sinkronisasi pengampu untuk satu EPID.
 * Lock dikelola oleh pemanggil (Batch_Processor atau langsung dari admin).
 * Req 15.4
 */
function retryPengampuSync(epid, dx, token) {
  try {
    _requireAdminFromToken_(token);
    dx = String(dx || "MR").trim().toUpperCase();
    const record = _getRowObjectByEpid_(dx, epid);
    const printUrl = String(record["Link PDF"] || "").trim();
    const syncPengampu = _syncPengampuSpreadsheet_(dx, record, { epid: epid }, printUrl);
    const patch = {
      "Nomor EPID": epid,
      "Status Sinkronisasi Pengampu": syncPengampu.synced ? "SYNCED" : (syncPengampu.reason || "FAILED"),
      "Reason Sinkronisasi Pengampu": syncPengampu.synced ? "" : (syncPengampu.reason || ""),
      "Synced At Pengampu": new Date(),
      "Sync Target Pengampu": syncPengampu.target || ""
    };
    saveDxRecord_(dx, patch);
    return { status: syncPengampu.synced ? "success" : "error", epid: epid, pengampuSync: syncPengampu };
  } catch (err) {
    return { status: "error", message: String(err), epid: epid };
  }
}

/**
 * Retry notifikasi Telegram untuk satu EPID.
 * Lock dikelola oleh pemanggil.
 * Req 15.3
 */
function retryTelegramPd3iNotification(epid, dx, token) {
  try {
    _requireAdminFromToken_(token);
    dx = String(dx || "MR").trim().toUpperCase();
    const record = _getRowObjectByEpid_(dx, epid);
    const printUrl = String(record["Link PDF"] || "").trim() || safeGetPdfPrintUrl_(dx, epid, token);
    const telegramNotify = _sendTelegramPd3iNotification_(dx, record, { epid: epid }, printUrl);
    const currentRetry = Number(record["Telegram Retry Count"] || 0) || 0;
    const patch = {
      "Nomor EPID": epid,
      "Status Notifikasi Telegram": telegramNotify.sent ? "SENT" : (telegramNotify.reason || "FAILED"),
      "Reason Notifikasi Telegram": telegramNotify.sent ? "" : (telegramNotify.reason || ""),
      "Telegram Notified At": new Date(),
      "Telegram Target": telegramNotify.target || "",
      "Telegram Retry Count": currentRetry + 1
    };
    saveDxRecord_(dx, patch);
    return { status: telegramNotify.sent ? "success" : "error", epid: epid, telegramNotification: telegramNotify };
  } catch (err) {
    return { status: "error", message: String(err), epid: epid };
  }
}

/**
 * Retry notifikasi email pengampu untuk satu EPID.
 * Lock dikelola oleh pemanggil.
 * Req 15.1
 */
function retryPengampuNotification(epid, dx, token) {
  try {
    _requireAdminFromToken_(token);
    dx = String(dx || "MR").trim().toUpperCase();
    const record = _getRowObjectByEpid_(dx, epid);
    const printUrl = String(record["Link PDF"] || "").trim();
    const notify = _sendPengampuNotification_(dx, record, { epid: epid }, printUrl);
    const patch = {
      "Nomor EPID": epid,
      "Status Notifikasi Pengampu": notify.sent ? "SENT" : (notify.reason || "FAILED"),
      "Reason Notifikasi Pengampu": notify.sent ? "" : (notify.reason || ""),
      "Notified At Pengampu": new Date(),
      "Notified To Pengampu": notify.to || ""
    };
    saveDxRecord_(dx, patch);
    return { status: notify.sent ? "success" : "error", epid: epid, pengampuNotification: notify };
  } catch (err) {
    return { status: "error", message: String(err), epid: epid };
  }
}

function retryRevisionPengampuNotification(recordKey, dx, token) {
  try {
    _requireAdminFromToken_(token);
    dx = String(dx || "MR").trim().toUpperCase();
    recordKey = String(recordKey || '').trim();
    const record = getRecordByKey(dx, recordKey, token);
    if (!record) return { status: 'error', message: 'Record tidak ditemukan.', recordKey: recordKey };
    const saved = {
      recordId: String(record["ID Registrasi Kasus"] || recordKey || '').trim(),
      epid: String(record["Nomor EPID"] || '').trim()
    };
    const notify = _sendRevisionPengampuNotification_(dx, record, saved);
    const patch = {
      "ID Registrasi Kasus": saved.recordId,
      "Nomor EPID": saved.epid,
      "Status Notifikasi Revisi Pengampu": notify.sent ? "SENT" : (notify.reason || "FAILED"),
      "Reason Notifikasi Revisi Pengampu": notify.sent ? "" : (notify.reason || ""),
      "Revision Notified At Pengampu": new Date(),
      "Revision Notified To Pengampu": notify.to || ""
    };
    saveDxRecord_(dx, patch);
    return { status: notify.sent ? 'success' : 'error', recordKey: recordKey, revisionNotification: notify };
  } catch (err) {
    return { status: 'error', message: String(err), recordKey: recordKey };
  }
}

function retryRevisionTelegramNotification(recordKey, dx, token) {
  try {
    _requireAdminFromToken_(token);
    dx = String(dx || "MR").trim().toUpperCase();
    recordKey = String(recordKey || '').trim();
    const record = getRecordByKey(dx, recordKey, token);
    if (!record) return { status: 'error', message: 'Record tidak ditemukan.', recordKey: recordKey };
    const saved = {
      recordId: String(record["ID Registrasi Kasus"] || recordKey || '').trim(),
      epid: String(record["Nomor EPID"] || '').trim()
    };
    const notify = _sendRevisionTelegramNotification_(dx, record, saved);
    const patch = {
      "ID Registrasi Kasus": saved.recordId,
      "Nomor EPID": saved.epid,
      "Status Notifikasi Revisi Telegram": notify.sent ? "SENT" : (notify.reason || "FAILED"),
      "Reason Notifikasi Revisi Telegram": notify.sent ? "" : (notify.reason || ""),
      "Revision Telegram Notified At": new Date(),
      "Revision Telegram Target": notify.target || ""
    };
    saveDxRecord_(dx, patch);
    return { status: notify.sent ? 'success' : 'error', recordKey: recordKey, revisionTelegramNotification: notify };
  } catch (err) {
    return { status: 'error', message: String(err), recordKey: recordKey };
  }
}

// ─── Batch retry (menggunakan Batch_Processor) ───────────────────────────────
/**
 * Retry semua pending sinkronisasi pengampu untuk semua DX (atau dxList tertentu).
 * Req 3.1–3.7, 15.4, 15.6
 *
 * @param {string} token
 * @param {string[]} [dxList] - opsional; default semua DX
 * @returns {{ status, byDx, durationMs }}
 */
function retryAllPendingPengampuSync(token, dxList) {
  return Batch_Processor.runBatch(dxList || ALL_DX, "sync", token);
}

/**
 * Retry semua notifikasi Telegram yang gagal untuk semua DX (atau dxList tertentu).
 * Req 3.1–3.7, 15.3, 15.6
 *
 * @param {string} token
 * @param {string[]} [dxList] - opsional; default semua DX
 * @returns {{ status, byDx, durationMs }}
 */
function retryAllFailedTelegramPd3iNotification(token, dxList) {
  return Batch_Processor.runBatch(dxList || ALL_DX, "telegram", token);
}

/**
 * Retry semua notifikasi email pengampu yang pending untuk semua DX (atau dxList tertentu).
 * Req 3.1–3.7, 15.5, 15.6
 *
 * @param {string} token
 * @param {string[]} [dxList] - opsional; default semua DX
 * @returns {{ status, byDx, durationMs }}
 */
function retryAllPendingPengampuNotification(token, dxList) {
  return Batch_Processor.runBatch(dxList || ALL_DX, "notify", token);
}

function retryAllPendingRevisionPengampuNotification(token, dxList) {
  return Batch_Processor.runBatch(dxList || ALL_DX, "revision_notify", token);
}

function retryAllFailedRevisionTelegramNotification(token, dxList) {
  return Batch_Processor.runBatch(dxList || ALL_DX, "revision_telegram", token);
}

// ─── setupConfig ─────────────────────────────────────────────────────────────
// Fungsi setupConfig(token, configMap) sudah tersedia via config.js.
// Dapat dipanggil langsung dari frontend admin via google.script.run.setupConfig(...)
// Req 5.6, 5.7 — tidak perlu didefinisikan ulang di sini.

// ─── Helper upsert ke sheet pengampu ─────────────────────────────────────────
function _upsertByEpidToSheet_(sheet, record) {
  const headers = getTrimmedHeaders_(sheet);
  const idxEpid = headers.indexOf("Nomor EPID");
  if (idxEpid === -1) throw new Error("Sheet tujuan tidak punya kolom 'Nomor EPID'");

  const targetEpid = String(record["Nomor EPID"] || "").trim();
  if (!targetEpid) throw new Error("Nomor EPID kosong");

  const rowData = headers.map(h => record[h] !== undefined ? record[h] : "");
  const rowIndex = findRowByColumnValue_(sheet, idxEpid + 1, targetEpid);

  if (rowIndex !== -1) {
    sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
    return { updated: true, rowIndex, headersCount: headers.length };
  }

  sheet.appendRow(rowData);
  return { updated: false, rowIndex: sheet.getLastRow(), headersCount: headers.length };
}

function _collectNotificationRecipients_(values) {
  const recipients = [];
  (values || []).forEach(function(v) {
    String(v || '').split(/[;,]/).map(function(x) { return String(x || '').trim(); }).filter(Boolean).forEach(function(item) {
      recipients.push(item);
    });
  });
  return Array.from(new Set(recipients));
}

function _resolvePengampuNotificationContext_(dx, data) {
  dx = String(dx || '').trim().toUpperCase();
  data = data || {};

  const domisili = _getRecordDomisiliForAccess_(dx, data);
  const pengampu = (domisili.kecamatan && domisili.kelurahan)
    ? getPengampuByWilayah_(domisili.kecamatan, domisili.kelurahan, domisili.kabKota)
    : { found: false, status: 'UNMAPPED' };

  const statusRoutingRaw = String(data["Status Routing Pengampu"] || (pengampu && pengampu.status) || '').trim().toUpperCase();
  const statusRouting = statusRoutingRaw || ((pengampu && pengampu.found) ? 'MATCHED' : 'UNMAPPED');
  const emailRecipients = _collectNotificationRecipients_([
    data["Email Petugas Pengampu"],
    data["Email Kapus Pengampu"],
    pengampu && pengampu.emailPetugas,
    pengampu && pengampu.emailKapus
  ]);
  const recordChatId = String(data["Telegram Chat Id Pengampu"] || data["TelegramChatId Pengampu"] || data["TelegramChatId"] || '').trim();
  const mappedChatId = String((pengampu && pengampu.telegramChatId) || '').trim();
  const globalChatId = String(Config_Manager.getConfig("TELEGRAM_CHAT_ID") || '').trim();
  const telegramChatId = recordChatId || mappedChatId || globalChatId;
  const telegramTargetSource = recordChatId ? 'record' : (mappedChatId ? 'pengampu' : (globalChatId ? 'global' : ''));
  const spreadsheetId = String(data["SpreadsheetId Pengampu"] || (pengampu && pengampu.spreadsheetId) || '').trim();
  const spreadsheetUrl = String(data["SpreadsheetUrl Pengampu"] || (pengampu && pengampu.spreadsheetUrl) || '').trim();
  const puskesmasPengampu = String(data["Puskesmas Pengampu"] || (pengampu && pengampu.namaPuskesmas) || '').trim();
  const kodePuskesmasPengampu = String(data["KodePuskesmas Pengampu"] || (pengampu && pengampu.kodePuskesmas) || '').trim();

  return {
    domisili: domisili,
    pengampu: pengampu,
    statusRouting: statusRouting,
    emailRecipients: emailRecipients,
    telegramChatId: telegramChatId,
    telegramTargetSource: telegramTargetSource,
    spreadsheetId: spreadsheetId,
    spreadsheetUrl: spreadsheetUrl,
    puskesmasPengampu: puskesmasPengampu,
    kodePuskesmasPengampu: kodePuskesmasPengampu
  };
}

function _sendTelegramText_(chatId, lines) {
  const botToken = Config_Manager.getConfig("TELEGRAM_BOT_TOKEN");
  const targetChatId = String(chatId || '').trim();
  if (!botToken || !targetChatId) return { sent: false, reason: "NOT_CONFIGURED", target: targetChatId };

  const resp = UrlFetchApp.fetch("https://api.telegram.org/bot" + botToken + "/sendMessage", {
    method: "post",
    muteHttpExceptions: true,
    payload: {
      chat_id: targetChatId,
      text: (lines || []).join("\n"),
      parse_mode: "Markdown"
    }
  });
  const code = resp.getResponseCode();
  const body = String(resp.getContentText() || "");
  if (code >= 200 && code < 300) return { sent: true, target: targetChatId, responseCode: code };
  return { sent: false, reason: "HTTP_" + code + ": " + body, target: targetChatId };
}

const DX_NOTIFICATION_LABELS_ = {
  MR: 'Campak / Rubella',
  DIF: 'Difteri',
  PERT: 'Pertusis',
  TN: 'Tetanus Neonatorum',
  AFP: 'AFP'
};

function _getDxNotificationLabel_(dx) {
  const code = String(dx || '').trim().toUpperCase();
  return DX_NOTIFICATION_LABELS_[code] || code || '-';
}

function _getNotificationRecordLabel_(data, saved) {
  return String((saved && saved.recordId) || (data && (data["ID Registrasi Kasus"] || data["Nomor EPID"])) || '-').trim() || '-';
}

function _getNotificationLocationLabel_(data) {
  const kel = String((data && data["Kelurahan"]) || '-').trim() || '-';
  const kec = String((data && data["Kecamatan"]) || '-').trim() || '-';
  return kel + ' / ' + kec;
}

function _buildNotificationSubject_(type, dx, data, saved, notifyCtx) {
  const dxLabel = _getDxNotificationLabel_(dx);
  const shortDx = String(dx || '').trim().toUpperCase() || '-';
  const epidLabel = String((saved && saved.epid) || (data && data["Nomor EPID"]) || '-').trim() || '-';
  const recordLabel = _getNotificationRecordLabel_(data, saved);
  const kelurahanLabel = String((data && data["Kelurahan"]) || '-').trim() || '-';
  const puskesmasLabel = String((notifyCtx && notifyCtx.puskesmasPengampu) || (data && data["Puskesmas Pengampu"]) || '-').trim() || '-';
  if (type === 'revision') {
    return `[${dxLabel}][${shortDx}][REVISI][${recordLabel}] ${kelurahanLabel} - ${puskesmasLabel}`;
  }
  return `[${dxLabel}][${shortDx}][${epidLabel}] Terverifikasi - ${kelurahanLabel} - ${puskesmasLabel}`;
}

function _buildCaseNotificationLines_(dx, data, saved, notifyCtx, options) {
  const opts = options || {};
  const lines = [];
  const dxLabel = _getDxNotificationLabel_(dx);
  const dxCode = String(dx || '').trim().toUpperCase() || '-';
  const recordLabel = _getNotificationRecordLabel_(data, saved);
  const epidLabel = String((saved && saved.epid) || (data && data["Nomor EPID"]) || '-').trim() || '-';
  const verificationLabel = String((data && data["Status Verifikasi EPID"]) || '-').trim() || '-';
  const pelaporLabel = String((data && data["Nama unit pelapor"]) || '-').trim() || '-';
  const pengampuLabel = String((notifyCtx && notifyCtx.puskesmasPengampu) || (data && data["Puskesmas Pengampu"]) || '-').trim() || '-';
  const tanggalLacak = String((data && data["Tanggal Pelacakan"]) || '-').trim() || '-';
  const alamat = String((data && data["Alamat"]) || '-').trim() || '-';
  const nama = String((data && data["Nama"]) || '-').trim() || '-';
  const jk = String((data && data["JK"]) || '-').trim() || '-';
  const tanggalLahir = String((data && data["Tanggal Lahir"]) || '-').trim() || '-';

  lines.push(`Diagnosis: ${dxLabel} (${dxCode})`);
  lines.push(`ID Registrasi: ${recordLabel}`);
  lines.push(`Nomor EPID: ${epidLabel}`);
  lines.push(`Nama Pasien: ${nama}`);
  lines.push(`Jenis Kelamin: ${jk}`);
  lines.push(`Tanggal Lahir: ${tanggalLahir}`);
  lines.push(`Domisili: ${_getNotificationLocationLabel_(data)}`);
  lines.push(`Alamat: ${alamat}`);
  lines.push(`Pelapor: ${pelaporLabel}`);
  lines.push(`Puskesmas Pengampu: ${pengampuLabel}`);
  lines.push(`Status Routing: ${String((notifyCtx && notifyCtx.statusRouting) || (data && data["Status Routing Pengampu"]) || '-').trim() || '-'}`);
  lines.push(`Status Verifikasi: ${verificationLabel}`);
  lines.push(`Tanggal Pelacakan: ${tanggalLacak}`);
  if (opts.includePrintUrl && opts.printUrl) lines.push(`Link PDF: ${opts.printUrl}`);
  return lines;
}

// ─── Sinkronisasi ke spreadsheet pengampu ────────────────────────────────────
function _syncPengampuSpreadsheet_(dx, data, saved, printUrl) {
  try {
    dx = String(dx || "").trim().toUpperCase();
    const notifyCtx = _resolvePengampuNotificationContext_(dx, data);

    if (notifyCtx.statusRouting !== "MATCHED") return { synced: false, reason: notifyCtx.statusRouting || "UNMAPPED" };
    if (!notifyCtx.spreadsheetId) return { synced: false, reason: "NO_SPREADSHEET_ID" };

    const targetSs = SpreadsheetApp.openById(notifyCtx.spreadsheetId);
    const targetSheetName = dx + "_Raw";
    let targetSheet = targetSs.getSheetByName(targetSheetName);
    if (!targetSheet) targetSheet = targetSs.insertSheet(targetSheetName);

    const sourceSheet = getSheetOrThrow_(dx + "_Raw");
    const sourceHeaders = getTrimmedHeaders_(sourceSheet);
    if (targetSheet.getLastRow() < 1 || targetSheet.getLastColumn() < 1) {
      targetSheet.getRange(1, 1, 1, sourceHeaders.length).setValues([sourceHeaders]);
    }

    const record = Object.assign({}, data, {
      "Nomor EPID": saved.epid,
      "dx": dx,
      "Link PDF": printUrl || data["Link PDF"] || "",
      "Puskesmas Pengampu": notifyCtx.puskesmasPengampu || data["Puskesmas Pengampu"] || "",
      "KodePuskesmas Pengampu": notifyCtx.kodePuskesmasPengampu || data["KodePuskesmas Pengampu"] || "",
      "SpreadsheetId Pengampu": notifyCtx.spreadsheetId || data["SpreadsheetId Pengampu"] || "",
      "SpreadsheetUrl Pengampu": notifyCtx.spreadsheetUrl || data["SpreadsheetUrl Pengampu"] || "",
      "Telegram Chat Id Pengampu": notifyCtx.telegramTargetSource === 'global' ? String(data["Telegram Chat Id Pengampu"] || '') : (notifyCtx.telegramChatId || String(data["Telegram Chat Id Pengampu"] || '')),
      "Status Routing Pengampu": notifyCtx.statusRouting || data["Status Routing Pengampu"] || ""
    });

    const currentTargetHeaders = getTrimmedHeaders_(targetSheet);
    const missingHeaders = sourceHeaders.filter(h => h && !currentTargetHeaders.includes(h));
    if (missingHeaders.length) {
      targetSheet.getRange(1, currentTargetHeaders.length + 1, 1, missingHeaders.length).setValues([missingHeaders]);
    }

    const res = _upsertByEpidToSheet_(targetSheet, record);
    return { synced: true, target: notifyCtx.spreadsheetId, rowIndex: res.rowIndex, updated: !!res.updated, headersCount: res.headersCount };
  } catch (err) {
    return { synced: false, reason: String(err) };
  }
}

// ─── Notifikasi Telegram per pengampu (fallback global bila perlu) ───────────
function _sendTelegramPd3iNotification_(dx, data, saved, printUrl) {
  try {
    dx = String(dx || "").trim().toUpperCase();
    const notifyCtx = _resolvePengampuNotificationContext_(dx, data);
    if (!notifyCtx.telegramChatId) return { sent: false, reason: "NOT_CONFIGURED" };

    const dxLabel = _getDxNotificationLabel_(dx);
    const dxCode = String(dx || '').trim().toUpperCase() || '-';
    const lines = [
      `📢 *Kasus ${dxLabel} (${dxCode}) terverifikasi*`,
      '',
      ..._buildCaseNotificationLines_(dx, data, saved, notifyCtx, { includePrintUrl: true, printUrl: printUrl }),
      '',
      `Status Email Pengampu: ${String(data["Status Notifikasi Pengampu"] || '-').trim() || '-'}`,
      `Status Sync Pengampu: ${String(data["Status Sinkronisasi Pengampu"] || '-').trim() || '-'}`,
      '',
      'Tindak lanjut: buka workspace verifikasi/sampel/status sesuai kebutuhan kasus, lalu lanjutkan update bila ada hasil baru.'
    ];

    const res = _sendTelegramText_(notifyCtx.telegramChatId, lines);
    if (res.sent) res.source = notifyCtx.telegramTargetSource || '';
    return res;
  } catch (err) {
    return { sent: false, reason: String(err) };
  }
}

// ─── Notifikasi email pengampu ────────────────────────────────────────────────
function _sendPengampuNotification_(dx, data, saved, printUrl) {
  try {
    dx = String(dx || "").trim().toUpperCase();
    const notifyCtx = _resolvePengampuNotificationContext_(dx, data);

    if (notifyCtx.statusRouting !== "MATCHED") return { sent: false, reason: notifyCtx.statusRouting || "UNMAPPED" };
    if (!notifyCtx.emailRecipients.length) return { sent: false, reason: "NO_RECIPIENT" };

    const subject = _buildNotificationSubject_('verified', dx, data, saved, notifyCtx);
    const body = [
      `Notifikasi kasus ${_getDxNotificationLabel_(dx)} (${String(dx || '').trim().toUpperCase()}) terverifikasi untuk wilayah ampuan`,
      '',
      ..._buildCaseNotificationLines_(dx, data, saved, notifyCtx, { includePrintUrl: true, printUrl: printUrl }),
      '',
      'Mohon tindak lanjuti sesuai alur kerja (verifikasi lanjutan, hasil sampel, atau update status kasus).'
    ].join('\n');

    MailApp.sendEmail({
      to: notifyCtx.emailRecipients.join(","),
      subject: subject,
      body: body,
      name: "Jarvis Surveilans PD3I"
    });

    return { sent: true, to: notifyCtx.emailRecipients.join(",") };
  } catch (err) {
    return { sent: false, reason: String(err) };
  }
}

function _sendRevisionPengampuNotification_(dx, data, saved) {
  try {
    dx = String(dx || '').trim().toUpperCase();
    const notifyCtx = _resolvePengampuNotificationContext_(dx, data);
    if (notifyCtx.statusRouting !== 'MATCHED') return { sent: false, reason: notifyCtx.statusRouting || 'UNMAPPED' };
    if (!notifyCtx.emailRecipients.length) return { sent: false, reason: 'NO_RECIPIENT' };

    const recordId = _getNotificationRecordLabel_(data, saved);
    const catatan = String(data["Catatan Verifikasi EPID"] || '').trim() || '-';
    const subject = _buildNotificationSubject_('revision', dx, data, saved, notifyCtx);
    const body = [
      `Permintaan revisi data kasus ${_getDxNotificationLabel_(dx)} (${String(dx || '').trim().toUpperCase()})`,
      '',
      ..._buildCaseNotificationLines_(dx, data, saved, notifyCtx, { includePrintUrl: false }),
      '',
      'Catatan verifikasi admin:',
      catatan,
      '',
      'Mohon buka record existing di workspace Cari/Edit atau Beranda, lakukan koreksi, lalu simpan ulang untuk direview kembali.'
    ].join('\n');

    MailApp.sendEmail({
      to: notifyCtx.emailRecipients.join(','),
      subject: subject,
      body: body,
      name: 'Jarvis Surveilans PD3I'
    });
    return { sent: true, to: notifyCtx.emailRecipients.join(',') };
  } catch (err) {
    return { sent: false, reason: String(err) };
  }
}

function _sendRevisionTelegramNotification_(dx, data, saved) {
  try {
    dx = String(dx || '').trim().toUpperCase();
    const notifyCtx = _resolvePengampuNotificationContext_(dx, data);
    if (notifyCtx.statusRouting !== 'MATCHED') return { sent: false, reason: notifyCtx.statusRouting || 'UNMAPPED' };
    if (!notifyCtx.telegramChatId) return { sent: false, reason: 'NOT_CONFIGURED' };

    const dxLabel = _getDxNotificationLabel_(dx);
    const dxCode = String(dx || '').trim().toUpperCase() || '-';
    const lines = [
      `🛠️ *Revisi data kasus ${dxLabel} (${dxCode})*`,
      '',
      ..._buildCaseNotificationLines_(dx, data, saved, notifyCtx, { includePrintUrl: false }),
      '',
      `Catatan Admin: ${String(data["Catatan Verifikasi EPID"] || '-').trim() || '-'}`,
      'Tindak lanjut: buka record existing, lakukan koreksi, lalu simpan ulang untuk direview kembali.'
    ];
    const res = _sendTelegramText_(notifyCtx.telegramChatId, lines);
    if (res.sent) res.source = notifyCtx.telegramTargetSource || '';
    return res;
  } catch (err) {
    return { sent: false, reason: String(err) };
  }
}

// ─── Validasi akses tulis ─────────────────────────────────────────────────────
const WORKFLOW_STAGE_IDS_ = ["section-pelapor", "section-verifikasi", "section-sampel", "section-status"];

function _normalizeWorkflowStage_(workflowStage) {
  const value = String(workflowStage || "").trim();
  if (["section-pelapor", "section-pasien", "section-specific"].includes(value)) return "section-pelapor";
  if (WORKFLOW_STAGE_IDS_.indexOf(value) !== -1) return value;
  return "";
}

function _getWritableWorkflowStagesForRole_(role) {
  role = String(role || "").trim().toLowerCase();
  if (role === "admin") return WORKFLOW_STAGE_IDS_.slice();
  if (["petugas", "surveilans", "editor", "koordinator"].includes(role)) return ["section-pelapor", "section-sampel", "section-status"];
  if (["viewer", "readonly", "read_only", "read-only"].includes(role)) return [];
  if (["inputer", "entry", "registrasi", "operator_input", "operator-input"].includes(role)) return ["section-pelapor"];
  if (["verifikator", "verifier", "epid", "validator_epid", "validator-epid"].includes(role)) return [];
  if (["lab", "laboratorium", "analislab", "analis_lab", "analis-lab"].includes(role)) return ["section-sampel"];
  if (["status", "updater_status", "updater-status", "followup", "follow_up", "follow-up", "tindaklanjut", "tindak_lanjut", "tindak-lanjut"].includes(role)) return ["section-status"];
  if (role) return ["section-pelapor", "section-status"];
  return [];
}

function _getWorkflowStageLabel_(workflowStage) {
  const normalized = _normalizeWorkflowStage_(workflowStage) || "section-pelapor";
  const labels = {
    "section-pelapor": "Input awal",
    "section-verifikasi": "Verifikasi EPID",
    "section-sampel": "Hasil pemeriksaan",
    "section-status": "Update status"
  };
  return labels[normalized] || normalized;
}

function _normalizeAccessScopeKey_(value) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, " ");
}

function _getRecordDomisiliForAccess_(dx, data) {
  const direct = {
    kabKota: _normalizeAccessScopeKey_((data && (data["Kab/Kota Pasien"] || data["Kab/Kota"] || data["Kabupaten/Kota"])) || ""),
    kecamatan: _normalizeAccessScopeKey_((data && data["Kecamatan"]) || ""),
    kelurahan: _normalizeAccessScopeKey_((data && (data["Kelurahan"] || data["Kelurahan domisili"] || data["Kelurahan/Desa"])) || "")
  };
  if (direct.kecamatan && direct.kelurahan) return direct;

  const epid = String((data && data["Nomor EPID"]) || "").trim();
  if (!dx || !epid) return direct;

  try {
    const record = _getRowObjectByEpid_(dx, epid);
    return {
      kabKota: _normalizeAccessScopeKey_(record["Kab/Kota Pasien"] || record["Kab/Kota"] || record["Kabupaten/Kota"] || direct.kabKota),
      kecamatan: _normalizeAccessScopeKey_(record["Kecamatan"] || direct.kecamatan),
      kelurahan: _normalizeAccessScopeKey_(record["Kelurahan"] || record["Kelurahan domisili"] || record["Kelurahan/Desa"] || direct.kelurahan)
    };
  } catch (e) {
    return direct;
  }
}

function _isSessionOriginalInputer_(sess, data) {
  const username = _normalizeAccessScopeKey_((sess && sess.user && sess.user.username) || '');
  const nama = _normalizeAccessScopeKey_((sess && sess.user && sess.user.nama) || '');
  const inputerUsername = _normalizeAccessScopeKey_((data && data['Diinput Oleh']) || '');
  const inputerName = _normalizeAccessScopeKey_((data && data['Input Awal Diisi Oleh']) || '');
  if (!username && !nama) return false;
  return !!((username && inputerUsername && username === inputerUsername) || (nama && inputerName && nama === inputerName));
}

function _isSessionOriginalInputerUsername_(sess, data) {
  const username = _normalizeAccessScopeKey_((sess && sess.user && sess.user.username) || '');
  const inputerUsername = _normalizeAccessScopeKey_((data && data['Diinput Oleh']) || '');
  return !!(username && inputerUsername && username === inputerUsername);
}

function _canSessionReadRecordByScope_(sess, dx, data) {
  const role = String((sess && sess.user && sess.user.role) || '').trim().toLowerCase();
  if (role === 'admin') return true;

  const userScopeLevel = String((sess && sess.user && sess.user.scopeLevel) || '').trim().toLowerCase();
  if (userScopeLevel === 'dinkes') return true;

  const verificationStatus = _normalizeVerificationStatus_((data && data['Status Verifikasi EPID']) || '');
  if ((verificationStatus === 'PERLU REVISI' || verificationStatus === 'DITOLAK') && _isSessionOriginalInputer_(sess, data || {})) return true;
  if (verificationStatus === 'PENDING' && _isSessionOriginalInputerUsername_(sess, data || {})) return true;

  const userKodePuskesmas = _normalizeAccessScopeKey_((sess && sess.user && sess.user.kodePuskesmas) || '');
  const userUnitKerja = _normalizeAccessScopeKey_((sess && sess.user && sess.user.unitKerja) || '');
  if (!userKodePuskesmas && !userUnitKerja) return false;

  const domisili = _getRecordDomisiliForAccess_(dx, data || {});
  if (!domisili.kecamatan || !domisili.kelurahan) return false;

  const pengampu = getPengampuByWilayah_(domisili.kecamatan, domisili.kelurahan, domisili.kabKota);
  if (!pengampu || !pengampu.found) return false;

  const mappedKodePuskesmas = _normalizeAccessScopeKey_(pengampu.kodePuskesmas || '');
  const mappedNamaPuskesmas = _normalizeAccessScopeKey_(pengampu.namaPuskesmas || '');
  const kodeMatch = userKodePuskesmas && mappedKodePuskesmas && userKodePuskesmas === mappedKodePuskesmas;
  const unitMatch = userUnitKerja && mappedNamaPuskesmas && userUnitKerja === mappedNamaPuskesmas;
  return !!(kodeMatch || unitMatch);
}

function _canRoleWriteSampleStage_(role) {
  role = String(role || "").trim().toLowerCase();
  return ["petugas", "surveilans", "editor", "koordinator", "lab", "laboratorium", "analislab", "analis_lab", "analis-lab"].indexOf(role) !== -1;
}

function _enforceWorkflowStageContextAccess_(sess, normalizedStage, dx, data) {
  const role = String((sess && sess.user && sess.user.role) || "").trim().toLowerCase();
  if (role === "admin") return true;

  if (normalizedStage === "section-verifikasi") {
    throw new Error("Proses verifikasi hanya dapat dilakukan oleh admin.");
  }

  if (normalizedStage === "section-sampel") {
    if (!_canRoleWriteSampleStage_(role)) {
      throw new Error("Tahap hasil pemeriksaan hanya dapat diinput oleh admin atau petugas yang berwenang atas wilayah domisili pasien.");
    }

    const domisili = _getRecordDomisiliForAccess_(dx, data);
    if (!domisili.kecamatan || !domisili.kelurahan) {
      throw new Error("Kecamatan / kelurahan domisili pasien belum tersedia, sehingga hak input hasil pemeriksaan tidak bisa diverifikasi.");
    }

    const pengampu = getPengampuByWilayah_(domisili.kecamatan, domisili.kelurahan, domisili.kabKota);
    if (!pengampu || !pengampu.found) {
      throw new Error("Mapping REF_PENGAMPU untuk domisili pasien belum ditemukan.");
    }

    const userScopeLevel = String((sess.user && sess.user.scopeLevel) || '').trim().toLowerCase();
    const userKodePuskesmas = _normalizeAccessScopeKey_((sess.user && sess.user.kodePuskesmas) || '');
    const userUnitKerja = _normalizeAccessScopeKey_((sess.user && sess.user.unitKerja) || '');
    const mappedKodePuskesmas = _normalizeAccessScopeKey_(pengampu.kodePuskesmas || '');
    const mappedNamaPuskesmas = _normalizeAccessScopeKey_(pengampu.namaPuskesmas || '');

    if (userScopeLevel === 'dinkes') return true;
    if (!userKodePuskesmas && !userUnitKerja) {
      throw new Error("Kode/unit puskesmas akun ini belum diatur di REF_USER.");
    }

    const kodeMatch = userKodePuskesmas && mappedKodePuskesmas && userKodePuskesmas === mappedKodePuskesmas;
    const unitMatch = userUnitKerja && mappedNamaPuskesmas && userUnitKerja === mappedNamaPuskesmas;
    if (!kodeMatch && !unitMatch) {
      throw new Error("Petugas hanya boleh input hasil pemeriksaan untuk pasien yang diampu puskesmas sesuai domisili (Kab/Kota + Kecamatan + Kelurahan). Mapped: " + (pengampu.namaPuskesmas || pengampu.kodePuskesmas || '-') + "; User: " + ((sess.user && (sess.user.unitKerja || sess.user.kodePuskesmas)) || '-'));
    }
  }

  return true;
}


function _isInitialReportEditPayload_(data) {
  return String((data && data.__editMode) || '').trim() === 'initial_report';
}

function _getInitialReportStageOnlyFields_() {
  var fields = [];
  try { fields = fields.concat((RAW_SCHEMA_COMMON_ && RAW_SCHEMA_COMMON_.pelapor) || []); } catch (e) {}
  try { fields = fields.concat((RAW_SCHEMA_COMMON_ && RAW_SCHEMA_COMMON_.pasien) || []); } catch (e) {}
  try {
    var dx = String(arguments[0] || '').trim().toUpperCase();
    fields = fields.concat((RAW_SCHEMA_DIAGNOSIS_FIELDS_ && RAW_SCHEMA_DIAGNOSIS_FIELDS_[dx]) || []);
  } catch (e2) {}
  return fields;
}

function _getExistingRecordForPayload_(dx, data, token) {
  try {
    var key = String((data && (data['ID Registrasi Kasus'] || data.RAW_ROW_NUMBER || data['Nomor EPID'] || data['Nomor EPID Final'])) || '').trim();
    if (!key) return null;
    return getRecordByKey(dx, key, token) || null;
  } catch (e) {
    return null;
  }
}

function _buildEditDiffSummary_(existing, data, allowMap) {
  var diffs = [];
  var ignored = { dx: true, __token: true, __workflowStage: true, __editMode: true, RAW_ROW_NUMBER: true, 'ID Registrasi Kasus': true, 'Nomor EPID': true, 'Nomor EPID Rekomendasi': true, 'Nomor EPID Final': true };
  Object.keys(data || {}).forEach(function(field) {
    if (!allowMap[field] || ignored[field]) return;
    var before = String((existing && existing[field]) || '').trim();
    var after = String((data && data[field]) || '').trim();
    if (before !== after) diffs.push(field);
  });
  return diffs.slice(0, 24).join(', ');
}


function _getWorkflowStageAllowedUpdateFields_(workflowStage) {
  const normalizedStage = _normalizeWorkflowStage_(workflowStage) || "section-pelapor";
  const commonIdentity = [
    'dx', '__token', '__workflowStage', '__submitMode', '__action', '__alreadyLocked',
    'RAW_ROW_NUMBER', 'ID Registrasi Kasus', 'Nomor EPID', 'Nomor EPID Final', 'Nomor EPID Rekomendasi'
  ];
  const auditAndWorkflow = [
    'Tahap Workflow Terakhir', 'Label Tahap Workflow Terakhir', 'Diupdate Oleh Tahap Terakhir', 'Role Pengupdate Tahap Terakhir', 'Waktu Update Tahap Terakhir',
    'Workflow Current Queue', 'Workflow Current Label', 'Status Proses Verifikasi EPID', 'Status Proses Pemeriksaan', 'Status Proses Pemantauan', 'Status Proses Perbaikan', 'Workflow Selesai'
  ];
  const stageMap = {
    'section-verifikasi': [
      'Status Verifikasi EPID', 'Tanggal Verifikasi EPID', 'Petugas Verifikator', 'Catatan Verifikasi EPID',
      'Review Admin Terakhir', 'Waktu Permintaan Revisi', 'Notifikasi Revisi Dibaca',
      'Status Notifikasi Pengampu', 'Reason Notifikasi Pengampu', 'Status Sinkronisasi Pengampu', 'Reason Sinkronisasi Pengampu',
      'Status Notifikasi Telegram', 'Reason Notifikasi Telegram',
      'Status Notifikasi Revisi Pengampu', 'Reason Notifikasi Revisi Pengampu', 'Status Notifikasi Revisi Telegram', 'Reason Notifikasi Revisi Telegram',
      'Verifikasi EPID Diupdate Oleh', 'Role Pengupdate Verifikasi EPID', 'Waktu Update Verifikasi EPID'
    ],
    'section-sampel': [
      'Pemeriksaan Sampel Dilakukan', 'Rincian Hasil Sampel', 'Jenis Sampel Diuji', 'Nomor Sampel / Lab', 'Tanggal Hasil Sampel',
      'Hasil Pemeriksaan Sampel', 'Interpretasi Hasil Sampel',
      'Hasil Pemeriksaan Diupdate Oleh', 'Role Pengupdate Hasil Pemeriksaan', 'Waktu Update Hasil Pemeriksaan'
    ],
    'section-status': [
      'Status Pasien/Kasus', 'Tanggal Update Status', 'Dasar Penetapan Status', 'Catatan Status Pasien', 'Riwayat Status Kasus',
      'Status Kasus Diupdate Oleh', 'Role Pengupdate Status Kasus', 'Waktu Update Status Kasus'
    ]
  };
  return commonIdentity.concat(auditAndWorkflow).concat(stageMap[normalizedStage] || []);
}

function _sanitizeDedicatedWorkflowStagePayload_(dx, data, sess) {
  data = data || {};
  const normalizedStage = _normalizeWorkflowStage_(data.__workflowStage);
  if (!normalizedStage || normalizedStage === 'section-pelapor' || _isInitialReportEditPayload_(data)) return data;
  const allowed = {};
  _getWorkflowStageAllowedUpdateFields_(normalizedStage).forEach(function(field) { allowed[field] = true; });
  const cleaned = {};
  Object.keys(data || {}).forEach(function(field) {
    if (allowed[field]) cleaned[field] = data[field];
  });
  const existing = _getExistingRecordForPayload_(dx, data, String(data.__token || '').trim()) || {};
  ['ID Registrasi Kasus', 'Nomor EPID', 'Nomor EPID Final', 'Nomor EPID Rekomendasi', 'Status Verifikasi EPID', 'Status Pasien/Kasus', 'Pemeriksaan Sampel Dilakukan', 'Interpretasi Hasil Sampel'].forEach(function(field) {
    if (!String(cleaned[field] || '').trim() && String(existing[field] || '').trim()) cleaned[field] = existing[field];
  });
  cleaned.__existingRecordForWorkflow = existing;
  return cleaned;
}

function _sanitizeInitialReportEditPayload_(dx, data, sess) {
  if (!_isInitialReportEditPayload_(data)) return data;
  dx = String(dx || '').trim().toUpperCase();
  data = data || {};
  var token = String(data.__token || '').trim();
  var existing = _getExistingRecordForPayload_(dx, data, token) || {};
  var allowed = {};
  ['dx', '__token', '__workflowStage', '__editMode', 'RAW_ROW_NUMBER', 'ID Registrasi Kasus', 'Nomor EPID', 'Nomor EPID Rekomendasi', 'Nomor EPID Final'].forEach(function(field) { allowed[field] = true; });
  _getInitialReportStageOnlyFields_(dx).forEach(function(field) { allowed[String(field || '').trim()] = true; });

  var cleaned = {};
  Object.keys(data || {}).forEach(function(field) {
    if (allowed[field]) cleaned[field] = data[field];
  });

  if (existing['ID Registrasi Kasus']) cleaned['ID Registrasi Kasus'] = existing['ID Registrasi Kasus'];
  if (existing['Nomor EPID']) cleaned['Nomor EPID'] = existing['Nomor EPID'];
  if (existing['Nomor EPID Final']) cleaned['Nomor EPID Final'] = existing['Nomor EPID Final'];
  if (existing['Nomor EPID Rekomendasi']) cleaned['Nomor EPID Rekomendasi'] = existing['Nomor EPID Rekomendasi'];

  var actor = (sess && sess.user && (sess.user.nama || sess.user.username)) || 'unknown';
  var diffSummary = _buildEditDiffSummary_(existing, cleaned, allowed);
  cleaned['Edited At'] = new Date();
  cleaned['Edited By'] = actor;
  cleaned['Edit Reason'] = String(data['Edit Reason'] || data.__editReason || '').trim() || 'Koreksi inputan awal';
  cleaned['Edit Diff Summary'] = diffSummary || 'Tidak ada perubahan field input awal yang terdeteksi';

  var normalizedExistingStatus = String(existing['Status Verifikasi EPID'] || '').trim().toUpperCase();
  if (normalizedExistingStatus === 'TERVERIFIKASI' && diffSummary) {
    cleaned['Edit Inputan Perlu Review Ulang'] = 'Ya';
    cleaned['Edit Inputan Review Note'] = 'Inputan awal diubah setelah verifikasi: ' + diffSummary;
  }
  return cleaned;
}

function _applyWorkflowStageAuditFields_(data, sess, workflowStage) {
  data = data || {};
  sess = sess || {};
  const user = sess.user || {};
  const normalizedStage = _normalizeWorkflowStage_(workflowStage) || "section-pelapor";
  const stageLabel = _getWorkflowStageLabel_(normalizedStage);
  const actorName = String(user.nama || user.username || "").trim() || "unknown";
  const actorRole = String(user.role || "").trim().toLowerCase() || "unknown";
  const now = new Date();

  data["Tahap Workflow Terakhir"] = normalizedStage;
  data["Label Tahap Workflow Terakhir"] = stageLabel;
  data["Diupdate Oleh Tahap Terakhir"] = actorName;
  data["Role Pengupdate Tahap Terakhir"] = actorRole;
  data["Waktu Update Tahap Terakhir"] = now;

  const stageFieldMap = {
    "section-pelapor": {
      by: "Input Awal Diisi Oleh",
      role: "Role Pengisi Input Awal",
      at: "Waktu Input Awal"
    },
    "section-verifikasi": {
      by: "Verifikasi EPID Diupdate Oleh",
      role: "Role Pengupdate Verifikasi EPID",
      at: "Waktu Update Verifikasi EPID"
    },
    "section-sampel": {
      by: "Hasil Pemeriksaan Diupdate Oleh",
      role: "Role Pengupdate Hasil Pemeriksaan",
      at: "Waktu Update Hasil Pemeriksaan"
    },
    "section-status": {
      by: "Status Kasus Diupdate Oleh",
      role: "Role Pengupdate Status Kasus",
      at: "Waktu Update Status Kasus"
    }
  };

  const mapping = stageFieldMap[normalizedStage];
  if (mapping) {
    data[mapping.by] = actorName;
    data[mapping.role] = actorRole;
    data[mapping.at] = now;
    if (normalizedStage === "section-pelapor") {
      data["Diinput Oleh"] = String(user.username || actorName || "").trim();
      data["Role Penginput"] = actorRole;
    }
  }

  data.__user = { username: String(user.username || "").trim(), role: actorRole, nama: actorName };
  data.__auditMeta = { workflowStage: normalizedStage, workflowStageLabel: stageLabel };
  return data;
}

function _requireWriteAccessFromSession_(sess, workflowStage, data) {
  if (!sess || !sess.user) throw new Error("Sesi tidak valid.");
  const role = String(sess.user.role || "").trim().toLowerCase();
  if (["viewer", "readonly", "read_only", "read-only"].includes(role)) {
    throw new Error("Role viewer hanya bisa melihat data dan mencetak, tidak bisa menambah/mengubah data.");
  }

  const dx = String((data && data.dx) || "").trim().toUpperCase();
  const allowedStages = _getWritableWorkflowStagesForRole_(role);
  const normalizedStage = _normalizeWorkflowStage_(workflowStage);
  const isScopedStageRole = allowedStages.length === 1 && WORKFLOW_STAGE_IDS_.length > 1;

  if (!normalizedStage) {
    if (isScopedStageRole) {
      throw new Error("Role aktif memakai pembatasan tahap kerja. Refresh aplikasi lalu simpan lewat tahap yang sesuai.");
    }
    return role || "petugas";
  }

  if (normalizedStage !== "section-pelapor") {
    const hasExistingRecordKey = !!String(
      (data && (data["ID Registrasi Kasus"] || data.RAW_ROW_NUMBER || data["Nomor EPID"] || data["Nomor EPID Final"])) || ""
    ).trim();
    if (!hasExistingRecordKey) {
      throw new Error("Tahap verifikasi / hasil pemeriksaan / update status hanya boleh untuk record existing setelah input awal tersimpan.");
    }
  }

  if (allowedStages.length && allowedStages.indexOf(normalizedStage) === -1) {
    throw new Error("Role aktif tidak berwenang menyimpan perubahan pada tahap kerja ini.");
  }

  _enforceWorkflowStageContextAccess_(sess, normalizedStage, dx, data);

  return role || "petugas";
}


function _isFinalCaseStatus_(statusKasus) {
  const normalized = String(statusKasus || '').trim().toUpperCase();
  return ['DISCARDED', 'SEMBUH', 'MENINGGAL', 'LOST TO FOLLOW-UP', 'LOST TO FOLLOW UP'].indexOf(normalized) !== -1;
}

function _recordRequiresSampleStage_(record) {
  record = record || {};
  const directSample = String(record['Pemeriksaan Sampel Dilakukan'] || '').trim().toUpperCase();
  const statusKasus = String(record['Status Pasien/Kasus'] || '').trim().toUpperCase();
  const interpretasi = String(record['Interpretasi Hasil Sampel'] || '').trim().toUpperCase();
  const specimenRequested = Object.keys(record).some(function(field) {
    return /spesimen/i.test(field) && /(diambil|dikirim)/i.test(field) && String(record[field] || '').trim().toUpperCase() === 'YA';
  });
  const sampleRelevant = specimenRequested || directSample === 'YA' || statusKasus === 'MENUNGGU HASIL LAB';
  const sampleDone = directSample === 'TIDAK' || (directSample === 'YA' && !!interpretasi && interpretasi !== 'BELUM KELUAR');
  return sampleRelevant && !sampleDone && !_isFinalCaseStatus_(statusKasus);
}

function _recordSampleStageIsDone_(record) {
  record = record || {};
  const directSample = String(record['Pemeriksaan Sampel Dilakukan'] || '').trim().toUpperCase();
  const interpretasi = String(record['Interpretasi Hasil Sampel'] || '').trim().toUpperCase();
  return directSample === 'TIDAK' || (directSample === 'YA' && !!interpretasi && interpretasi !== 'BELUM KELUAR');
}

function _applyWorkflowProcessMarkers_(record) {
  record = record || {};
  const verificationStatus = String(record['Status Verifikasi EPID'] || '').trim().toUpperCase() || 'PENDING';
  const statusKasus = String(record['Status Pasien/Kasus'] || '').trim().toUpperCase();
  const isFinalStatus = _isFinalCaseStatus_(statusKasus);
  const samplePending = _recordRequiresSampleStage_(record);
  const sampleDone = _recordSampleStageIsDone_(record);

  let currentQueue = 'verifikasi_epid';
  let currentLabel = 'Menunggu verifikasi EPID';
  let verificationMarker = 'PENDING';
  let sampleMarker = 'BELUM_SIAP';
  let monitoringMarker = 'BELUM_SIAP';
  let revisionMarker = 'TIDAK_ADA';
  let workflowDone = 'Tidak';

  if (verificationStatus === 'TERVERIFIKASI') {
    verificationMarker = 'SELESAI';
    revisionMarker = 'TIDAK_ADA';
    if (samplePending) {
      currentQueue = 'input_pemeriksaan';
      currentLabel = 'Menunggu input hasil pemeriksaan';
      sampleMarker = 'PENDING';
      monitoringMarker = 'BELUM_SIAP';
    } else if (!isFinalStatus) {
      currentQueue = 'pemantauan';
      currentLabel = sampleDone ? 'Pemeriksaan selesai, masuk pemantauan' : 'Tidak perlu pemeriksaan, masuk pemantauan';
      sampleMarker = sampleDone ? 'SELESAI' : 'TIDAK_PERLU';
      monitoringMarker = 'PENDING';
    } else {
      currentQueue = 'selesai';
      currentLabel = 'Workflow kasus selesai';
      sampleMarker = sampleDone ? 'SELESAI' : 'TIDAK_PERLU';
      monitoringMarker = 'SELESAI';
      workflowDone = 'Ya';
    }
  } else if (verificationStatus === 'PERLU REVISI' || verificationStatus === 'DITOLAK') {
    currentQueue = 'kasus_ditolak';
    currentLabel = 'Ditolak/perlu revisi input awal';
    verificationMarker = 'DITOLAK';
    revisionMarker = 'PENDING';
  }

  record['Workflow Current Queue'] = currentQueue;
  record['Workflow Current Label'] = currentLabel;
  record['Status Proses Verifikasi EPID'] = verificationMarker;
  record['Status Proses Pemeriksaan'] = sampleMarker;
  record['Status Proses Pemantauan'] = monitoringMarker;
  record['Status Proses Perbaikan'] = revisionMarker;
  record['Workflow Selesai'] = workflowDone;
  return record;
}

function _resolveNextWorkflowAfterSave_(savedRecord) {
  savedRecord = savedRecord || {};
  const verificationStatus = String(savedRecord['Status Verifikasi EPID'] || '').trim().toUpperCase();
  if (verificationStatus === 'PERLU REVISI' || verificationStatus === 'DITOLAK') {
    return { stage: 'section-pelapor', workspace: 'edit', label: 'Masuk daftar kasus ditolak/perlu perbaikan' };
  }
  if (verificationStatus !== 'TERVERIFIKASI') {
    return { stage: 'section-verifikasi', workspace: 'verifikasi', label: 'Menunggu verifikasi EPID' };
  }
  if (_recordRequiresSampleStage_(savedRecord)) {
    return { stage: 'section-sampel', workspace: 'sampel', label: 'Masuk daftar Input Hasil Sampel/Lab' };
  }
  if (!_isFinalCaseStatus_(savedRecord['Status Pasien/Kasus'])) {
    return { stage: 'section-status', workspace: 'status', label: 'Masuk daftar Update Status Pemantauan' };
  }
  return { stage: 'done', workspace: 'history', label: 'Workflow kasus selesai' };
}

function _isAsyncPipelineEnabled_() {
  const mode = String((Config_Manager.getConfig("PIPELINE_MODE") || "sync")).trim().toLowerCase();
  return mode === "async";
}

function _computeJsonFingerprint_(payload) {
  const raw = JSON.stringify(payload || {});
  const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, raw, Utilities.Charset.UTF_8);
  return digest.map(function(b) {
    const v = (b + 256) % 256;
    return (v < 16 ? "0" : "") + v.toString(16);
  }).join("");
}

function _buildPipelineFingerprint_(dx, savedRecord, saved) {
  const notifyCtx = _resolvePengampuNotificationContext_(dx, savedRecord || {});
  const payload = {
    dx: String(dx || "").trim().toUpperCase(),
    epid: String((saved && saved.epid) || "").trim(),
    routing: notifyCtx.statusRouting || String((savedRecord && savedRecord["Status Routing Pengampu"]) || "").trim(),
    targetSpreadsheet: notifyCtx.spreadsheetId || String((savedRecord && savedRecord["SpreadsheetId Pengampu"]) || "").trim(),
    emailTargets: (notifyCtx.emailRecipients || []).join("|"),
    telegramTarget: notifyCtx.telegramChatId || String((savedRecord && savedRecord["Telegram Chat Id Pengampu"]) || "").trim(),
    printUrl: String(savedRecord && savedRecord["Link PDF"] || "").trim()
  };
  return _computeJsonFingerprint_(payload);
}

function _buildRevisionNotificationFingerprint_(dx, savedRecord, saved) {
  const notifyCtx = _resolvePengampuNotificationContext_(dx, savedRecord || {});
  const payload = {
    dx: String(dx || '').trim().toUpperCase(),
    recordId: String((saved && saved.recordId) || (savedRecord && savedRecord["ID Registrasi Kasus"]) || '').trim(),
    epid: String((saved && saved.epid) || (savedRecord && savedRecord["Nomor EPID"]) || '').trim(),
    verificationStatus: String((savedRecord && savedRecord["Status Verifikasi EPID"]) || '').trim(),
    catatan: String((savedRecord && savedRecord["Catatan Verifikasi EPID"]) || '').trim(),
    routing: notifyCtx.statusRouting || '',
    emailTargets: (notifyCtx.emailRecipients || []).join('|'),
    telegramTarget: notifyCtx.telegramChatId || ''
  };
  return _computeJsonFingerprint_(payload);
}

function _runPostSavePipeline_(dx, savedRecord, saved, printUrl) {
  const policy = _getDxPipelinePolicy_(dx);
  const notifyCtx = _resolvePengampuNotificationContext_(dx, savedRecord || {});
  const previousFingerprint = String((savedRecord && savedRecord["Pipeline Fingerprint"]) || "").trim();
  const currentFingerprint = _buildPipelineFingerprint_(dx, savedRecord, saved);
  const isSameFingerprint = previousFingerprint && previousFingerprint === currentFingerprint;

  const prevNotifyStatus = String((savedRecord && savedRecord["Status Notifikasi Pengampu"]) || "").trim().toUpperCase();
  const prevSyncStatus = String((savedRecord && savedRecord["Status Sinkronisasi Pengampu"]) || "").trim().toUpperCase();
  const prevTelegramStatus = String((savedRecord && savedRecord["Status Notifikasi Telegram"]) || "").trim().toUpperCase();

  const shouldNotifyEmail = policy.notifyEmail && !(isSameFingerprint && prevNotifyStatus === "SENT");
  const shouldSyncPengampu = policy.syncPengampu && !(isSameFingerprint && prevSyncStatus === "SYNCED");
  const shouldNotifyTelegram = policy.notifyTelegram && !(isSameFingerprint && prevTelegramStatus === "SENT");

  const notify = shouldNotifyEmail
    ? _sendPengampuNotification_(dx, savedRecord, saved, printUrl)
    : { sent: false, reason: isSameFingerprint ? "SKIPPED_IDEMPOTENT" : "DISABLED_BY_POLICY" };

  const syncPengampu = shouldSyncPengampu
    ? _syncPengampuSpreadsheet_(dx, savedRecord, saved, printUrl)
    : { synced: false, reason: isSameFingerprint ? "SKIPPED_IDEMPOTENT" : "DISABLED_BY_POLICY" };

  const telegramNotify = shouldNotifyTelegram
    ? _sendTelegramPd3iNotification_(dx, savedRecord, saved, printUrl)
    : { sent: false, reason: isSameFingerprint ? "SKIPPED_IDEMPOTENT" : "DISABLED_BY_POLICY" };

  const notifyPatch = {
    "ID Registrasi Kasus": saved.recordId,
    "Nomor EPID": saved.epid,
    "Puskesmas Pengampu": notifyCtx.puskesmasPengampu || String((savedRecord && savedRecord["Puskesmas Pengampu"]) || '').trim(),
    "KodePuskesmas Pengampu": notifyCtx.kodePuskesmasPengampu || String((savedRecord && savedRecord["KodePuskesmas Pengampu"]) || '').trim(),
    "SpreadsheetId Pengampu": notifyCtx.spreadsheetId || String((savedRecord && savedRecord["SpreadsheetId Pengampu"]) || '').trim(),
    "SpreadsheetUrl Pengampu": notifyCtx.spreadsheetUrl || String((savedRecord && savedRecord["SpreadsheetUrl Pengampu"]) || '').trim(),
    "Telegram Chat Id Pengampu": notifyCtx.telegramTargetSource === 'global' ? String((savedRecord && savedRecord["Telegram Chat Id Pengampu"]) || '').trim() : (notifyCtx.telegramChatId || String((savedRecord && savedRecord["Telegram Chat Id Pengampu"]) || '').trim()),
    "Status Routing Pengampu": notifyCtx.statusRouting || String((savedRecord && savedRecord["Status Routing Pengampu"]) || '').trim(),
    "Status Notifikasi Pengampu": notify.sent ? "SENT" : (shouldNotifyEmail ? (notify.reason || "FAILED") : prevNotifyStatus || "SKIPPED"),
    "Reason Notifikasi Pengampu": notify.sent ? "" : (notify.reason || ""),
    "Notified At Pengampu": new Date(),
    "Notified To Pengampu": notify.to || "",
    "Status Sinkronisasi Pengampu": syncPengampu.synced ? "SYNCED" : (shouldSyncPengampu ? (syncPengampu.reason || "FAILED") : prevSyncStatus || "SKIPPED"),
    "Reason Sinkronisasi Pengampu": syncPengampu.synced ? "" : (syncPengampu.reason || ""),
    "Synced At Pengampu": new Date(),
    "Sync Target Pengampu": syncPengampu.target || "",
    "Status Notifikasi Telegram": telegramNotify.sent ? "SENT" : (shouldNotifyTelegram ? (telegramNotify.reason || "FAILED") : prevTelegramStatus || "SKIPPED"),
    "Reason Notifikasi Telegram": telegramNotify.sent ? "" : (telegramNotify.reason || ""),
    "Telegram Notified At": new Date(),
    "Telegram Target": telegramNotify.target || "",
    "Telegram Retry Count": shouldNotifyTelegram ? ((Number(savedRecord["Telegram Retry Count"] || 0) || 0) + 1) : (Number(savedRecord["Telegram Retry Count"] || 0) || 0),
    "Pipeline Fingerprint": currentFingerprint,
    "Pipeline Last Run At": new Date()
  };

  try {
    saveDxRecord_(dx, notifyPatch);
  } catch (e) {
    // jangan gagalkan save utama hanya karena status pipeline gagal ditulis
  }

  return {
    pengampuNotification: notify,
    pengampuSync: syncPengampu,
    telegramNotification: telegramNotify,
    idempotent: isSameFingerprint
  };
}

function _runRevisionNotificationPipeline_(dx, savedRecord, saved) {
  const previousFingerprint = String((savedRecord && savedRecord["Revision Notification Fingerprint"]) || '').trim();
  const currentFingerprint = _buildRevisionNotificationFingerprint_(dx, savedRecord, saved);
  const isSameFingerprint = previousFingerprint && previousFingerprint === currentFingerprint;
  const prevEmailStatus = String((savedRecord && savedRecord["Status Notifikasi Revisi Pengampu"]) || '').trim().toUpperCase();
  const prevTelegramStatus = String((savedRecord && savedRecord["Status Notifikasi Revisi Telegram"]) || '').trim().toUpperCase();
  const notifyCtx = _resolvePengampuNotificationContext_(dx, savedRecord || {});

  const shouldNotifyEmail = !(isSameFingerprint && prevEmailStatus === 'SENT');
  const shouldNotifyTelegram = !(isSameFingerprint && prevTelegramStatus === 'SENT');

  const revisionEmail = shouldNotifyEmail
    ? _sendRevisionPengampuNotification_(dx, savedRecord, saved)
    : { sent: false, reason: 'SKIPPED_IDEMPOTENT' };
  const revisionTelegram = shouldNotifyTelegram
    ? _sendRevisionTelegramNotification_(dx, savedRecord, saved)
    : { sent: false, reason: 'SKIPPED_IDEMPOTENT' };

  const patch = {
    "ID Registrasi Kasus": saved.recordId,
    "Nomor EPID": saved.epid || String((savedRecord && savedRecord["Nomor EPID"]) || '').trim(),
    "Puskesmas Pengampu": notifyCtx.puskesmasPengampu || String((savedRecord && savedRecord["Puskesmas Pengampu"]) || '').trim(),
    "KodePuskesmas Pengampu": notifyCtx.kodePuskesmasPengampu || String((savedRecord && savedRecord["KodePuskesmas Pengampu"]) || '').trim(),
    "Telegram Chat Id Pengampu": notifyCtx.telegramTargetSource === 'global' ? String((savedRecord && savedRecord["Telegram Chat Id Pengampu"]) || '').trim() : (notifyCtx.telegramChatId || String((savedRecord && savedRecord["Telegram Chat Id Pengampu"]) || '').trim()),
    "Status Routing Pengampu": notifyCtx.statusRouting || String((savedRecord && savedRecord["Status Routing Pengampu"]) || '').trim(),
    "Status Notifikasi Revisi Pengampu": revisionEmail.sent ? 'SENT' : (shouldNotifyEmail ? (revisionEmail.reason || 'FAILED') : prevEmailStatus || 'SKIPPED'),
    "Reason Notifikasi Revisi Pengampu": revisionEmail.sent ? '' : (revisionEmail.reason || ''),
    "Revision Notified At Pengampu": new Date(),
    "Revision Notified To Pengampu": revisionEmail.to || '',
    "Status Notifikasi Revisi Telegram": revisionTelegram.sent ? 'SENT' : (shouldNotifyTelegram ? (revisionTelegram.reason || 'FAILED') : prevTelegramStatus || 'SKIPPED'),
    "Reason Notifikasi Revisi Telegram": revisionTelegram.sent ? '' : (revisionTelegram.reason || ''),
    "Revision Telegram Notified At": new Date(),
    "Revision Telegram Target": revisionTelegram.target || '',
    "Revision Notification Fingerprint": currentFingerprint,
    "Revision Notification Last Run At": new Date()
  };
  try {
    saveDxRecord_(dx, patch);
  } catch (e) {}

  return {
    revisionNotification: revisionEmail,
    revisionTelegramNotification: revisionTelegram,
    idempotent: isSameFingerprint
  };
}

// ─── saveFormPayload_ ─────────────────────────────────────────────────────────
function saveFormPayload_(data) {
  const token = String(data.__token || "").trim();
  const sess = _getSessionFromToken_(token);
  if (!sess.ok) {
    return { status: "error", message: sess.message || "Sesi habis. Silakan login ulang." };
  }
  _requireWriteAccessFromSession_(sess, data.__workflowStage, data);

  const dx = String(data.dx || "").trim().toUpperCase();
  if (!dx) {
    return { status: "error", message: "dx wajib diisi." };
  }

  data = _sanitizeInitialReportEditPayload_(dx, data, sess);
  data = _sanitizeDedicatedWorkflowStagePayload_(dx, data, sess);
  data = _applyWorkflowStageAuditFields_(data, sess, data.__workflowStage);

  const workflowMarkerSource = Object.assign({}, data.__existingRecordForWorkflow || {}, data);
  delete data.__existingRecordForWorkflow;
  const workflowMarkedData = _applyWorkflowProcessMarkers_(workflowMarkerSource);
  ['Workflow Current Queue', 'Workflow Current Label', 'Status Proses Verifikasi EPID', 'Status Proses Pemeriksaan', 'Status Proses Pemantauan', 'Status Proses Perbaikan', 'Workflow Selesai'].forEach(function(field) {
    data[field] = workflowMarkedData[field];
  });
  const saved = saveDxRecord_(dx, data);
  const hasFinalEpid = !!String(saved.epid || '').trim();
  const printUrl = hasFinalEpid ? safeGetPdfPrintUrl_(dx, saved.epid, token) : '';
  try {
    const sheet = getSheetOrThrow_(dx + "_Raw");
    const headers = getTrimmedHeaders_(sheet);
    const idxEpid = headers.indexOf("Nomor EPID");
    const idxPdf = headers.indexOf("Link PDF");
    if (saved.rowIndex && idxEpid !== -1) sheet.getRange(saved.rowIndex, idxEpid + 1).setValue(saved.epid || "");
    if (saved.rowIndex && idxPdf !== -1) sheet.getRange(saved.rowIndex, idxPdf + 1).setValue(printUrl || "");
  } catch (persistErr) {
    console.warn("Persist EPID/Link PDF setelah save gagal:", persistErr);
  }
  let savedRecord = data;
  try {
    if (hasFinalEpid) {
      savedRecord = _getRowObjectByEpid_(dx, saved.epid);
    } else if (saved.recordId) {
      savedRecord = getRecordByKey(dx, saved.recordId, token) || data;
    } else {
      savedRecord = data;
    }
  } catch (e) {
    savedRecord = data;
  }

  savedRecord = _applyWorkflowProcessMarkers_(savedRecord || data);
  try {
    saveDxRecord_(dx, {
      "ID Registrasi Kasus": saved.recordId,
      "Nomor EPID": saved.epid || String((savedRecord && savedRecord["Nomor EPID"]) || '').trim(),
      "Status Verifikasi EPID": String((savedRecord && savedRecord["Status Verifikasi EPID"]) || '').trim(),
      "Workflow Current Queue": savedRecord["Workflow Current Queue"],
      "Workflow Current Label": savedRecord["Workflow Current Label"],
      "Status Proses Verifikasi EPID": savedRecord["Status Proses Verifikasi EPID"],
      "Status Proses Pemeriksaan": savedRecord["Status Proses Pemeriksaan"],
      "Status Proses Pemantauan": savedRecord["Status Proses Pemantauan"],
      "Status Proses Perbaikan": savedRecord["Status Proses Perbaikan"],
      "Workflow Selesai": savedRecord["Workflow Selesai"]
    });
  } catch (markerErr) {}

  let revisionPipelineResult = {
    revisionNotification: { sent: false, reason: 'SKIPPED_NOT_REVISION' },
    revisionTelegramNotification: { sent: false, reason: 'SKIPPED_NOT_REVISION' },
    idempotent: false
  };

  const verificationStatus = String((saved && saved.verificationStatus) || (savedRecord && savedRecord["Status Verifikasi EPID"]) || '').trim().toUpperCase();
  if (verificationStatus === 'PERLU REVISI' || verificationStatus === 'DITOLAK') {
    revisionPipelineResult = _runRevisionNotificationPipeline_(dx, savedRecord, saved);
  }

  let pipelineResult = {
    pengampuNotification: { sent: false, reason: 'SKIPPED_NO_FINAL_EPID' },
    pengampuSync: { synced: false, reason: 'SKIPPED_NO_FINAL_EPID' },
    telegramNotification: { sent: false, reason: 'SKIPPED_NO_FINAL_EPID' },
    idempotent: false,
    queued: false
  };

  if (hasFinalEpid) {
    const pipelineFingerprint = _buildPipelineFingerprint_(dx, savedRecord, saved);
    if (_isAsyncPipelineEnabled_() && typeof enqueuePipelineTask_ === "function") {
      const queueRes = enqueuePipelineTask_(dx, saved.epid, pipelineFingerprint, { printUrl: printUrl });
      const notifyCtx = _resolvePengampuNotificationContext_(dx, savedRecord || {});
      const queuedPatch = {
        "ID Registrasi Kasus": saved.recordId,
        "Nomor EPID": saved.epid,
        "Puskesmas Pengampu": notifyCtx.puskesmasPengampu || String((savedRecord && savedRecord["Puskesmas Pengampu"]) || '').trim(),
        "KodePuskesmas Pengampu": notifyCtx.kodePuskesmasPengampu || String((savedRecord && savedRecord["KodePuskesmas Pengampu"]) || '').trim(),
        "SpreadsheetId Pengampu": notifyCtx.spreadsheetId || String((savedRecord && savedRecord["SpreadsheetId Pengampu"]) || '').trim(),
        "SpreadsheetUrl Pengampu": notifyCtx.spreadsheetUrl || String((savedRecord && savedRecord["SpreadsheetUrl Pengampu"]) || '').trim(),
        "Telegram Chat Id Pengampu": notifyCtx.telegramTargetSource === 'global' ? String((savedRecord && savedRecord["Telegram Chat Id Pengampu"]) || '').trim() : (notifyCtx.telegramChatId || String((savedRecord && savedRecord["Telegram Chat Id Pengampu"]) || '').trim()),
        "Status Routing Pengampu": notifyCtx.statusRouting || String((savedRecord && savedRecord["Status Routing Pengampu"]) || '').trim(),
        "Status Notifikasi Pengampu": "QUEUED",
        "Status Sinkronisasi Pengampu": "QUEUED",
        "Status Notifikasi Telegram": "QUEUED",
        "Reason Notifikasi Pengampu": "QUEUED_ASYNC",
        "Reason Sinkronisasi Pengampu": "QUEUED_ASYNC",
        "Reason Notifikasi Telegram": "QUEUED_ASYNC",
        "Pipeline Fingerprint": pipelineFingerprint,
        "Pipeline Last Run At": new Date()
      };
      try { saveDxRecord_(dx, queuedPatch); } catch (e) {}

      pipelineResult = {
        pengampuNotification: { sent: false, reason: "QUEUED_ASYNC" },
        pengampuSync: { synced: false, reason: "QUEUED_ASYNC" },
        telegramNotification: { sent: false, reason: "QUEUED_ASYNC" },
        idempotent: false,
        queued: !!(queueRes && queueRes.queued)
      };
    } else {
      pipelineResult = _runPostSavePipeline_(dx, savedRecord, saved, printUrl);
    }
  }

  const finalVerificationStatus = String((saved && saved.verificationStatus) || '').trim() || 'Pending';
  const nextWorkflow = _resolveNextWorkflowAfterSave_(savedRecord);
  const successMessage = finalVerificationStatus === 'Perlu Revisi'
    ? 'Kasus ditandai Perlu Revisi dan masuk daftar tindak lanjut puskesmas.'
    : (finalVerificationStatus === 'Terverifikasi'
      ? 'Verifikasi selesai dan nomor EPID final berhasil ditetapkan.'
      : (saved.isUpdate ? 'Data kasus berhasil diperbarui.' : 'Input awal kasus berhasil disimpan dengan status Pending.'));

  return {
    status: "success",
    message: successMessage,
    epid: saved.epid,
    recordId: saved.recordId,
    verificationStatus: finalVerificationStatus,
    dx: dx,
    printUrl: printUrl,
    pipelineIdempotent: !!pipelineResult.idempotent,
    pipelineQueued: !!pipelineResult.queued,
    revisionPipelineIdempotent: !!revisionPipelineResult.idempotent,
    pengampuNotification: pipelineResult.pengampuNotification,
    pengampuSync: pipelineResult.pengampuSync,
    telegramNotification: pipelineResult.telegramNotification,
    revisionNotification: revisionPipelineResult.revisionNotification,
    revisionTelegramNotification: revisionPipelineResult.revisionTelegramNotification,
    nextWorkflowStage: nextWorkflow.stage,
    nextWorkflowWorkspace: nextWorkflow.workspace,
    nextWorkflowLabel: nextWorkflow.label
  };
}
