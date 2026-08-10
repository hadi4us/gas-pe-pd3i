/******************************************************
 * dashboard_sars.gs — DATA API Dashboard SARS (FINAL)
 * Kompatibel struktur spreadsheet terbaru:
 * - REF_FASKES: KodePuskesmas, NamaFaskes, Jenis, Pengampu, Email, StatusAktif, Alias, ...
 * - SARS  : Waktu Submit, Email Petugas, ME, ..., Jenis Fasyankes, Nama Fasyankes, ...,
 *               Deadline, OnTime, FaskesPengampu, FaskesKey
 *
 * FIX UTAMA (awal Januari / ME 52-53):
 * ✅ EpiYear BARIS DATA ditentukan dari:
 *    - getEpidWeek(Waktu Submit) => (submitYear, submitWeek)
 *    - nilai ME (minggu laporan)
 *    -> jika submitWeek=1/2 dan ME=52/53 => epiYear = submitYear-1
 * ✅ Weeks 52/53 mengikuti weeksInEpiYear(epiYear) (epi_week.gs) fallback 52
 * ✅ NORMALISASI FaskesKey (MASTER & DATA) => huruf/angka uppercase saja
 *    -> ini memperbaiki kasus "1 faskes sudah lapor tapi tidak terhitung"
 *       karena FaskesKey bisa beda format (spasi/karakter tersembunyi)
 * ✅ Mapping Nama Fasyankes -> REF_FASKES.FaskesKey via NamaFaskes + Alias (fallback)
 * ✅ OnTime: pakai kolom OnTime jika ada; kalau kosong/tdk ada, hitung dari deadline (Senin 23:59 WIB) bila helper range tersedia
 *
 * Catatan:
 * - Tidak boleh ada doGet() di file ini.
 ******************************************************/

/** ======================= KONFIG ======================= */
function sarsDash_cfg_() {
  const tz = (typeof getSarsTimezone === "function") ? getSarsTimezone() : "Asia/Jakarta";

  const ssid = (typeof getSarsSpreadsheetId === "function")
    ? String(getSarsSpreadsheetId() || "").trim()
    : String((typeof SARS_CONFIG !== "undefined" && SARS_CONFIG && SARS_CONFIG.SPREADSHEET_ID) ? SARS_CONFIG.SPREADSHEET_ID : "").trim();

  const sheetMaster = (typeof SARS_CONFIG !== "undefined" && SARS_CONFIG && SARS_CONFIG.SHEET_MASTER) ? SARS_CONFIG.SHEET_MASTER : "REF_FASKES";
  const sheetData   = (typeof SARS_CONFIG !== "undefined" && SARS_CONFIG && SARS_CONFIG.SHEET_DATA)   ? SARS_CONFIG.SHEET_DATA   : "SARS";

  // deadline: ambil dari config.gs (sudah Anda ubah ke Senin 23:59 WIB)
  const dlHour = (typeof SARS_CONFIG !== "undefined" && SARS_CONFIG && SARS_CONFIG.REPORTING && SARS_CONFIG.REPORTING.DEADLINE_HOUR !== undefined)
    ? Number(SARS_CONFIG.REPORTING.DEADLINE_HOUR) : 23;
  const dlMin = (typeof SARS_CONFIG !== "undefined" && SARS_CONFIG && SARS_CONFIG.REPORTING && SARS_CONFIG.REPORTING.DEADLINE_MINUTE !== undefined)
    ? Number(SARS_CONFIG.REPORTING.DEADLINE_MINUTE) : 59;

  return { tz, ssid, sheetMaster, sheetData, dlHour, dlMin };
}

function sarsDash_dataSheet_(ss) {
  const cfg = sarsDash_cfg_();
  const preferred = [String(cfg.sheetData || '').trim(), 'SARS', 'DATA_SARS'];
  for (const name of [...new Set(preferred)].filter(Boolean)) {
    const sh = ss.getSheetByName(name);
    if (!sh || sh.getLastRow() < 1) continue;
    const headers = sh.getRange(1, 1, 1, Math.min(sh.getLastColumn(), 30)).getDisplayValues()[0].map(sarsDash_clean_);
    const hasSubmit = headers.some(h => ['WAKTU SUBMIT','WAKTUSUBMIT','TIMESTAMP'].includes(String(h).toUpperCase()));
    const hasMe = headers.some(h => ['ME','MINGGU EPID','MINGGUEPID','MINGGU EPIDEMIOLOGI'].includes(String(h).toUpperCase()));
    if (hasSubmit && hasMe) return name;
  }
  return String(cfg.sheetData || 'SARS').trim();
}

function sarsDash_open_() {
  if (typeof openSarsSpreadsheet === "function") return openSarsSpreadsheet();
  const cfg = sarsDash_cfg_();
  if (!cfg.ssid) throw new Error("SPREADSHEET_ID belum diset (config.gs).");
  return SpreadsheetApp.openById(cfg.ssid);
}

/** ======================= UTIL ======================= */
function sarsDash_clean_(v) {
  if (v === null || v === undefined) return "";
  return String(v)
    .replace(/[\u2018\u2019`‘’]/g, "'")
    .replace(/[\u201C\u201D“”]/g, '"')
    .replace(/\u00A0/g, " ")
    .trim();
}

function sarsDash_stripQuotes_(v) {
  return String(v == null ? "" : v).replace(/^["']+|["']+$/g, "").trim();
}

/** Normalisasi key/nama: hanya A-Z0-9 uppercase */
function sarsDash_normKey_(v) {
  return sarsDash_clean_(v).toUpperCase().replace(/[^A-Z0-9]/g, "");
}

/** Normalisasi FaskesKey: alias ke normKey (biar konsisten MASTER & DATA) */
function sarsDash_normFaskesKey_(v) {
  return sarsDash_normKey_(v);
}

function sarsDash_pickIndex_(headers, candidates) {
  const norm = (s) => sarsDash_clean_(s).toLowerCase();
  const H = (headers || []).map(norm);
  for (let i = 0; i < candidates.length; i++) {
    const idx = H.indexOf(norm(candidates[i]));
    if (idx >= 0) return idx;
  }
  return -1;
}

function sarsDash_toWeek_(v) {
  if (v === null || v === undefined || v === "") return NaN;
  if (typeof v === "number") return Math.floor(v);
  const s = sarsDash_clean_(v);
  const m = s.match(/(\d{1,2})/);
  if (m) return Number(m[1]);
  const n = Number(s);
  return isFinite(n) ? n : NaN;
}

function sarsDash_toDate_(v) {
  if (!v) return null;
  if (v instanceof Date && !isNaN(v.getTime())) return v;
  const d = new Date(v);
  if (isNaN(d.getTime())) return null;
  return d;
}

function sarsDash_normJenis_(v) {
  const s = sarsDash_clean_(v).toUpperCase();
  if (!s) return "";
  if (s === "PKM" || s === "PUSKESMAS" || s.indexOf("PUSKESMAS") !== -1) return "PKM";
  if (s === "RUMAH SAKIT") return "RS";
  if (s === "RS") return "RS";
  if (s === "KLINIK") return "KLINIK";
  if (s === "TPMD" || s === "PRAKTIK MANDIRI DOKTER" || s === "PRAKTEK MANDIRI DOKTER") return "TPMD";
  if (s === "PMB" || s === "PRAKTIK MANDIRI BIDAN" || s === "PRAKTEK MANDIRI BIDAN") return "PMB";
  if (s === "LAIN" || s === "LAINNYA") return "LAIN";
  return s;
}

function sarsDash_normJenisFilter_(v) {
  const s = sarsDash_clean_(v).toUpperCase();
  if (!s || s === "ALL" || s === "SEMUA") return "ALL";
  return sarsDash_normJenis_(s);
}

function sarsDash_round1_(n) {
  const x = Number(n || 0);
  return Math.round(x * 10) / 10;
}

function sarsDash_parseOnTime_(v) {
  if (v === true) return true;
  if (v === false) return false;
  const s = sarsDash_clean_(v).toUpperCase();
  if (!s) return false;
  if (["TRUE","T","YA","Y","YES","ON","ONTIME","ON TIME","TEPAT","TEPAT WAKTU","1"].indexOf(s) >= 0) return true;
  if (["FALSE","F","TIDAK","TDK","NO","N","OFF","0","TERLAMBAT"].indexOf(s) >= 0) return false;
  const n = Number(s);
  return isFinite(n) ? (n === 1) : false;
}

/** ======================= EPI HELPERS (epi_week.gs) ======================= */
function sarsDash_weeksInYear_(epiYear) {
  try {
    if (typeof weeksInEpiYear === "function") {
      const w = Number(weeksInEpiYear(Number(epiYear)));
      if (isFinite(w) && (w === 52 || w === 53)) return w;
    }
  } catch (e) {}
  return 52;
}

/**
 * Infer epiYear untuk satu baris SARS.
 * Patch awal Januari:
 * - jika submitWeek 1/2 tapi ME 52/53 => itu epiYear sebelumnya
 * - edge: submitWeek 52/53 tapi ME 1/2 => epiYear berikutnya
 */
function sarsDash_inferEpiYear_(submitDate, me) {
  const calY = submitDate.getFullYear();
  try {
    if (typeof getEpidWeek === "function") {
      const ew = getEpidWeek(submitDate);
      if (!ew || !ew.year || !ew.week) return calY;

      const submitYear = Number(ew.year);
      const submitWeek = Number(ew.week);
      const reportWeek = Number(me);

      if (isFinite(submitWeek) && isFinite(reportWeek)) {
        if (submitWeek <= 2 && reportWeek >= 52) return submitYear - 1;
        if (submitWeek >= 52 && reportWeek <= 2) return submitYear + 1;
      }
      return submitYear;
    }
  } catch (e) {}
  return calY;
}

/**
 * Hitung deadline Senin 23:59 untuk minggu laporan (epiYear+ME),
 * jika tersedia helper range by (year, week).
 */
function sarsDash_getDeadlineForYearWeek_(epiYear, me) {
  const cfg = sarsDash_cfg_();
  const tryFns = [
    "getEpiWeekRangeByYearWeek",
    "getEpidWeekRangeByYearWeek",
    "getWeekRangeByYearWeek",
    "getEpidRangeByYearWeek"
  ];

  for (let i = 0; i < tryFns.length; i++) {
    const fn = tryFns[i];
    try {
      if (typeof this[fn] === "function") {
        const r = this[fn](Number(epiYear), Number(me)); // {start,end}
        if (r && r.end) {
          const end = (r.end instanceof Date) ? r.end : new Date(r.end);
          if (!isNaN(end.getTime())) {
            const dl = new Date(end);
            dl.setDate(end.getDate() + 2);     // Senin setelah Sabtu minggu tsb
            dl.setHours(cfg.dlHour, cfg.dlMin, 0, 0);
            return dl;
          }
        }
      }
    } catch (e) {}
  }

  return null;
}

/** ======================= MASTER: list faskes + map nama/alias -> key ======================= */

function sarsDash_readSheetCached_(ss, sheetName, ttlSec) {
  const name = String(sheetName || '').trim();
  if (!name) return [];
  const key = 'SARS_DASH_SHEET_' + name;
  const bypassCache = Number(ttlSec) === 0;
  if (!bypassCache) {
    try {
      const cached = CacheService.getScriptCache().get(key);
      if (cached) return JSON.parse(cached);
    } catch (e) {}
  }
  const sh = ss.getSheetByName(name);
  if (!sh) return [];
  const values = sh.getDataRange().getValues();
  if (!bypassCache) {
    try {
      const json = JSON.stringify(values);
      if (json.length < 95000) CacheService.getScriptCache().put(key, json, Number(ttlSec || 300));
    } catch (e) {}
  }
  return values;
}

function sarsDash_cacheGetJson_(key) {
  try {
    const raw = CacheService.getScriptCache().get(String(key || ''));
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function sarsDash_cachePutJson_(key, value, ttlSec) {
  try {
    const json = JSON.stringify(value);
    if (json.length < 95000) CacheService.getScriptCache().put(String(key || ''), json, Number(ttlSec || 300));
  } catch (e) {}
}

function sarsDash_invalidateDashboardCache_() {
  try {
    CacheService.getScriptCache().removeAll([
      'SARS_DASH_SHEET_REF_FASKES',
      'SARS_DASH_SHEET_REF_PENGAMPU',
      'SARS_DASH_SHEET_SARS'
    ]);
  } catch (e) {}
}

function sarsDash_normHeader_(v) {
  return String(v || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function sarsDash_refIndex_(headers, candidates) {
  const normalized = headers.map(sarsDash_normHeader_);
  const wanted = candidates.map(sarsDash_normHeader_);
  return normalized.findIndex(h => wanted.indexOf(h) !== -1);
}

/** Read REF_PENGAMPU once, tolerating old/new header spellings. */
function sarsDash_readRefPengampu_(ss) {
  const sh = ss.getSheetByName('REF_PENGAMPU');
  if (!sh) return { list: [], byKey: {}, byName: {}, byRegion: {} };
  const values = sarsDash_readSheetCached_(ss, 'REF_PENGAMPU', 600);
  if (!values || values.length < 2) return { list: [], byKey: {}, byName: {}, byRegion: {} };
  const headers = (values[0] || []).map(sarsDash_clean_);
  const idxPeng = sarsDash_refIndex_(headers, ['Pengampu', 'NamaPuskesmas', 'Nama Puskesmas', 'Puskesmas Pengampu', 'UPTD Pengampu', 'Nama UPTD']);
  const idxCode = sarsDash_refIndex_(headers, ['KodeFaskes', 'Kode Faskes', 'Kode Faskes', 'Kode']);
  const idxName = sarsDash_refIndex_(headers, ['NamaFaskes', 'Nama Faskes', 'NamaFasyankes', 'Nama Fasyankes', 'NamaPuskesmas', 'Nama Puskesmas']);
  const idxKec = sarsDash_refIndex_(headers, ['Kecamatan', 'Nama Kecamatan']);
  const idxKel = sarsDash_refIndex_(headers, ['Kelurahan', 'Nama Kelurahan']);
  const out = { list: [], byKey: {}, byName: {}, byRegion: {} };
  values.slice(1).forEach(row => {
    const peng = idxPeng >= 0 ? sarsDash_clean_(row[idxPeng]) : '';
    if (!peng || peng === '-') return;
    out.list.push(peng);
    const code = idxCode >= 0 ? sarsDash_normFaskesKey_(row[idxCode]) : '';
    const name = idxName >= 0 ? sarsDash_normKey_(row[idxName]) : '';
    if (code) out.byKey[code] = peng;
    if (name) out.byName[name] = peng;
    const kec = idxKec >= 0 ? sarsDash_normKey_(row[idxKec]) : '';
    const kel = idxKel >= 0 ? sarsDash_normKey_(row[idxKel]) : '';
    if (kec && kel) out.byRegion[kec + '|' + kel] = peng;
  });
  out.list = [...new Set(out.list)].sort((a, b) => a.localeCompare(b, 'id'));
  return out;
}

function sarsDash_readMaster_(ss, jenisFilter, pengFilter, accessScope) {
  const cfg = sarsDash_cfg_();
  const sh = ss.getSheetByName(cfg.sheetMaster);
  if (!sh) throw new Error('Sheet "' + cfg.sheetMaster + '" tidak ditemukan.');

  const values = sarsDash_readSheetCached_(ss, cfg.sheetMaster, 600);
  if (!values || values.length < 2) {
    return { faskes: [], pengampuList: [], nameToKey: {}, keyToEmail: {} };
  }

  const headers = (values[0] || []).map(sarsDash_clean_);

  const iKey   = sarsDash_pickIndex_(headers, ["KodeFaskes", "Kode Faskes", "Key"]);
  const iNama  = sarsDash_pickIndex_(headers, ["NamaFaskes", "Nama Faskes", "NamaFasyankes", "Nama Fasyankes"]);
  const iJenis = sarsDash_pickIndex_(headers, ["Jenis", "Jenis Faskes", "JenisFaskes", "Jenis Fasyankes"]);
  const iPeng  = sarsDash_pickIndex_(headers, ["Pengampu", "FaskesPengampu"]);
  const refPengampu = sarsDash_readRefPengampu_(ss);
  const iEmail = sarsDash_pickIndex_(headers, ["Email", "Email PIC", "Email Faskes"]);
  const iAktif = sarsDash_pickIndex_(headers, ["StatusAktif", "Aktif", "Status"]);
  const iAlias = sarsDash_pickIndex_(headers, ["Alias", "NamaAlias", "AliasNama"]);

  if (iKey < 0)  throw new Error('REF_FASKES: header "KodeFaskes" tidak ditemukan.');
  if (iNama < 0) throw new Error('REF_FASKES: header "NamaFaskes" tidak ditemukan.');
  if (iJenis < 0) throw new Error('REF_FASKES: header "Jenis" tidak ditemukan.');
  // Pengampu bersumber dari REF_PENGAMPU. REF_FASKES.Pengampu dipakai sebagai fallback.
  // Jika REF_FASKES masih punya kolom, pakai nilainya sebagai mapping tambahan.

  const faskes = [];
  const pengSet = {};
  const nameToKey = {};   // normName -> normKey
  const keyToEmail = {};  // normKey -> email

  for (let r = 1; r < values.length; r++) {
    const row = values[r] || [];

    const aktif = iAktif >= 0 ? sarsDash_clean_(row[iAktif]).toUpperCase() : "AKTIF";
    if (aktif && ["AKTIF", "ACTIVE", "YA", "Y", "TRUE", "1", "WAJIB", "WAJIB LAPOR"].indexOf(aktif) === -1) continue;

    const rawKey  = sarsDash_clean_(row[iKey]);
    const key     = sarsDash_normFaskesKey_(rawKey);
    const nama    = sarsDash_clean_(row[iNama]);
    const jen     = sarsDash_normJenis_(row[iJenis]);
    if (jen === "PKM" || jen === "PUSKESMAS") continue;
    const pengMaster = iPeng >= 0 ? sarsDash_clean_(row[iPeng]) : '';
    const peng = pengMaster || refPengampu.byKey[key] || refPengampu.byName[sarsDash_normKey_(nama)] || "-";
    const email   = (iEmail >= 0) ? sarsDash_clean_(row[iEmail]) : "";
    const alias   = (iAlias >= 0) ? sarsDash_clean_(row[iAlias]) : "";

    if (!key || !nama) continue;
    if (jenisFilter !== "ALL" && jen !== jenisFilter) continue;
    if (pengFilter !== "all" && peng !== pengFilter) continue;

    // Scope wajib dipaksa server-side. Admin/super-admin sudah diberi allowAll.
    if (accessScope && !accessScope.allowAll) {
      const normUnit = sarsDash_normKey_(accessScope.unitKerja || '');
      const normName = sarsDash_normKey_(nama);
      const normKey = sarsDash_normFaskesKey_(key);
      const normPeng = sarsDash_normKey_(peng);
      const isOwnFaskes = normUnit && (normUnit === normName || normUnit === normKey);
      const isPengampu = normUnit && normUnit === normPeng;
      if (!isOwnFaskes && !isPengampu) continue;
    }

    faskes.push({ key, nama, jenis: jen, pengampu: peng, email });

    if (peng && peng !== "-" && peng !== "(Tanpa pengampu)") pengSet[peng] = true;

    // map nama -> key (pakai normName)
    nameToKey[sarsDash_normKey_(nama)] = key;

    // alias multi (; atau ,)
    if (alias) {
      alias.split(/[;,]/g)
        .map(s => sarsDash_clean_(s))
        .filter(Boolean)
        .forEach(a => { nameToKey[sarsDash_normKey_(a)] = key; });
    }

    if (email) keyToEmail[key] = email;
  }

  return {
    faskes,
    pengampuList: [...new Set(Object.keys(pengSet).concat(refPengampu.list))].sort((a, b) => a.localeCompare(b, 'id')),
    nameToKey,
    keyToEmail
  };
}

/** ======================= SARS: index setahun (epiYear) ======================= */
function sarsDash_buildYearIndex_(ss, targetEpiYear, nameToKey) {
  const cfg = sarsDash_cfg_();
  const dataSheet = sarsDash_dataSheet_(ss);
  const sh = ss.getSheetByName(dataSheet);
  if (!sh) throw new Error('Sheet data SARS tidak ditemukan (dicari SARS/DATA_SARS).');

  const values = sarsDash_readSheetCached_(ss, dataSheet, 180);
  if (!values || values.length < 2) return { byKey: {}, weekSet: {}, weekOnTimeSet: {}, debug: {} };

  const headers = (values[0] || []).map(sarsDash_clean_);

  const iSubmit = sarsDash_pickIndex_(headers, ["Waktu Submit", "WaktuSubmit", "Timestamp", "Waktu", "Submit Time"]);
  const iME     = sarsDash_pickIndex_(headers, ["ME", "Minggu Epid", "MingguEpid", "Minggu Epidemiologi"]);
  const iNamaFx = sarsDash_pickIndex_(headers, ["Nama Fasyankes", "NamaFasyankes", "Nama Faskes", "NamaFaskes", "Asal Faskes", "AsalFaskes"]);
  const iKey    = sarsDash_pickIndex_(headers, ["KodeFaskes", "Key"]);
  const iOnTime = sarsDash_pickIndex_(headers, ["OnTime", "Tepat Waktu", "Ketepatan"]);

  if (iSubmit < 0) throw new Error('SARS: header "Waktu Submit" tidak ditemukan.');
  if (iME < 0) throw new Error('SARS: header "ME" tidak ditemukan.');

  const byKey = {};
  const submittedRows = [];
  const weekSet = {};
  const weekOnTimeSet = {};

  // debug (untuk investigasi mismatch)
  let skippedNoDate = 0;
  let skippedNoME = 0;
  let skippedYearMismatch = 0;
  let skippedNoKey = 0;
  let usedNameMapping = 0;
  let usedDataKey = 0;
  const unmatchedNames = {}; // normName -> count

  const weeksInTarget = sarsDash_weeksInYear_(targetEpiYear);

  for (let r = 1; r < values.length; r++) {
    const row = values[r] || [];

    const submitDate = sarsDash_toDate_(row[iSubmit]);
    if (!submitDate) { skippedNoDate++; continue; }

    const me = sarsDash_toWeek_(row[iME]);
    if (!isFinite(me) || me < 1 || me > 53) { skippedNoME++; continue; }

    // infer epiYear baris (patch awal Januari)
    const inferredYear = sarsDash_inferEpiYear_(submitDate, me);
    if (Number(inferredYear) !== Number(targetEpiYear)) { skippedYearMismatch++; continue; }

    // resolve key: prefer FaskesKey di SARS
    let key = "";
    if (iKey >= 0 && row[iKey] !== "" && row[iKey] !== null && row[iKey] !== undefined) {
      key = sarsDash_normFaskesKey_(row[iKey]);
      if (key) usedDataKey++;
    }

    // fallback mapping dari nama fasyankes
    if (!key) {
      const nama = (iNamaFx >= 0) ? sarsDash_clean_(row[iNamaFx]) : "";
      const nk = sarsDash_normKey_(nama);
      key = (nk && nameToKey && nameToKey[nk]) ? nameToKey[nk] : "";
      if (key) usedNameMapping++;
      else if (nk) unmatchedNames[nk] = (unmatchedNames[nk] || 0) + 1;
    }

    if (!key) {
      skippedNoKey++;
      // Detail laporan tetap menampilkan laporan asli walau mapping FaskesKey
      // belum tersedia. Mapping hanya wajib untuk KPI/reka p dashboard.
      submittedRows.push({
        waktuSubmit: submitDate,
        me: me,
        namaFasyankes: iNamaFx >= 0 ? sarsDash_clean_(row[iNamaFx]) : '',
        jenisFasyankes: sarsDash_clean_(row[sarsDash_pickIndex_(headers, ['Jenis Fasyankes', 'JenisFaskes'])]),
        namaPetugas: sarsDash_clean_(row[sarsDash_pickIndex_(headers, ['Nama Petugas'])]),
        emailPetugas: sarsDash_clean_(row[sarsDash_pickIndex_(headers, ['Email Petugas'])]),
        namaPenyakit: sarsDash_clean_(row[sarsDash_pickIndex_(headers, ['Nama Penyakit'])]),
        nihil: sarsDash_clean_(row[sarsDash_pickIndex_(headers, ['Nihil'])]),
        namaKasus: sarsDash_clean_(row[sarsDash_pickIndex_(headers, ['Nama Kasus'])]),
        tglLahir: sarsDash_clean_(row[sarsDash_pickIndex_(headers, ['Tgl Lahir', 'Tanggal Lahir'])]),
        jenisKelamin: sarsDash_clean_(row[sarsDash_pickIndex_(headers, ['Jenis Kelamin'])]),
        alamat: sarsDash_clean_(row[sarsDash_pickIndex_(headers, ['Alamat & No Telp', 'Alamat'])]),
        tanggalMulai: sarsDash_clean_(row[sarsDash_pickIndex_(headers, ['Tanggal Mulai'])]),
        gejala: sarsDash_clean_(row[sarsDash_pickIndex_(headers, ['Gejala'])]),
        diagnosis: sarsDash_clean_(row[sarsDash_pickIndex_(headers, ['Diagnosis Medis/Banding', 'Diagnosis'])]),
        statusImunisasi: sarsDash_clean_(row[sarsDash_pickIndex_(headers, ['Status Imunisasi'])]),
        keadaan: sarsDash_clean_(row[sarsDash_pickIndex_(headers, ['Keadaan (H/M)', 'Keadaan'])]),
        spesimen: sarsDash_clean_(row[sarsDash_pickIndex_(headers, ['Spesimen / Penolong', 'Spesimen'])])
      });
      continue;
    }

    // Simpan baris laporan asli untuk menu Detail Laporan Mingguan.
    submittedRows.push({
      waktuSubmit: submitDate,
      me: me,
      namaFasyankes: iNamaFx >= 0 ? sarsDash_clean_(row[iNamaFx]) : '',
      jenisFasyankes: sarsDash_clean_(row[sarsDash_pickIndex_(headers, ['Jenis Fasyankes', 'JenisFaskes'])]),
      namaPetugas: sarsDash_clean_(row[sarsDash_pickIndex_(headers, ['Nama Petugas'])]),
      emailPetugas: sarsDash_clean_(row[sarsDash_pickIndex_(headers, ['Email Petugas'])]),
      namaPenyakit: sarsDash_clean_(row[sarsDash_pickIndex_(headers, ['Nama Penyakit'])]),
      nihil: sarsDash_clean_(row[sarsDash_pickIndex_(headers, ['Nihil'])]),
      namaKasus: sarsDash_clean_(row[sarsDash_pickIndex_(headers, ['Nama Kasus'])]),
      tglLahir: sarsDash_clean_(row[sarsDash_pickIndex_(headers, ['Tgl Lahir', 'Tanggal Lahir'])]),
      jenisKelamin: sarsDash_clean_(row[sarsDash_pickIndex_(headers, ['Jenis Kelamin'])]),
      alamat: sarsDash_clean_(row[sarsDash_pickIndex_(headers, ['Alamat & No Telp', 'Alamat'])]),
      tanggalMulai: sarsDash_clean_(row[sarsDash_pickIndex_(headers, ['Tanggal Mulai'])]),
      gejala: sarsDash_clean_(row[sarsDash_pickIndex_(headers, ['Gejala'])]),
      diagnosis: sarsDash_clean_(row[sarsDash_pickIndex_(headers, ['Diagnosis Medis/Banding', 'Diagnosis'])]),
      statusImunisasi: sarsDash_clean_(row[sarsDash_pickIndex_(headers, ['Status Imunisasi'])]),
      keadaan: sarsDash_clean_(row[sarsDash_pickIndex_(headers, ['Keadaan (H/M)', 'Keadaan'])]),
      spesimen: sarsDash_clean_(row[sarsDash_pickIndex_(headers, ['Spesimen / Penolong', 'Spesimen'])])
    });

    // optional sanity: jika target tahun hanya 52 minggu, tapi data ME 53 tetap kita simpan.
    // (dashboard akan menampilkan ME sesuai weeksInEpiYear(targetYear))
    // jadi tidak dipaksa drop.

    // onTime: pakai kolom OnTime jika ada & terisi; jika tidak, hitung deadline bila bisa
    let onTime = false;
    if (iOnTime >= 0 && row[iOnTime] !== "" && row[iOnTime] !== null && row[iOnTime] !== undefined) {
      onTime = sarsDash_parseOnTime_(row[iOnTime]);
    } else {
      const dl = sarsDash_getDeadlineForYearWeek_(targetEpiYear, me);
      onTime = dl ? (submitDate.getTime() <= dl.getTime()) : true; // fallback: jangan menghukum bila tidak bisa hitung
    }

    if (!byKey[key]) byKey[key] = { weeks: {}, onTime: {} };
    byKey[key].weeks[me] = true;
    if (onTime) byKey[key].onTime[me] = true;

    if (!weekSet[me]) weekSet[me] = {};
    weekSet[me][key] = true;

    if (onTime) {
      if (!weekOnTimeSet[me]) weekOnTimeSet[me] = {};
      weekOnTimeSet[me][key] = true;
    }
  }

  // top unmatched untuk memudahkan koreksi alias di master
  const topUnmatched = Object.keys(unmatchedNames)
    .map(k => ({ nameNorm: k, count: unmatchedNames[k] }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    byKey,
    submittedRows,
    weekSet,
    weekOnTimeSet,
    debug: {
      targetEpiYear: Number(targetEpiYear),
      weeksInTarget,
      skippedNoDate,
      skippedNoME,
      skippedYearMismatch,
      skippedNoKey,
      usedDataKey,
      usedNameMapping,
      topUnmatchedNames: topUnmatched
    }
  };
}

/** ======================= AGREGASI PER PENGAMPU ======================= */
function sarsDash_aggregatePerPengampu_(detail) {
  const map = {};
  (detail || []).forEach(d => {
    const p = d.pengampu || "-";
    if (!map[p]) map[p] = { pengampu: p, onTime: 0, terlambat: 0, belum: 0, lapor: 0, total: 0 };
    map[p].total++;

    if (d.status === "Tepat Waktu") { map[p].onTime++; map[p].lapor++; }
    else if (d.status === "Terlambat") { map[p].terlambat++; map[p].lapor++; }
    else { map[p].belum++; }
  });

  const arr = Object.keys(map).map(k => map[k]);
  arr.sort((a, b) => (b.lapor - a.lapor) || String(a.pengampu).localeCompare(String(b.pengampu), "id-ID"));
  return arr;
}

/** ======================= API DASHBOARD ======================= */
/**
 * @param {number|string} year      epiYear (contoh: 2025)
 * @param {number|string} minggu    ME (contoh: 53)
 * @param {string} jenis            ALL/RS/KLINIK/TPMD/PMB/LAIN
 * @param {string} pengampu         "all" atau nama pengampu
 */
function getDashboardData(year, minggu, jenis, pengampu, token) {
  try {
    return _getDashboardData_(year, minggu, jenis, pengampu, token);
  } catch (e) {
    try { console.error('getDashboardData failed:', e && e.stack ? e.stack : e); } catch (ignore) {}
    const msg = String((e && e.message) || e || 'Kesalahan server').trim();
    throw new Error('Dashboard SARS gagal: ' + msg);
  }
}

// Raw SARS rows for weekly detail. No REF_FASKES/master mapping required.
function getWeeklySubmittedRows(year, minggu, token) {
  const sess = (typeof _getSessionFromToken_ === 'function') ? _getSessionFromToken_(token) : null;
  if (!sess || !sess.ok || !sess.user) throw new Error('Sesi tidak valid atau sudah berakhir.');
  const role = (typeof _normalizePd3iRole_ === 'function') ? _normalizePd3iRole_(sess.user.role) : String(sess.user.role || '').toLowerCase();
  const scopeLevel = String(sess.user.scopeLevel || '').toLowerCase().replace(/[_\s]+/g, '-');
  const allowAll = role === 'admin' || role === 'super-admin' || role === 'superadmin' || scopeLevel === 'dinkes';
  const unitKey = sarsDash_normKey_(sess.user.unitKerja || sess.user.namaFaskes || '');
  const ss = sarsDash_open_();
  const cfg = sarsDash_cfg_();
  // Build facility scope from REF_FASKES/REF_PENGAMPU. SARS rows may store
  // FaskesPengampu as code while session unitKerja stores puskesmas name.
  // Matching raw pengampu text alone drops those rows from puskesmas detail.
  const scopedMaster = allowAll ? null : sarsDash_readMaster_(ss, 'ALL', 'all', {
    allowAll: false,
    unitKerja: String(sess.user.unitKerja || sess.user.namaFaskes || '')
  });
  const scopedNames = {};
  const scopedKeys = {};
  (scopedMaster && scopedMaster.faskes || []).forEach(function(f) {
    scopedNames[sarsDash_normKey_(f.nama)] = true;
    scopedKeys[sarsDash_normFaskesKey_(f.key)] = true;
  });
  const dataSheet = sarsDash_dataSheet_(ss);
  const sh = ss.getSheetByName(dataSheet);
  if (!sh) throw new Error('Sheet SARS tidak ditemukan.');
  // Display values preserve sheet text/date formatting. Detail must not
  // discard rows because Date serial parsing differs between XLSX/Sheets.
  const values = sh.getDataRange().getDisplayValues();
  if (!values || values.length < 2) return [];
  const headers = values[0].map(sarsDash_clean_);
  const ix = function(names){ return sarsDash_pickIndex_(headers, names); };
  const iSubmit=ix(['Waktu Submit','WaktuSubmit','Timestamp','Waktu','Submit Time']);
  const iME=ix(['ME','Minggu Epid','MingguEpid','Minggu Epidemiologi']);
  if (iSubmit < 0 || iME < 0) throw new Error('Header Waktu Submit/ME tidak ditemukan.');
  const wMatch=String(minggu == null ? '' : minggu).match(/\d+/);
  const w=wMatch ? Number(wMatch[0]) : 1;
  const field = function(row,names){ const i=ix(names); return i >= 0 ? sarsDash_clean_(row[i]) : ''; };
  const out = values.slice(1).map(function(row){
    const rawMe = sarsDash_clean_(row[iME]);
    const meMatch = rawMe.match(/\d+/);
    const me = meMatch ? Number(meMatch[0]) : NaN;
    // Detail source filter is ME only. SARS rows may use submit date/year
    // differing from reporting epi-year (late entry, backfill, migration).
    if (Number(me)!==w) return null;
    const namaFaskes=field(row,['Nama Fasyankes','NamaFasyankes','Nama Faskes']);
    const faskesKey=field(row,['FaskesKey','KodeFaskes','Kode Faskes']);
    const pengampu=field(row,['FaskesPengampu','Faskes Pengampu','Pengampu']);
    const belongs = allowAll
      || sarsDash_normKey_(namaFaskes) === unitKey
      || sarsDash_normKey_(pengampu) === unitKey
      || !!scopedNames[sarsDash_normKey_(namaFaskes)]
      || !!scopedKeys[sarsDash_normFaskesKey_(faskesKey)];
    if (!belongs) return null;
    const nihil=field(row,['Nihil']); const namaKasus=field(row,['Nama Kasus']);
    const status = /^(1|ya|yes|nihil)$/i.test(nihil) ? 'Nihil' : (namaKasus ? 'Ada kasus' : 'Tidak jelas');
    const onTime=field(row,['OnTime','On Time']);
    const anomaly=[]; if (!isFinite(me)) anomaly.push('ME tidak valid'); if (!field(row,['Waktu Submit','WaktuSubmit','Timestamp'])) anomaly.push('Waktu kirim kosong'); if (!namaFaskes) anomaly.push('Fasyankes kosong'); if (status === 'Tidak jelas') anomaly.push('Status nihil/kasus tidak jelas');
    return {waktuSubmit:field(row,['Waktu Submit','WaktuSubmit','Timestamp']),me:me,namaFasyankes:namaFaskes,jenisFasyankes:field(row,['Jenis Fasyankes','JenisFaskes']),namaPetugas:field(row,['Nama Petugas']),emailPetugas:field(row,['Email Petugas']),namaPenyakit:field(row,['Nama Penyakit']),nihil:nihil,status:status,namaKasus:namaKasus,tglLahir:field(row,['Tgl Lahir','Tanggal Lahir']),jenisKelamin:field(row,['Jenis Kelamin']),alamat:field(row,['Alamat & No Telp','Alamat']),tanggalMulai:field(row,['Tanggal Mulai']),gejala:field(row,['Gejala']),diagnosis:field(row,['Diagnosis Medis/Banding','Diagnosis']),statusImunisasi:field(row,['Status Imunisasi']),keadaan:field(row,['Keadaan (H/M)','Keadaan']),spesimen:field(row,['Spesimen / Penolong','Spesimen']),pengampu:pengampu,onTime:onTime,anomaly:anomaly};
  }).filter(Boolean);
  return out;
}

function _getDashboardData_(year, minggu, jenis, pengampu, token) {
  const sess = (typeof _getSessionFromToken_ === 'function') ? _getSessionFromToken_(token) : null;
  if (!sess || !sess.ok || !sess.user) throw new Error('Sesi tidak valid atau sudah berakhir.');
  const role = (typeof _normalizePd3iRole_ === 'function') ? _normalizePd3iRole_(sess.user.role) : String(sess.user.role || '').toLowerCase();
  const accessScope = {
    allowAll: role === 'admin' || role === 'super-admin' || role === 'superadmin',
    unitKerja: String(sess.user.unitKerja || sess.user.namaFaskes || '').trim()
  };
  const y = Number(sarsDash_stripQuotes_(year)) || new Date().getFullYear();
  const jenisFilter = sarsDash_normJenisFilter_(jenis);
  const pengFilter = sarsDash_clean_(pengampu) || "all";
  const resultCacheKey = ['SARS_DASH_RESULT', y, minggu, jenisFilter, pengFilter, accessScope.allowAll ? 'ALL' : sarsDash_normKey_(accessScope.unitKerja)].join('|');
  const cachedResult = sarsDash_cacheGetJson_(resultCacheKey);
  if (cachedResult) {
    cachedResult.cached = true;
    return cachedResult;
  }

  const weeksInYear = sarsDash_weeksInYear_(y);

  let mingguNum = Number(sarsDash_stripQuotes_(minggu));
  if (!isFinite(mingguNum) || mingguNum < 1) mingguNum = 1;
  if (mingguNum > weeksInYear) mingguNum = weeksInYear;

  const ss = sarsDash_open_();

  // MASTER sesuai filter + mapping
  const masterObj = sarsDash_readMaster_(ss, jenisFilter, pengFilter, accessScope);
  const faskes = masterObj.faskes || [];
  const pengampuList = masterObj.pengampuList || [];
  const nameToKey = masterObj.nameToKey || {};

  if (!faskes.length) {
    return {
      year: y,
      denomWeeks: mingguNum,
      weeksInYear,
      kpi: { total: 0, lapor: 0, onTime: 0, terlambat: 0, belum: 0, completeness: 0, timeliness: 0 },
      pengampuList,
      perPengampu: [],
      trend: [],
      detail: [],
      debug: { note: "MASTER kosong / filter tidak menghasilkan faskes." }
    };
  }

  // DATA index setahun (epiYear) dengan patch ME 52/53 awal Januari + normalisasi key
  const idx = sarsDash_buildYearIndex_(ss, y, nameToKey);
  const byKey = idx.byKey || {};
  const weekSet = idx.weekSet || {};

  const total = faskes.length;

  // KPI minggu terpilih
  let laporCount = 0, onTimeCount = 0, terlambatCount = 0, belumCount = 0;

  // Denominator YTD = minggu terpilih
  const denomWeeks = mingguNum;

  const detail = faskes.map(f => {
    // f.key sudah ternormalisasi saat baca master
    const rec = byKey[f.key] || { weeks: {}, onTime: {} };

    const reportedThisWeek = !!rec.weeks[mingguNum];
    const onTimeThisWeek   = !!rec.onTime[mingguNum];

    const status = (!reportedThisWeek)
      ? "Belum Lapor"
      : (onTimeThisWeek ? "Tepat Waktu" : "Terlambat");

    if (reportedThisWeek) {
      laporCount++;
      if (onTimeThisWeek) onTimeCount++;
      else terlambatCount++;
    } else {
      belumCount++;
    }

    // YTD hingga denomWeeks
    let mingguLapor = 0;
    let mingguTepat = 0;
    for (let w = 1; w <= denomWeeks; w++) {
      if (rec.weeks[w]) mingguLapor++;
      if (rec.onTime[w]) mingguTepat++;
    }

    const capaianKelengkapan = denomWeeks ? sarsDash_round1_((mingguLapor / denomWeeks) * 100) : 0;
    const capaianKetepatan   = denomWeeks ? sarsDash_round1_((mingguTepat / denomWeeks) * 100) : 0;

    return {
      key: f.key,
      nama: f.nama,
      pengampu: f.pengampu,
      status,
      denomWeeks,
      mingguLapor,
      mingguTepat,
      capaianKelengkapan,
      capaianKetepatan
    };
  });

  const completeness = total ? sarsDash_round1_((laporCount / total) * 100) : 0;
  const timeliness   = laporCount ? sarsDash_round1_((onTimeCount / laporCount) * 100) : 0;

  // Rekap per pengampu
  const perPengampu = sarsDash_aggregatePerPengampu_(detail);

  // Trend ME 1..weeksInYear
  const trend = [];
  for (let ww = 1; ww <= weeksInYear; ww++) {
    const setObj = weekSet[ww] || {};
    let cnt = 0;
    for (let i = 0; i < faskes.length; i++) {
      const k = faskes[i].key;
      if (setObj[k]) cnt++;
    }
    const pct = total ? sarsDash_round1_((cnt / total) * 100) : 0;
    trend.push({ week: ww, lapor: cnt, total, pct });
  }

  const result = {
    year: y,
    denomWeeks,
    weeksInYear,
    kpi: {
      total,
      lapor: laporCount,
      onTime: onTimeCount,
      terlambat: terlambatCount,
      belum: belumCount,
      completeness,
      timeliness
    },
    pengampuList,
    perPengampu,
    trend,
    detail,
    debug: idx.debug || {}
  };
  sarsDash_cachePutJson_(resultCacheKey, result, 180);
  return result;
}

/** Kompatibilitas lama */
function getData(minggu, jenis, pengampu, token) {
  const year = new Date().getFullYear();
  return getDashboardData(year, minggu, jenis, pengampu, token);
}
