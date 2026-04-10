/**
 * audit.js — Audit_Logger
 * Mencatat setiap INSERT/UPDATE/LOGOUT ke sheet AUDIT_LOG.
 * Req 10.1, 10.2, 10.3, 10.4, 10.5, 10.6
 */

const AUDIT_SHEET_NAME = "AUDIT_LOG";
const AUDIT_HEADERS = [
  "Timestamp",
  "Username",
  "Role",
  "DX",
  "Nomor EPID",
  "Aksi",
  "Ringkasan Perubahan"
];

/**
 * Ambil atau buat sheet AUDIT_LOG.
 * Jika baru dibuat, tambahkan header dan terapkan proteksi.
 * @returns {GoogleAppsScript.Spreadsheet.Sheet}
 */
function _getOrCreateAuditSheet_() {
  const ss = getSpreadsheet_();
  let sheet = ss.getSheetByName(AUDIT_SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(AUDIT_SHEET_NAME);
    sheet.appendRow(AUDIT_HEADERS);

    // Req 10.6: proteksi sheet agar tidak diedit sembarangan
    // Gunakan setWarningOnly(true) karena GAS tidak bisa set editor ke akun spesifik
    // tanpa OAuth scope tambahan (https://developers.google.com/apps-script/reference/spreadsheet/protection)
    try {
      sheet.protect()
        .setDescription("AUDIT_LOG — hanya admin")
        .setWarningOnly(true);
    } catch (e) {
      console.error("Audit: gagal menerapkan proteksi sheet AUDIT_LOG:", e);
    }
  }

  return sheet;
}

/**
 * Tulis satu baris ke AUDIT_LOG.
 * Req 10.4: jika gagal, catat ke console.error tanpa menghentikan operasi utama.
 * @param {Array} row
 */
function _appendAuditRow_(row) {
  try {
    const sheet = _getOrCreateAuditSheet_();
    sheet.appendRow(row);
  } catch (e) {
    console.error("Audit: gagal mencatat ke AUDIT_LOG:", e);
  }
}

/**
 * Audit_Logger — objek global untuk pencatatan audit.
 */
const Audit_Logger = {
  /**
   * Catat operasi INSERT atau UPDATE ke AUDIT_LOG.
   * Req 10.1, 10.2
   *
   * @param {Object} user   - objek user { username, role }
   * @param {string} dx     - kode penyakit (MR, DIF, PERT, TN, AFP)
   * @param {string} epid   - nomor EPID
   * @param {string} aksi   - "INSERT" atau "UPDATE"
   * @param {Object|null} diff - untuk UPDATE: { fieldName: { old: val, new: val } }
   */
  logChange: function (user, dx, epid, aksi, diff) {
    try {
      const tz = Session.getScriptTimeZone() || "Asia/Jakarta";
      const timestamp = Utilities.formatDate(new Date(), tz, "yyyy-MM-dd HH:mm:ss");
      const username = user && user.username ? String(user.username) : "";
      const role = user && user.role ? String(user.role) : "";
      const ringkasan = (aksi === "UPDATE" && diff && typeof diff === "object")
        ? JSON.stringify(diff)
        : "";

      _appendAuditRow_([
        timestamp,
        username,
        role,
        String(dx || ""),
        String(epid || ""),
        String(aksi || ""),
        ringkasan
      ]);
    } catch (e) {
      console.error("Audit.logChange: error tidak terduga:", e);
    }
  },

  /**
   * Catat operasi LOGOUT ke AUDIT_LOG.
   * Req 10.3
   *
   * @param {Object} user - objek user { username, role }
   */
  logLogout: function (user) {
    try {
      const tz = Session.getScriptTimeZone() || "Asia/Jakarta";
      const timestamp = Utilities.formatDate(new Date(), tz, "yyyy-MM-dd HH:mm:ss");
      const username = user && user.username ? String(user.username) : "";
      const role = user && user.role ? String(user.role) : "";

      _appendAuditRow_([
        timestamp,
        username,
        role,
        "",   // DX tidak relevan untuk LOGOUT
        "",   // EPID tidak relevan untuk LOGOUT
        "LOGOUT",
        ""
      ]);
    } catch (e) {
      console.error("Audit.logLogout: error tidak terduga:", e);
    }
  }
};

/**
 * Kembalikan riwayat perubahan untuk EPID tertentu.
 * Req 10.5: hanya role admin yang boleh memanggil fungsi ini.
 *
 * @param {string} dx    - kode penyakit (opsional, filter tambahan)
 * @param {string} epid  - nomor EPID yang dicari
 * @param {string} token - token sesi pengguna
 * @returns {Array<Object>|{status: string, message: string}}
 */
function getAuditLog(dx, epid, token) {
  try {
    const sess = _getSessionFromToken_(token);
    if (!sess.ok) {
      return { status: "error", message: sess.message || "Sesi tidak valid." };
    }

    if (!sess.user || sess.user.role !== "admin") {
      return { status: "error", message: "Akses ditolak. Hanya admin yang dapat melihat audit log." };
    }

    const sheet = getSheetOrNull_(AUDIT_SHEET_NAME);
    if (!sheet) {
      return [];
    }

    const lastRow = sheet.getLastRow();
    if (lastRow < 2) {
      return [];
    }

    const data = sheet.getRange(1, 1, lastRow, AUDIT_HEADERS.length).getValues();
    const headers = data[0].map(h => String(h || "").trim());

    const idxTimestamp = headers.indexOf("Timestamp");
    const idxUsername  = headers.indexOf("Username");
    const idxRole      = headers.indexOf("Role");
    const idxDx        = headers.indexOf("DX");
    const idxEpid      = headers.indexOf("Nomor EPID");
    const idxAksi      = headers.indexOf("Aksi");
    const idxRingkasan = headers.indexOf("Ringkasan Perubahan");

    const epidFilter = String(epid || "").trim().toLowerCase();
    const dxFilter   = String(dx || "").trim().toUpperCase();

    const results = [];
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const rowEpid = String(idxEpid !== -1 ? row[idxEpid] : "").trim().toLowerCase();
      const rowDx   = String(idxDx !== -1 ? row[idxDx] : "").trim().toUpperCase();

      if (epidFilter && rowEpid !== epidFilter) continue;
      if (dxFilter && rowDx !== dxFilter) continue;

      results.push({
        timestamp:          idxTimestamp !== -1 ? String(row[idxTimestamp] || "") : "",
        username:           idxUsername  !== -1 ? String(row[idxUsername]  || "") : "",
        role:               idxRole      !== -1 ? String(row[idxRole]      || "") : "",
        dx:                 idxDx        !== -1 ? String(row[idxDx]        || "") : "",
        epid:               idxEpid      !== -1 ? String(row[idxEpid]      || "") : "",
        aksi:               idxAksi      !== -1 ? String(row[idxAksi]      || "") : "",
        ringkasanPerubahan: idxRingkasan !== -1 ? String(row[idxRingkasan] || "") : ""
      });
    }

    return results;
  } catch (e) {
    console.error("getAuditLog: error:", e);
    return { status: "error", message: String(e) };
  }
}
