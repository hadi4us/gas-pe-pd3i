# Next Sprint Plan — GAS PE PD3I Health Check Follow-up

Tanggal audit: 2026-06-11  
Prinsip sprint: stabilisasi, risk reduction, dan refactor aman. Tidak menambah fitur produk baru sebelum risiko utama terkendali.

## Sprint Objective

Membuat aplikasi lebih aman, terukur, dan mudah dirawat sebelum development fitur dilanjutkan.

Fokus utama:

1. Kunci risiko security deployment anonymous.
2. Kurangi risiko quota/performance dari full-sheet scan.
3. Rapikan quality gate dan deployment hygiene.
4. Siapkan refactor modular tanpa mengubah behavior user.

## Non-Goals

- Tidak menambah workspace/fitur baru.
- Tidak mengubah alur bisnis kecuali untuk hardening.
- Tidak migrasi database besar-besaran dalam sprint ini.
- Tidak redesign UI besar.

## Workstream A — Security Hardening

### A1. Callable Function Inventory

**Tujuan**: semua function yang bisa dipanggil dari client punya status auth yang jelas.

Tasks:

- Inventaris function backend yang dipanggil `google.script.run` dan `doPost __action`.
- Kategorikan:
  - public: `authLogin` saja.
  - authenticated read.
  - authenticated write.
  - admin-only.
- Tandai setiap function dengan guard yang dipakai.
- Buat dokumen kecil `docs/ENDPOINT_SECURITY_MATRIX.md`.

Acceptance:

- Tidak ada function sensitif tanpa token/session check.
- Admin actions memakai `_requireAdminFromToken_` atau facade pengganti.

### A2. PIN Hash Migration Plan

**Tujuan**: menghapus ketergantungan plaintext PIN.

Tasks:

- Buat audit daftar user dengan PIN non-`sha256:`.
- Siapkan prosedur migration ke hash.
- Tentukan tanggal cutoff untuk mematikan plaintext fallback.

Acceptance:

- Semua user aktif memiliki PIN hash.
- Ada keputusan tanggal kapan fallback plaintext dihapus.

### A3. Role/Scope Regression Tests

**Tujuan**: mencegah bocor data lintas tenant.

Tasks:

- Buat fixture minimal record lintas puskesmas/wilayah.
- Test read/search/detail/print/save/delete untuk role:
  - admin.
  - petugas scoped puskesmas.
  - viewer.
  - pengampu/workflow role jika ada.
- Test negatif wajib: user A tidak melihat record user B.

Acceptance:

- Test matrix bisa dijalankan lokal.
- Semua endpoint utama covered minimal smoke test.

### A4. XSS and Markdown Escape Audit

**Tujuan**: mengurangi risiko token theft/data leak.

Tasks:

- Audit `innerHTML` yang merender data dari sheet/user input.
- Pastikan semua dynamic fields melewati `escapeHtml` atau render text node.
- Escape field dinamis Telegram Markdown.

Acceptance:

- Daftar high-risk render points selesai.
- Perbaikan high-risk masuk sprint jika kecil; sisanya masuk backlog.

## Workstream B — Performance & Quota Stabilization

### B1. `getDataRange()` Audit and Classification

**Tujuan**: mengetahui titik full-sheet scan dan prioritas penggantian.

Tasks:

- Buat daftar semua `getDataRange().getValues()`.
- Klasifikasikan:
  - acceptable small reference.
  - needs cache.
  - needs projection/range.
  - needs index/summary.
- Prioritaskan search/list/workflow/dashboard.

Acceptance:

- Dokumen audit ringkas tersedia.
- P0 replacements dipilih untuk sprint berikutnya.

### B2. Search/List Projection First

**Tujuan**: menurunkan biaya request list/search tanpa redesign storage penuh.

Tasks:

- Definisikan kolom projection minimum untuk cards/search result.
- Buat helper read projection dari raw sheet.
- Pastikan detail record baru membaca full row saat user membuka record.

Acceptance:

- Search/list normal tidak perlu membaca semua kolom raw.
- Behavior UI tetap sama.

### B3. Dashboard Summary Plan

**Tujuan**: dashboard tidak bergantung pada full raw scan jangka panjang.

Tasks:

- Definisikan summary metrics yang dibutuhkan dashboard.
- Tentukan apakah summary dibuat time-driven atau post-save incremental.
- Buat schema sheet summary.

Acceptance:

- Ada desain summary siap implementasi.
- Tidak perlu implementasi penuh jika sprint terlalu sempit.

### B4. Lock Duration Reduction

**Tujuan**: mengurangi antrean global lock.

Tasks:

- Review semua operasi di dalam lock.
- Pisahkan critical section write dari operasi eksternal.
- Pastikan email/Telegram/sync tidak berjalan saat lock dipegang.

Acceptance:

- Save path memegang lock hanya saat read-for-update/write.
- Integrasi eksternal diarahkan ke queue atau dijalankan setelah lock release.

## Workstream C — Pipeline & Operations

### C1. Queue-First Post-Save Pipeline

**Tujuan**: notifikasi/sync lebih tahan quota dan error.

Tasks:

- Standarisasi task type di `PIPELINE_QUEUE`.
- Tambahkan status `PENDING`, `PROCESSING`, `DONE`, `FAILED`, `RETRY_AT` jika diperlukan.
- Pastikan dedup fingerprint untuk task notification/sync.
- Dokumentasikan trigger `processPipelineQueue`.

Acceptance:

- Save utama tidak gagal hanya karena Telegram/email/sync gagal.
- Admin bisa melihat status pending/failed minimal dari sheet.

### C2. Retry Policy

**Tujuan**: retry tidak menyebabkan quota spike.

Tasks:

- Batasi retry per run.
- Tambahkan backoff berbasis attempts.
- Pisahkan retry email, Telegram, sync spreadsheet.

Acceptance:

- Retry all tidak mencoba semua row sekaligus tanpa batas.
- Failure reason tetap tersimpan.

### C3. Operational Metrics

**Tujuan**: masalah quota/performance terlihat sebelum fatal.

Tasks:

- Log durasi operasi utama: login, search, dashboard, save, queue worker.
- Hitung queue pending/failed.
- Buat ringkasan manual/admin doc untuk cek harian.

Acceptance:

- Minimal ada cara melihat operasi mana yang lambat/gagal.

## Workstream D — Maintainability & Repo Hygiene

### D1. Test Runner / Quality Gate

**Tujuan**: ada perintah verifikasi yang konsisten.

Tasks:

- [x] Tentukan test runner untuk file test yang sudah ada.
- [x] Tambahkan `package.json` jika memang memakai Node test runner.
- [x] Dokumentasikan `npm test`/command alternatif.
- [x] Pisahkan test dari `src/` bila memungkinkan.
- [x] Tambahkan hygiene check ringan untuk struktur modular dan clasp ignore.

Implementasi awal:

- `npm test` menjalankan `node --test tests/*.test.js` dan `node scripts/check-project-hygiene.js`.
- Test Node utama berada di `tests/app.workflow.test.js`.
- Test/stub yang masih di `src/` dibiarkan sebagai Apps Script editor harness atau cleanup stub agar tidak memakai CommonJS di runtime GAS.

Acceptance:

- Satu command test/syntax check bisa dijalankan.
- README/DEPLOYMENT menjelaskan gate sebelum deploy.

### D2. Clean Source Tree

**Tujuan**: mencegah file tidak perlu ikut deploy/review.

Tasks:

- Pindahkan atau hapus `src/node_modules/` dari source tree.
- Validasi `.claspignore`.
- Buat checklist `clasp push` file list.

Acceptance:

- `git status` bersih dari dependency untracked di `src/`.
- Deployment source jelas hanya file Apps Script yang diperlukan.

### D3. Module Split Plan

**Tujuan**: refactor besar punya urutan aman.

Tasks:

- Buat map function `routes.js` berdasarkan domain.
- Buat map section `app.js.html` berdasarkan workspace.
- Tentukan extraction order paling rendah risiko.

Acceptance:

- Ada PR plan modularisasi bertahap.
- Tidak ada behavior change dalam extraction pertama.

## Suggested Sprint Backlog

### Must Have

1. Endpoint/function security inventory.
2. Role/scope smoke tests.
3. `getDataRange()` audit classification.
4. Source tree cleanup (`src/node_modules/`).
5. Test command/gate documented.
6. PIN hash migration decision.

### Should Have

1. Search/list projection helper prototype.
2. Lock duration reduction in save path.
3. Telegram Markdown escaping.
4. Queue-first plan for post-save pipeline.

### Could Have

1. Dashboard summary schema.
2. Basic operation duration logging.
3. Module split first extraction.

### Won't Have This Sprint

1. New product features.
2. Full database migration.
3. Major UI redesign.
4. Broad workflow behavior changes.

## Recommended Sequence

### Day 1–2: Freeze and inventory

- Confirm feature freeze.
- Run repo/deploy hygiene check.
- Endpoint inventory.
- `getDataRange()` inventory.

### Day 3–4: Tests and security

- Build role/scope smoke tests.
- PIN hash migration procedure.
- High-risk XSS/Markdown audit.

### Day 5–6: Performance stabilization

- Projection helper plan/prototype.
- Lock scope review.
- Queue-first design for integrations.

### Day 7: Verification and decision checkpoint

- Run test/gate.
- Review docs with MasBro.
- Decide next implementation sprint: data access layer vs authz facade first.

## Risk Register for Next Sprint

| Risk | Probability | Impact | Mitigation |
|---|---:|---:|---|
| Scope regression during refactor | Medium | High | Tests before refactor, facade, small PRs |
| Apps Script timeout during search/dashboard | High | High | Projection/index/summary |
| Mail/Telegram quota exceeded | Medium | Medium/High | Queue, batch limit, backoff |
| Lock contention under concurrent saves | Medium | High | Short lock, async pipeline |
| Stale cache after writes | Medium | Medium | Versioned cache/invalidation wrapper |
| Plaintext PIN remains | Medium | High | Migration/cutoff |
| Deploy includes unwanted files | Low/Medium | Medium | `.claspignore` validation, source cleanup |

## Decision Points Needed

1. **Security mode**: tetap anonymous web app atau batasi akun/domain?
2. **PIN cutoff**: kapan plaintext PIN fallback dimatikan?
3. **Notification SLA**: notifikasi harus real-time, atau boleh async 1–5 menit?
4. **Data growth estimate**: target baris per DX 6–12 bulan?
5. **Refactor priority**: Authz facade dulu atau data access layer dulu?

## Recommendation

Urutan terbaik menurut audit: **Authz facade + role/scope tests dulu**, lalu **data access/projection**. Alasannya sederhana: performance penting, tapi di deployment anonymous + execute-as-deployer, satu celah authorization lebih mahal daripada latency. Setelah guard aman dan dites, optimasi sheet bisa dilakukan lebih percaya diri.
