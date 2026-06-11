# Current State — GAS PE PD3I

Tanggal audit: 2026-06-11  
Scope: audit kondisi repository saat ini berdasarkan struktur repo, `docs/`, dan source `src/`. Tidak membuat fitur baru dan tidak mengubah kode.

> Catatan penting: `CLAW.md` **tidak ditemukan** di root repository `gas-pe-pd3i` maupun subfolder yang terjangkau audit (`find . -maxdepth 3`). Karena itu bagian “Kesesuaian dengan CLAW.md” dinilai sebagai **blocked/parsial** dan memakai dokumen proyek yang tersedia (`README.md`, `docs/BLUEPRINT.md`, `docs/ARCHITECTURE.md`, `docs/MODULE-MAP.md`, `docs/ROLE-MATRIX.md`, dan dokumen audit lain) sebagai pembanding sementara.

## 1. Struktur Folder Saat Ini

```text
gas-pe-pd3i/
├── .github/
│   └── workflows/
│       └── deploy.yml
├── docs/
│   ├── diagrams/
│   │   ├── puppeteer-config.json
│   │   ├── user-flow-main@4k.png
│   │   ├── user-flow-main.mmd
│   │   └── user-flow-render-config.json
│   ├── ARCHITECTURE.md
│   ├── BLUEPRINT.md
│   ├── BLUEPRINT-WORKFLOW-REDESIGN.md
│   ├── CURRENT_ARCHITECTURE.md
│   ├── CURRENT_STATE.md
│   ├── DEEP-COLUMN-AUDIT-20260512.md
│   ├── DEPLOYMENT.md
│   ├── FIELD-GAP-MATRIX.md
│   ├── FORM-EXPANSION-UAT.md
│   ├── INVENTORY.md
│   ├── MODULE-MAP.md
│   ├── NEXT_SPRINT_PLAN.md
│   ├── NEXT-STEPS.md
│   ├── PERFORMANCE_REVIEW.md
│   ├── PHASE3-VERIFICATION.md
│   ├── PROGRESS.md
│   ├── RAW-CLEANUP-CURRENT-AUDIT.md
│   ├── RAW-HEADER-AUDIT.md
│   ├── RAW-HEADER-LIVE-AUDIT.md
│   ├── REFERENCE-DATA-DICTIONARY.md
│   ├── ROLE-MATRIX.md
│   ├── SCHEMA-RECOMMENDATION-CLEANUP-20260512.md
│   ├── SECURITY_REVIEW.md
│   ├── SYNC-SOP.md
│   ├── TECHNICAL_DEBT.md
│   ├── UI-BLUEPRINT.md
│   └── USER-FLOW.md
├── scripts/
│   ├── analyze-live-raw-cleanup.js
│   ├── audit-live-raw-headers.js
│   ├── test-autofill-suppression.js
│   ├── test-choice-button-scope.js
│   ├── test-open-button-loading.js
│   └── test-workspace-refresh-state.js
├── src/
│   ├── appsscript.json
│   ├── *.js
│   ├── *.js.html
│   ├── *.html
│   ├── *.test.js
│   └── node_modules/            # untracked; harus dianggap hygiene issue
├── tests/
│   └── app.workflow.test.js
├── .clasp.json
├── .claspignore
├── FIX-LIST-KASUS-KOSONG.md
├── README.md
└── test-list-kasus.gs
```

### Catatan struktur

- Root Apps Script dikonfigurasi oleh `.clasp.json` dengan `rootDir: "src"`.
- `src/appsscript.json` memakai runtime V8, timezone `Asia/Jakarta`, `executeAs: USER_DEPLOYING`, dan `access: ANYONE_ANONYMOUS`.
- `.claspignore` sudah mengecualikan `docs/**`, `tests/**`, `scripts/**`, `.github/**`, dan `src/node_modules/**` dari push Apps Script.
- Ada workflow GitHub deploy yang menjalankan `clasp push --force` dari folder `src` saat perubahan di `src/**` masuk branch `main`.
- `docs/` sangat lengkap, tetapi sebagian dokumen inventory/module map sudah tertinggal dari kondisi source aktual.
- `src/node_modules/` muncul sebagai untracked folder di dalam source tree. Walau dikecualikan `.claspignore`, posisinya tetap rawan membingungkan review/deploy.

## 2. Modul yang Sudah Ada

### 2.1 Backend Apps Script

| Modul | Status | Fungsi utama | Catatan |
|---|---|---|---|
| `main.js` | Ada | Placeholder/referensi entry | Sangat kecil; entry aktual ada di `routes.js`. |
| `routes.js` | Ada | `doGet`, `doPost`, routing workflow, save orchestration, search/list, retry, notification, sync pengampu, authz helper | Modul terbesar backend, ±2.649 baris. Terlalu banyak concern. |
| `auth.js` | Ada | Login, token session, logout, change PIN, login rate limit | Mendukung hash `sha256:` tetapi masih menerima plaintext fallback. |
| `data.js` | Ada | Serializer/deserializer, sanitasi sheet, save/upsert raw record, EPID recommendation/generation, pengampu lookup | Sudah punya sanitasi formula injection dan header alias. |
| `dashboard.js` | Ada | Dashboard stats, overview summary, workflow inbox, drilldown, export CSV | Banyak agregasi in-memory dan full-sheet read/cache. |
| `print.js` | Ada | Print handler, print URL, record print lookup | Print terkait token/scope perlu audit rutin karena URL dapat diakses lewat `doGet`. |
| `utils.js` | Ada | Include template, spreadsheet accessor, response JSON, session token decode, helper EPID | Memegang helper umum lintas modul. |
| `config.js` | Ada | Runtime config via `PropertiesService` | Menyimpan/mengambil config sensitif seperti spreadsheet ID dan token Telegram. |
| `cache.js` | Ada | `Cache_Manager`, chunked cache, invalidasi | Sudah menangani chunk besar, tapi strategi cache belum konsisten di semua read path. |
| `audit.js` | Ada | Audit log insert/update/delete/login/logout | Audit dapat tumbuh dan berpotensi menyimpan PII historis. |
| `pipeline.queue.js` | Ada | Queue post-save pipeline berbasis sheet | Sudah ada fondasi async pipeline, tetapi belum menjadi satu-satunya jalur integrasi eksternal. |
| `migration.js` | Ada | Migrasi reference sheets, raw header reorder/append/backfill/repair workflow marker | Modul operasional besar, ±1.097 baris, harus dijalankan hati-hati/admin-only. |
| `raw_schema.js` | Ada | Canonical raw header order per DX | Menjadi acuan cleanup schema raw. |
| `diagnostic.js` | Ada | Diagnostic sheet/session/search helper | Berguna untuk debug, perlu dipastikan aksesnya tidak terbuka untuk user biasa. |

### 2.2 Frontend / HTML Templates

| Modul | Status | Fungsi utama | Catatan |
|---|---|---|---|
| `index.html` | Ada | Shell utama aplikasi, include login, workspace, config, app scripts | Include aktual tidak lagi sama persis dengan `docs/MODULE-MAP.md`. |
| `login.html` | Ada | UI login | Termodifikasi di working tree. |
| `pin.html` | Ada | UI ubah password/PIN | Mendukung change PIN flow. |
| `style.html` | Ada | CSS global | Sangat besar, ±5.268 baris. |
| `app.js.html` | Ada | Controller frontend utama: state, navigation, form, workflow, search, admin action, submit, rendering | Modul terbesar, ±7.700 baris; debt utama. |
| `app.dashboard.js.html` | Ada | Client dashboard | ±934 baris; termodifikasi di working tree. |
| `auth.js.html` | Ada | Client auth/session helper | Termodifikasi di working tree. |
| `utils.js.html` | Ada | Client utility helper | Termodifikasi di working tree. |
| `config_common.html` | Ada | Field/common config | ±363 baris. |
| `config_MR.html` | Ada | Config MR | Ada. |
| `config_DIF.html` | Ada | Config DIF | Termodifikasi di working tree. |
| `config_PERT.html` | Ada | Config PERT | Ada. |
| `config_TN.html` | Ada | Config TN | Ada. |
| `config_AFP.html` | Ada | Config AFP | Ada. |
| `config_registry.html` | Ada | Registry diagnosis/config | Ada. |
| `workspace_overview.html` | Ada | Workspace beranda | Ada. |
| `workspace_input_launcher.html` | Ada | Launcher input kasus | Ada. |
| `workspace_input_form.html` | Ada | Form input awal | Ada. |
| `workspace_search.html` | Ada | List/search kasus | Ada. |
| `workspace_verifikasi_form.html` | Ada | Verifikasi EPID | Ada. |
| `workspace_sampel_form.html` | Ada | Hasil pemeriksaan/sampel | Ada. |
| `workspace_status_form.html` | Ada | Update status kasus | Ada. |
| `workspace_success_modal.html` | Ada | Modal sukses/next action | Ada. |
| `workspace_form.html` | Ada | Workspace form legacy/shared | Ada, ±291 baris. |
| `workspace_dashboard.html` | Ada | Container dashboard | Ada. |
| `workspace_guide.html` | Ada | Panduan aplikasi | Ada. |
| `print_MR.html` | Ada | Template cetak MR | Termodifikasi di working tree. |
| `print_DIF.html` | Ada | Template cetak DIF | Termodifikasi di working tree. |
| `print_PERT.html` | Ada | Template cetak PERT | Termodifikasi di working tree. |
| `print_TN.html` | Ada | Template cetak TN | Termodifikasi di working tree. |
| `print_AFP.html` | Ada | Template cetak AFP | Termodifikasi di working tree. |

### 2.3 Test, Script, dan Operasional

| Area | Status | Catatan |
|---|---|---|
| `src/routes.test.js` | Ada | Test backend retry/config/batch structure. |
| `src/audit.test.js` | Ada | Test audit helper. |
| `src/app.workflow.test.js` | Ada | Stub kecil; ada juga duplicate/variant di `tests/`. |
| `tests/app.workflow.test.js` | Ada | Termodifikasi di working tree. |
| `scripts/audit-live-raw-headers.js` | Ada | Reproduksi audit header live. |
| `scripts/analyze-live-raw-cleanup.js` | Ada | Reproduksi cleanup audit live. |
| Script UI regression kecil | Ada | `test-autofill-suppression`, `test-choice-button-scope`, `test-open-button-loading`, `test-workspace-refresh-state`. |
| `package.json` | Belum ada | Test runner/quality gate standar belum jelas. |

## 3. Modul yang Belum Ada / Belum Terpisah

Bagian ini bukan permintaan implementasi; hanya gap modul berdasarkan kondisi saat ini dan arah dokumen proyek.

### 3.1 Belum ada sebagai modul terpisah

| Modul yang dibutuhkan | Status saat ini | Dampak |
|---|---|---|
| `Authz` facade tunggal | Belum ada; authz helper tersebar terutama di `routes.js` | Risiko endpoint lupa guard; multi-tenant single-sheet bergantung pada konsistensi guard. |
| `search.service.js` | Belum ada; search berada di `routes.js` + read helper/cache di `dashboard.js` | Search/list sulit dioptimasi dan dites terpisah. |
| `workflow.actions.js` | Belum ada; action create/edit/verify/sample/status/delete ada di `routes.js` | Workflow contract bercampur dengan entrypoint, notification, sync. |
| `notification.service.js` | Belum ada; email/Telegram builder/sender ada di `routes.js` | PII/minimalisasi/escaping dan retry sulit dikontrol terpusat. |
| `pengampu.sync.js` | Belum ada; sync spreadsheet pengampu ada di `routes.js` | Cross-spreadsheet IO bercampur dengan request path. |
| `data-access.js` / repository layer | Belum ada; akses sheet tersebar di banyak modul | Banyak `getDataRange()` dan invalidasi cache tidak konsisten. |
| `queue.worker.js` / pipeline processor eksplisit | Parsial via `pipeline.queue.js`; orchestration pipeline masih di `routes.js` | Async pipeline belum jadi boundary operasional utama. |
| `metrics/observability` module | Belum ada | Durasi request, cache hit/miss, queue pending/failed belum terukur rapi. |
| `endpoint security matrix` doc | Belum ada | Sulit memastikan semua callable function punya auth requirement jelas. |
| `dashboard.summary` materialized module | Belum ada | Dashboard masih raw-scan/cache-heavy. |
| `DX_Index` / index builder | Belum ada | Pagination/search/workflow queue masih cenderung full scan. |

### 3.2 Modul frontend yang direncanakan tapi tidak ada lagi sebagai file terpisah

`docs/MODULE-MAP.md` dan `docs/INVENTORY.md` masih menyebut beberapa file client modular yang **tidak ada** di `src/` saat audit:

- `app.init.js.html`
- `app.foundation.js.html`
- `app.search.js.html`
- `app.submit.js.html`
- `app.validation.js.html`
- `app.draft.js.html`
- `app.geo.js.html`

Kondisi aktual: concern tersebut tampaknya dikonsolidasikan kembali ke `app.js.html`. Ini membuat dokumentasi module map tidak sinkron dengan source aktual dan memperbesar risiko regresi saat edit frontend.

### 3.3 Modul print yang sudah berkembang tapi docs belum update penuh

`docs/MODULE-MAP.md` hanya menyebut `print_MR.html`, tetapi source aktual sudah memiliki:

- `print_MR.html`
- `print_DIF.html`
- `print_PERT.html`
- `print_TN.html`
- `print_AFP.html`

Artinya kemampuan print multi-DX sudah berkembang, tetapi module map/inventory perlu diperbarui.

## 4. Kesesuaian dengan CLAW.md

### 4.1 Status pembacaan CLAW.md

- `CLAW.md` tidak ditemukan di root repo `gas-pe-pd3i`.
- Pencarian lokal repo tidak menemukan file bernama `CLAW.md` atau variasi `*CLAW*`.
- Karena dokumen acuan tidak tersedia, kesesuaian dengan `CLAW.md` tidak bisa dinilai secara definitif.

### 4.2 Kesesuaian sementara dengan dokumen proyek yang tersedia

Karena `CLAW.md` absen, audit memakai dokumen internal yang tersedia sebagai proxy.

| Acuan tersedia | Kondisi saat ini | Status |
|---|---|---|
| `BLUEPRINT.md`: GAS Web App, source di `src/`, docs di `docs/` | Sesuai; `.clasp.json` rootDir `src`, docs lengkap | Sesuai |
| `ARCHITECTURE.md`: entrypoint `doGet/doPost` di `routes.js` | Sesuai | Sesuai |
| `ARCHITECTURE.md`: backend modular routes/data/auth/utils/dashboard/print/config/cache/audit | Modul ada, plus `pipeline.queue.js`, `migration.js`, `raw_schema.js`, `diagnostic.js` | Sesuai tapi docs perlu update |
| `ROLE-MATRIX.md`: role admin/petugas/viewer + role tahap-spesifik | Kode memiliki helper role/scope dan workflow stage guard | Parsial; perlu regression tests authz |
| `NEXT-STEPS.md`: cleanup raw harus non-destruktif | Tooling migration/backfill ada; dokumen menekankan backup/non-destruktif | Sesuai prinsip, eksekusi tetap perlu hati-hati |
| `MODULE-MAP.md` / `INVENTORY.md` | Tidak sinkron dengan source aktual: file modular client lama disebut tapi tidak ada; print multi-DX belum lengkap di docs | Tidak sesuai / stale |
| `DEPLOYMENT.md`: clasp workflow | `.clasp.json`, `.claspignore`, GitHub workflow ada | Sebagian sesuai; workflow deploy dari `src` perlu validasi auth `.clasprc` di CI |
| `BLUEPRINT-WORKFLOW-REDESIGN.md`: pecah `app.js.html`, API workflow eksplisit, cache queue pendek | Sebagian workflow API sudah ada; `app.js.html` tetap monolitik; cache/read strategy masih debt | Parsial |

### 4.3 Kesimpulan CLAW compliance

- **Blocked:** compliance terhadap `CLAW.md` tidak dapat disimpulkan karena file tidak ada di repo ini.
- **Dengan dokumen yang ada:** arah produk dan arsitektur inti sudah sejalan, tetapi dokumentasi inventory/module map tertinggal dari source, dan beberapa prinsip desain baru belum tercapai sepenuhnya karena monolith frontend/backend serta data access yang belum terkonsolidasi.

## 5. Technical Debt

### 5.1 Debt kritikal / P0

1. **Public anonymous web app + execute-as-deployer**
   - `src/appsscript.json` menunjukkan `access: ANYONE_ANONYMOUS` dan `executeAs: USER_DEPLOYING`.
   - Semua endpoint harus dianggap public surface.
   - Security bergantung penuh pada token/session/app-level authorization.

2. **Authorization/scope tersebar**
   - Helper akses ada, tetapi tersebar di `routes.js` dan dipakai dari berbagai jalur.
   - Single spreadsheet multi-tenant membuat bug scope berpotensi menjadi data leak.

3. **Full-sheet scan / Spreadsheet quota risk**
   - Banyak jalur masih membaca seluruh sheet (`getDataRange().getValues()`): login, search/list, dashboard, queue, batch retry, lookup tertentu.
   - Pagination dilakukan setelah read/filter in-memory, bukan storage-level.

4. **Global lock contention**
   - `doPost` dan beberapa path write/batch memakai `LockService.getScriptLock()`.
   - Jika lock dipegang terlalu lama atau meliputi integrasi eksternal, user concurrent akan antre.

5. **Plaintext PIN fallback**
   - `auth.js` mendukung `sha256:` tetapi masih menerima plaintext fallback untuk backward compatibility.
   - Perlu migration/cutoff eksplisit.

### 5.2 Debt tinggi / P1

1. **`app.js.html` monolith**
   - ±7.700 baris.
   - Menggabungkan state, navigation, form, workflow, search, admin, rendering, submit, dan local draft.
   - Modul client yang pernah direncanakan (`app.search`, `app.submit`, dll.) tidak ada sebagai file terpisah.

2. **`routes.js` monolith**
   - ±2.649 baris.
   - Menggabungkan entrypoint, routing, search, workflow action, retry, notification, sync, authz helper, dan pipeline orchestration.

3. **`style.html` sangat besar**
   - ±5.268 baris.
   - Sulit dimaintain dan berisiko konflik styling antar-workspace.

4. **Test runner tidak standar**
   - Ada test file, tetapi root `package.json` tidak ada.
   - Tidak ada satu command test/lint/syntax gate yang jelas.

5. **Integrasi eksternal belum sepenuhnya queue-first**
   - Fondasi queue ada, tetapi notification/sync masih terhubung kuat dengan `routes.js`/save/retry path.

6. **Dokumentasi module map/inventory stale**
   - `docs/INVENTORY.md` menghitung 36 file dan menyebut file yang tidak ada.
   - Source aktual memiliki file tambahan seperti print multi-DX, migration, raw schema, pipeline queue, diagnostic, dan banyak workspace partial.

### 5.3 Debt sedang / P2

1. **`src/node_modules/` untracked di source tree**
   - Dikecualikan deploy, tapi tetap mengganggu hygiene repo dan review.

2. **Audit log retention/masking belum jelas**
   - Audit log dapat menyimpan diff PII dan tumbuh besar.

3. **Cache strategy campuran**
   - Ada `Cache_Manager`, tetapi cache/invalidation belum menjadi satu akses data resmi.

4. **Dashboard raw aggregation**
   - Dashboard masih raw-data driven; materialized summary belum ada.

5. **Print token dan iframe exposure**
   - `ALLOWALL` dan print URL dengan token perlu hardening jika data sensitif.

6. **Working tree sudah berisi banyak perubahan sebelum audit ini**
   - Ada modified files di `src/` dan `tests/` yang bukan bagian dari audit dokumen ini.
   - Perlu dipisahkan antara perubahan fitur sebelumnya dan dokumen audit baru.

## 6. Prioritas Pengerjaan Berikutnya

### Prioritas 1 — Stabilkan security boundary

1. Buat `docs/ENDPOINT_SECURITY_MATRIX.md`.
2. Inventaris semua function callable via `google.script.run` dan `doPost __action`.
3. Tandai setiap function: public/authenticated/admin-only/stage-specific.
4. Tambahkan regression tests role/scope untuk read/search/detail/print/save/delete.
5. Putuskan migration/cutoff plaintext PIN fallback.

### Prioritas 2 — Rapikan repo/documentation truth

1. Perbarui `docs/INVENTORY.md` agar cocok dengan source aktual.
2. Perbarui `docs/MODULE-MAP.md` dengan modul yang benar-benar ada sekarang.
3. Catat `CLAW.md` missing sebagai blocker: buat/restore file jika memang wajib menjadi acuan proyek.
4. Bersihkan atau pindahkan `src/node_modules/` dari source tree.
5. Pisahkan dokumen audit baru dari modified code yang sudah ada di working tree.

### Prioritas 3 — Kurangi quota/performance risk

1. Audit semua `getDataRange().getValues()` dan klasifikasikan: acceptable / cache / projection / index.
2. Buat data access wrapper resmi untuk read headers, projection, lookup by key, append/update, dan cache invalidation.
3. Prioritaskan search/list/workflow queue agar tidak membaca semua kolom/baris.
4. Rancang `DX_Index` atau projection sheet untuk pagination dan workflow queue.
5. Rancang dashboard summary/materialized aggregate.

### Prioritas 4 — Ubah post-save integration menjadi queue-first

1. Jadikan `PIPELINE_QUEUE` jalur utama untuk Telegram/email/sync pengampu.
2. Kurangi durasi `ScriptLock`: lock hanya untuk critical section sheet write.
3. Tambahkan retry/backoff/status task yang eksplisit.
4. Hindari external IO saat lock masih dipegang.

### Prioritas 5 — Refactor modular bertahap

1. Pecah `routes.js` setelah tests auth/scope tersedia:
   - entrypoints
   - workflow actions
   - search service
   - notification service
   - pengampu sync
   - batch service
2. Pecah `app.js.html` menjadi modul frontend per concern:
   - core/bootstrap
   - search
   - form
   - workflow
   - admin
   - render helpers
3. Pecah CSS besar jika sudah ada baseline visual/regression check.

## 7. Status Working Tree Saat Audit

Sebelum dokumen ini dibuat, repository sudah memiliki perubahan tidak ter-commit berikut:

```text
 M src/app.dashboard.js.html
 M src/app.js.html
 M src/auth.js.html
 M src/config_DIF.html
 M src/login.html
 M src/print_AFP.html
 M src/print_DIF.html
 M src/print_MR.html
 M src/print_PERT.html
 M src/print_TN.html
 M src/utils.js
 M src/utils.js.html
 M tests/app.workflow.test.js
?? docs/CURRENT_ARCHITECTURE.md
?? docs/NEXT_SPRINT_PLAN.md
?? docs/PERFORMANCE_REVIEW.md
?? docs/SECURITY_REVIEW.md
?? docs/TECHNICAL_DEBT.md
?? src/node_modules/
```

Dokumen ini menambah satu file baru:

```text
?? docs/CURRENT_STATE.md
```

Tidak ada perubahan kode yang dilakukan dalam audit ini.

## 8. Kesimpulan

Repository sudah cukup matang dari sisi cakupan produk dan dokumentasi domain: ada blueprint, role matrix, deployment notes, raw schema audit, UAT, dan health-check docs. Aplikasi juga sudah memiliki modul penting untuk auth, data, dashboard, print, audit, cache, migration, dan pipeline queue.

Namun kondisi saat ini menunjukkan tiga masalah utama:

1. **Security boundary harus diprioritaskan** karena web app public anonymous berjalan sebagai deployer.
2. **Maintainability turun** karena frontend/backend monolith dan dokumentasi module map tidak sinkron dengan source.
3. **Performance/quota risk meningkat** karena spreadsheet read masih banyak full-scan dan integrasi eksternal belum sepenuhnya queue-first.

Rekomendasi paling aman: jangan lanjut feature development dulu. Selesaikan security inventory + role/scope tests, sinkronkan dokumentasi aktual, lalu mulai refactor data access/search secara bertahap.
