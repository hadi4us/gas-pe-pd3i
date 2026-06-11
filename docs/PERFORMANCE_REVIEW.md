# Performance & Quota Review — GAS PE PD3I

Tanggal audit: 2026-06-11  
Scope: Google Apps Script quota, Spreadsheet performance, cache, concurrency, integration latency. Tidak ada feature development.

## Executive Summary

Bottleneck utama aplikasi adalah pola full-sheet scan (`getDataRange().getValues()`), global script lock pada write/action path, dan integrasi eksternal yang masih dapat berjalan di request path. Saat data masih kecil ini bisa berjalan baik, tetapi saat raw sheets membesar, search/dashboard/workflow queue akan melambat, quota Spreadsheet service naik, dan risiko timeout Apps Script meningkat.

## Risiko Quota Utama

| Area | Risiko | Dampak |
|---|---|---|
| Spreadsheet read | Banyak `getDataRange().getValues()` | Latency tinggi, memory besar, quota pressure |
| Spreadsheet write | `appendRow`, full-row `setValues`, audit append | Lock contention, write bursts lambat |
| LockService | Global script lock 30 detik | Semua write/action saling antre |
| CacheService | Chunked cache full sheet | Hit/miss tidak stabil untuk sheet besar |
| MailApp | Notifikasi email per record/retry | Daily quota cepat habis |
| UrlFetchApp | Telegram per record/retry | External failure/latency memblokir flow |
| SpreadsheetApp.openById | Sync pengampu | Cross-spreadsheet IO mahal dan rawan quota |
| Apps Script runtime | Batch/search/dashboard agregasi in-memory | Timeout 6 menit / web response lambat |

## 1. Spreadsheet Read Pattern

### Observasi

Full-sheet reads masih digunakan di banyak jalur:

- Login membaca seluruh `REF_USER`.
- Search/list/workflow membaca `{DX}_Raw` penuh.
- Dashboard membaca raw sheets dan agregasi in-memory.
- Queue membaca seluruh `PIPELINE_QUEUE`.
- Batch retry membaca seluruh raw sheet per DX.
- Helper record lookup masih melakukan scan pada beberapa path.

Sebagian optimasi sudah ada:

- `Cache_Manager` untuk cache sheet.
- `_readSheetWithCache_` di dashboard/search variant.
- EPID index in-memory untuk lookup tertentu.
- Komentar di `utils.js` menunjukkan upaya membaca hanya kolom EPID untuk beberapa requirement.

### Risiko

- Kompleksitas O(total rows × total columns) per request.
- Pagination dilakukan setelah semua data dibaca dan difilter, bukan di storage layer.
- Makin banyak kolom raw, makin berat semua request.
- Multiple concurrent users membuat quota/latency naik cepat.

### Rekomendasi

1. Ganti `getDataRange()` dengan range spesifik:
   - Header: row 1 saja.
   - Lookup EPID/recordId: kolom key saja dahulu.
   - List/search: projection kolom yang dibutuhkan saja.
2. Buat index sheet ringan per DX:
   - `DX_Index`: recordId, EPID, status verifikasi, updatedAt, wilayah, puskesmas, deletedAt, rowNumber.
   - Search/list normal baca index dulu, detail baca raw per row saat dibuka.
3. Batasi dashboard ke agregat precomputed atau projection kecil.
4. Terapkan server-side paging berbasis index, bukan scan semua row tiap request.

## 2. Search/List/Workflow Queue

### Observasi

Search loose dapat membaca semua DX. Workflow queue membaca rows raw, memfilter status, scope, keyword, lalu sort dan paginate.

### Dampak Performa

Jika 5 DX masing-masing 10.000 baris dan 150 kolom:

- Search all-DX dapat membaca 50.000 × 150 cell per request.
- Sort dilakukan atas semua hasil kandidat.
- Page size 10 tidak mengurangi biaya baca awal.

### Rekomendasi

- Default list tanpa filter harus baca hanya index columns.
- Untuk keyword bebas, batasi minimal keyword length atau gunakan precomputed normalized search text di index.
- Untuk workflow queue, baca status-specific index: pending/revisi/terverifikasi.
- Cache result per `(role, scope, dx, workspace, filterHash)` pendek, mis. 30–60 detik.
- Jangan izinkan `ALL_DX` full scan untuk user biasa kecuali filter cukup spesifik.

## 3. Dashboard

### Observasi

Dashboard membaca raw sheet dan melakukan agregasi di Apps Script memory. Cache-first sudah membantu, tetapi cache yang disimpan adalah data sheet besar.

### Risiko

- Dashboard adalah kandidat request paling mahal.
- Cache miss menyebabkan spike latency.
- Cache full table mendekati limit CacheService dan chunking makin rapuh.
- Agregasi berulang untuk semua user padahal hasil dashboard sering sama/scope-limited.

### Rekomendasi

- Buat sheet/materialized summary harian atau per update:
  - count per DX/status/kecamatan/kelurahan/age group/time bucket.
  - top hotspots.
  - SLA/workflow counts.
- Dashboard membaca summary, bukan raw.
- Jika scope user diperlukan, summary bisa per puskesmas/kecamatan.
- Refresh summary via time-driven trigger atau post-save incremental update.

## 4. Write Path dan Lock Contention

### Observasi

`doPost` mengambil `LockService.getScriptLock()` sebelum routing action. `saveFormData`, batch, dan pipeline queue juga menggunakan script lock.

### Risiko

- Script lock adalah global untuk seluruh script, bukan per sheet/DX/user.
- Search/action yang masuk via `doPost` ikut antre jika global lock dipakai sebelum diketahui action-nya.
- Integrasi eksternal dalam lock memperpanjang waktu lock.
- User bisa menerima timeout jika beberapa user menyimpan bersamaan.

### Rekomendasi

- Ambil lock hanya untuk critical section write, bukan seluruh request.
- Gunakan lock key konseptual per DX/record bila memungkinkan. Apps Script LockService tidak punya named lock, tapi struktur kode bisa memperkecil durasi lock.
- Jangan kirim email/Telegram/sync saat lock masih dipegang.
- Save record dulu, release lock, enqueue pipeline.
- Hindari `appendRow` untuk high contention jika perlu row allocation manual dengan lock singkat.

## 5. Post-Save Pipeline dan Integrasi Eksternal

### Observasi

Sistem punya `PIPELINE_QUEUE`, retry functions, dan batch processor. Namun beberapa notifikasi/sync masih ada di flow save/retry langsung.

### Risiko

- MailApp quota harian habis saat retry massal.
- UrlFetch Telegram lambat/gagal membuat user action lambat.
- Sync ke spreadsheet pengampu via `openById` mahal dan rawan permission/error.
- Retry all dapat mendekati execution limit meski ada partial cutoff 25 detik.

### Rekomendasi

- Jadikan queue sebagai satu-satunya jalur integrasi eksternal.
- Time-driven trigger memproses misalnya 5–20 task per run.
- Simpan `Attempts`, `NextAttemptAt`, `LastError`, `Status`.
- Exponential backoff untuk Telegram/email/sync.
- Dedup fingerprint sudah ada; perlu dipertahankan dan diperluas untuk semua task type.
- Retry admin hanya enqueue ulang atau menjalankan batch kecil, bukan semua sekaligus.

## 6. CacheService

### Observasi

Cache data sheet disimpan dengan chunking 90KB dan TTL config default 60 detik.

### Risiko

- CacheService limit dapat menyebabkan chunk hilang.
- Cache full sheet besar mengonsumsi banyak entry.
- TTL pendek berarti cache miss sering terjadi saat traffic jarang.
- Data stale setelah write bergantung pada invalidation manual.

### Rekomendasi

- Cache projection/summary/index, bukan raw full table.
- Tambah cache stats sederhana di log: hit, miss, chunk miss, parse fail.
- Gunakan versioned cache key agar invalidation tidak perlu remove banyak chunk.
- Pertimbangkan PropertiesService hanya untuk metadata kecil, bukan data besar.

## 7. Auth Performance

### Observasi

Login membaca seluruh `REF_USER` setiap login. Untuk jumlah user kecil tidak masalah.

### Risiko

- Jika user bertambah, login brute-force juga memicu repeated sheet reads.
- Attempt state ada di cache per username, bagus, tapi user lookup belum di-cache.

### Rekomendasi

- Cache `REF_USER` projection untuk login dengan TTL pendek.
- Atau buat map username -> row object di cache.
- Invalidate cache saat change PIN/admin update user.

## 8. Audit Log Performance

### Observasi

Setiap insert/update/delete mencoba menulis audit log dengan `appendRow`.

### Risiko

- Audit log tumbuh besar.
- `appendRow` audit menambah write latency.
- Diff besar dapat memperbesar cell content.

### Rekomendasi

- Queue audit log bila write latency terasa.
- Batasi/mask diff field besar.
- Archive audit log periodik.

## 9. Google Apps Script Quota Checklist

Yang perlu dimonitor:

- Total execution time per day.
- Spreadsheet read/write calls.
- URL Fetch calls.
- Mail recipients per day.
- Trigger runtime failures.
- CacheService put/get errors.
- Concurrent execution/lock timeout.

Tambahkan dashboard admin sederhana atau log summary harian:

- jumlah save per DX.
- jumlah search/list/dashboard request.
- rata-rata durasi save/search/dashboard.
- jumlah notification sent/failed.
- queue pending/failed.

## 10. Performance Remediation Plan

### Quick wins

1. Pastikan search/list memakai `_readSheetWithCache_` atau data access wrapper konsisten.
2. Pindahkan integrasi eksternal keluar dari lock.
3. Batasi retry batch dengan limit kecil dan status partial yang jelas.
4. Cache `REF_USER`, `REF_FASKES`, `REF_PENGAMPU`, `REF_IMUN` projection.
5. Hapus/pindahkan `src/node_modules/` dari source tree.

### Medium-term

1. Buat `DX_Index` per diagnosis.
2. Search/list/workflow queue baca index, bukan raw.
3. Dashboard baca summary/materialized aggregate.
4. Queue all notifications/sync.
5. Tambahkan instrumentation durasi dan quota-risk logs.

### Long-term

1. Pertimbangkan storage selain Spreadsheet untuk data yang tumbuh besar.
2. Gunakan BigQuery/Cloud SQL/Firestore bila query multi-tenant dan dashboard makin kompleks.
3. Pisahkan operational queue/audit dari spreadsheet utama.

## Performance Acceptance Targets

Target awal yang realistis:

- Login: < 1 detik untuk REF_USER normal.
- Save record utama: < 2 detik tanpa integrasi eksternal.
- Search/list page: < 2 detik untuk filter umum pada dataset produksi.
- Dashboard initial: < 3 detik dari summary/cache.
- Queue worker: proses task kecil tanpa melewati 60–90 detik.
- Lock wait: jarang > 2 detik pada jam sibuk.

## Pertanyaan Kapasitas untuk MasBro

Untuk estimasi lebih akurat perlu angka produksi:

1. Perkiraan baris per DX saat ini dan target 6–12 bulan.
2. Jumlah user aktif bersamaan.
3. Frekuensi save kasus per hari.
4. Apakah dashboard dibuka banyak user atau hanya admin.
5. Batas toleransi keterlambatan notifikasi pengampu: real-time atau boleh 1–5 menit.
