/**
 * diagnostic.js — Diagnostic functions for debugging issues
 */

function diagnosticCheckSheets() {
  const ALL_DX = ["MR", "DIF", "PERT", "TN", "AFP"];
  const results = {
    timestamp: new Date().toISOString(),
    sheets: {}
  };
  
  ALL_DX.forEach(function(dx) {
    const sheetName = dx + '_Raw';
    const sheet = getSheetOrNull_(sheetName);
    
    if (!sheet) {
      results.sheets[sheetName] = { found: false };
      return;
    }
    
    try {
      const data = sheet.getDataRange().getValues();
      const rowCount = data.length - 1;
      const colCount = data[0] ? data[0].length : 0;
      
      results.sheets[sheetName] = {
        found: true,
        rowCount: rowCount,
        colCount: colCount,
        headers: data[0] ? data[0].map(h => String(h || '').trim()).filter(Boolean) : []
      };
    } catch (err) {
      results.sheets[sheetName] = { found: true, error: err.message };
    }
  });
  
  return results;
}

function diagnosticTestSearchRecords(token) {
  try {
    const filters = {
      workspace: 'search',
      page: 1,
      pageSize: 100
    };
    
    const result = searchRecords('', filters, token);
    
    return {
      status: 'success',
      total: result.total,
      resultCount: (result.results || []).length,
      page: result.page,
      totalPages: result.totalPages,
      sample: (result.results && result.results.length > 0) ? result.results[0] : null
    };
  } catch (err) {
    return {
      status: 'error',
      error: err.message,
      stack: err.stack
    };
  }
}

function diagnosticCheckSession(token) {
  try {
    const sess = _getSessionFromToken_(token);
    return {
      ok: sess.ok,
      message: sess.message,
      user: sess.user ? {
        username: sess.user.username,
        role: sess.user.role,
        scopeLevel: sess.user.scopeLevel,
        kodePuskesmas: sess.user.kodePuskesmas,
        unitKerja: sess.user.unitKerja
      } : null
    };
  } catch (err) {
    return {
      ok: false,
      error: err.message
    };
  }
}

function diagnosticFullDebug(token) {
  return {
    sheets: diagnosticCheckSheets(),
    session: diagnosticCheckSession(token),
    searchTest: diagnosticTestSearchRecords(token)
  };
}
