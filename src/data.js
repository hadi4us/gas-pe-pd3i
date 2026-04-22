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

function recommendEpid_(dx, data) {
  dx = String(dx || '').trim().toUpperCase();
  var sheet = getSheetOrNull_(dx + '_Raw');
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
