# Schema Recommendation Cleanup Result

- Applied at: 2026-05-12T04:28:56.003Z
- Mode: live mutation via temporary read-only/repair Apps Script endpoint with per-sheet backup.
- Sensitive values were not written into this report.

## Summary

| Sheet | Backup | Appended canonical headers | Variant groups repaired | Blocked blank headers | Final rows | Final cols |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| `MR_Raw` | `MR_Raw_PRE_SCHEMA_RECOMMENDATION_REPAIR_20260512_112733` | 7 | 7 | 0 | 1418 | 226 |
| `DIF_Raw` | `DIF_Raw_PRE_SCHEMA_RECOMMENDATION_REPAIR_20260512_112811` | 14 | 4 | 0 | 4 | 236 |
| `PERT_Raw` | `PERT_Raw_PRE_SCHEMA_RECOMMENDATION_REPAIR_20260512_112822` | 14 | 4 | 1 | 5 | 189 |
| `TN_Raw` | `TN_Raw_PRE_SCHEMA_RECOMMENDATION_REPAIR_20260512_112833` | 14 | 6 | 0 | 1 | 265 |
| `AFP_Raw` | `AFP_Raw_PRE_SCHEMA_RECOMMENDATION_REPAIR_20260512_112846` | 14 | 3 | 0 | 4 | 251 |

## Details

### MR_Raw

- Backup: `MR_Raw_PRE_SCHEMA_RECOMMENDATION_REPAIR_20260512_112733`
- Appended canonical headers: 7
- Variant groups repaired: 7
- Blocked blank headers: 0

**Appended headers:**

- `Edited At`
- `Edited By`
- `Edit Reason`
- `Edit Diff Summary`
- `Edit Inputan Perlu Review Ulang`
- `Edit Inputan Review Note`
- `Rincian Hasil Sampel`

**Repaired variant duplicate columns:**

| Target canonical | Deleted source headers | Filled cells | Cleared source cells |
| --- | --- | ---: | ---: |
| `DX` | `dx` | 0 | 1417 |
| `Nama orang tua/wali` | `Nama Orang Tua/Wali` | 0 | 1417 |
| `Tanggal mulai demam` | `Tanggal Mulai Demam` | 0 | 1417 |
| `Tanggal mulai ruam` | `Tanggal Mulai Ruam` | 0 | 1417 |
| `Mata merah` | `Mata Merah` | 0 | 444 |
| `Umur kehamilan` | `Umur Kehamilan` | 0 | 2 |
| `Tanggal Pulang` | `Tanggal pulang` | 0 | 91 |

### DIF_Raw

- Backup: `DIF_Raw_PRE_SCHEMA_RECOMMENDATION_REPAIR_20260512_112811`
- Appended canonical headers: 14
- Variant groups repaired: 4
- Blocked blank headers: 0

**Appended headers:**

- `Workflow Current Queue`
- `Workflow Current Label`
- `Status Proses Verifikasi EPID`
- `Status Proses Pemeriksaan`
- `Status Proses Pemantauan`
- `Status Proses Perbaikan`
- `Workflow Selesai`
- `Edited At`
- `Edited By`
- `Edit Reason`
- `Edit Diff Summary`
- `Edit Inputan Perlu Review Ulang`
- `Edit Inputan Review Note`
- `Rincian Hasil Sampel`

**Repaired variant duplicate columns:**

| Target canonical | Deleted source headers | Filled cells | Cleared source cells |
| --- | --- | ---: | ---: |
| `DX` | `dx` | 3 | 3 |
| `Nama orang tua/wali` | `Nama Orang Tua/Wali` | 3 | 3 |
| `Keluhan Utama` | `Keluhan utama` | 3 | 3 |
| `Status Gizi` | `Status gizi` | 1 | 1 |

### PERT_Raw

- Backup: `PERT_Raw_PRE_SCHEMA_RECOMMENDATION_REPAIR_20260512_112822`
- Appended canonical headers: 14
- Variant groups repaired: 4
- Blocked blank headers: 1

**Appended headers:**

- `Workflow Current Queue`
- `Workflow Current Label`
- `Status Proses Verifikasi EPID`
- `Status Proses Pemeriksaan`
- `Status Proses Pemantauan`
- `Status Proses Perbaikan`
- `Workflow Selesai`
- `Edited At`
- `Edited By`
- `Edit Reason`
- `Edit Diff Summary`
- `Edit Inputan Perlu Review Ulang`
- `Edit Inputan Review Note`
- `Rincian Hasil Sampel`

**Repaired variant duplicate columns:**

| Target canonical | Deleted source headers | Filled cells | Cleared source cells |
| --- | --- | ---: | ---: |
| `DX` | `dx` | 4 | 4 |
| `Nama orang tua/wali` | `Nama Orang Tua/Wali` | 4 | 4 |
| `Tanggal Masuk Rawat Inap` | `Tanggal masuk rawat inap` | 2 | 2 |
| `Tanggal Keluar` | `Tanggal keluar` | 2 | 2 |

**Blocked blank headers:**

| Column | Non-empty cells | Row samples | Reason |
| ---: | ---: | --- | --- |
| 179 | 1 | 4 | Not auto-deleted because data exists under blank header. |

### TN_Raw

- Backup: `TN_Raw_PRE_SCHEMA_RECOMMENDATION_REPAIR_20260512_112833`
- Appended canonical headers: 14
- Variant groups repaired: 6
- Blocked blank headers: 0

**Appended headers:**

- `Workflow Current Queue`
- `Workflow Current Label`
- `Status Proses Verifikasi EPID`
- `Status Proses Pemeriksaan`
- `Status Proses Pemantauan`
- `Status Proses Perbaikan`
- `Workflow Selesai`
- `Edited At`
- `Edited By`
- `Edit Reason`
- `Edit Diff Summary`
- `Edit Inputan Perlu Review Ulang`
- `Edit Inputan Review Note`
- `Rincian Hasil Sampel`

**Repaired variant duplicate columns:**

| Target canonical | Deleted source headers | Filled cells | Cleared source cells |
| --- | --- | ---: | ---: |
| `DX` | `dx` | 0 | 0 |
| `Nama orang tua/wali` | `Nama Orang Tua/Wali` | 0 | 0 |
| `Pekerjaan ibu` | `Pekerjaan Ibu` | 0 | 0 |
| `Pendidikan ibu` | `Pendidikan Ibu` | 0 | 0 |
| `Tempat pemeriksaan ibu hamil` | `Tempat pemeriksaan Ibu Hamil` | 0 | 0 |
| `Tempat persalinan lainnya` | `Tempat persalinan - Lainnya` | 0 | 0 |

### AFP_Raw

- Backup: `AFP_Raw_PRE_SCHEMA_RECOMMENDATION_REPAIR_20260512_112846`
- Appended canonical headers: 14
- Variant groups repaired: 3
- Blocked blank headers: 0

**Appended headers:**

- `Workflow Current Queue`
- `Workflow Current Label`
- `Status Proses Verifikasi EPID`
- `Status Proses Pemeriksaan`
- `Status Proses Pemantauan`
- `Status Proses Perbaikan`
- `Workflow Selesai`
- `Edited At`
- `Edited By`
- `Edit Reason`
- `Edit Diff Summary`
- `Edit Inputan Perlu Review Ulang`
- `Edit Inputan Review Note`
- `Rincian Hasil Sampel`

**Repaired variant duplicate columns:**

| Target canonical | Deleted source headers | Filled cells | Cleared source cells |
| --- | --- | ---: | ---: |
| `DX` | `dx` | 3 | 3 |
| `Nama orang tua/wali` | `Nama Orang Tua/Wali` | 3 | 3 |
| `Nomor Rekam Medik` | `Nomor rekam medik` | 1 | 1 |

## Post-apply verification

The apply response included a fresh after-plan audit:

| Sheet | Missing append candidates | Variant repair candidates | Blocked blank headers | Columns |
| --- | ---: | ---: | ---: | ---: |
| `MR_Raw` | 0 | 0 | 0 | 226 |
| `DIF_Raw` | 0 | 0 | 0 | 236 |
| `PERT_Raw` | 0 | 0 | 1 | 189 |
| `TN_Raw` | 0 | 0 | 0 | 265 |
| `AFP_Raw` | 0 | 0 | 0 | 251 |

## Remaining work

- `PERT_Raw` column 179 remains a blank-header column with 1 non-empty cell (row sample: 4). It was intentionally blocked from automatic deletion until the value can be mapped to a canonical header without overwrite risk.
- Non-canonical legacy/manual/import columns that are not case/format variants remain for separate field-by-field mapping; no mass delete was performed.
