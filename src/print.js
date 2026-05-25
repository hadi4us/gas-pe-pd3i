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

function getPdfPrintUrl(dx, epid, token) {
  const auth = _getSessionFromToken_(token);
  if (!auth.ok) throw new Error(auth.message || "Sesi tidak valid.");

  dx = String(dx || "").trim().toUpperCase();
  epid = String(epid || "").trim();

  if (!dx || !epid) throw new Error("dx/epid wajib.");

  const base = getBaseWebAppUrl_();
  if (!base) throw new Error("URL Web App tidak tersedia.");

  return base + "?action=print&dx=" + encodeURIComponent(dx) + "&epid=" + encodeURIComponent(epid) + "&token=" + encodeURIComponent(token);
}

function handlePrintRequest_(e) {
  try {
    const dx = String((e.parameter.dx || "")).trim().toUpperCase();
    const epid = String((e.parameter.epid || "")).trim();
    const token = String((e.parameter.token || "")).trim();

    const auth = _getSessionFromToken_(token);
    if (!auth.ok) {
      return HtmlService.createHtmlOutput("<h3>Sesi tidak valid / habis. Silakan login ulang.</h3>");
    }

    const data = getRecordByEpid(dx, epid, token);
    if (!data) {
      return HtmlService.createHtmlOutput("<h3>Data tidak ditemukan.</h3>");
    }

    let contacts = [];
    try {
      contacts = data["Kontak Erat"] ? JSON.parse(data["Kontak Erat"]) : [];
    } catch (err) {
      contacts = [];
    }

    const templateName = getPrintTemplateName_(dx);
    const t = HtmlService.createTemplateFromFile(templateName);
    t.DATA = data;
    t.META = {
      dx: dx,
      epid: epid,
      printedAt: new Date(),
      user: auth.user || {}
    };
    t.CONTACTS = contacts;

    return t.evaluate()
      .setTitle("Cetak PDF " + epid)
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  } catch (err) {
    return HtmlService.createHtmlOutput("<pre>Gagal render print: " + err + "</pre>");
  }
}

function getPrintTemplateName_(dx) {
  dx = String(dx || "").trim().toUpperCase();
  if (dx === "MR") return "print_MR";
  return "print_MR";
}

function safeGetPdfPrintUrl_(dx, epid, token) {
  try {
    return getPdfPrintUrl(dx, epid, token);
  } catch (e) {
    return "";
  }
}
