# Security Review — GAS PE PD3I

Tanggal audit: 2026-06-11  
Scope: Google Apps Script security, auth/session, multi-tenant, data exposure, integration secrets. Tidak ada feature development.

## Executive Summary

Aplikasi memiliki beberapa kontrol keamanan yang baik: login, session token, role/scope checks, audit log, formula injection protection, config sensitif di `PropertiesService`, dan rate limit login berbasis cache. Risiko terbesar tetap berasal dari deployment web app `ANYONE_ANONYMOUS` + `executeAs USER_DEPLOYING`: semua orang bisa membuka endpoint, sementara backend berjalan dengan hak deployer. Karena itu semua endpoint harus diperlakukan sebagai public internet surface dan wajib melewati authz ketat.

## Security Posture Saat Ini

### Kontrol yang sudah ada

- Login username/PIN dari `REF_USER`.
- Token session UUID disimpan di `CacheService` dengan TTL role-based.
- Login attempt lock: 5 percobaan gagal mengunci sementara 5 menit.
- PIN baru disimpan hash `sha256:`.
- Role/scope user: role, unit kerja, kode puskesmas, scope level.
- Guard read/write/delete melalui helper scope.
- Sanitasi nilai spreadsheet:
  - kontrol karakter.
  - max length.
  - formula injection prefix `= + - @` diberi apostrophe.
- Secrets seperti Telegram token dan Spreadsheet ID dibaca dari `PropertiesService`.
- Audit log login, failed login, logout, insert/update/delete.

### Exposure penting

- `appsscript.json`:
  - `executeAs: USER_DEPLOYING`
  - `access: ANYONE_ANONYMOUS`
- `doGet` memakai `HtmlService.XFrameOptionsMode.ALLOWALL`.
- Print/action URL dapat dipanggil publik jika URL diketahui.
- Endpoint Apps Script callable dari frontend perlu dianggap callable oleh client yang dimodifikasi.

## Risiko P0 / Tinggi

### 1. Anonymous web app menjalankan hak deployer

**Temuan**  
Web app dapat diakses anonymous, tetapi operasi backend berjalan sebagai deployer. Ini lazim untuk Apps Script internal app, tetapi berisiko tinggi.

**Dampak**

- Jika satu endpoint lupa validasi token, attacker dapat membaca/menulis spreadsheet dengan hak deployer.
- Jika token bocor, attacker dapat memakai akses sampai TTL habis.
- Bug scope sama dengan data breach lintas tenant.

**Rekomendasi**

- Audit semua function yang bisa dipanggil frontend dan pastikan token/session check di awal.
- Buat authz facade tunggal dan larang direct data access tanpa session context.
- Untuk function admin/retry/repair, wajib `_requireAdminFromToken_`.
- Pertimbangkan deploy access lebih ketat jika user population memungkinkan.

### 2. Plaintext PIN masih diterima

**Temuan**  
`_verifyPinValue_` menerima `sha256:` dan fallback `storedPin === suppliedPin` untuk plaintext.

**Dampak**

- Jika `REF_USER` terbaca oleh orang dengan akses spreadsheet, akun plaintext langsung terbuka.
- Backward compatibility memperpanjang risiko password lama/lemah.

**Rekomendasi**

- Migrasi semua PIN plaintext ke `sha256:`.
- Setelah migration window, hapus fallback plaintext.
- Tambahkan admin report: jumlah PIN plaintext tersisa.
- Pertimbangkan salt/pepper. SHA-256 unsalted lebih baik dari plaintext, tapi masih lemah untuk PIN pendek.

### 3. Multi-tenant single-sheet isolation

**Temuan**  
Semua tenant/wilayah berada di raw sheet yang sama. Akses difilter di aplikasi berdasarkan mapping wilayah/puskesmas/pengampu.

**Dampak**

- Kesalahan mapping atau guard dapat menampilkan data lintas wilayah.
- Fallback scope untuk faskes non-puskesmas perlu review ketat karena dapat memperluas opsi filter.
- Export/print/search/dashboard harus konsisten menerapkan scope.

**Rekomendasi**

- Buat test matrix role/scope wajib:
  - admin dapat semua.
  - puskesmas hanya data wilayah/record terkait.
  - viewer read-only.
  - pengampu hanya wilayah ampuan.
- Jangan render opsi dropdown yang bisa memberi sinyal data luar scope kecuali memang dibutuhkan.
- Tambahkan logging saat record ditolak scope untuk debugging tanpa expose data.

### 4. Print URL dan iframe embedding

**Temuan**  
`doGet` mengizinkan iframe `ALLOWALL`; print flow memakai action print dan token.

**Dampak**

- Clickjacking/embedding oleh origin lain.
- Token di URL bisa masuk browser history, server log, screenshot, atau referer.
- Print URL yang persistent dapat menjadi akses dokumen jika token belum expire atau validasi longgar.

**Rekomendasi**

- Hindari token di query string untuk akses data sensitif; gunakan short-lived one-time print token jika memungkinkan.
- Batasi `ALLOWALL` hanya bila embed benar-benar dibutuhkan.
- Jika embed dibutuhkan, tambahkan client-side frame-busting/allowlist messaging tidak cukup sebagai kontrol utama, tapi membantu UX.
- Pastikan print handler selalu validasi token dan scope record.

## Risiko P1 / Sedang-Tinggi

### 5. XSS dari rendering `innerHTML`

**Temuan**  
Frontend banyak memakai `innerHTML`. Sebagian menggunakan escape helper, tetapi konsistensi harus diaudit.

**Dampak**

- Data dari sheet dapat menjadi stored XSS jika tidak di-escape saat render.
- XSS dapat mencuri token session dari client state dan melakukan action sebagai user.

**Rekomendasi**

- Larang interpolasi data sheet langsung ke template string HTML tanpa `escapeHtml`.
- Buat render helper yang default escape.
- Untuk rich text yang memang HTML, whitelist tags/attributes.
- Tambahkan grep/test sederhana untuk pattern raw `innerHTML = .*${` tanpa escape.

### 6. Telegram Markdown injection / data leak

**Temuan**  
Telegram messages menggunakan `parse_mode: Markdown` dan memasukkan nilai record seperti nama, alamat, catatan.

**Dampak**

- Karakter Markdown dapat merusak format atau menyisipkan link misleading.
- Pesan berisi data pasien dikirim ke chat ID yang berasal dari mapping/record/global fallback.

**Rekomendasi**

- Escape Markdown untuk semua field dinamis.
- Validasi chat ID target dari `REF_PENGAMPU`; hindari fallback global untuk data pasien jika mapping tidak jelas.
- Audit minimalisasi data di pesan Telegram/email; hanya kirim yang diperlukan operasional.

### 7. Secrets di PropertiesService aman, tapi lifecycle belum terlihat

**Temuan**  
Config sensitif di `PropertiesService`: Telegram token, chat ID, Spreadsheet ID.

**Dampak**

- Admin/deployer dengan akses script dapat membaca secrets.
- Tidak terlihat rotasi/backup policy.

**Rekomendasi**

- Dokumentasikan pemilik dan rotasi secrets.
- Jangan tulis secrets ke log/error response.
- Batasi function `setupConfig` hanya admin dan audit semua perubahan config.

### 8. Error response dapat membocorkan detail internal

**Temuan**  
Beberapa catch mengembalikan `String(err)` ke client.

**Dampak**

- Nama sheet, kolom, stack-like message, atau detail integration failure bisa terlihat user.

**Rekomendasi**

- Pisahkan public error message dan internal log.
- Return code seperti `INTERNAL_ERROR`, `SHEET_NOT_READY`, `NOT_AUTHORIZED`.
- Simpan detail di `AUDIT_LOG`/console untuk admin.

## Risiko P2 / Sedang

### 9. Session di CacheService bukan durable dan tidak revocation-friendly

**Temuan**  
Token disimpan di script cache dengan sliding TTL.

**Dampak**

- Cache eviction dapat logout user mendadak.
- Tidak ada server-side list token untuk revoke semua session user.
- Jika token bocor, valid sampai TTL/cache hilang.

**Rekomendasi**

- Tambahkan `sessionVersion` per user di `REF_USER`/Properties untuk invalidate token lama.
- Simpan issuedAt/userAgent-ish metadata jika relevan.
- TTL role admin lebih pendek.

### 10. Audit log dapat tumbuh dan berisi PII

**Temuan**  
Audit log mencatat diff old/new untuk update.

**Dampak**

- Audit log dapat menyimpan PII historis dan memperbesar spreadsheet.
- Akses ke audit log harus sangat dibatasi.

**Rekomendasi**

- Masking field sensitif di audit diff bila tidak perlu penuh.
- Retention policy audit.
- Separate audit spreadsheet jika volume besar.

## Endpoint/Function Security Checklist

Untuk setiap backend function yang callable dari frontend:

- [ ] Token wajib, kecuali `authLogin`.
- [ ] `authCheck`/session parse dilakukan sebelum baca sheet sensitif.
- [ ] Role check untuk admin action.
- [ ] Scope check untuk record-level read/write/delete/print.
- [ ] Input dx divalidasi terhadap `ALL_DX`.
- [ ] Record key tidak dipercaya mentah; lookup harus diverifikasi scope.
- [ ] Output tidak mengandung field internal/secrets.
- [ ] Error ke client tidak membocorkan detail internal.
- [ ] Audit event untuk write/delete/admin/config.

## Google Apps Script Specific Risks

| Area | Risiko | Mitigasi |
|---|---|---|
| Web app anonymous | Public callable surface | Authz wajib di semua function |
| Execute as deployer | Privilege concentration | Least endpoint, admin gate, audit |
| CacheService token | Eviction/bocor token | TTL pendek, revoke version, no URL token |
| PropertiesService | Secret readable by script editors | Batasi editor, audit config, rotate |
| SpreadsheetApp | Semua data accessible oleh deployer | Scope filter aplikasi + tests |
| UrlFetch/MailApp | PII keluar organisasi | Target validation, minimize payload |
| HtmlService ALLOWALL | Clickjacking/embed | Hindari/batasi, short-lived print token |

## Security Remediation Plan

### Minggu 1

1. Inventaris semua callable functions dan tandai auth requirement.
2. Migrasi semua PIN plaintext ke hash.
3. Tambah test role/scope untuk read/search/print/save/delete.
4. Audit `innerHTML` paling berisiko untuk data sheet/user input.

### Minggu 2

1. Buat `Authz` facade.
2. Refactor endpoint sensitif memakai facade.
3. Escape Markdown Telegram.
4. Standardisasi public error messages.

### Minggu 3

1. Short-lived print token atau ubah mekanisme print URL.
2. Config change audit.
3. Audit log retention/masking.
4. Dokumentasi security runbook.

## Keputusan yang Perlu MasBro Ambil

1. Apakah web app harus tetap `ANYONE_ANONYMOUS`, atau bisa dibatasi ke Google account/domain?
2. Apakah Telegram boleh menerima data pasien lengkap, atau harus data minimal?
3. Berapa TTL session yang diinginkan untuk admin/petugas/viewer?
4. Kapan cutoff plaintext PIN fallback boleh dimatikan?
