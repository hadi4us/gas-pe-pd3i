const AUTH_CACHE = CacheService.getScriptCache();

/**
 * Session_Manager — mengelola TTL sesi per role.
 * Req 11.1, 11.2, 11.3, 11.4
 */
const Session_Manager = {
  /**
   * Baca TTL untuk role tertentu dari Config_Manager.
   * Default: admin=1800, petugas=3600, viewer=7200
   * @param {string} role
   * @returns {number} TTL dalam detik
   */
  getTtlForRole: function (role) {
    const defaults = { admin: 1800, petugas: 3600, viewer: 7200 };
    const keyMap = {
      admin: "SESSION_TTL_ADMIN",
      petugas: "SESSION_TTL_PETUGAS",
      viewer: "SESSION_TTL_VIEWER"
    };
    const r = String(role || "").toLowerCase();
    const key = keyMap[r];
    if (key) {
      try {
        const val = parseInt(Config_Manager.getConfig(key), 10);
        if (!isNaN(val) && val > 0) return val;
      } catch (e) {
        // Config_Manager belum tersedia, gunakan default
      }
    }
    return defaults[r] || 1800;
  },

  /**
   * Perbarui token di AUTH_CACHE dengan TTL dari sessionObj.ttl.
   * @param {string} token
   * @param {Object} sessionObj - objek sesi yang sudah memiliki field ttl
   */
  refreshToken: function (token, sessionObj) {
    const ttl = sessionObj && sessionObj.ttl ? sessionObj.ttl : 1800;
    AUTH_CACHE.put("TOKEN_" + token, JSON.stringify(sessionObj), ttl);
  }
};

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function getSpreadsheet_() {
  // Req 5.3: baca dari Config_Manager, fallback ke nilai hardcoded sebagai safety net
  const id = Config_Manager.getConfig("SPREADSHEET_ID") || "1ck-98iYBxvNrHV7NxgcBSwiMxzmJ2zORVA93xuT9hIs";
  return SpreadsheetApp.openById(id);
}

function getSheetOrNull_(sheetName) {
  return getSpreadsheet_().getSheetByName(sheetName);
}

function getSheetOrThrow_(sheetName) {
  const sheet = getSheetOrNull_(sheetName);
  if (!sheet) throw new Error("Sheet tidak ditemukan: " + sheetName);
  return sheet;
}

function getTrimmedHeaders_(sheet) {
  const lastCol = sheet.getLastColumn();
  if (lastCol < 1) return [];
  return sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(h => String(h || "").trim());
}

function responseJSON(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function _getSessionFromToken_(token) {
  token = String(token || "").trim();
  if (!token) return { ok: false, message: "Token kosong." };

  const raw = AUTH_CACHE.get("TOKEN_" + token);
  if (!raw) return { ok: false, message: "Sesi habis. Silakan login ulang." };

  let obj = null;
  try {
    obj = JSON.parse(raw);
  } catch (e) {
    obj = null;
  }

  if (!obj || !obj.user) {
    return { ok: false, message: "Sesi tidak valid." };
  }

  // Req 11.3 & 11.4: gunakan TTL dari objek sesi; fallback ke getTtlForRole jika tidak ada
  const ttl = obj.ttl || Session_Manager.getTtlForRole(obj.user && obj.user.role);
  AUTH_CACHE.put("TOKEN_" + token, JSON.stringify(obj), ttl);
  return { ok: true, user: obj.user };
}

function _normalizeKabKotaCode_(name) {
  return String(name || "")
    .trim()
    .toUpperCase()
    .replace(/^KAB\.?\s*/i, "KAB_")
    .replace(/^KOTA\s*/i, "KOTA_")
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
}

/**
 * Generate nomor EPID unik per DX.
 * Req 4.1: baca hanya kolom "Nomor EPID" (bukan getDataRange())
 * Req 4.2: gunakan cache sequence terakhir per DX dan kode wilayah — kunci EPID_SEQ_{DX}_{kodeWilayah}
 * Req 4.3: jika cache tidak tersedia, baca kolom EPID dari sheet dan bangun ulang cache
 * Req 4.4: gunakan LockService untuk mencegah duplikat saat request bersamaan
 */
function generateEpid_(dx, data) {
  dx = String(dx || "PD3I").trim().toUpperCase();
  const tz = Session.getScriptTimeZone() || "Asia/Jakarta";

  if (dx === "MR") {
    data = data || {};
    const yy = Utilities.formatDate(new Date(), tz, "yy");
    const domisiliRaw = String(data["Kab/Kota Pasien"] || data["Kab/Kota"] || "").trim();
    const domisiliCode = _normalizeKabKotaCode_(domisiliRaw);
    const isDepok = domisiliCode === "KOTADEPOK" || domisiliCode === "DEPOK";
    const kodeWilayah = isDepok ? ("DEPOK_" + yy) : (domisiliCode || "LUAR_KOTA");

    // Req 4.4: gunakan LockService
    const lock = LockService.getScriptLock();
    try {
      lock.waitLock(10000);
    } catch (e) {
      throw new Error("generateEpid_: gagal mendapatkan lock: " + e);
    }

    try {
      const sheet = getSheetOrThrow_("MR_Raw");
      const headers = getTrimmedHeaders_(sheet);
      const idxEpid = headers.indexOf("Nomor EPID");
      if (idxEpid === -1) throw new Error("Kolom 'Nomor EPID' belum ada di sheet MR_Raw");

      // Req 4.2: cek cache sequence — kunci EPID_SEQ_{DX}_{kodeWilayah}
      const cacheKey = "EPID_SEQ_MR_" + kodeWilayah;
      let maxSeq = 0;
      let seqFromCache = false;

      try {
        const cached = CacheService.getScriptCache().get(cacheKey);
        if (cached !== null) {
          const parsed = parseInt(cached, 10);
          if (!isNaN(parsed) && parsed >= 0) {
            maxSeq = parsed;
            seqFromCache = true;
          }
        }
      } catch (e) {
        // cache tidak tersedia, lanjut baca sheet
      }

      // Req 4.3: jika cache tidak tersedia, baca hanya kolom EPID dari sheet
      if (!seqFromCache) {
        const lastRow = sheet.getLastRow();
        if (lastRow >= 2) {
          // Req 4.1: baca hanya kolom "Nomor EPID"
          const epidValues = sheet.getRange(2, idxEpid + 1, lastRow - 1, 1).getValues();
          for (var ei = 0; ei < epidValues.length; ei++) {
            var epid = String(epidValues[ei][0] || "").trim();
            if (isDepok) {
              var mDepok = epid.match(/^C-1022(\d{2})(\d{3,})$/i);
              if (mDepok && mDepok[1] === yy) {
                var seqDepok = Number(mDepok[2] || 0);
                if (seqDepok > maxSeq) maxSeq = seqDepok;
              }
            } else {
              var escapedCode = kodeWilayah.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
              var pattern = new RegExp("^C-" + escapedCode + "-(\\d{3,})$", "i");
              var mCity = epid.match(pattern);
              if (mCity) {
                var seqCity = Number(mCity[1] || 0);
                if (seqCity > maxSeq) maxSeq = seqCity;
              }
            }
          }
        }
      }

      var nextSeq = maxSeq + 1;
      var nextSeqStr = String(nextSeq).padStart(3, "0");

      // Req 4.2: simpan sequence baru ke cache (TTL 300 detik)
      try {
        CacheService.getScriptCache().put(cacheKey, String(nextSeq), 300);
      } catch (e) {
        // gagal simpan cache, tidak kritis
      }

      if (isDepok) return "C-1022" + yy + nextSeqStr;
      return "C-" + kodeWilayah + "-" + nextSeqStr;

    } finally {
      lock.releaseLock();
    }
  }

  const stamp = Utilities.formatDate(new Date(), tz, "yyyyMMddHHmmss");
  const rand = Math.floor(100 + Math.random() * 900);
  return dx + "-" + stamp + "-" + rand;
}
