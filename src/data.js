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
        spreadsheetUrl: idxSpreadsheetUrl !== -1 ? String(r[idxSpreadsheetUrl] || "").trim() : ""
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
  "Pipeline Last Run At"
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

function recommendEpid_(dx, data) {
  dx = String(dx || 'PD3I').trim().toUpperCase();
  const tz = Session.getScriptTimeZone() || 'Asia/Jakarta';

  if (dx === 'MR') {
    data = data || {};
    const yy = Utilities.formatDate(new Date(), tz, 'yy');
    const domisiliRaw = String(data['Kab/Kota Pasien'] || data['Kab/Kota'] || '').trim();
    const domisiliCode = _normalizeKabKotaCode_(domisiliRaw);
    const isDepok = domisiliCode === 'KOTADEPOK' || domisiliCode === 'DEPOK';
    const kodeWilayah = isDepok ? ('DEPOK_' + yy) : (domisiliCode || 'LUAR_KOTA');

    const sheet = getSheetOrThrow_('MR_Raw');
    const headers = getTrimmedHeaders_(sheet);
    const idxEpid = headers.indexOf('Nomor EPID');
    const idxRecordId = headers.indexOf('ID Registrasi Kasus');
    if (idxEpid === -1) throw new Error("Kolom 'Nomor EPID' belum ada di sheet MR_Raw");

    const currentRecordId = String((data && data['ID Registrasi Kasus']) || '').trim();
    let maxSeq = 0;
    const lastRow = sheet.getLastRow();
    if (lastRow >= 2) {
      const values = sheet.getRange(2, 1, lastRow - 1, Math.max(idxEpid, idxRecordId) + 1).getValues();
      values.forEach(function(row) {
        const existingRecordId = idxRecordId !== -1 ? String(row[idxRecordId] || '').trim() : '';
        if (currentRecordId && existingRecordId && existingRecordId === currentRecordId) return;
        const epid = String(row[idxEpid] || '').trim();
        if (!epid) return;
        if (isDepok) {
          const mDepok = epid.match(/^C-1022(\d{2})(\d{3,})$/i);
          if (mDepok && mDepok[1] === yy) {
            const seqDepok = Number(mDepok[2] || 0);
            if (seqDepok > maxSeq) maxSeq = seqDepok;
          }
        } else {
          const escapedCode = kodeWilayah.replace(/[-[\]{}()*+?.,\^$|#\s]/g, '\$&');
          const pattern = new RegExp('^C-' + escapedCode + '-(\d{3,})$', 'i');
          const mCity = epid.match(pattern);
          if (mCity) {
            const seqCity = Number(mCity[1] || 0);
            if (seqCity > maxSeq) maxSeq = seqCity;
          }
        }
      });
    }

    const nextSeqStr = String(maxSeq + 1).padStart(3, '0');
    if (isDepok) return 'C-1022' + yy + nextSeqStr;
    return 'C-' + kodeWilayah + '-' + nextSeqStr;
  }

  const stamp = Utilities.formatDate(new Date(), tz, 'yyyyMMddHHmmss');
  return dx + '-REC-' + stamp;
}

// ─── saveDxRecord_ (Req 1.3, 10.1, 10.2) ────────────────────────────────────

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

  const kecamatanVal = data["Kecamatan"] || data["Kecamatan domisili"] || "";
  const kelurahanVal = data["Kelurahan"] || data["Kelurahan domisili"] || "";
  const kabKotaVal = data["Kab/Kota"] || data["Kab/Kota Pasien"] || data["Kab/Kota domisili"] || "Kota Depok";

  const pengampu = getPengampuByWilayah_(kecamatanVal, kelurahanVal, kabKotaVal);
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
  }

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
    verificationStatus: verificationStatus,
    isUpdate: rowIndex !== -1,
    rowIndex: savedRowIndex
  };
}

// ─── getFaskesFromSheet ──────────────────────────────────────────────────────

function getFaskesFromSheet(token) {
  const sess = _getSessionFromToken_(token);
  if (!sess.ok) return [];

  try {
    const sheet = getSheetOrNull_("REF_FASKES");
    if (!sheet) return [];

    const data = sheet.getDataRange().getValues();
    if (!data || data.length < 2) return [];

    const headers = data[0].map(h => String(h || "").trim());
    const rows = data.slice(1);

    const idxKey = headers.indexOf("FaskesKey");
    const idxNama = headers.indexOf("NamaFaskes");
    const idxJenis = headers.indexOf("Jenis");
    const idxStatus = headers.indexOf("StatusAktif");

    return rows
      .filter(r => idxStatus !== -1 ? String(r[idxStatus] || "").trim().toUpperCase() === "AKTIF" : true)
      .map(r => ({
        key: idxKey !== -1 ? String(r[idxKey] || "").trim() : "",
        nama: idxNama !== -1 ? String(r[idxNama] || "").trim() : "",
        jenis: idxJenis !== -1 ? String(r[idxJenis] || "").trim() : ""
      }))
      .filter(x => x.nama);
  } catch (e) {
    return [];
  }
}

// ─── getHeadersForDx ─────────────────────────────────────────────────────────

function getHeadersForDx(dx, token) {
  const sess = _getSessionFromToken_(token);
  if (!sess.ok) return [];

  try {
    dx = String(dx || "").trim().toUpperCase();
    if (!dx) return [];

    const sheet = getSheetOrNull_(dx + "_Raw");
    if (!sheet) return [];
    return getTrimmedHeaders_(sheet).filter(Boolean);
  } catch (e) {
    return [];
  }
}

// ─── getRecordByEpid ─────────────────────────────────────────────────────────

function getRecordByKey(dx, recordKey, token) {
  const sess = _getSessionFromToken_(token);
  if (!sess.ok) return null;

  try {
    dx = String(dx || "").trim().toUpperCase();
    recordKey = String(recordKey || "").trim();
    if (!dx || !recordKey) return null;

    const sheet = getSheetOrNull_(dx + "_Raw");
    if (!sheet) return null;

    const data = sheet.getDataRange().getValues();
    if (!data || data.length < 2) return null;

    const headers = data[0].map(h => String(h || "").trim());
    const idxRecordId = headers.indexOf("ID Registrasi Kasus");
    const idxEpid = headers.indexOf("Nomor EPID");
    if (idxRecordId === -1 && idxEpid === -1) return null;

    for (let i = 1; i < data.length; i++) {
      const rowRecordId = idxRecordId !== -1 ? String(data[i][idxRecordId] || "").trim() : "";
      const rowEpid = idxEpid !== -1 ? String(data[i][idxEpid] || "").trim() : "";
      if ((rowRecordId && rowRecordId === recordKey) || (rowEpid && rowEpid === recordKey)) {
        return deserializeRecord_(data[i], headers);
      }
    }

    return null;
  } catch (e) {
    return null;
  }
}

function getRecordByEpid(dx, epid, token) {
  return getRecordByKey(dx, epid, token);
}

// ─── searchRecords (Req 9.1, 9.2) ────────────────────────────────────────────

/**
 * Cari kasus berdasarkan filter. Mendukung pagination.
 * Req 9.1: parameter page (default 1) dan pageSize (default 30, maks 100)
 * Req 9.2: kembalikan { results, total, page, pageSize, totalPages }
 * @param {string} dx
 * @param {Object} filters
 * @param {string} token
 * @returns {{ results: Array, total: number, page: number, pageSize: number, totalPages: number }}
 */
function searchRecords(dx, filters, token) {
  const sess = _getSessionFromToken_(token);
  if (!sess.ok) return { results: [], total: 0, page: 1, pageSize: 30, totalPages: 0 };

  try {
    dx = String(dx || "").trim().toUpperCase();
    if (!dx) return { results: [], total: 0, page: 1, pageSize: 30, totalPages: 0 };

    const query = filters || {};
    const qEpid = String(query.epid || "").trim().toLowerCase();
    const qNama = String(query.nama || "").trim().toLowerCase();
    const qTglLahir = String(query.tglLahir || query.tanggalLahir || "").trim();
    const qOrtu = String(query.orangTua || "").trim().toLowerCase();
    const qAlamat = String(query.alamat || "").trim().toLowerCase();
    const qKelurahan = String(query.kelurahan || "").trim().toLowerCase();
    const qStatusVerif = String(query.statusVerifikasi || "").trim().toLowerCase();
    const sortBy = String(query.sortBy || "updated_desc").trim().toLowerCase();

    // Req 9.1: pagination params
    const page = Math.max(1, parseInt(query.page || 1, 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(query.pageSize || 30, 10) || 30));

    if (!qEpid && !qNama && !qTglLahir && !qOrtu && !qAlamat && !qKelurahan && !qStatusVerif) {
      return { results: [], total: 0, page: page, pageSize: pageSize, totalPages: 0 };
    }

    const sheet = getSheetOrNull_(dx + "_Raw");
    if (!sheet) return { results: [], total: 0, page: page, pageSize: pageSize, totalPages: 0 };

    const data = sheet.getDataRange().getValues();
    if (!data || data.length < 2) return { results: [], total: 0, page: page, pageSize: pageSize, totalPages: 0 };

    const headers = data[0].map(h => String(h || "").trim());
    const rows = data.slice(1);

    const idxRecordId = headers.indexOf("ID Registrasi Kasus");
    const idxEpid = headers.indexOf("Nomor EPID");
    const idxNama = headers.indexOf("Nama");
    const idxTglLahir = headers.indexOf("Tanggal Lahir");
    const idxOrtu = headers.indexOf("Nama orang tua/wali");
    const idxAlamat = headers.indexOf("Alamat");
    const idxKelurahan = headers.indexOf("Kelurahan");
    const idxTimestamp = headers.indexOf("Timestamp");
    const idxStatusKasus = headers.indexOf("Status Pasien/Kasus");
    const idxStatusVerifikasi = headers.indexOf("Status Verifikasi EPID");
    const idxSampelDilakukan = headers.indexOf("Pemeriksaan Sampel Dilakukan");
    const idxInterpretasiSampel = headers.indexOf("Interpretasi Hasil Sampel");

    const tz = Session.getScriptTimeZone() || "Asia/Jakarta";
    const allResults = [];

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const recordId = idxRecordId !== -1 ? String(r[idxRecordId] || "").trim() : "";
      const epid = idxEpid !== -1 ? String(r[idxEpid] || "").trim() : "";
      const nama = idxNama !== -1 ? String(r[idxNama] || "").trim() : "";
      const orangTua = idxOrtu !== -1 ? String(r[idxOrtu] || "").trim() : "";
      const alamat = idxAlamat !== -1 ? String(r[idxAlamat] || "").trim() : "";
      const kelurahan = idxKelurahan !== -1 ? String(r[idxKelurahan] || "").trim() : "";

      let tglLahir = "";
      if (idxTglLahir !== -1) {
        const raw = r[idxTglLahir];
        if (raw instanceof Date) {
          tglLahir = Utilities.formatDate(raw, tz, "yyyy-MM-dd");
        } else {
          tglLahir = String(raw || "").trim();
        }
      }

      let timestampValue = 0;
      if (idxTimestamp !== -1) {
        const rawTs = r[idxTimestamp];
        if (rawTs instanceof Date) {
          timestampValue = rawTs.getTime();
        } else {
          const parsedTs = new Date(rawTs);
          timestampValue = isNaN(parsedTs.getTime()) ? 0 : parsedTs.getTime();
        }
      }

      const statusKasus = idxStatusKasus !== -1 ? String(r[idxStatusKasus] || "").trim() : "";
      const statusVerifikasi = idxStatusVerifikasi !== -1 ? String(r[idxStatusVerifikasi] || "").trim() : "";
      const sampelDilakukan = idxSampelDilakukan !== -1 ? String(r[idxSampelDilakukan] || "").trim() : "";
      const interpretasiSampel = idxInterpretasiSampel !== -1 ? String(r[idxInterpretasiSampel] || "").trim() : "";

      const matchEpid = !qEpid || epid.toLowerCase().includes(qEpid) || recordId.toLowerCase().includes(qEpid);
      const matchNama = !qNama || nama.toLowerCase().includes(qNama);
      const matchTglLahir = !qTglLahir || tglLahir === qTglLahir;
      const matchOrtu = !qOrtu || orangTua.toLowerCase().includes(qOrtu);
      const matchAlamat = !qAlamat || alamat.toLowerCase().includes(qAlamat);
      const matchKelurahan = !qKelurahan || kelurahan.toLowerCase().includes(qKelurahan);
      const matchStatusVerif = !qStatusVerif || statusVerif.toLowerCase() === qStatusVerif;

      if (matchEpid && matchNama && matchTglLahir && matchOrtu && matchAlamat && matchKelurahan && matchStatusVerif) {
        allResults.push({
          recordId: recordId,
          recordKey: recordId || epid,
          epid: epid,
          nama: nama,
          tanggalLahir: tglLahir,
          orangTua: orangTua,
          alamat: alamat,
          kelurahan: kelurahan,
          statusKasus: statusKasus,
          statusVerifikasi: statusVerifikasi,
          sampelDilakukan: sampelDilakukan,
          interpretasiSampel: interpretasiSampel,
          timestampValue: Number(timestampValue || 0),
          rowIndex: i + 2
        });
      }
    }

    allResults.sort(function (a, b) {
      if (sortBy === "name_asc") return String(a.nama || "").localeCompare(String(b.nama || ""), "id");
      if (sortBy === "name_desc") return String(b.nama || "").localeCompare(String(a.nama || ""), "id");
      if (sortBy === "epid_asc") return String(a.epid || "").localeCompare(String(b.epid || ""), "id");
      if (sortBy === "epid_desc") return String(b.epid || "").localeCompare(String(a.epid || ""), "id");
      if (sortBy === "birth_asc") return String(a.tanggalLahir || "").localeCompare(String(b.tanggalLahir || ""), "id");
      if (sortBy === "birth_desc") return String(b.tanggalLahir || "").localeCompare(String(a.tanggalLahir || ""), "id");
      return Number(b.timestampValue || 0) - Number(a.timestampValue || 0);
    });

    const total = allResults.length;
    const totalPages = total > 0 ? Math.ceil(total / pageSize) : 0;
    const startIdx = (page - 1) * pageSize;
    const results = allResults.slice(startIdx, startIdx + pageSize);

    return { results: results, total: total, page: page, pageSize: pageSize, totalPages: totalPages };
  } catch (e) {
    return { results: [], total: 0, page: 1, pageSize: 30, totalPages: 0 };
  }
}

// ─── checkDuplicate (Req 8.1, 8.3, 8.4, 8.5) ─────────────────────────────────

/**
 * Cek potensi duplikasi kasus berdasarkan nama dan tanggal lahir.
 * Req 8.3: case-insensitive dan trim whitespace
 * Req 8.4: excludeEpid untuk mode edit
 * @param {string} dx
 * @param {string} nama
 * @param {string} tanggalLahir - format yyyy-MM-dd
 * @param {string} excludeEpid - EPID yang dikecualikan (mode edit)
 * @param {string} token
 * @returns {Array<{epid, nama, tanggalLahir, tanggalPelacakan}>}
 */
function checkDuplicate(dx, nama, tanggalLahir, excludeEpid, token) {
  // Req 8.1: validasi sesi
  const sess = _getSessionFromToken_(token);
  if (!sess.ok) return [];

  try {
    dx = String(dx || "").trim().toUpperCase();
    const namaNorm = String(nama || "").trim().toLowerCase();
    const tglLahirNorm = String(tanggalLahir || "").trim();
    const excludeNorm = String(excludeEpid || "").trim();

    if (!dx || !namaNorm || !tglLahirNorm) return [];

    const sheet = getSheetOrNull_(dx + "_Raw");
    if (!sheet) return [];

    const data = sheet.getDataRange().getValues();
    if (!data || data.length < 2) return [];

    const headers = data[0].map(h => String(h || "").trim());
    const rows = data.slice(1);

    const idxEpid = headers.indexOf("Nomor EPID");
    const idxNama = headers.indexOf("Nama");
    const idxTglLahir = headers.indexOf("Tanggal Lahir");
    const idxTglPelacakan = headers.indexOf("Tanggal Pelacakan");

    if (idxEpid === -1 || idxNama === -1 || idxTglLahir === -1) return [];

    const tz = Session.getScriptTimeZone() || "Asia/Jakarta";
    const duplicates = [];

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const rowEpid = String(r[idxEpid] || "").trim();
      // Req 8.4: kecualikan EPID yang sedang diedit
      if (excludeNorm && rowEpid === excludeNorm) continue;

      const rowNama = String(r[idxNama] || "").trim().toLowerCase();
      let rowTglLahir = "";
      const rawTgl = r[idxTglLahir];
      if (rawTgl instanceof Date) {
        rowTglLahir = Utilities.formatDate(rawTgl, tz, "yyyy-MM-dd");
      } else {
        rowTglLahir = String(rawTgl || "").trim();
      }

      // Req 8.3: case-insensitive dan trim whitespace
      if (rowNama === namaNorm && rowTglLahir === tglLahirNorm) {
        let tglPelacakan = "";
        if (idxTglPelacakan !== -1) {
          const rawPelacakan = r[idxTglPelacakan];
          if (rawPelacakan instanceof Date) {
            tglPelacakan = Utilities.formatDate(rawPelacakan, tz, "yyyy-MM-dd");
          } else {
            tglPelacakan = String(rawPelacakan || "").trim();
          }
        }
        duplicates.push({
          epid: rowEpid,
          nama: String(r[idxNama] || "").trim(),
          tanggalLahir: rowTglLahir,
          tanggalPelacakan: tglPelacakan
        });
      }
    }

    return duplicates;
  } catch (e) {
    console.error("checkDuplicate: error:", e);
    return [];
  }
}

// ─── getRefImunisasi ─────────────────────────────────────────────────────────

function getRefImunisasi(token) {
  const sess = _getSessionFromToken_(token);
  if (!sess.ok) return [];

  try {
    const sh = getSheetOrNull_("REF_IMUN");
    if (!sh) return [];

    const data = sh.getDataRange().getValues();
    if (!data || data.length < 2) return [];

    const headers = data[0].map(h => String(h || "").trim());
    const rows = data.slice(1);

    function idxAny(names) {
      for (const name of names) {
        const i = headers.indexOf(name);
        if (i !== -1) return i;
      }
      return -1;
    }

    const idxKode = idxAny(["KodeImunisasi", "Kode Imunisasi", "Kode"]);
    const idxLabel = idxAny(["LabelImunisasi", "Label Imunisasi", "Jenis Imunisasi", "Nama Imunisasi"]);
    const idxAktif = idxAny(["Aktif", "StatusAktif", "Active"]);
    const idxKategori = idxAny(["Kategori"]);
    const idxKelompokUsia = idxAny(["KelompokUsia", "Kelompok Usia"]);
    const idxUrutanDosis = idxAny(["UrutanDosis", "Urutan Dosis"]);
    const idxUmurMinHari = idxAny(["UmurMinHari", "Umur Min Hari"]);
    const idxUmurMinBulan = idxAny(["UmurMinBulan", "Umur Min Bulan"]);
    const idxUmurMinTahun = idxAny(["UmurMinTahun", "Umur Min Tahun"]);
    const idxUmurMaxHari = idxAny(["UmurMaxHari", "Umur Max Hari"]);
    const idxUmurMaxBulan = idxAny(["UmurMaxBulan", "Umur Max Bulan"]);
    const idxUmurMaxTahun = idxAny(["UmurMaxTahun", "Umur Max Tahun"]);
    const idxBasisValidasi = idxAny(["BasisValidasi", "Basis Validasi"]);
    const idxKelasMin = idxAny(["KelasMin", "Kelas Min"]);
    const idxKelasMax = idxAny(["KelasMax", "Kelas Max"]);
    const idxJKTarget = idxAny(["JKTarget", "JK Target"]);
    const idxButuhSekolah = idxAny(["ButuhSekolah", "Butuh Sekolah"]);
    const idxIntroduksi = idxAny(["Introduksi"]);
    const idxUmurMaxIntroduksi = idxAny(["UmurMaxIntroduksi", "Umur Max Introduksi"]);
    const idxStatusBawah = idxAny(["StatusDiBawahUmur", "Status Di Bawah Umur"]);
    const idxStatusLuar = idxAny(["StatusDiLuarSasaran", "Status Di Luar Sasaran"]);
    const idxCatatan = idxAny(["Catatan", "Keterangan"]);

    return rows
      .map(r => {
        const aktifRaw = idxAktif !== -1 ? String(r[idxAktif] || "").trim().toUpperCase() : "";
        const aktifNorm = aktifRaw || "YA";
        return {
          KodeImunisasi: idxKode !== -1 ? String(r[idxKode] || "").trim() : "",
          LabelImunisasi: idxLabel !== -1 ? String(r[idxLabel] || "").trim() : "",
          Aktif: aktifNorm,
          Kategori: idxKategori !== -1 ? String(r[idxKategori] || "").trim() : "",
          KelompokUsia: idxKelompokUsia !== -1 ? String(r[idxKelompokUsia] || "").trim() : "",
          UrutanDosis: idxUrutanDosis !== -1 ? Number(r[idxUrutanDosis] || 0) : 0,
          UmurMinHari: idxUmurMinHari !== -1 ? Number(r[idxUmurMinHari] || 0) : 0,
          UmurMinBulan: idxUmurMinBulan !== -1 ? Number(r[idxUmurMinBulan] || 0) : 0,
          UmurMinTahun: idxUmurMinTahun !== -1 ? Number(r[idxUmurMinTahun] || 0) : 0,
          UmurMaxHari: idxUmurMaxHari !== -1 ? Number(r[idxUmurMaxHari] || 0) : 0,
          UmurMaxBulan: idxUmurMaxBulan !== -1 ? Number(r[idxUmurMaxBulan] || 0) : 0,
          UmurMaxTahun: idxUmurMaxTahun !== -1 ? Number(r[idxUmurMaxTahun] || 0) : 0,
          BasisValidasi: idxBasisValidasi !== -1 ? String(r[idxBasisValidasi] || "").trim().toUpperCase() : "UMUR",
          KelasMin: idxKelasMin !== -1 ? String(r[idxKelasMin] || "").trim() : "",
          KelasMax: idxKelasMax !== -1 ? String(r[idxKelasMax] || "").trim() : "",
          JKTarget: idxJKTarget !== -1 ? String(r[idxJKTarget] || "SEMUA").trim().toUpperCase() : "SEMUA",
          ButuhSekolah: idxButuhSekolah !== -1 ? String(r[idxButuhSekolah] || "TIDAK").trim().toUpperCase() : "TIDAK",
          Introduksi: idxIntroduksi !== -1 ? r[idxIntroduksi] : "",
          UmurMaxIntroduksi: idxUmurMaxIntroduksi !== -1 ? Number(r[idxUmurMaxIntroduksi] || 0) : 0,
          StatusDiBawahUmur: idxStatusBawah !== -1 ? String(r[idxStatusBawah] || "Belum cukup umur").trim() : "Belum cukup umur",
          StatusDiLuarSasaran: idxStatusLuar !== -1 ? String(r[idxStatusLuar] || "Tidak sesuai sasaran").trim() : "Tidak sesuai sasaran",
          Catatan: idxCatatan !== -1 ? String(r[idxCatatan] || "").trim() : ""
        };
      })
      .filter(x => {
        const aktif = String(x.Aktif || "").trim().toUpperCase();
        const allowed = !aktif || ["YA", "AKTIF", "TRUE", "1"].includes(aktif);
        return x.KodeImunisasi && x.LabelImunisasi && allowed;
      });
  } catch (e) {
    return [];
  }
}

function fetchRefImunData(token) {
  const result = getRefImunisasi(token);
  return Array.isArray(result) ? result : [];
}

function fetchRefImunSimple(token) {
  const sess = _getSessionFromToken_(token);
  if (!sess.ok) return [];

  try {
    const sh = getSheetOrNull_("REF_IMUN");
    if (!sh) return [];

    const data = sh.getDataRange().getValues();
    if (!data || data.length < 2) return [];

    const headers = data[0].map(h => String(h || "").trim());
    const rows = data.slice(1);

    const idxKode = headers.indexOf("KodeImunisasi");
    const idxLabel = headers.indexOf("LabelImunisasi");
    const idxAktif = headers.indexOf("Aktif");

    return rows
      .map(r => ({
        KodeImunisasi: idxKode !== -1 ? String(r[idxKode] || "").trim() : "",
        LabelImunisasi: idxLabel !== -1 ? String(r[idxLabel] || "").trim() : "",
        Aktif: idxAktif !== -1 ? String(r[idxAktif] || "").trim().toUpperCase() : "YA"
      }))
      .filter(x => x.KodeImunisasi && x.LabelImunisasi && (!x.Aktif || x.Aktif === "YA" || x.Aktif === "AKTIF"));
  } catch (e) {
    return [];
  }
}

function debugRefImun(token) {
  const sess = _getSessionFromToken_(token);
  if (!sess.ok) return { ok: false, reason: sess.message || "invalid-session", len: 0, sample: [] };

  try {
    const sh = getSheetOrNull_("REF_IMUN");
    if (!sh) return { ok: false, reason: "sheet-not-found", len: 0, sample: [] };

    const data = sh.getDataRange().getValues();
    const headers = (data[0] || []).map(h => String(h || "").trim());
    const rows = Array.isArray(data) ? data.slice(1, 4) : [];
    const parsed = fetchRefImunData(token);

    return {
      ok: true,
      headers: headers,
      rawRows: rows,
      len: Array.isArray(parsed) ? parsed.length : -1,
      sample: Array.isArray(parsed) ? parsed.slice(0, 3) : parsed,
      tokenSeen: !!token
    };
  } catch (e) {
    return { ok: false, reason: String(e), len: 0, sample: [] };
  }
}


function getWorkflowInbox(dx, token) {
  const sess = _getSessionFromToken_(token);
  if (!sess.ok) return { pendingVerification: [], revisionQueue: [], summary: { pendingVerification: 0, revisionQueue: 0 } };

  try {
    dx = String(dx || '').trim().toUpperCase();
    if (!dx) return { pendingVerification: [], revisionQueue: [], summary: { pendingVerification: 0, revisionQueue: 0 } };

    const sheet = getSheetOrNull_(dx + '_Raw');
    if (!sheet) return { pendingVerification: [], revisionQueue: [], summary: { pendingVerification: 0, revisionQueue: 0 } };

    const data = sheet.getDataRange().getValues();
    if (!data || data.length < 2) return { pendingVerification: [], revisionQueue: [], summary: { pendingVerification: 0, revisionQueue: 0 } };

    const headers = data[0].map(function(h) { return String(h || '').trim(); });
    const rows = data.slice(1);
    const tz = Session.getScriptTimeZone() || 'Asia/Jakarta';

    const idxRecordId = headers.indexOf('ID Registrasi Kasus');
    const idxEpid = headers.indexOf('Nomor EPID');
    const idxNama = headers.indexOf('Nama');
    const idxKel = headers.indexOf('Kelurahan');
    const idxKec = headers.indexOf('Kecamatan');
    const idxKab = headers.indexOf('Kab/Kota Pasien') !== -1 ? headers.indexOf('Kab/Kota Pasien') : headers.indexOf('Kab/Kota');
    const idxTanggal = headers.indexOf('Timestamp');
    const idxStatusVerif = headers.indexOf('Status Verifikasi EPID');
    const idxCatatanVerif = headers.indexOf('Catatan Verifikasi EPID');
    const idxPuskesmasPengampu = headers.indexOf('Puskesmas Pengampu');
    const idxKodePuskesmas = headers.indexOf('KodePuskesmas Pengampu') !== -1 ? headers.indexOf('KodePuskesmas Pengampu') : headers.indexOf('KodePuskesmas');

    const role = String((sess.user && sess.user.role) || '').trim().toLowerCase();
    const userUnit = _normalizeWilayahKey_((sess.user && sess.user.unitKerja) || '');
    const userKode = _normalizeWilayahKey_((sess.user && sess.user.kodePuskesmas) || '');

    const pendingVerification = [];
    const revisionQueue = [];

    rows.forEach(function(r) {
      const statusVerif = idxStatusVerif !== -1 ? String(r[idxStatusVerif] || '').trim() : '';
      const nama = idxNama !== -1 ? String(r[idxNama] || '').trim() : '';
      const recordId = idxRecordId !== -1 ? String(r[idxRecordId] || '').trim() : '';
      const epid = idxEpid !== -1 ? String(r[idxEpid] || '').trim() : '';
      const recordKey = recordId || epid;
      const kel = idxKel !== -1 ? String(r[idxKel] || '').trim() : '';
      const kec = idxKec !== -1 ? String(r[idxKec] || '').trim() : '';
      const kab = idxKab !== -1 ? String(r[idxKab] || '').trim() : '';
      const catatan = idxCatatanVerif !== -1 ? String(r[idxCatatanVerif] || '').trim() : '';
      const pkmPengampu = idxPuskesmasPengampu !== -1 ? _normalizeWilayahKey_(r[idxPuskesmasPengampu]) : '';
      const kodePkmPengampu = idxKodePuskesmas !== -1 ? _normalizeWilayahKey_(r[idxKodePuskesmas]) : '';
      let timestamp = '';
      if (idxTanggal !== -1) {
        const raw = r[idxTanggal];
        timestamp = raw instanceof Date ? Utilities.formatDate(raw, tz, 'yyyy-MM-dd HH:mm') : String(raw || '').trim();
      }
      const item = { recordKey: recordKey, recordId: recordId, epid: epid, nama: nama, kelurahan: kel, kecamatan: kec, kabKota: kab, statusVerifikasi: statusVerif, catatanVerifikasi: catatan, timestamp: timestamp };

      if (role === 'admin' && (!statusVerif || statusVerif === 'Pending')) {
        pendingVerification.push(item);
      }

      const scopeMatch = (userKode && kodePkmPengampu && userKode === kodePkmPengampu) || (userUnit && pkmPengampu && userUnit === pkmPengampu);
      if (statusVerif === 'Perlu Revisi' && (role === 'admin' || scopeMatch)) {
        revisionQueue.push(item);
      }
    });

    return {
      pendingVerification: pendingVerification.slice(0, 8),
      revisionQueue: revisionQueue.slice(0, 8),
      summary: { pendingVerification: pendingVerification.length, revisionQueue: revisionQueue.length }
    };
  } catch (e) {
    return { pendingVerification: [], revisionQueue: [], summary: { pendingVerification: 0, revisionQueue: 0 }, error: String(e) };
  }
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
