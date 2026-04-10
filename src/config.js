/**
 * config.js — Config_Manager
 * Membaca dan menyimpan konfigurasi sensitif via PropertiesService.
 *
 * Kunci yang dikelola:
 *   TELEGRAM_BOT_TOKEN  — menggantikan konstanta TELEGRAM_PD3I_BOT_TOKEN
 *   TELEGRAM_CHAT_ID    — menggantikan konstanta TELEGRAM_PD3I_CHAT_ID
 *   SPREADSHEET_ID      — menggantikan konstanta SPREADSHEET_ID
 *   CACHE_TTL_SEC       — TTL cache dalam detik (default 60)
 *   SESSION_TTL_ADMIN   — TTL sesi admin dalam detik (default 1800)
 *   SESSION_TTL_PETUGAS — TTL sesi petugas dalam detik (default 3600)
 *   SESSION_TTL_VIEWER  — TTL sesi viewer dalam detik (default 7200)
 */

const Config_Manager = (function () {
  /**
   * Daftar kunci yang dikelola Config_Manager.
   * Digunakan untuk validasi pada setupConfig.
   */
  const MANAGED_KEYS = [
    "TELEGRAM_BOT_TOKEN",
    "TELEGRAM_CHAT_ID",
    "SPREADSHEET_ID",
    "CACHE_TTL_SEC",
    "SESSION_TTL_ADMIN",
    "SESSION_TTL_PETUGAS",
    "SESSION_TTL_VIEWER"
  ];

  /**
   * Baca nilai konfigurasi dari PropertiesService.
   * Jika kunci tidak ditemukan, catat error ke console.error dan kembalikan string kosong.
   * TIDAK melempar exception.
   *
   * @param {string} key - Kunci konfigurasi
   * @returns {string} Nilai konfigurasi atau string kosong jika tidak ada
   */
  function getConfig(key) {
    try {
      key = String(key || "").trim();
      if (!key) {
        console.error("[Config_Manager] getConfig dipanggil dengan kunci kosong.");
        return "";
      }

      const props = PropertiesService.getScriptProperties();
      const value = props.getProperty(key);

      if (value === null || value === undefined) {
        console.error("[Config_Manager] Kunci konfigurasi tidak ditemukan: " + key);
        return "";
      }

      return value;
    } catch (e) {
      console.error("[Config_Manager] Error saat membaca konfigurasi '" + key + "': " + e);
      return "";
    }
  }

  /**
   * Simpan konfigurasi ke PropertiesService.
   * Hanya dapat dipanggil oleh pengguna dengan role admin.
   *
   * @param {string} token - Token sesi admin
   * @param {Object} configMap - Objek key-value konfigurasi yang akan disimpan
   * @returns {{status: string, saved: string[], message?: string}}
   */
  function setupConfig(token, configMap) {
    try {
      // Validasi token admin via _requireAdminFromToken_ dari routes.js
      _requireAdminFromToken_(token);
    } catch (e) {
      return { status: "error", message: String(e) };
    }

    try {
      if (!configMap || typeof configMap !== "object") {
        return { status: "error", message: "configMap harus berupa objek." };
      }

      const props = PropertiesService.getScriptProperties();
      const saved = [];

      Object.keys(configMap).forEach(function (key) {
        const val = configMap[key];
        // Hanya simpan kunci yang dikelola
        if (MANAGED_KEYS.indexOf(key) === -1) {
          console.error("[Config_Manager] setupConfig: kunci tidak dikenal diabaikan: " + key);
          return;
        }
        props.setProperty(key, String(val));
        saved.push(key);
      });

      return { status: "success", saved: saved };
    } catch (e) {
      return { status: "error", message: String(e) };
    }
  }

  return {
    getConfig: getConfig,
    setupConfig: setupConfig
  };
})();

/**
 * Alias global untuk kemudahan akses dari modul lain.
 * Dipanggil oleh cache.js, utils.js, routes.js, dll.
 *
 * @param {string} key
 * @returns {string}
 */
function getConfig(key) {
  return Config_Manager.getConfig(key);
}

/**
 * Fungsi admin yang dapat dipanggil dari frontend via google.script.run.
 *
 * @param {string} token
 * @param {Object} configMap
 * @returns {{status: string, saved: string[], message?: string}}
 */
function setupConfig(token, configMap) {
  return Config_Manager.setupConfig(token, configMap);
}
