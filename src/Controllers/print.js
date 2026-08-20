function getBaseWebAppUrl_() {
  return ScriptApp.getService().getUrl();
}

function getRecordForPrint(dx, epid, token) {
  const auth = _getSessionFromToken_(token);
  if (!auth.ok) throw new Error(auth.message || "Sesi tidak valid.");

  const rec = getRecordByEpid(dx, epid, token);
  if (!rec) throw new Error("Data tidak ditemukan.");

  return rec;
}

function _printTokenCacheKey_(printToken) {
  return "PRINT_TOKEN_" + String(printToken || "").trim();
}

function _issueScopedPrintToken_(dx, epid, sessionToken, auth) {
  const printToken = Utilities.getUuid();
  const ttlSec = 300;
  const payload = {
    dx: String(dx || "").trim().toUpperCase(),
    epid: String(epid || "").trim(),
    sessionToken: String(sessionToken || "").trim(),
    user: (auth && auth.user) || {},
    issuedAt: Date.now(),
    expiresAt: Date.now() + (ttlSec * 1000)
  };
  CacheService.getScriptCache().put(_printTokenCacheKey_(printToken), JSON.stringify(payload), ttlSec);
  return printToken;
}

function _resolveScopedPrintToken_(printToken, dx, epid) {
  printToken = String(printToken || "").trim();
  if (!printToken) return { ok: false, message: "Token print kosong." };

  let payload = null;
  try {
    const raw = CacheService.getScriptCache().get(_printTokenCacheKey_(printToken));
    payload = raw ? JSON.parse(raw) : null;
  } catch (err) {
    payload = null;
  }
  if (!payload) return { ok: false, message: "Token print tidak valid atau sudah kedaluwarsa." };

  const requestedDx = String(dx || "").trim().toUpperCase();
  const requestedEpid = String(epid || "").trim();
  if (payload.dx !== requestedDx || payload.epid !== requestedEpid) {
    return { ok: false, message: "Token print tidak sesuai dengan data yang diminta." };
  }
  if (payload.expiresAt && Date.now() > Number(payload.expiresAt)) {
    return { ok: false, message: "Token print sudah kedaluwarsa." };
  }

  const auth = _getSessionFromToken_(payload.sessionToken);
  if (!auth.ok) return { ok: false, message: auth.message || "Sesi tidak valid." };

  return {
    ok: true,
    sessionToken: payload.sessionToken,
    user: auth.user || payload.user || {}
  };
}

/** One-time admin authorization check for Drive-backed PE PDF export. */
function authorizePdfDrive() {
  return { ok: true, driveName: DriveApp.getRootFolder().getName() };
}

function exportPdfDocument(dx, epid, token, recordKey) {
  const auth = _getSessionFromToken_(token);
  if (!auth.ok) throw new Error(auth.message || "Sesi tidak valid.");
  dx = String(dx || "").trim().toUpperCase();
  epid = String(epid || "").trim();
  recordKey = String(recordKey || "").trim();
  if (!dx || (!epid && !recordKey)) throw new Error("dx/epid wajib.");
  const data = recordKey ? getRecordByKey(dx, recordKey, token) : getRecordByEpid(dx, epid, token);
  if (!data) throw new Error("Data tidak ditemukan atau di luar wilayah kerja.");
  const contactsRaw = data["Kontak Erat"] || data["KontakEratJSON"] || data["KontakEratJson"] || data["kontakEratJSON"] || "";
  let contacts = [];
  try { contacts = contactsRaw ? JSON.parse(contactsRaw) : []; } catch (e) { contacts = []; }
  if (!Array.isArray(contacts)) contacts = Array.isArray(contacts.rows) ? contacts.rows : [];
  const template = createTemplateFromFile_(getPrintTemplateName_(dx));
  template.DATA = data;
  epid = String(data["Nomor EPID"] || epid).trim();
  template.META = { dx: dx, epid: epid, printedAt: new Date(), user: auth.user || {} };
  template.CONTACTS = contacts;
  const htmlOutput = template.evaluate().setTitle("Cetak PDF " + epid);
  let pdf;
  try {
    pdf = htmlOutput.getAs(MimeType.PDF);
  } catch (primaryErr) {
    // Some Apps Script runtimes reject HtmlOutput.getAs(PDF); convert rendered HTML blob instead.
    pdf = Utilities.newBlob(htmlOutput.getContent(), MimeType.HTML, "Dokumen_PE_" + epid + ".html").getAs(MimeType.PDF);
  }
  const recordIdentity = String(
    data["Nomor EPID"] || epid || data["ID Registrasi Kasus"] || recordKey || ""
  ).trim();
  const code = recordIdentity.replace(/[^A-Za-z0-9_-]+/g, "_");
  const name = "Dokumen_PE_" + code + ".pdf";
  // Cache must use physical record identity, not EPID. EPID can be empty or duplicated.
  const cacheIdentity = String(recordKey || data["ID Registrasi Kasus"] || recordIdentity).trim();
  const cacheCode = cacheIdentity.replace(/[^A-Za-z0-9_-]+/g, "_");
  const propertyKey = "PE_PDF_DRIVE_V2_" + dx + "_" + cacheCode;
  const props = PropertiesService.getScriptProperties();
  const existingId = String(props.getProperty(propertyKey) || "").trim();
  if (existingId) {
    try {
      const existingFile = DriveApp.getFileById(existingId);
      // Repair PDFs created before link-sharing was enabled.
      existingFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      return { name: existingFile.getName(), mimeType: "application/pdf", fileId: existingId, driveUrl: "https://drive.google.com/file/d/" + existingId + "/view" };
    } catch (lookupErr) {
      props.deleteProperty(propertyKey);
    }
  }
  let file;
  try {
    file = DriveApp.createFile(pdf.setName(name));
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  } catch (driveErr) {
    console.error('PE PDF Drive authorization/write error:', driveErr);
    throw new Error('PDF belum dapat dibuat karena akses Google Drive belum diotorisasi oleh admin aplikasi. Silakan hubungi admin.');
  }
  props.setProperty(propertyKey, file.getId());
  return { name: name, mimeType: "application/pdf", fileId: file.getId(), driveUrl: "https://drive.google.com/file/d/" + file.getId() + "/view" };
}

function handlePdfExportRequest_(e) {
  try {
    const dx = String((e.parameter.dx || "")).trim().toUpperCase();
    const epid = String((e.parameter.epid || "")).trim();
    const token = String((e.parameter.token || e.parameter.sessionToken || "")).trim();
    const result = exportPdfDocument(dx, epid, token);
    const safeName = _printFallbackEscape_(result.name);
    const safeBase64 = result.base64;
    return HtmlService.createHtmlOutput("<!doctype html><html><head><meta charset='utf-8'><title>Download Dokumen PE</title></head><body><p>Menyiapkan file PDF...</p><script>(function(){var b='" + safeBase64 + "',bin=atob(b),bytes=new Uint8Array(bin.length);for(var i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);var a=document.createElement('a');a.href=URL.createObjectURL(new Blob([bytes],{type:'application/pdf'}));a.download='" + safeName + "';document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);},1000);})();</script></body></html>").setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  } catch (err) {
    return HtmlService.createHtmlOutput("<h3>Gagal membuat file PDF. Silakan buka ulang dari aplikasi.</h3>");
  }
}

function getPdfPrintUrl(dx, epid, token) {
  const auth = _getSessionFromToken_(token);
  if (!auth.ok) throw new Error(auth.message || "Sesi tidak valid.");

  dx = String(dx || "").trim().toUpperCase();
  epid = String(epid || "").trim();

  if (!dx || !epid) throw new Error("dx/epid wajib.");

  const rec = getRecordByEpid(dx, epid, token);
  if (!rec) throw new Error("Data tidak ditemukan atau di luar wilayah kerja.");

  const base = getBaseWebAppUrl_();
  if (!base) throw new Error("URL Web App tidak tersedia.");

  const printToken = _issueScopedPrintToken_(dx, epid, token, auth);
  return base + "?action=print&dx=" + encodeURIComponent(dx) + "&epid=" + encodeURIComponent(epid) + "&printToken=" + encodeURIComponent(printToken);
}

function handlePrintRequest_(e) {
  try {
    const dx = String((e.parameter.dx || "")).trim().toUpperCase();
    const epid = String((e.parameter.epid || "")).trim();
    const recordKey = String((e.parameter.recordKey || e.parameter.recordId || "")).trim();
    const printToken = String((e.parameter.printToken || e.parameter.pt || "")).trim();
    const sessionToken = String((e.parameter.token || e.parameter.sessionToken || "")).trim();
    const lookupKey = recordKey || epid;

    if (!dx || !lookupKey) {
      return HtmlService.createHtmlOutput("<h3>Parameter print tidak lengkap. Silakan buka ulang dari aplikasi.</h3>");
    }

    let printAuth = _resolveScopedPrintToken_(printToken, dx, lookupKey);
    if (!printAuth.ok && epid && recordKey) {
      printAuth = _resolveScopedPrintToken_(printToken, dx, epid);
    }
    if (!printAuth.ok && sessionToken) {
      const auth = _getSessionFromToken_(sessionToken);
      if (auth.ok) {
        printAuth = { ok: true, sessionToken: sessionToken, user: auth.user || {} };
      }
    }
    if (!printAuth.ok) {
      return HtmlService.createHtmlOutput("<h3>Link print tidak valid atau sudah kedaluwarsa. Silakan buka ulang dari aplikasi.</h3>");
    }

    const data = getRecordByKey(dx, lookupKey, printAuth.sessionToken);
    if (!data) {
      return HtmlService.createHtmlOutput("<h3>Data tidak ditemukan.</h3>");
    }
    const printableCode = String(data["Nomor EPID"] || epid || data["ID Registrasi Kasus"] || recordKey || "-").trim();

    let contacts = [];
    let contactsRaw = data["Kontak Erat"] || data["KontakEratJSON"] || data["KontakEratJson"] || data["kontakEratJSON"] || "";
    if (!contactsRaw) {
      Object.keys(data || {}).some(function(key) {
        const norm = String(key || "").toLowerCase().replace(/[^a-z0-9]/g, "");
        if ((norm.indexOf("kontakerat") !== -1 || (norm.indexOf("kontak") !== -1 && norm.indexOf("erat") !== -1)) && data[key]) {
          contactsRaw = data[key];
          return true;
        }
        return false;
      });
    }
    try {
      contacts = contactsRaw ? JSON.parse(contactsRaw) : [];
      if (contacts && !Array.isArray(contacts) && Array.isArray(contacts.rows)) contacts = contacts.rows;
      if (!Array.isArray(contacts)) contacts = [];
    } catch (err) {
      contacts = [];
    }

    const templateName = getPrintTemplateName_(dx);
    const printMeta = {
      dx: dx,
      epid: printableCode,
      printedAt: new Date(),
      user: printAuth.user || {}
    };
    try {
      const t = createTemplateFromFile_(templateName);
      t.DATA = data;
      t.META = printMeta;
      t.CONTACTS = contacts;

      return t.evaluate()
        .setTitle("Cetak PDF " + printableCode)
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    } catch (renderErr) {
      try { console.error("Print template render error [" + templateName + "/" + dx + "/" + printableCode + "]:", renderErr); } catch (logRenderErr) {}
      return _renderFallbackPrintHtml_(dx, data, printMeta, contacts, renderErr);
    }
  } catch (err) {
    try { console.error("Public print endpoint error:", err); } catch (logErr) {}
    return HtmlService.createHtmlOutput("<h3>Gagal render print. Silakan buka ulang dari aplikasi atau hubungi admin.</h3>");
  }
}


function _printFallbackEscape_(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function _printFallbackPick_(data, keys) {
  data = data || {};
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    if (Object.prototype.hasOwnProperty.call(data, key) && data[key] !== "" && data[key] != null) {
      return data[key];
    }
  }
  return "";
}

function _renderFallbackPrintHtml_(dx, data, meta, contacts, renderErr) {
  data = data || {};
  meta = meta || {};
  const epid = _printFallbackPick_(data, ["Nomor EPID", "ID Registrasi Kasus"]) || meta.epid || "-";
  const rows = [
    ["Diagnosis", dx || "-"],
    ["Nomor EPID / ID", epid],
    ["Nama", _printFallbackPick_(data, ["Nama", "nama", "Nama Pasien"])],
    ["Tanggal Lahir", _printFallbackPick_(data, ["Tanggal Lahir", "Tgl Lahir"])],
    ["Jenis Kelamin", _printFallbackPick_(data, ["JK", "Jenis Kelamin", "Jenis kelamin"])],
    ["Orang Tua/Wali", _printFallbackPick_(data, ["Nama Orang Tua/Wali", "Nama orang tua/wali", "Nama Orangtua/Wali"])],
    ["Alamat", _printFallbackPick_(data, ["Alamat", "alamat"])],
    ["Kelurahan", _printFallbackPick_(data, ["Kelurahan", "kelurahan"])],
    ["Kecamatan", _printFallbackPick_(data, ["Kecamatan", "kecamatan"])],
    ["Status Kasus", _printFallbackPick_(data, ["Status Kasus", "Klasifikasi", "klasifikasi"])],
    ["Status Verifikasi", _printFallbackPick_(data, ["Status Verifikasi", "Status verifikasi"])],
    ["Demam", _printFallbackPick_(data, ["Demam?", "Demam", "demam"])],
    ["Ruam", _printFallbackPick_(data, ["Ruam Makulopapular?", "Ruam Makulopapular", "ruam"])],
    ["Tanggal Mulai Demam", _printFallbackPick_(data, ["Tanggal Mulai Demam", "Tanggal mulai demam"])],
    ["Tanggal Mulai Ruam", _printFallbackPick_(data, ["Tanggal Mulai Ruam", "Tanggal mulai ruam"])],
    ["Petugas", _printFallbackPick_(data, ["Petugas", "Pelaksana investigasi", "Pelaksana Investigasi"])]
  ];
  const rowHtml = rows.map(function(row) {
    return "<tr><th>" + _printFallbackEscape_(row[0]) + "</th><td>" + _printFallbackEscape_(row[1] || "-") + "</td></tr>";
  }).join("");
  const debug = renderErr && renderErr.message ? String(renderErr.message) : String(renderErr || "Template print utama gagal dirender.");
  return HtmlService.createHtmlOutput("<!doctype html><html><head><meta charset='utf-8'><base target='_top'><style>body{font-family:Arial,sans-serif;margin:24px;color:#111}h1{font-size:18px;text-align:center}.notice{background:#fff7ed;border:1px solid #fdba74;border-radius:8px;padding:10px;margin:12px 0;font-size:12px}table{width:100%;border-collapse:collapse;margin-top:12px}th,td{border:1px solid #333;padding:7px;text-align:left;vertical-align:top}th{width:34%;background:#f3f4f6}@media print{.no-print{display:none}}</style></head><body><h1>FORM PENYELIDIKAN EPIDEMIOLOGI " + _printFallbackEscape_(dx || "PD3I") + "</h1><div class='notice no-print'><b>Catatan:</b> template PDF utama gagal dirender, jadi aplikasi menampilkan versi ringkas sementara agar data tetap bisa dicetak. Admin dapat melihat log: " + _printFallbackEscape_(debug) + "</div><table>" + rowHtml + "</table><p class='no-print'><button onclick='window.print()'>Cetak / Save PDF</button></p></body></html>")
    .setTitle("Cetak PDF " + _printFallbackEscape_(epid))
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}


function getPrintTemplateName_(dx) {
  dx = String(dx || "").trim().toUpperCase();
  const templateByDx = {
    MR: "Views/print_MR",
    DIF: "Views/print_DIF",
    PERT: "Views/print_PERT",
    TN: "Views/print_TN",
    AFP: "Views/print_AFP"
  };
  return templateByDx[dx] || "Views/print_MR";
}

function safeGetPdfPrintUrl_(dx, epid, token) {
  try {
    return getPdfPrintUrl(dx, epid, token);
  } catch (e) {
    return "";
  }
}
