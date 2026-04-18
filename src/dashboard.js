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
        perBulan: {},
        perStatusKasus: {},
        qualityCards: { pendingVerification: 0, waitingSampleResult: 0, confirmed: 0, discarded: 0, clinical: 0 },
        statusNotifikasi: dx === "MR" ? { sent: 0, failed: 0, pending: 0 } : null,
        statusSinkronisasi: dx === "MR" ? { synced: 0, failed: 0, pending: 0 } : null
      };
    }

    const { headers, rows } = sheetData;

    // Indeks kolom yang dibutuhkan
    const idxTglPelacakan = headers.indexOf("Tanggal Pelacakan");
    const idxKecamatan = headers.indexOf("Kecamatan");
    const idxStatusNotif = headers.indexOf("Status Notifikasi Telegram");
    const idxStatusSync = headers.indexOf("Status Sinkronisasi Pengampu");
    const idxStatusKasus = headers.indexOf("Status Pasien/Kasus");
    const idxVerifikasi = headers.indexOf("Status Verifikasi EPID");
    const idxSampelDilakukan = headers.indexOf("Pemeriksaan Sampel Dilakukan");
    const idxInterpretasiSampel = headers.indexOf("Interpretasi Hasil Sampel");

    // Hasil agregasi
    let totalKasus = 0;
    const perKecamatan = {};
    const perBulan = {};
    const perStatusKasus = {};
    const qualityCards = {
      pendingVerification: 0,
      waitingSampleResult: 0,
      confirmed: 0,
      discarded: 0,
      clinical: 0
    };
    const statusNotifikasi = idxStatusNotif !== -1 ? { sent: 0, failed: 0, pending: 0 } : null;
    const statusSinkronisasi = idxStatusSync !== -1 ? { synced: 0, failed: 0, pending: 0 } : null;

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

      // Req 6.2: distribusi per kecamatan
      if (idxKecamatan !== -1) {
        const kec = String(row[idxKecamatan] || "").trim();
        if (kec) {
          perKecamatan[kec] = (perKecamatan[kec] || 0) + 1;
        }
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

    return {
      totalKasus: totalKasus,
      perKecamatan: perKecamatan,
      perBulan: perBulan,
      perStatusKasus: perStatusKasus,
      qualityCards: qualityCards,
      statusNotifikasi: statusNotifikasi,
      statusSinkronisasi: statusSinkronisasi
    };

  } catch (e) {
    console.error("[getDashboardStats] Error:", e);
    return { status: "error", message: String(e) };
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
