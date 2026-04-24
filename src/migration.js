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
