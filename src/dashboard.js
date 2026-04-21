/**
 * dashboard.js — Dashboard & Utilities untuk PD3I Surveillance
 * Menyediakan fungsi agregasi statistik dan export CSV.
 *
 * Req 6.1–6.8: getDashboardStats
 * Req 7.1–7.4, 7.6: exportToCsv
 */

// ─── Konstanta ───────────────────────────────────────────────────────────────

/** DX yang didukung */
const SUPPORTED_DX_ = ["MR", "DIF", "PERT", "TN", "AFP"];

// ─── Helper: baca data sheet (cache-first) ───────────────────────────────────

/**
 * Baca data sheet dengan strategi cache-first.
 * Req 6.8: gunakan Cache_Manager untuk membaca data.
 * @param {string} sheetName
 * @returns {{ headers: string[], rows: Array[] } | null}
 */
function _readSheetWithCache_(sheetName) {
  // Coba dari cache terlebih dahulu
  let raw = Cache_Manager.getSheetData(sheetName);

  if (!raw) {
    // Cache miss: baca dari sheet langsung (Req 6.8 fallback)
    const sheet = getSheetOrNull_(sheetName);
    if (!sheet) return null;

    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn();
    if (lastRow < 1 || lastCol < 1) return null;

    raw = sheet.getRange(1, 1, lastRow, lastCol).getValues();
    if (!raw || raw.length < 1) return null;

    // Simpan ke cache untuk request berikutnya
    try {
      Cache_Manager.setSheetData(sheetName, raw);
    } catch (e) {
      console.warn("_readSheetWithCache_: gagal menyimpan ke cache:", e);
    }
  }

  if (!raw || raw.length < 1) return null;

  const headers = raw[0].map(function (h) { return String(h || "").trim(); });
  const rows = raw.slice(1);

  return { headers: headers, rows: rows };
}

// ─── Helper: format Date ke yyyy-MM-dd ───────────────────────────────────────

/**
 * Format nilai tanggal ke string yyyy-MM-dd.
 * @param {*} val
 * @returns {string}
 */
function _formatDateValue_(val) {
  if (!val) return "";
  if (val instanceof Date) {
    const tz = Session.getScriptTimeZone() || "Asia/Jakarta";
    return Utilities.formatDate(val, tz, "yyyy-MM-dd");
  }
  return String(val).trim();
}

function _formatDateTimeValue_(val) {
  if (!val) return "";
  if (val instanceof Date) {
    const tz = Session.getScriptTimeZone() || "Asia/Jakarta";
    return Utilities.formatDate(val, tz, "yyyy-MM-dd HH:mm");
  }
  return String(val).trim();
}

// ─── Helper: parse tanggal dari string yyyy-MM-dd ─────────────────────────────

/**
 * Parse string yyyy-MM-dd menjadi objek Date (UTC midnight).
 * @param {string} str
 * @returns {Date|null}
 */
function _parseDateStr_(str) {
  str = String(str || "").trim();
  if (!str) return null;
  const m = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  return new Date(Date.UTC(parseInt(m[1], 10), parseInt(m[2], 10) - 1, parseInt(m[3], 10)));
}

function _findFirstHeaderIndex_(headers, candidates) {
  candidates = Array.isArray(candidates) ? candidates : [];
  for (var i = 0; i < candidates.length; i++) {
    var idx = headers.indexOf(candidates[i]);
    if (idx !== -1) return idx;
  }
  return -1;
}

function _diffDays_(a, b) {
  const da = _parseDateStr_(_formatDateValue_(a));
  const db = _parseDateStr_(_formatDateValue_(b));
  if (!da || !db) return null;
  return Math.round((db.getTime() - da.getTime()) / 86400000);
}

function _medianNumber_(arr) {
  arr = (arr || []).filter(function(v) { return typeof v === 'number' && !isNaN(v); }).sort(function(a, b) { return a - b; });
  if (!arr.length) return null;
  var mid = Math.floor(arr.length / 2);
  if (arr.length % 2) return arr[mid];
  return Math.round(((arr[mid - 1] + arr[mid]) / 2) * 10) / 10;
}

function _incrementCounter_(bucket, key) {
  key = String(key || "").trim();
  if (!key) return;
  bucket[key] = (bucket[key] || 0) + 1;
}

function _buildTopEntries_(bucket, limit) {
  limit = limit || 10;
  return Object.keys(bucket || {})
    .map(function(key) {
      return { label: key, count: bucket[key] || 0 };
    })
    .sort(function(a, b) {
      if (b.count !== a.count) return b.count - a.count;
      return String(a.label || "").localeCompare(String(b.label || ""));
    })
    .slice(0, limit);
}

function _parseCoordinateNumber_(value) {
  if (value === null || value === undefined) return null;
  var normalized = String(value).trim().replace(',', '.');
  if (!normalized) return null;
  var num = parseFloat(normalized);
  return isNaN(num) ? null : num;
}

function _isValidLatLon_(lat, lon) {
  return typeof lat === 'number' && !isNaN(lat) && typeof lon === 'number' && !isNaN(lon)
    && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
}


function _buildDashboardRecordSummary_(row, idxMap) {
  var kecamatan = idxMap.idxKecamatan !== -1 ? String(row[idxMap.idxKecamatan] || '').trim() : '';
  var kelurahan = idxMap.idxKelurahan !== -1 ? String(row[idxMap.idxKelurahan] || '').trim() : '';
  var rw = idxMap.idxRW !== -1 ? String(row[idxMap.idxRW] || '').trim() : '';
  var rt = idxMap.idxRT !== -1 ? String(row[idxMap.idxRT] || '').trim() : '';
  var lat = idxMap.idxLatitude !== -1 ? _parseCoordinateNumber_(row[idxMap.idxLatitude]) : null;
  var lon = idxMap.idxLongitude !== -1 ? _parseCoordinateNumber_(row[idxMap.idxLongitude]) : null;
  if ((lat === null || lon === null) && idxMap.idxKoordinat !== -1) {
    var rawCoord = String(row[idxMap.idxKoordinat] || '').trim();
    if (rawCoord) {
      var coordParts = rawCoord.split(',');
      if (coordParts.length >= 2) {
        if (lat === null) lat = _parseCoordinateNumber_(coordParts[0]);
        if (lon === null) lon = _parseCoordinateNumber_(coordParts[1]);
      }
    }
  }
  var recordId = idxMap.idxRecordId !== -1 ? String(row[idxMap.idxRecordId] || '').trim() : '';
  var epid = idxMap.idxEpid !== -1 ? String(row[idxMap.idxEpid] || '').trim() : '';
  return {
    recordKey: recordId || epid,
    recordId: recordId,
    epid: epid,
    nama: idxMap.idxNama !== -1 ? String(row[idxMap.idxNama] || '').trim() : '',
    alamat: idxMap.idxAlamat !== -1 ? String(row[idxMap.idxAlamat] || '').trim() : '',
    kecamatan: kecamatan,
    kelurahan: kelurahan,
    rw: rw,
    rt: rt,
    statusVerifikasi: idxMap.idxVerifikasi !== -1 ? String(row[idxMap.idxVerifikasi] || '').trim() : '',
    statusKasus: idxMap.idxStatusKasus !== -1 ? String(row[idxMap.idxStatusKasus] || '').trim() : '',
    inputAt: idxMap.idxTimestamp !== -1 ? _formatDateTimeValue_(row[idxMap.idxTimestamp]) : '',
    updatedAt: idxMap.idxUpdated !== -1 ? _formatDateTimeValue_(row[idxMap.idxUpdated]) : '',
    lat: _isValidLatLon_(lat, lon) ? parseFloat(lat.toFixed(6)) : null,
    lon: _isValidLatLon_(lat, lon) ? parseFloat(lon.toFixed(6)) : null,
    hotspotKey: _isValidLatLon_(lat, lon) ? (lat.toFixed(3) + ',' + lon.toFixed(3)) : ''
  };
}

function _buildWorkflowInboxData_(sess, dx) {
  const role = String((sess.user && sess.user.role) || '').trim().toLowerCase();
  const userUnit = _normalizeWilayahKey_((sess.user && sess.user.unitKerja) || '');
  const userKode = _normalizeWilayahKey_((sess.user && sess.user.kodePuskesmas) || '');
  const dxNorm = String(dx || '').trim().toUpperCase();
  const dxList = (SUPPORTED_DX_ || []).indexOf(dxNorm) !== -1 ? [dxNorm] : (SUPPORTED_DX_ || []).slice();
  const pendingVerification = [];
  const revisionQueue = [];
  const sampleQueue = [];
  const statusQueue = [];
  let totalScopedRecords = 0;
  let verifiedRecords = 0;
  const kelurahanSet = {};
  const dxCounts = {};

  dxList.forEach(function(dxItem) {
    const sheetData = _readSheetWithCache_(dxItem + '_Raw');
    if (!sheetData || !sheetData.headers || !sheetData.rows || !sheetData.rows.length) return;

    const headers = sheetData.headers;
    const rows = sheetData.rows;
    const idxRecordId = headers.indexOf('ID Registrasi Kasus');
    const idxEpid = headers.indexOf('Nomor EPID');
    const idxNama = headers.indexOf('Nama');
    const idxKecamatan = headers.indexOf('Kecamatan');
    const idxKelurahan = headers.indexOf('Kelurahan');
    const idxVerifikasi = headers.indexOf('Status Verifikasi EPID');
    const idxCatatanVerif = headers.indexOf('Catatan Verifikasi EPID');
    const idxTimestamp = headers.indexOf('Timestamp');
    const idxUpdated = headers.indexOf('Updated At');
    const idxPuskesmasPengampu = headers.indexOf('Puskesmas Pengampu');
    const idxKodePuskesmas = headers.indexOf('KodePuskesmas Pengampu') !== -1 ? headers.indexOf('KodePuskesmas Pengampu') : headers.indexOf('KodePuskesmas');
    const idxStatusKasus = headers.indexOf('Status Pasien/Kasus');
    const idxSampelDilakukan = headers.indexOf('Pemeriksaan Sampel Dilakukan');
    const idxInterpretasiSampel = headers.indexOf('Interpretasi Hasil Sampel');
    const specimenFlagIdxs = headers.reduce(function(list, header, idx) {
      const name = String(header || '').trim();
      if (/spesimen/i.test(name) && /(diambil|dikirim)/i.test(name)) list.push(idx);
      return list;
    }, []);

    rows.forEach(function(row) {
      const recordId = idxRecordId !== -1 ? String(row[idxRecordId] || '').trim() : '';
      const epid = idxEpid !== -1 ? String(row[idxEpid] || '').trim() : '';
      const recordKey = recordId || epid;
      if (!recordKey) return;

      const statusVerifikasi = idxVerifikasi !== -1 ? String(row[idxVerifikasi] || '').trim() : '';
      const normalizedStatus = String(statusVerifikasi || 'Pending').trim().toUpperCase();
      const puskesmasPengampu = idxPuskesmasPengampu !== -1 ? _normalizeWilayahKey_(row[idxPuskesmasPengampu]) : '';
      const kodePuskesmas = idxKodePuskesmas !== -1 ? _normalizeWilayahKey_(row[idxKodePuskesmas]) : '';
      const scopeMatch = (userKode && kodePuskesmas && userKode === kodePuskesmas) || (userUnit && puskesmasPengampu && userUnit === puskesmasPengampu);

      const statusKasus = idxStatusKasus !== -1 ? String(row[idxStatusKasus] || '').trim() : '';
      const sampelDilakukan = idxSampelDilakukan !== -1 ? String(row[idxSampelDilakukan] || '').trim() : '';
      const interpretasiSampel = idxInterpretasiSampel !== -1 ? String(row[idxInterpretasiSampel] || '').trim() : '';
      const specimenRequested = specimenFlagIdxs.some(function(idx) {
        return String(row[idx] || '').trim().toUpperCase() === 'YA';
      });
      const normalizedStatusKasus = String(statusKasus || '').trim().toUpperCase();
      const normalizedSampelDilakukan = String(sampelDilakukan || '').trim().toUpperCase();
      const normalizedInterpretasi = String(interpretasiSampel || '').trim().toUpperCase();
      const sampleRelevant = specimenRequested || normalizedStatusKasus === 'MENUNGGU HASIL LAB' || normalizedSampelDilakukan === 'YA';
      const sampleDone = normalizedSampelDilakukan === 'TIDAK' || (normalizedSampelDilakukan === 'YA' && !!normalizedInterpretasi && normalizedInterpretasi !== 'BELUM KELUAR');
      const isFinalStatus = ['DISCARDED', 'SEMBUH', 'MENINGGAL', 'LOST TO FOLLOW-UP', 'LOST TO FOLLOW UP'].indexOf(normalizedStatusKasus) !== -1;
      const sampleStagePending = normalizedStatus === 'TERVERIFIKASI'
        && (role === 'admin' || scopeMatch)
        && sampleRelevant
        && !isFinalStatus
        && !sampleDone;

      const item = {
        dx: dxItem,
        recordKey: recordKey,
        recordId: recordId,
        epid: epid,
        nama: idxNama !== -1 ? String(row[idxNama] || '').trim() : '',
        kecamatan: idxKecamatan !== -1 ? String(row[idxKecamatan] || '').trim() : '',
        kelurahan: idxKelurahan !== -1 ? String(row[idxKelurahan] || '').trim() : '',
        statusVerifikasi: statusVerifikasi || 'Pending',
        statusKasus: statusKasus,
        sampelDilakukan: sampelDilakukan,
        interpretasiSampel: interpretasiSampel,
        catatanVerifikasi: idxCatatanVerif !== -1 ? String(row[idxCatatanVerif] || '').trim() : '',
        inputAt: idxTimestamp !== -1 ? _formatDateTimeValue_(row[idxTimestamp]) : '',
        updatedAt: idxUpdated !== -1 ? _formatDateTimeValue_(row[idxUpdated]) : ''
      };

      if (role === 'admin' || scopeMatch) {
        totalScopedRecords += 1;
        if (normalizedStatus === 'TERVERIFIKASI') verifiedRecords += 1;
        if (item.kelurahan) kelurahanSet[item.kelurahan] = true;
        dxCounts[dxItem] = (dxCounts[dxItem] || 0) + 1;
      }

      if (role === 'admin' && normalizedStatus === 'PENDING') {
        pendingVerification.push(item);
      }
      if (normalizedStatus === 'PERLU REVISI' && (role === 'admin' || scopeMatch)) {
        revisionQueue.push(item);
      }
      if (sampleStagePending) {
        sampleQueue.push(Object.assign({}, item, {
          __queueStatusLabel: normalizedSampelDilakukan === 'YA'
            ? (normalizedInterpretasi === 'BELUM KELUAR' || !normalizedInterpretasi ? 'Menunggu hasil lab' : 'Perlu review hasil sampel')
            : 'Menunggu hasil lab',
          __queueStatusClass: 'is-warning'
        }));
      }
      if (normalizedStatus === 'TERVERIFIKASI' && !isFinalStatus && !sampleStagePending) {
        statusQueue.push(Object.assign({}, item, {
          __queueStatusLabel: statusKasus || 'Siap update status',
          __queueStatusClass: normalizedStatusKasus === 'KONFIRMASI' ? 'is-success' : 'is-warning'
        }));
      }
    });
  });

  function sortQueue(items) {
    return (items || []).sort(function(a, b) {
      const aa = String(a.updatedAt || a.inputAt || '');
      const bb = String(b.updatedAt || b.inputAt || '');
      if (aa === bb) return String(a.nama || '').localeCompare(String(b.nama || ''));
      return aa < bb ? 1 : -1;
    });
  }

  const pendingSorted = sortQueue(pendingVerification);
  const revisionSorted = sortQueue(revisionQueue);
  const sampleSorted = sortQueue(sampleQueue);
  const statusSorted = sortQueue(statusQueue);
  const actionableCount = pendingSorted.length + revisionSorted.length + sampleSorted.length + statusSorted.length;
  const topDx = Object.keys(dxCounts).sort(function(a, b) {
    if ((dxCounts[b] || 0) !== (dxCounts[a] || 0)) return (dxCounts[b] || 0) - (dxCounts[a] || 0);
    return String(a || '').localeCompare(String(b || ''));
  }).map(function(dxKey) {
    return { dx: dxKey, count: dxCounts[dxKey] || 0 };
  });
  return {
    summary: {
      pendingVerification: pendingSorted.length,
      revisionQueue: revisionSorted.length,
      sampleQueue: sampleSorted.length,
      statusQueue: statusSorted.length,
      totalScopedRecords: totalScopedRecords,
      verifiedRecords: verifiedRecords,
      actionableCount: actionableCount,
      activeKelurahanCount: Object.keys(kelurahanSet).length,
      topDx: topDx
    },
    pendingVerification: pendingSorted,
    revisionQueue: revisionSorted,
    sampleQueue: sampleSorted,
    statusQueue: statusSorted
  };
}

function getWorkflowInbox(dx, token) {
  const sess = _getSessionFromToken_(token);
  if (!sess.ok) {
    return { summary: { pendingVerification: 0, revisionQueue: 0, sampleQueue: 0, statusQueue: 0 }, pendingVerification: [], revisionQueue: [], sampleQueue: [], statusQueue: [] };
  }

  try {
    var cache = null;
    try {
      cache = CacheService.getScriptCache();
    } catch (cacheErr) {
      cache = null;
    }

    const role = String((sess.user && sess.user.role) || '').trim().toLowerCase();
    const userUnit = _normalizeWilayahKey_((sess.user && sess.user.unitKerja) || '');
    const userKode = _normalizeWilayahKey_((sess.user && sess.user.kodePuskesmas) || '');
    const dxNorm = String(dx || '').trim().toUpperCase() || 'ALL';
    const cacheKey = ['workflow-inbox', dxNorm, role, userUnit, userKode].join(':');

    if (cache) {
      try {
        const cached = cache.get(cacheKey);
        if (cached) return JSON.parse(cached);
      } catch (readErr) {}
    }

    const result = _buildWorkflowInboxData_(sess, dx);
    const cachedResult = {
      summary: result.summary,
      pendingVerification: (result.pendingVerification || []).slice(0, 8),
      revisionQueue: (result.revisionQueue || []).slice(0, 8),
      sampleQueue: (result.sampleQueue || []).slice(0, 8),
      statusQueue: (result.statusQueue || []).slice(0, 8)
    };

    if (cache) {
      try {
        cache.put(cacheKey, JSON.stringify(cachedResult), 120);
      } catch (writeErr) {}
    }

    return cachedResult;
  } catch (e) {
    console.error('[getWorkflowInbox] Error:', e);
    return {
      summary: { pendingVerification: 0, revisionQueue: 0, sampleQueue: 0, statusQueue: 0 },
      pendingVerification: [],
      revisionQueue: [],
      sampleQueue: [],
      statusQueue: [],
      error: String(e)
    };
  }
}

function getOverviewSummary(token) {
  const sess = _getSessionFromToken_(token);
  if (!sess.ok) {
    return { summary: { pendingVerification: 0, revisionQueue: 0, sampleQueue: 0, statusQueue: 0, totalScopedRecords: 0, verifiedRecords: 0, actionableCount: 0, activeKelurahanCount: 0, topDx: [] }, pendingVerification: [], revisionQueue: [], sampleQueue: [], statusQueue: [] };
  }

  try {
    var cache = null;
    try {
      cache = CacheService.getScriptCache();
    } catch (cacheErr) {
      cache = null;
    }

    const role = String((sess.user && sess.user.role) || '').trim().toLowerCase();
    const userUnit = _normalizeWilayahKey_((sess.user && sess.user.unitKerja) || '');
    const userKode = _normalizeWilayahKey_((sess.user && sess.user.kodePuskesmas) || '');
    const cacheKey = ['overview-summary', role, userUnit, userKode].join(':');

    if (cache) {
      try {
        const cached = cache.get(cacheKey);
        if (cached) return JSON.parse(cached);
      } catch (readErr) {}
    }

    const result = _buildWorkflowInboxData_(sess, '');
    const overviewResult = {
      summary: result.summary,
      pendingVerification: (result.pendingVerification || []).slice(0, 6),
      revisionQueue: (result.revisionQueue || []).slice(0, 6),
      sampleQueue: (result.sampleQueue || []).slice(0, 6),
      statusQueue: (result.statusQueue || []).slice(0, 6)
    };

    if (cache) {
      try {
        cache.put(cacheKey, JSON.stringify(overviewResult), 120);
      } catch (writeErr) {}
    }

    return overviewResult;
  } catch (e) {
    console.error('[getOverviewSummary] Error:', e);
    return {
      summary: { pendingVerification: 0, revisionQueue: 0, sampleQueue: 0, statusQueue: 0, totalScopedRecords: 0, verifiedRecords: 0, actionableCount: 0, activeKelurahanCount: 0, topDx: [] },
      pendingVerification: [],
      revisionQueue: [],
      sampleQueue: [],
      statusQueue: [],
      error: String(e)
    };
  }
}

function _matchesDashboardDrilldown_(record, type, key) {
  var normalizedType = String(type || '').trim().toLowerCase();
  var rawKey = String(key || '').trim();
  if (!normalizedType || !rawKey) return false;
  if (normalizedType === 'kecamatan') {
    return String(record.kecamatan || '') === rawKey;
  }
  if (normalizedType === 'kelurahan') {
    return [record.kecamatan, record.kelurahan].filter(Boolean).join(' / ') === rawKey;
  }
  if (normalizedType === 'rw') {
    return [record.kecamatan, record.kelurahan, record.rw ? ('RW ' + record.rw) : ''].filter(Boolean).join(' / ') === rawKey;
  }
  if (normalizedType === 'rtrw') {
    return [record.kecamatan, record.kelurahan, record.rw ? ('RW ' + record.rw) : '', record.rt ? ('RT ' + record.rt) : ''].filter(Boolean).join(' / ') === rawKey;
  }
  if (normalizedType === 'hotspot') {
    return String(record.hotspotKey || '') === rawKey;
  }
  return false;
}

// ─── Helper: escape nilai CSV (RFC 4180) ─────────────────────────────────────

/**
 * Bungkus nilai CSV dengan kutip ganda jika mengandung koma, newline, atau kutip ganda.
 * Req 7.4: nilai dengan koma/newline dibungkus kutip ganda.
 * @param {*} val
 * @returns {string}
 */
function _escapeCsvValue_(val) {
  if (val === null || val === undefined) return "";
  const str = String(val);
  // Jika mengandung koma, newline, atau kutip ganda → bungkus dengan kutip ganda
  if (str.indexOf(",") !== -1 || str.indexOf("\n") !== -1 || str.indexOf("\r") !== -1 || str.indexOf('"') !== -1) {
    // Escape kutip ganda di dalam nilai dengan menggandakannya
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

// ─── getDashboardStats ────────────────────────────────────────────────────────

/**
 * Hitung statistik dashboard untuk DX dan tahun tertentu.
 * Req 6.1: total kasus per DX
 * Req 6.2: distribusi per kecamatan
 * Req 6.3: distribusi per bulan
 * Req 6.4: filter berdasarkan kolom "Tanggal Pelacakan"
 * Req 6.5: fungsi backend yang mengembalikan agregasi (bukan raw data)
 * Req 6.7: statusNotifikasi dan statusSinkronisasi tersedia jika kolom status ada
 * Req 6.8: gunakan Cache_Manager
 *
 * @param {string} dx - Kode penyakit (MR, DIF, PERT, TN, AFP)
 * @param {number|string} tahun - Tahun filter (contoh: 2025)
 * @param {string} token - Token sesi
 * @returns {{
 *   totalKasus: number,
 *   perKecamatan: Object,
 *   perBulan: Object,
 *   statusNotifikasi: {sent: number, failed: number, pending: number}|null,
 *   statusSinkronisasi: {synced: number, failed: number, pending: number}|null
 * } | {status: string, message: string}}
 */
function getDashboardStats(dx, tahun, token) {
  // Validasi sesi
  const sess = _getSessionFromToken_(token);
  if (!sess.ok) {
    return { status: "error", message: sess.message || "Sesi tidak valid." };
  }

  try {
    dx = String(dx || "").trim().toUpperCase();
    if (SUPPORTED_DX_.indexOf(dx) === -1) {
      return { status: "error", message: "DX tidak didukung: " + dx };
    }

    const tahunNum = parseInt(tahun, 10);
    const filterTahun = !isNaN(tahunNum) && tahunNum > 0;

    const sheetName = dx + "_Raw";
    const sheetData = _readSheetWithCache_(sheetName);

    // Jika sheet tidak ada atau kosong, kembalikan statistik kosong
    if (!sheetData) {
      return {
        totalKasus: 0,
        perKecamatan: {},
        perKelurahan: {},
        perRw: {},
        perRtRw: {},
        perBulan: {},
        perStatusKasus: {},
        qualityCards: { pendingVerification: 0, waitingSampleResult: 0, confirmed: 0, discarded: 0, clinical: 0 },
        epidemiology: { medianReportToTrackingDays: null, sameDayReportTrackingRate: null, medianOnsetToReportDays: null, workflowCompletenessRate: null },
        wilayahSummary: { kecamatanCount: 0, kelurahanCount: 0, rwCount: 0, rtRwCount: 0, topKecamatan: [], topKelurahan: [], topRw: [], topRtRw: [] },
        coordinateSummary: { totalWithCoordinates: 0, missingCoordinates: 0, clusteredPointCount: 0, topHotspots: [], points: [] },
        perKelompokUmur: {},
        perJenisKelamin: {},
        verificationQueue: { counts: { pending: 0, perluRevisi: 0, terverifikasi: 0 }, pending: [], perluRevisi: [], terverifikasi: [] },
        statusNotifikasi: dx === "MR" ? { sent: 0, failed: 0, pending: 0 } : null,
        statusSinkronisasi: dx === "MR" ? { synced: 0, failed: 0, pending: 0 } : null
      };
    }

    const { headers, rows } = sheetData;

    // Indeks kolom yang dibutuhkan
    const idxTglPelacakan = headers.indexOf("Tanggal Pelacakan");
    const idxTglTerima = headers.indexOf("Tanggal terima laporan");
    const idxTglOnset = _findFirstHeaderIndex_(headers, [
      "Tanggal mulai sakit",
      "Tanggal mulai demam",
      "Tanggal mulai batuk",
      "Tgl mulai lumpuh",
      "Tanggal mulai sakit/gejala awal",
      "Tanggal mulai sakit/gejala awal sebelum lumpuh"
    ]);
    const idxKecamatan = headers.indexOf("Kecamatan");
    const idxRT = headers.indexOf("RT");
    const idxRW = headers.indexOf("RW");
    const idxKelompokUmur = headers.indexOf("Kelompok Umur Epidemiologis");
    const idxJK = headers.indexOf("JK");
    const idxStatusNotif = headers.indexOf("Status Notifikasi Telegram");
    const idxStatusSync = headers.indexOf("Status Sinkronisasi Pengampu");
    const idxStatusKasus = headers.indexOf("Status Pasien/Kasus");
    const idxVerifikasi = headers.indexOf("Status Verifikasi EPID");
    const idxSampelDilakukan = headers.indexOf("Pemeriksaan Sampel Dilakukan");
    const idxInterpretasiSampel = headers.indexOf("Interpretasi Hasil Sampel");
    const idxRecordId = headers.indexOf("ID Registrasi Kasus");
    const idxEpid = headers.indexOf("Nomor EPID");
    const idxNama = headers.indexOf("Nama");
    const idxKelurahan = headers.indexOf("Kelurahan");
    const idxLatitude = headers.indexOf("Latitude");
    const idxLongitude = headers.indexOf("Longitude");
    const idxKoordinat = headers.indexOf("Koordinat (lat,lon)");
    const idxPuskesmasPengampu = headers.indexOf("Puskesmas Pengampu");
    const idxCatatanVerif = headers.indexOf("Catatan Verifikasi EPID");
    const idxUpdated = headers.indexOf("Updated At");
    const idxTimestamp = headers.indexOf("Timestamp");

    // Hasil agregasi
    let totalKasus = 0;
    const perKecamatan = {};
    const perKelurahan = {};
    const perRw = {};
    const perRtRw = {};
    const perBulan = {};
    const perStatusKasus = {};
    const perKelompokUmur = {};
    const perJenisKelamin = {};
    const qualityCards = {
      pendingVerification: 0,
      waitingSampleResult: 0,
      confirmed: 0,
      discarded: 0,
      clinical: 0
    };
    const lagsReportToTracking = [];
    const lagsOnsetToReport = [];
    let sameDayReportTracking = 0;
    let completenessWorkflowFilled = 0;
    const statusNotifikasi = idxStatusNotif !== -1 ? { sent: 0, failed: 0, pending: 0 } : null;
    const statusSinkronisasi = idxStatusSync !== -1 ? { synced: 0, failed: 0, pending: 0 } : null;
    const isAdmin = String((sess.user && sess.user.role) || "").trim().toLowerCase() === "admin";
    const verificationQueue = { counts: { pending: 0, perluRevisi: 0, terverifikasi: 0 }, pending: [], perluRevisi: [], terverifikasi: [] };
    const coordinateBuckets = {};
    let coordinateMissing = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];

      // Req 6.4: filter berdasarkan kolom "Tanggal Pelacakan"
      if (filterTahun && idxTglPelacakan !== -1) {
        const tglRaw = row[idxTglPelacakan];
        const tglStr = _formatDateValue_(tglRaw);
        if (!tglStr) continue; // skip baris tanpa tanggal pelacakan

        // Ambil tahun dari string yyyy-MM-dd
        const rowTahun = parseInt(tglStr.substring(0, 4), 10);
        if (rowTahun !== tahunNum) continue;
      }

      totalKasus++;

      // Req 6.3: distribusi per bulan (key format YYYYMM)
      if (idxTglPelacakan !== -1) {
        const tglRaw = row[idxTglPelacakan];
        const tglStr = _formatDateValue_(tglRaw);
        if (tglStr && tglStr.length >= 7) {
          // Format: "2025-01-15" → key "202501"
          const bulanKey = tglStr.substring(0, 4) + tglStr.substring(5, 7);
          perBulan[bulanKey] = (perBulan[bulanKey] || 0) + 1;
        }
      }

      const kecamatan = idxKecamatan !== -1 ? String(row[idxKecamatan] || "").trim() : "";
      const kelurahan = idxKelurahan !== -1 ? String(row[idxKelurahan] || "").trim() : "";
      const rw = idxRW !== -1 ? String(row[idxRW] || "").trim() : "";
      const rt = idxRT !== -1 ? String(row[idxRT] || "").trim() : "";

      // Req 6.2: distribusi per kecamatan
      _incrementCounter_(perKecamatan, kecamatan);
      if (kelurahan) {
        _incrementCounter_(perKelurahan, (kecamatan ? kecamatan + ' / ' : '') + kelurahan);
      }
      if (rw) {
        _incrementCounter_(perRw, [kecamatan, kelurahan, 'RW ' + rw].filter(Boolean).join(' / '));
      }
      if (rw && rt) {
        _incrementCounter_(perRtRw, [kecamatan, kelurahan, 'RW ' + rw, 'RT ' + rt].filter(Boolean).join(' / '));
      }

      var lat = idxLatitude !== -1 ? _parseCoordinateNumber_(row[idxLatitude]) : null;
      var lon = idxLongitude !== -1 ? _parseCoordinateNumber_(row[idxLongitude]) : null;
      if ((lat === null || lon === null) && idxKoordinat !== -1) {
        var rawCoord = String(row[idxKoordinat] || '').trim();
        if (rawCoord) {
          var coordParts = rawCoord.split(',');
          if (coordParts.length >= 2) {
            if (lat === null) lat = _parseCoordinateNumber_(coordParts[0]);
            if (lon === null) lon = _parseCoordinateNumber_(coordParts[1]);
          }
        }
      }
      if (_isValidLatLon_(lat, lon)) {
        var hotspotKey = lat.toFixed(3) + ',' + lon.toFixed(3);
        if (!coordinateBuckets[hotspotKey]) {
          coordinateBuckets[hotspotKey] = {
            lat: parseFloat(lat.toFixed(6)),
            lon: parseFloat(lon.toFixed(6)),
            count: 0,
            kecamatan: kecamatan,
            kelurahan: kelurahan,
            labels: {}
          };
        }
        coordinateBuckets[hotspotKey].count++;
        coordinateBuckets[hotspotKey].kecamatan = coordinateBuckets[hotspotKey].kecamatan || kecamatan;
        coordinateBuckets[hotspotKey].kelurahan = coordinateBuckets[hotspotKey].kelurahan || kelurahan;
        if (kelurahan) coordinateBuckets[hotspotKey].labels[kelurahan] = (coordinateBuckets[hotspotKey].labels[kelurahan] || 0) + 1;
      } else {
        coordinateMissing++;
      }

      if (idxKelompokUmur !== -1) {
        const kelompok = String(row[idxKelompokUmur] || "").trim() || "Tidak diketahui";
        perKelompokUmur[kelompok] = (perKelompokUmur[kelompok] || 0) + 1;
      }

      if (idxJK !== -1) {
        const jk = String(row[idxJK] || "").trim() || "Tidak diketahui";
        perJenisKelamin[jk] = (perJenisKelamin[jk] || 0) + 1;
      }

      let statusKasus = "Belum ditentukan";
      if (idxStatusKasus !== -1) {
        statusKasus = String(row[idxStatusKasus] || "").trim() || "Belum ditentukan";
        perStatusKasus[statusKasus] = (perStatusKasus[statusKasus] || 0) + 1;
      }

      const statusKasusUpper = String(statusKasus || "").trim().toUpperCase();
      if (statusKasusUpper === "KONFIRMASI") qualityCards.confirmed++;
      if (statusKasusUpper === "DISCARDED") qualityCards.discarded++;
      if (statusKasusUpper === "KLINIS") qualityCards.clinical++;

      const lagReportTracking = (idxTglTerima !== -1 && idxTglPelacakan !== -1) ? _diffDays_(row[idxTglTerima], row[idxTglPelacakan]) : null;
      if (lagReportTracking !== null && lagReportTracking >= 0) {
        lagsReportToTracking.push(lagReportTracking);
        if (lagReportTracking === 0) sameDayReportTracking++;
      }

      const lagOnsetReport = (idxTglOnset !== -1 && idxTglTerima !== -1) ? _diffDays_(row[idxTglOnset], row[idxTglTerima]) : null;
      if (lagOnsetReport !== null && lagOnsetReport >= 0) {
        lagsOnsetToReport.push(lagOnsetReport);
      }

      if (idxVerifikasi !== -1) {
        const verif = String(row[idxVerifikasi] || "").trim().toUpperCase();
        if (!verif || verif === "BELUM DIVERIFIKASI" || verif === "MENUNGGU VERIFIKASI") {
          qualityCards.pendingVerification++;
        }
      }

      if (idxSampelDilakukan !== -1) {
        const sampel = String(row[idxSampelDilakukan] || "").trim().toUpperCase();
        const interpretasi = idxInterpretasiSampel !== -1 ? String(row[idxInterpretasiSampel] || "").trim().toUpperCase() : "";
        if (sampel === "YA" && (!interpretasi || interpretasi === "BELUM KELUAR")) {
          qualityCards.waitingSampleResult++;
        }
      }

      var workflowFieldsPresent = 0;
      if (statusKasus && statusKasus !== "Belum ditentukan") workflowFieldsPresent++;
      if (idxVerifikasi !== -1 && String(row[idxVerifikasi] || "").trim()) workflowFieldsPresent++;
      if (idxSampelDilakukan !== -1 && String(row[idxSampelDilakukan] || "").trim()) workflowFieldsPresent++;
      completenessWorkflowFilled += workflowFieldsPresent;

      if (isAdmin) {
        const rawVerificationStatus = idxVerifikasi !== -1 ? String(row[idxVerifikasi] || "").trim() : "";
        const verificationStatus = rawVerificationStatus || "Pending";
        const normalizedVerification = verificationStatus.toUpperCase();
        const recordId = idxRecordId !== -1 ? String(row[idxRecordId] || "").trim() : "";
        const epid = idxEpid !== -1 ? String(row[idxEpid] || "").trim() : "";
        const recordKey = recordId || epid;
        if (recordKey) {
          const inputAt = idxTimestamp !== -1 ? _formatDateTimeValue_(row[idxTimestamp]) : "";
          const updatedAt = idxUpdated !== -1 ? _formatDateTimeValue_(row[idxUpdated]) : "";
          const queueItem = {
            recordKey: recordKey,
            recordId: recordId,
            epid: epid,
            nama: idxNama !== -1 ? String(row[idxNama] || "").trim() : "",
            puskesmas: idxPuskesmasPengampu !== -1 ? String(row[idxPuskesmasPengampu] || "").trim() : "",
            kecamatan: kecamatan,
            kelurahan: kelurahan,
            statusVerifikasi: verificationStatus,
            catatanVerifikasi: idxCatatanVerif !== -1 ? String(row[idxCatatanVerif] || "").trim() : "",
            inputAt: inputAt,
            updatedAt: updatedAt
          };

          if (!normalizedVerification || normalizedVerification === "PENDING") {
            verificationQueue.pending.push(queueItem);
          } else if (normalizedVerification === "PERLU REVISI") {
            verificationQueue.perluRevisi.push(queueItem);
          } else if (normalizedVerification === "TERVERIFIKASI") {
            verificationQueue.terverifikasi.push(queueItem);
          }
        }
      }

      // Status notifikasi/sinkronisasi dihitung jika kolom tersedia
      if (idxStatusNotif !== -1 && statusNotifikasi) {
        const statusN = String(row[idxStatusNotif] || "").trim().toUpperCase();
        if (statusN === "SENT") {
          statusNotifikasi.sent++;
        } else if (statusN === "FAILED") {
          statusNotifikasi.failed++;
        } else {
          // PENDING atau kosong
          statusNotifikasi.pending++;
        }
      }

      if (idxStatusSync !== -1 && statusSinkronisasi) {
        const statusS = String(row[idxStatusSync] || "").trim().toUpperCase();
        if (statusS === "SYNCED") {
          statusSinkronisasi.synced++;
        } else if (statusS === "FAILED") {
          statusSinkronisasi.failed++;
        } else {
          // PENDING atau kosong
          statusSinkronisasi.pending++;
        }
      }
    }

    ["pending", "perluRevisi", "terverifikasi"].forEach(function(key) {
      verificationQueue[key].sort(function(a, b) {
        const aa = String(a.updatedAt || a.inputAt || "");
        const bb = String(b.updatedAt || b.inputAt || "");
        if (aa === bb) return String(a.nama || "").localeCompare(String(b.nama || ""));
        return aa < bb ? 1 : -1;
      });
      verificationQueue.counts[key] = verificationQueue[key].length;
      verificationQueue[key] = verificationQueue[key].slice(0, 200);
    });

    const wilayahSummary = {
      kecamatanCount: Object.keys(perKecamatan).length,
      kelurahanCount: Object.keys(perKelurahan).length,
      rwCount: Object.keys(perRw).length,
      rtRwCount: Object.keys(perRtRw).length,
      topKecamatan: _buildTopEntries_(perKecamatan, 10),
      topKelurahan: _buildTopEntries_(perKelurahan, 10),
      topRw: _buildTopEntries_(perRw, 10),
      topRtRw: _buildTopEntries_(perRtRw, 10)
    };

    const hotspotPoints = Object.keys(coordinateBuckets).map(function(key) {
      var item = coordinateBuckets[key];
      var topLabel = Object.keys(item.labels || {}).sort(function(a, b) {
        var diff = (item.labels[b] || 0) - (item.labels[a] || 0);
        if (diff) return diff;
        return String(a || '').localeCompare(String(b || ''));
      })[0] || item.kelurahan || item.kecamatan || 'Titik koordinat';
      return {
        key: key,
        lat: item.lat,
        lon: item.lon,
        count: item.count,
        kecamatan: item.kecamatan || '',
        kelurahan: item.kelurahan || '',
        label: topLabel
      };
    }).sort(function(a, b) {
      if (b.count !== a.count) return b.count - a.count;
      return String(a.label || '').localeCompare(String(b.label || ''));
    });

    const coordinateSummary = {
      totalWithCoordinates: hotspotPoints.reduce(function(sum, item) { return sum + (item.count || 0); }, 0),
      missingCoordinates: coordinateMissing,
      clusteredPointCount: hotspotPoints.length,
      topHotspots: hotspotPoints.slice(0, 10).map(function(item) {
        return {
          key: item.key,
          label: [item.kecamatan, item.kelurahan].filter(Boolean).join(' / ') || item.label,
          count: item.count,
          lat: item.lat,
          lon: item.lon
        };
      }),
      points: hotspotPoints.slice(0, 500)
    };

    return {
      totalKasus: totalKasus,
      perKecamatan: perKecamatan,
      perKelurahan: perKelurahan,
      perRw: perRw,
      perRtRw: perRtRw,
      perBulan: perBulan,
      perStatusKasus: perStatusKasus,
      perKelompokUmur: perKelompokUmur,
      perJenisKelamin: perJenisKelamin,
      qualityCards: qualityCards,
      wilayahSummary: wilayahSummary,
      coordinateSummary: coordinateSummary,
      verificationQueue: verificationQueue,
      epidemiology: {
        medianReportToTrackingDays: _medianNumber_(lagsReportToTracking),
        sameDayReportTrackingRate: lagsReportToTracking.length ? Math.round((sameDayReportTracking / lagsReportToTracking.length) * 100) : null,
        medianOnsetToReportDays: _medianNumber_(lagsOnsetToReport),
        workflowCompletenessRate: totalKasus ? Math.round((completenessWorkflowFilled / (totalKasus * 3)) * 100) : null
      },
      statusNotifikasi: statusNotifikasi,
      statusSinkronisasi: statusSinkronisasi
    };

  } catch (e) {
    console.error("[getDashboardStats] Error:", e);
    return { status: "error", message: String(e) };
  }
}

function getDashboardDrilldown(dx, tahun, drilldown, token) {
  const sess = _getSessionFromToken_(token);
  if (!sess.ok) {
    return { status: 'error', message: sess.message || 'Sesi tidak valid.' };
  }

  try {
    dx = String(dx || '').trim().toUpperCase();
    if (SUPPORTED_DX_.indexOf(dx) === -1) {
      return { status: 'error', message: 'DX tidak didukung: ' + dx };
    }

    const type = String(drilldown && drilldown.type || '').trim().toLowerCase();
    const key = String(drilldown && drilldown.key || '').trim();
    const label = String(drilldown && drilldown.label || key || '').trim();
    if (!type || !key) {
      return { status: 'error', message: 'Filter drilldown tidak lengkap.' };
    }

    const tahunNum = parseInt(tahun, 10);
    const filterTahun = !isNaN(tahunNum) && tahunNum > 0;
    const sheetData = _readSheetWithCache_(dx + '_Raw');
    if (!sheetData) {
      return { status: 'ok', label: label, total: 0, items: [] };
    }

    const headers = sheetData.headers;
    const rows = sheetData.rows;
    const idxMap = {
      idxTglPelacakan: headers.indexOf('Tanggal Pelacakan'),
      idxKecamatan: headers.indexOf('Kecamatan'),
      idxKelurahan: headers.indexOf('Kelurahan'),
      idxRW: headers.indexOf('RW'),
      idxRT: headers.indexOf('RT'),
      idxLatitude: headers.indexOf('Latitude'),
      idxLongitude: headers.indexOf('Longitude'),
      idxKoordinat: headers.indexOf('Koordinat (lat,lon)'),
      idxRecordId: headers.indexOf('ID Registrasi Kasus'),
      idxEpid: headers.indexOf('Nomor EPID'),
      idxNama: headers.indexOf('Nama'),
      idxAlamat: headers.indexOf('Alamat lengkap'),
      idxVerifikasi: headers.indexOf('Status Verifikasi EPID'),
      idxStatusKasus: headers.indexOf('Status Pasien/Kasus'),
      idxTimestamp: headers.indexOf('Timestamp'),
      idxUpdated: headers.indexOf('Updated At')
    };

    const matches = [];
    for (var i = 0; i < rows.length; i++) {
      var row = rows[i];
      if (filterTahun && idxMap.idxTglPelacakan !== -1) {
        var tglStr = _formatDateValue_(row[idxMap.idxTglPelacakan]);
        if (!tglStr) continue;
        var rowTahun = parseInt(tglStr.substring(0, 4), 10);
        if (rowTahun !== tahunNum) continue;
      }
      var record = _buildDashboardRecordSummary_(row, idxMap);
      if (!record.recordKey) continue;
      if (_matchesDashboardDrilldown_(record, type, key)) {
        matches.push(record);
      }
    }

    matches.sort(function(a, b) {
      var aa = String(a.updatedAt || a.inputAt || '');
      var bb = String(b.updatedAt || b.inputAt || '');
      if (aa === bb) return String(a.nama || '').localeCompare(String(b.nama || ''));
      return aa < bb ? 1 : -1;
    });

    return {
      status: 'ok',
      type: type,
      key: key,
      label: label,
      total: matches.length,
      items: matches.slice(0, 100)
    };
  } catch (e) {
    console.error('[getDashboardDrilldown] Error:', e);
    return { status: 'error', message: String(e) };
  }
}

// ─── exportToCsv ─────────────────────────────────────────────────────────────

/**
 * Export data kasus ke format CSV.
 * Req 7.1: kembalikan string CSV dari data Raw_Sheet
 * Req 7.2: tolak role viewer
 * Req 7.3: filter berdasarkan rentang tanggal pelacakan
 * Req 7.4: header baris pertama, nilai dipisahkan koma, nilai dengan koma/newline dibungkus kutip ganda
 * Req 7.6: nilai tanggal diformat yyyy-MM-dd
 *
 * @param {string} dx - Kode penyakit
 * @param {{tanggalMulai?: string, tanggalAkhir?: string}} filters - Filter tanggal
 * @param {string} token - Token sesi
 * @returns {string | {status: string, message: string}}
 */
function exportToCsv(dx, filters, token) {
  // Validasi sesi
  const sess = _getSessionFromToken_(token);
  if (!sess.ok) {
    return { status: "error", message: sess.message || "Sesi tidak valid." };
  }

  // Req 7.2: tolak role viewer
  const role = String((sess.user && sess.user.role) || "").trim().toLowerCase();
  if (role === "viewer") {
    return { status: "error", message: "Akses ditolak." };
  }

  try {
    dx = String(dx || "").trim().toUpperCase();
    if (SUPPORTED_DX_.indexOf(dx) === -1) {
      return { status: "error", message: "DX tidak didukung: " + dx };
    }

    const f = filters || {};
    const tglMulaiStr = String(f.tanggalMulai || "").trim();
    const tglAkhirStr = String(f.tanggalAkhir || "").trim();
    const tglMulai = _parseDateStr_(tglMulaiStr);
    const tglAkhir = _parseDateStr_(tglAkhirStr);

    const sheetName = dx + "_Raw";
    const sheetData = _readSheetWithCache_(sheetName);

    if (!sheetData) {
      // Sheet tidak ada: kembalikan CSV kosong dengan header kosong
      return "";
    }

    const { headers, rows } = sheetData;
    const tz = Session.getScriptTimeZone() || "Asia/Jakarta";

    // Indeks kolom "Tanggal Pelacakan" untuk filter
    const idxTglPelacakan = headers.indexOf("Tanggal Pelacakan");

    // Baris header CSV
    const csvLines = [];
    csvLines.push(headers.map(_escapeCsvValue_).join(","));

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];

      // Req 7.3: filter berdasarkan rentang tanggal pelacakan
      if ((tglMulai || tglAkhir) && idxTglPelacakan !== -1) {
        const tglRaw = row[idxTglPelacakan];
        const tglStr = _formatDateValue_(tglRaw);
        const tglRow = _parseDateStr_(tglStr);

        if (tglRow) {
          if (tglMulai && tglRow < tglMulai) continue;
          if (tglAkhir && tglRow > tglAkhir) continue;
        } else if (tglMulai || tglAkhir) {
          // Baris tanpa tanggal pelacakan dilewati jika ada filter tanggal
          continue;
        }
      }

      // Req 7.6: format nilai tanggal ke yyyy-MM-dd
      const csvRow = headers.map(function (h, idx) {
        const val = row[idx];
        let formatted;
        if (val instanceof Date) {
          formatted = Utilities.formatDate(val, tz, "yyyy-MM-dd");
        } else {
          formatted = val;
        }
        return _escapeCsvValue_(formatted);
      });

      csvLines.push(csvRow.join(","));
    }

    return csvLines.join("\n");

  } catch (e) {
    console.error("[exportToCsv] Error:", e);
    return { status: "error", message: String(e) };
  }
}
