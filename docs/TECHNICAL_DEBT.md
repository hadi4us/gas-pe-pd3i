# Technical Debt — GAS PE PD3I

Tanggal audit: 2026-06-11  
Scope: review maintainability, correctness risk, dan operability. Tidak ada feature development.

## Executive Summary

Kode sudah punya banyak hardening penting: session token, role/scope checks, sanitasi spreadsheet, audit log, cache manager, batch retry, dan dokumen arsitektur. Namun kompleksitas sekarang terkonsentrasi di beberapa file besar dan pola akses sheet masih mahal. Debt paling penting untuk ditangani adalah pemisahan modul, konsolidasi akses data, standarisasi auth/scope, dan membuat test/gate yang bisa dijalankan konsisten.

## Prioritas Debt

| Prioritas | Area | Dampak | Ringkas |
|---|---|---:|---|
| P0 | Auth/scope tersebar | Tinggi | Banyak endpoint bergantung pada helper scope; bug kecil bisa bocor lintas tenant. |
| P0 | Full-sheet scan | Tinggi | Search, queue, auth, retry, dashboard dapat lambat dan quota-heavy. |
| P0 | Global lock di write path | Tinggi | Semua write/action berpotensi antre 30 detik. |
| P1 | File monolitik | Tinggi | `routes.js` dan `app.js.html` terlalu besar untuk review aman. |
| P1 | Test runner tidak jelas | Sedang/Tinggi | Ada test file, tetapi tidak ada root package/test command. |
| P1 | Plaintext PIN fallback | Tinggi | Backward compatibility memperpanjang risiko password lemah. |
| P2 | Dokumentasi tersebar | Sedang | Banyak dokumen bagus tapi rawan out-of-date. |
| P2 | `src/node_modules/` untracked | Sedang | Berisiko membingungkan deployment/review. |

## 1. Backend Monolith di `routes.js`

### Observasi

`routes.js` menangani terlalu banyak concern sekaligus:

- Entry point web app.
- Workflow action router.
- Search/list.
- Delete/edit record.
- Retry batch.
- Notification builder.
- Telegram/email send.
- Sync spreadsheet pengampu.
- Admin/debug helpers.

### Risiko

- Sulit melakukan review keamanan karena akses data, auth, dan integrasi bercampur.
- Perubahan kecil bisa memengaruhi workflow lain.
- Duplicate logic dan helper mirip mudah muncul.
- Unit test per domain sulit dibuat.

### Rekomendasi

Pecah secara bertahap tanpa mengubah behavior:

1. `entrypoints.js`: `doGet`, `doPost`, response JSON.
2. `workflow.actions.js`: create/edit/delete/verification/sample/status action.
3. `search.service.js`: list/search/projection/filter/pagination.
4. `notification.service.js`: email/Telegram builders dan sender.
5. `pengampu.sync.js`: mapping dan spreadsheet sync.
6. `batch.service.js`: retry dan processor.

## 2. Frontend Monolith di `app.js.html`

### Observasi

`app.js.html` sekitar 7.700 baris dan berisi:

- State global aplikasi.
- Rendering form.
- Search/list.
- Workflow queues.
- Dashboard widgets.
- Admin buttons.
- Submit/save flow.
- Draft local storage.
- Banyak `innerHTML` render.

### Risiko

- Sulit menemukan source of truth UI state.
- Regresi UX tinggi saat edit satu area.
- Keamanan XSS bergantung pada konsistensi escaping manual.
- Review PR menjadi berat.

### Rekomendasi

Pecah berdasarkan workspace:

- `app.core.js.html`: boot, auth state, navigation, google.script.run wrapper.
- `app.form.js.html`: input/edit form.
- `app.workflow.js.html`: verifikasi/sampel/status queues.
- `app.search.js.html`: list/search/detail.
- `app.admin.js.html`: admin retry/repair/config actions.
- `app.render.js.html`: shared escape/render helpers.

Target: tidak ada file client > 1.500–2.000 baris.

## 3. Akses Spreadsheet Belum Terkonsolidasi

### Observasi

Pola `sheet.getDataRange().getValues()` masih muncul di banyak tempat: auth, routes, dashboard, queue, diagnostic, data. Sebagian sudah memakai cache/range terbatas, tetapi belum konsisten.

### Risiko

- Quota dan latency meningkat linear dengan jumlah baris/kolom.
- Kolom baru membuat full-row read semakin mahal.
- Implementasi pagination semu: data tetap dibaca penuh sebelum `slice`.
- Potensi timeout Apps Script pada batch/retry/search.

### Rekomendasi

Buat satu data access layer resmi:

- `readTable(sheetName, options)` dengan pilihan columns, where, limit, pageToken.
- `readHeaders(sheet)` cacheable.
- `findByKey(sheetName, keyColumn, keyValue)` dengan index column/range terbatas.
- `appendRecord` dan `updateRecordByRow` yang mengurus audit/cache invalidation.
- Hindari pemanggilan langsung `getDataRange()` di domain service.

## 4. Scope dan Authorization Tersebar

### Observasi

Access control ada, tapi dipanggil dari banyak jalur. Dedicated workflow action, search, delete, save, dashboard, print, dan retry punya variasi kebutuhan akses.

### Risiko

- Endpoint baru atau helper lama bisa lupa memanggil guard.
- Read-scope dan write-scope bisa divergen.
- Multi-tenant single sheet sangat bergantung pada guard ini.

### Rekomendasi

Buat authorization facade tunggal:

```text
Authz.requireSession(token)
Authz.requireRole(session, roles)
Authz.canReadRecord(session, dx, record)
Authz.canWriteStage(session, dx, stage, record)
Authz.canDeleteRecord(session, dx, record)
Authz.filterReadableRecords(session, dx, records)
```

Semua endpoint harus memakai facade ini. Tambahkan matrix test untuk role/scope.

## 5. Cache Strategy Masih Campuran

### Observasi

`Cache_Manager` sudah ada, tetapi:

- Tidak semua read path menggunakannya.
- Cache invalidation manual per write.
- CacheService punya batas ukuran/TTL dan bukan storage durable.
- Cache chunking menambah potensi partial miss.

### Risiko

- Data stale atau cache miss menyebabkan performa tidak stabil.
- Bug invalidation membuat user melihat data lama.
- Large sheet cache bisa gagal diam-diam karena limit CacheService.

### Rekomendasi

- Standarisasi semua read raw/reference lewat data access layer.
- Tambahkan version key per sheet: `CACHE_{sheet}_VERSION` agar invalidation lebih sederhana.
- Simpan metadata hit/miss/error minimal di log untuk observability.
- Untuk sheet besar, cache projection kecil, bukan full table.

## 6. Test dan Quality Gate Belum Jelas

### Observasi

Ada test files:

- `src/Controllers/routes.test.js`
- `src/Core/audit.test.js`
- `src/Views/app.workflow.test.js`
- `tests/app.workflow.test.js`

Root repo sekarang memiliki `package.json` dengan gate standar:

- `npm test`
- `npm run test:node`
- `npm run check:hygiene`

Catatan: `src/*/*.test.js` masih berupa Apps Script editor harness/stub, sedangkan regression test Node utama berada di `tests/`.

### Risiko

- Test tidak otomatis dijalankan sebelum deploy.
- Refactor besar rawan regresi.
- Test di `src/` bisa membingungkan untuk Apps Script jika ignore berubah.

### Rekomendasi

- Tambahkan documented test command di README/DEPLOYMENT.
- Simpan test di `tests/`, bukan `src/`, kecuali memang Apps Script test harness.
- Buat minimal CI/local gate:
  - lint/syntax JS.
  - unit test pure helper.
  - smoke test role/scope matrix.
  - clasp push dry-run/list files check.

## 7. Operasional Integrasi Terlalu Dekat dengan Request Path

### Observasi

Setelah save, sistem dapat menjalankan print URL, email, Telegram, dan sync pengampu. Ada `PIPELINE_QUEUE`, tetapi beberapa integrasi masih dieksekusi langsung.

### Risiko

- Request user lambat.
- Kegagalan eksternal memengaruhi UX save.
- Quota MailApp/UrlFetch/Spreadsheet bisa habis saat puncak.

### Rekomendasi

- Jadikan post-save pipeline async-by-default.
- Save utama hanya menulis record dan enqueue pekerjaan.
- Trigger time-driven memproses queue dengan limit kecil dan retry policy.
- Simpan status detail di kolom operasional.

## 8. Debt Deployment / Repo Hygiene

### Observasi

- `src/node_modules/` untracked ada di dalam folder Apps Script source.
- `.claspignore` mengecualikan folder tersebut, tetapi tetap rawan human error.
- Banyak file modified existing; audit tidak boleh menimpa pekerjaan fitur.

### Rekomendasi

- Pindahkan dependency tooling keluar `src/` atau hapus jika tidak diperlukan.
- Tambahkan checklist deploy: `clasp status`, file list, dan ignore validation.
- Pisahkan branch health-check/refactor dari branch feature.

## 9. Maintainability Roadmap

### Sprint 1 — Stabilization

- Freeze fitur baru.
- Dokumentasikan endpoint/action list.
- Tambahkan smoke tests auth/scope/search/save.
- Hapus/pindahkan `src/node_modules/`.
- Audit semua `getDataRange()` dan beri label: acceptable / must replace.

### Sprint 2 — Data Access Layer

- Buat wrapper read/write resmi.
- Migrasi search/list/workflow queue ke projection reads.
- Cache reference sheets konsisten.
- Tambahkan index key untuk EPID/recordId/status.

### Sprint 3 — Module Split

- Pecah `routes.js` dan `app.js.html` per domain.
- Pertahankan public API function names agar frontend tidak rusak.
- Tambahkan tests untuk setiap extracted module.

### Sprint 4 — Async Pipeline

- Pindahkan notification/sync ke queue.
- Tambahkan retry/backoff/status dashboard admin.
- Batasi pekerjaan per trigger agar aman terhadap 6 menit execution limit.

## 10. Definition of Done untuk Debt Paydown

Debt dianggap turun jika:

- Tidak ada endpoint sensitif tanpa `Authz` facade.
- Search/list tidak membaca semua kolom/baris untuk setiap request normal.
- Save utama selesai cepat tanpa menunggu integrasi eksternal.
- Test command terdokumentasi dan bisa dijalankan lokal/CI.
- File terbesar turun di bawah target yang disepakati.
- Deployment file list bersih dari dependency/tooling yang tidak perlu.
