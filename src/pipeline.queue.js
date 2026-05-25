const PIPELINE_QUEUE_SHEET = "PIPELINE_QUEUE";
const PIPELINE_QUEUE_HEADERS = [
  "CreatedAt",
  "DX",
  "Nomor EPID",
  "Fingerprint",
  "PrintUrl",
  "Status",
  "Attempts",
  "LastError",
  "ProcessedAt"
];

function _getOrCreatePipelineQueueSheet_() {
  const ss = getSpreadsheet_();
  let sh = ss.getSheetByName(PIPELINE_QUEUE_SHEET);
  if (!sh) {
    sh = ss.insertSheet(PIPELINE_QUEUE_SHEET);
    sh.getRange(1, 1, 1, PIPELINE_QUEUE_HEADERS.length).setValues([PIPELINE_QUEUE_HEADERS]);
  }
  return sh;
}

function enqueuePipelineTask_(dx, epid, fingerprint, meta) {
  dx = String(dx || "").trim().toUpperCase();
  epid = String(epid || "").trim();
  fingerprint = String(fingerprint || "").trim();
  const printUrl = String((meta && meta.printUrl) || "").trim();

  if (!dx || !epid || !fingerprint) {
    return { queued: false, reason: "INVALID_PAYLOAD" };
  }

  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);

    const sh = _getOrCreatePipelineQueueSheet_();
    const values = sh.getDataRange().getValues();

    if (values.length > 1) {
      const headers = values[0].map(h => String(h || "").trim());
      const idxDx = headers.indexOf("DX");
      const idxEpid = headers.indexOf("Nomor EPID");
      const idxFp = headers.indexOf("Fingerprint");
      const idxStatus = headers.indexOf("Status");

      for (let i = values.length - 1; i >= 1; i--) {
        const isSame =
          String(values[i][idxDx] || "").trim().toUpperCase() === dx &&
          String(values[i][idxEpid] || "").trim() === epid &&
          String(values[i][idxFp] || "").trim() === fingerprint;
        if (!isSame) continue;

        const st = String(values[i][idxStatus] || "").trim().toUpperCase();
        if (st === "PENDING" || st === "DONE") {
          return { queued: false, reason: "DUPLICATE" };
        }
      }
    }

    sh.appendRow([
      new Date(),
      dx,
      epid,
      fingerprint,
      printUrl,
      "PENDING",
      0,
      "",
      ""
    ]);

    return { queued: true };
  } catch (e) {
    return { queued: false, reason: String(e) };
  } finally {
    try { lock.releaseLock(); } catch (e2) {}
  }
}

function processPipelineQueue(limit) {
  const maxItems = Math.max(1, Math.min(50, Number(limit || 10) || 10));
  const lock = LockService.getScriptLock();
  const summary = { processed: 0, success: 0, failed: 0 };

  try {
    lock.waitLock(30000);
    const sh = _getOrCreatePipelineQueueSheet_();
    const values = sh.getDataRange().getValues();
    if (!values || values.length < 2) return summary;

    const headers = values[0].map(h => String(h || "").trim());
    const idxDx = headers.indexOf("DX");
    const idxEpid = headers.indexOf("Nomor EPID");
    const idxStatus = headers.indexOf("Status");
    const idxAttempts = headers.indexOf("Attempts");
    const idxError = headers.indexOf("LastError");
    const idxProcessedAt = headers.indexOf("ProcessedAt");

    for (let i = 1; i < values.length; i++) {
      if (summary.processed >= maxItems) break;
      const st = String(values[i][idxStatus] || "").trim().toUpperCase();
      if (st !== "PENDING") continue;

      const rowIndex = i + 1;
      const dx = String(values[i][idxDx] || "").trim().toUpperCase();
      const epid = String(values[i][idxEpid] || "").trim();

      try {
        const record = _getRowObjectByEpid_(dx, epid);
        const saved = { epid: epid };
        const printUrl = String(record["Link PDF"] || "").trim();
        _runPostSavePipeline_(dx, record, saved, printUrl);

        sh.getRange(rowIndex, idxStatus + 1).setValue("DONE");
        sh.getRange(rowIndex, idxAttempts + 1).setValue(Number(values[i][idxAttempts] || 0) + 1);
        sh.getRange(rowIndex, idxError + 1).setValue("");
        sh.getRange(rowIndex, idxProcessedAt + 1).setValue(new Date());

        summary.success += 1;
      } catch (err) {
        sh.getRange(rowIndex, idxStatus + 1).setValue("FAILED");
        sh.getRange(rowIndex, idxAttempts + 1).setValue(Number(values[i][idxAttempts] || 0) + 1);
        sh.getRange(rowIndex, idxError + 1).setValue(String(err));
        sh.getRange(rowIndex, idxProcessedAt + 1).setValue(new Date());

        summary.failed += 1;
      }

      summary.processed += 1;
    }

    return summary;
  } finally {
    try { lock.releaseLock(); } catch (e2) {}
  }
}
