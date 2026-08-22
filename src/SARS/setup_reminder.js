/************************************
 * setup_reminder.gs — FINAL (Wave 100/100/sisa) — SARS PD3I Depok
 *
 * PERMINTAAN (FINAL):
 * ✅ Deadline laporan di email: Senin 23:59 WIB (mengikuti config.gs)
 * ✅ Jadwal email notifikasi:
 *    1) Sabtu 18:30 WIB  -> kirim 100 faskes (yang punya email; kosong di-skip)
 *    2) Minggu 07:30 WIB -> kirim 100 faskes berikutnya (yang punya email; kosong di-skip)
 *    3) Senin 07:30 WIB  -> kirim SISA faskes yang belum terkirim
 *
 * PRINSIP PENTING:
 * ✅ Setiap wave menghitung ulang "BELUM LAPOR" (dinamis) untuk EW laporan terpilih.
 * ✅ Namun urutan & pembagian 100/100/sisa harus KONSISTEN antar-wave.
 *    -> Karena itu kita pakai "recipientKey list" yang stabil (urut by key/nama),
 *       dan kita simpan "Wave progress" berbasis EW (week+year) + Wave code.
 * ✅ Tidak ada batas 90/hari lagi; sesuai skenario wave baru.
 * ✅ Batch engine tetap dipakai untuk aman dari runtime limit.
 *
 * LOG:
 * - LOG_REMINDER akan diisi SENT/FAIL + metadata wave.
 *
 * PRASYARAT:
 * - config.gs menyediakan: openSarsSpreadsheet(), getSarsTimezone(), getSitesFormUrl()
 * - epi_week.gs menyediakan: getEpidWeekForReporting() dan getEpidWeek(date)
 * - SARS minimal punya: Waktu Submit, ME, (FaskesKey disarankan), Nama Fasyankes (fallback)
 * - REF_FASKES minimal punya: NamaFaskes, Email, KodePuskesmas, StatusAktif opsional
 ************************************/

/** ===============================
 *  KONFIG
 *  =============================== */
function REMINDER_CFG_() {
  const cfg = (typeof SARS_CONFIG !== "undefined" && SARS_CONFIG) ? SARS_CONFIG : {};
  const tz = (typeof getSarsTimezone === "function")
    ? (getSarsTimezone() || "Asia/Jakarta")
    : (cfg.TIMEZONE || "Asia/Jakarta");

  // aturan wave baru
  const waveChunkSize = 100;

  // batch size untuk sekali eksekusi (MailApp + log)
  const batchSize = 30;

  // delay batch lanjutan (menit)
  const nextBatchDelayMinutes = 3;

  // stop jika gagal berturut-turut
  const maxConsecutiveFails = 10;

  // sheet names
  const sheetMaster = (cfg.SHEET_MASTER) ? String(cfg.SHEET_MASTER) : "REF_FASKES";
  const sheetData   = (cfg.SHEET_DATA)   ? String(cfg.SHEET_DATA)   : "SARS";
  const sheetLog    = (cfg.SHEET_LOG_REMINDER) ? String(cfg.SHEET_LOG_REMINDER) : "LOG_REMINDER";

  // link & kontak
  const formUrl = (typeof getSitesFormUrl === "function")
    ? (getSitesFormUrl() || "")
    : ((cfg.SITES_FORM_URL) ? String(cfg.SITES_FORM_URL) : "");

  const contactWA = (cfg.CONTACT_WA) ? String(cfg.CONTACT_WA) : "";

  const subjectPrefix = (cfg.REMINDER && cfg.REMINDER.SUBJECT_PREFIX)
    ? String(cfg.REMINDER.SUBJECT_PREFIX)
    : "🔔 Reminder Laporan SARS-PD3I";

  // deadline teks (harus ikut config.gs)
  const dlHour = (cfg.REPORTING && cfg.REPORTING.DEADLINE_HOUR !== undefined) ? Number(cfg.REPORTING.DEADLINE_HOUR) : 23;
  const dlMin  = (cfg.REPORTING && cfg.REPORTING.DEADLINE_MINUTE !== undefined) ? Number(cfg.REPORTING.DEADLINE_MINUTE) : 59;
  const deadlineText = `Senin pukul ${pad2_(dlHour)}.${pad2_(dlMin)} WIB`;

  /**
   * Jadwal wave:
   * dayNum: 0=SUN .. 6=SAT (mengacu JS Date.getDay())
   */
  const waves = [
    { code: "W1", dayNum: 6, hour: 18, minute: 30, label: "Wave 1 (Sabtu 18:30)", chunkSize: waveChunkSize },
    { code: "W2", dayNum: 0, hour: 7,  minute: 30, label: "Wave 2 (Minggu 07:30)", chunkSize: waveChunkSize },
    { code: "W3", dayNum: 1, hour: 7,  minute: 30, label: "Wave 3 (Senin 07:30)", chunkSize: -1 }, // -1 = kirim sisa
  ];

  return {
    tz,
    waveChunkSize,
    batchSize,
    nextBatchDelayMinutes,
    maxConsecutiveFails,
    sheetMaster,
    sheetData,
    sheetLog,
    formUrl,
    contactWA,
    subjectPrefix,
    dlHour,
    dlMin,
    deadlineText,
    waves
  };
}

function pad2_(n) {
  const x = Number(n);
  if (!isFinite(x)) return "00";
  return (x < 10 ? "0" : "") + String(Math.floor(x));
}

/** ===============================
 *  INSTALL TRIGGERS (WAVE)
 *  =============================== */

/**
 * Pasang trigger wave sesuai jadwal baru:
 * - Sabtu 18:30
 * - Minggu 07:30
 * - Senin 07:30
 * Jalankan manual 1x saat setup.
 */
function installReminderWaveTriggers() {
  const cfg = REMINDER_CFG_();

  // hindari dobel
  deleteTriggersByHandler_("REMINDER_wave_runner");
  deleteTriggersByHandler_("REMINDER_sendNextBatch");

  cfg.waves.forEach(w => {
    const weekDay = dayNumToWeekDay_(w.dayNum);
    let t = ScriptApp.newTrigger("REMINDER_wave_runner")
      .timeBased()
      .onWeekDay(weekDay)
      .atHour(w.hour);

    // Apps Script: nearMinute, bukan atMinute
    if (typeof t.nearMinute === "function") t = t.nearMinute(w.minute);
    t.create();
  });

  Logger.log("✅ Trigger reminder terpasang: Sabtu 18:30, Minggu 07:30, Senin 07:30 (WIB).");
}

function deleteTriggersByHandler_(handler) {
  ScriptApp.getProjectTriggers().forEach(t => {
    if (t.getHandlerFunction && t.getHandlerFunction() === handler) {
      ScriptApp.deleteTrigger(t);
    }
  });
}

/** Konversi 0..6 (SUN..SAT) -> ScriptApp.WeekDay */
function dayNumToWeekDay_(dayNum) {
  switch (Number(dayNum)) {
    case 0: return ScriptApp.WeekDay.SUNDAY;
    case 1: return ScriptApp.WeekDay.MONDAY;
    case 2: return ScriptApp.WeekDay.TUESDAY;
    case 3: return ScriptApp.WeekDay.WEDNESDAY;
    case 4: return ScriptApp.WeekDay.THURSDAY;
    case 5: return ScriptApp.WeekDay.FRIDAY;
    case 6: return ScriptApp.WeekDay.SATURDAY;
    default: return ScriptApp.WeekDay.SUNDAY;
  }
}

/** ===============================
 *  WAVE RUNNER
 *  =============================== */

/**
 * Handler tunggal untuk semua wave (dipanggil trigger).
 * Deteksi wave pakai (dayNum,hour,minute) di timezone tz.
 */
function REMINDER_wave_runner() {
  const cfg = REMINDER_CFG_();
  const tz = cfg.tz;

  const now = new Date();
  const dayNum = Number(Utilities.formatDate(now, tz, "u")); // ISO 1..7 (Mon..Sun)
  const dayNumJs = isoToJsDay_(dayNum);                      // 0..6 (Sun..Sat)
  const hour = Number(Utilities.formatDate(now, tz, "H"));
  const minute = Number(Utilities.formatDate(now, tz, "m"));

  const wave = pickWaveByNow_(cfg.waves, dayNumJs, hour, minute);
  if (!wave) {
    Logger.log("Wave tidak cocok jadwal. dayNum=" + dayNumJs + " hour=" + hour + " minute=" + minute);
    return;
  }

  REMINDER_startWaveRun_(wave.code, wave.label, wave.chunkSize);
}

/** ISO day (1=Mon..7=Sun) -> JS day (0=Sun..6=Sat) */
function isoToJsDay_(isoDay) {
  const d = Number(isoDay);
  if (d === 7) return 0;
  if (d >= 1 && d <= 6) return d;
  return 0;
}

function pickWaveByNow_(waves, dayNum, hour, minute) {
  // toleransi minute kecil: karena nearMinute bisa geser,
  // kita anggap match jika selisih <= 3 menit dari target.
  const tol = 3;
  return (waves || []).find(w => {
    if (Number(w.dayNum) !== Number(dayNum)) return false;
    if (Number(w.hour) !== Number(hour)) return false;
    const mm = Number(w.minute);
    return Math.abs(Number(minute) - mm) <= tol;
  }) || null;
}

/** ===============================
 *  CORE WAVE START (100/100/sisa)
 *  =============================== */
function REMINDER_startWaveRun_(waveCode, waveLabel, chunkSize) {
  const cfg = REMINDER_CFG_();
  const lock = LockService.getScriptLock();
  lock.waitLock(25 * 1000);

  try {
    const epid = (typeof getEpidWeekForReporting === "function") ? getEpidWeekForReporting() : null;
    if (!epid || !epid.week || !epid.year) throw new Error("getEpidWeekForReporting() tidak tersedia/invalid.");

    // hitung semua recipient "belum lapor" (punya email saja) -> urut stabil
    const allRecipients = REMINDER_getRecipientsBelumLapor_(Number(epid.week), Number(epid.year));

    if (!allRecipients.length) {
      Logger.log(`Tidak ada penerima (semua sudah lapor / email kosong). Wave=${waveCode}`);
      REMINDER_logWaveSummary_(waveCode, waveLabel, epid, 0, "SKIP", "Semua sudah lapor / recipient=0");
      return;
    }

    // bagi 100/100/sisa berbasis urutan stabil
    const chunk = REMINDER_pickRecipientsForWave_(allRecipients, waveCode, chunkSize);

    if (!chunk.length) {
      Logger.log(`Wave ${waveCode} tidak ada target (mungkin sudah terkirim di wave sebelumnya atau jumlah < batas).`);
      REMINDER_logWaveSummary_(waveCode, waveLabel, epid, allRecipients.length, "SKIP", "Tidak ada target untuk wave ini.");
      return;
    }

    // state batch
    const runId = `RUN_${Utilities.formatDate(new Date(), cfg.tz, "yyyyMMdd_HHmmss")}_${waveCode}_EW${epid.week}_${epid.year}`;

    const props = PropertiesService.getScriptProperties();
    props.setProperty("REMINDER_RUN_ID", runId);
    props.setProperty("REMINDER_WAVE", waveCode);
    props.setProperty("REMINDER_WAVE_LABEL", waveLabel || waveCode);
    props.setProperty("REMINDER_CURSOR", "0");
    props.setProperty("REMINDER_BATCH_NO", "1");
    props.setProperty("REMINDER_FAILS", "0");

    props.setProperty("REMINDER_EPI_JSON", JSON.stringify({
      week: epid.week,
      year: epid.year,
      rangeLabel: epid.rangeLabel || "",
      weeksInYear: epid.weeksInYear || ""
    }));

    props.setProperty("REMINDER_RECIPIENTS_JSON", JSON.stringify(chunk));

    // bersihkan trigger batch lama lalu kirim batch pertama
    deleteTriggersByHandler_("REMINDER_sendNextBatch");
    REMINDER_sendNextBatch();

    REMINDER_logWaveSummary_(waveCode, waveLabel, epid, chunk.length, "START", `Mulai kirim ${chunk.length} email (chunkSize=${chunkSize}).`);

  } finally {
    lock.releaseLock();
  }
}

/**
 * Pembagian wave berdasarkan list stabil:
 * - W1: index 0..99
 * - W2: index 100..199
 * - W3: index 200..end
 * Kalau chunkSize = -1 => sisa (mulai offset sesuai wave code).
 */
function REMINDER_pickRecipientsForWave_(allRecipients, waveCode, chunkSize) {
  const list = (allRecipients || []).slice();

  // Stabilkan urutan agar tidak berubah-ubah antar wave
  list.sort((a, b) => {
    const ka = String(a.key || "").localeCompare(String(b.key || ""), "en");
    if (ka !== 0) return ka;
    return String(a.namaFaskes || "").localeCompare(String(b.namaFaskes || ""), "id-ID");
  });

  const size = Number(chunkSize);

  let start = 0;
  if (waveCode === "W1") start = 0;
  else if (waveCode === "W2") start = 100;
  else if (waveCode === "W3") start = 200;
  else start = 0;

  if (start >= list.length) return [];

  if (size === -1) {
    return list.slice(start);
  }

  const end = Math.min(list.length, start + size);
  return list.slice(start, end);
}

/** ===============================
 *  HITUNG "BELUM LAPOR" (MASTER vs DATA)
 *  - hanya faskes yang punya email
 *  - target: (EW laporan, epiYear laporan)
 *  =============================== */
function REMINDER_getRecipientsBelumLapor_(targetWeek, targetEpiYear) {
  const cfg = REMINDER_CFG_();
  const ss = openSarsSpreadsheet();

  const masterSh = ss.getSheetByName(cfg.sheetMaster);
  if (!masterSh) throw new Error(`Sheet MASTER "${cfg.sheetMaster}" tidak ditemukan.`);

  const dataSh = ss.getSheetByName(cfg.sheetData);
  if (!dataSh) throw new Error(`Sheet DATA "${cfg.sheetData}" tidak ditemukan.`);

  // --- MASTER
  const masterVals = masterSh.getDataRange().getValues();
  if (masterVals.length < 2) return [];

  const mh = (masterVals[0] || []).map(x => String(x || "").trim());
  const miNama  = findHeader_(mh, ["NamaFaskes","Nama Faskes","Nama Fasyankes","NamaFasyankes","Nama Fasyankes"]);
  const miEmail = findHeader_(mh, ["Email","Email Faskes","EmailFaskes","Email PIC","Email PIC Faskes"]);
  const miKey   = findHeader_(mh, ["KodeFaskes","Key"]);
  const miAktif = findHeader_(mh, ["StatusAktif","Status","Aktif"]);

  if (miNama < 0) throw new Error('MASTER_DATA: kolom "NamaFaskes" tidak ditemukan.');
  if (miEmail < 0) throw new Error('MASTER_DATA: kolom "Email" tidak ditemukan. Tambahkan kolom Email untuk notifikasi.');

  // --- DATA
  const dataVals = dataSh.getDataRange().getValues();
  if (dataVals.length < 2) {
    // belum ada laporan sama sekali -> semua master aktif yg punya email
    return REMINDER_masterToRecipients_(masterVals, miNama, miEmail, miKey, miAktif);
  }

  const dh = (dataVals[0] || []).map(x => String(x || "").trim());
  const diWeek  = findHeader_(dh, ["ME","Minggu Epid","MingguEpid","EW"]);
  const diKey   = findHeader_(dh, ["faskes_key","FaskesKey","Faskes Key","KodeFaskes","Key"]);
  const diNama  = findHeader_(dh, ["nama_faskes","Nama Fasyankes","NamaFasyankes","Asal Faskes","AsalFaskes","Nama Faskes","NamaFaskes"]);
  const diWaktu = findHeader_(dh, ["Waktu Submit","WaktuSubmit","Timestamp"]);

  if (diWeek < 0) throw new Error('SARS: kolom "ME" tidak ditemukan.');
  if (diWaktu < 0) throw new Error('SARS: kolom "Waktu Submit" tidak ditemukan (dibutuhkan untuk hitung epiYear).');

  // set: sudah lapor
  const reportedKeySet = {};

  for (let r = 1; r < dataVals.length; r++) {
    const row = dataVals[r] || [];

    const w = toWeek_(row[diWeek]);
    if (!isFinite(w) || Number(w) !== Number(targetWeek)) continue;

    const epi = REMINDER_getEpiFromSubmit_(row[diWaktu]);
    if (!epi || !epi.year || Number(epi.year) !== Number(targetEpiYear)) continue;

    let key = (diKey >= 0) ? normalizeKey_(row[diKey]) : "";
    if (!key) {
      const nm = (diNama >= 0) ? String(row[diNama] || "").trim() : "";
      if (nm) key = normalizeKey_(nm);
    }
    if (key) reportedKeySet[key] = true;
  }

  // recipients: master aktif + ada email - sudah lapor
  const out = [];
  for (let r = 1; r < masterVals.length; r++) {
    const row = masterVals[r] || [];

    if (miAktif >= 0) {
      const st = String(row[miAktif] || "").trim().toUpperCase();
      if (st && st !== "AKTIF") continue;
    }

    const nama = String(row[miNama] || "").trim();
    if (!nama) continue;

    const email = String(row[miEmail] || "").trim();
    if (!email) continue; // ✅ kosong => skip

    const key = (miKey >= 0 && String(row[miKey] || "").trim())
      ? normalizeKey_(row[miKey])
      : normalizeKey_(nama);

    if (!key) continue;
    if (reportedKeySet[key]) continue;

    out.push({ email, namaFaskes: nama, key });
  }

  return out;
}

function REMINDER_masterToRecipients_(masterVals, miNama, miEmail, miKey, miAktif) {
  const out = [];
  for (let r = 1; r < masterVals.length; r++) {
    const row = masterVals[r] || [];

    if (miAktif >= 0) {
      const st = String(row[miAktif] || "").trim().toUpperCase();
      if (st && st !== "AKTIF") continue;
    }

    const nama = String(row[miNama] || "").trim();
    if (!nama) continue;

    const email = String(row[miEmail] || "").trim();
    if (!email) continue; // ✅ skip kosong

    const key = (miKey >= 0 && String(row[miKey] || "").trim())
      ? normalizeKey_(row[miKey])
      : normalizeKey_(nama);

    if (!key) continue;

    out.push({ email, namaFaskes: nama, key });
  }
  return out;
}

/** epiYear dari Waktu Submit (pakai getEpidWeek bila ada) */
function REMINDER_getEpiFromSubmit_(submitVal) {
  try {
    if (typeof getEpidWeek === "function") {
      const d = (submitVal instanceof Date) ? submitVal : new Date(submitVal);
      if (isNaN(d)) return null;
      const epi = getEpidWeek(d);
      if (epi && epi.year) return epi;
    }
  } catch (e) {}

  // fallback: tahun kalender
  const d2 = (submitVal instanceof Date) ? submitVal : new Date(submitVal);
  if (isNaN(d2)) return null;
  return { year: d2.getFullYear(), week: null };
}

/** ===============================
 *  HELPERS NORMALIZATION
 *  =============================== */
function findHeader_(headers, candidates) {
  const norm = (s) => String(s || "").trim().toLowerCase();
  const H = (headers || []).map(norm);
  for (const c of candidates) {
    const idx = H.indexOf(norm(c));
    if (idx >= 0) return idx;
  }
  return -1;
}

function normalizeKey_(name) {
  return String(name || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

function toWeek_(v) {
  if (v === null || v === undefined || v === "") return NaN;
  if (typeof v === "number") return Math.floor(v);
  const m = String(v).match(/(\d{1,2})/);
  return m ? Number(m[1]) : NaN;
}

/** ===============================
 *  BATCH SENDER (stateful)
 *  =============================== */
function REMINDER_sendNextBatch() {
  const cfg = REMINDER_CFG_();
  const lock = LockService.getScriptLock();
  lock.waitLock(25 * 1000);

  try {
    const props = PropertiesService.getScriptProperties();

    const runId = props.getProperty("REMINDER_RUN_ID") || "";
    const wave = props.getProperty("REMINDER_WAVE") || "";
    const waveLabel = props.getProperty("REMINDER_WAVE_LABEL") || wave;

    const recipientsJson = props.getProperty("REMINDER_RECIPIENTS_JSON") || "[]";
    const epiJson = props.getProperty("REMINDER_EPI_JSON") || "{}";

    const recipients = JSON.parse(recipientsJson);
    const epi = JSON.parse(epiJson);

    let cursor = Number(props.getProperty("REMINDER_CURSOR") || "0");
    let batchNo = Number(props.getProperty("REMINDER_BATCH_NO") || "1");
    let fails = Number(props.getProperty("REMINDER_FAILS") || "0");

    if (!runId || !Array.isArray(recipients) || recipients.length === 0) {
      Logger.log("State kosong. Tidak ada yang dikirim.");
      deleteTriggersByHandler_("REMINDER_sendNextBatch");
      return;
    }

    const start = cursor;
    const end = Math.min(recipients.length, cursor + cfg.batchSize);
    const slice = recipients.slice(start, end);

    const ss = openSarsSpreadsheet();
    const logSheet = ss.getSheetByName(cfg.sheetLog);

    const subject = `${cfg.subjectPrefix} EW ${epi.week} (${epi.year}) — ${waveLabel}`;
    const periodLine = epi.rangeLabel ? `• Periode     : ${epi.rangeLabel}\n` : "";

    for (let i = 0; i < slice.length; i++) {
      const r = slice[i];
      try {
        const body =
          `Yth. Tim Surveilans ${r.namaFaskes},\n\n` +
          `Reminder ini dikirim karena pada sistem, fasilitas Anda masih tercatat BELUM mengirim laporan SARS-PD3I untuk:\n` +
          `• Minggu Epid : EW ${epi.week}\n` +
          periodLine +
          `Batas pengiriman: ${cfg.deadlineText}.\n\n` +            // ✅ deadline baru
          `Silakan isi pada tautan berikut:\n` +
          `${cfg.formUrl}\n\n` +
          `Jika tidak ada kasus PD3I, mohon tetap lapor dengan NIHIL.\n\n` +
          (cfg.contactWA
            ? `Jika ada kendala, silakan hubungi PIC (${cfg.contactWA}).\n\n`
            : "\n") +
          `Terima kasih.\n` +
          `Tim Kerja Surveilans dan Imunisasi\n` +
          `Dinas Kesehatan Kota Depok`;

        MailApp.sendEmail({ to: r.email, subject: subject, body: body });

        if (logSheet) {
          logSheet.appendRow([
            new Date(),
            runId,
            wave,
            batchNo,
            r.namaFaskes,
            r.email,
            "SENT",
            "",
            `EW ${epi.week} ${epi.year}`,
            r.key || ""
          ]);
        }

      } catch (err) {
        fails++;
        props.setProperty("REMINDER_FAILS", String(fails));

        if (logSheet) {
          logSheet.appendRow([
            new Date(),
            runId,
            wave,
            batchNo,
            r.namaFaskes,
            r.email,
            "FAIL",
            (err && err.message) ? err.message : String(err),
            `EW ${epi.week} ${epi.year}`,
            r.key || ""
          ]);
        }

        if (fails >= cfg.maxConsecutiveFails) {
          deleteTriggersByHandler_("REMINDER_sendNextBatch");
          REMINDER_clearWaveState_();
          throw new Error(`Stop: gagal berturut-turut mencapai batas (${cfg.maxConsecutiveFails}).`);
        }
      }
    }

    // update cursor
    cursor = end;
    props.setProperty("REMINDER_CURSOR", String(cursor));
    props.setProperty("REMINDER_BATCH_NO", String(batchNo + 1));

    // selesai?
    if (cursor >= recipients.length) {
      deleteTriggersByHandler_("REMINDER_sendNextBatch");
      REMINDER_clearWaveState_();
      Logger.log(`✅ Reminder wave selesai. RunId=${runId}, wave=${wave}, total=${recipients.length}`);
      return;
    }

    // masih sisa -> trigger sekali-jalan
    deleteTriggersByHandler_("REMINDER_sendNextBatch");
    ScriptApp.newTrigger("REMINDER_sendNextBatch")
      .timeBased()
      .after(cfg.nextBatchDelayMinutes * 60 * 1000)
      .create();

    Logger.log(`Batch selesai (${start}-${end}). Sisa=${recipients.length - cursor}. Next in ${cfg.nextBatchDelayMinutes} min.`);

  } finally {
    lock.releaseLock();
  }
}

function REMINDER_clearWaveState_() {
  const props = PropertiesService.getScriptProperties();
  [
    "REMINDER_RECIPIENTS_JSON",
    "REMINDER_EPI_JSON",
    "REMINDER_CURSOR",
    "REMINDER_BATCH_NO",
    "REMINDER_FAILS",
    "REMINDER_RUN_ID",
    "REMINDER_WAVE",
    "REMINDER_WAVE_LABEL"
  ].forEach(k => props.deleteProperty(k));
}

/** ===============================
 *  LOG SUMMARY (opsional)
 *  =============================== */
function REMINDER_logWaveSummary_(waveCode, waveLabel, epid, totalRecipients, status, message) {
  const cfg = REMINDER_CFG_();
  const ss = openSarsSpreadsheet();
  const logSheet = ss.getSheetByName(cfg.sheetLog);
  if (!logSheet) return;

  const runId = `WAVE_${Utilities.formatDate(new Date(), cfg.tz, "yyyyMMdd_HHmmss")}_${waveCode}_EW${epid.week}_${epid.year}`;
  logSheet.appendRow([
    new Date(),
    runId,
    waveCode,
    0,
    `(WAVE) ${waveLabel}`,
    "",
    String(status || "INFO"),
    `${message || ""} | recipient=${totalRecipients || 0}`,
    `EW ${epid.week} ${epid.year}`,
    ""
  ]);
}

/** ===============================
 *  UTIL OPSIONAL (manual)
 *  =============================== */
function REMINDER_stop() {
  deleteTriggersByHandler_("REMINDER_sendNextBatch");
  REMINDER_clearWaveState_();
  Logger.log("⛔ Reminder batch dihentikan & state dibersihkan.");
}

/**
 * Test manual: jalankan sekarang (tanpa tunggu trigger).
 * Default: bertindak seperti W1 (kirim 100 pertama).
 */
function REMINDER_runNowManual() {
  REMINDER_startWaveRun_("W1", "Manual Run (W1 behavior)", 100);
}

/**
 * Test manual wave tertentu:
 * REMINDER_runWaveManual_("W2") atau ("W3")
 */
function REMINDER_runWaveManual_(waveCode) {
  const cfg = REMINDER_CFG_();
  const w = (cfg.waves || []).find(x => String(x.code) === String(waveCode));
  if (!w) throw new Error("Wave tidak dikenal: " + waveCode);
  REMINDER_startWaveRun_(w.code, `Manual Run (${w.label})`, w.chunkSize);
}
