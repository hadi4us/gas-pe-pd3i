function SARS_repair_OnTime_FromSubmitVsDeadline_FINAL() {
  const ss = openSarsSpreadsheet();
  const sheetData = (SARS_CONFIG && SARS_CONFIG.SHEET_DATA) ? SARS_CONFIG.SHEET_DATA : "SARS";
  const sh = ss.getSheetByName(sheetData);
  if (!sh) throw new Error(`Sheet "${sheetData}" tidak ditemukan.`);

  const lastRow = sh.getLastRow();
  const lastCol = sh.getLastColumn();
  if (lastRow < 2) {
    Logger.log("Tidak ada data.");
    return;
  }

  const values = sh.getRange(1, 1, lastRow, lastCol).getValues();
  const headers = (values[0] || []).map(h => String(h || "").trim());

  const iSubmit = headers.indexOf("Waktu Submit");
  const iDeadline = headers.indexOf("Deadline");
  const iOnTime = headers.indexOf("OnTime");

  if (iSubmit < 0) throw new Error('Header "Waktu Submit" tidak ditemukan.');
  if (iDeadline < 0) throw new Error('Header "Deadline" tidak ditemukan.');
  if (iOnTime < 0) throw new Error('Header "OnTime" tidak ditemukan.');

  const out = [];
  let cntTrue = 0, cntFalse = 0, cntSkip = 0;

  for (let r = 1; r < values.length; r++) {
    const rawSubmit = values[r][iSubmit];
    const rawDeadline = values[r][iDeadline];

    const submit = (rawSubmit instanceof Date) ? rawSubmit : new Date(rawSubmit);
    const deadline = (rawDeadline instanceof Date) ? rawDeadline : new Date(rawDeadline);

    if (isNaN(submit.getTime()) || isNaN(deadline.getTime())) {
      out.push([""]); // biarkan kosong kalau parsing gagal
      cntSkip++;
      continue;
    }

    const onTime = submit.getTime() <= deadline.getTime();
    out.push([onTime]);

    if (onTime) cntTrue++;
    else cntFalse++;
  }

  // Tulis balik ke kolom OnTime (baris 2..lastRow)
  sh.getRange(2, iOnTime + 1, out.length, 1).setValues(out);

  SpreadsheetApp.flush();
  Logger.log(`DONE update OnTime | TRUE=${cntTrue} FALSE=${cntFalse} SKIP=${cntSkip}`);
}
