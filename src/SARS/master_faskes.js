/******************************************************
 * master_faskes.gs — REF_FASKES helper (autocomplete)
 * FINAL (support RS/KLINIK/TPMD/PMB/LAIN + map pengampu + key)
 *
 * Output untuk client:
 * - rs:    [nama...]
 * - klinik:[nama...]
 * - tpmd:  [nama...]
 * - pmb:   [nama...]
 * - lain:  [nama...]
 * - all:   [nama...]
 * - meta:  { total, byType, updatedAt }
 *
 * Catatan:
 * - Jenis di REF_FASKES disarankan: RS/KLINIK/TPMD/PMB/LAIN (bebas case)
 * - Nama kolom fleksibel (lihat pickIndex_)
 * - Key stabil: pakai kolom FaskesKey bila ada, kalau tidak dibuat otomatis
 ******************************************************/

function getSarsFacilityForActiveUser(requestedEmail) {
  // Custom PD3I login may hide Google active-user email. Use session email
  // first; accept app-session email only as lookup hint, then validate against
  // REF_FASKES before returning facility identity.
  // Workspace login uses app-session email. Google active-user email may belong
  // to the account owning the deployment, not the logged-in PD3I user.
  const requested = String(requestedEmail || "").trim().toLowerCase();
  let googleEmail = "";
  try { googleEmail = String(Session.getActiveUser().getEmail() || "").trim().toLowerCase(); } catch (e) {}
  const emails = [];
  [requested, googleEmail].forEach(function(v) { if (v && emails.indexOf(v) === -1) emails.push(v); });
  const raw = getMasterFaskesRaw_(true);
  if (!emails.length) return { status: "error", message: "Email login tidak terbaca." };
  let email = "";
  let found = null;
  for (let i = 0; i < emails.length; i++) {
    found = raw.filter(function(r) { return String(r.email || "").trim().toLowerCase() === emails[i]; })[0] || null;
    if (found) { email = emails[i]; break; }
  }
  // App users may be mapped to REF_FASKES by KodeFaskes, while REF_FASKES
  // email column can contain notification/legacy addresses. Resolve REF_USER
  // first, then match its facility code without trusting client-supplied names.
  if (!found) {
    const user = _lookupSarsAppUser_(requested || googleEmail);
    if (user && user.kodeFaskes) {
      const code = String(user.kodeFaskes).trim().toLowerCase();
      found = raw.filter(function(r) {
        return String(r.key || '').trim().toLowerCase() === code;
      })[0] || null;
      if (found) email = requested || googleEmail;
    }
  }
  if (!found) return { status: "error", message: "Akun login belum terdaftar di REF_FASKES SARS: " + emails.join(", ") };
  if (!isSarsReportingFacility_(normalizeFaskesTypeKey_(found.jenis), found.statusAktif)) {
    return { status: "error", message: "Akun ini bukan faskes wajib lapor aktif SARS." };
  }
  return {
    status: "success",
    email: email,
    nama: String(found.nama || ""),
    jenis: normalizeFaskesTypeKey_(found.jenis),
    pengampu: String(found.pengampu || ""),
    key: String(found.key || ""),
    statusAktif: String(found.statusAktif || "")
  };
}

function _lookupSarsAppUser_(email) {
  try {
    const sh = SpreadsheetApp.getActive().getSheetByName('REF_USER');
    if (!sh) return null;
    const values = sh.getDataRange().getValues();
    if (values.length < 2) return null;
    const headers = values[0].map(function(h){ return String(h || '').trim().toLowerCase(); });
    const ix = function(names) { for (let i = 0; i < names.length; i++) { const n = names[i].toLowerCase(); const j = headers.indexOf(n); if (j >= 0) return j; } return -1; };
    const ie = ix(['email','gmail','emailpetugas']);
    const ik = ix(['kodefaskes','kode faskes','kode pkm']);
    if (ie < 0 || ik < 0) return null;
    const wanted = String(email || '').trim().toLowerCase();
    for (let r = 1; r < values.length; r++) {
      if (String(values[r][ie] || '').trim().toLowerCase() === wanted) return { kodeFaskes: String(values[r][ik] || '').trim() };
    }
  } catch (e) {}
  return null;
}

function getMasterFaskesForClient() {
  const raw = getMasterFaskesRaw_();

  const out = {
    rs: [],
    klinik: [],
    tpmd: [],
    pmb: [],
    lain: [],
    all: [],
    // opsional bila nanti diperlukan client/dashboard
    pengampuByKey: {}, // {FaskesKey: "Pengampu"}
    nameByKey: {},     // {FaskesKey: "Nama Faskes"}
    typeByKey: {},     // {FaskesKey: "RS|KLINIK|TPMD|PMB|LAIN"}
    meta: { total: 0, byType: {}, updatedAt: new Date().toISOString() }
  };

  raw.forEach(r => {
    const name = String(r.nama || "").trim();
    if (!name) return;

    const key = String(r.key || "").trim() || normalizeFaskesKey_(name);
    const typeKey = normalizeFaskesTypeKey_(r.jenis); // RS/KLINIK/TPMD/PMB/LAIN (default LAIN)
    const pengampu = String(r.pengampu || "").trim();

    out.all.push(name);

    if (typeKey === "RS") out.rs.push(name);
    else if (typeKey === "KLINIK") out.klinik.push(name);
    else if (typeKey === "TPMD") out.tpmd.push(name);
    else if (typeKey === "PMB") out.pmb.push(name);
    else out.lain.push(name);

    // maps (opsional)
    out.pengampuByKey[key] = pengampu;
    out.nameByKey[key] = name;
    out.typeByKey[key] = typeKey;

    out.meta.byType[typeKey] = (out.meta.byType[typeKey] || 0) + 1;
    out.meta.total++;
  });

  // unique + sort (stable, case-insensitive)
  out.rs = uniqSort_(out.rs);
  out.klinik = uniqSort_(out.klinik);
  out.tpmd = uniqSort_(out.tpmd);
  out.pmb = uniqSort_(out.pmb);
  out.lain = uniqSort_(out.lain);
  out.all = uniqSort_(out.all);

  return out;
}

/**
 * Raw master: ambil dari REF_FASKES menggunakan header name-based
 * Minimal kolom yang dikenali:
 * - NamaFaskes / Nama Faskes
 * - Jenis
 * - Pengampu
 * - FaskesKey (opsional tapi disarankan)
 */
function getMasterFaskesRaw_(includeInactive) {
  // Pastikan config tersedia
  if (typeof openSarsSpreadsheet !== "function") {
    throw new Error("config.gs belum termuat (openSarsSpreadsheet tidak ada).");
  }

  const ss = openSarsSpreadsheet();
  const sh = ss.getSheetByName((SARS_CONFIG && SARS_CONFIG.SHEET_MASTER) ? SARS_CONFIG.SHEET_MASTER : "REF_FASKES");
  if (!sh) throw new Error('Sheet REF_FASKES tidak ditemukan.');

  const lastRow = sh.getLastRow();
  const lastCol = sh.getLastColumn();
  if (lastRow < 2 || lastCol < 1) return [];

  const values = sh.getRange(1, 1, lastRow, lastCol).getValues();
  const header = values[0].map(h => String(h || "").trim());

  // fleksibel: terima beberapa kemungkinan nama header
  const iNama = pickIndex_(header, ["Nama Faskes", "NamaFaskes", "Nama Fasyankes", "NamaFasyankes", "Nama"]);
  const iJenis = pickIndex_(header, ["Jenis", "Jenis Faskes", "JenisFaskes", "Tipe", "Type"]);
  const iPengampu = pickIndex_(header, ["Pengampu", "FaskesPengampu", "Puskesmas Pengampu", "UPTD Pengampu"]);
  const iKey = pickIndex_(header, ["KodeFaskes", "FasyankesKey", "KodeFaskes", "Kode Faskes", "Key", "Kode", "Kode Faskes", "KodeFaskes"]);
  const iStatus = pickIndex_(header, ["StatusAktif", "Status Aktif", "Aktif", "Status"]);
  const iEmail = pickIndex_(header, ["Email", "Gmail", "EmailPetugas", "Email Petugas"]);

  if (iNama < 0) throw new Error('REF_FASKES: kolom "NamaFaskes" tidak ditemukan.');

  const out = [];
  for (let r = 1; r < values.length; r++) {
    const row = values[r];

    const nama = String(row[iNama] || "").trim();
    if (!nama) continue;

    const jenis = (iJenis >= 0) ? String(row[iJenis] || "").trim() : "";
    const typeKey = normalizeFaskesTypeKey_(jenis);
    const statusAktif = (iStatus >= 0) ? String(row[iStatus] || "").trim() : "AKTIF";
    if (!includeInactive && !isSarsReportingFacility_(typeKey, statusAktif)) continue;

    const pengampu = (iPengampu >= 0) ? String(row[iPengampu] || "").trim() : "";
    const key = (iKey >= 0) ? String(row[iKey] || "").trim() : normalizeFaskesKey_(nama);

    const email = (iEmail >= 0) ? String(row[iEmail] || "").trim() : "";
    out.push({ nama, jenis, pengampu, key, statusAktif, email });
  }

  return out;
}

function pickIndex_(headerArr, candidates) {
  const norm = (s) => String(s || "").trim().toLowerCase();
  const hNorm = headerArr.map(norm);

  for (const c of candidates) {
    const idx = hNorm.indexOf(norm(c));
    if (idx >= 0) return idx;
  }
  return -1;
}

/**
 * Normalisasi jenis fasyankes ke key uppercase:
 * RS/KLINIK/TPMD/PMB/LAIN
 */
function isSarsReportingFacility_(typeKey, statusAktif) {
  const type = String(typeKey || "").trim().toUpperCase();
  if (type === "PKM" || type === "PUSKESMAS") return false;

  const status = String(statusAktif || "").trim().toUpperCase();
  if (!status) return true;
  return ["AKTIF", "ACTIVE", "YA", "Y", "TRUE", "1", "WAJIB", "WAJIB LAPOR"].indexOf(status) !== -1;
}

function normalizeFaskesTypeKey_(v) {
  const s = String(v || "").trim();
  if (!s) return "LAIN";

  const k = s.toLowerCase();

  if (k === "pkm" || k === "puskesmas" || k.includes("puskesmas")) return "PKM";
  if (k === "rs" || k === "rumahsakit" || k === "rumah sakit" || k === "rumah_sakit") return "RS";
  if (k === "klinik" || k === "clinic") return "KLINIK";
  if (k === "tpmd" || k.includes("praktik mandiri dokter") || k.includes("praktek mandiri dokter")) return "TPMD";
  if (k === "pmb" || k.includes("praktik mandiri bidan") || k.includes("praktek mandiri bidan")) return "PMB";
  if (k === "lain" || k === "lainnya" || k === "other") return "LAIN";

  // kalau user isi "TPMD", "PMB" dll (mixed case)
  const up = s.toUpperCase();
  if (up === "PKM" || up === "PUSKESMAS") return "PKM";
  if (up === "RS" || up === "KLINIK" || up === "TPMD" || up === "PMB" || up === "LAIN") return up;

  return "LAIN";
}

/** Unique + sort (case-insensitive) */
function uniqSort_(arr) {
  const seen = Object.create(null);
  const out = [];
  for (const v of (arr || [])) {
    const s = String(v || "").trim();
    if (!s) continue;
    const key = s.toUpperCase();
    if (seen[key]) continue;
    seen[key] = true;
    out.push(s);
  }
  out.sort((a, b) => a.localeCompare(b, "id-ID", { sensitivity: "base" }));
  return out;
}

/** Key stabil untuk matching dashboard bila master belum punya FaskesKey */
function normalizeFaskesKey_(name) {
  return String(name || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}
