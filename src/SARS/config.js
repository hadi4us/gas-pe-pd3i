/******************************************************
 * config.gs — Konfigurasi terpusat SARS-PD3I Depok (FINAL)
 * Tujuan:
 * - Hindari duplikasi const (TZ, SHEET_MASTER, dll.)
 * - Semua file lain membaca dari SARS_CONFIG
 * - Konsisten & mudah dipindah project
 *
 * Update penting:
 * - Deadline pelaporan: ✅ Senin 23:59 WIB (end-of-day)
 * - APP_URL konsisten (dipakai main_app.gs untuk inject APP_URL)
 * - URL Sites + CONTACT_WA (dipakai reminder email)
 * - Jenis fasyankes: RS, KLINIK, TPMD, PMB, LAIN (form + dashboard)
 * - Dashboard: weeks 52/53 mengikuti epi_week.gs (fallback 52)
 ******************************************************/

// Namespace global (hindari redeclare)
var SARS_CONFIG = (typeof SARS_CONFIG !== "undefined" && SARS_CONFIG) ? SARS_CONFIG : {};

/** Inisialisasi default (tidak overwrite jika sudah ada) */
(function initConfig_() {
  // ====== IDENTITAS PROJECT ======
  if (!SARS_CONFIG.APP_NAME) SARS_CONFIG.APP_NAME = "SARS-PD3I Depok";
  if (!SARS_CONFIG.TIMEZONE) SARS_CONFIG.TIMEZONE = "Asia/Jakarta";
  if (!SARS_CONFIG.DATE_FMT) SARS_CONFIG.DATE_FMT = "dd/MM/yyyy";
  if (!SARS_CONFIG.DATETIME_FMT) SARS_CONFIG.DATETIME_FMT = "dd/MM/yyyy HH:mm:ss";

  // ====== APP URL (DISARANKAN DIISI AGAR KONSISTEN) ======
  if (!SARS_CONFIG.APP_URL) {
    try {
      SARS_CONFIG.APP_URL = ScriptApp.getService().getUrl() || "";
    } catch (e) {
      SARS_CONFIG.APP_URL = "";
    }
  }

  // ====== URL SITES (UNTUK REMINDER EMAIL + REDIRECT) ======
  if (!SARS_CONFIG.SITES_FORM_URL) {
    SARS_CONFIG.SITES_FORM_URL = "https://www.surveilans-dinkesdepok.org/pelaporan-pd3i/surveilans-aktif-weekly";
  }
  if (!SARS_CONFIG.SITES_DASHBOARD_URL) {
    SARS_CONFIG.SITES_DASHBOARD_URL = "https://www.surveilans-dinkesdepok.org/dashboard?authuser=0";
  }
  if (!SARS_CONFIG.CONTACT_WA) {
    SARS_CONFIG.CONTACT_WA = "081318096096"; // Nurhadi
  }

  // ====== SPREADSHEET (WAJIB) ======
  if (!SARS_CONFIG.SPREADSHEET_ID) {
    try {
      SARS_CONFIG.SPREADSHEET_ID = Config_Manager.getConfig("SPREADSHEET_ID") || "1ck-98iYBxvNrHV7NxgcBSwiMxzmJ2zORVA93xuT9hIs";
    } catch (e2) {
      SARS_CONFIG.SPREADSHEET_ID = "1ck-98iYBxvNrHV7NxgcBSwiMxzmJ2zORVA93xuT9hIs";
    }
  }

  // ====== NAMA SHEET ======
  if (!SARS_CONFIG.SHEET_MASTER) SARS_CONFIG.SHEET_MASTER = "REF_FASKES";
  if (!SARS_CONFIG.SHEET_PENGAMPU) SARS_CONFIG.SHEET_PENGAMPU = "REF_PENGAMPU";
  // Canonical Zero Reporting data sheet.
  if (!SARS_CONFIG.SHEET_DATA) SARS_CONFIG.SHEET_DATA = "SARS";
  if (!SARS_CONFIG.SHEET_WHITELIST) SARS_CONFIG.SHEET_WHITELIST = "USER_WHITELIST";
  if (!SARS_CONFIG.SHEET_LOG_REMINDER) SARS_CONFIG.SHEET_LOG_REMINDER = "LOG_REMINDER";
  if (!SARS_CONFIG.SHEET_PARAMETERS) SARS_CONFIG.SHEET_PARAMETERS = "Parameters"; // optional

  // ====== MASTER DATA (kolom referensi) ======
  if (!SARS_CONFIG.MASTER_COLS) {
    SARS_CONFIG.MASTER_COLS = {
      NAME: "Nama Faskes",
      TYPE: "Jenis",          // RS/KLINIK/TPMD/PMB/LAIN (disarankan uppercase di master)
      PENGAMPU: "Pengampu",
      KEC: "Kecamatan",       // opsional
      KEL: "Kelurahan"        // opsional
    };
  }

  // ====== JENIS FASYANKES (FORM + DASHBOARD) ======
  if (!SARS_CONFIG.FASKES_TYPES) {
    SARS_CONFIG.FASKES_TYPES = [
      { key: "RS", label: "Rumah Sakit" },
      { key: "KLINIK", label: "Klinik" },
      { key: "TPMD", label: "TPMD (Praktik Mandiri Dokter)" },
      { key: "PMB", label: "PMB (Praktik Mandiri Bidan)" },
      { key: "LAIN", label: "Lainnya" }
    ];
  }

  /**
   * Mapping agar input dari form (rs/klinik/tpmd/pmb/lain) atau variasi penulisan
   * bisa diseragamkan menjadi key dashboard/server (RS/KLINIK/TPMD/PMB/LAIN).
   * NOTE: key di sini DISARANKAN lowercase saja karena normalize pakai toLowerCase().
   */
  if (!SARS_CONFIG.FASKES_TYPE_MAP) {
    SARS_CONFIG.FASKES_TYPE_MAP = {
      "rs": "RS",
      "rumahsakit": "RS",
      "rumah sakit": "RS",

      "klinik": "KLINIK",

      "tpmd": "TPMD",
      "praktik mandiri dokter": "TPMD",

      "pmb": "PMB",
      "praktik mandiri bidan": "PMB",

      "lain": "LAIN",
      "lainnya": "LAIN",

      "all": "ALL"
    };
  }

  // ====== RULE PELAPORAN ======
  if (!SARS_CONFIG.REPORTING) {
    SARS_CONFIG.REPORTING = {
      WEEK_START_DAY: 0,  // Minggu
      WEEK_END_DAY: 6,    // Sabtu

      // ✅ DEADLINE BARU: Senin 23:59 WIB (end-of-day)
      DEADLINE_DAY: 1,    // Senin
      DEADLINE_HOUR: 23,
      DEADLINE_MINUTE: 59,

      DEFAULT_FORM_WEEK_IS_PREVIOUS: true
    };
  } else {
    // kalau sudah ada REPORTING, tetap pastikan default baru terisi (tanpa overwrite yang user set manual)
    if (SARS_CONFIG.REPORTING.DEADLINE_DAY === undefined) SARS_CONFIG.REPORTING.DEADLINE_DAY = 1;
    if (SARS_CONFIG.REPORTING.DEADLINE_HOUR === undefined) SARS_CONFIG.REPORTING.DEADLINE_HOUR = 23;
    if (SARS_CONFIG.REPORTING.DEADLINE_MINUTE === undefined) SARS_CONFIG.REPORTING.DEADLINE_MINUTE = 59;
  }

  // ====== DASHBOARD SETTINGS ======
  if (!SARS_CONFIG.DASHBOARD) {
    SARS_CONFIG.DASHBOARD = {
      DEFAULT_YEAR: "",

      // fallback saja bila meta minggu gagal
      WEEKS_PER_YEAR_FALLBACK: 52,

      DEFAULT_FASKES_TYPE: "ALL",   // ALL/RS/KLINIK/TPMD/PMB/LAIN
      DEFAULT_PENGAMPU: "all"
    };
  }

  // ====== REMINDER SETTINGS (untuk teks + batching) ======
  // Jadwal trigger TIDAK ditaruh di config (karena trigger dipasang oleh installReminderWaveTriggers()).
  if (!SARS_CONFIG.REMINDER) {
    SARS_CONFIG.REMINDER = {
      SUBJECT_PREFIX: "🔔 Reminder Laporan SARS-PD3I"
    };
  }

  // (Opsional) pengaturan batching reminder agar mudah tuning tanpa edit setup_reminder.gs
  if (!SARS_CONFIG.REMINDER_BATCH) {
    SARS_CONFIG.REMINDER_BATCH = {
      BATCH_SIZE: 60,               // 30–80 umumnya aman
      NEXT_BATCH_DELAY_MIN: 3,      // menit
      MAX_CONSEC_FAILS: 10
    };
  }

  // ====== DEBUG ======
  if (SARS_CONFIG.DEBUG === undefined) SARS_CONFIG.DEBUG = false;
})();

/* ======================================================
   Helper konfigurasi — aman dipanggil file lain
   ====================================================== */

function getSarsConfig() {
  return JSON.parse(JSON.stringify(SARS_CONFIG));
}

function getSarsSpreadsheetId() {
  return String(SARS_CONFIG.SPREADSHEET_ID || "").trim();
}

function getSarsTimezone() {
  return SARS_CONFIG.TIMEZONE || "Asia/Jakarta";
}

function getSarsAppUrl() {
  const u = String(SARS_CONFIG.APP_URL || "").trim();
  if (u) return u;
  try { return ScriptApp.getService().getUrl() || ""; } catch (e) { return ""; }
}

function getSitesFormUrl() {
  return String(SARS_CONFIG.SITES_FORM_URL || "").trim();
}

function getSitesDashboardUrl() {
  return String(SARS_CONFIG.SITES_DASHBOARD_URL || "").trim();
}

function getContactWa_() {
  return String(SARS_CONFIG.CONTACT_WA || "").trim();
}

function openSarsSpreadsheet() {
  const id = getSarsSpreadsheetId();
  if (!id) throw new Error("SARS_CONFIG.SPREADSHEET_ID belum diisi.");
  return SpreadsheetApp.openById(id);
}

function getSheetByNameSafe_(ss, name) {
  const sh = ss.getSheetByName(name);
  if (!sh) throw new Error('Sheet "' + name + '" tidak ditemukan.');
  return sh;
}

/**
 * Normalisasi jenis fasyankes agar konsisten (output uppercase key)
 * contoh: "tpmd" -> "TPMD"
 */
function normalizeFaskesType_(v) {
  const raw = String(v || "").trim();
  if (!raw) return "";
  const k = raw.toLowerCase();
  const map = SARS_CONFIG.FASKES_TYPE_MAP || {};
  return map[k] ? map[k] : raw.toUpperCase();
}

/**
 * (Opsional) util format tanggal konsisten
 */
function sarsFmtDate_(date, fmt) {
  if (!date) return "";
  const d = (date instanceof Date) ? date : new Date(date);
  if (isNaN(d)) return "";
  return Utilities.formatDate(d, getSarsTimezone(), fmt || SARS_CONFIG.DATE_FMT);
}

/**
 * (Opsional) logger debug
 */
function sarsLogDebug_() {
  if (!SARS_CONFIG.DEBUG) return;
  // eslint-disable-next-line no-console
  console.log.apply(console, arguments);
}
