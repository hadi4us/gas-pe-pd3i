# Fix: Menu List Kasus Kosong

## Masalah
Menu "List Kasus" menampilkan daftar kosong meskipun seharusnya ada data.

## Root Cause Analysis
Ditemukan beberapa potensi penyebab:

1. **Cache Fallback Issue** (FIXED)
   - Di `searchRecords()` function (routes.js line 724-736), jika `_readSheetWithCache_()` ada tetapi mengembalikan data kosong, fungsi akan return early tanpa melakukan fallback ke direct sheet access.
   - Ini menyebabkan data tidak dapat dimuat sama sekali.

2. **Scope Filtering** 
   - Function `_canSessionReadRecordByScope_()` memfilter records berdasarkan akses pengguna.
   - Non-admin users hanya bisa melihat records yang sesuai dengan wilayah kerja mereka (kecamatan/kelurahan).
   - Jika user tidak punya scope yang cocok, semua records akan difilter.

3. **Missing Sheet Data**
   - Sheets `MR_Raw`, `DIF_Raw`, `PERT_Raw`, `TN_Raw`, `AFP_Raw` mungkin kosong atau tidak ada data.

## Fixes Applied

### 1. Cache Fallback (routes.js)
```javascript
// Sebelum: Early return jika cache kosong
if (typeof _readSheetWithCache_ === 'function') {
  var sheetData = _readSheetWithCache_(dxItem + '_Raw');
  if (!sheetData || !sheetData.headers || !sheetData.rows || !sheetData.rows.length) return;
  headers = sheetData.headers;
  rows = sheetData.rows;
} else {
  // Direct sheet access
}

// Sesudah: Graceful fallback jika cache gagal
if (typeof _readSheetWithCache_ === 'function') {
  try {
    var sheetData = _readSheetWithCache_(dxItem + '_Raw');
    if (sheetData && sheetData.headers && sheetData.rows && sheetData.rows.length) {
      headers = sheetData.headers;
      rows = sheetData.rows;
    }
  } catch (cacheErr) {
    // Cache read failed, fall through to direct sheet access
  }
}

// If cache didn't work or wasn't available, try direct sheet access
if (!rows.length) {
  var sheet = getSheetOrNull_(dxItem + '_Raw');
  if (!sheet) return;
  // ... direct access
}
```

### 2. Diagnostic Tools (diagnostic.js - NEW)
Ditambahkan fungsi diagnostic untuk membantu debug:
- `diagnosticCheckSheets()` - Cek ketersediaan dan jumlah data di setiap sheet
- `diagnosticTestSearchRecords(token)` - Test fungsi searchRecords
- `diagnosticCheckSession(token)` - Cek status session dan user access
- `diagnosticFullDebug(token)` - Kombinasi semua diagnostic

## Cara Verify Fix

1. **Test dengan Google Apps Script Console:**
```javascript
const result = diagnosticFullDebug(SESSION_TOKEN);
Logger.log(JSON.stringify(result, null, 2));
```

2. **Cek kondisi sheets:**
```javascript
const sheets = diagnosticCheckSheets();
Logger.log(JSON.stringify(sheets, null, 2));
// Verifikasi: rowCount > 0 untuk minimal satu DX
```

3. **Test search records:**
```javascript
const search = diagnosticTestSearchRecords(SESSION_TOKEN);
Logger.log(JSON.stringify(search, null, 2));
// Verifikasi: status === 'success' dan total >= 0
```

## Troubleshooting

Jika List Kasus masih kosong:

1. **Verifikasi data ada di sheets**
   - Buka spreadsheet, cek apakah ada data di sheet `MR_Raw`, dll
   - Minimal harus ada header row + 1 data row

2. **Verifikasi user scope**
   - Login dengan akses admin
   - Admin bisa lihat semua data
   - Non-admin hanya bisa lihat data sesuai wilayah kerja (kecamatan/kelurahan)

3. **Verifikasi referensi pengampu**
   - Cek sheet `REF_PENGAMPU` ada mapping kecamatan/kelurahan
   - Jika tidak ada, scope filter akan blok semua records

4. **Check browser console**
   - Buka DevTools → Console
   - Cek apakah ada error JavaScript
   - Search untuk "error" atau "failed"

## Commits
- dffb289: fix: fallback to direct sheet access when cache returns empty in searchRecords
- 564f350: feat: add diagnostic functions for debugging list kasus issues

## Testing Checklist
- [ ] Verify sheets have data (MR_Raw, DIF_Raw, etc.)
- [ ] Test with admin account - should show all records
- [ ] Test with non-admin account - should show only accessible records
- [ ] Run diagnostic in Console - all status should be "success"
- [ ] Test search with filters - should return correct subset
- [ ] Test search without filters (List Kasus) - should return all accessible records
