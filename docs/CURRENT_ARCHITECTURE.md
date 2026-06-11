# Current Architecture — GAS PE PD3I

Tanggal audit: 2026-06-11  
Scope: review kode Google Apps Script tanpa menulis fitur baru.

## 1. Ringkasan Sistem

Aplikasi ini adalah Google Apps Script Web App untuk pencatatan dan workflow surveilans PD3I. Sistem melayani input kasus awal, verifikasi EPID, hasil sampel, update status kasus, dashboard, pencarian/list kasus, print/PDF, audit log, notifikasi, dan sinkronisasi ke spreadsheet pengampu.

Karakter penting deployment:

- Runtime: Google Apps Script V8.
- Web app menjalankan kode sebagai `USER_DEPLOYING`.
- Akses web app: `ANYONE_ANONYMOUS`.
- Proteksi aplikasi dilakukan di layer aplikasi melalui login PIN, token sesi `CacheService`, role, dan scope data.
- Data utama berada di Google Spreadsheet.

## 2. Komponen Utama

### Frontend

Frontend dikirim sebagai HTML template Apps Script:

- `index.html` sebagai shell utama.
- `login.html` untuk login dan ganti password.
- `app.js.html` sebagai client controller terbesar: workspace, form, search, workflow, admin action, draft local state, dan render UI.
- `app.dashboard.js.html` untuk dashboard visual.
- `style.html` untuk styling.
- `workspace_*.html`, `config_*.html`, dan `print_*.html` sebagai partial/template domain.

Frontend berkomunikasi dengan backend terutama via `google.script.run` dan sebagian melalui `doPost` JSON untuk action dedicated workflow.

### Backend Apps Script

Modul backend yang paling penting:

- `routes.js`
  - `doGet(e)` render app/dashboard/print.
  - `doPost(e)` menerima JSON, mengambil global script lock, routing action, atau menyimpan payload.
  - Dedicated workflow action: create initial case, search/edit, verification, sample, status, delete, retry notification/sync.
  - Integrasi email, Telegram, print URL, sync pengampu, batch retry.
- `auth.js`
  - Login username/PIN dari `REF_USER`.
  - Session token di `CacheService`.
  - Role/scope user.
  - Change PIN dengan hash `sha256:`.
- `data.js`
  - Serializer/deserializer record.
  - Sanitasi nilai spreadsheet termasuk formula injection prefix.
  - Save/upsert record ke `{DX}_Raw`.
  - EPID lookup/index in-memory per execution.
- `dashboard.js`
  - Agregasi dashboard dari raw sheets.
  - Cache-first sheet read.
  - Export/report utilities.
- `cache.js`
  - Wrapper `CacheService` dengan chunking sekitar 90KB.
  - TTL default 60 detik via config.
- `config.js`
  - Runtime config sensitif via `PropertiesService`.
- `audit.js`
  - Audit log perubahan/auth ke sheet.
- `pipeline.queue.js`
  - Queue spreadsheet sederhana untuk post-save pipeline.
- `utils.js`
  - Spreadsheet access helpers, headers, include, PDF URL helpers.

## 3. Data Model dan Storage

### Spreadsheet utama

Sistem menggunakan satu spreadsheet utama yang ID-nya dibaca dari config `SPREADSHEET_ID`. Data kasus dipisah per diagnosis:

- `MR_Raw`
- `DIF_Raw`
- `PERT_Raw`
- `TN_Raw`
- `AFP_Raw`

Reference/operational sheets:

- `REF_USER` — akun, PIN, role, unit kerja, scope.
- `REF_FASKES` — referensi fasilitas/unit pelapor.
- `REF_PENGAMPU` — mapping wilayah/puskesmas pengampu, email, Telegram, spreadsheet tujuan.
- `REF_IMUN` — referensi imunisasi.
- `AUDIT_LOG` — audit perubahan dan auth event.
- `PIPELINE_QUEUE` — queue post-save pipeline.

### Pola penulisan

- Record diserialisasi berdasarkan header sheet aktif.
- Update record menulis satu baris penuh dengan `setValues([rowData])`.
- Insert baru menggunakan `appendRow(rowData)`.
- Header dapat ditambah otomatis untuk beberapa kolom operasional.
- Cache `{DX}_Raw` diinvalidasi setelah write.

## 4. Alur Request

### Load aplikasi

1. `doGet(e)` membaca `action`, `view`, dan `workspace`.
2. Jika `action=print`, request masuk ke handler print.
3. Jika bukan print, server membuat template `index`.
4. `XFrameOptionsMode.ALLOWALL` mengizinkan embed iframe.
5. Frontend load dan user login melalui `authLogin`.

### Login/session

1. User mengirim username + PIN.
2. `authLogin` baca seluruh `REF_USER`.
3. PIN diverifikasi:
   - Mendukung hash `sha256:`.
   - Masih mendukung plaintext fallback.
4. Jika sukses, token UUID disimpan di `CacheService` dengan TTL sesuai role.
5. `authCheck` memperpanjang session sliding TTL.

### Save workflow

1. `doPost` parse JSON dan mengambil `LockService.getScriptLock()` sampai 30 detik.
2. Dedicated action diarahkan oleh `_routeDedicatedWorkflowAction_`; payload biasa masuk `saveFormPayload_`.
3. Backend validasi token dan hak tulis per stage.
4. Payload disanitasi dan disimpan ke `{DX}_Raw`.
5. Setelah save, sistem dapat membuat/menyimpan print URL, audit log, notifikasi, sync pengampu, dan status operasional.

### Search/list/work queue

1. User meminta list/search/workflow queue.
2. Backend validasi session.
3. Sistem membaca satu atau beberapa `{DX}_Raw`.
4. Filtering dilakukan di memory: keyword, EPID, nama, tanggal lahir, wilayah, status, scope user, workflow state.
5. Result disortir dan dipaginasi setelah seluruh kandidat diproses.

### Dashboard

1. Dashboard membaca raw sheets dengan cache-first.
2. Agregasi dilakukan di Apps Script memory.
3. Cache sheet disimpan via `CacheService` dan chunking.

## 5. Multi-Tenant / Scope Model

Aplikasi bukan multi-tenant berbasis database terpisah. Modelnya adalah single spreadsheet dengan pembatasan akses aplikasi:

- Tenant/scope direpresentasikan oleh role, `ScopeLevel`, `UnitKerja`, `KodePuskesmas`, dan mapping `REF_PENGAMPU`.
- Role utama dari dokumen/kode: `admin`, `petugas`, `viewer`, plus role/workflow khusus yang dicek di helper akses.
- Fungsi read/write/delete memanggil helper scope seperti `_canSessionReadRecordByScope_`, `_canSessionWriteWorkflowStage_`, dan `_canSessionDeleteCaseRecord_`.
- Data tetap berada dalam sheet yang sama; isolasi hanya sekuat seluruh pengecekan aplikasi dan konsistensi kolom wilayah/pengampu.

## 6. Integrasi Eksternal

- Email via `MailApp.sendEmail` untuk notifikasi pengampu dan revisi.
- Telegram via `UrlFetchApp.fetch` ke Bot API.
- Spreadsheet pengampu via `SpreadsheetApp.openById` dan upsert ke `{DX}_Raw` tujuan.
- Print/PDF menggunakan URL web app dengan action print dan token.

## 7. Caching dan Locking

- Session token memakai `CacheService`.
- Sheet data cache memakai `Cache_Manager` dengan TTL default 60 detik dan chunking 90KB.
- Beberapa operasi read menggunakan cache; sebagian search/direct action masih membaca `getDataRange()` langsung.
- `doPost`, `saveFormData`, batch retry, dan pipeline queue memakai global `ScriptLock`.

## 8. Test dan Deployment Hygiene

- Ada test files di `src/*test.js` dan `tests/`.
- Tidak ada `package.json` di root, jadi test runner standar tidak jelas dari repo saat audit.
- `.claspignore` mengecualikan `docs`, `tests`, `scripts`, `.github`, dan `node_modules` dari push Apps Script.
- Ada `src/node_modules/` untracked. Walau `.claspignore` mengecualikannya, folder ini sebaiknya tidak tinggal di `src/` karena rawan ukuran repo, kebingungan review, dan salah deploy jika ignore berubah.

## 9. Risiko Arsitektur Utama

1. Web app anonymous + execute-as-deployer membuat seluruh keamanan bergantung pada token/session aplikasi.
2. Data multi-tenant berada di sheet yang sama, sehingga bug scope dapat membuka data lintas puskesmas/wilayah.
3. Search/dashboard masih dominan full-sheet scan dan akan menabrak quota/latency saat data tumbuh.
4. Global script lock pada `doPost` membatasi concurrency semua user/action.
5. Integrasi email/Telegram/sync berjalan di request path dan dapat memperpanjang response atau gagal karena quota.
6. Frontend monolitik `app.js.html` sangat besar, meningkatkan risiko regresi dan sulit dites.
