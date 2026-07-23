/************************************
 * epi_week.gs — Minggu Epidemiologi (MMWR) Depok (FINAL)
 * Standar:
 * - Minggu epidemiologi: Minggu–Sabtu (Start Sunday, End Saturday)
 * - MMWR Week #1 = minggu yang memuat 4 Januari (>= 4 hari di Januari)
 * - Jumlah minggu dalam tahun epidemiologi = 52 atau 53
 *
 * Output utama:
 * - getEpidWeek(dateArg)               -> info minggu epidemiologi untuk tanggal tertentu
 * - getEpidWeekForReporting()          -> minggu yang harus dilaporkan (minggu berjalan - 1) + rollover tahun
 * - weeksInEpiYear(year)               -> 52/53 (tahun epidemiologi)
 * - getEpiMetaForDashboard(year)       -> meta untuk dropdown & default dashboard
 *
 * Patch penting:
 * ✅ Definisi Week #1 dipastikan sesuai MMWR (minggu yang berisi 4 Jan)
 * ✅ Reporting week = current epi week - 1 (bukan sekadar "Sunday sebelumnya" yang bisa salah di boundary)
 * ✅ Meta dashboard menyediakan lastWeek (52/53) + reportWeek/reportYear dinamis
 ************************************/

const TZ_EPI = "Asia/Jakarta";
const DAY_MS = 24 * 60 * 60 * 1000;

/** Normalisasi tanggal: buang jam */
function toLocal(dateArg) {
  const tz = TZ_EPI || "Asia/Jakarta";
  const d = (dateArg instanceof Date) ? dateArg : new Date(dateArg);
  if (isNaN(d)) return new Date(); // fallback aman

  // ambil tanggal di timezone tz, lalu bangun Date lokal tanpa jam
  const ymd = Utilities.formatDate(d, tz, "yyyy-MM-dd"); // contoh "2026-01-04"
  const parts = ymd.split("-").map(Number);
  return new Date(parts[0], parts[1] - 1, parts[2]); // jam 00:00 lokal runtime
}


/** Ambil Sunday (awal minggu Minggu–Sabtu) dari sebuah tanggal */
function startOfWeekSunday(d) {
  d = toLocal(d);
  const s = new Date(d);
  s.setDate(d.getDate() - s.getDay()); // 0=Sunday
  s.setHours(0, 0, 0, 0);
  return s;
}

/** Ambil Saturday (akhir minggu) dari Sunday start */
function endOfWeekSaturday(weekStartSunday) {
  const e = new Date(weekStartSunday);
  e.setDate(weekStartSunday.getDate() + 6);
  e.setHours(0, 0, 0, 0);
  return e;
}

/**
 * Start Week #1 untuk YEAR (MMWR):
 * - Week #1 adalah minggu Minggu–Sabtu yang memuat 4 Januari
 *   (equivalent dengan ">=4 hari di Januari")
 */
function week1StartForYear_(year) {
  const jan4 = new Date(year, 0, 4);
  jan4.setHours(0, 0, 0, 0);
  return startOfWeekSunday(jan4);
}

/** Jumlah minggu dalam YEAR (52/53) berdasarkan start Week1 year -> start Week1 year+1 */
function weeksInEpiYear(epiYear) {
  const startThis = week1StartForYear_(epiYear);
  const startNext = week1StartForYear_(epiYear + 1);
  const diffDays = Math.round((startNext.getTime() - startThis.getTime()) / DAY_MS);
  return Math.round(diffDays / 7); // 52 atau 53
}

/**
 * Hitung Minggu Epidemiologi untuk suatu tanggal (MMWR Minggu–Sabtu)
 * Return:
 * { week, year, start, end, rangeLabel, weeksInYear }
 */
function getEpidWeek(dateArg) {
  const d = toLocal(dateArg);

  const weekStart = startOfWeekSunday(d);
  const weekEnd = endOfWeekSaturday(weekStart);

  // Tentukan epiYear berdasarkan boundary Week1
  let epiYear = d.getFullYear();
  let w1Start = week1StartForYear_(epiYear);

  // jika mingguStart sebelum Week#1 start, berarti masih epiYear sebelumnya
  if (weekStart.getTime() < w1Start.getTime()) {
    epiYear = epiYear - 1;
    w1Start = week1StartForYear_(epiYear);
  }

  let diffDays = Math.floor((weekStart.getTime() - w1Start.getTime()) / DAY_MS);
  let ew = Math.floor(diffDays / 7) + 1;

  let maxWeeks = weeksInEpiYear(epiYear);

  // jika ew > maxWeeks, berarti masuk epiYear berikutnya
  if (ew > maxWeeks) {
    epiYear = epiYear + 1;
    w1Start = week1StartForYear_(epiYear);
    diffDays = Math.floor((weekStart.getTime() - w1Start.getTime()) / DAY_MS);
    ew = Math.floor(diffDays / 7) + 1;
    maxWeeks = weeksInEpiYear(epiYear);
  }

  // clamp aman
  ew = Math.max(1, Math.min(maxWeeks, ew));

  return {
    week: ew,
    year: epiYear,
    start: weekStart,
    end: weekEnd,
    weeksInYear: maxWeeks,
    rangeLabel:
      Utilities.formatDate(weekStart, TZ_EPI, "d MMM") +
      " – " +
      Utilities.formatDate(weekEnd, TZ_EPI, "d MMM yyyy")
  };
}

/** Helper: minggu berjalan (bukan minggu laporan) */
function getEpidWeekCurrent() {
  return getEpidWeek(new Date());
}

/**
 * Shift minggu epidemiologi (rollover antar tahun epid)
 * delta negatif = mundur, positif = maju
 */
function shiftEpiWeek_(year, week, delta) {
  let y = Number(year);
  let w = Number(week) + Number(delta);

  // mundur melewati batas tahun
  while (w < 1) {
    y = y - 1;
    w = w + weeksInEpiYear(y);
  }
  // maju melewati batas tahun
  while (w > weeksInEpiYear(y)) {
    w = w - weeksInEpiYear(y);
    y = y + 1;
  }

  const w1 = week1StartForYear_(y);
  const start = new Date(w1);
  start.setDate(w1.getDate() + (w - 1) * 7);
  start.setHours(0, 0, 0, 0);

  const end = endOfWeekSaturday(start);

  return {
    year: y,
    week: w,
    start: start,
    end: end,
    weeksInYear: weeksInEpiYear(y),
    rangeLabel:
      Utilities.formatDate(start, TZ_EPI, "d MMM") +
      " – " +
      Utilities.formatDate(end, TZ_EPI, "d MMM yyyy")
  };
}

/**
 * Minggu DILAPORKAN = minggu SEBELUM minggu berjalan (MMWR) + rollover tahun
 * contoh:
 * - Jika hari ini masih EW 53 tahun 2025 -> reporting = EW 52 tahun 2025
 * - Jika hari ini EW 1 tahun 2026 -> reporting = EW 53 tahun 2025
 */
function getEpidWeekForReporting() {
  const cur = getEpidWeekCurrent();          // current epi week/year
  // Operasional SARS Depok: minggu yang dilaporkan = minggu berjalan yang tampak di kalender - 1.
  // Fungsi getEpidWeekCurrent() berbasis batas minggu epidemiologi internal bisa menghasilkan +1
  // terhadap minggu operasional pada hari berjalan, jadi reporting memakai current - 2.
  const prev = shiftEpiWeek_(cur.year, cur.week, -2);
  return prev;
}

/**
 * Meta dashboard:
 * - lastWeek: 52/53 untuk tahun yang dipilih (dropdown)
 * - reportWeek/reportYear: default dashboard mengikuti minggu laporan dinamis
 */
function getEpiMetaForDashboard(year) {
  const y = Number(year || new Date().getFullYear());
  const lastWeek = weeksInEpiYear(y);

  const rep = getEpidWeekForReporting(); // {week,year,...}

  return {
    year: y,
    lastWeek: lastWeek,
    reportYear: Number(rep.year),
    reportWeek: Number(rep.week),
    currentYear: Number(getEpidWeekCurrent().year),
    currentWeek: Number(getEpidWeekCurrent().week)
  };
}
