# Arsitektur Proyek GAS PD3I

## Ringkasan
Aplikasi ini adalah **Google Apps Script Web App** untuk surveilans PD3I dengan pola:
- **Frontend**: HTML + JS client (`index.html`, `app.*.js.html`, `style.html`)
- **Backend**: fungsi GAS modular (`routes.js`, `data.js`, `auth.js`, dst)
- **Storage**: Google Spreadsheet (sheet raw + referensi)
- **Integrasi**: Email (MailApp), Telegram Bot (UrlFetch), sinkronisasi sheet pengampu

## Entry Point
- `doGet(e)` di `routes.js`
  - `?action=print` → render halaman cetak (`handlePrintRequest_`)
  - default → render `index.html`
- `doPost(e)` di `routes.js`
  - menerima JSON payload, lock script, simpan via `saveFormPayload_`

## Modul Backend Utama
- `routes.js`
  - Orkestrasi request web app
  - Save payload + trigger notifikasi/sinkronisasi
  - Retry single & batch untuk email/telegram/sinkronisasi
- `data.js`
  - Layer data: save/update record, search, duplicate check
  - EPID index in-memory untuk lookup cepat
  - Header aliasing & serialisasi/deserialisasi data
- `auth.js`
  - Login/check/logout/change pin
  - Sumber user: sheet `REF_USER`
- `utils.js`
  - Session manager + TTL role
  - Helper sheet/response/include
  - Generator EPID
- `dashboard.js`
  - Agregasi statistik dashboard
  - Export CSV dengan filter tanggal
- `print.js`
  - URL print PDF berbasis web app
  - Render template print (`print_MR.html`)
- `config.js`
  - `Config_Manager` via `PropertiesService`
  - Menyimpan key sensitif (token/chat id/ttl)
- `cache.js`
  - `Cache_Manager` dengan chunking data >90KB
- `audit.js`
  - Log INSERT/UPDATE/LOGOUT ke sheet `AUDIT_LOG`

## Alur Data Simpan Kasus
1. Frontend submit payload ke `doPost`.
2. Backend validasi session token + role write.
3. `saveDxRecord_` menyimpan ke `{DX}_Raw`.
4. Sistem generate/validasi EPID + update link print.
5. Untuk `MR`, backend juga:
   - routing pengampu (`REF_PENGAMPU`)
   - kirim email pengampu
   - sinkronisasi ke spreadsheet pengampu
   - kirim notifikasi Telegram
6. Status hasil aksi ditulis kembali ke row MR.
7. Audit log dicatat ke `AUDIT_LOG`.

## Model Sheet yang Dipakai
- Data utama: `MR_Raw`, `DIF_Raw`, `PERT_Raw`, `TN_Raw`, `AFP_Raw`
- Referensi: `REF_USER`, `REF_FASKES`, `REF_PENGAMPU`, `REF_IMUN`
- Audit: `AUDIT_LOG`

## Session & Akses
- Token sesi disimpan di `CacheService` (key `TOKEN_*`)
- TTL role configurable:
  - admin: default 1800 detik
  - petugas: default 3600 detik
  - viewer: default 7200 detik
- Role `viewer` dibatasi untuk aksi baca (termasuk blok export tertentu)

## Catatan Keamanan
- `appsscript.json` saat ini `webapp.access = ANYONE_ANONYMOUS`, tetapi operasi sensitif tetap dikendalikan token sesi internal.
- Disarankan review ulang exposure web app dan rotasi token konfigurasi secara berkala.
