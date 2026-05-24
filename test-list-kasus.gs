function testListKasus() {
  // Get all DX sheets
  const ALL_DX = ["MR", "DIF", "PERT", "TN", "AFP"];
  const results = {};
  
  ALL_DX.forEach(function(dx) {
    const sheet = SpreadsheetApp.getActive().getSheetByName(dx + '_Raw');
    if (!sheet) {
      results[dx] = { found: false, rowCount: 0 };
      return;
    }
    
    const data = sheet.getDataRange().getValues();
    const rowCount = data.length - 1; // exclude header
    
    results[dx] = {
      found: true,
      headers: data[0],
      rowCount: rowCount,
      sample: rowCount > 0 ? data[1] : null
    };
  });
  
  Logger.log(JSON.stringify(results, null, 2));
}

function testSearchRecords() {
  try {
    // Simulate a search with no filters
    const token = 'test-token'; // This would fail in real scenario
    const dx = '';
    const filters = {
      workspace: 'search',
      page: 1,
      pageSize: 10
    };
    
    const result = searchRecords(dx, filters, token);
    Logger.log('Search result: ' + JSON.stringify(result, null, 2));
  } catch (err) {
    Logger.log('Error: ' + err.message);
  }
}

testListKasus();
