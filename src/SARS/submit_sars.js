/******************************************************
 * submit_sars.gs — Simpan data Zero Reporting ke SARS
 * FIX:
 * - Lookup REF_FASKES robust:
 *   cocokkan NamaFaskes &/atau FaskesKey dengan normalisasi
 * - Jika master tidak ketemu: tetap simpan pakai FaskesKey turunan
 * - Tulis ke SARS berdasarkan HEADER (anti geser kolom)
 * - Validasi anti dobel: ME + FaskesKey
 * - Header SARS disesuaikan dengan yang Anda kirim:
 *   "Tgl Lahir", "Spesimen / Penolong", dst.
 ******************************************************/

/** ========= UTIL UMUM ========= */
function _sTrim_(v) {
  if (v === null || v === undefined) return "";
  return String(v).trim();
}
function _sRequire_(cond, msg) {
  if (!cond) throw new Error(msg);
}
function _sIsObj_(o) {
  return o && typeof o === "object" && !Array.isArray(o);
}
function _sToInt_(v) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.floor(n) : NaN;
}

const SARS_SUBMIT_ROLES_ = ['admin', 'super-admin', 'superadmin', 'surveilans', 'petugas'];

function _getSarsSubmitSession_(formData) {
  const token = _sTrim_(formData.__token);
  const session = _getSessionFromToken_(token);
  if (!session.ok || !session.user) throw new Error("Sesi tidak valid.");

  const role = (typeof _normalizePd3iRole_ === 'function')
    ? _normalizePd3iRole_(session.user.role)
    : String(session.user.role || '').trim().toLowerCase().replace(/[_\s]+/g, '-');
  _sRequire_(SARS_SUBMIT_ROLES_.indexOf(role) !== -1, "Role tidak berwenang mengirim laporan SARS.");
  _sRequire_(session.user.email || session.user.kodePuskesmas || session.user.namaFaskes || session.user.unitKerja,
    "Profil akun belum memiliki mapping fasilitas.");
  return session;
}

/**
 * Normalisasi untuk match:
 * - uppercase
 * - buang spasi & semua non-alphanumeric
 * Contoh: "RSUD Khidmat Sehat (Afiat) Kota Depok" -> "RSUDKHIDMATSEHATAFIATKOTADEPOK"
 */
function _normKey_(s) {
  return _sTrim_(s)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, ""); // buang spasi, tanda baca, dll
}

/** ========= CONFIG & SHEET ========= */
function _getCfg_() {
  try {
    if (typeof getSarsConfig === "function") return getSarsConfig();
  } catch (e) {}
  // fallback minimal
  return {
    SPREADSHEET_ID: "",
    SHEET_MASTER: "REF_FASKES",
    SHEET_DATA: "SARS",
    TIMEZONE: "Asia/Jakarta",
    REPORTING: { DEADLINE_DAY: 1, DEADLINE_HOUR: 16, DEADLINE_MINUTE: 0 }
  };
}

function _openSs_() {
  try {
    if (typeof openSarsSpreadsheet === "function") return openSarsSpreadsheet();
  } catch (e) {}
  const cfg = _getCfg_();
  const ssid = _sTrim_(cfg.SPREADSHEET_ID);
  _sRequire_(ssid, 'SPREADSHEET_ID belum diset. Cek config.gs → SARS_CONFIG.SPREADSHEET_ID');
  return SpreadsheetApp.openById(ssid);
}

function _getSheet_(ss, name) {
  const sh = ss.getSheetByName(name);
  if (!sh) throw new Error(`Sheet "${name}" tidak ditemukan.`);
  return sh;
}

function _headerMap_(sheet) {
  const lastCol = sheet.getLastColumn();
  _sRequire_(lastCol > 0, `Sheet "${sheet.getName()}" belum punya header.`);
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(_sTrim_);
  const map = {};
  headers.forEach((h, i) => { if (h) map[h] = i; });
  return { headers, map };
}

/** set cell by header name */
function _set_(row, hmap, header, value) {
  const idx = hmap[header];
  if (idx === undefined) return;
  row[idx] = (value === undefined || value === null) ? "" : value;
}
function _setAny_(row, hmap, headers, value) {
  for (const header of headers) {
    if (hmap[header] !== undefined) {
      _set_(row, hmap, header, value);
      return header;
    }
  }
  return "";
}

function _normalizeSarsFacilityType_(value) {
  const s = _sTrim_(value).toUpperCase();
  if (!s) return "LAIN";
  if (s === "PKM" || s === "PUSKESMAS" || s.indexOf("PUSKESMAS") !== -1) return "PKM";
  if (s === "RS" || s === "RUMAH SAKIT") return "RS";
  if (s === "KLINIK" || s === "CLINIC") return "KLINIK";
  if (s === "TPMD" || s.indexOf("PRAKTIK MANDIRI DOKTER") !== -1 || s.indexOf("PRAKTEK MANDIRI DOKTER") !== -1) return "TPMD";
  if (s === "PMB" || s.indexOf("PRAKTIK MANDIRI BIDAN") !== -1 || s.indexOf("PRAKTEK MANDIRI BIDAN") !== -1) return "PMB";
  if (s === "LAIN" || s === "LAINNYA") return "LAIN";
  return s;
}

function _isSarsReportingFacility_(typeKey, statusAktif) {
  const type = _sTrim_(typeKey).toUpperCase();
  if (type === "PKM" || type === "PUSKESMAS") return false;
  const status = _sTrim_(statusAktif).toUpperCase();
  if (!status) return true;
  return ["AKTIF", "ACTIVE", "YA", "Y", "TRUE", "1", "WAJIB", "WAJIB LAPOR"].indexOf(status) !== -1;
}

/** ========= MASTER INDEX ========= */
function _buildMasterIndex_() {
  const cfg = _getCfg_();
  const ss = _openSs_();
  const sh = _getSheet_(ss, cfg.SHEET_MASTER || "REF_FASKES");

  const values = sh.getDataRange().getValues();
  if (values.length < 2) return { byNameKey: {}, byFaskesKey: {} };

  // Normalisasi header: trim + hilangkan spasi ganda
  const headRaw = values[0].map(h => _sTrim_(h).replace(/\s+/g, " "));
  const headNorm = headRaw.map(h => h.toUpperCase().replace(/\s+/g, "")); // "Nama Faskes" -> "NAMAFASKES"

  function findCol_(candidates) {
    const candNorm = candidates.map(c => String(c).toUpperCase().replace(/\s+/g, ""));
    for (let i = 0; i < headNorm.length; i++) {
      if (candNorm.includes(headNorm[i])) return i;
    }
    return -1;
  }

  // Kandidat header REF_FASKES (lebih fleksibel)
  const cFaskesKey = findCol_(["faskes_key", "FaskesKey", "Faskes Key", "FasyankesKey", "KodeFaskes", "Kode Faskes", "FASKESKEY"]);
  const cNama      = findCol_(["nama_faskes", "NamaFaskes", "Nama Faskes", "NamaFasyankes", "Nama Fasyankes", "NAMA"]);
  const cPengampu  = findCol_(["nama_pengampu", "Pengampu", "FaskesPengampu", "Faskes Pengampu", "PENGAMPU"]);
  const cJenis     = findCol_(["Jenis", "JENIS"]);
  const cStatus    = findCol_(["StatusAktif", "Status Aktif", "STATUSAKTIF", "STATUS"]);

  const cEmail     = findCol_(["Email", "Email Faskes", "Email Petugas"]);
  const byNameKey = {};
  const byFaskesKey = {};
  const byEmail = {};

  for (let r = 1; r < values.length; r++) {
    const row = values[r];

    const nama   = cNama >= 0 ? _sTrim_(row[cNama]) : "";
    const fk     = cFaskesKey >= 0 ? _sTrim_(row[cFaskesKey]) : "";
    const peng   = cPengampu >= 0 ? _sTrim_(row[cPengampu]) : "";
    const jenis  = cJenis >= 0 ? _sTrim_(row[cJenis]) : "";
    const status = cStatus >= 0 ? _sTrim_(row[cStatus]) : "";
    const email  = cEmail >= 0 ? _sTrim_(row[cEmail]).toLowerCase() : "";

    const typeKey = _normalizeSarsFacilityType_(jenis);
    if (!_isSarsReportingFacility_(typeKey, status)) continue;

    const nkNama = _normKey_(nama);
    const nkFK   = _normKey_(fk);

    const entry = { faskesKey: fk, pengampu: peng, jenis: typeKey, statusAktif: status, nama };
    if (nkNama) {
      byNameKey[nkNama] = { faskesKey: fk, pengampu: peng, jenis: typeKey, statusAktif: status };
    }
    if (nkFK) {
      byFaskesKey[nkFK] = { faskesKey: fk, pengampu: peng, jenis: typeKey, nama, statusAktif: status };
    }
    if (email) byEmail[email] = entry;
  }

  return { byNameKey, byFaskesKey, byEmail };
}

/**
 * Lookup faskes:
 * prioritas:
 * 1) match NamaFasyankes (dinormalisasi) ke byNameKey
 * 2) match hasil turunan key ke byFaskesKey
 * 3) fallback: faskesKey turunan dari nama (agar tetap bisa simpan & validasi dobel jalan)
 */
function _lookupFaskes_(masterIndex, namaFasyankes) {
  const nk = _normKey_(namaFasyankes);

  if (nk && masterIndex.byNameKey[nk]) {
    return {
      found: true,
      faskesKey: _sTrim_(masterIndex.byNameKey[nk].faskesKey),
      pengampu: _sTrim_(masterIndex.byNameKey[nk].pengampu)
    };
  }

  if (nk && masterIndex.byFaskesKey[nk]) {
    return {
      found: true,
      faskesKey: _sTrim_(masterIndex.byFaskesKey[nk].faskesKey),
      pengampu: _sTrim_(masterIndex.byFaskesKey[nk].pengampu)
    };
  }

  // fallback: tetap simpan pakai key turunan
  return {
    found: false,
    faskesKey: nk,      // ini cocok dengan pola MASTER Anda (contoh RSUD...)
    pengampu: ""
  };
}

function _lookupFaskesByEmail_(masterIndex, email) {
  const key = _sTrim_(email).toLowerCase();
  const found = key && masterIndex.byEmail && masterIndex.byEmail[key];
  if (!found) return null;
  return {
    found: true,
    faskesKey: _sTrim_(found.faskesKey) || _normKey_(found.nama),
    pengampu: _sTrim_(found.pengampu),
    nama: _sTrim_(found.nama),
    jenis: _sTrim_(found.jenis)
  };
}

/** ========= DEADLINE & ONTIME ========= */
function _epiWeek1Start_(year) {
  const jan1 = new Date(year, 0, 1);
  jan1.setHours(0,0,0,0);

  const day = jan1.getDay(); // 0=Min..6=Sab
  const start = new Date(jan1.getTime() - day * 86400000); // Minggu sebelum/tepat Jan1

  let daysInYear = 0;
  for (let i = 0; i < 7; i++) {
    const t = new Date(start.getTime() + i * 86400000);
    if (t.getFullYear() === year) daysInYear++;
  }

  if (daysInYear >= 4) return start;
  return new Date(start.getTime() + 7 * 86400000);
}

function _epiLastWeekOfYear_(year) {
  const s1 = _epiWeek1Start_(year);
  const s2 = _epiWeek1Start_(year + 1);
  const diffDays = Math.floor((s2.getTime() - s1.getTime()) / 86400000);
  return Math.round(diffDays / 7);
}

function _epiWeekRange_(year, week) {
  const start = new Date(_epiWeek1Start_(year).getTime() + (week - 1) * 7 * 86400000);
  start.setHours(0,0,0,0);
  const end = new Date(start.getTime() + 6 * 86400000);
  end.setHours(0,0,0,0);
  return { start, end };
}

function _guessEpiYearForME_(weekNumber, now) {
  const d = now ? new Date(now) : new Date();
  d.setHours(0,0,0,0);

  const y = d.getFullYear();
  const week1 = _epiWeek1Start_(y);

  let curYear = y;
  let curWeek = 1;

  if (d < week1) {
    curYear = y - 1;
    curWeek = _epiLastWeekOfYear_(curYear);
  } else {
    const diffDays = Math.floor((d.getTime() - week1.getTime()) / 86400000);
    curWeek = Math.floor(diffDays / 7) + 1;
    const last = _epiLastWeekOfYear_(y);
    if (curWeek > last) curWeek = last;
  }

  if (weekNumber > curWeek) return curYear - 1;
  return curYear;
}

function _computeDeadlineAndOnTime_(me, submittedAt) {
  const cfg = _getCfg_();

  const year = _guessEpiYearForME_(me, submittedAt);
  const range = _epiWeekRange_(year, me);

  // deadline = Senin 16:00 setelah Sabtu (end)
  const deadline = new Date(range.end.getTime());
  deadline.setDate(deadline.getDate() + 2); // Sabtu -> Senin

  const deadDay  = (cfg.REPORTING && Number.isFinite(cfg.REPORTING.DEADLINE_DAY)) ? cfg.REPORTING.DEADLINE_DAY : 1;
  const deadHour = (cfg.REPORTING && Number.isFinite(cfg.REPORTING.DEADLINE_HOUR)) ? cfg.REPORTING.DEADLINE_HOUR : 16;
  const deadMin  = (cfg.REPORTING && Number.isFinite(cfg.REPORTING.DEADLINE_MINUTE)) ? cfg.REPORTING.DEADLINE_MINUTE : 0;

  // koreksi hari ke DEADLINE_DAY bila perlu
  const cur = deadline.getDay();
  const shift = (deadDay - cur + 7) % 7;
  deadline.setDate(deadline.getDate() + shift);
  deadline.setHours(deadHour, deadMin, 0, 0);

  const onTime = (new Date(submittedAt).getTime() <= deadline.getTime());
  return { deadline, onTime };
}

/** ========= VALIDASI DOUBEL: ME + FaskesKey ========= */
function _checkDuplicate_(sheet, hmap, me, faskesKey) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return;

  const colME = hmap["ME"];
  const colKey = hmap["KodeFaskes"] !== undefined
    ? hmap["KodeFaskes"]
    : (hmap["FaskesKey"] !== undefined ? hmap["FaskesKey"] : hmap["Faskes Key"]);
  if (colME === undefined || colKey === undefined) return;

  const meVals  = sheet.getRange(2, colME + 1, lastRow - 1, 1).getValues();
  const keyVals = sheet.getRange(2, colKey + 1, lastRow - 1, 1).getValues();

  const targetKey = _normKey_(faskesKey);
  for (let i = 0; i < meVals.length; i++) {
    const m = _sToInt_(meVals[i][0]);
    const k = _normKey_(keyVals[i][0]);
    if (m === me && targetKey && k && k === targetKey) {
      throw new Error(`Laporan DOUBEL ditolak: Faskes sudah mengirim laporan untuk ME ${me}.`);
    }
  }
}

/** ========= MAIN ========= */
function submitSARS(formData) {
  // Server-side auth is mandatory. Never trust facility identity from client payload.
  if (formData === undefined || formData === null) throw new Error("Payload formData kosong/invalid.");
  // Parse first so token cannot be bypassed by sending JSON text.
  if (typeof formData === "string") {
    try { formData = JSON.parse(formData); } catch (e) { throw new Error("Payload formData string bukan JSON valid."); }
  }
  _sRequire_(_sIsObj_(formData), "Payload formData harus object.");
  const session = _getSarsSubmitSession_(formData);
  _sRequire_(Array.isArray(formData.cases), "Payload cases harus array.");

  // Identity comes from authenticated session. Client identity fields are ignored.
  const email         = _sTrim_(session.user.email);
  const me            = _sToInt_(formData.mingguEpid);
  const namaPetugas   = _sTrim_(session.user.nama || session.user.name || session.user.username || email);
  const noWA          = _sTrim_(session.user.noWhatsapp || session.user.noWA || formData.noWA);
  const unit          = _sTrim_(session.user.unitKerja || session.user.unit || formData.unitPelapor);
  const jenisFasyankes= _sTrim_(formData.jenisFaskes);
  const clientFacility = _sTrim_(formData.asalFaskes);
  const sessionFacility = (typeof getSarsFacilityForActiveUser === 'function')
    ? getSarsFacilityForActiveUser(email)
    : { status: 'error', message: 'Resolver fasilitas SARS tidak tersedia.' };
  _sRequire_(sessionFacility && sessionFacility.status === 'success', sessionFacility.message || 'Akun/fasilitas tidak terdaftar di REF_FASKES.');
  const namaFasyankes = _sTrim_(sessionFacility.nama);
  const sessionKey = _normKey_(sessionFacility.key);
  const sessionCode = _normKey_(session.user.kodePuskesmas || session.user.kodeFaskes || '');
  _sRequire_(sessionKey && (!sessionCode || sessionKey === sessionCode), 'Mapping fasilitas akun tidak konsisten.');
  if (clientFacility && _normKey_(clientFacility) !== sessionKey && _normKey_(clientFacility) !== _normKey_(namaFasyankes)) {
    throw new Error('Fasilitas laporan tidak sesuai dengan akun login.');
  }

  _sRequire_(Number.isFinite(me) && me >= 1 && me <= 53, "Minggu epidemiologis tidak valid.");
  _sRequire_(namaPetugas, "Nama petugas pelapor wajib diisi.");
  _sRequire_(noWA, "Nomor WhatsApp wajib diisi.");
  _sRequire_(unit, "Unit surveilans wajib diisi.");
  _sRequire_(jenisFasyankes, "Jenis fasilitas kesehatan wajib diisi.");
  _sRequire_(namaFasyankes, "Nama fasilitas kesehatan wajib diisi.");

  const cfg = _getCfg_();
  const ss = _openSs_();
  const shData = _getSheet_(ss, cfg.SHEET_DATA || "SARS");

  const hm = _headerMap_(shData);
  const hmap = hm.map;
  const headersLen = hm.headers.length;

  // pastikan header yang Anda kirim ada
  const MUST = [
    "Waktu Submit","Email Petugas","ME","Nama Petugas","No Whatsapp","Unit Surveilans",
    "Jenis Fasyankes","Nama Fasyankes","Nama Penyakit","Nihil",
    "Tgl Lahir","Spesimen / Penolong","Diagnosis Medis/Banding",
    "Deadline","OnTime"
  ];
  MUST.forEach(h => _sRequire_(h in hmap, `Header "${h}" tidak ditemukan di sheet ${shData.getName()}.`));
  _sRequire_(
    hmap["KodeFaskes"] !== undefined || hmap["FaskesKey"] !== undefined || hmap["Faskes Key"] !== undefined,
    `Header "KodeFaskes" tidak ditemukan di sheet ${shData.getName()}. Gunakan "KodeFaskes" atau "FaskesKey".`
  );
  _sRequire_(hmap["KodeFaskes Pengampu"] !== undefined || hmap["FaskesPengampu"] !== undefined,
    `Header "KodeFaskes Pengampu" tidak ditemukan di sheet ${shData.getName()}.`);

  // master lookup
  const masterIndex = _buildMasterIndex_();
  const sessionEmail = (() => { try { return Session.getActiveUser().getEmail() || email; } catch (e) { return email; } })();
  const accountLookup = _lookupFaskesByEmail_(masterIndex, sessionEmail);
  const lk = accountLookup || _lookupFaskes_(masterIndex, namaFasyankes);

  // faskesKey harus ada minimal turunan
  const faskesKey = _sTrim_(lk.faskesKey);
  _sRequire_(faskesKey, `FaskesKey tidak bisa dibuat dari NamaFasyankes: "${namaFasyankes}".`);

  _sRequire_(lk.found, `Akun/fasilitas kesehatan tidak terdaftar sebagai wajib lapor aktif di REF_FASKES: "${namaFasyankes}".`);

  const faskesPengampu = _sTrim_(lk.pengampu);

  // validasi dobel
  _checkDuplicate_(shData, hmap, me, faskesKey);

  // deadline & ontime
  const submittedAt = new Date();
  const { deadline, onTime } = _computeDeadlineAndOnTime_(me, submittedAt);

  // build rows
  const rowsToAppend = [];

  formData.cases.forEach((c) => {
    const penyakit = _sTrim_(c.jenis);
    _sRequire_(penyakit, "Ada item case tanpa 'jenis' (Nama Penyakit).");

    const isNihil = !!c.nihl;
    const row = new Array(headersLen).fill("");

    // ===== identitas laporan (yang sempat kosong) =====
    _set_(row, hmap, "Waktu Submit", submittedAt);
    _set_(row, hmap, "Email Petugas", email);
    _set_(row, hmap, "ME", me);
    _set_(row, hmap, "Nama Petugas", namaPetugas);
    _set_(row, hmap, "No Whatsapp", noWA);
    _set_(row, hmap, "Unit Surveilans", unit);

    _set_(row, hmap, "Jenis Fasyankes", jenisFasyankes);
    _set_(row, hmap, "Nama Fasyankes", namaFasyankes);

    // ===== penyakit =====
    _set_(row, hmap, "Nama Penyakit", penyakit);
    _set_(row, hmap, "Nihil", isNihil ? "TRUE" : "FALSE");

    // ===== detail kasus =====
    if (!isNihil) {
      _set_(row, hmap, "Nama Kasus", _sTrim_(c.nama));
      _set_(row, hmap, "Tgl Lahir", _sTrim_(c.tglLahir));
      _set_(row, hmap, "Jenis Kelamin", _sTrim_(c.jk));
      _set_(row, hmap, "Nama Ortu", _sTrim_(c.namaOrtu));
      _set_(row, hmap, "Alamat & No Telp", _sTrim_(c.alamat));
      _set_(row, hmap, "Tanggal Mulai", _sTrim_(c.tglMulai));
      _set_(row, hmap, "Gejala", _sTrim_(c.gejala));
      _set_(row, hmap, "Status Imunisasi", _sTrim_(c.imunisasi));
      _set_(row, hmap, "Keadaan (H/M)", _sTrim_(c.keadaan));
      _set_(row, hmap, "Spesimen / Penolong", _sTrim_(c.spesimenPenolong));
      _set_(row, hmap, "Diagnosis Medis/Banding", _sTrim_(c.diagnosis));
    }

    // ===== ketepatan =====
    _set_(row, hmap, "Deadline", deadline);
    _set_(row, hmap, "OnTime", onTime ? "TRUE" : "FALSE");

    // ===== master derived =====
    _setAny_(row, hmap, ["KodeFaskes Pengampu", "FaskesPengampu"], faskesPengampu);
    _set_(row, hmap, "KodeFaskes", faskesKey);

    rowsToAppend.push(row);
  });

  _sRequire_(rowsToAppend.length > 0, "Tidak ada baris yang dapat disimpan.");

  // append, lalu verifikasi baca-balik. Jangan laporkan sukses jika write gagal/salah target.
  const firstWriteRow = shData.getLastRow() + 1;
  shData.getRange(firstWriteRow, 1, rowsToAppend.length, headersLen).setValues(rowsToAppend);
  try { if (typeof sarsDash_invalidateDashboardCache_ === "function") sarsDash_invalidateDashboardCache_(); } catch (e) {}
  SpreadsheetApp.flush();
  const verifyValues = shData.getRange(firstWriteRow, 1, rowsToAppend.length, headersLen).getValues();
  _sRequire_(verifyValues.length === rowsToAppend.length, `Verifikasi simpan gagal di sheet ${shData.getName()}.`);

  let adminTelegramNotifications = [];
  let adminWahaNotification = { sent: false, reason: 'SKIPPED' };
  const zeroNotificationDetails = {
      caseCode: 'SARS-ME' + me + '-' + faskesKey + '-' + firstWriteRow,
      action: 'Review input zero reporting baru',
      workspace: 'zero-reporting',
      namaFasyankes: namaFasyankes,
      count: rowsToAppend.length,
    status: 'BARU'
  };
  try {
    adminTelegramNotifications = sendAdminOperationalTelegramNotificationsOnce('ZERO_REPORTING_BARU', zeroNotificationDetails);
  } catch (_e) {}
  try {
    adminWahaNotification = sendAdminOperationalWahaNotificationOnce('ZERO_REPORTING_BARU', zeroNotificationDetails);
  } catch (_e) {}

  // info balik ke client
  return {
    ok: true,
    savedRows: rowsToAppend.length,
    targetSpreadsheetId: ss.getId(),
    targetSheet: shData.getName(),
    firstWriteRow,
    me,
    namaFasyankes,
    faskesKey,
    faskesPengampu,
    masterFound: lk.found,
    onTime: !!onTime,
    adminTelegramNotifications,
    adminWahaNotification
  };
}
