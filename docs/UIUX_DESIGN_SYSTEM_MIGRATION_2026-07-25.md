# UI/UX Design System Migration — 2026-07-25

## Tujuan

Menyamakan bahasa visual seluruh halaman SIMPEL Surveilans tanpa mengubah workflow, hak akses, atau kontrak server.

## Baseline audit

Sumber desain saat ini:

- `src/Views/style.html` — design system shell utama, sekitar 17.553 baris.
- `src/SARS/style.html` — design system SARS standalone terpisah, 372 baris.
- `src/SARS/index.html` — inline override SARS form.
- `src/SARS/index_dashboard.html` — inline dashboard SARS.
- `src/Views/workspace_pie.html` — CSS khusus PIE.
- `src/Views/workspace_settings.html` — CSS khusus Administrasi.
- `src/Views/workspace_sars.html` — inline style/runtime style SARS workspace.

## Temuan utama

1. Shell utama memakai token `--pd3i-*`, `--space-*`, `--radius-*`, dan `--font-*`.
2. SARS standalone memakai token `--gs-*`, `--primary`, `--radius`, dan `--shadow`.
3. SARS standalone memakai font Roboto dan komponen Google Sites-like; shell utama memakai Inter/system.
4. PIE dan Administrasi memiliki CSS lokal sehingga detail card, tabel, modal, dan spacing dapat berbeda.
5. Route `?workspace=...` hanya memilih workspace; route bukan sumber perbedaan visual.

## Prinsip migrasi

- Satu sumber token global.
- Komponen boleh punya variasi fungsi, bukan variasi bahasa visual.
- CSS workspace tetap scoped agar tidak merusak halaman lain.
- Tidak mengubah API/server/workflow dalam batch desain.
- Desktop dan mobile wajib diperiksa.
- Production tidak disentuh; validasi/deploy hanya Development setelah batch lulus.

## Token canonical sementara

Sumber canonical: `src/Views/style.html`.

Token utama:

- warna: `--pd3i-bg`, `--pd3i-surface`, `--pd3i-border`, `--pd3i-text`, `--pd3i-muted`, `--pd3i-primary`
- spacing: `--space-1` sampai `--space-7`
- radius: `--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-card`, `--radius-pill`
- shadow: `--pd3i-shadow`, `--pd3i-shadow-soft`

## Tahap kerja

### Batch 1 — baseline dan token bridge

Status: berjalan.

- Dokumentasikan audit dan aturan migrasi.
- Tambahkan bridge token untuk SARS agar token lama memetakan ke token canonical.
- Belum menghapus selector lama; ini menjaga kompatibilitas dan memudahkan rollback.

### Batch 2 — SARS standalone

Target:

- samakan font, warna, container, radius, shadow, input, button, card;
- hapus override duplikat bertahap setelah visual check;
- cek form dan dashboard pada mobile.

### Batch 3 — workspace lokal

Target:

- pindahkan/normalisasi CSS PIE, Administrasi, dan SARS workspace;
- gunakan token canonical tanpa mengubah markup/fungsi.

### Batch 4 — verifikasi

- `npm test`
- hygiene dan endpoint check
- browser screenshot desktop/mobile
- commit dan deploy Development
- catat deployment/hash di dokumen progres.

## Log perubahan

| Waktu UTC | Batch | Perubahan | Status |
|---|---|---|---|
| 2026-07-25 | Audit | Inventarisasi HTML, CSS inline, token, dan workspace | selesai |
| 2026-07-25 | Batch 1 | Dokumentasi migration baseline | selesai |
| 2026-07-25 | Batch 1 | Token bridge SARS | selesai |
| 2026-07-25 | Batch 2 | SARS shared tokens: palette, font, radius, shadow | selesai; Development @1348 |
| 2026-07-26 | Batch 3 | PIE choice/card/KPI/insight memakai token canonical | selesai lokal |
| 2026-07-26 | Batch 3 | Administrasi stats/table/modal memakai token canonical | selesai lokal |
| 2026-07-26 | Batch 3 | Regression assertion diubah dari literal hex ke token design system | selesai |
| 2026-07-26 | Batch 4 | SARS workspace inline banner memakai class canonical; runtime `style.cssText` dihapus | selesai lokal |

## Catatan teknis Batch 4

- Ditambahkan `.pd3i-sars-inline-banner` ke `src/Views/style.html`.
- Banner SARS memakai state `.is-info`, `.is-success`, dan `.is-error`.
- Inline geometry/style runtime dihapus dari `src/Views/workspace_sars.html`.
- Tone semantic tetap dipertahankan.
- Tidak mengubah submit, validasi, session, atau workflow SARS.

| 2026-07-26 | Batch 5 | Form/Input memakai semantic icon tokens; utility warna literal diganti | selesai lokal |

## Catatan teknis Batch 5

- Ditambahkan `.pd3i-icon-primary` dan `.pd3i-icon-warning` ke `src/Views/style.html`.
- `workspace_form.html` dan `workspace_input_form.html` memakai class semantic untuk icon.
- Struktur form, selector ID, onclick submit, dan alur draft tetap sama.

| 2026-07-26 | Batch 6 | Daftar Kasus toolbar dan results panel memakai surface/border/shadow token canonical | selesai lokal |

## Catatan teknis Batch 6

- `workspace_search.html` tidak memerlukan perubahan markup.
- `.pd3i-search-toolbar` memakai `--pd3i-border`, `--pd3i-surface-soft`, dan `--pd3i-shadow-sm`.
- `.pd3i-search-results-panel` memakai `--pd3i-border` dan `--pd3i-surface`.
- `.pd3i-search-sort-select` memakai `--pd3i-surface`.
- Gradient dan rgba lokal di area Daftar Kasus dihapus; filter, sorting, hasil, dan aksi kasus tetap sama.


## Catatan teknis Batch 3

- Perubahan scoped di `#section-pie`, `.account-approval-*`, dan `.account-review-*`.
- Tidak mengubah markup, event handler, API, hak akses, atau workflow.
- Warna khusus status tetap dipertahankan karena membawa makna semantik.
- Test sebelumnya mengunci string CSS hex lama; assertion diperbarui agar mengunci penggunaan token canonical.
- Visual browser belum dapat divalidasi pada batch ini karena browser automation belum memiliki sesi login aplikasi. HTTP smoke test tetap dilakukan setelah deploy.

