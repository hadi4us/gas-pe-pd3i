function doGet(e) {
  const action = String((e && e.parameter && e.parameter.action) || "").trim().toLowerCase();

  if (action === "print") {
    return handlePrintRequest_(e);
  }

  return HtmlService.createTemplateFromFile("index")
    .evaluate()
    .setTitle("Form PE Surveilans PD3I")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag("viewport", "width=device-width, initial-scale=1");
}

function doPost(e) {
  const lock = LockService.getScriptLock();

  try {
    lock.waitLock(30000);

    if (!e || !e.postData || !e.postData.contents) {
      return responseJSON({ status: "error", message: "Payload kosong." });
    }

    let data = {};
    try {
      data = JSON.parse(e.postData.contents || "{}");
    } catch (err) {
      return responseJSON({ status: "error", message: "Payload JSON tidak valid." });
    }

    const result = saveFormPayload_(data);
    return responseJSON(result);
  } catch (err) {
    return responseJSON({ status: "error", message: String(err) });
  } finally {
    try { lock.releaseLock(); } catch (e2) {}
  }
}

function saveFormData(data) {
  const lock = LockService.getScriptLock();

  try {
    lock.waitLock(30000);
    return saveFormPayload_(data || {});
  } catch (err) {
    return { status: "error", message: String(err) };
  } finally {
    try { lock.releaseLock(); } catch (e2) {}
  }
}

function _getRowObjectByEpid_(dx, epid) {
  const sheet = getSheetOrThrow_(String(dx || "").trim().toUpperCase() + "_Raw");
  const data = sheet.getDataRange().getValues();
  if (!data || data.length < 2) throw new Error("Sheet raw kosong.");
  const headers = data[0].map(h => String(h || "").trim());
  const idxEpid = headers.indexOf("Nomor EPID");
  if (idxEpid === -1) throw new Error("Kolom Nomor EPID tidak ditemukan.");

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][idxEpid] || "").trim() === String(epid || "").trim()) {
      const obj = {};
      headers.forEach((h, j) => { obj[h] = data[i][j]; });
      return obj;
    }
  }
  throw new Error("EPID tidak ditemukan: " + epid);
}

function _requireAdminFromToken_(token) {
  const sess = _getSessionFromToken_(token);
  if (!sess.ok || !sess.user) throw new Error(sess.message || "Sesi tidak valid.");
  const role = String(sess.user.role || "").trim().toLowerCase();
  if (role !== "admin") throw new Error("Aksi ini hanya untuk admin.");
  return sess.user;
}

// ─── Daftar semua DX yang didukung ───────────────────────────────────────────
const ALL_DX = ["MR", "DIF", "PERT", "TN", "AFP"];

// ─── Pipeline policy per DX (Phase-1: config-driven orchestration) ───────────
const DX_PIPELINE_POLICY = {
  MR:   { notifyEmail: true, syncPengampu: true, notifyTelegram: true },
  DIF:  { notifyEmail: true, syncPengampu: true, notifyTelegram: true },
  PERT: { notifyEmail: true, syncPengampu: true, notifyTelegram: true },
  TN:   { notifyEmail: true, syncPengampu: true, notifyTelegram: true },
  AFP:  { notifyEmail: true, syncPengampu: true, notifyTelegram: true }
};

function _getDxPipelinePolicy_(dx) {
  dx = String(dx || "").trim().toUpperCase();
  const fallback = { notifyEmail: true, syncPengampu: true, notifyTelegram: true };
  return DX_PIPELINE_POLICY[dx] || fallback;
}

// ─── Batch_Processor ─────────────────────────────────────────────────────────
/**
 * Batch_Processor — mengelola eksekusi retry notifikasi dan sinkronisasi secara batch.
 *
 * Desain:
 *   - Satu lock tunggal untuk seluruh batch (bukan per item)
 *   - Baca sheet sekali per DX di awal (bukan per-iterasi)
 *   - Cek elapsed > 25 detik → kembalikan status "PARTIAL"
 *   - Kembalikan ringkasan { status, byDx, durationMs }
 *
 * Req 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7
 */
const Batch_Processor = (function () {

  /**
   * Kolom status dan nilai "sudah selesai" per batchType.
   */
  const BATCH_CONFIG = {
    sync:     { statusCol: "Status Sinkronisasi Pengampu", doneValue: "SYNCED" },
    telegram: { statusCol: "Status Notifikasi Telegram",   doneValue: "SENT"   },
    notify:   { statusCol: "Status Notifikasi Pengampu",   doneValue: "SENT"   }
  };

  /**
   * Proses satu item sesuai batchType (tanpa acquire lock sendiri).
   * @param {string} batchType - "sync" | "telegram" | "notify"
   * @param {string} dx
   * @param {string} epid
   * @param {Object} record - baris data sebagai objek header→nilai
   * @returns {{ ok: boolean }}
   */
  function _processItem_(batchType, dx, epid, record) {
    try {
      const printUrl = String(record["Link PDF"] || "").trim();
      if (batchType === "sync") {
        const res = _syncPengampuSpreadsheet_(dx, record, { epid: epid }, printUrl);
        const patch = {
          "Nomor EPID": epid,
          "Status Sinkronisasi Pengampu": res.synced ? "SYNCED" : (res.reason || "FAILED"),
          "Synced At Pengampu": new Date(),
          "Sync Target Pengampu": res.target || ""
        };
        saveDxRecord_(dx, patch);
        return { ok: !!res.synced };
      }
      if (batchType === "telegram") {
        const pUrl = printUrl || safeGetPdfPrintUrl_(dx, epid, "");
        const res = _sendTelegramPd3iNotification_(dx, record, { epid: epid }, pUrl);
        const currentRetry = Number(record["Telegram Retry Count"] || 0) || 0;
        const patch = {
          "Nomor EPID": epid,
          "Status Notifikasi Telegram": res.sent ? "SENT" : (res.reason || "FAILED"),
          "Telegram Notified At": new Date(),
          "Telegram Target": res.target || "",
          "Telegram Retry Count": currentRetry + 1
        };
        saveDxRecord_(dx, patch);
        return { ok: !!res.sent };
      }
      if (batchType === "notify") {
        const res = _sendPengampuNotification_(dx, record, { epid: epid }, printUrl);
        const patch = {
          "Nomor EPID": epid,
          "Status Notifikasi Pengampu": res.sent ? "SENT" : (res.reason || "FAILED"),
          "Notified At Pengampu": new Date(),
          "Notified To Pengampu": res.to || ""
        };
        saveDxRecord_(dx, patch);
        return { ok: !!res.sent };
      }
      return { ok: false };
    } catch (e) {
      console.error("Batch_Processor._processItem_ error [" + batchType + "/" + dx + "/" + epid + "]:", e);
      return { ok: false };
    }
  }

  /**
   * Jalankan batch retry untuk daftar DX dan batchType tertentu.
   * Mengakuisisi SATU lock untuk seluruh batch.
   *
   * @param {string[]} dxList - daftar DX yang akan diproses
   * @param {string} batchType - "sync" | "telegram" | "notify"
   * @param {string} token - token sesi admin
   * @returns {{ status: string, byDx: Object, durationMs: number }}
   */
  function runBatch(dxList, batchType, token) {
    const startMs = Date.now();
    const cfg = BATCH_CONFIG[batchType];
    if (!cfg) return { status: "error", message: "batchType tidak dikenal: " + batchType, byDx: {}, durationMs: 0 };

    const lock = LockService.getScriptLock();
    try {
      lock.waitLock(30000);
    } catch (lockErr) {
      return { status: "error", message: "Gagal mendapatkan lock: " + String(lockErr), byDx: {}, durationMs: Date.now() - startMs };
    }

    const byDx = {};
    let overallStatus = "success";

    try {
      _requireAdminFromToken_(token);

      for (let di = 0; di < dxList.length; di++) {
        const dx = String(dxList[di] || "").trim().toUpperCase();
        if (!dx) continue;

        // Cek elapsed sebelum mulai DX baru
        if (Date.now() - startMs > 25000) {
          overallStatus = "PARTIAL";
          break;
        }

        // Baca sheet sekali di awal per DX (Req 3.1)
        let values;
        try {
          const sheet = getSheetOrNull_(dx + "_Raw");
          if (!sheet) continue;
          values = sheet.getDataRange().getValues();
        } catch (sheetErr) {
          byDx[dx] = { total: 0, retried: 0, success: 0, failed: 0, error: String(sheetErr) };
          continue;
        }

        if (!values || values.length < 2) {
          byDx[dx] = { total: 0, retried: 0, success: 0, failed: 0 };
          continue;
        }

        const headers = values[0].map(function (h) { return String(h || "").trim(); });
        const idxEpid   = headers.indexOf("Nomor EPID");
        const idxStatus = headers.indexOf(cfg.statusCol);

        // Kolom status tidak ada → skip DX ini
        if (idxEpid === -1 || idxStatus === -1) continue;

        const total   = values.length - 1;
        let retried   = 0;
        let success   = 0;
        let failed    = 0;
        let partial   = false;

        for (let i = 1; i < values.length; i++) {
          // Cek elapsed setiap iterasi (Req 3.7)
          if (Date.now() - startMs > 25000) {
            overallStatus = "PARTIAL";
            partial = true;
            break;
          }

          const epid = String(values[i][idxEpid] || "").trim();
          const statusVal = String(values[i][idxStatus] || "").trim().toUpperCase();
          if (!epid || statusVal === cfg.doneValue) continue;

          // Bangun objek record dari baris
          const record = {};
          headers.forEach(function (h, j) { record[h] = values[i][j]; });

          retried += 1;
          const res = _processItem_(batchType, dx, epid, record);
          if (res.ok) success += 1; else failed += 1;
        }

        byDx[dx] = { total: total, retried: retried, success: success, failed: failed };
        if (partial) break;
      }
    } catch (err) {
      return {
        status: "error",
        message: String(err),
        byDx: byDx,
        durationMs: Date.now() - startMs
      };
    } finally {
      try { lock.releaseLock(); } catch (e2) {}
    }

    return {
      status: overallStatus,
      byDx: byDx,
      durationMs: Date.now() - startMs
    };
  }

  return { runBatch: runBatch };
})();

// ─── Fungsi resolveLatestSavedMeta ───────────────────────────────────────────
function resolveLatestSavedMeta(payload) {
  const token = String((payload && payload.__token) || "").trim();
  const sess = _getSessionFromToken_(token);
  if (!sess.ok) return { status: "error", message: sess.message || "Sesi habis." };

  const dx = String((payload && payload.dx) || "").trim().toUpperCase();
  if (!dx) return { status: "error", message: "dx wajib diisi." };

  const sheet = getSheetOrThrow_(dx + "_Raw");
  const values = sheet.getDataRange().getValues();
  if (!values || values.length < 2) return { status: "error", message: "Data belum ada." };

  const headers = values[0].map(h => String(h || "").trim());
  const idxEpid = headers.indexOf("Nomor EPID");
  const idxNama = headers.indexOf("Nama");
  const idxPelacakan = headers.indexOf("Tanggal Pelacakan");
  const idxPdf = headers.indexOf("Link PDF");
  if (idxEpid === -1 || idxNama === -1) return { status: "error", message: "Kolom meta belum lengkap." };

  const targetNama = String((payload && payload["Nama"]) || "").trim();
  const targetPelacakan = String((payload && payload["Tanggal Pelacakan"]) || "").trim();
  const norm = (v) => String(v || "").trim().slice(0, 10);

  for (let i = values.length - 1; i >= 1; i--) {
    const rowNama = String(values[i][idxNama] || "").trim();
    const rowPelacakan = idxPelacakan !== -1 ? String(values[i][idxPelacakan] || "").trim() : "";
    if (targetNama && rowNama !== targetNama) continue;
    if (targetPelacakan && rowPelacakan && norm(rowPelacakan) && norm(targetPelacakan) && norm(rowPelacakan) !== norm(targetPelacakan)) {
      continue;
    }
    let epid = String(values[i][idxEpid] || "").trim();
    if (!epid) {
      epid = generateEpid_(dx);
      if (idxEpid !== -1) sheet.getRange(i + 1, idxEpid + 1).setValue(epid);
    }
    let printUrl = idxPdf !== -1 ? String(values[i][idxPdf] || "").trim() : "";
    if (!printUrl && epid) {
      printUrl = safeGetPdfPrintUrl_(dx, epid, token);
      if (idxPdf !== -1) sheet.getRange(i + 1, idxPdf + 1).setValue(printUrl || "");
    }
    return { status: "success", epid: epid, dx: dx, printUrl: printUrl };
  }

  return { status: "error", message: "Meta simpan terakhir tidak ditemukan." };
}

// ─── Single-item retry (tidak acquire lock sendiri; lock dikelola Batch_Processor) ──
/**
 * Retry sinkronisasi pengampu untuk satu EPID.
 * Lock dikelola oleh pemanggil (Batch_Processor atau langsung dari admin).
 * Req 15.4
 */
function retryPengampuSync(epid, dx, token) {
  try {
    _requireAdminFromToken_(token);
    dx = String(dx || "MR").trim().toUpperCase();
    const record = _getRowObjectByEpid_(dx, epid);
    const printUrl = String(record["Link PDF"] || "").trim();
    const syncPengampu = _syncPengampuSpreadsheet_(dx, record, { epid: epid }, printUrl);
    const patch = {
      "Nomor EPID": epid,
      "Status Sinkronisasi Pengampu": syncPengampu.synced ? "SYNCED" : (syncPengampu.reason || "FAILED"),
      "Synced At Pengampu": new Date(),
      "Sync Target Pengampu": syncPengampu.target || ""
    };
    saveDxRecord_(dx, patch);
    return { status: syncPengampu.synced ? "success" : "error", epid: epid, pengampuSync: syncPengampu };
  } catch (err) {
    return { status: "error", message: String(err), epid: epid };
  }
}

/**
 * Retry notifikasi Telegram untuk satu EPID.
 * Lock dikelola oleh pemanggil.
 * Req 15.3
 */
function retryTelegramPd3iNotification(epid, dx, token) {
  try {
    _requireAdminFromToken_(token);
    dx = String(dx || "MR").trim().toUpperCase();
    const record = _getRowObjectByEpid_(dx, epid);
    const printUrl = String(record["Link PDF"] || "").trim() || safeGetPdfPrintUrl_(dx, epid, token);
    const telegramNotify = _sendTelegramPd3iNotification_(dx, record, { epid: epid }, printUrl);
    const currentRetry = Number(record["Telegram Retry Count"] || 0) || 0;
    const patch = {
      "Nomor EPID": epid,
      "Status Notifikasi Telegram": telegramNotify.sent ? "SENT" : (telegramNotify.reason || "FAILED"),
      "Telegram Notified At": new Date(),
      "Telegram Target": telegramNotify.target || "",
      "Telegram Retry Count": currentRetry + 1
    };
    saveDxRecord_(dx, patch);
    return { status: telegramNotify.sent ? "success" : "error", epid: epid, telegramNotification: telegramNotify };
  } catch (err) {
    return { status: "error", message: String(err), epid: epid };
  }
}

/**
 * Retry notifikasi email pengampu untuk satu EPID.
 * Lock dikelola oleh pemanggil.
 * Req 15.1
 */
function retryPengampuNotification(epid, dx, token) {
  try {
    _requireAdminFromToken_(token);
    dx = String(dx || "MR").trim().toUpperCase();
    const record = _getRowObjectByEpid_(dx, epid);
    const printUrl = String(record["Link PDF"] || "").trim();
    const notify = _sendPengampuNotification_(dx, record, { epid: epid }, printUrl);
    const patch = {
      "Nomor EPID": epid,
      "Status Notifikasi Pengampu": notify.sent ? "SENT" : (notify.reason || "FAILED"),
      "Notified At Pengampu": new Date(),
      "Notified To Pengampu": notify.to || ""
    };
    saveDxRecord_(dx, patch);
    return { status: notify.sent ? "success" : "error", epid: epid, pengampuNotification: notify };
  } catch (err) {
    return { status: "error", message: String(err), epid: epid };
  }
}

// ─── Batch retry (menggunakan Batch_Processor) ───────────────────────────────
/**
 * Retry semua pending sinkronisasi pengampu untuk semua DX (atau dxList tertentu).
 * Req 3.1–3.7, 15.4, 15.6
 *
 * @param {string} token
 * @param {string[]} [dxList] - opsional; default semua DX
 * @returns {{ status, byDx, durationMs }}
 */
function retryAllPendingPengampuSync(token, dxList) {
  return Batch_Processor.runBatch(dxList || ALL_DX, "sync", token);
}

/**
 * Retry semua notifikasi Telegram yang gagal untuk semua DX (atau dxList tertentu).
 * Req 3.1–3.7, 15.3, 15.6
 *
 * @param {string} token
 * @param {string[]} [dxList] - opsional; default semua DX
 * @returns {{ status, byDx, durationMs }}
 */
function retryAllFailedTelegramPd3iNotification(token, dxList) {
  return Batch_Processor.runBatch(dxList || ALL_DX, "telegram", token);
}

/**
 * Retry semua notifikasi email pengampu yang pending untuk semua DX (atau dxList tertentu).
 * Req 3.1–3.7, 15.5, 15.6
 *
 * @param {string} token
 * @param {string[]} [dxList] - opsional; default semua DX
 * @returns {{ status, byDx, durationMs }}
 */
function retryAllPendingPengampuNotification(token, dxList) {
  return Batch_Processor.runBatch(dxList || ALL_DX, "notify", token);
}

// ─── setupConfig ─────────────────────────────────────────────────────────────
// Fungsi setupConfig(token, configMap) sudah tersedia via config.js.
// Dapat dipanggil langsung dari frontend admin via google.script.run.setupConfig(...)
// Req 5.6, 5.7 — tidak perlu didefinisikan ulang di sini.

// ─── Helper upsert ke sheet pengampu ─────────────────────────────────────────
function _upsertByEpidToSheet_(sheet, record) {
  const headers = getTrimmedHeaders_(sheet);
  const idxEpid = headers.indexOf("Nomor EPID");
  if (idxEpid === -1) throw new Error("Sheet tujuan tidak punya kolom 'Nomor EPID'");

  const targetEpid = String(record["Nomor EPID"] || "").trim();
  if (!targetEpid) throw new Error("Nomor EPID kosong");

  const rowData = headers.map(h => record[h] !== undefined ? record[h] : "");
  const rowIndex = findRowByColumnValue_(sheet, idxEpid + 1, targetEpid);

  if (rowIndex !== -1) {
    sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
    return { updated: true, rowIndex, headersCount: headers.length };
  }

  sheet.appendRow(rowData);
  return { updated: false, rowIndex: sheet.getLastRow(), headersCount: headers.length };
}

// ─── Sinkronisasi ke spreadsheet pengampu ────────────────────────────────────
function _syncPengampuSpreadsheet_(dx, data, saved, printUrl) {
  try {
    dx = String(dx || "").trim().toUpperCase();

    const statusRouting = String(data["Status Routing Pengampu"] || "").trim().toUpperCase();
    if (statusRouting !== "MATCHED") return { synced: false, reason: statusRouting || "UNMAPPED" };

    const spreadsheetId = String(data["SpreadsheetId Pengampu"] || "").trim();
    if (!spreadsheetId) return { synced: false, reason: "NO_SPREADSHEET_ID" };

    const targetSs = SpreadsheetApp.openById(spreadsheetId);
    const targetSheetName = dx + "_Raw";
    let targetSheet = targetSs.getSheetByName(targetSheetName);
    if (!targetSheet) targetSheet = targetSs.insertSheet(targetSheetName);

    const sourceSheet = getSheetOrThrow_(dx + "_Raw");
    const sourceHeaders = getTrimmedHeaders_(sourceSheet);
    if (targetSheet.getLastRow() < 1 || targetSheet.getLastColumn() < 1) {
      targetSheet.getRange(1, 1, 1, sourceHeaders.length).setValues([sourceHeaders]);
    }

    const record = Object.assign({}, data, {
      "Nomor EPID": saved.epid,
      "dx": dx,
      "Link PDF": printUrl || data["Link PDF"] || ""
    });

    const currentTargetHeaders = getTrimmedHeaders_(targetSheet);
    const missingHeaders = sourceHeaders.filter(h => h && !currentTargetHeaders.includes(h));
    if (missingHeaders.length) {
      targetSheet.getRange(1, currentTargetHeaders.length + 1, 1, missingHeaders.length).setValues([missingHeaders]);
    }

    const res = _upsertByEpidToSheet_(targetSheet, record);
    return { synced: true, target: spreadsheetId, rowIndex: res.rowIndex, updated: !!res.updated, headersCount: res.headersCount };
  } catch (err) {
    return { synced: false, reason: String(err) };
  }
}

// ─── Notifikasi Telegram (menggunakan Config_Manager, bukan konstanta hardcoded) ──
/**
 * Kirim notifikasi Telegram untuk kasus PD3I.
 * Token dan Chat ID dibaca dari Config_Manager (Req 5.1, 5.2).
 */
function _sendTelegramPd3iNotification_(dx, data, saved, printUrl) {
  try {
    dx = String(dx || "").trim().toUpperCase();

    const botToken = Config_Manager.getConfig("TELEGRAM_BOT_TOKEN");
    const chatId   = Config_Manager.getConfig("TELEGRAM_CHAT_ID");
    if (!botToken || !chatId) return { sent: false, reason: "NOT_CONFIGURED" };

    const lines = [
      "📢 *Kasus " + dx + " baru tersimpan*",
      "",
      `*EPID:* ${saved.epid || "-"}`,
      `*Nama:* ${data["Nama"] || "-"}`,
      `*JK:* ${data["JK"] || "-"}`,
      `*Kelurahan:* ${data["Kelurahan"] || "-"}`,
      `*Kecamatan:* ${data["Kecamatan"] || "-"}`,
      `*Puskesmas Pengampu:* ${data["Puskesmas Pengampu"] || "-"}`,
      `*Routing:* ${data["Status Routing Pengampu"] || "-"}`,
      `*Email Pengampu:* ${data["Status Notifikasi Pengampu"] || "-"}`,
      `*Sync Pengampu:* ${data["Status Sinkronisasi Pengampu"] || "-"}`
    ];
    if (printUrl) lines.push(`*PDF:* ${printUrl}`);

    const resp = UrlFetchApp.fetch("https://api.telegram.org/bot" + botToken + "/sendMessage", {
      method: "post",
      muteHttpExceptions: true,
      payload: {
        chat_id: chatId,
        text: lines.join("\n"),
        parse_mode: "Markdown"
      }
    });
    const code = resp.getResponseCode();
    const body = String(resp.getContentText() || "");
    if (code >= 200 && code < 300) return { sent: true, target: chatId, responseCode: code };
    return { sent: false, reason: "HTTP_" + code + ": " + body, target: chatId };
  } catch (err) {
    return { sent: false, reason: String(err) };
  }
}

// ─── Notifikasi email pengampu ────────────────────────────────────────────────
function _sendPengampuNotification_(dx, data, saved, printUrl) {
  try {
    dx = String(dx || "").trim().toUpperCase();

    const statusRouting = String(data["Status Routing Pengampu"] || "").trim().toUpperCase();
    if (statusRouting !== "MATCHED") return { sent: false, reason: statusRouting || "UNMAPPED" };

    const recipients = [];
    [data["Email Petugas Pengampu"], data["Email Kapus Pengampu"]].forEach(v => {
      String(v || "").split(";").map(x => x.trim()).filter(Boolean).forEach(x => recipients.push(x));
    });
    const uniqueRecipients = Array.from(new Set(recipients));
    if (!uniqueRecipients.length) return { sent: false, reason: "NO_RECIPIENT" };

    const subject = `[${dx}][${saved.epid}] Kasus baru wilayah ampuan ${data["Kelurahan"] || ""}`;
    const body = [
      "Notifikasi kasus " + dx + " wilayah ampuan",
      "",
      `EPID: ${saved.epid}`,
      `Nama: ${data["Nama"] || "-"}`,
      `JK: ${data["JK"] || "-"}`,
      `Tanggal Lahir: ${data["Tanggal Lahir"] || "-"}`,
      `Alamat: ${data["Alamat"] || "-"}`,
      `Kelurahan: ${data["Kelurahan"] || "-"}`,
      `Kecamatan: ${data["Kecamatan"] || "-"}`,
      `Faskes pelapor: ${data["Nama unit pelapor"] || "-"}`,
      `Tanggal mulai ruam: ${data["Tanggal mulai ruam"] || "-"}`,
      `Tanggal pelacakan: ${data["Tanggal Pelacakan"] || "-"}`,
      `Puskesmas pengampu: ${data["Puskesmas Pengampu"] || "-"}`,
      printUrl ? `Link PDF: ${printUrl}` : ""
    ].filter(Boolean).join("\n");

    MailApp.sendEmail({
      to: uniqueRecipients.join(","),
      subject: subject,
      body: body,
      name: "Jarvis Surveilans PD3I"
    });

    return { sent: true, to: uniqueRecipients.join(",") };
  } catch (err) {
    return { sent: false, reason: String(err) };
  }
}

// ─── Validasi akses tulis ─────────────────────────────────────────────────────
const WORKFLOW_STAGE_IDS_ = ["section-pelapor", "section-verifikasi", "section-sampel", "section-status"];

function _normalizeWorkflowStage_(workflowStage) {
  const value = String(workflowStage || "").trim();
  if (["section-pelapor", "section-pasien", "section-specific"].includes(value)) return "section-pelapor";
  if (WORKFLOW_STAGE_IDS_.indexOf(value) !== -1) return value;
  return "";
}

function _getWritableWorkflowStagesForRole_(role) {
  role = String(role || "").trim().toLowerCase();
  if (role === "admin") return WORKFLOW_STAGE_IDS_.slice();
  if (["petugas", "surveilans", "editor", "koordinator"].includes(role)) return ["section-pelapor", "section-sampel", "section-status"];
  if (["viewer", "readonly", "read_only", "read-only"].includes(role)) return [];
  if (["inputer", "entry", "registrasi", "operator_input", "operator-input"].includes(role)) return ["section-pelapor"];
  if (["verifikator", "verifier", "epid", "validator_epid", "validator-epid"].includes(role)) return [];
  if (["lab", "laboratorium", "analislab", "analis_lab", "analis-lab"].includes(role)) return ["section-sampel"];
  if (["status", "updater_status", "updater-status", "followup", "follow_up", "follow-up", "tindaklanjut", "tindak_lanjut", "tindak-lanjut"].includes(role)) return ["section-status"];
  if (role) return ["section-pelapor", "section-status"];
  return [];
}

function _getWorkflowStageLabel_(workflowStage) {
  const normalized = _normalizeWorkflowStage_(workflowStage) || "section-pelapor";
  const labels = {
    "section-pelapor": "Input awal",
    "section-verifikasi": "Verifikasi EPID",
    "section-sampel": "Hasil pemeriksaan",
    "section-status": "Update status"
  };
  return labels[normalized] || normalized;
}

function _normalizeAccessKelurahanKey_(value) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, " ");
}

function _getUserAssignedKelurahanKeys_(user) {
  const rawList = user && Array.isArray(user.wilayahKelurahan) ? user.wilayahKelurahan : [];
  return rawList.map(function(v) { return _normalizeAccessKelurahanKey_(v); }).filter(Boolean);
}

function _getKelurahanKeyForRecordAccess_(dx, data) {
  const direct = _normalizeAccessKelurahanKey_((data && (data["Kelurahan"] || data["Kelurahan domisili"] || data["Kelurahan/Desa"])) || "");
  if (direct) return direct;

  const epid = String((data && data["Nomor EPID"]) || "").trim();
  if (!dx || !epid) return "";

  try {
    const record = _getRowObjectByEpid_(dx, epid);
    return _normalizeAccessKelurahanKey_(record["Kelurahan"] || record["Kelurahan domisili"] || record["Kelurahan/Desa"] || "");
  } catch (e) {
    return "";
  }
}

function _canRoleWriteSampleStage_(role) {
  role = String(role || "").trim().toLowerCase();
  return ["petugas", "surveilans", "editor", "koordinator", "lab", "laboratorium", "analislab", "analis_lab", "analis-lab"].indexOf(role) !== -1;
}

function _enforceWorkflowStageContextAccess_(sess, normalizedStage, dx, data) {
  const role = String((sess && sess.user && sess.user.role) || "").trim().toLowerCase();
  if (role === "admin") return true;

  if (normalizedStage === "section-verifikasi") {
    throw new Error("Proses verifikasi hanya dapat dilakukan oleh admin.");
  }

  if (normalizedStage === "section-sampel") {
    if (!_canRoleWriteSampleStage_(role)) {
      throw new Error("Tahap hasil pemeriksaan hanya dapat diinput oleh admin atau petugas yang berwenang atas wilayah domisili pasien.");
    }

    const recordKelurahan = _getKelurahanKeyForRecordAccess_(dx, data);
    if (!recordKelurahan) {
      throw new Error("Kelurahan domisili pasien belum tersedia, sehingga hak input hasil pemeriksaan tidak bisa diverifikasi.");
    }

    const assignedKelurahan = _getUserAssignedKelurahanKeys_(sess.user);
    if (!assignedKelurahan.length) {
      throw new Error("Wilayah kerja kelurahan akun ini belum diatur di REF_USER.");
    }

    if (assignedKelurahan.indexOf(recordKelurahan) === -1) {
      throw new Error("Petugas hanya boleh input hasil pemeriksaan untuk pasien dengan domisili kelurahan sesuai wilayah kerjanya.");
    }
  }

  return true;
}

function _applyWorkflowStageAuditFields_(data, sess, workflowStage) {
  data = data || {};
  sess = sess || {};
  const user = sess.user || {};
  const normalizedStage = _normalizeWorkflowStage_(workflowStage) || "section-pelapor";
  const stageLabel = _getWorkflowStageLabel_(normalizedStage);
  const actorName = String(user.nama || user.username || "").trim() || "unknown";
  const actorRole = String(user.role || "").trim().toLowerCase() || "unknown";
  const now = new Date();

  data["Tahap Workflow Terakhir"] = normalizedStage;
  data["Label Tahap Workflow Terakhir"] = stageLabel;
  data["Diupdate Oleh Tahap Terakhir"] = actorName;
  data["Role Pengupdate Tahap Terakhir"] = actorRole;
  data["Waktu Update Tahap Terakhir"] = now;

  const stageFieldMap = {
    "section-pelapor": {
      by: "Input Awal Diisi Oleh",
      role: "Role Pengisi Input Awal",
      at: "Waktu Input Awal"
    },
    "section-verifikasi": {
      by: "Verifikasi EPID Diupdate Oleh",
      role: "Role Pengupdate Verifikasi EPID",
      at: "Waktu Update Verifikasi EPID"
    },
    "section-sampel": {
      by: "Hasil Pemeriksaan Diupdate Oleh",
      role: "Role Pengupdate Hasil Pemeriksaan",
      at: "Waktu Update Hasil Pemeriksaan"
    },
    "section-status": {
      by: "Status Kasus Diupdate Oleh",
      role: "Role Pengupdate Status Kasus",
      at: "Waktu Update Status Kasus"
    }
  };

  const mapping = stageFieldMap[normalizedStage];
  if (mapping) {
    data[mapping.by] = actorName;
    data[mapping.role] = actorRole;
    data[mapping.at] = now;
  }

  data.__user = { username: String(user.username || "").trim(), role: actorRole, nama: actorName };
  data.__auditMeta = { workflowStage: normalizedStage, workflowStageLabel: stageLabel };
  return data;
}

function _requireWriteAccessFromSession_(sess, workflowStage, data) {
  if (!sess || !sess.user) throw new Error("Sesi tidak valid.");
  const role = String(sess.user.role || "").trim().toLowerCase();
  if (["viewer", "readonly", "read_only", "read-only"].includes(role)) {
    throw new Error("Role viewer hanya bisa melihat data dan mencetak, tidak bisa menambah/mengubah data.");
  }

  const dx = String((data && data.dx) || "").trim().toUpperCase();
  const allowedStages = _getWritableWorkflowStagesForRole_(role);
  const normalizedStage = _normalizeWorkflowStage_(workflowStage);
  const isScopedStageRole = allowedStages.length === 1 && WORKFLOW_STAGE_IDS_.length > 1;

  if (!normalizedStage) {
    if (isScopedStageRole) {
      throw new Error("Role aktif memakai pembatasan tahap kerja. Refresh aplikasi lalu simpan lewat tahap yang sesuai.");
    }
    return role || "petugas";
  }

  if (normalizedStage !== "section-pelapor" && !String((data && data["Nomor EPID"]) || "").trim()) {
    throw new Error("Tahap verifikasi / hasil pemeriksaan / update status hanya boleh untuk record existing setelah input awal tersimpan.");
  }

  if (allowedStages.length && allowedStages.indexOf(normalizedStage) === -1) {
    throw new Error("Role aktif tidak berwenang menyimpan perubahan pada tahap kerja ini.");
  }

  _enforceWorkflowStageContextAccess_(sess, normalizedStage, dx, data);

  return role || "petugas";
}

function _isAsyncPipelineEnabled_() {
  const mode = String((Config_Manager.getConfig("PIPELINE_MODE") || "sync")).trim().toLowerCase();
  return mode === "async";
}

function _buildPipelineFingerprint_(dx, savedRecord, saved) {
  const payload = {
    dx: String(dx || "").trim().toUpperCase(),
    epid: String((saved && saved.epid) || "").trim(),
    routing: String((savedRecord && savedRecord["Status Routing Pengampu"]) || "").trim(),
    targetSpreadsheet: String((savedRecord && savedRecord["SpreadsheetId Pengampu"]) || "").trim(),
    emailTargets: [
      String((savedRecord && savedRecord["Email Petugas Pengampu"]) || "").trim(),
      String((savedRecord && savedRecord["Email Kapus Pengampu"]) || "").trim()
    ].join("|"),
    printUrl: String(savedRecord && savedRecord["Link PDF"] || "").trim()
  };
  const raw = JSON.stringify(payload);
  const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, raw, Utilities.Charset.UTF_8);
  return digest.map(function(b) {
    const v = (b + 256) % 256;
    return (v < 16 ? "0" : "") + v.toString(16);
  }).join("");
}

function _runPostSavePipeline_(dx, savedRecord, saved, printUrl) {
  const policy = _getDxPipelinePolicy_(dx);
  const previousFingerprint = String((savedRecord && savedRecord["Pipeline Fingerprint"]) || "").trim();
  const currentFingerprint = _buildPipelineFingerprint_(dx, savedRecord, saved);
  const isSameFingerprint = previousFingerprint && previousFingerprint === currentFingerprint;

  const prevNotifyStatus = String((savedRecord && savedRecord["Status Notifikasi Pengampu"]) || "").trim().toUpperCase();
  const prevSyncStatus = String((savedRecord && savedRecord["Status Sinkronisasi Pengampu"]) || "").trim().toUpperCase();
  const prevTelegramStatus = String((savedRecord && savedRecord["Status Notifikasi Telegram"]) || "").trim().toUpperCase();

  const shouldNotifyEmail = policy.notifyEmail && !(isSameFingerprint && prevNotifyStatus === "SENT");
  const shouldSyncPengampu = policy.syncPengampu && !(isSameFingerprint && prevSyncStatus === "SYNCED");
  const shouldNotifyTelegram = policy.notifyTelegram && !(isSameFingerprint && prevTelegramStatus === "SENT");

  const notify = shouldNotifyEmail
    ? _sendPengampuNotification_(dx, savedRecord, saved, printUrl)
    : { sent: false, reason: isSameFingerprint ? "SKIPPED_IDEMPOTENT" : "DISABLED_BY_POLICY" };

  const syncPengampu = shouldSyncPengampu
    ? _syncPengampuSpreadsheet_(dx, savedRecord, saved, printUrl)
    : { synced: false, reason: isSameFingerprint ? "SKIPPED_IDEMPOTENT" : "DISABLED_BY_POLICY" };

  const telegramNotify = shouldNotifyTelegram
    ? _sendTelegramPd3iNotification_(dx, savedRecord, saved, printUrl)
    : { sent: false, reason: isSameFingerprint ? "SKIPPED_IDEMPOTENT" : "DISABLED_BY_POLICY" };

  const notifyPatch = {
    "Nomor EPID": saved.epid,
    "Status Notifikasi Pengampu": notify.sent ? "SENT" : (shouldNotifyEmail ? (notify.reason || "FAILED") : prevNotifyStatus || "SKIPPED"),
    "Reason Notifikasi Pengampu": notify.sent ? "" : (notify.reason || ""),
    "Notified At Pengampu": new Date(),
    "Notified To Pengampu": notify.to || "",
    "Status Sinkronisasi Pengampu": syncPengampu.synced ? "SYNCED" : (shouldSyncPengampu ? (syncPengampu.reason || "FAILED") : prevSyncStatus || "SKIPPED"),
    "Reason Sinkronisasi Pengampu": syncPengampu.synced ? "" : (syncPengampu.reason || ""),
    "Synced At Pengampu": new Date(),
    "Sync Target Pengampu": syncPengampu.target || "",
    "Status Notifikasi Telegram": telegramNotify.sent ? "SENT" : (shouldNotifyTelegram ? (telegramNotify.reason || "FAILED") : prevTelegramStatus || "SKIPPED"),
    "Reason Notifikasi Telegram": telegramNotify.sent ? "" : (telegramNotify.reason || ""),
    "Telegram Notified At": new Date(),
    "Telegram Target": telegramNotify.target || "",
    "Telegram Retry Count": shouldNotifyTelegram ? ((Number(savedRecord["Telegram Retry Count"] || 0) || 0) + 1) : (Number(savedRecord["Telegram Retry Count"] || 0) || 0),
    "Pipeline Fingerprint": currentFingerprint,
    "Pipeline Last Run At": new Date()
  };

  try {
    saveDxRecord_(dx, notifyPatch);
  } catch (e) {
    // jangan gagalkan save utama hanya karena status pipeline gagal ditulis
  }

  return {
    pengampuNotification: notify,
    pengampuSync: syncPengampu,
    telegramNotification: telegramNotify,
    idempotent: isSameFingerprint
  };
}

// ─── saveFormPayload_ ─────────────────────────────────────────────────────────
function saveFormPayload_(data) {
  const token = String(data.__token || "").trim();
  const sess = _getSessionFromToken_(token);
  if (!sess.ok) {
    return { status: "error", message: sess.message || "Sesi habis. Silakan login ulang." };
  }
  _requireWriteAccessFromSession_(sess, data.__workflowStage, data);

  const dx = String(data.dx || "").trim().toUpperCase();
  if (!dx) {
    return { status: "error", message: "dx wajib diisi." };
  }

  data = _applyWorkflowStageAuditFields_(data, sess, data.__workflowStage);

  const saved = saveDxRecord_(dx, data);
  const printUrl = safeGetPdfPrintUrl_(dx, saved.epid, token);
  try {
    const sheet = getSheetOrThrow_(dx + "_Raw");
    const headers = getTrimmedHeaders_(sheet);
    const idxEpid = headers.indexOf("Nomor EPID");
    const idxPdf = headers.indexOf("Link PDF");
    if (saved.rowIndex && idxEpid !== -1) sheet.getRange(saved.rowIndex, idxEpid + 1).setValue(saved.epid || "");
    if (saved.rowIndex && idxPdf !== -1) sheet.getRange(saved.rowIndex, idxPdf + 1).setValue(printUrl || "");
  } catch (persistErr) {
    console.warn("Persist EPID/Link PDF setelah save gagal:", persistErr);
  }
  let savedRecord = data;
  try {
    savedRecord = _getRowObjectByEpid_(dx, saved.epid);
  } catch (e) {
    savedRecord = data;
  }

  const pipelineFingerprint = _buildPipelineFingerprint_(dx, savedRecord, saved);
  let pipelineResult = null;

  if (_isAsyncPipelineEnabled_() && typeof enqueuePipelineTask_ === "function") {
    const queueRes = enqueuePipelineTask_(dx, saved.epid, pipelineFingerprint, { printUrl: printUrl });
    const queuedPatch = {
      "Nomor EPID": saved.epid,
      "Status Notifikasi Pengampu": "QUEUED",
      "Status Sinkronisasi Pengampu": "QUEUED",
      "Status Notifikasi Telegram": "QUEUED",
      "Reason Notifikasi Pengampu": "QUEUED_ASYNC",
      "Reason Sinkronisasi Pengampu": "QUEUED_ASYNC",
      "Reason Notifikasi Telegram": "QUEUED_ASYNC",
      "Pipeline Fingerprint": pipelineFingerprint,
      "Pipeline Last Run At": new Date()
    };
    try { saveDxRecord_(dx, queuedPatch); } catch (e) {}

    pipelineResult = {
      pengampuNotification: { sent: false, reason: "QUEUED_ASYNC" },
      pengampuSync: { synced: false, reason: "QUEUED_ASYNC" },
      telegramNotification: { sent: false, reason: "QUEUED_ASYNC" },
      idempotent: false,
      queued: !!(queueRes && queueRes.queued)
    };
  } else {
    pipelineResult = _runPostSavePipeline_(dx, savedRecord, saved, printUrl);
  }

  return {
    status: "success",
    message: saved.isUpdate
      ? "Data EPID " + saved.epid + " berhasil diperbarui!"
      : "Data baru berhasil disimpan!",
    epid: saved.epid,
    dx: dx,
    printUrl: printUrl,
    pipelineIdempotent: !!pipelineResult.idempotent,
    pipelineQueued: !!pipelineResult.queued,
    pengampuNotification: pipelineResult.pengampuNotification,
    pengampuSync: pipelineResult.pengampuSync,
    telegramNotification: pipelineResult.telegramNotification
  };
}
