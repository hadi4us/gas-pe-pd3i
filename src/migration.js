function inspectReferenceSheetSchema() {
  const ss = getSpreadsheet_();
  const names = ss.getSheets().map(function(sh) { return sh.getName(); });
  const wanted = names.filter(function(n) {
    return /^REF_USER($|_LEGACY_)/.test(n) || /^REF_PENGAMPU($|_LEGACY_)/.test(n);
  }).sort();
  const out = {
    spreadsheetId: ss.getId(),
    spreadsheetName: ss.getName(),
    sheets: []
  };

  wanted.forEach(function(name) {
    const sh = ss.getSheetByName(name);
    if (!sh) return;
    const lastCol = sh.getLastColumn();
    const lastRow = sh.getLastRow();
    const headers = lastCol > 0 ? sh.getRange(1, 1, 1, lastCol).getValues()[0].map(function(v) { return String(v || "").trim(); }) : [];
    const previewRows = lastRow > 1 && lastCol > 0
      ? sh.getRange(2, 1, Math.min(5, lastRow - 1), lastCol).getValues()
      : [];
    out.sheets.push({
      name: name,
      exists: true,
      rows: lastRow,
      cols: lastCol,
      headers: headers,
      previewRows: previewRows
    });
  });

  return out;
}

function _findLatestLegacySheet_(prefix) {
  const ss = getSpreadsheet_();
  const matches = ss.getSheets()
    .map(function(sh) { return sh.getName(); })
    .filter(function(name) { return name.indexOf(prefix) === 0; })
    .sort();
  if (!matches.length) return null;
  return ss.getSheetByName(matches[matches.length - 1]);
}

function _idxHeader_(headers, names) {
  for (var i = 0; i < names.length; i++) {
    var found = headers.indexOf(names[i]);
    if (found !== -1) return found;
  }
  return -1;
}

function _normalizeMigrationKey_(v) {
  return String(v || '').trim().toUpperCase().replace(/\s+/g, ' ');
}

function _buildScopedAccessSheetsFromLegacy_(legacyUser, legacyPengampu) {
  const ss = getSpreadsheet_();
  const tz = Session.getScriptTimeZone() || 'Asia/Jakarta';
  const stamp = Utilities.formatDate(new Date(), tz, 'yyyyMMdd_HHmmss');

  const currentUser = ss.getSheetByName('REF_USER');
  const currentPengampu = ss.getSheetByName('REF_PENGAMPU');
  if (currentUser) currentUser.setName('REF_USER_PRE_REPAIR_' + stamp);
  if (currentPengampu) currentPengampu.setName('REF_PENGAMPU_PRE_REPAIR_' + stamp);

  const legacyUserHeaders = getTrimmedHeaders_(legacyUser);
  const legacyPengampuHeaders = getTrimmedHeaders_(legacyPengampu);
  const legacyUserRows = legacyUser.getLastRow() > 1 && legacyUser.getLastColumn() > 0
    ? legacyUser.getRange(2, 1, legacyUser.getLastRow() - 1, legacyUser.getLastColumn()).getValues()
    : [];
  const legacyPengampuRows = legacyPengampu.getLastRow() > 1 && legacyPengampu.getLastColumn() > 0
    ? legacyPengampu.getRange(2, 1, legacyPengampu.getLastRow() - 1, legacyPengampu.getLastColumn()).getValues()
    : [];

  const userSheet = ss.insertSheet('REF_USER');
  const pengampuSheet = ss.insertSheet('REF_PENGAMPU');

  const newUserHeaders = [
    'Username',
    'PIN',
    'Email',
    'Nama',
    'Role',
    'UnitKerja',
    'KodePuskesmas',
    'ScopeLevel',
    'StatusAktif',
    'Catatan Migrasi'
  ];
  userSheet.getRange(1, 1, 1, newUserHeaders.length).setValues([newUserHeaders]);

  const newPengampuHeaders = [
    'Status',
    'Kab/Kota',
    'Kecamatan',
    'Kelurahan',
    'KodePuskesmas',
    'NamaPuskesmas',
    'Pengampu',
    'PetugasSurveilans',
    'EmailPetugas',
    'KepalaPuskesmas',
    'EmailKapus',
    'SpreadsheetId',
    'SpreadsheetUrl',
    'SpreadsheetIdTujuan',
    'SpreadsheetUrlTujuan',
    'NamaSheetTujuan',
    'TelegramChatId',
    'Catatan'
  ];
  pengampuSheet.getRange(1, 1, 1, newPengampuHeaders.length).setValues([newPengampuHeaders]);

  const idxKab = _idxHeader_(legacyPengampuHeaders, ['Kab/Kota', 'Kabupaten/Kota', 'Kab/Kota Pasien']);
  const idxKec = _idxHeader_(legacyPengampuHeaders, ['Kecamatan']);
  const idxKel = _idxHeader_(legacyPengampuHeaders, ['Kelurahan', 'Kelurahan/Desa', 'Desa/Kelurahan']);
  const idxKodePkm = _idxHeader_(legacyPengampuHeaders, ['KodePuskesmas', 'Kode Puskesmas', 'Kode PKM']);
  const idxNamaPkm = _idxHeader_(legacyPengampuHeaders, ['NamaPuskesmas', 'Nama Puskesmas', 'Puskesmas']);
  const idxPengampu = _idxHeader_(legacyPengampuHeaders, ['Pengampu']);
  const idxPetugas = _idxHeader_(legacyPengampuHeaders, ['PetugasSurveilans', 'Petugas Surveilans', 'NamaPetugas', 'Nama Petugas']);
  const idxEmailPetugas = _idxHeader_(legacyPengampuHeaders, ['EmailPetugas', 'Email Petugas', 'Email']);
  const idxKapus = _idxHeader_(legacyPengampuHeaders, ['KepalaPuskesmas', 'Kepala Puskesmas']);
  const idxEmailKapus = _idxHeader_(legacyPengampuHeaders, ['EmailKapus', 'Email Kapus']);
  const idxSpreadsheetId = _idxHeader_(legacyPengampuHeaders, ['SpreadsheetId', 'SpreadsheetIdTujuan']);
  const idxSpreadsheetUrl = _idxHeader_(legacyPengampuHeaders, ['SpreadsheetUrl', 'SpreadsheetUrlTujuan']);
  const idxSpreadsheetIdTujuan = _idxHeader_(legacyPengampuHeaders, ['SpreadsheetIdTujuan', 'SpreadsheetId']);
  const idxSpreadsheetUrlTujuan = _idxHeader_(legacyPengampuHeaders, ['SpreadsheetUrlTujuan', 'SpreadsheetUrl']);
  const idxNamaSheetTujuan = _idxHeader_(legacyPengampuHeaders, ['NamaSheetTujuan']);
  const idxTelegram = _idxHeader_(legacyPengampuHeaders, ['TelegramChatId']);
  const idxStatusPengampu = _idxHeader_(legacyPengampuHeaders, ['Status', 'Aktif']);
  const idxCatatan = _idxHeader_(legacyPengampuHeaders, ['Catatan']);

  const pengampuLookupByWilayah = {};
  const pengampuLookupByPkm = {};
  const migratedPengampu = legacyPengampuRows.map(function(row) {
    const kab = idxKab !== -1 ? row[idxKab] : '';
    const kec = idxKec !== -1 ? row[idxKec] : '';
    const kel = idxKel !== -1 ? row[idxKel] : '';
    const kodePkm = idxKodePkm !== -1 ? row[idxKodePkm] : '';
    const namaPkm = idxNamaPkm !== -1 ? row[idxNamaPkm] : '';
    const pengampu = idxPengampu !== -1 ? row[idxPengampu] : namaPkm;
    const petugas = idxPetugas !== -1 ? row[idxPetugas] : '';
    const emailPetugas = idxEmailPetugas !== -1 ? row[idxEmailPetugas] : '';
    const kapus = idxKapus !== -1 ? row[idxKapus] : '';
    const emailKapus = idxEmailKapus !== -1 ? row[idxEmailKapus] : '';
    const spreadsheetId = idxSpreadsheetId !== -1 ? row[idxSpreadsheetId] : '';
    const spreadsheetUrl = idxSpreadsheetUrl !== -1 ? row[idxSpreadsheetUrl] : '';
    const spreadsheetIdTujuan = idxSpreadsheetIdTujuan !== -1 ? row[idxSpreadsheetIdTujuan] : spreadsheetId;
    const spreadsheetUrlTujuan = idxSpreadsheetUrlTujuan !== -1 ? row[idxSpreadsheetUrlTujuan] : spreadsheetUrl;
    const namaSheetTujuan = idxNamaSheetTujuan !== -1 ? row[idxNamaSheetTujuan] : '';
    const telegram = idxTelegram !== -1 ? row[idxTelegram] : '';
    const status = idxStatusPengampu !== -1 ? row[idxStatusPengampu] : 'AKTIF';
    const catatan = idxCatatan !== -1 ? row[idxCatatan] : '';

    const wilayahKey = [_normalizeMigrationKey_(kab), _normalizeMigrationKey_(kec), _normalizeMigrationKey_(kel)].join('|');
    pengampuLookupByWilayah[wilayahKey] = { kodePuskesmas: kodePkm, namaPuskesmas: namaPkm };
    if (_normalizeMigrationKey_(namaPkm)) pengampuLookupByPkm[_normalizeMigrationKey_(namaPkm)] = { kodePuskesmas: kodePkm, namaPuskesmas: namaPkm };

    return [
      status,
      kab,
      kec,
      kel,
      kodePkm,
      namaPkm,
      pengampu,
      petugas,
      emailPetugas,
      kapus,
      emailKapus,
      spreadsheetId,
      spreadsheetUrl,
      spreadsheetIdTujuan,
      spreadsheetUrlTujuan,
      namaSheetTujuan,
      telegram,
      catatan || ('Dimigrasikan ulang dari ' + legacyPengampu.getName())
    ];
  });
  if (migratedPengampu.length) {
    pengampuSheet.getRange(2, 1, migratedPengampu.length, newPengampuHeaders.length).setValues(migratedPengampu);
  }

  const idxUserUsername = _idxHeader_(legacyUserHeaders, ['Username', 'username']);
  const idxUserPin = _idxHeader_(legacyUserHeaders, ['PIN', 'Pin', 'pin']);
  const idxUserEmail = _idxHeader_(legacyUserHeaders, ['Email', 'email']);
  const idxUserNama = _idxHeader_(legacyUserHeaders, ['Nama', 'Nama Petugas', 'name']);
  const idxUserRole = _idxHeader_(legacyUserHeaders, ['Role', 'role']);
  const idxUserAktif = _idxHeader_(legacyUserHeaders, ['StatusAktif', 'Aktif', 'Status', 'Active']);
  const idxUserUnit = _idxHeader_(legacyUserHeaders, ['UnitKerja', 'Unit Kerja', 'Nama Puskesmas', 'Puskesmas', 'Unit Kerja']);
  const idxUserKode = _idxHeader_(legacyUserHeaders, ['KodePuskesmas', 'Kode Puskesmas', 'Kode PKM']);
  const idxUserKec = _idxHeader_(legacyUserHeaders, ['Kecamatan Wilayah Kerja', 'Kecamatan']);
  const idxUserKel = _idxHeader_(legacyUserHeaders, ['Kelurahan Wilayah Kerja', 'Kelurahan']);

  function inferUnitKerja(row, role, nama, username) {
    const normalizedRole = _normalizeMigrationKey_(role).toLowerCase();
    if (normalizedRole === 'admin') return { unitKerja: 'DINKES', kodePuskesmas: 'DINKES', scopeLevel: 'dinkes' };

    const explicitUnit = idxUserUnit !== -1 ? row[idxUserUnit] : '';
    const explicitKode = idxUserKode !== -1 ? row[idxUserKode] : '';
    if (explicitUnit || explicitKode) {
      return { unitKerja: explicitUnit, kodePuskesmas: explicitKode, scopeLevel: 'puskesmas' };
    }

    const kec = idxUserKec !== -1 ? row[idxUserKec] : '';
    const kel = idxUserKel !== -1 ? row[idxUserKel] : '';
    if (_normalizeMigrationKey_(kec) === 'ALL' || _normalizeMigrationKey_(kel) === 'ALL') {
      return { unitKerja: 'DINKES', kodePuskesmas: 'DINKES', scopeLevel: 'dinkes' };
    }
    const wilayahKey = [_normalizeMigrationKey_('KOTA DEPOK'), _normalizeMigrationKey_(kec), _normalizeMigrationKey_(kel)].join('|');
    if (pengampuLookupByWilayah[wilayahKey]) {
      return {
        unitKerja: pengampuLookupByWilayah[wilayahKey].namaPuskesmas,
        kodePuskesmas: pengampuLookupByWilayah[wilayahKey].kodePuskesmas,
        scopeLevel: 'puskesmas'
      };
    }

    var fromName = pengampuLookupByPkm[_normalizeMigrationKey_(nama)] || pengampuLookupByPkm[_normalizeMigrationKey_(username)];
    if (fromName) {
      return {
        unitKerja: fromName.namaPuskesmas,
        kodePuskesmas: fromName.kodePuskesmas,
        scopeLevel: 'puskesmas'
      };
    }

    return { unitKerja: '', kodePuskesmas: '', scopeLevel: 'puskesmas' };
  }

  const migratedUsers = legacyUserRows.map(function(row) {
    const username = idxUserUsername !== -1 ? row[idxUserUsername] : '';
    const pin = idxUserPin !== -1 ? row[idxUserPin] : '';
    const email = idxUserEmail !== -1 ? row[idxUserEmail] : '';
    const nama = idxUserNama !== -1 ? row[idxUserNama] : '';
    const role = idxUserRole !== -1 ? row[idxUserRole] : '';
    const aktif = idxUserAktif !== -1 ? row[idxUserAktif] : 'AKTIF';
    const inferred = inferUnitKerja(row, role, nama, username);
    const notes = [];
    if (!inferred.unitKerja && String(role || '').trim().toLowerCase() !== 'admin') {
      notes.push('Perlu review manual unit/kode puskesmas');
    }
    notes.push('Dimigrasikan ulang dari ' + legacyUser.getName());
    return [
      username,
      pin,
      email,
      nama,
      role,
      inferred.unitKerja,
      inferred.kodePuskesmas,
      inferred.scopeLevel,
      aktif,
      notes.join(' | ')
    ];
  });
  if (migratedUsers.length) {
    userSheet.getRange(2, 1, migratedUsers.length, newUserHeaders.length).setValues(migratedUsers);
  }

  [userSheet, pengampuSheet].forEach(function(sh) {
    sh.setFrozenRows(1);
    sh.autoResizeColumns(1, sh.getLastColumn());
  });

  return {
    status: 'success',
    sourceLegacyUser: legacyUser.getName(),
    sourceLegacyPengampu: legacyPengampu.getName(),
    currentUserBackup: currentUser ? currentUser.getName() : '',
    currentPengampuBackup: currentPengampu ? currentPengampu.getName() : '',
    migratedUserRows: migratedUsers.length,
    migratedPengampuRows: migratedPengampu.length,
    userHeaders: newUserHeaders,
    pengampuHeaders: newPengampuHeaders
  };
}

function migrateReferenceSheetsToScopedAccessModel() {
  const ss = getSpreadsheet_();
  const tz = Session.getScriptTimeZone() || 'Asia/Jakarta';
  const stamp = Utilities.formatDate(new Date(), tz, 'yyyyMMdd_HHmmss');

  const oldUser = ss.getSheetByName('REF_USER');
  const oldPengampu = ss.getSheetByName('REF_PENGAMPU');
  if (!oldUser || !oldPengampu) {
    throw new Error('Sheet REF_USER dan/atau REF_PENGAMPU tidak ditemukan.');
  }

  oldUser.setName('REF_USER_LEGACY_' + stamp);
  oldPengampu.setName('REF_PENGAMPU_LEGACY_' + stamp);
  return _buildScopedAccessSheetsFromLegacy_(oldUser, oldPengampu);
}

function repairReferenceSheetsToScopedAccessModel() {
  const legacyUser = _findLatestLegacySheet_('REF_USER_LEGACY_');
  const legacyPengampu = _findLatestLegacySheet_('REF_PENGAMPU_LEGACY_');
  if (!legacyUser || !legacyPengampu) {
    throw new Error('Legacy REF_USER / REF_PENGAMPU tidak ditemukan untuk repair.');
  }
  return _buildScopedAccessSheetsFromLegacy_(legacyUser, legacyPengampu);
}

function _normalizeDxList_(dxList) {
  var list = Array.isArray(dxList) ? dxList : (dxList ? [dxList] : ['MR', 'DIF', 'PERT', 'TN', 'AFP']);
  var seen = {};
  return list.map(function(dx) { return String(dx || '').trim().toUpperCase(); }).filter(function(dx) {
    if (!dx || seen[dx]) return false;
    seen[dx] = true;
    return ['MR', 'DIF', 'PERT', 'TN', 'AFP'].indexOf(dx) !== -1;
  });
}

function _getRawSheetNameFromDx_(dx) {
  return String(dx || '').trim().toUpperCase() + '_Raw';
}

function _getRawHeaders_(sheet) {
  if (!sheet || sheet.getLastColumn() < 1) return [];
  return sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(function(v) { return String(v || '').trim(); });
}

function _findDuplicateHeaders_(headers) {
  var seen = {};
  var dups = [];
  (headers || []).forEach(function(h) {
    var key = String(h || '').trim();
    if (!key) return;
    if (seen[key] && dups.indexOf(key) === -1) dups.push(key);
    seen[key] = true;
  });
  return dups;
}

function _buildRawHeaderAuditForDx_(dx) {
  var sheetName = _getRawSheetNameFromDx_(dx);
  var sheet = getSheetOrThrow_(sheetName);
  var headers = _getRawHeaders_(sheet);
  var canonical = getCanonicalRawHeaderOrder_(dx) || [];
  var canonicalPresent = canonical.filter(function(h) { return headers.indexOf(h) !== -1; });
  var legacyOrUnknown = headers.filter(function(h) { return canonical.indexOf(h) === -1; });
  var missingCanonical = canonical.filter(function(h) { return headers.indexOf(h) === -1; });
  var duplicates = _findDuplicateHeaders_(headers);
  var proposed = canonicalPresent.concat(legacyOrUnknown);
  return {
    dx: dx,
    sheetName: sheetName,
    rowCount: sheet.getLastRow(),
    columnCount: sheet.getLastColumn(),
    headers: headers,
    duplicateHeaders: duplicates,
    canonicalPresent: canonicalPresent,
    missingCanonical: missingCanonical,
    canonicalPresentCount: canonicalPresent.length,
    missingCanonicalCount: missingCanonical.length,
    legacyOrUnknownHeaders: legacyOrUnknown,
    legacyOrUnknownCount: legacyOrUnknown.length,
    proposedHeaderOrder: proposed,
    willChangeOrder: JSON.stringify(headers) !== JSON.stringify(proposed),
    willAppendMissing: !!missingCanonical.length
  };
}

function inspectRawSheetHeaders(token, dxList) {
  _requireAdminFromToken_(token);
  var dxs = _normalizeDxList_(dxList);
  return {
    status: 'success',
    spreadsheetId: getSpreadsheet_().getId(),
    inspectedAt: new Date().toISOString(),
    sheets: dxs.map(function(dx) { return _buildRawHeaderAuditForDx_(dx); })
  };
}

function previewRawSheetHeaderReorder(token, dxList) {
  return inspectRawSheetHeaders(token, dxList);
}

function previewRawSheetHeaderAppend(token, dxList) {
  return inspectRawSheetHeaders(token, dxList);
}

function _copyRawSheetBackup_(sheet, label) {
  var ss = getSpreadsheet_();
  var tz = Session.getScriptTimeZone() || 'Asia/Jakarta';
  var stamp = Utilities.formatDate(new Date(), tz, 'yyyyMMdd_HHmmss');
  var backup = sheet.copyTo(ss);
  var safeLabel = String(label || 'PRE_REORDER').trim().toUpperCase().replace(/[^A-Z0-9_]+/g, '_') || 'PRE_REORDER';
  backup.setName(sheet.getName() + '_' + safeLabel + '_' + stamp);
  return backup.getName();
}

function _ensureSheetColumnCapacity_(sheet, wantedColumnCount) {
  wantedColumnCount = Math.max(0, Number(wantedColumnCount) || 0);
  var currentMax = sheet.getMaxColumns();
  if (wantedColumnCount <= currentMax) return;
  sheet.insertColumnsAfter(currentMax, wantedColumnCount - currentMax);
}

function _appendMissingRawHeaders_(sheet, missingHeaders) {
  var currentHeaders = _getRawHeaders_(sheet);
  var additions = (missingHeaders || []).filter(function(header) {
    var key = String(header || '').trim();
    return key && currentHeaders.indexOf(key) === -1;
  });
  if (!additions.length) {
    return {
      changed: false,
      appendedHeaders: [],
      finalColumnCount: sheet.getLastColumn()
    };
  }

  var startCol = sheet.getLastColumn() + 1;
  _ensureSheetColumnCapacity_(sheet, startCol + additions.length - 1);
  sheet.getRange(1, startCol, 1, additions.length).setValues([additions]);
  return {
    changed: true,
    appendedHeaders: additions,
    finalColumnCount: sheet.getLastColumn()
  };
}

function _reorderRawSheetColumns_(sheet, proposedHeaders) {
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastCol < 1) return { changed: false, message: 'Sheet kosong.' };

  var data = sheet.getRange(1, 1, lastRow, lastCol).getValues();
  var oldHeaders = data[0].map(function(v) { return String(v || '').trim(); });
  var newHeaders = proposedHeaders.slice();
  var indexMap = newHeaders.map(function(header) { return oldHeaders.indexOf(header); });
  var reordered = [newHeaders];

  for (var r = 1; r < data.length; r++) {
    var oldRow = data[r];
    var newRow = indexMap.map(function(idx) { return idx >= 0 ? oldRow[idx] : ''; });
    reordered.push(newRow);
  }

  sheet.clearContents();
  sheet.getRange(1, 1, reordered.length, newHeaders.length).setValues(reordered);
  return { changed: true, columns: newHeaders.length, rows: reordered.length };
}

function reorderRawSheetHeaders(token, dxList, options) {
  _requireAdminFromToken_(token);
  var opts = options || {};
  var doBackup = opts.backup !== false;
  var dxs = _normalizeDxList_(dxList);
  var results = [];

  dxs.forEach(function(dx) {
    var audit = _buildRawHeaderAuditForDx_(dx);
    if (audit.duplicateHeaders && audit.duplicateHeaders.length) {
      results.push({
        dx: dx,
        sheetName: audit.sheetName,
        status: 'error',
        message: 'Duplicate exact header ditemukan. Reorder dibatalkan untuk sheet ini.',
        duplicateHeaders: audit.duplicateHeaders
      });
      return;
    }

    if (!audit.willChangeOrder) {
      results.push({
        dx: dx,
        sheetName: audit.sheetName,
        status: 'noop',
        message: 'Urutan header sudah sesuai canonical order.',
        legacyOrUnknownHeaders: audit.legacyOrUnknownHeaders,
        missingCanonical: audit.missingCanonical
      });
      return;
    }

    var sheet = getSheetOrThrow_(audit.sheetName);
    var backupSheetName = doBackup ? _copyRawSheetBackup_(sheet, 'PRE_REORDER') : '';
    var reorderResult = _reorderRawSheetColumns_(sheet, audit.proposedHeaderOrder);

    results.push({
      dx: dx,
      sheetName: audit.sheetName,
      status: 'success',
      backupSheetName: backupSheetName,
      changed: !!reorderResult.changed,
      legacyOrUnknownHeaders: audit.legacyOrUnknownHeaders,
      missingCanonical: audit.missingCanonical,
      finalHeaders: audit.proposedHeaderOrder
    });
  });

  return {
    status: 'success',
    reorderedAt: new Date().toISOString(),
    results: results
  };
}

function appendMissingRawSheetHeaders(token, dxList, options) {
  _requireAdminFromToken_(token);
  var opts = options || {};
  var doBackup = opts.backup !== false;
  var reorderAfterAppend = opts.reorderAfterAppend === true;
  var dxs = _normalizeDxList_(dxList);
  var results = [];

  dxs.forEach(function(dx) {
    var audit = _buildRawHeaderAuditForDx_(dx);
    if (audit.duplicateHeaders && audit.duplicateHeaders.length) {
      results.push({
        dx: dx,
        sheetName: audit.sheetName,
        status: 'error',
        message: 'Duplicate exact header ditemukan. Append missing header dibatalkan untuk sheet ini.',
        duplicateHeaders: audit.duplicateHeaders
      });
      return;
    }

    if (!audit.missingCanonical || !audit.missingCanonical.length) {
      results.push({
        dx: dx,
        sheetName: audit.sheetName,
        status: audit.willChangeOrder && reorderAfterAppend ? 'pending_reorder_only' : 'noop',
        message: audit.willChangeOrder && reorderAfterAppend
          ? 'Tidak ada header canonical yang hilang, tetapi sheet masih bisa direorder.'
          : 'Tidak ada header canonical yang perlu ditambahkan.',
        missingCanonical: [],
        legacyOrUnknownHeaders: audit.legacyOrUnknownHeaders
      });
      return;
    }

    var sheet = getSheetOrThrow_(audit.sheetName);
    var backupSheetName = doBackup ? _copyRawSheetBackup_(sheet, 'PRE_APPEND') : '';
    var appendResult = _appendMissingRawHeaders_(sheet, audit.missingCanonical);
    var auditAfterAppend = _buildRawHeaderAuditForDx_(dx);
    var reorderResult = { changed: false };

    if (reorderAfterAppend && auditAfterAppend.willChangeOrder) {
      reorderResult = _reorderRawSheetColumns_(sheet, auditAfterAppend.proposedHeaderOrder);
      auditAfterAppend = _buildRawHeaderAuditForDx_(dx);
    }

    results.push({
      dx: dx,
      sheetName: audit.sheetName,
      status: 'success',
      backupSheetName: backupSheetName,
      appendedHeaders: appendResult.appendedHeaders || [],
      appendedCount: (appendResult.appendedHeaders || []).length,
      reordered: !!reorderResult.changed,
      remainingMissingCanonical: auditAfterAppend.missingCanonical,
      finalHeaders: auditAfterAppend.headers,
      legacyOrUnknownHeaders: auditAfterAppend.legacyOrUnknownHeaders
    });
  });

  return {
    status: 'success',
    appendedAt: new Date().toISOString(),
    reorderAfterAppend: reorderAfterAppend,
    results: results
  };
}

function _getRawAliasBackfillPairs_(dx) {
  dx = String(dx || '').trim().toUpperCase();
  var pairs = [
    { targetHeader: 'DX', sourceHeaders: ['dx'] },
    { targetHeader: 'Nama orang tua/wali', sourceHeaders: ['Nama Orang Tua/Wali'] },
    { targetHeader: 'No. kontak orang tua/wali', sourceHeaders: ['No Telp/WA Orang Tua/Wali'] },
    { targetHeader: 'Nama Petugas', sourceHeaders: ['Petugas'] },
    { targetHeader: 'Tanggal mulai demam', sourceHeaders: ['Tanggal Mulai Demam'] },
    { targetHeader: 'Tanggal mulai ruam', sourceHeaders: ['Tanggal Mulai Ruam'] },
    { targetHeader: 'Mata merah', sourceHeaders: ['Mata Merah'] },
    { targetHeader: 'Keluhan Utama', sourceHeaders: ['Keluhan utama'] },
    { targetHeader: 'Status Gizi', sourceHeaders: ['Status gizi'] },
    { targetHeader: 'Tanggal Masuk Rawat Inap', sourceHeaders: ['Tanggal masuk rawat inap'] },
    { targetHeader: 'Tanggal Keluar', sourceHeaders: ['Tanggal keluar'] },
    { targetHeader: 'Nomor Rekam Medik', sourceHeaders: ['Nomor rekam medik'] },
    { targetHeader: 'Pekerjaan ibu', sourceHeaders: ['Pekerjaan Ibu'] },
    { targetHeader: 'Pendidikan ibu', sourceHeaders: ['Pendidikan Ibu'] },
    { targetHeader: 'Tempat pemeriksaan ibu hamil', sourceHeaders: ['Tempat pemeriksaan Ibu Hamil'] },
    { targetHeader: 'Tempat persalinan lainnya', sourceHeaders: ['Tempat persalinan - Lainnya'] },
    { targetHeader: 'Umur kehamilan', sourceHeaders: ['Umur Kehamilan'] },
    { targetHeader: 'Gejala lain', sourceHeaders: ['Gejala Lain'] },
    { targetHeader: 'Sebutkan gejala lain', sourceHeaders: ['Sebutkan Gejala Lain'] },
    { targetHeader: 'Diare', sourceHeaders: ['Komp_Diare'] },
    { targetHeader: 'Komp_Bronchopneumonia', sourceHeaders: ['Bronchopneumonia'] },
    { targetHeader: 'Komp_Kebutaan', sourceHeaders: ['Kebutaan'] },
    { targetHeader: 'Komp_Otitis Media', sourceHeaders: ['Otitis media'] },
    { targetHeader: 'Komp_Pneumonia', sourceHeaders: ['Pneumonia'] },
    { targetHeader: 'Komp_Encephalitis', sourceHeaders: ['Encephalitis'] },
    { targetHeader: 'Komp_Malnutrisi', sourceHeaders: ['Malnutrisi'] },
    { targetHeader: 'Komp_Ulkus Mukosa Mulut', sourceHeaders: ['Ulkus mukosa mulut'] },
    { targetHeader: 'Komp_Lainnya', sourceHeaders: ['Lainnya komplikasi'] },
    { targetHeader: 'Komp_Lainnya_Sebutkan', sourceHeaders: ['Sebutkan komplikasi lain'] },
    { targetHeader: 'Rawat inap?', sourceHeaders: ['Apakah dirawat inap?'] },
    { targetHeader: 'Ada kasus sekitar?', sourceHeaders: ['Ada kasus serupa di lingkungan'] },
    { targetHeader: 'Pemberian vitamin A?', sourceHeaders: ['Pemberian Vitamin A'] },
    { targetHeader: 'Berpergian 1 bulan terakhir?', sourceHeaders: ['Riwayat perjalanan 7-21 hari'] },
    { targetHeader: 'Tujuan perjalanan', sourceHeaders: ['Lokasi perjalanan'] },
    { targetHeader: 'Tanggal Pulang', sourceHeaders: ['Tanggal pulang', 'Tanggal pulang perjalanan', 'Tanggal kembali'] },
    { targetHeader: 'Apakah spesimen darah diambil', sourceHeaders: ['Spesimen diambil?'] },
    { targetHeader: 'Jenis Sampel Darah', sourceHeaders: ['Jenis spesimen'] },
    { targetHeader: 'Tanggal ambil spesimen darah', sourceHeaders: ['Tanggal ambil spesimen'] },
    { targetHeader: 'Tanggal pengiriman spesimen darah ke lab', sourceHeaders: ['Tanggal kirim spesimen'] },
    { targetHeader: 'Jenis Sampel Lain', sourceHeaders: ['Jenis spesimen lainnya'] },
    { targetHeader: 'Keadaan saat ini', sourceHeaders: ['Status akhir kasus'] },
    { targetHeader: 'KontakEratJSON', sourceHeaders: ['Kontak Erat'] }
  ];
  if (dx === 'MR') {
    pairs.push(
      { targetHeader: 'Provinsi', sourceHeaders: ['Provinsi Pasien'] },
      { targetHeader: 'Kab/Kota', sourceHeaders: ['Kab/Kota Pasien'] },
      { targetHeader: 'Provinsi unit pelapor', sourceHeaders: ['Provinsi'] },
      { targetHeader: 'Kab/Kota unit pelapor', sourceHeaders: ['Kab/Kota'] }
    );
  }
  return pairs;
}

function _getFirstFilledSourceValue_(row, headers, sourceHeaders) {
  for (var i = 0; i < sourceHeaders.length; i++) {
    var idx = headers.indexOf(sourceHeaders[i]);
    if (idx === -1) continue;
    var value = row[idx];
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return { header: sourceHeaders[i], columnIndex: idx + 1, value: value };
    }
  }
  return null;
}

function _buildRawAliasBackfillAuditForDx_(dx) {
  var sheetName = _getRawSheetNameFromDx_(dx);
  var sheet = getSheetOrThrow_(sheetName);
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  var headers = _getRawHeaders_(sheet);
  var rows = lastRow > 1 && lastCol > 0 ? sheet.getRange(2, 1, lastRow - 1, lastCol).getValues() : [];
  var pairs = _getRawAliasBackfillPairs_(dx);
  var candidates = [];

  pairs.forEach(function(pair) {
    var targetIdx = headers.indexOf(pair.targetHeader);
    if (targetIdx === -1) return;
    var sourceHeaders = (pair.sourceHeaders || []).filter(function(sourceHeader) {
      return sourceHeader !== pair.targetHeader && headers.indexOf(sourceHeader) !== -1;
    });
    if (!sourceHeaders.length) return;

    var fillableRows = [];
    var differentRows = [];
    rows.forEach(function(row, rowOffset) {
      var source = _getFirstFilledSourceValue_(row, headers, sourceHeaders);
      if (!source) return;
      var targetValue = row[targetIdx];
      var hasTarget = targetValue !== undefined && targetValue !== null && String(targetValue).trim() !== '';
      if (!hasTarget) {
        fillableRows.push({
          rowNumber: rowOffset + 2,
          sourceHeader: source.header,
          sourceColumnIndex: source.columnIndex,
          targetColumnIndex: targetIdx + 1
        });
      } else if (String(source.value).trim() !== String(targetValue).trim()) {
        differentRows.push({
          rowNumber: rowOffset + 2,
          sourceHeader: source.header,
          sourceColumnIndex: source.columnIndex,
          targetColumnIndex: targetIdx + 1
        });
      }
    });

    if (fillableRows.length || differentRows.length) {
      candidates.push({
        targetHeader: pair.targetHeader,
        sourceHeaders: sourceHeaders,
        targetColumnIndex: targetIdx + 1,
        fillableCount: fillableRows.length,
        differentCount: differentRows.length,
        fillableRows: fillableRows,
        differentRows: differentRows
      });
    }
  });

  return {
    dx: dx,
    sheetName: sheetName,
    rowCount: lastRow,
    columnCount: lastCol,
    candidates: candidates,
    candidateCount: candidates.length,
    fillableCellCount: candidates.reduce(function(sum, item) { return sum + item.fillableCount; }, 0),
    differentCellCount: candidates.reduce(function(sum, item) { return sum + item.differentCount; }, 0)
  };
}

function _buildPertRawBlankHeaderRepairPlan_() {
  var dx = 'PERT';
  var sheetName = 'PERT_Raw';
  var sheet = getSheetOrThrow_(sheetName);
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  var headers = _getRawHeaders_(sheet);
  var blankColumnIndexes = [];
  headers.forEach(function(header, idx) {
    if (!String(header || '').trim()) blankColumnIndexes.push(idx + 1);
  });

  var targetHeader = 'No Telp/WA Orang Tua/Wali';
  var targetIdx = headers.indexOf(targetHeader);
  var blankIdx = blankColumnIndexes.length === 1 ? blankColumnIndexes[0] - 1 : -1;
  var rows = lastRow > 1 && lastCol > 0 ? sheet.getRange(2, 1, lastRow - 1, lastCol).getValues() : [];
  var nonEmptyBlankCells = [];
  var movableCells = [];
  var blockedCells = [];

  if (blankIdx !== -1) {
    rows.forEach(function(row, rowOffset) {
      var value = row[blankIdx];
      if (value === undefined || value === null || String(value).trim() === '') return;
      var rowNumber = rowOffset + 2;
      var targetValue = targetIdx !== -1 ? row[targetIdx] : '';
      var targetEmpty = targetValue === undefined || targetValue === null || String(targetValue).trim() === '';
      nonEmptyBlankCells.push({
        rowNumber: rowNumber,
        blankColumnIndex: blankIdx + 1,
        targetHeader: targetHeader,
        targetColumnIndex: targetIdx + 1,
        targetEmpty: targetEmpty
      });
      if (targetIdx !== -1 && targetEmpty) {
        movableCells.push({
          rowNumber: rowNumber,
          fromColumnIndex: blankIdx + 1,
          toHeader: targetHeader,
          toColumnIndex: targetIdx + 1
        });
      } else {
        blockedCells.push({
          rowNumber: rowNumber,
          reason: targetIdx === -1 ? 'Target header tidak ditemukan.' : 'Target canonical sudah berisi nilai.'
        });
      }
    });
  }

  return {
    dx: dx,
    sheetName: sheetName,
    rowCount: lastRow,
    columnCount: lastCol,
    blankColumnIndexes: blankColumnIndexes,
    expectedSingleBlankColumn: blankColumnIndexes.length === 1 ? blankColumnIndexes[0] : null,
    targetHeader: targetHeader,
    targetColumnIndex: targetIdx + 1,
    nonEmptyBlankCellCount: nonEmptyBlankCells.length,
    nonEmptyBlankCells: nonEmptyBlankCells,
    movableCellCount: movableCells.length,
    movableCells: movableCells,
    blockedCellCount: blockedCells.length,
    blockedCells: blockedCells,
    canRepair: blankColumnIndexes.length === 1 && targetIdx !== -1 && nonEmptyBlankCells.length === movableCells.length
  };
}

function previewPertRawBlankHeaderRepair(token) {
  _requireAdminFromToken_(token);
  return {
    status: 'success',
    inspectedAt: new Date().toISOString(),
    plan: _buildPertRawBlankHeaderRepairPlan_()
  };
}

function repairPertRawBlankHeader(token, options) {
  _requireAdminFromToken_(token);
  var opts = options || {};
  var doBackup = opts.backup !== false;
  var deleteBlankColumn = opts.deleteBlankColumn !== false;
  var plan = _buildPertRawBlankHeaderRepairPlan_();
  if (!plan.canRepair) {
    return {
      status: 'error',
      message: 'Rencana repair tidak aman. Tidak ada perubahan dilakukan.',
      plan: plan
    };
  }
  if (!plan.movableCellCount) {
    return {
      status: 'noop',
      message: 'Tidak ada nilai pada blank header PERT_Raw yang perlu dipindahkan.',
      plan: plan
    };
  }

  var sheet = getSheetOrThrow_(plan.sheetName);
  var backupSheetName = doBackup ? _copyRawSheetBackup_(sheet, 'PRE_PERT_BLANK_REPAIR') : '';
  var values = sheet.getRange(1, 1, sheet.getLastRow(), sheet.getLastColumn()).getValues();
  plan.movableCells.forEach(function(cell) {
    values[cell.rowNumber - 1][cell.toColumnIndex - 1] = values[cell.rowNumber - 1][cell.fromColumnIndex - 1];
    values[cell.rowNumber - 1][cell.fromColumnIndex - 1] = '';
  });
  sheet.getRange(1, 1, values.length, values[0].length).setValues(values);

  var deletedColumnIndex = null;
  if (deleteBlankColumn) {
    var blankCol = plan.expectedSingleBlankColumn;
    var afterMoveValues = sheet.getRange(2, blankCol, Math.max(sheet.getLastRow() - 1, 1), 1).getValues();
    var hasRemainingData = afterMoveValues.some(function(row) { return String(row[0] || '').trim() !== ''; });
    if (!hasRemainingData) {
      sheet.deleteColumn(blankCol);
      deletedColumnIndex = blankCol;
    }
  }

  return {
    status: 'success',
    repairedAt: new Date().toISOString(),
    backupSheetName: backupSheetName,
    movedCellCount: plan.movableCellCount,
    movedCells: plan.movableCells,
    deletedBlankColumnIndex: deletedColumnIndex,
    beforePlan: plan,
    afterPlan: _buildPertRawBlankHeaderRepairPlan_()
  };
}

function previewRawSheetAliasBackfill(token, dxList) {
  _requireAdminFromToken_(token);
  var dxs = _normalizeDxList_(dxList);
  return {
    status: 'success',
    inspectedAt: new Date().toISOString(),
    results: dxs.map(function(dx) { return _buildRawAliasBackfillAuditForDx_(dx); })
  };
}

function backfillRawSheetAliases(token, dxList, options) {
  _requireAdminFromToken_(token);
  var opts = options || {};
  var doBackup = opts.backup !== false;
  var applyDifferentValues = opts.applyDifferentValues === true;
  var dxs = _normalizeDxList_(dxList);
  var results = [];

  dxs.forEach(function(dx) {
    var audit = _buildRawAliasBackfillAuditForDx_(dx);
    if (!audit.fillableCellCount && (!applyDifferentValues || !audit.differentCellCount)) {
      results.push({
        dx: dx,
        sheetName: audit.sheetName,
        status: 'noop',
        message: 'Tidak ada nilai alias yang perlu dibackfill ke target canonical.',
        audit: audit
      });
      return;
    }

    var sheet = getSheetOrThrow_(audit.sheetName);
    var headers = _getRawHeaders_(sheet);
    var lastRow = sheet.getLastRow();
    var lastCol = sheet.getLastColumn();
    var values = lastRow > 1 && lastCol > 0 ? sheet.getRange(2, 1, lastRow - 1, lastCol).getValues() : [];
    var backupSheetName = doBackup ? _copyRawSheetBackup_(sheet, 'PRE_ALIAS_BACKFILL') : '';
    var changedCells = [];

    audit.candidates.forEach(function(candidate) {
      var targetIdx = candidate.targetColumnIndex - 1;
      var rowRefs = candidate.fillableRows.slice();
      if (applyDifferentValues) rowRefs = rowRefs.concat(candidate.differentRows || []);
      rowRefs.forEach(function(ref) {
        var rowIdx = ref.rowNumber - 2;
        var row = values[rowIdx];
        var source = _getFirstFilledSourceValue_(row, headers, candidate.sourceHeaders);
        if (!source) return;
        var currentTarget = row[targetIdx];
        var hasTarget = currentTarget !== undefined && currentTarget !== null && String(currentTarget).trim() !== '';
        if (hasTarget && !applyDifferentValues) return;
        row[targetIdx] = source.value;
        changedCells.push({
          rowNumber: ref.rowNumber,
          targetHeader: candidate.targetHeader,
          targetColumnIndex: candidate.targetColumnIndex,
          sourceHeader: source.header,
          sourceColumnIndex: source.columnIndex,
          overwritten: hasTarget
        });
      });
    });

    if (changedCells.length) {
      sheet.getRange(2, 1, values.length, lastCol).setValues(values);
    }

    results.push({
      dx: dx,
      sheetName: audit.sheetName,
      status: changedCells.length ? 'success' : 'noop',
      backupSheetName: backupSheetName,
      applyDifferentValues: applyDifferentValues,
      changedCellCount: changedCells.length,
      changedCells: changedCells
    });
  });

  return {
    status: 'success',
    backfilledAt: new Date().toISOString(),
    results: results
  };
}


const WORKFLOW_MARKER_BACKFILL_HEADERS_ = [
  "Workflow Current Queue",
  "Workflow Current Label",
  "Status Proses Verifikasi EPID",
  "Status Proses Pemeriksaan",
  "Status Proses Pemantauan",
  "Status Proses Perbaikan",
  "Workflow Selesai"
];

function _buildWorkflowMarkerBackfillAuditForDx_(dx, options) {
  var opts = options || {};
  var overwrite = opts.overwrite === true;
  var sheetName = _getRawSheetNameFromDx_(dx);
  var sheet = getSheetOrThrow_(sheetName);
  var headers = _getRawHeaders_(sheet);
  var missingHeaders = WORKFLOW_MARKER_BACKFILL_HEADERS_.filter(function(h) { return headers.indexOf(h) === -1; });
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  var queueCounts = {};
  var rowsNeedingBackfill = [];
  var changedCellCount = 0;
  var inspectedRows = Math.max(0, lastRow - 1);

  if (lastRow < 2 || lastCol < 1) {
    return {
      dx: dx,
      sheetName: sheetName,
      rowCount: lastRow,
      inspectedRows: inspectedRows,
      missingMarkerHeaders: missingHeaders,
      missingMarkerHeaderCount: missingHeaders.length,
      rowsNeedingBackfill: 0,
      changedCellCount: 0,
      queueCounts: queueCounts,
      sampleRows: []
    };
  }

  var values = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  values.forEach(function(row, idx) {
    var record = (typeof deserializeRecord_ === 'function')
      ? deserializeRecord_(row, headers)
      : (function() {
          var obj = {};
          headers.forEach(function(h, j) { obj[h] = row[j]; });
          return obj;
        })();
    var marked = _applyWorkflowProcessMarkers_(Object.assign({}, record));
    var queue = String(marked['Workflow Current Queue'] || '').trim() || 'unknown';
    queueCounts[queue] = (queueCounts[queue] || 0) + 1;

    var rowChangedCells = 0;
    WORKFLOW_MARKER_BACKFILL_HEADERS_.forEach(function(header) {
      var colIdx = headers.indexOf(header);
      var before = colIdx !== -1 ? String(row[colIdx] || '').trim() : '';
      var after = String(marked[header] || '').trim();
      if (colIdx === -1 || (!before && after) || (overwrite && before !== after)) {
        rowChangedCells += 1;
      }
    });
    if (rowChangedCells > 0) {
      changedCellCount += rowChangedCells;
      rowsNeedingBackfill.push({ rowNumber: idx + 2, workflowCurrentQueue: queue, changedCellCount: rowChangedCells });
    }
  });

  return {
    dx: dx,
    sheetName: sheetName,
    rowCount: lastRow,
    inspectedRows: inspectedRows,
    missingMarkerHeaders: missingHeaders,
    missingMarkerHeaderCount: missingHeaders.length,
    rowsNeedingBackfill: rowsNeedingBackfill.length,
    changedCellCount: changedCellCount,
    queueCounts: queueCounts,
    sampleRows: rowsNeedingBackfill.slice(0, 10)
  };
}

function previewWorkflowMarkerBackfill(token, dxList, options) {
  _requireAdminFromToken_(token);
  var dxs = _normalizeDxList_(dxList);
  return {
    status: 'success',
    previewedAt: new Date().toISOString(),
    overwrite: !!(options && options.overwrite === true),
    results: dxs.map(function(dx) { return _buildWorkflowMarkerBackfillAuditForDx_(dx, options || {}); })
  };
}

function backfillWorkflowMarkers(token, dxList, options) {
  _requireAdminFromToken_(token);
  var opts = options || {};
  var overwrite = opts.overwrite === true;
  var doBackup = opts.backup !== false;
  var dxs = _normalizeDxList_(dxList);
  var results = [];

  dxs.forEach(function(dx) {
    var audit = _buildWorkflowMarkerBackfillAuditForDx_(dx, opts);
    if (!audit.rowsNeedingBackfill && !audit.missingMarkerHeaderCount) {
      results.push(Object.assign({}, audit, {
        status: 'noop',
        message: 'Marker workflow sudah lengkap dan sesuai.',
        backupSheetName: ''
      }));
      return;
    }

    var sheet = getSheetOrThrow_(audit.sheetName);
    var backupSheetName = doBackup ? _copyRawSheetBackup_(sheet, 'PRE_WORKFLOW_MARKER_BACKFILL') : '';
    var headers = _ensureSheetHeaders_(sheet, WORKFLOW_MARKER_BACKFILL_HEADERS_);
    var lastRow = sheet.getLastRow();
    var lastCol = sheet.getLastColumn();
    var values = lastRow > 1 ? sheet.getRange(2, 1, lastRow - 1, lastCol).getValues() : [];
    var changedRows = [];
    var changedCellCount = 0;

    values.forEach(function(row, idx) {
      var record = (typeof deserializeRecord_ === 'function')
        ? deserializeRecord_(row, headers)
        : (function() {
            var obj = {};
            headers.forEach(function(h, j) { obj[h] = row[j]; });
            return obj;
          })();
      var marked = _applyWorkflowProcessMarkers_(Object.assign({}, record));
      var rowChangedCells = 0;
      WORKFLOW_MARKER_BACKFILL_HEADERS_.forEach(function(header) {
        var colIdx = headers.indexOf(header);
        if (colIdx === -1) return;
        var before = String(row[colIdx] || '').trim();
        var after = String(marked[header] || '').trim();
        if ((!before && after) || (overwrite && before !== after)) {
          row[colIdx] = marked[header] || '';
          rowChangedCells += 1;
        }
      });
      if (rowChangedCells > 0) {
        changedCellCount += rowChangedCells;
        changedRows.push({
          rowNumber: idx + 2,
          workflowCurrentQueue: String(marked['Workflow Current Queue'] || '').trim(),
          changedCellCount: rowChangedCells
        });
      }
    });

    if (values.length && changedRows.length) {
      sheet.getRange(2, 1, values.length, lastCol).setValues(values);
      try { Cache_Manager.invalidateSheetCache(dx + '_Raw'); } catch (e) {}
    }

    results.push({
      dx: dx,
      sheetName: audit.sheetName,
      status: 'success',
      backupSheetName: backupSheetName,
      overwrite: overwrite,
      appendedMarkerHeaders: audit.missingMarkerHeaders,
      changedRows: changedRows.length,
      changedCellCount: changedCellCount,
      sampleRows: changedRows.slice(0, 10)
    });
  });

  return {
    status: 'success',
    backfilledAt: new Date().toISOString(),
    overwrite: overwrite,
    results: results
  };
}

function migrateRefUserRoleToPengampuPelaporModel(options) {
  options = options || {};
  var dryRun = options.dryRun !== false;
  var userSheet = getSheetOrThrow_('REF_USER');
  var values = userSheet.getDataRange().getValues();
  if (!values || values.length < 2) {
    return { status: 'success', dryRun: dryRun, updated: 0, reviewed: 0, message: 'REF_USER kosong.' };
  }

  var headers = values[0].map(function(h) { return String(h || '').trim(); });
  var idxRole = headers.indexOf('Role');
  var idxScope = headers.indexOf('ScopeLevel');
  var idxUnit = headers.indexOf('UnitKerja');
  var idxKode = headers.indexOf('KodePuskesmas');
  var idxUsername = headers.indexOf('Username');
  if (idxRole === -1) throw new Error('Kolom Role tidak ditemukan di REF_USER.');

  var updates = [];
  for (var r = 1; r < values.length; r++) {
    var row = values[r];
    var currentRole = String(row[idxRole] || '').trim().toLowerCase();
    var scopeLevel = idxScope !== -1 ? String(row[idxScope] || '').trim().toLowerCase() : '';
    var unit = idxUnit !== -1 ? String(row[idxUnit] || '').trim() : '';
    var kode = idxKode !== -1 ? String(row[idxKode] || '').trim() : '';
    var username = idxUsername !== -1 ? String(row[idxUsername] || '').trim() : '';

    var nextRole = currentRole;
    if (["admin", "viewer", "readonly", "read_only", "read-only"].indexOf(currentRole) !== -1) {
      nextRole = currentRole;
    } else if (scopeLevel === 'puskesmas' && (unit || kode)) {
      nextRole = 'puskesmas';
    } else if (["inputer", "entry", "registrasi", "operator_input", "operator-input", "pelapor", "faskes_pelapor", "faskes-pelapor"].indexOf(currentRole) !== -1) {
      nextRole = 'faskes_pelapor';
    }

    if (nextRole !== currentRole) {
      updates.push({
        rowNumber: r + 1,
        username: username,
        from: currentRole,
        to: nextRole
      });
      if (!dryRun) {
        row[idxRole] = nextRole;
      }
    }
  }

  if (!dryRun && updates.length) {
    userSheet.getRange(2, 1, values.length - 1, headers.length).setValues(values.slice(1));
  }

  return {
    status: 'success',
    dryRun: dryRun,
    reviewed: Math.max(0, values.length - 1),
    updated: updates.length,
    updates: updates.slice(0, 200)
  };
}
