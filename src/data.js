/**
 * data.js — Data layer untuk PD3I Surveillance
 * Berisi fungsi akses data, EPID lookup, serializer, pagination, dan duplicate checker.
 */

// ─── Indeks in-memory per sheet (Req 2.1, 2.2, 2.3, 2.4) ───────────────────
// Map<sheetId, Map<epidValue, rowIndex>>
const _epidIndex_ = {};

/**
 * Bangun atau kembalikan indeks EPID untuk sheet tertentu.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet
 * @param {number} columnIndex - 1-based kolom EPID
 * @returns {Map<string, number>}
 */
function _getOrBuildEpidIndex_(sheet, columnIndex) {
  const sheetId = sheet.getSheetId();
  if (_epidIndex_[sheetId]) return _epidIndex_[sheetId];

  const lastRow = sheet.getLastRow();
  const map = new Map();
  if (lastRow >= 2) {
    const vals = sheet.getRange(2, columnIndex, lastRow - 1, 1).getValues();
    for (let i = 0; i < vals.length; i++) {
      const v = String(vals[i][0] || "").trim();
      if (v) map.set(v, i + 2);
    }
  }
  _epidIndex_[sheetId] = map;
  return map;
}

/**
 * Perbarui indeks setelah operasi tulis (Req 2.3).
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet
 * @param {string} epidValue
 * @param {number} rowIndex
 */
function _updateEpidIndex_(sheet, epidValue, rowIndex) {
  const sheetId = sheet.getSheetId();
  if (!_epidIndex_[sheetId]) return; // belum dibangun, biarkan dibangun saat diperlukan
  _epidIndex_[sheetId].set(String(epidValue || "").trim(), rowIndex);
}

// ─── findRowByColumnValue_ (Req 2.1–2.4) ────────────────────────────────────

/**
 * Cari baris berdasarkan nilai kolom. Menggunakan indeks in-memory untuk kolom EPID.
 * Req 2.4: kembalikan -1 dan console.warn jika kolom tidak ada.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet
 * @param {number} columnIndex - 1-based
 * @param {string} targetValue
 * @returns {number} row index (1-based) atau -1
 */
function findRowByColumnValue_(sheet, columnIndex, targetValue) {
  if (!sheet || columnIndex < 1) {
    console.warn("findRowByColumnValue_: sheet atau columnIndex tidak valid.");
    return -1;
  }

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return -1;

  // Cek apakah kolom ini adalah kolom EPID (kolom pertama yang biasa diindeks)
  // Gunakan indeks in-memory jika tersedia
  const sheetId = sheet.getSheetId();
  if (_epidIndex_[sheetId]) {
    const map = _epidIndex_[sheetId];
    const result = map.get(String(targetValue || "").trim());
    return result !== undefined ? result : -1;
  }

  // Fallback: baca kolom langsung
  const colVals = sheet.getRange(2, columnIndex, lastRow - 1, 1).getValues();
  for (let i = 0; i < colVals.length; i++) {
    if (String(colVals[i][0] || "").trim() === String(targetValue || "").trim()) {
      return i + 2;
    }
  }
  return -1;
}

// ─── serializeRecord_ & deserializeRecord_ (Req 16.1–16.4, 16.6) ────────────

/** Kolom yang berisi data tabel dinamis (JSON array/object). */
const DYNAMIC_TABLE_COLUMNS_ = ["Riwayat Imunisasi", "Kontak Erat", "KontakEratJSON"];

/**
 * Serialize record sebelum disimpan ke sheet.
 * - Format semua nilai Date ke yyyy-MM-dd (Req 16.1)
 * - Serialize objek/array ke JSON string (Req 16.3)
 * @param {Object} record - key-value pasangan header → nilai
 * @param {string[]} headers
 * @returns {Object} record yang sudah di-serialize
 */
function serializeRecord_(record, headers) {
  const tz = Session.getScriptTimeZone() || "Asia/Jakarta";
  const result = {};
  (headers || []).forEach(function (h) {
    if (!h) return;
    let val = record[h];
    if (val instanceof Date) {
      // Req 16.1: format Date ke yyyy-MM-dd
      val = Utilities.formatDate(val, tz, "yyyy-MM-dd");
    } else if (val !== null && val !== undefined && typeof val === "object") {
      // Req 16.3: serialize objek/array ke JSON string
      try {
        val = JSON.stringify(val);
      } catch (e) {
        val = "";
      }
    }
    result[h] = val;
  });
  return result;
}

/**
 * Deserialize baris dari sheet menjadi objek record.
 * - Konversi Date object dari Sheets ke yyyy-MM-dd (Req 16.2)
 * - Parse JSON string untuk kolom tabel dinamis (Req 16.4)
 * - Kembalikan array kosong jika JSON tidak valid (Req 16.6)
 * @param {Array} row - array nilai dari sheet (satu baris)
 * @param {string[]} headers
 * @returns {Object}
 */
function deserializeRecord_(row, headers) {
  const tz = Session.getScriptTimeZone() || "Asia/Jakarta";
  const result = {};
  (headers || []).forEach(function (h, idx) {
    if (!h) return;
    let val = row[idx];
    if (val instanceof Date) {
      // Req 16.2: konversi Date object ke yyyy-MM-dd
      val = Utilities.formatDate(val, tz, "yyyy-MM-dd");
    } else if (DYNAMIC_TABLE_COLUMNS_.indexOf(h) !== -1 && typeof val === "string" && val.trim()) {
      // Req 16.4 & 16.6: parse JSON untuk kolom tabel dinamis
      try {
        val = JSON.parse(val);
      } catch (e) {
        console.warn("deserializeRecord_: JSON tidak valid untuk kolom '" + h + "', kembalikan array kosong.");
        val = [];
      }
    }
    result[h] = val;
  });
  return result;
}

// ─── _applyHeaderAliases_ ────────────────────────────────────────────────────

function _applyHeaderAliases_(dx, data, headers) {
  dx = String(dx || "").trim().toUpperCase();
  data = data || {};
  headers = Array.isArray(headers) ? headers : [];

  function putIfMissing(targetHeader, sourceKeys) {
    if (!targetHeader || !headers.includes(targetHeader)) return;
    const current = data[targetHeader];
    if (current !== undefined && String(current).trim() !== "") return;
    for (const key of sourceKeys) {
      const val = data[key];
      if (val !== undefined && String(val).trim() !== "") {
        data[targetHeader] = val;
        return;
      }
    }
  }

  putIfMissing("Nama Orang Tua/Wali", ["Nama orang tua/wali"]);
  putIfMissing("No Telp/WA Orang Tua/Wali", ["No. kontak orang tua/wali"]);
  putIfMissing("Petugas", ["Nama Petugas"]);
  putIfMissing("Tanggal Mulai Demam", ["Tanggal mulai demam"]);
  putIfMissing("Tanggal Mulai Ruam", ["Tanggal mulai ruam"]);
  putIfMissing("Mata Merah", ["Mata merah"]);

  if (headers.includes("Demam?") && (data["Demam?"] === undefined || String(data["Demam?"]).trim() === "")) {
    data["Demam?"] = String(data["Tanggal mulai demam"] || "").trim() ? "Ya" : "Tidak";
  }
  if (headers.includes("Ruam Makulopapular?") && (data["Ruam Makulopapular?"] === undefined || String(data["Ruam Makulopapular?"]).trim() === "")) {
    data["Ruam Makulopapular?"] = String(data["Tanggal mulai ruam"] || "").trim() ? "Ya" : "Tidak";
  }
  putIfMissing("Umur Kehamilan", ["Umur kehamilan"]);
  putIfMissing("Gejala Lain", ["Gejala lain"]);
  putIfMissing("Sebutkan Gejala Lain", ["Sebutkan gejala lain"]);
  putIfMissing("Komp_Diare", ["Diare"]);
  putIfMissing("Komp_Bronchopneumonia", ["Bronchopneumonia"]);
  putIfMissing("Komp_Kebutaan", ["Kebutaan"]);
  putIfMissing("Komp_Otitis Media", ["Otitis media"]);
  putIfMissing("Komp_Pneumonia", ["Pneumonia"]);
  putIfMissing("Komp_Encephalitis", ["Encephalitis"]);
  putIfMissing("Komp_Malnutrisi", ["Malnutrisi"]);
  putIfMissing("Komp_Ulkus Mukosa Mulut", ["Ulkus mukosa mulut"]);
  putIfMissing("Komp_Lainnya", ["Lainnya komplikasi"]);
  putIfMissing("Komp_Lainnya_Sebutkan", ["Sebutkan komplikasi lain"]);
  putIfMissing("Rawat inap?", ["Apakah dirawat inap?"]);
  putIfMissing("Ada kasus sekitar?", ["Ada kasus serupa di lingkungan"]);
  putIfMissing("Jumlah kasus sekitar", ["Jumlah kasus sekitar"]);
  putIfMissing("Pemberian vitamin A?", ["Pemberian Vitamin A"]);
  putIfMissing("Berpergian 1 bulan terakhir?", ["Riwayat perjalanan 7-21 hari"]);
  putIfMissing("Tujuan perjalanan", ["Lokasi perjalanan"]);
  putIfMissing("Tanggal pergi", ["Tanggal pergi"]);
  putIfMissing("Tanggal pulang", ["Tanggal pulang perjalanan", "Tanggal kembali"]);
  putIfMissing("Apakah spesimen darah diambil", ["Apakah spesimen darah diambil", "Spesimen diambil?"]);
  putIfMissing("Jenis Sampel Darah", ["Jenis Sampel Darah", "Jenis spesimen"]);
  putIfMissing("Tanggal ambil spesimen darah", ["Tanggal ambil spesimen darah", "Tanggal ambil spesimen"]);
  putIfMissing("Tanggal pengiriman spesimen darah ke lab", ["Tanggal pengiriman spesimen darah ke lab", "Tanggal kirim spesimen"]);
  putIfMissing("Apakah spesimen lain diambil", ["Apakah spesimen lain diambil"]);
  putIfMissing("Jenis Sampel Lain", ["Jenis Sampel Lain", "Jenis spesimen lainnya"]);
  putIfMissing("Tanggal ambil spesimen lain", ["Tanggal ambil spesimen lain"]);
  putIfMissing("Tanggal pengiriman spesimen lain ke lab", ["Tanggal pengiriman spesimen lain ke lab"]);
  putIfMissing("Lokasi Adenopathy", ["Lokasi Adenopathy"]);
  putIfMissing("Bagian Sendi", ["Bagian Sendi"]);
  putIfMissing("Keadaan saat ini", ["Status akhir kasus"]);
  putIfMissing("KontakEratJSON", ["Kontak Erat"]);

  if (headers.includes("Koordinat (lat,lon)") && !data["Koordinat (lat,lon)"]) {
    const lat = String(data["Latitude"] || "").trim();
    const lon = String(data["Longitude"] || "").trim();
    if (lat || lon) data["Koordinat (lat,lon)"] = [lat, lon].filter(Boolean).join(",");
  }

  if (dx === "MR") {
    putIfMissing("Provinsi", ["Provinsi Pasien"]);
    putIfMissing("Kab/Kota", ["Kab/Kota Pasien"]);
    putIfMissing("Provinsi unit pelapor", ["Provinsi"]);
    putIfMissing("Kab/Kota unit pelapor", ["Kab/Kota"]);
  }

  return data;
}

// ─── _normalizeWilayahKey_ ───────────────────────────────────────────────────

function _normalizeWilayahKey_(value) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, " ");
}

// ─── getPengampuByWilayah_ ───────────────────────────────────────────────────

function getPengampuByWilayah_(kecamatan, kelurahan, kabKota) {
  const kabNorm = _normalizeWilayahKey_(kabKota);
  if (kabNorm && kabNorm !== "KOTA DEPOK" && kabNorm !== "DEPOK") {
    return { found: false, status: "OUTSIDE_DEPOK" };
  }

  const sheet = getSheetOrNull_("REF_PENGAMPU");
  if (!sheet) return { found: false, status: "UNMAPPED" };

  const data = sheet.getDataRange().getValues();
  if (!data || data.length < 2) return { found: false, status: "UNMAPPED" };

  const headers = data[0].map(h => String(h || "").trim());
  const rows = data.slice(1);
  const idxKab = headers.indexOf("Kab/Kota");
  const idxKecamatan = headers.indexOf("Kecamatan");
  const idxKelurahan = headers.indexOf("Kelurahan");
  const idxKodePuskesmas = headers.indexOf("KodePuskesmas");
  const idxNamaPuskesmas = headers.indexOf("NamaPuskesmas");
  const idxPengampu = headers.indexOf("Pengampu");
  const idxKapus = headers.indexOf("KepalaPuskesmas");
  const idxEmailKapus = headers.indexOf("EmailKapus");
  const idxPetugas = headers.indexOf("PetugasSurveilans");
  const idxEmailPetugas = headers.indexOf("EmailPetugas");
  const idxSpreadsheetId = headers.indexOf("SpreadsheetId") !== -1 ? headers.indexOf("SpreadsheetId") : headers.indexOf("SpreadsheetIdTujuan");
  const idxSpreadsheetUrl = headers.indexOf("SpreadsheetUrl") !== -1 ? headers.indexOf("SpreadsheetUrl") : headers.indexOf("SpreadsheetUrlTujuan");
  const idxTelegramChatId = headers.indexOf("TelegramChatId");

  const kecNorm = _normalizeWilayahKey_(kecamatan);
  const kelNorm = _normalizeWilayahKey_(kelurahan);

  for (const r of rows) {
    const rk = idxKecamatan !== -1 ? _normalizeWilayahKey_(r[idxKecamatan]) : "";
    const rl = idxKelurahan !== -1 ? _normalizeWilayahKey_(r[idxKelurahan]) : "";
    const rb = idxKab !== -1 ? _normalizeWilayahKey_(r[idxKab]) : "";
    const kabMatch = !kabNorm || !rb || rb === kabNorm || (kabNorm === "DEPOK" && rb === "KOTA DEPOK");
    if (kabMatch && rk === kecNorm && rl === kelNorm) {
      return {
        found: true,
        status: "MATCHED",
        kabKota: rb,
        kecamatan: rk,
        kelurahan: rl,
        kodePuskesmas: idxKodePuskesmas !== -1 ? String(r[idxKodePuskesmas] || "").trim() : "",
        namaPuskesmas: idxNamaPuskesmas !== -1 ? String(r[idxNamaPuskesmas] || "").trim() : "",
        pengampu: idxPengampu !== -1 ? String(r[idxPengampu] || "").trim() : "",
        kepalaPuskesmas: idxKapus !== -1 ? String(r[idxKapus] || "").trim() : "",
        emailKapus: idxEmailKapus !== -1 ? String(r[idxEmailKapus] || "").trim() : "",
        petugasSurveilans: idxPetugas !== -1 ? String(r[idxPetugas] || "").trim() : "",
        emailPetugas: idxEmailPetugas !== -1 ? String(r[idxEmailPetugas] || "").trim() : "",
        spreadsheetId: idxSpreadsheetId !== -1 ? String(r[idxSpreadsheetId] || "").trim() : "",
        spreadsheetUrl: idxSpreadsheetUrl !== -1 ? String(r[idxSpreadsheetUrl] || "").trim() : "",
        telegramChatId: idxTelegramChatId !== -1 ? String(r[idxTelegramChatId] || "").trim() : ""
      };
    }
  }

  return { found: false, status: "UNMAPPED" };
}

// ─── _ensureSheetHeaders_ ────────────────────────────────────────────────────

function _ensureSheetHeaders_(sheet, requiredHeaders) {
  const existing = getTrimmedHeaders_(sheet);
  const needed = (requiredHeaders || []).filter(h => h && !existing.includes(h));
  if (!needed.length) return getTrimmedHeaders_(sheet);

  const startCol = existing.length + 1;
  sheet.getRange(1, startCol, 1, needed.length).setValues([needed]);
  return getTrimmedHeaders_(sheet);
}

const COMMON_PIPELINE_HEADERS_ = [
  "Kecamatan Pengampu",
  "Kelurahan Pengampu",
  "KodePuskesmas Pengampu",
  "Puskesmas Pengampu",
  "Kepala Puskesmas Pengampu",
  "Email Kapus Pengampu",
  "Petugas Surveilans Pengampu",
  "Email Petugas Pengampu",
  "SpreadsheetId Pengampu",
  "SpreadsheetUrl Pengampu",
  "Telegram Chat Id Pengampu",
  "Status Routing Pengampu",
  "Status Notifikasi Pengampu",
  "Reason Notifikasi Pengampu",
  "Notified At Pengampu",
  "Notified To Pengampu",
  "Status Sinkronisasi Pengampu",
  "Reason Sinkronisasi Pengampu",
  "Synced At Pengampu",
  "Sync Target Pengampu",
  "Status Notifikasi Telegram",
  "Reason Notifikasi Telegram",
  "Telegram Notified At",
  "Telegram Target",
  "Telegram Retry Count",
  "Pipeline Fingerprint",
  "Pipeline Last Run At",
  "Status Notifikasi Revisi Pengampu",
  "Reason Notifikasi Revisi Pengampu",
  "Revision Notified At Pengampu",
  "Revision Notified To Pengampu",
  "Status Notifikasi Revisi Telegram",
  "Reason Notifikasi Revisi Telegram",
  "Revision Telegram Notified At",
  "Revision Telegram Target",
  "Revision Notification Fingerprint",
  "Revision Notification Last Run At"
];

const INTERNAL_TRACKING_HEADERS_ = [
  "ID Registrasi Kasus",
  "Nomor EPID Rekomendasi",
  "Nomor EPID Final",
  "Status Verifikasi Sebelumnya",
  "Notifikasi Revisi Dibaca",
  "Waktu Permintaan Revisi",
  "Waktu Verifikasi Pending",
  "Review Admin Terakhir"
];

function generateCaseRegistrationId_(dx) {
  dx = String(dx || 'PD3I').trim().toUpperCase();
  const tz = Session.getScriptTimeZone() || 'Asia/Jakarta';
  const stamp = Utilities.formatDate(new Date(), tz, 'yyyyMMddHHmmss');
  const rand = Math.floor(100 + Math.random() * 900);
  return 'REG-' + dx + '-' + stamp + '-' + rand;
}

function _deriveEpidBaseCode_(data) {
  var directCandidates = [
    data && data['KodePuskesmas Pengampu'],
    data && data.KodePuskesmasPengampu,
    data && data['KodePuskesmas'],
    data && data.KodePuskesmas,
    data && data['Kode Puskesmas'],
    data && data['Kode Puskesmas Pengampu']
  ];

  for (var i = 0; i < directCandidates.length; i++) {
    var digits = String(directCandidates[i] || '').replace(/\D/g, '');
    if (digits.length >= 6) return digits.substring(0, 6);
  }

  var kabKota = String((data && (data['Kab/Kota Pasien'] || data['Kab/Kota'])) || '').trim();
  var kecamatan = String((data && data['Kecamatan']) || '').trim();
  var kelurahan = String((data && data['Kelurahan']) || '').trim();
  var pengampu = getPengampuByWilayah_(kecamatan, kelurahan, kabKota);
  var kodePengampu = String((pengampu && pengampu.kodePuskesmas) || '').replace(/\D/g, '');
  if (kodePengampu.length >= 6) return kodePengampu.substring(0, 6);

  var fallbackDigits = String(kabKota || '').replace(/\D/g, '');
  if (fallbackDigits.length >= 6) return fallbackDigits.substring(0, 6);
  if (fallbackDigits.length > 0) return fallbackDigits.padStart(6, '0').substring(0, 6);
  return '000000';
}

function _compareNumericStrings_(a, b) {
  var left = String(a || '').replace(/^0+/, '') || '0';
  var right = String(b || '').replace(/^0+/, '') || '0';
  if (left.length !== right.length) return left.length > right.length ? 1 : -1;
  if (left === right) return 0;
  return left > right ? 1 : -1;
}

function _incrementNumericString_(digits) {
  var src = String(digits || '').replace(/\D/g, '');
  if (!src) return '1';
  var chars = src.split('');
  var carry = 1;
  for (var i = chars.length - 1; i >= 0; i--) {
    var num = parseInt(chars[i], 10);
    if (isNaN(num)) num = 0;
    num += carry;
    if (num >= 10) {
      chars[i] = '0';
      carry = 1;
    } else {
      chars[i] = String(num);
      carry = 0;
      break;
    }
  }
  if (carry) chars.unshift('1');
  return chars.join('');
}

function _extractComparableEpidNumber_(rawValue) {
  var value = String(rawValue || '').trim().toUpperCase();
  if (!value) return '';
  var match = value.match(/^C-?(\d+)$/);
  return match ? String(match[1] || '') : '';
}

function _deriveMrEpidYear2_(data) {
  var rawDate = String((data && (data['Tanggal Verifikasi EPID'] || data['Tanggal Pelacakan'] || data['Timestamp'])) || '').trim();
  var match = rawDate.match(/^(\d{4})/);
  var year = match ? match[1] : String(new Date().getFullYear());
  return year.slice(-2);
}

function _recommendMrEpid_(sheet, data) {
  var targetYear2 = _deriveMrEpidYear2_(data);
  var maxSeq = '';

  if (sheet) {
    var values = sheet.getDataRange().getValues();
    if (values && values.length > 1) {
      var headers = values[0].map(function(h) { return String(h || '').trim(); });
      var idxEpid = headers.indexOf('Nomor EPID');
      if (idxEpid === -1 && headers.length >= 3) idxEpid = 2;

      if (idxEpid !== -1) {
        for (var r = 1; r < values.length; r++) {
          var epidValue = String(values[r][idxEpid] || '').trim().toUpperCase();
          if (!epidValue) continue;
          var match = epidValue.match(/^C-?1022(\d{2})(\d+)$/);
          if (!match) continue;
          if (String(match[1] || '') !== targetYear2) continue;
          var seq = String(match[2] || '').replace(/\D/g, '');
          if (!seq) continue;
          if (!maxSeq || _compareNumericStrings_(seq, maxSeq) > 0) {
            maxSeq = seq;
          }
        }
      }
    }
  }

  if (!maxSeq) return 'C-1022' + targetYear2 + '001';
  var nextSeq = _incrementNumericString_(maxSeq);
  if (nextSeq.length < 3) nextSeq = nextSeq.padStart(3, '0');
  return 'C-1022' + targetYear2 + nextSeq;
}

function recommendEpid_(dx, data) {
  dx = String(dx || '').trim().toUpperCase();
  var sheet = getSheetOrNull_(dx + '_Raw');

  if (dx === 'MR') {
    return _recommendMrEpid_(sheet, data);
  }

  var baseCode = _deriveEpidBaseCode_(data);
  var fallbackDigits = String(baseCode || '000000').replace(/\D/g, '').padStart(6, '0').substring(0, 6) + '001';
  var maxDigits = '';

  if (sheet) {
    var values = sheet.getDataRange().getValues();
    if (values && values.length > 1) {
      var headers = values[0].map(function(h) { return String(h || '').trim(); });
      var idxEpid = headers.indexOf('Nomor EPID');
      if (idxEpid === -1 && headers.length >= 3) idxEpid = 2;

      if (idxEpid !== -1) {
        for (var r = 1; r < values.length; r++) {
          var epidDigits = _extractComparableEpidNumber_(values[r][idxEpid]);
          if (!epidDigits) continue;
          if (!maxDigits || _compareNumericStrings_(epidDigits, maxDigits) > 0) {
            maxDigits = epidDigits;
          }
        }
      }
    }
  }

  if (!maxDigits) {
    maxDigits = fallbackDigits;
    return 'C' + maxDigits;
  }

  return 'C' + _incrementNumericString_(maxDigits);
}


function generateEpid_(dx, data) {
  return recommendEpid_(dx, data);
}

function previewRecommendedEpid(dx, payload, token) {
  const sess = _getSessionFromToken_(token);
  if (!sess.ok) return { ok: false, recommendation: '', message: 'Sesi tidak valid.' };
  try {
    const data = Object.assign({}, payload || {});
    const recommendation = recommendEpid_(dx, data);
    return { ok: true, recommendation: recommendation };
  } catch (e) {
    return { ok: false, recommendation: '', message: String(e && e.message || e) };
  }
}


function saveDxRecord_(dx, data) {
  dx = String(dx || "").trim().toUpperCase();
  if (!dx) throw new Error("dx wajib diisi.");

  const sheet = getSheetOrThrow_(dx + "_Raw");
  let headers = getTrimmedHeaders_(sheet);
  if (!headers.length) throw new Error("Header sheet tidak ditemukan.");
  const mrOnlyHeaders = ["Nomor Rekam Medik", "Tanggal meninggal", "Penyebab kematian"];

  const incomingFieldHeaders = Object.keys(data || {})
    .filter(function (key) {
      return key && String(key).trim() && String(key).indexOf("__") !== 0;
    });

  headers = _ensureSheetHeaders_(sheet, (dx === "MR"
    ? mrOnlyHeaders.concat(COMMON_PIPELINE_HEADERS_).concat(INTERNAL_TRACKING_HEADERS_)
    : COMMON_PIPELINE_HEADERS_.concat(INTERNAL_TRACKING_HEADERS_)).concat(incomingFieldHeaders));
  data = _applyHeaderAliases_(dx, data || {}, headers);

  const idxRecordId = headers.indexOf("ID Registrasi Kasus");
  const idxEpid = headers.indexOf("Nomor EPID");
  const idxTimestamp = headers.indexOf("Timestamp");
  const idxStatusVerifikasi = headers.indexOf("Status Verifikasi EPID");
  if (idxEpid === -1) {
    throw new Error("Kolom 'Nomor EPID' belum ada di sheet " + dx + "_Raw");
  }
  if (idxRecordId === -1) {
    throw new Error("Kolom 'ID Registrasi Kasus' belum ada di sheet " + dx + "_Raw");
  }

  let recordId = String(data["ID Registrasi Kasus"] || "").trim();
  if (!recordId) {
    recordId = generateCaseRegistrationId_(dx);
    data["ID Registrasi Kasus"] = recordId;
  }

  const verificationStatus = String(data["Status Verifikasi EPID"] || "").trim() || "Pending";
  data["Status Verifikasi EPID"] = verificationStatus;
  if (!data["Nomor EPID Rekomendasi"]) {
    try {
      data["Nomor EPID Rekomendasi"] = recommendEpid_(dx, data);
    } catch (e) {
      data["Nomor EPID Rekomendasi"] = "";
    }
  }

  let epidValue = String(data["Nomor EPID"] || data["Nomor EPID Final"] || "").trim();

  let rowIndex = -1;
  const lastRowForLookup = sheet.getLastRow();
  if (lastRowForLookup >= 2) {
    const lookupRange = sheet.getRange(2, 1, lastRowForLookup - 1, Math.max(idxRecordId, idxEpid) + 1).getValues();
    for (var li = 0; li < lookupRange.length; li++) {
      const rowRecordId = String(lookupRange[li][idxRecordId] || '').trim();
      const rowEpid = String(lookupRange[li][idxEpid] || '').trim();
      if ((recordId && rowRecordId === recordId) || (epidValue && rowEpid === epidValue)) {
        rowIndex = li + 2;
        break;
      }
    }
  }

  let existingRowObject = null;
  if (rowIndex !== -1) {
    try {
      const existingValues = sheet.getRange(rowIndex, 1, 1, headers.length).getValues()[0];
      existingRowObject = {};
      headers.forEach(function(h, j) { existingRowObject[h] = existingValues[j]; });
    } catch (e) {
      existingRowObject = null;
    }
  }

  const incomingKecamatanVal = String(data["Kecamatan"] || data["Kecamatan domisili"] || "").trim();
  const incomingKelurahanVal = String(data["Kelurahan"] || data["Kelurahan domisili"] || "").trim();
  const incomingKabKotaVal = String(data["Kab/Kota"] || data["Kab/Kota Pasien"] || data["Kab/Kota domisili"] || "").trim();
  const existingKecamatanVal = String((existingRowObject && (existingRowObject["Kecamatan"] || existingRowObject["Kecamatan domisili"])) || "").trim();
  const existingKelurahanVal = String((existingRowObject && (existingRowObject["Kelurahan"] || existingRowObject["Kelurahan domisili"])) || "").trim();
  const existingKabKotaVal = String((existingRowObject && (existingRowObject["Kab/Kota"] || existingRowObject["Kab/Kota Pasien"] || existingRowObject["Kab/Kota domisili"])) || "").trim();
  const effectiveKecamatanVal = incomingKecamatanVal || existingKecamatanVal;
  const effectiveKelurahanVal = incomingKelurahanVal || existingKelurahanVal;
  const effectiveKabKotaVal = incomingKabKotaVal || existingKabKotaVal || "Kota Depok";

  if (effectiveKecamatanVal && effectiveKelurahanVal) {
    const pengampu = getPengampuByWilayah_(effectiveKecamatanVal, effectiveKelurahanVal, effectiveKabKotaVal);
    data["Status Routing Pengampu"] = pengampu.status || "UNMAPPED";
    if (pengampu.found) {
      data["Kecamatan Pengampu"] = pengampu.kecamatan || "";
      data["Kelurahan Pengampu"] = pengampu.kelurahan || "";
      data["KodePuskesmas Pengampu"] = pengampu.kodePuskesmas || "";
      data["Puskesmas Pengampu"] = pengampu.namaPuskesmas || pengampu.pengampu || "";
      data["Kepala Puskesmas Pengampu"] = pengampu.kepalaPuskesmas || "";
      data["Email Kapus Pengampu"] = pengampu.emailKapus || "";
      data["Petugas Surveilans Pengampu"] = pengampu.petugasSurveilans || "";
      data["Email Petugas Pengampu"] = pengampu.emailPetugas || "";
      data["SpreadsheetId Pengampu"] = pengampu.spreadsheetId || "";
      data["SpreadsheetUrl Pengampu"] = pengampu.spreadsheetUrl || "";
      data["Telegram Chat Id Pengampu"] = pengampu.telegramChatId || data["Telegram Chat Id Pengampu"] || "";
    } else {
      data["Kecamatan Pengampu"] = "";
      data["Kelurahan Pengampu"] = "";
      data["KodePuskesmas Pengampu"] = "";
      data["Puskesmas Pengampu"] = "";
      data["Kepala Puskesmas Pengampu"] = "";
      data["Email Kapus Pengampu"] = "";
      data["Petugas Surveilans Pengampu"] = "";
      data["Email Petugas Pengampu"] = "";
      data["SpreadsheetId Pengampu"] = "";
      data["SpreadsheetUrl Pengampu"] = "";
      data["Telegram Chat Id Pengampu"] = "";
    }
  } else if (existingRowObject) {
    data["Status Routing Pengampu"] = String(data["Status Routing Pengampu"] || existingRowObject["Status Routing Pengampu"] || "").trim();
    data["Kecamatan Pengampu"] = String(data["Kecamatan Pengampu"] || existingRowObject["Kecamatan Pengampu"] || "").trim();
    data["Kelurahan Pengampu"] = String(data["Kelurahan Pengampu"] || existingRowObject["Kelurahan Pengampu"] || "").trim();
    data["KodePuskesmas Pengampu"] = String(data["KodePuskesmas Pengampu"] || existingRowObject["KodePuskesmas Pengampu"] || "").trim();
    data["Puskesmas Pengampu"] = String(data["Puskesmas Pengampu"] || existingRowObject["Puskesmas Pengampu"] || "").trim();
    data["Kepala Puskesmas Pengampu"] = String(data["Kepala Puskesmas Pengampu"] || existingRowObject["Kepala Puskesmas Pengampu"] || "").trim();
    data["Email Kapus Pengampu"] = String(data["Email Kapus Pengampu"] || existingRowObject["Email Kapus Pengampu"] || "").trim();
    data["Petugas Surveilans Pengampu"] = String(data["Petugas Surveilans Pengampu"] || existingRowObject["Petugas Surveilans Pengampu"] || "").trim();
    data["Email Petugas Pengampu"] = String(data["Email Petugas Pengampu"] || existingRowObject["Email Petugas Pengampu"] || "").trim();
    data["SpreadsheetId Pengampu"] = String(data["SpreadsheetId Pengampu"] || existingRowObject["SpreadsheetId Pengampu"] || "").trim();
    data["SpreadsheetUrl Pengampu"] = String(data["SpreadsheetUrl Pengampu"] || existingRowObject["SpreadsheetUrl Pengampu"] || "").trim();
    data["Telegram Chat Id Pengampu"] = String(data["Telegram Chat Id Pengampu"] || existingRowObject["Telegram Chat Id Pengampu"] || "").trim();
  } else {
    data["Status Routing Pengampu"] = String(data["Status Routing Pengampu"] || "UNMAPPED").trim() || "UNMAPPED";
  }

  if (existingRowObject) {
    if (!String(data['Status Verifikasi EPID'] || '').trim()) {
      data['Status Verifikasi EPID'] = String(existingRowObject['Status Verifikasi EPID'] || '').trim() || verificationStatus;
    }
    if (!String(data['Nomor EPID Rekomendasi'] || '').trim()) {
      data['Nomor EPID Rekomendasi'] = String(existingRowObject['Nomor EPID Rekomendasi'] || '').trim();
    }
    if (!String(data['Nomor EPID Final'] || '').trim()) {
      data['Nomor EPID Final'] = String(existingRowObject['Nomor EPID Final'] || '').trim();
    }
    if (!epidValue) {
      epidValue = String(existingRowObject['Nomor EPID'] || '').trim();
    }
  }

  const normalizedStatus = String(data['Status Verifikasi EPID'] || verificationStatus).trim() || 'Pending';
  data['Status Verifikasi EPID'] = normalizedStatus;
  if (normalizedStatus === 'Terverifikasi') {
    epidValue = String(data['Nomor EPID Final'] || data['Nomor EPID'] || epidValue || '').trim();
    if (!epidValue) {
      epidValue = String(data['Nomor EPID Rekomendasi'] || '').trim() || recommendEpid_(dx, data);
    }
    data['Nomor EPID Final'] = epidValue;
    data['Nomor EPID'] = epidValue;
  } else if (rowIndex === -1 || String(data['__workflowStage'] || '').trim() === 'section-verifikasi') {
    data['Nomor EPID Final'] = '';
    data['Nomor EPID'] = '';
    epidValue = '';
  }

  if (headers.includes("Link PDF") && !data["Link PDF"]) {
    const token = String(data.__token || "").trim();
    if (token && epidValue) {
      data["Link PDF"] = safeGetPdfPrintUrl_(dx, epidValue, token) || "";
    }
  }

  // Req 16.1, 16.3: serialize record sebelum tulis
  const serialized = serializeRecord_(data, headers);

  const now = new Date();
  let oldTimestamp = "";
  if (rowIndex !== -1 && idxTimestamp !== -1) {
    oldTimestamp = sheet.getRange(rowIndex, idxTimestamp + 1).getValue();
  }

  // Simpan existingRow untuk diff (Req 10.2)
  const existingRow = rowIndex !== -1
    ? sheet.getRange(rowIndex, 1, 1, headers.length).getValues()[0]
    : new Array(headers.length).fill("");

  const rowData = headers.map((header, idx) => {
    if (!header) return "";
    if (header === "Timestamp") return rowIndex !== -1 ? (oldTimestamp || serialized["Timestamp"] || now) : (serialized["Timestamp"] || now);
    if (header === "dx") return dx;
    if (header === "ID Registrasi Kasus") return recordId;
    if (header === "Nomor EPID") return epidValue;
    if (serialized[header] !== undefined) return serialized[header];
    return existingRow[idx] !== undefined ? existingRow[idx] : "";
  });

  const savedRowIndex = rowIndex !== -1 ? rowIndex : (sheet.getLastRow() + 1);
  if (rowIndex !== -1) {
    sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }

  // Req 2.3: perbarui indeks setelah tulis
  if (epidValue) {
    _updateEpidIndex_(sheet, epidValue, savedRowIndex);
  }

  // Req 1.3: invalidasi cache setelah tulis berhasil
  try {
    Cache_Manager.invalidateSheetCache(dx + "_Raw");
  } catch (e) {
    console.warn("saveDxRecord_: gagal invalidasi cache:", e);
  }

  // Req 10.1, 10.2: audit log
  try {
    const aksi = rowIndex !== -1 ? "UPDATE" : "INSERT";
    const user = (data && data.__user) ? data.__user : { username: "system", role: "system" };
    const auditMeta = (data && data.__auditMeta) ? data.__auditMeta : null;
    let diff = null;
    if (aksi === "UPDATE") {
      diff = {};
      headers.forEach(function (h, idx) {
        if (!h || h === "Timestamp" || h === "dx") return;
        const oldVal = String(existingRow[idx] !== undefined ? existingRow[idx] : "");
        const newVal = String(rowData[idx] !== undefined ? rowData[idx] : "");
        if (oldVal !== newVal) {
          diff[h] = { old: oldVal, new: newVal };
        }
      });
      if (Object.keys(diff).length === 0) diff = null;
    }
    Audit_Logger.logChange(user, dx, epidValue, aksi, diff, auditMeta);
  } catch (e) {
    console.error("saveDxRecord_: gagal mencatat audit log:", e);
  }

  return {
    epid: epidValue,
    recordId: recordId,
    verificationStatus: normalizedStatus,
    isUpdate: rowIndex !== -1,
    rowIndex: savedRowIndex
  };
}
