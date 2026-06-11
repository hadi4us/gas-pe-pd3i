# Refactor Report — Struktur Project GAS PE PD3I

Tanggal: 2026-06-11  
Scope: refactoring struktur folder, naming convention, dan maintainability tanpa mengubah business logic.

## 1. Acuan

- `docs/CURRENT_STATE.md` tersedia dan dipakai sebagai acuan kondisi repo saat ini.
- `CLAW.md` tidak ditemukan di repository saat refactor dilakukan. Kondisi ini konsisten dengan catatan audit di `docs/CURRENT_STATE.md`.
- Target struktur dari instruksi:

```text
src/
├── Core/
├── Auth/
├── DataWarehouse/
├── Finance/
├── BPJS/
├── Pharmacy/
├── AI/
├── Controllers/
└── Views/
```

## 2. Prinsip Refactor

1. Tidak mengubah business logic.
2. Perubahan utama berupa pemindahan file ke folder domain yang lebih jelas.
3. Nama file dipertahankan sejauh mungkin agar riwayat git dan konteks kode tetap mudah dilacak.
4. Referensi template/include disesuaikan agar kompatibel dengan struktur subfolder.
5. Folder target yang belum memiliki modul implementasi dibuat dengan `.gitkeep` agar struktur tetap eksplisit.

## 3. Struktur Baru

```text
src/
├── AI/
│   └── .gitkeep
├── Auth/
│   ├── auth.js
│   ├── auth.js.html
│   ├── login.html
│   └── pin.html
├── BPJS/
│   └── .gitkeep
├── Controllers/
│   ├── dashboard.js
│   ├── print.js
│   ├── routes.js
│   └── routes.test.js
├── Core/
│   ├── audit.js
│   ├── audit.test.js
│   ├── cache.js
│   ├── config.js
│   ├── diagnostic.js
│   ├── main.js
│   ├── migration.js
│   ├── raw_schema.js
│   └── utils.js
├── DataWarehouse/
│   ├── data.js
│   └── pipeline.queue.js
├── Finance/
│   └── .gitkeep
├── Pharmacy/
│   └── .gitkeep
├── Views/
│   ├── app.dashboard.js.html
│   ├── app.js.html
│   ├── app.workflow.test.js
│   ├── config_AFP.html
│   ├── config_common.html
│   ├── config_DIF.html
│   ├── config_MR.html
│   ├── config_PERT.html
│   ├── config_registry.html
│   ├── config_TN.html
│   ├── index.html
│   ├── print_AFP.html
│   ├── print_DIF.html
│   ├── print_MR.html
│   ├── print_PERT.html
│   ├── print_TN.html
│   ├── style.html
│   ├── utils.js.html
│   └── workspace_*.html
├── appsscript.json
├── .clasp.json
└── .claspignore
```

## 4. Mapping File

### Core

| Sebelum | Sesudah | Alasan |
|---|---|---|
| `src/main.js` | `src/Core/main.js` | Entry/helper core Apps Script. |
| `src/utils.js` | `src/Core/utils.js` | Utility global, session helper, include helper. |
| `src/config.js` | `src/Core/config.js` | Konfigurasi aplikasi. |
| `src/cache.js` | `src/Core/cache.js` | Cache helper. |
| `src/audit.js` | `src/Core/audit.js` | Audit logging core. |
| `src/diagnostic.js` | `src/Core/diagnostic.js` | Diagnostic/admin maintenance helper. |
| `src/migration.js` | `src/Core/migration.js` | Migration/repair tooling. |
| `src/raw_schema.js` | `src/Core/raw_schema.js` | Canonical raw schema. |
| `src/audit.test.js` | `src/Core/audit.test.js` | Test modul audit mengikuti file sumbernya. |

### Auth

| Sebelum | Sesudah | Alasan |
|---|---|---|
| `src/auth.js` | `src/Auth/auth.js` | Backend autentikasi/otorisasi sesi. |
| `src/auth.js.html` | `src/Auth/auth.js.html` | Client auth flow. |
| `src/login.html` | `src/Auth/login.html` | View login. |
| `src/pin.html` | `src/Auth/pin.html` | View ubah password/PIN. |

### DataWarehouse

| Sebelum | Sesudah | Alasan |
|---|---|---|
| `src/data.js` | `src/DataWarehouse/data.js` | Data access, serialization, raw sheet write/read. |
| `src/pipeline.queue.js` | `src/DataWarehouse/pipeline.queue.js` | Queue/pipeline persistence. |

### Controllers

| Sebelum | Sesudah | Alasan |
|---|---|---|
| `src/routes.js` | `src/Controllers/routes.js` | Web endpoint, API routing, workflow controller. |
| `src/dashboard.js` | `src/Controllers/dashboard.js` | Dashboard/workflow inbox controller. |
| `src/print.js` | `src/Controllers/print.js` | Print/PDF endpoint controller. |
| `src/routes.test.js` | `src/Controllers/routes.test.js` | Test controller mengikuti source. |

### Views

| Sebelum | Sesudah | Alasan |
|---|---|---|
| `src/index.html` | `src/Views/index.html` | Shell utama UI. |
| `src/style.html` | `src/Views/style.html` | Style UI. |
| `src/utils.js.html` | `src/Views/utils.js.html` | Client utility script. |
| `src/app.js.html` | `src/Views/app.js.html` | Client app utama. |
| `src/app.dashboard.js.html` | `src/Views/app.dashboard.js.html` | Client dashboard. |
| `src/config_*.html` | `src/Views/config_*.html` | Konfigurasi client per DX/common. |
| `src/workspace_*.html` | `src/Views/workspace_*.html` | Partial workspace UI. |
| `src/print_*.html` | `src/Views/print_*.html` | Template print per DX. |
| `src/app.workflow.test.js` | `src/Views/app.workflow.test.js` | Test client/workflow mengikuti view utama. |

### Folder Cadangan Domain

| Folder | Status | Catatan |
|---|---|---|
| `src/Finance/` | `.gitkeep` | Disiapkan untuk modul finansial bila nanti ada scope finance. |
| `src/BPJS/` | `.gitkeep` | Disiapkan untuk integrasi/modul BPJS bila nanti ada. |
| `src/Pharmacy/` | `.gitkeep` | Disiapkan untuk modul farmasi bila nanti ada. |
| `src/AI/` | `.gitkeep` | Disiapkan untuk modul AI/automation bila nanti ada. |

## 5. Penyesuaian Teknis

### 5.1 HTML include/template resolver

Sebelumnya Apps Script helper memakai nama file flat:

```js
HtmlService.createHtmlOutputFromFile(filename)
HtmlService.createTemplateFromFile("index")
```

Setelah file HTML dipindah ke subfolder, helper di `src/Core/utils.js` ditambah:

- `resolveHtmlFileName_(filename)`
- `include(filename)` sekarang resolve ke `Views/<filename>`, `Auth/<filename>`, lalu fallback ke nama asli.
- `createTemplateFromFile_(filename)` untuk template utama/print.

Perubahan ini menjaga business logic tetap sama, hanya menyesuaikan lookup file setelah struktur folder berubah.

### 5.2 Controller template calls

- `src/Controllers/routes.js` memakai `createTemplateFromFile_("index")`.
- `src/Controllers/print.js` memakai `createTemplateFromFile_(templateName)`.

### 5.3 Test fixture paths

`tests/app.workflow.test.js` diperbarui agar membaca file dari folder baru:

- `src/Views/*`
- `src/Auth/*`
- `src/Controllers/*`
- `src/Core/*`
- `src/DataWarehouse/*`

## 6. Naming Convention

- Folder memakai PascalCase sesuai target: `Core`, `Auth`, `DataWarehouse`, `Finance`, `BPJS`, `Pharmacy`, `AI`, `Controllers`, `Views`.
- Nama file legacy dipertahankan untuk menghindari perubahan business logic dan memudahkan diff/review.
- Prefix existing tetap dipakai:
  - `workspace_*.html` untuk partial workspace.
  - `print_*.html` untuk template print diagnosis.
  - `config_*.html` untuk konfigurasi client per DX/common.
  - `*.test.js` tetap berdampingan dengan domain module terkait.

## 7. Maintainability Improvement

1. Batas domain lebih jelas:
   - Auth terpisah dari UI utama dan controller.
   - DataWarehouse memisahkan data access/queue dari routing.
   - Controllers menjadi tempat endpoint/API orchestration.
   - Views menampung semua template/client partial.
2. Refactor berikutnya bisa dilakukan bertahap per folder tanpa menambah kebingungan di root `src`.
3. Folder domain kosong (`Finance`, `BPJS`, `Pharmacy`, `AI`) tersedia sebagai extension point tanpa mencampur modul baru ke root.
4. Test path sudah ikut struktur baru, sehingga regression test tetap bisa menjadi safety net.

## 8. Validasi

Command yang dijalankan:

```bash
node --test tests/app.workflow.test.js
```

Hasil:

```text
# tests 44
# pass 44
# fail 0
```

Pemeriksaan tambahan:

- `grep -R "createTemplateFromFile\|createHtmlOutputFromFile" -n src --exclude-dir=node_modules` memastikan call template/include yang relevan sudah lewat resolver baru.
- `find src -maxdepth 2 -type f` memastikan struktur target sudah terbentuk.

## 9. Catatan Risiko / Follow-up

1. `CLAW.md` masih tidak tersedia, jadi compliance terhadap dokumen itu belum dapat diverifikasi.
2. `src/node_modules/` masih ada sebagai untracked folder dari kondisi sebelumnya. Folder ini sudah di-ignore oleh `.claspignore`, tetapi tetap sebaiknya dibersihkan dari tree kerja pada langkah hygiene terpisah.
3. Refactor ini belum memecah monolith `app.js.html`, `routes.js`, atau `style.html` secara internal. Itu sengaja ditunda agar tidak mengubah business logic.
4. Bila deploy via clasp memakai environment yang tidak mendukung subfolder, fallback plan adalah membuat wrapper flat atau menyesuaikan build step. Dengan `.clasp.json` saat ini (`skipSubdirectories: false`), struktur subfolder memang dimaksudkan untuk ikut ter-push.

## 10. Kesimpulan

Refactoring struktur project sudah dilakukan sesuai target folder. Business logic dipertahankan; perubahan kode hanya berupa resolver template/include dan update path test agar aplikasi tetap dapat menemukan file setelah dipindahkan. Regression test Node yang tersedia lulus 44/44.
