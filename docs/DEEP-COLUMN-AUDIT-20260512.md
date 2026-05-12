# Deep Spreadsheet Column Audit

- Dibuat: 2026-05-12 11:25:45
- Sumber: live Spreadsheet via temporary read-only Apps Script endpoint.
- Scope detail kolom: sheet aktif non-backup + `*_Raw` utama. Sheet backup dicatat di inventaris, tidak diaudit mendalam supaya laporan fokus ke operasional aktif.
- Privasi: laporan ini hanya berisi nama header, nomor kolom, hitungan isi, tipe terduga, dan nomor baris contoh; tidak menyertakan nilai sel pasien/kontak/alamat.

## Inventory Spreadsheet

Total sheet live: **27**

| Sheet | Rows | Cols | Raw utama | Backup |
| --- | ---: | ---: | :---: | :---: |
| `LOG_NOTIF` | 623 | 10 |  |  |
| `REF_USER` | 271 | 10 |  |  |
| `REF_PENGAMPU` | 64 | 18 |  |  |
| `REF_USER_PRE_REPAIR_20260419_135147` | 271 | 9 |  | yes |
| `REF_PENGAMPU_PRE_REPAIR_20260419_135147` | 64 | 11 |  | yes |
| `AUDIT_LOG` | 156 | 9 |  |  |
| `LOG_EDIT` | 13 | 9 |  |  |
| `REF_IMUN` | 27 | 22 |  |  |
| `REF_FASKES` | 270 | 10 |  |  |
| `REF_WILAYAH` | 83763 | 8 |  |  |
| `REF_USER_LEGACY_20260419_134851` | 271 | 9 |  |  |
| `REF_PENGAMPU_LEGACY_20260419_134851` | 64 | 16 |  |  |
| `SARS` | 775 | 25 |  |  |
| `MR_Raw` | 1418 | 226 | yes |  |
| `MR_Raw_PRE_MIGRATE_20260508_171531` | 33 | 220 |  | yes |
| `DIF_Raw` | 4 | 226 | yes |  |
| `PE_Trend` | 7 | 6 |  |  |
| `Analisis_PE` | 125 | 6 |  |  |
| `PE_AttackRate` | 25 | 7 |  |  |
| `Populasi` | 124 | 67 |  |  |
| `AFP_Raw` | 4 | 240 | yes |  |
| `PERT_Raw` | 5 | 179 | yes |  |
| `TN_Raw` | 1 | 257 | yes |  |
| `EWS` | 1 | 10 |  |  |
| `MR_Raw_PRE_DUPLICATE_HEADER_REPAIR_20260512_094228` | 1418 | 236 |  | yes |
| `MR_Raw_PRE_MR_GEJALA_DUPLICATE_REPAIR_20260512_095441` | 1418 | 229 |  | yes |
| `MR_Raw_PRE_MR_KOMP_DUPLICATE_REPAIR_20260512_100255` | 1418 | 227 |  | yes |

## Ringkasan Audit Kolom Aktif

| Sheet | Rows | Cols | Missing canonical | Blank header | Blank + data | Non-canonical + data | Alias live | Exact dup | Variant dup | Alias action |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `LOG_NOTIF` | 623 | 10 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `REF_USER` | 271 | 10 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `REF_PENGAMPU` | 64 | 18 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `AUDIT_LOG` | 156 | 9 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `LOG_EDIT` | 13 | 9 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `REF_IMUN` | 27 | 22 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `REF_FASKES` | 270 | 10 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `REF_WILAYAH` | 83763 | 8 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `SARS` | 775 | 25 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `PE_Trend` | 7 | 6 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `Analisis_PE` | 125 | 6 | 0 | 5 | 5 | 0 | 0 | 0 | 0 | 0 |
| `PE_AttackRate` | 25 | 7 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `Populasi` | 124 | 67 | 0 | 65 | 65 | 0 | 0 | 0 | 0 | 0 |
| `EWS` | 1 | 10 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `MR_Raw` | 1418 | 226 | 7 | 0 | 0 | 48 | 1 | 0 | 7 | 0 |
| `DIF_Raw` | 4 | 226 | 14 | 0 | 0 | 50 | 0 | 0 | 4 | 0 |
| `PERT_Raw` | 5 | 179 | 14 | 1 | 1 | 29 | 4 | 0 | 4 | 0 |
| `TN_Raw` | 1 | 257 | 14 | 0 | 0 | 0 | 0 | 0 | 5 | 0 |
| `AFP_Raw` | 4 | 240 | 14 | 0 | 0 | 43 | 1 | 0 | 3 | 0 |

## Temuan Utama

1. **Tidak ada exact duplicate header** di seluruh `*_Raw` utama setelah cleanup sebelumnya.
2. **Masih ada 1 blank header berisi data**: `PERT_Raw` kolom 179, 1 sel terisi, baris pertama terdeteksi row 4. Ini tetap harus diblokir dari auto-delete sampai dipetakan manual/aman.
3. **Semantic/case-variant duplicate masih ada** di beberapa raw sheet. Sebagian aman secara nilai (conflict 0), tapi perlu keputusan canonical per diagnosis sebelum merge.
4. **Missing canonical workflow/edit fields** masih ada terutama `DIF_Raw`, `PERT_Raw`, `TN_Raw`, `AFP_Raw` (14 kolom per sheet). `MR_Raw` tinggal 7 kolom canonical yang belum ada.
5. **Non-canonical dengan data** banyak muncul dari kolom migrasi/legacy/manual-form fields. Tidak boleh dihapus massal; harus dipetakan ke canonical atau dimasukkan ke schema jika memang masih dipakai.
6. Sheet non-raw aktif umumnya bersih dari duplicate header; pengecualian `Analisis_PE` dan `Populasi` punya banyak blank header berisi data, kemungkinan struktur tabel analitik/crosstab, bukan raw schema.

## Detail Temuan Raw Sheet

### MR_Raw

- Rows/cols: 1418 / 226
- Missing canonical: 7
- Blank header dengan data: 0
- Non-canonical dengan data: 48
- Legacy alias live: 1
- Exact duplicate group: 0
- Variant duplicate group: 7

**Missing canonical headers:**

- `Edited At`
- `Edited By`
- `Edit Reason`
- `Edit Diff Summary`
- `Edit Inputan Perlu Review Ulang`
- `Edit Inputan Review Note`
- `Rincian Hasil Sampel`

**Legacy alias live:**

| Col | Header alias | Target | Non-empty |
| ---: | --- | --- | ---: |
| 195 | `Kontak Erat` | `KontakEratJSON` | 0 |

**Case/format variant duplicate groups:**

| Normalized | Headers | Cols | Non-empty by col | Conflict rows | Fillable rows | Same rows |
| --- | --- | --- | --- | ---: | ---: | ---: |
| `dx` | `DX`, `dx` | 5, 161 | 1417, 1417 | 0 | 0 | 1417 |
| `nama orang tua/wali` | `Nama orang tua/wali`, `Nama Orang Tua/Wali` | 32, 164 | 1417, 1417 | 0 | 0 | 1417 |
| `tanggal mulai demam` | `Tanggal mulai demam`, `Tanggal Mulai Demam` | 53, 170 | 1417, 1417 | 0 | 0 | 1417 |
| `tanggal mulai ruam` | `Tanggal mulai ruam`, `Tanggal Mulai Ruam` | 55, 171 | 1417, 1417 | 0 | 0 | 1417 |
| `mata merah` | `Mata merah`, `Mata Merah` | 58, 172 | 444, 444 | 0 | 0 | 444 |
| `umur kehamilan` | `Umur kehamilan`, `Umur Kehamilan` | 64, 173 | 2, 2 | 0 | 0 | 2 |
| `tanggal pulang` | `Tanggal Pulang`, `Tanggal pulang` | 82, 190 | 91, 91 | 0 | 0 | 91 |

**Top non-canonical columns with data (25 terbesar):**

| Col | Header | Non-empty | Fill % | Type | Flags |
| ---: | --- | ---: | ---: | --- | --- |
| 161 | `dx` | 1417 | 100 | text | non_canonical_with_data, case_or_format_variant_header |
| 162 | `Klasifikasi` | 1417 | 100 | text | non_canonical_with_data |
| 164 | `Nama Orang Tua/Wali` | 1417 | 100 | text | non_canonical_with_data, case_or_format_variant_header, formula_like_values |
| 165 | `No Telp/WA Orang Tua/Wali` | 1417 | 100 | numeric | non_canonical_with_data, formula_like_values |
| 166 | `Petugas` | 1417 | 100 | text | non_canonical_with_data, formula_like_values |
| 167 | `Provinsi unit pelapor` | 1417 | 100 | text | non_canonical_with_data |
| 170 | `Tanggal Mulai Demam` | 1417 | 100 | date | non_canonical_with_data, case_or_format_variant_header |
| 171 | `Tanggal Mulai Ruam` | 1417 | 100 | date | non_canonical_with_data, case_or_format_variant_header |
| 192 | `KontakEratJSON` | 1417 | 100 | jsonish | non_canonical_with_data |
| 222 | `MR_Raw_migrate__BLANK_COL_90` | 1417 | 100 | numeric | non_canonical_with_data |
| 223 | `MR_Raw_migrate__BLANK_COL_91` | 1417 | 100 | numeric | non_canonical_with_data |
| 168 | `Kab/Kota unit pelapor` | 1416 | 99.93 | text | non_canonical_with_data |
| 169 | `Link PDF` | 1413 | 99.72 | url | non_canonical_with_data |
| 183 | `Rawat inap?` | 1362 | 96.12 | booleanish | non_canonical_with_data |
| 191 | `Keadaan saat ini` | 1340 | 94.57 | text | non_canonical_with_data |
| 186 | `Pemberian vitamin A?` | 1307 | 92.24 | booleanish | non_canonical_with_data |
| 184 | `Riwayat Imunisasi` | 1174 | 82.85 | jsonish | non_canonical_with_data |
| 193 | `Ringkasan Riwayat Imunisasi` | 1174 | 82.85 | text | non_canonical_with_data |
| 211 | `Imunisasi campak-rubela dosis 1` | 1172 | 82.71 | booleanish | non_canonical_with_data |
| 213 | `Imunisasi campak-rubela dosis 2` | 1115 | 78.69 | booleanish | non_canonical_with_data |
| 187 | `Ada kasus sekitar?` | 977 | 68.95 | booleanish | non_canonical_with_data |
| 212 | `Sumber Informasi (Dosis 1)` | 939 | 66.27 | text | non_canonical_with_data |
| 188 | `Berpergian 1 bulan terakhir?` | 916 | 64.64 | booleanish | non_canonical_with_data |
| 214 | `Sumber Informasi (Dosis 2)` | 860 | 60.69 | text | non_canonical_with_data |
| 215 | `Imunisasi campak-rubela saat BIAS` | 832 | 58.72 | text | non_canonical_with_data |

### DIF_Raw

- Rows/cols: 4 / 226
- Missing canonical: 14
- Blank header dengan data: 0
- Non-canonical dengan data: 50
- Legacy alias live: 0
- Exact duplicate group: 0
- Variant duplicate group: 4

**Missing canonical headers:**

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

**Case/format variant duplicate groups:**

| Normalized | Headers | Cols | Non-empty by col | Conflict rows | Fillable rows | Same rows |
| --- | --- | --- | --- | ---: | ---: | ---: |
| `dx` | `DX`, `dx` | 5, 165 | 0, 3 | 0 | 3 | 0 |
| `nama orang tua/wali` | `Nama orang tua/wali`, `Nama Orang Tua/Wali` | 32, 172 | 0, 3 | 0 | 3 | 0 |
| `keluhan utama` | `Keluhan Utama`, `Keluhan utama` | 61, 179 | 0, 3 | 0 | 3 | 0 |
| `status gizi` | `Status Gizi`, `Status gizi` | 74, 187 | 0, 1 | 0 | 1 | 0 |

**Top non-canonical columns with data (25 terbesar):**

| Col | Header | Non-empty | Fill % | Type | Flags |
| ---: | --- | ---: | ---: | --- | --- |
| 165 | `dx` | 3 | 100 | text | non_canonical_with_data, case_or_format_variant_header |
| 166 | `Klasifikasi` | 3 | 100 | text | non_canonical_with_data |
| 172 | `Nama Orang Tua/Wali` | 3 | 100 | text | non_canonical_with_data, case_or_format_variant_header, formula_like_values |
| 173 | `No Telp/WA Orang Tua/Wali` | 3 | 100 | numeric | non_canonical_with_data, formula_like_values |
| 174 | `Petugas` | 3 | 100 | text | non_canonical_with_data |
| 175 | `Provinsi unit pelapor` | 3 | 100 | text | non_canonical_with_data |
| 176 | `Kab/Kota unit pelapor` | 3 | 100 | text | non_canonical_with_data |
| 177 | `Link PDF` | 3 | 100 | url | non_canonical_with_data |
| 178 | `Tanggal mulai sakit tenggorokan` | 3 | 100 | date | non_canonical_with_data |
| 179 | `Keluhan utama` | 3 | 100 | text | non_canonical_with_data, case_or_format_variant_header |
| 180 | `Demam?` | 3 | 100 | booleanish | non_canonical_with_data |
| 181 | `Tanggal mulai sakit tenggorokan (gejala)` | 3 | 100 | date | non_canonical_with_data |
| 182 | `Leher bengkak?` | 3 | 100 | booleanish | non_canonical_with_data |
| 226 | `KontakEratJSON` | 3 | 100 | jsonish | non_canonical_with_data |
| 167 | `Bekerja/sekolah?` | 2 | 66.67 | booleanish | non_canonical_with_data |
| 170 | `Kab/Kota domisili penderita` | 2 | 66.67 | text | non_canonical_with_data |
| 171 | `Provinsi domisili penderita` | 2 | 66.67 | text | non_canonical_with_data |
| 183 | `Tanggal mulai leher bengkak` | 2 | 66.67 | date | non_canonical_with_data |
| 185 | `Tanggal muncul pseudomembran` | 2 | 66.67 | date | non_canonical_with_data |
| 188 | `Imunisasi DPT-HB-Hib 1` | 2 | 66.67 | booleanish | non_canonical_with_data |
| 189 | `Sumber informasi imunisasi DPT-HB-Hib 1` | 2 | 66.67 | text | non_canonical_with_data |
| 190 | `Imunisasi DPT-HB-Hib 2` | 2 | 66.67 | booleanish | non_canonical_with_data |
| 191 | `Sumber informasi imunisasi DPT-HB-Hib 2` | 2 | 66.67 | text | non_canonical_with_data |
| 193 | `Sumber informasi imunisasi DPT-HB-Hib 3` | 2 | 66.67 | text | non_canonical_with_data |
| 194 | `Imunisasi DPT-HB-Hib booster (18 bln)` | 2 | 66.67 | text | non_canonical_with_data |

### PERT_Raw

- Rows/cols: 5 / 179
- Missing canonical: 14
- Blank header dengan data: 1
- Non-canonical dengan data: 29
- Legacy alias live: 4
- Exact duplicate group: 0
- Variant duplicate group: 4

**Missing canonical headers:**

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

**Blank header dengan data:**

| Col | Non-empty | First rows |
| ---: | ---: | --- |
| 179 | 1 | 4 |

**Legacy alias live:**

| Col | Header alias | Target | Non-empty |
| ---: | --- | --- | ---: |
| 169 | `Tanggal kembali` | `Tanggal pulang` | 0 |
| 170 | `Spesimen diambil?` | `Apakah spesimen darah diambil` | 2 |
| 171 | `Jenis spesimen` | `Jenis Sampel Darah` | 1 |
| 172 | `Tanggal ambil spesimen` | `Tanggal ambil spesimen darah` | 1 |

**Case/format variant duplicate groups:**

| Normalized | Headers | Cols | Non-empty by col | Conflict rows | Fillable rows | Same rows |
| --- | --- | --- | --- | ---: | ---: | ---: |
| `dx` | `DX`, `dx` | 5, 136 | 0, 4 | 0 | 4 | 0 |
| `nama orang tua/wali` | `Nama orang tua/wali`, `Nama Orang Tua/Wali` | 32, 139 | 0, 4 | 0 | 4 | 0 |
| `tanggal masuk rawat inap` | `Tanggal Masuk Rawat Inap`, `Tanggal masuk rawat inap` | 60, 151 | 0, 2 | 0 | 2 | 0 |
| `tanggal keluar` | `Tanggal Keluar`, `Tanggal keluar` | 61, 152 | 0, 2 | 0 | 2 | 0 |

**Top non-canonical columns with data (25 terbesar):**

| Col | Header | Non-empty | Fill % | Type | Flags |
| ---: | --- | ---: | ---: | --- | --- |
| 136 | `dx` | 4 | 100 | text | non_canonical_with_data, case_or_format_variant_header |
| 137 | `Klasifikasi` | 4 | 100 | text | non_canonical_with_data |
| 139 | `Nama Orang Tua/Wali` | 4 | 100 | text | non_canonical_with_data, case_or_format_variant_header, formula_like_values |
| 140 | `No Telp/WA Orang Tua/Wali` | 4 | 100 | text | non_canonical_with_data, formula_like_values |
| 141 | `Petugas` | 4 | 100 | text | non_canonical_with_data |
| 142 | `Provinsi unit pelapor` | 4 | 100 | text | non_canonical_with_data |
| 143 | `Kab/Kota unit pelapor` | 4 | 100 | text | non_canonical_with_data |
| 144 | `Link PDF` | 4 | 100 | url | non_canonical_with_data |
| 145 | `Apnea?` | 4 | 100 | booleanish | non_canonical_with_data |
| 178 | `KontakEratJSON` | 4 | 100 | jsonish | non_canonical_with_data |
| 150 | `Kasus dirawat di Rumah Sakit?` | 3 | 75 | booleanish | non_canonical_with_data |
| 146 | `Batuk rejan?` | 2 | 50 | booleanish | non_canonical_with_data |
| 147 | `Muntah setelah batuk?` | 2 | 50 | booleanish | non_canonical_with_data |
| 149 | `Keadaan saat ini` | 2 | 50 | text | non_canonical_with_data |
| 151 | `Tanggal masuk rawat inap` | 2 | 50 | date | non_canonical_with_data, case_or_format_variant_header |
| 152 | `Tanggal keluar` | 2 | 50 | date | non_canonical_with_data, case_or_format_variant_header |
| 153 | `Imunisasi pertusis usia 2 bulan` | 2 | 50 | booleanish | non_canonical_with_data |
| 154 | `Sumber informasi imunisasi 2 bulan` | 2 | 50 | text | non_canonical_with_data |
| 164 | `Ada kasus sekitar dengan gejala sama?` | 2 | 50 | booleanish | non_canonical_with_data |
| 166 | `Bepergian 1 bulan terakhir?` | 2 | 50 | booleanish | non_canonical_with_data |
| 148 | `Gejala lain, sebutkan` | 1 | 25 | text | non_canonical_with_data |
| 155 | `Imunisasi pertusis usia 3 bulan` | 1 | 25 | booleanish | non_canonical_with_data |
| 156 | `Sumber informasi imunisasi 3 bulan` | 1 | 25 | text | non_canonical_with_data |
| 157 | `Imunisasi pertusis usia 4 bulan` | 1 | 25 | booleanish | non_canonical_with_data |
| 158 | `Sumber informasi imunisasi 4 bulan` | 1 | 25 | text | non_canonical_with_data |

### TN_Raw

- Rows/cols: 1 / 257
- Missing canonical: 14
- Blank header dengan data: 0
- Non-canonical dengan data: 0
- Legacy alias live: 0
- Exact duplicate group: 0
- Variant duplicate group: 5

**Missing canonical headers:**

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

**Case/format variant duplicate groups:**

| Normalized | Headers | Cols | Non-empty by col | Conflict rows | Fillable rows | Same rows |
| --- | --- | --- | --- | ---: | ---: | ---: |
| `dx` | `DX`, `dx` | 5, 179 | 0, 0 | 0 | 0 | 0 |
| `nama orang tua/wali` | `Nama orang tua/wali`, `Nama Orang Tua/Wali` | 32, 182 | 0, 0 | 0 | 0 | 0 |
| `pekerjaan ibu` | `Pekerjaan ibu`, `Pekerjaan Ibu` | 52, 190 | 0, 0 | 0 | 0 | 0 |
| `pendidikan ibu` | `Pendidikan ibu`, `Pendidikan Ibu` | 53, 191 | 0, 0 | 0 | 0 | 0 |
| `tempat pemeriksaan ibu hamil` | `Tempat pemeriksaan ibu hamil`, `Tempat pemeriksaan Ibu Hamil` | 69, 204 | 0, 0 | 0 | 0 | 0 |

### AFP_Raw

- Rows/cols: 4 / 240
- Missing canonical: 14
- Blank header dengan data: 0
- Non-canonical dengan data: 43
- Legacy alias live: 1
- Exact duplicate group: 0
- Variant duplicate group: 3

**Missing canonical headers:**

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

**Legacy alias live:**

| Col | Header alias | Target | Non-empty |
| ---: | --- | --- | ---: |
| 209 | `Lokasi perjalanan` | `Tujuan perjalanan` | 0 |

**Case/format variant duplicate groups:**

| Normalized | Headers | Cols | Non-empty by col | Conflict rows | Fillable rows | Same rows |
| --- | --- | --- | --- | ---: | ---: | ---: |
| `dx` | `DX`, `dx` | 5, 172 | 0, 3 | 0 | 3 | 0 |
| `nama orang tua/wali` | `Nama orang tua/wali`, `Nama Orang Tua/Wali` | 32, 175 | 0, 3 | 0 | 3 | 0 |
| `nomor rekam medik` | `Nomor Rekam Medik`, `Nomor rekam medik` | 63, 190 | 0, 1 | 0 | 1 | 0 |

**Top non-canonical columns with data (25 terbesar):**

| Col | Header | Non-empty | Fill % | Type | Flags |
| ---: | --- | ---: | ---: | --- | --- |
| 172 | `dx` | 3 | 100 | text | non_canonical_with_data, case_or_format_variant_header |
| 173 | `Klasifikasi` | 3 | 100 | text | non_canonical_with_data |
| 175 | `Nama Orang Tua/Wali` | 3 | 100 | text | non_canonical_with_data, case_or_format_variant_header |
| 176 | `No Telp/WA Orang Tua/Wali` | 3 | 100 | numeric | non_canonical_with_data |
| 177 | `Petugas` | 3 | 100 | text | non_canonical_with_data |
| 178 | `Provinsi unit pelapor` | 3 | 100 | text | non_canonical_with_data |
| 179 | `Kab/Kota unit pelapor` | 3 | 100 | text | non_canonical_with_data |
| 180 | `Link PDF` | 3 | 100 | url | non_canonical_with_data |
| 182 | `Tanggal mulai kelumpuhan` | 3 | 100 | date | non_canonical_with_data |
| 184 | `Menggunakan pengobatan tradisional/alternatif?` | 3 | 100 | booleanish | non_canonical_with_data |
| 187 | `Berobat ke Rumah Sakit?` | 3 | 100 | booleanish | non_canonical_with_data |
| 191 | `Kelumpuhan akut (1-14 hari)?` | 3 | 100 | booleanish | non_canonical_with_data |
| 192 | `Kelumpuhan flaksid (layuh)?` | 3 | 100 | booleanish | non_canonical_with_data |
| 193 | `Kelumpuhan akibat rudapaksa?` | 3 | 100 | booleanish | non_canonical_with_data |
| 194 | `Demam sebelum lemah/lumpuh?` | 3 | 100 | booleanish | non_canonical_with_data |
| 219 | `Jumlah dosis OPV rutin` | 3 | 100 | text | non_canonical_with_data |
| 220 | `Jumlah dosis IPV rutin` | 3 | 100 | text | non_canonical_with_data |
| 222 | `Sumber informasi imunisasi rutin` | 3 | 100 | text | non_canonical_with_data |
| 223 | `Jumlah dosis OPV tambahan` | 3 | 100 | text | non_canonical_with_data |
| 224 | `Jumlah dosis IPV tambahan` | 3 | 100 | text | non_canonical_with_data |
| 225 | `Sumber informasi imunisasi tambahan` | 3 | 100 | text | non_canonical_with_data |
| 237 | `Nama Petugas Investigasi` | 3 | 100 | text | non_canonical_with_data |
| 238 | `Diagnosis akhir` | 3 | 100 | text | non_canonical_with_data |
| 239 | `Nama dokter pemeriksa` | 3 | 100 | text | non_canonical_with_data |
| 181 | `Tanggal mulai sakit/gejala awal sebelum lumpuh` | 2 | 66.67 | date | non_canonical_with_data |

## Rekomendasi Tindak Lanjut Aman

1. **Prioritas 1 — PERT blank column**: audit manual row/kolom 179 dan tentukan apakah bisa dipindahkan ke target canonical tertentu. Jangan delete sebelum ada mapping aman.
2. **Prioritas 2 — append missing canonical workflow/edit fields** pada DIF/PERT/TN/AFP, dan 7 missing canonical di MR, lewat helper append schema non-destruktif.
3. **Prioritas 3 — variant duplicate merge**: buat helper per-pasangan dengan backup. Kandidat paling aman adalah grup dengan `conflictRows=0`; tetap perlu canonical decision sebelum hapus alias.
4. **Prioritas 4 — mapping non-canonical legacy fields**: review kolom legacy besar seperti `Klasifikasi`, `Link PDF`, field imunisasi MR/DIF/PERT/AFP, `KontakEratJSON`, dan `Deleted At/By/Reason`; tentukan mana yang harus masuk `raw_schema.js`, mana yang alias, mana yang arsip.
5. **Prioritas 5 — sheet analitik**: `Analisis_PE` dan `Populasi` punya blank header berisi data; kemungkinan layout tabel analitik, jadi jangan disamakan dengan raw cleanup sebelum dicek tujuan sheet-nya.

## Appendix A — Per-column Audit Semua Sheet Aktif

### LOG_NOTIF

| Col | Header | Status | Non-empty | Fill % | Distinct | Type | Flags |
| ---: | --- | --- | ---: | ---: | ---: | --- | --- |
| 1 | `Timestamp` | non_raw_or_unclassified | 622 | 100 | 622 | date |  |
| 2 | `DX` | non_raw_or_unclassified | 622 | 100 | 4 | text |  |
| 3 | `EPID` | non_raw_or_unclassified | 622 | 100 | 594 | text |  |
| 4 | `Kelurahan` | non_raw_or_unclassified | 622 | 100 | 58 | text |  |
| 5 | `Kecamatan` | non_raw_or_unclassified | 622 | 100 | 12 | text |  |
| 6 | `Pengampu` | non_raw_or_unclassified | 622 | 100 | 39 | text |  |
| 7 | `To` | non_raw_or_unclassified | 47 | 7.56 | 23 | text |  |
| 8 | `Subject` | non_raw_or_unclassified | 47 | 7.56 | 26 | text |  |
| 9 | `Status` | non_raw_or_unclassified | 622 | 100 | 2 | text |  |
| 10 | `Reason/Error` | non_raw_or_unclassified | 622 | 100 | 2 | text |  |

### REF_USER

| Col | Header | Status | Non-empty | Fill % | Distinct | Type | Flags |
| ---: | --- | --- | ---: | ---: | ---: | --- | --- |
| 1 | `Username` | non_raw_or_unclassified | 270 | 100 | 270 | text |  |
| 2 | `PIN` | non_raw_or_unclassified | 270 | 100 | 1 | numeric |  |
| 3 | `Email` | non_raw_or_unclassified | 264 | 97.78 | 264 | text |  |
| 4 | `Nama` | non_raw_or_unclassified | 245 | 90.74 | 52 | text |  |
| 5 | `Role` | non_raw_or_unclassified | 270 | 100 | 2 | text |  |
| 6 | `UnitKerja` | non_raw_or_unclassified | 40 | 14.81 | 40 | text |  |
| 7 | `KodePuskesmas` | non_raw_or_unclassified | 40 | 14.81 | 40 | numeric |  |
| 8 | `ScopeLevel` | non_raw_or_unclassified | 270 | 100 | 2 | text |  |
| 9 | `StatusAktif` | non_raw_or_unclassified | 270 | 100 | 1 | text |  |
| 10 | `Catatan Migrasi` | non_raw_or_unclassified | 270 | 100 | 2 | text |  |

### REF_PENGAMPU

| Col | Header | Status | Non-empty | Fill % | Distinct | Type | Flags |
| ---: | --- | --- | ---: | ---: | ---: | --- | --- |
| 1 | `Status` | non_raw_or_unclassified | 63 | 100 | 1 | text |  |
| 2 | `Kab/Kota` | non_raw_or_unclassified | 63 | 100 | 1 | text |  |
| 3 | `Kecamatan` | non_raw_or_unclassified | 63 | 100 | 11 | text |  |
| 4 | `Kelurahan` | non_raw_or_unclassified | 63 | 100 | 62 | text |  |
| 5 | `KodePuskesmas` | non_raw_or_unclassified | 63 | 100 | 63 | numeric |  |
| 6 | `NamaPuskesmas` | non_raw_or_unclassified | 63 | 100 | 39 | text |  |
| 7 | `Pengampu` | non_raw_or_unclassified | 63 | 100 | 39 | text |  |
| 8 | `PetugasSurveilans` | non_raw_or_unclassified | 63 | 100 | 39 | text |  |
| 9 | `EmailPetugas` | non_raw_or_unclassified | 63 | 100 | 39 | text |  |
| 10 | `KepalaPuskesmas` | non_raw_or_unclassified | 56 | 88.89 | 36 | text |  |
| 11 | `EmailKapus` | non_raw_or_unclassified | 49 | 77.78 | 31 | email |  |
| 12 | `SpreadsheetId` | non_raw_or_unclassified | 63 | 100 | 39 | text |  |
| 13 | `SpreadsheetUrl` | non_raw_or_unclassified | 63 | 100 | 39 | url |  |
| 14 | `SpreadsheetIdTujuan` | non_raw_or_unclassified | 63 | 100 | 39 | text |  |
| 15 | `SpreadsheetUrlTujuan` | non_raw_or_unclassified | 63 | 100 | 39 | url |  |
| 16 | `NamaSheetTujuan` | non_raw_or_unclassified | 63 | 100 | 1 | text |  |
| 17 | `TelegramChatId` | non_raw_or_unclassified | 2 | 3.17 | 1 | text | formula_like_values |
| 18 | `Catatan` | non_raw_or_unclassified | 63 | 100 | 1 | text |  |

### AUDIT_LOG

| Col | Header | Status | Non-empty | Fill % | Distinct | Type | Flags |
| ---: | --- | --- | ---: | ---: | ---: | --- | --- |
| 1 | `Timestamp` | non_raw_or_unclassified | 155 | 100 | 155 | date |  |
| 2 | `Username` | non_raw_or_unclassified | 155 | 100 | 6 | text |  |
| 3 | `Role` | non_raw_or_unclassified | 145 | 93.55 | 4 | text |  |
| 4 | `DX` | non_raw_or_unclassified | 53 | 34.19 | 1 | text |  |
| 5 | `Nomor EPID` | non_raw_or_unclassified | 52 | 33.55 | 7 | text |  |
| 6 | `Aksi` | non_raw_or_unclassified | 155 | 100 | 6 | text |  |
| 7 | `Ringkasan Perubahan` | non_raw_or_unclassified | 25 | 16.13 | 2 | text |  |
| 8 | `Tahap Workflow` | non_raw_or_unclassified | 25 | 16.13 | 2 | text |  |
| 9 | `Label Tahap Workflow` | non_raw_or_unclassified | 58 | 37.42 | 39 | jsonish |  |

### LOG_EDIT

| Col | Header | Status | Non-empty | Fill % | Distinct | Type | Flags |
| ---: | --- | --- | ---: | ---: | ---: | --- | --- |
| 1 | `Timestamp` | non_raw_or_unclassified | 12 | 100 | 12 | date |  |
| 2 | `EditorEmail` | non_raw_or_unclassified | 2 | 16.67 | 1 | email |  |
| 3 | `DX` | non_raw_or_unclassified | 12 | 100 | 1 | text |  |
| 4 | `Nomor EPID` | non_raw_or_unclassified | 12 | 100 | 4 | numeric |  |
| 5 | `Sheet` | non_raw_or_unclassified | 0 | 0 | 0 | empty |  |
| 6 | `Row` | non_raw_or_unclassified | 12 | 100 | 1 | text |  |
| 7 | `ChangedFieldsJSON` | non_raw_or_unclassified | 0 | 0 | 0 | empty |  |
| 8 | `BeforeJSON` | non_raw_or_unclassified | 0 | 0 | 0 | empty |  |
| 9 | `AfterJSON` | non_raw_or_unclassified | 0 | 0 | 0 | empty |  |

### REF_IMUN

| Col | Header | Status | Non-empty | Fill % | Distinct | Type | Flags |
| ---: | --- | --- | ---: | ---: | ---: | --- | --- |
| 1 | `KodeImunisasi` | non_raw_or_unclassified | 26 | 100 | 26 | text |  |
| 2 | `LabelImunisasi` | non_raw_or_unclassified | 26 | 100 | 26 | text |  |
| 3 | `Aktif` | non_raw_or_unclassified | 26 | 100 | 1 | booleanish |  |
| 4 | `Kategori` | non_raw_or_unclassified | 26 | 100 | 3 | text |  |
| 5 | `KelompokUsia` | non_raw_or_unclassified | 26 | 100 | 12 | text |  |
| 6 | `UrutanDosis` | non_raw_or_unclassified | 26 | 100 | 4 | numeric |  |
| 7 | `UmurMinHari` | non_raw_or_unclassified | 19 | 73.08 | 1 | numeric |  |
| 8 | `UmurMinBulan` | non_raw_or_unclassified | 19 | 73.08 | 7 | numeric |  |
| 9 | `UmurMinTahun` | non_raw_or_unclassified | 19 | 73.08 | 1 | numeric |  |
| 10 | `UmurMaxHari` | non_raw_or_unclassified | 0 | 0 | 0 | empty |  |
| 11 | `UmurMaxBulan` | non_raw_or_unclassified | 0 | 0 | 0 | empty |  |
| 12 | `UmurMaxTahun` | non_raw_or_unclassified | 1 | 3.85 | 1 | numeric |  |
| 13 | `BasisValidasi` | non_raw_or_unclassified | 26 | 100 | 2 | text |  |
| 14 | `KelasMin` | non_raw_or_unclassified | 7 | 26.92 | 5 | numeric |  |
| 15 | `KelasMax` | non_raw_or_unclassified | 7 | 26.92 | 5 | numeric |  |
| 16 | `JKTarget` | non_raw_or_unclassified | 26 | 100 | 2 | text |  |
| 17 | `ButuhSekolah` | non_raw_or_unclassified | 26 | 100 | 2 | booleanish |  |
| 18 | `Introduksi` | non_raw_or_unclassified | 26 | 100 | 5 | date |  |
| 19 | `UmurMaxIntroduksi` | non_raw_or_unclassified | 26 | 100 | 2 | numeric |  |
| 20 | `StatusDiBawahUmur` | non_raw_or_unclassified | 26 | 100 | 1 | text |  |
| 21 | `StatusDiLuarSasaran` | non_raw_or_unclassified | 26 | 100 | 1 | text |  |
| 22 | `Catatan` | non_raw_or_unclassified | 8 | 30.77 | 3 | text |  |

### REF_FASKES

| Col | Header | Status | Non-empty | Fill % | Distinct | Type | Flags |
| ---: | --- | --- | ---: | ---: | ---: | --- | --- |
| 1 | `FaskesKey` | non_raw_or_unclassified | 269 | 100 | 269 | text |  |
| 2 | `NamaFaskes` | non_raw_or_unclassified | 269 | 100 | 269 | text |  |
| 3 | `Jenis` | non_raw_or_unclassified | 269 | 100 | 5 | text |  |
| 4 | `Kecamatan` | non_raw_or_unclassified | 205 | 76.21 | 11 | text |  |
| 5 | `Kelurahan` | non_raw_or_unclassified | 84 | 31.23 | 25 | text |  |
| 6 | `Pengampu` | non_raw_or_unclassified | 229 | 85.13 | 37 | text |  |
| 7 | `Email` | non_raw_or_unclassified | 206 | 76.58 | 201 | email |  |
| 8 | `StatusAktif` | non_raw_or_unclassified | 269 | 100 | 1 | text |  |
| 9 | `Alias` | non_raw_or_unclassified | 0 | 0 | 0 | empty |  |
| 10 | `UpdatedAt` | non_raw_or_unclassified | 0 | 0 | 0 | empty |  |

### REF_WILAYAH

| Col | Header | Status | Non-empty | Fill % | Distinct | Type | Flags |
| ---: | --- | --- | ---: | ---: | ---: | --- | --- |
| 1 | `KODE PROVINSI` | non_raw_or_unclassified | 83762 | 100 | 38 | numeric |  |
| 2 | `PROVINSI` | non_raw_or_unclassified | 83762 | 100 | 38 | text |  |
| 3 | `KODE KAB/KOTA` | non_raw_or_unclassified | 83762 | 100 | 514 | numeric |  |
| 4 | `KABUPATEN/KOTA` | non_raw_or_unclassified | 83762 | 100 | 514 | text |  |
| 5 | `KODE KECAMATAN` | non_raw_or_unclassified | 83762 | 100 | 7285 | text |  |
| 6 | `KECAMATAN` | non_raw_or_unclassified | 83762 | 100 | 6902 | text |  |
| 7 | `KODE KEL/DESA` | non_raw_or_unclassified | 83762 | 100 | 83762 | text |  |
| 8 | `KELURAHAN/DESA` | non_raw_or_unclassified | 83762 | 100 | 63505 | text |  |

### SARS

| Col | Header | Status | Non-empty | Fill % | Distinct | Type | Flags |
| ---: | --- | --- | ---: | ---: | ---: | --- | --- |
| 1 | `Waktu Submit` | non_raw_or_unclassified | 774 | 100 | 243 | date |  |
| 2 | `Email Petugas` | non_raw_or_unclassified | 21 | 2.71 | 2 | email |  |
| 3 | `ME` | non_raw_or_unclassified | 774 | 100 | 25 | numeric |  |
| 4 | `Nama Petugas` | non_raw_or_unclassified | 774 | 100 | 48 | text |  |
| 5 | `No Whatsapp` | non_raw_or_unclassified | 774 | 100 | 42 | numeric |  |
| 6 | `Unit Surveilans` | non_raw_or_unclassified | 774 | 100 | 23 | text |  |
| 7 | `Jenis Fasyankes` | non_raw_or_unclassified | 774 | 100 | 2 | text |  |
| 8 | `Nama Fasyankes` | non_raw_or_unclassified | 774 | 100 | 35 | text |  |
| 9 | `Nama Penyakit` | non_raw_or_unclassified | 774 | 100 | 4 | text |  |
| 10 | `Nihil` | non_raw_or_unclassified | 753 | 97.29 | 1 | booleanish |  |
| 11 | `Nama Kasus` | non_raw_or_unclassified | 774 | 100 | 764 | text |  |
| 12 | `Tgl Lahir` | non_raw_or_unclassified | 771 | 99.61 | 708 | date |  |
| 13 | `Jenis Kelamin` | non_raw_or_unclassified | 765 | 98.84 | 2 | text |  |
| 14 | `Nama Ortu` | non_raw_or_unclassified | 585 | 75.58 | 405 | text | formula_like_values |
| 15 | `Alamat & No Telp` | non_raw_or_unclassified | 765 | 98.84 | 745 | text |  |
| 16 | `Tanggal Mulai` | non_raw_or_unclassified | 772 | 99.74 | 171 | date |  |
| 17 | `Gejala` | non_raw_or_unclassified | 770 | 99.48 | 602 | text | formula_like_values |
| 18 | `Status Imunisasi` | non_raw_or_unclassified | 503 | 64.99 | 40 | text | formula_like_values |
| 19 | `Keadaan (H/M)` | non_raw_or_unclassified | 774 | 100 | 2 | text |  |
| 20 | `Spesimen / Penolong` | non_raw_or_unclassified | 530 | 68.48 | 4 | booleanish | formula_like_values |
| 21 | `Diagnosis Medis/Banding` | non_raw_or_unclassified | 749 | 96.77 | 341 | text | formula_like_values |
| 22 | `Deadline` | non_raw_or_unclassified | 754 | 97.42 | 25 | date |  |
| 23 | `OnTime` | non_raw_or_unclassified | 774 | 100 | 2 | booleanish |  |
| 24 | `FaskesPengampu` | non_raw_or_unclassified | 713 | 92.12 | 21 | text |  |
| 25 | `FaskesKey` | non_raw_or_unclassified | 774 | 100 | 34 | text |  |

### PE_Trend

| Col | Header | Status | Non-empty | Fill % | Distinct | Type | Flags |
| ---: | --- | --- | ---: | ---: | ---: | --- | --- |
| 1 | `dx` | non_raw_or_unclassified | 6 | 100 | 2 | text |  |
| 2 | `Tahun` | non_raw_or_unclassified | 6 | 100 | 2 | numeric |  |
| 3 | `Minggu Epid (ME/MMWR)` | non_raw_or_unclassified | 6 | 100 | 5 | numeric |  |
| 4 | `Tanggal Mulai` | non_raw_or_unclassified | 6 | 100 | 5 | date |  |
| 5 | `Tanggal Akhir` | non_raw_or_unclassified | 6 | 100 | 5 | date |  |
| 6 | `Jumlah Kasus` | non_raw_or_unclassified | 6 | 100 | 5 | numeric |  |

### Analisis_PE

| Col | Header | Status | Non-empty | Fill % | Distinct | Type | Flags |
| ---: | --- | --- | ---: | ---: | ---: | --- | --- |
| 1 | `ANALISIS PE – PD3I DINKES DEPOK` | non_raw_or_unclassified | 100 | 80.65 | 68 | text | formula_like_values |
| 2 | `(blank)` | blank_header | 92 | 74.19 | 47 | numeric | blank_header_with_data, exact_duplicate_header |
| 3 | `(blank)` | blank_header | 34 | 27.42 | 27 | text | blank_header_with_data, exact_duplicate_header |
| 4 | `(blank)` | blank_header | 26 | 20.97 | 6 | numeric | blank_header_with_data, exact_duplicate_header |
| 5 | `(blank)` | blank_header | 26 | 20.97 | 24 | numeric | blank_header_with_data, exact_duplicate_header |
| 6 | `(blank)` | blank_header | 26 | 20.97 | 24 | numeric | blank_header_with_data, exact_duplicate_header |

### PE_AttackRate

| Col | Header | Status | Non-empty | Fill % | Distinct | Type | Flags |
| ---: | --- | --- | ---: | ---: | ---: | --- | --- |
| 1 | `dx` | non_raw_or_unclassified | 24 | 100 | 2 | text |  |
| 2 | `Kecamatan` | non_raw_or_unclassified | 24 | 100 | 10 | text |  |
| 3 | `Kelurahan` | non_raw_or_unclassified | 24 | 100 | 23 | text |  |
| 4 | `Puskesmas` | non_raw_or_unclassified | 24 | 100 | 19 | text |  |
| 5 | `Kasus` | non_raw_or_unclassified | 24 | 100 | 5 | numeric |  |
| 6 | `Populasi` | non_raw_or_unclassified | 24 | 100 | 23 | numeric |  |
| 7 | `Attack Rate per 100.000` | non_raw_or_unclassified | 24 | 100 | 23 | numeric |  |

### Populasi

| Col | Header | Status | Non-empty | Fill % | Distinct | Type | Flags |
| ---: | --- | --- | ---: | ---: | ---: | --- | --- |
| 1 | `Proyeksi/Sasaran Penduduk Tahun 2023` | non_raw_or_unclassified | 40 | 32.52 | 40 | numeric |  |
| 2 | `(blank)` | blank_header | 115 | 93.5 | 114 | text | blank_header_with_data, exact_duplicate_header |
| 3 | `(blank)` | blank_header | 118 | 95.93 | 94 | numeric | blank_header_with_data, exact_duplicate_header |
| 4 | `(blank)` | blank_header | 116 | 94.31 | 92 | numeric | blank_header_with_data, exact_duplicate_header |
| 5 | `(blank)` | blank_header | 116 | 94.31 | 92 | numeric | blank_header_with_data, exact_duplicate_header |
| 6 | `(blank)` | blank_header | 117 | 95.12 | 93 | numeric | blank_header_with_data, exact_duplicate_header |
| 7 | `(blank)` | blank_header | 116 | 94.31 | 91 | numeric | blank_header_with_data, exact_duplicate_header |
| 8 | `(blank)` | blank_header | 116 | 94.31 | 91 | numeric | blank_header_with_data, exact_duplicate_header |
| 9 | `(blank)` | blank_header | 115 | 93.5 | 90 | numeric | blank_header_with_data, exact_duplicate_header |
| 10 | `(blank)` | blank_header | 116 | 94.31 | 90 | numeric | blank_header_with_data, exact_duplicate_header |
| 11 | `(blank)` | blank_header | 118 | 95.93 | 94 | numeric | blank_header_with_data, exact_duplicate_header |
| 12 | `(blank)` | blank_header | 116 | 94.31 | 92 | numeric | blank_header_with_data, exact_duplicate_header |
| 13 | `(blank)` | blank_header | 116 | 94.31 | 92 | numeric | blank_header_with_data, exact_duplicate_header |
| 14 | `(blank)` | blank_header | 117 | 95.12 | 93 | numeric | blank_header_with_data, exact_duplicate_header |
| 15 | `(blank)` | blank_header | 116 | 94.31 | 91 | numeric | blank_header_with_data, exact_duplicate_header |
| 16 | `(blank)` | blank_header | 116 | 94.31 | 92 | numeric | blank_header_with_data, exact_duplicate_header |
| 17 | `(blank)` | blank_header | 117 | 95.12 | 93 | numeric | blank_header_with_data, exact_duplicate_header |
| 18 | `(blank)` | blank_header | 116 | 94.31 | 92 | numeric | blank_header_with_data, exact_duplicate_header |
| 19 | `(blank)` | blank_header | 116 | 94.31 | 92 | numeric | blank_header_with_data, exact_duplicate_header |
| 20 | `(blank)` | blank_header | 117 | 95.12 | 93 | numeric | blank_header_with_data, exact_duplicate_header |
| 21 | `(blank)` | blank_header | 116 | 94.31 | 91 | numeric | blank_header_with_data, exact_duplicate_header |
| 22 | `(blank)` | blank_header | 116 | 94.31 | 91 | numeric | blank_header_with_data, exact_duplicate_header |
| 23 | `(blank)` | blank_header | 117 | 95.12 | 93 | numeric | blank_header_with_data, exact_duplicate_header |
| 24 | `(blank)` | blank_header | 116 | 94.31 | 92 | numeric | blank_header_with_data, exact_duplicate_header |
| 25 | `(blank)` | blank_header | 116 | 94.31 | 92 | numeric | blank_header_with_data, exact_duplicate_header |
| 26 | `(blank)` | blank_header | 118 | 95.93 | 94 | numeric | blank_header_with_data, exact_duplicate_header |
| 27 | `(blank)` | blank_header | 116 | 94.31 | 92 | numeric | blank_header_with_data, exact_duplicate_header |
| 28 | `(blank)` | blank_header | 116 | 94.31 | 92 | numeric | blank_header_with_data, exact_duplicate_header |
| 29 | `(blank)` | blank_header | 117 | 95.12 | 90 | numeric | blank_header_with_data, exact_duplicate_header |
| 30 | `(blank)` | blank_header | 116 | 94.31 | 90 | numeric | blank_header_with_data, exact_duplicate_header |
| 31 | `(blank)` | blank_header | 116 | 94.31 | 90 | numeric | blank_header_with_data, exact_duplicate_header |
| 32 | `(blank)` | blank_header | 117 | 95.12 | 87 | numeric | blank_header_with_data, exact_duplicate_header |
| 33 | `(blank)` | blank_header | 116 | 94.31 | 87 | numeric | blank_header_with_data, exact_duplicate_header |
| 34 | `(blank)` | blank_header | 116 | 94.31 | 87 | numeric | blank_header_with_data, exact_duplicate_header |
| 35 | `(blank)` | blank_header | 117 | 95.12 | 91 | numeric | blank_header_with_data, exact_duplicate_header |
| 36 | `(blank)` | blank_header | 116 | 94.31 | 91 | numeric | blank_header_with_data, exact_duplicate_header |
| 37 | `(blank)` | blank_header | 116 | 94.31 | 91 | numeric | blank_header_with_data, exact_duplicate_header |
| 38 | `(blank)` | blank_header | 117 | 95.12 | 93 | numeric | blank_header_with_data, exact_duplicate_header |
| 39 | `(blank)` | blank_header | 116 | 94.31 | 91 | numeric | blank_header_with_data, exact_duplicate_header |
| 40 | `(blank)` | blank_header | 116 | 94.31 | 91 | numeric | blank_header_with_data, exact_duplicate_header |
| 41 | `(blank)` | blank_header | 118 | 95.93 | 94 | numeric | blank_header_with_data, exact_duplicate_header |
| 42 | `#VALUE!` | non_raw_or_unclassified | 116 | 94.31 | 91 | numeric |  |
| 43 | `(blank)` | blank_header | 116 | 94.31 | 91 | numeric | blank_header_with_data, exact_duplicate_header |
| 44 | `(blank)` | blank_header | 117 | 95.12 | 90 | numeric | blank_header_with_data, exact_duplicate_header |
| 45 | `(blank)` | blank_header | 116 | 94.31 | 89 | numeric | blank_header_with_data, exact_duplicate_header |
| 46 | `(blank)` | blank_header | 116 | 94.31 | 89 | numeric | blank_header_with_data, exact_duplicate_header |
| 47 | `(blank)` | blank_header | 117 | 95.12 | 92 | numeric | blank_header_with_data, exact_duplicate_header |
| 48 | `(blank)` | blank_header | 116 | 94.31 | 92 | numeric | blank_header_with_data, exact_duplicate_header |
| 49 | `(blank)` | blank_header | 116 | 94.31 | 91 | numeric | blank_header_with_data, exact_duplicate_header |
| 50 | `(blank)` | blank_header | 117 | 95.12 | 93 | numeric | blank_header_with_data, exact_duplicate_header |
| 51 | `(blank)` | blank_header | 116 | 94.31 | 92 | numeric | blank_header_with_data, exact_duplicate_header |
| 52 | `(blank)` | blank_header | 116 | 94.31 | 92 | numeric | blank_header_with_data, exact_duplicate_header |
| 53 | `(blank)` | blank_header | 119 | 96.75 | 94 | numeric | blank_header_with_data, exact_duplicate_header |
| 54 | `(blank)` | blank_header | 117 | 95.12 | 91 | numeric | blank_header_with_data, exact_duplicate_header |
| 55 | `(blank)` | blank_header | 116 | 94.31 | 90 | numeric | blank_header_with_data, exact_duplicate_header |
| 56 | `(blank)` | blank_header | 117 | 95.12 | 92 | numeric | blank_header_with_data, exact_duplicate_header |
| 57 | `(blank)` | blank_header | 116 | 94.31 | 90 | numeric | blank_header_with_data, exact_duplicate_header |
| 58 | `(blank)` | blank_header | 116 | 94.31 | 92 | numeric | blank_header_with_data, exact_duplicate_header |
| 59 | `(blank)` | blank_header | 116 | 94.31 | 92 | numeric | blank_header_with_data, exact_duplicate_header |
| 60 | `(blank)` | blank_header | 115 | 93.5 | 92 | numeric | blank_header_with_data, exact_duplicate_header |
| 61 | `(blank)` | blank_header | 115 | 93.5 | 91 | numeric | blank_header_with_data, exact_duplicate_header |
| 62 | `(blank)` | blank_header | 117 | 95.12 | 92 | numeric | blank_header_with_data, exact_duplicate_header |
| 63 | `(blank)` | blank_header | 116 | 94.31 | 90 | numeric | blank_header_with_data, exact_duplicate_header |
| 64 | `(blank)` | blank_header | 116 | 94.31 | 91 | numeric | blank_header_with_data, exact_duplicate_header |
| 65 | `(blank)` | blank_header | 118 | 95.93 | 94 | numeric | blank_header_with_data, exact_duplicate_header |
| 66 | `(blank)` | blank_header | 116 | 94.31 | 92 | numeric | blank_header_with_data, exact_duplicate_header |
| 67 | `(blank)` | blank_header | 116 | 94.31 | 92 | numeric | blank_header_with_data, exact_duplicate_header |

### EWS

| Col | Header | Status | Non-empty | Fill % | Distinct | Type | Flags |
| ---: | --- | --- | ---: | ---: | ---: | --- | --- |
| 1 | `Puskesmas` | non_raw_or_unclassified | 0 | 0 | 0 | empty |  |
| 2 | `WeekStart` | non_raw_or_unclassified | 0 | 0 | 0 | empty |  |
| 3 | `WeekEnd` | non_raw_or_unclassified | 0 | 0 | 0 | empty |  |
| 4 | `N_Minggu_Baseline` | non_raw_or_unclassified | 0 | 0 | 0 | empty |  |
| 5 | `MeanBaseline` | non_raw_or_unclassified | 0 | 0 | 0 | empty |  |
| 6 | `SDBaseline` | non_raw_or_unclassified | 0 | 0 | 0 | empty |  |
| 7 | `Observed` | non_raw_or_unclassified | 0 | 0 | 0 | empty |  |
| 8 | `Zscore` | non_raw_or_unclassified | 0 | 0 | 0 | empty |  |
| 9 | `Signal_YN` | non_raw_or_unclassified | 0 | 0 | 0 | empty |  |
| 10 | `Method` | non_raw_or_unclassified | 0 | 0 | 0 | empty |  |

### MR_Raw

| Col | Header | Status | Non-empty | Fill % | Distinct | Type | Flags |
| ---: | --- | --- | ---: | ---: | ---: | --- | --- |
| 1 | `ID Registrasi Kasus` | canonical | 0 | 0 | 0 | empty |  |
| 2 | `Nomor EPID` | canonical | 1417 | 100 | 1391 | text |  |
| 3 | `Nomor EPID Rekomendasi` | canonical | 0 | 0 | 0 | empty |  |
| 4 | `Nomor EPID Final` | canonical | 0 | 0 | 0 | empty |  |
| 5 | `DX` | canonical | 1417 | 100 | 1 | text | case_or_format_variant_header |
| 6 | `Tanggal Input` | canonical | 0 | 0 | 0 | empty |  |
| 7 | `Tanggal Update` | canonical | 0 | 0 | 0 | empty |  |
| 8 | `Timestamp` | canonical | 1416 | 99.93 | 1415 | date |  |
| 9 | `Last Updated At` | canonical | 0 | 0 | 0 | empty |  |
| 10 | `Diinput Oleh` | canonical | 0 | 0 | 0 | empty |  |
| 11 | `Role Penginput` | canonical | 0 | 0 | 0 | empty |  |
| 12 | `Tahap Workflow Terakhir` | canonical | 0 | 0 | 0 | empty |  |
| 13 | `Label Tahap Workflow Terakhir` | canonical | 0 | 0 | 0 | empty |  |
| 14 | `Diupdate Oleh Tahap Terakhir` | canonical | 0 | 0 | 0 | empty |  |
| 15 | `Role Pengupdate Tahap Terakhir` | canonical | 0 | 0 | 0 | empty |  |
| 16 | `Waktu Update Tahap Terakhir` | canonical | 0 | 0 | 0 | empty |  |
| 17 | `Sumber Laporan` | canonical | 1417 | 100 | 5 | text |  |
| 18 | `Nama unit pelapor` | canonical | 1417 | 100 | 85 | text |  |
| 19 | `Provinsi` | canonical | 0 | 0 | 0 | empty |  |
| 20 | `Kab/Kota` | canonical | 0 | 0 | 0 | empty |  |
| 21 | `Nama Petugas` | canonical | 0 | 0 | 0 | empty |  |
| 22 | `No Whatsapp Petugas` | canonical | 1320 | 93.15 | 114 | numeric | formula_like_values |
| 23 | `Email Petugas` | canonical | 1417 | 100 | 125 | email | formula_like_values |
| 24 | `Tanggal terima laporan` | canonical | 1417 | 100 | 156 | date |  |
| 25 | `Tanggal Pelacakan` | canonical | 1417 | 100 | 155 | date |  |
| 26 | `NIK` | canonical | 1417 | 100 | 1270 | numeric |  |
| 27 | `Nama` | canonical | 1417 | 100 | 1369 | text |  |
| 28 | `JK` | canonical | 1417 | 100 | 2 | text |  |
| 29 | `Tanggal Lahir` | canonical | 1417 | 100 | 1192 | date |  |
| 30 | `Umur (auto)` | canonical | 1417 | 100 | 1228 | text | formula_like_values |
| 31 | `Kelompok Umur Epidemiologis` | canonical | 0 | 0 | 0 | empty |  |
| 32 | `Nama orang tua/wali` | canonical | 1417 | 100 | 1213 | text | case_or_format_variant_header, formula_like_values |
| 33 | `No. kontak orang tua/wali` | canonical | 0 | 0 | 0 | empty |  |
| 34 | `Apakah sekolah/bekerja?` | canonical | 474 | 33.45 | 2 | booleanish |  |
| 35 | `Kelas Saat Ini` | canonical | 0 | 0 | 0 | empty |  |
| 36 | `Nama sekolah/tempat bekerja` | canonical | 227 | 16.02 | 135 | text | formula_like_values |
| 37 | `Tinggi Badan (cm)` | canonical | 303 | 21.38 | 94 | numeric |  |
| 38 | `Berat Badan (kg)` | canonical | 327 | 23.08 | 102 | date |  |
| 39 | `Alamat` | canonical | 1417 | 100 | 1215 | text |  |
| 40 | `RT` | canonical | 1417 | 100 | 26 | numeric | formula_like_values |
| 41 | `RW` | canonical | 1417 | 100 | 36 | numeric | formula_like_values |
| 42 | `Provinsi Pasien` | canonical | 0 | 0 | 0 | empty |  |
| 43 | `Kab/Kota Pasien` | canonical | 0 | 0 | 0 | empty |  |
| 44 | `Kecamatan` | canonical | 1417 | 100 | 12 | text |  |
| 45 | `Kelurahan` | canonical | 1417 | 100 | 63 | text |  |
| 46 | `Latitude` | canonical | 0 | 0 | 0 | empty |  |
| 47 | `Longitude` | canonical | 0 | 0 | 0 | empty |  |
| 48 | `Ambil Lokasi` | canonical | 0 | 0 | 0 | empty |  |
| 49 | `Kasus KLB` | canonical | 0 | 0 | 0 | empty |  |
| 50 | `KLB ke` | canonical | 0 | 0 | 0 | empty |  |
| 51 | `Nomor KLB` | canonical | 0 | 0 | 0 | empty |  |
| 52 | `Demam?` | canonical | 1417 | 100 | 1 | booleanish |  |
| 53 | `Tanggal mulai demam` | canonical | 1417 | 100 | 168 | date | case_or_format_variant_header |
| 54 | `Ruam Makulopapular?` | canonical | 1417 | 100 | 1 | booleanish |  |
| 55 | `Tanggal mulai ruam` | canonical | 1417 | 100 | 162 | date | case_or_format_variant_header |
| 56 | `Batuk` | canonical | 993 | 70.08 | 1 | booleanish |  |
| 57 | `Pilek` | canonical | 844 | 59.56 | 1 | booleanish |  |
| 58 | `Mata merah` | canonical | 444 | 31.33 | 1 | booleanish | case_or_format_variant_header |
| 59 | `Arthralgia` | canonical | 11 | 0.78 | 1 | booleanish |  |
| 60 | `Bagian Sendi` | canonical | 5 | 0.35 | 5 | text |  |
| 61 | `Adenopathy` | canonical | 5 | 0.35 | 1 | booleanish |  |
| 62 | `Lokasi Adenopathy` | canonical | 1 | 0.07 | 1 | text |  |
| 63 | `Kehamilan` | canonical | 2 | 0.14 | 1 | booleanish |  |
| 64 | `Umur kehamilan` | canonical | 2 | 0.14 | 2 | text | case_or_format_variant_header |
| 65 | `Gejala lain` | canonical | 319 | 22.51 | 1 | booleanish |  |
| 66 | `Sebutkan gejala lain` | canonical | 319 | 22.51 | 196 | text |  |
| 67 | `Diare` | canonical | 389 | 27.45 | 1 | booleanish |  |
| 68 | `Bronchopneumonia` | canonical | 0 | 0 | 0 | empty |  |
| 69 | `Kebutaan` | canonical | 0 | 0 | 0 | empty |  |
| 70 | `Otitis media` | canonical | 0 | 0 | 0 | empty |  |
| 71 | `Pneumonia` | canonical | 0 | 0 | 0 | empty |  |
| 72 | `Encephalitis` | canonical | 0 | 0 | 0 | empty |  |
| 73 | `Malnutrisi` | canonical | 0 | 0 | 0 | empty |  |
| 74 | `Ulkus mukosa mulut` | canonical | 0 | 0 | 0 | empty |  |
| 75 | `Lainnya komplikasi` | canonical | 0 | 0 | 0 | empty |  |
| 76 | `Sebutkan komplikasi lain` | canonical | 0 | 0 | 0 | empty |  |
| 77 | `Apakah dirawat inap?` | canonical | 0 | 0 | 0 | empty |  |
| 78 | `Nama Rumah Sakit` | canonical | 598 | 42.2 | 46 | text |  |
| 79 | `Nomor Rekam Medik` | canonical | 0 | 0 | 0 | empty |  |
| 80 | `Tanggal Masuk Rawat Inap` | canonical | 589 | 41.57 | 142 | date |  |
| 81 | `Status Pasien Rawat Inap` | canonical | 445 | 31.4 | 2 | text |  |
| 82 | `Tanggal Pulang` | canonical | 91 | 6.42 | 53 | date | case_or_format_variant_header |
| 83 | `Pemberian Vitamin A` | canonical | 0 | 0 | 0 | empty |  |
| 84 | `Ada kasus serupa di lingkungan` | canonical | 0 | 0 | 0 | empty |  |
| 85 | `Jumlah kasus sekitar` | canonical | 202 | 14.26 | 26 | numeric | formula_like_values |
| 86 | `Riwayat perjalanan 7-21 hari` | canonical | 0 | 0 | 0 | empty |  |
| 87 | `Lokasi perjalanan` | canonical | 0 | 0 | 0 | empty |  |
| 88 | `Tanggal pergi` | canonical | 99 | 6.99 | 66 | date |  |
| 89 | `Tanggal pulang perjalanan` | canonical | 0 | 0 | 0 | empty |  |
| 90 | `Riwayat kontak kasus serupa` | canonical | 0 | 0 | 0 | empty |  |
| 91 | `Riwayat kunjungan fasilitas kesehatan` | canonical | 0 | 0 | 0 | empty |  |
| 92 | `Cluster/kejadian luar biasa` | canonical | 0 | 0 | 0 | empty |  |
| 93 | `Apakah spesimen darah diambil` | canonical | 1263 | 89.13 | 2 | booleanish |  |
| 94 | `Jenis Sampel Darah` | canonical | 109 | 7.69 | 2 | text |  |
| 95 | `Tanggal ambil spesimen darah` | canonical | 97 | 6.85 | 62 | date |  |
| 96 | `Tanggal pengiriman spesimen darah ke lab` | canonical | 70 | 4.94 | 52 | date |  |
| 97 | `Apakah spesimen lain diambil` | canonical | 607 | 42.84 | 2 | booleanish |  |
| 98 | `Jenis Sampel Lain` | canonical | 22 | 1.55 | 3 | text |  |
| 99 | `Tanggal ambil spesimen lain` | canonical | 12 | 0.85 | 11 | date |  |
| 100 | `Tanggal pengiriman spesimen lain ke lab` | canonical | 12 | 0.85 | 10 | date |  |
| 101 | `Status akhir kasus` | canonical | 0 | 0 | 0 | empty |  |
| 102 | `Tanggal meninggal` | canonical | 0 | 0 | 0 | empty |  |
| 103 | `Penyebab kematian` | canonical | 0 | 0 | 0 | empty |  |
| 104 | `Status Verifikasi EPID` | canonical | 0 | 0 | 0 | empty |  |
| 105 | `Tanggal Verifikasi EPID` | canonical | 0 | 0 | 0 | empty |  |
| 106 | `Petugas Verifikator` | canonical | 0 | 0 | 0 | empty |  |
| 107 | `Review Admin Terakhir` | canonical | 0 | 0 | 0 | empty |  |
| 108 | `Catatan Verifikasi EPID` | canonical | 0 | 0 | 0 | empty |  |
| 109 | `Pemeriksaan Sampel Dilakukan` | canonical | 0 | 0 | 0 | empty |  |
| 110 | `Jenis Sampel Diuji` | canonical | 0 | 0 | 0 | empty |  |
| 111 | `Nomor Sampel / Lab` | canonical | 0 | 0 | 0 | empty |  |
| 112 | `Tanggal Hasil Sampel` | canonical | 0 | 0 | 0 | empty |  |
| 113 | `Hasil Pemeriksaan Sampel` | canonical | 0 | 0 | 0 | empty |  |
| 114 | `Interpretasi Hasil Sampel` | canonical | 0 | 0 | 0 | empty |  |
| 115 | `Status Pasien/Kasus` | canonical | 0 | 0 | 0 | empty |  |
| 116 | `Tanggal Update Status` | canonical | 0 | 0 | 0 | empty |  |
| 117 | `Dasar Penetapan Status` | canonical | 0 | 0 | 0 | empty |  |
| 118 | `Catatan Status Pasien` | canonical | 0 | 0 | 0 | empty |  |
| 119 | `Riwayat Status Kasus` | canonical | 0 | 0 | 0 | empty |  |
| 120 | `Kecamatan Pengampu` | canonical | 0 | 0 | 0 | empty |  |
| 121 | `Kelurahan Pengampu` | canonical | 0 | 0 | 0 | empty |  |
| 122 | `KodePuskesmas Pengampu` | canonical | 0 | 0 | 0 | empty |  |
| 123 | `Puskesmas Pengampu` | canonical | 0 | 0 | 0 | empty |  |
| 124 | `Kepala Puskesmas Pengampu` | canonical | 0 | 0 | 0 | empty |  |
| 125 | `Email Kapus Pengampu` | canonical | 0 | 0 | 0 | empty |  |
| 126 | `Petugas Surveilans Pengampu` | canonical | 0 | 0 | 0 | empty |  |
| 127 | `Email Petugas Pengampu` | canonical | 0 | 0 | 0 | empty |  |
| 128 | `SpreadsheetId Pengampu` | canonical | 0 | 0 | 0 | empty |  |
| 129 | `SpreadsheetUrl Pengampu` | canonical | 0 | 0 | 0 | empty |  |
| 130 | `Telegram Chat Id Pengampu` | canonical | 0 | 0 | 0 | empty |  |
| 131 | `Status Routing Pengampu` | canonical | 0 | 0 | 0 | empty |  |
| 132 | `Status Notifikasi Pengampu` | canonical | 0 | 0 | 0 | empty |  |
| 133 | `Reason Notifikasi Pengampu` | canonical | 0 | 0 | 0 | empty |  |
| 134 | `Notified At Pengampu` | canonical | 0 | 0 | 0 | empty |  |
| 135 | `Notified To Pengampu` | canonical | 0 | 0 | 0 | empty |  |
| 136 | `Status Sinkronisasi Pengampu` | canonical | 0 | 0 | 0 | empty |  |
| 137 | `Reason Sinkronisasi Pengampu` | canonical | 0 | 0 | 0 | empty |  |
| 138 | `Synced At Pengampu` | canonical | 0 | 0 | 0 | empty |  |
| 139 | `Sync Target Pengampu` | canonical | 0 | 0 | 0 | empty |  |
| 140 | `Status Notifikasi Telegram` | canonical | 0 | 0 | 0 | empty |  |
| 141 | `Reason Notifikasi Telegram` | canonical | 0 | 0 | 0 | empty |  |
| 142 | `Telegram Notified At` | canonical | 0 | 0 | 0 | empty |  |
| 143 | `Telegram Target` | canonical | 0 | 0 | 0 | empty |  |
| 144 | `Telegram Retry Count` | canonical | 0 | 0 | 0 | empty |  |
| 145 | `Pipeline Fingerprint` | canonical | 0 | 0 | 0 | empty |  |
| 146 | `Pipeline Last Run At` | canonical | 0 | 0 | 0 | empty |  |
| 147 | `Status Notifikasi Revisi Pengampu` | canonical | 0 | 0 | 0 | empty |  |
| 148 | `Reason Notifikasi Revisi Pengampu` | canonical | 0 | 0 | 0 | empty |  |
| 149 | `Revision Notified At Pengampu` | canonical | 0 | 0 | 0 | empty |  |
| 150 | `Revision Notified To Pengampu` | canonical | 0 | 0 | 0 | empty |  |
| 151 | `Status Notifikasi Revisi Telegram` | canonical | 0 | 0 | 0 | empty |  |
| 152 | `Reason Notifikasi Revisi Telegram` | canonical | 0 | 0 | 0 | empty |  |
| 153 | `Revision Telegram Notified At` | canonical | 0 | 0 | 0 | empty |  |
| 154 | `Revision Telegram Target` | canonical | 0 | 0 | 0 | empty |  |
| 155 | `Revision Notification Fingerprint` | canonical | 0 | 0 | 0 | empty |  |
| 156 | `Revision Notification Last Run At` | canonical | 0 | 0 | 0 | empty |  |
| 157 | `Status Verifikasi Sebelumnya` | canonical | 0 | 0 | 0 | empty |  |
| 158 | `Notifikasi Revisi Dibaca` | canonical | 0 | 0 | 0 | empty |  |
| 159 | `Waktu Permintaan Revisi` | canonical | 0 | 0 | 0 | empty |  |
| 160 | `Waktu Verifikasi Pending` | canonical | 0 | 0 | 0 | empty |  |
| 161 | `dx` | non_canonical | 1417 | 100 | 1 | text | non_canonical_with_data, case_or_format_variant_header |
| 162 | `Klasifikasi` | non_canonical | 1417 | 100 | 1 | text | non_canonical_with_data |
| 163 | `Koordinat (lat,lon)` | non_canonical | 24 | 1.69 | 22 | text | non_canonical_with_data, formula_like_values |
| 164 | `Nama Orang Tua/Wali` | non_canonical | 1417 | 100 | 1213 | text | non_canonical_with_data, case_or_format_variant_header, formula_like_values |
| 165 | `No Telp/WA Orang Tua/Wali` | non_canonical | 1417 | 100 | 1206 | numeric | non_canonical_with_data, formula_like_values |
| 166 | `Petugas` | non_canonical | 1417 | 100 | 179 | text | non_canonical_with_data, formula_like_values |
| 167 | `Provinsi unit pelapor` | non_canonical | 1417 | 100 | 2 | text | non_canonical_with_data |
| 168 | `Kab/Kota unit pelapor` | non_canonical | 1416 | 99.93 | 7 | text | non_canonical_with_data |
| 169 | `Link PDF` | non_canonical | 1413 | 99.72 | 1413 | url | non_canonical_with_data |
| 170 | `Tanggal Mulai Demam` | non_canonical | 1417 | 100 | 168 | date | non_canonical_with_data, case_or_format_variant_header |
| 171 | `Tanggal Mulai Ruam` | non_canonical | 1417 | 100 | 162 | date | non_canonical_with_data, case_or_format_variant_header |
| 172 | `Mata Merah` | non_canonical | 444 | 31.33 | 1 | booleanish | non_canonical_with_data, case_or_format_variant_header |
| 173 | `Umur Kehamilan` | non_canonical | 2 | 0.14 | 2 | text | non_canonical_with_data, case_or_format_variant_header |
| 174 | `Komp_Bronchopneumonia` | non_canonical | 61 | 4.3 | 1 | booleanish | non_canonical_with_data |
| 175 | `Komp_Kebutaan` | non_canonical | 1 | 0.07 | 1 | booleanish | non_canonical_with_data |
| 176 | `Komp_Otitis Media` | non_canonical | 8 | 0.56 | 1 | booleanish | non_canonical_with_data |
| 177 | `Komp_Pneumonia` | non_canonical | 39 | 2.75 | 1 | booleanish | non_canonical_with_data |
| 178 | `Komp_Encephalitis` | non_canonical | 4 | 0.28 | 1 | booleanish | non_canonical_with_data |
| 179 | `Komp_Malnutrisi` | non_canonical | 10 | 0.71 | 1 | booleanish | non_canonical_with_data |
| 180 | `Komp_Ulkus Mukosa Mulut` | non_canonical | 14 | 0.99 | 1 | booleanish | non_canonical_with_data |
| 181 | `Komp_Lainnya` | non_canonical | 18 | 1.27 | 1 | booleanish | non_canonical_with_data |
| 182 | `Komp_Lainnya_Sebutkan` | non_canonical | 18 | 1.27 | 18 | text | non_canonical_with_data |
| 183 | `Rawat inap?` | non_canonical | 1362 | 96.12 | 2 | booleanish | non_canonical_with_data |
| 184 | `Riwayat Imunisasi` | non_canonical | 1174 | 82.85 | 54 | jsonish | non_canonical_with_data |
| 185 | `Kesimpulan Status Imunisasi` | non_canonical | 0 | 0 | 0 | empty |  |
| 186 | `Pemberian vitamin A?` | non_canonical | 1307 | 92.24 | 3 | booleanish | non_canonical_with_data |
| 187 | `Ada kasus sekitar?` | non_canonical | 977 | 68.95 | 3 | booleanish | non_canonical_with_data |
| 188 | `Berpergian 1 bulan terakhir?` | non_canonical | 916 | 64.64 | 3 | booleanish | non_canonical_with_data |
| 189 | `Tujuan perjalanan` | non_canonical | 122 | 8.61 | 100 | text | non_canonical_with_data |
| 190 | `Tanggal pulang` | non_canonical | 91 | 6.42 | 53 | date | non_canonical_with_data, case_or_format_variant_header |
| 191 | `Keadaan saat ini` | non_canonical | 1340 | 94.57 | 3 | text | non_canonical_with_data |
| 192 | `KontakEratJSON` | non_canonical | 1417 | 100 | 526 | jsonish | non_canonical_with_data |
| 193 | `Ringkasan Riwayat Imunisasi` | non_canonical | 1174 | 82.85 | 61 | text | non_canonical_with_data |
| 194 | `FaskesKey` | non_canonical | 0 | 0 | 0 | empty |  |
| 195 | `Kontak Erat` | legacy_alias | 0 | 0 | 0 | empty | legacy_alias_live |
| 196 | `Input Awal Diisi Oleh` | non_canonical | 0 | 0 | 0 | empty |  |
| 197 | `Role Pengisi Input Awal` | non_canonical | 0 | 0 | 0 | empty |  |
| 198 | `Waktu Input Awal` | non_canonical | 0 | 0 | 0 | empty |  |
| 199 | `RumahSakitKey` | non_canonical | 0 | 0 | 0 | empty |  |
| 200 | `RAW_ROW_NUMBER` | non_canonical | 0 | 0 | 0 | empty |  |
| 201 | `Verifikasi EPID Diupdate Oleh` | non_canonical | 0 | 0 | 0 | empty |  |
| 202 | `Role Pengupdate Verifikasi EPID` | non_canonical | 0 | 0 | 0 | empty |  |
| 203 | `Waktu Update Verifikasi EPID` | non_canonical | 0 | 0 | 0 | empty |  |
| 204 | `Workflow Current Queue` | canonical | 0 | 0 | 0 | empty |  |
| 205 | `Workflow Current Label` | canonical | 0 | 0 | 0 | empty |  |
| 206 | `Status Proses Verifikasi EPID` | canonical | 0 | 0 | 0 | empty |  |
| 207 | `Status Proses Pemeriksaan` | canonical | 0 | 0 | 0 | empty |  |
| 208 | `Status Proses Pemantauan` | canonical | 0 | 0 | 0 | empty |  |
| 209 | `Status Proses Perbaikan` | canonical | 0 | 0 | 0 | empty |  |
| 210 | `Workflow Selesai` | canonical | 0 | 0 | 0 | empty |  |
| 211 | `Imunisasi campak-rubela dosis 1` | non_canonical | 1172 | 82.71 | 4 | booleanish | non_canonical_with_data |
| 212 | `Sumber Informasi (Dosis 1)` | non_canonical | 939 | 66.27 | 5 | text | non_canonical_with_data |
| 213 | `Imunisasi campak-rubela dosis 2` | non_canonical | 1115 | 78.69 | 4 | booleanish | non_canonical_with_data |
| 214 | `Sumber Informasi (Dosis 2)` | non_canonical | 860 | 60.69 | 5 | text | non_canonical_with_data |
| 215 | `Imunisasi campak-rubela saat BIAS` | non_canonical | 832 | 58.72 | 4 | text | non_canonical_with_data |
| 216 | `Sumber Informasi (BIAS)` | non_canonical | 568 | 40.08 | 5 | text | non_canonical_with_data |
| 217 | `Pernah menerima imunisasi MMR sebelumnya?` | non_canonical | 605 | 42.7 | 4 | text | non_canonical_with_data |
| 218 | `Sumber Informasi (MMR)` | non_canonical | 381 | 26.89 | 5 | text | non_canonical_with_data |
| 219 | `Pernah menerima imunisasi campak-rubela saat imunisasi tambahan?` | non_canonical | 574 | 40.51 | 4 | text | non_canonical_with_data |
| 220 | `Sumber Informasi (Imunisasi tambahan)` | non_canonical | 347 | 24.49 | 5 | text | non_canonical_with_data |
| 221 | `Tanggal imunisasi campak-rubela terakhir` | non_canonical | 36 | 2.54 | 34 | date | non_canonical_with_data |
| 222 | `MR_Raw_migrate__BLANK_COL_90` | non_canonical | 1417 | 100 | 11 | numeric | non_canonical_with_data |
| 223 | `MR_Raw_migrate__BLANK_COL_91` | non_canonical | 1417 | 100 | 1 | numeric | non_canonical_with_data |
| 224 | `Deleted At` | non_canonical | 1 | 0.07 | 1 | date | non_canonical_with_data |
| 225 | `Deleted By` | non_canonical | 1 | 0.07 | 1 | text | non_canonical_with_data |
| 226 | `Deleted Reason` | non_canonical | 1 | 0.07 | 1 | text | non_canonical_with_data |

### DIF_Raw

| Col | Header | Status | Non-empty | Fill % | Distinct | Type | Flags |
| ---: | --- | --- | ---: | ---: | ---: | --- | --- |
| 1 | `ID Registrasi Kasus` | canonical | 0 | 0 | 0 | empty |  |
| 2 | `Nomor EPID` | canonical | 3 | 100 | 3 | text |  |
| 3 | `Nomor EPID Rekomendasi` | canonical | 0 | 0 | 0 | empty |  |
| 4 | `Nomor EPID Final` | canonical | 0 | 0 | 0 | empty |  |
| 5 | `DX` | canonical | 0 | 0 | 0 | empty | case_or_format_variant_header |
| 6 | `Tanggal Input` | canonical | 0 | 0 | 0 | empty |  |
| 7 | `Tanggal Update` | canonical | 0 | 0 | 0 | empty |  |
| 8 | `Timestamp` | canonical | 3 | 100 | 3 | date |  |
| 9 | `Last Updated At` | canonical | 0 | 0 | 0 | empty |  |
| 10 | `Diinput Oleh` | canonical | 0 | 0 | 0 | empty |  |
| 11 | `Role Penginput` | canonical | 0 | 0 | 0 | empty |  |
| 12 | `Tahap Workflow Terakhir` | canonical | 0 | 0 | 0 | empty |  |
| 13 | `Label Tahap Workflow Terakhir` | canonical | 0 | 0 | 0 | empty |  |
| 14 | `Diupdate Oleh Tahap Terakhir` | canonical | 0 | 0 | 0 | empty |  |
| 15 | `Role Pengupdate Tahap Terakhir` | canonical | 0 | 0 | 0 | empty |  |
| 16 | `Waktu Update Tahap Terakhir` | canonical | 0 | 0 | 0 | empty |  |
| 17 | `Sumber Laporan` | canonical | 3 | 100 | 2 | text |  |
| 18 | `Nama unit pelapor` | canonical | 3 | 100 | 2 | text |  |
| 19 | `Provinsi` | canonical | 0 | 0 | 0 | empty |  |
| 20 | `Kab/Kota` | canonical | 0 | 0 | 0 | empty |  |
| 21 | `Nama Petugas` | canonical | 0 | 0 | 0 | empty |  |
| 22 | `No Whatsapp Petugas` | canonical | 3 | 100 | 3 | text | formula_like_values |
| 23 | `Email Petugas` | canonical | 3 | 100 | 3 | email |  |
| 24 | `Tanggal terima laporan` | canonical | 3 | 100 | 3 | date |  |
| 25 | `Tanggal Pelacakan` | canonical | 3 | 100 | 3 | date |  |
| 26 | `NIK` | canonical | 3 | 100 | 3 | numeric |  |
| 27 | `Nama` | canonical | 3 | 100 | 3 | text |  |
| 28 | `JK` | canonical | 3 | 100 | 2 | text |  |
| 29 | `Tanggal Lahir` | canonical | 3 | 100 | 3 | date |  |
| 30 | `Umur (auto)` | canonical | 3 | 100 | 3 | text |  |
| 31 | `Kelompok Umur Epidemiologis` | canonical | 0 | 0 | 0 | empty |  |
| 32 | `Nama orang tua/wali` | canonical | 0 | 0 | 0 | empty | case_or_format_variant_header |
| 33 | `No. kontak orang tua/wali` | canonical | 0 | 0 | 0 | empty |  |
| 34 | `Apakah sekolah/bekerja?` | canonical | 0 | 0 | 0 | empty |  |
| 35 | `Kelas Saat Ini` | canonical | 0 | 0 | 0 | empty |  |
| 36 | `Nama sekolah/tempat bekerja` | canonical | 0 | 0 | 0 | empty |  |
| 37 | `Tinggi Badan (cm)` | canonical | 2 | 66.67 | 2 | numeric |  |
| 38 | `Berat Badan (kg)` | canonical | 2 | 66.67 | 2 | date |  |
| 39 | `Alamat` | canonical | 3 | 100 | 3 | text |  |
| 40 | `RT` | canonical | 3 | 100 | 3 | numeric | formula_like_values |
| 41 | `RW` | canonical | 3 | 100 | 3 | numeric | formula_like_values |
| 42 | `Provinsi Pasien` | canonical | 0 | 0 | 0 | empty |  |
| 43 | `Kab/Kota Pasien` | canonical | 0 | 0 | 0 | empty |  |
| 44 | `Kecamatan` | canonical | 3 | 100 | 2 | text |  |
| 45 | `Kelurahan` | canonical | 3 | 100 | 3 | text |  |
| 46 | `Latitude` | canonical | 0 | 0 | 0 | empty |  |
| 47 | `Longitude` | canonical | 0 | 0 | 0 | empty |  |
| 48 | `Ambil Lokasi` | canonical | 0 | 0 | 0 | empty |  |
| 49 | `Nama Kantor & Jabatan` | canonical | 0 | 0 | 0 | empty |  |
| 50 | `No. kontak pasien` | canonical | 0 | 0 | 0 | empty |  |
| 51 | `Orang tua/Wali/Saudara dekat` | canonical | 0 | 0 | 0 | empty |  |
| 52 | `No. Telepon Wali` | canonical | 0 | 0 | 0 | empty |  |
| 53 | `Alamat Lengkap Wali` | canonical | 0 | 0 | 0 | empty |  |
| 54 | `Desa/Kelurahan Wali` | canonical | 0 | 0 | 0 | empty |  |
| 55 | `Kecamatan Wali` | canonical | 0 | 0 | 0 | empty |  |
| 56 | `Kab/Kota Wali` | canonical | 0 | 0 | 0 | empty |  |
| 57 | `Provinsi Wali` | canonical | 0 | 0 | 0 | empty |  |
| 58 | `Pekerjaan` | canonical | 0 | 0 | 0 | empty |  |
| 59 | `Alamat tempat kerja` | canonical | 0 | 0 | 0 | empty |  |
| 60 | `Tanggal mulai sakit` | canonical | 0 | 0 | 0 | empty |  |
| 61 | `Keluhan Utama` | canonical | 0 | 0 | 0 | empty | case_or_format_variant_header |
| 62 | `Demam` | canonical | 0 | 0 | 0 | empty |  |
| 63 | `Tanggal mulai demam` | canonical | 3 | 100 | 3 | date |  |
| 64 | `Sakit tenggorokan?` | canonical | 3 | 100 | 1 | booleanish |  |
| 65 | `Tanggal sakit tenggorokan` | canonical | 0 | 0 | 0 | empty |  |
| 66 | `Bull neck` | canonical | 0 | 0 | 0 | empty |  |
| 67 | `Tanggal leher bengkak` | canonical | 0 | 0 | 0 | empty |  |
| 68 | `Sesak nafas?` | canonical | 2 | 66.67 | 1 | booleanish |  |
| 69 | `Tanggal sesak nafas` | canonical | 0 | 0 | 0 | empty |  |
| 70 | `Pseudomembran?` | canonical | 2 | 66.67 | 1 | booleanish |  |
| 71 | `Tanggal pseudomembran` | canonical | 0 | 0 | 0 | empty |  |
| 72 | `Lokasi pseudomembran` | canonical | 0 | 0 | 0 | empty |  |
| 73 | `Gejala lain DIF` | canonical | 0 | 0 | 0 | empty |  |
| 74 | `Status Gizi` | canonical | 0 | 0 | 0 | empty | case_or_format_variant_header |
| 75 | `Swab diambil?` | canonical | 0 | 0 | 0 | empty |  |
| 76 | `Lokasi ambil swab` | canonical | 0 | 0 | 0 | empty |  |
| 77 | `Tanggal ambil swab` | canonical | 0 | 0 | 0 | empty |  |
| 78 | `No Kode Spesimen` | canonical | 0 | 0 | 0 | empty |  |
| 79 | `Tanggal kirim swab` | canonical | 0 | 0 | 0 | empty |  |
| 80 | `Rawat inap?` | canonical | 0 | 0 | 0 | empty |  |
| 81 | `Berobat ke RS?` | canonical | 2 | 66.67 | 1 | booleanish |  |
| 82 | `Tanggal berobat RS` | canonical | 0 | 0 | 0 | empty |  |
| 83 | `Tracheostomi` | canonical | 0 | 0 | 0 | empty |  |
| 84 | `Berobat ke Puskesmas?` | canonical | 1 | 33.33 | 1 | booleanish |  |
| 85 | `Tanggal berobat Puskesmas` | canonical | 0 | 0 | 0 | empty |  |
| 86 | `Berobat ke Dokter Swasta?` | canonical | 0 | 0 | 0 | empty |  |
| 87 | `Tanggal berobat Dokter Swasta` | canonical | 0 | 0 | 0 | empty |  |
| 88 | `Berobat ke Perawat/Bidan?` | canonical | 0 | 0 | 0 | empty |  |
| 89 | `Tanggal berobat Perawat/Bidan` | canonical | 0 | 0 | 0 | empty |  |
| 90 | `Tidak berobat` | canonical | 0 | 0 | 0 | empty |  |
| 91 | `Diagnosis suspek difteri` | canonical | 0 | 0 | 0 | empty |  |
| 92 | `Tanggal diagnosis suspek` | canonical | 0 | 0 | 0 | empty |  |
| 93 | `Antibiotik diberikan?` | canonical | 0 | 0 | 0 | empty |  |
| 94 | `Jenis antibiotik` | canonical | 1 | 33.33 | 1 | text |  |
| 95 | `Tanggal antibiotik` | canonical | 0 | 0 | 0 | empty |  |
| 96 | `ADS diberikan?` | canonical | 0 | 0 | 0 | empty |  |
| 97 | `Dosis ADS (IU)` | canonical | 1 | 33.33 | 1 | numeric |  |
| 98 | `Tanggal ADS` | canonical | 0 | 0 | 0 | empty |  |
| 99 | `Alasan tidak ADS` | canonical | 0 | 0 | 0 | empty |  |
| 100 | `Obat lain DIF` | canonical | 0 | 0 | 0 | empty |  |
| 101 | `Kondisi kasus saat ini` | canonical | 2 | 66.67 | 1 | text |  |
| 102 | `Tanggal sembuh DIF` | canonical | 0 | 0 | 0 | empty |  |
| 103 | `Tanggal meninggal DIF` | canonical | 0 | 0 | 0 | empty |  |
| 104 | `Riwayat perjalanan 10 hari` | canonical | 0 | 0 | 0 | empty |  |
| 105 | `Daerah perjalanan DIF` | canonical | 0 | 0 | 0 | empty |  |
| 106 | `Riwayat kontak suspek/konfirmasi difteri` | canonical | 0 | 0 | 0 | empty |  |
| 107 | `Nama alamat kontak DIF` | canonical | 0 | 0 | 0 | empty |  |
| 108 | `Status Verifikasi EPID` | canonical | 0 | 0 | 0 | empty |  |
| 109 | `Tanggal Verifikasi EPID` | canonical | 0 | 0 | 0 | empty |  |
| 110 | `Petugas Verifikator` | canonical | 0 | 0 | 0 | empty |  |
| 111 | `Review Admin Terakhir` | canonical | 0 | 0 | 0 | empty |  |
| 112 | `Catatan Verifikasi EPID` | canonical | 0 | 0 | 0 | empty |  |
| 113 | `Pemeriksaan Sampel Dilakukan` | canonical | 0 | 0 | 0 | empty |  |
| 114 | `Jenis Sampel Diuji` | canonical | 0 | 0 | 0 | empty |  |
| 115 | `Nomor Sampel / Lab` | canonical | 0 | 0 | 0 | empty |  |
| 116 | `Tanggal Hasil Sampel` | canonical | 0 | 0 | 0 | empty |  |
| 117 | `Hasil Pemeriksaan Sampel` | canonical | 0 | 0 | 0 | empty |  |
| 118 | `Interpretasi Hasil Sampel` | canonical | 0 | 0 | 0 | empty |  |
| 119 | `Status Pasien/Kasus` | canonical | 0 | 0 | 0 | empty |  |
| 120 | `Tanggal Update Status` | canonical | 0 | 0 | 0 | empty |  |
| 121 | `Dasar Penetapan Status` | canonical | 0 | 0 | 0 | empty |  |
| 122 | `Catatan Status Pasien` | canonical | 0 | 0 | 0 | empty |  |
| 123 | `Riwayat Status Kasus` | canonical | 0 | 0 | 0 | empty |  |
| 124 | `Kecamatan Pengampu` | canonical | 0 | 0 | 0 | empty |  |
| 125 | `Kelurahan Pengampu` | canonical | 0 | 0 | 0 | empty |  |
| 126 | `KodePuskesmas Pengampu` | canonical | 0 | 0 | 0 | empty |  |
| 127 | `Puskesmas Pengampu` | canonical | 0 | 0 | 0 | empty |  |
| 128 | `Kepala Puskesmas Pengampu` | canonical | 0 | 0 | 0 | empty |  |
| 129 | `Email Kapus Pengampu` | canonical | 0 | 0 | 0 | empty |  |
| 130 | `Petugas Surveilans Pengampu` | canonical | 0 | 0 | 0 | empty |  |
| 131 | `Email Petugas Pengampu` | canonical | 0 | 0 | 0 | empty |  |
| 132 | `SpreadsheetId Pengampu` | canonical | 0 | 0 | 0 | empty |  |
| 133 | `SpreadsheetUrl Pengampu` | canonical | 0 | 0 | 0 | empty |  |
| 134 | `Telegram Chat Id Pengampu` | canonical | 0 | 0 | 0 | empty |  |
| 135 | `Status Routing Pengampu` | canonical | 0 | 0 | 0 | empty |  |
| 136 | `Status Notifikasi Pengampu` | canonical | 0 | 0 | 0 | empty |  |
| 137 | `Reason Notifikasi Pengampu` | canonical | 0 | 0 | 0 | empty |  |
| 138 | `Notified At Pengampu` | canonical | 0 | 0 | 0 | empty |  |
| 139 | `Notified To Pengampu` | canonical | 0 | 0 | 0 | empty |  |
| 140 | `Status Sinkronisasi Pengampu` | canonical | 0 | 0 | 0 | empty |  |
| 141 | `Reason Sinkronisasi Pengampu` | canonical | 0 | 0 | 0 | empty |  |
| 142 | `Synced At Pengampu` | canonical | 0 | 0 | 0 | empty |  |
| 143 | `Sync Target Pengampu` | canonical | 0 | 0 | 0 | empty |  |
| 144 | `Status Notifikasi Telegram` | canonical | 0 | 0 | 0 | empty |  |
| 145 | `Reason Notifikasi Telegram` | canonical | 0 | 0 | 0 | empty |  |
| 146 | `Telegram Notified At` | canonical | 0 | 0 | 0 | empty |  |
| 147 | `Telegram Target` | canonical | 0 | 0 | 0 | empty |  |
| 148 | `Telegram Retry Count` | canonical | 0 | 0 | 0 | empty |  |
| 149 | `Pipeline Fingerprint` | canonical | 0 | 0 | 0 | empty |  |
| 150 | `Pipeline Last Run At` | canonical | 0 | 0 | 0 | empty |  |
| 151 | `Status Notifikasi Revisi Pengampu` | canonical | 0 | 0 | 0 | empty |  |
| 152 | `Reason Notifikasi Revisi Pengampu` | canonical | 0 | 0 | 0 | empty |  |
| 153 | `Revision Notified At Pengampu` | canonical | 0 | 0 | 0 | empty |  |
| 154 | `Revision Notified To Pengampu` | canonical | 0 | 0 | 0 | empty |  |
| 155 | `Status Notifikasi Revisi Telegram` | canonical | 0 | 0 | 0 | empty |  |
| 156 | `Reason Notifikasi Revisi Telegram` | canonical | 0 | 0 | 0 | empty |  |
| 157 | `Revision Telegram Notified At` | canonical | 0 | 0 | 0 | empty |  |
| 158 | `Revision Telegram Target` | canonical | 0 | 0 | 0 | empty |  |
| 159 | `Revision Notification Fingerprint` | canonical | 0 | 0 | 0 | empty |  |
| 160 | `Revision Notification Last Run At` | canonical | 0 | 0 | 0 | empty |  |
| 161 | `Status Verifikasi Sebelumnya` | canonical | 0 | 0 | 0 | empty |  |
| 162 | `Notifikasi Revisi Dibaca` | canonical | 0 | 0 | 0 | empty |  |
| 163 | `Waktu Permintaan Revisi` | canonical | 0 | 0 | 0 | empty |  |
| 164 | `Waktu Verifikasi Pending` | canonical | 0 | 0 | 0 | empty |  |
| 165 | `dx` | non_canonical | 3 | 100 | 1 | text | non_canonical_with_data, case_or_format_variant_header |
| 166 | `Klasifikasi` | non_canonical | 3 | 100 | 1 | text | non_canonical_with_data |
| 167 | `Bekerja/sekolah?` | non_canonical | 2 | 66.67 | 2 | booleanish | non_canonical_with_data |
| 168 | `Alamat tempat kerja/sekolah` | non_canonical | 1 | 33.33 | 1 | text | non_canonical_with_data |
| 169 | `Koordinat (lat,lon)` | non_canonical | 0 | 0 | 0 | empty |  |
| 170 | `Kab/Kota domisili penderita` | non_canonical | 2 | 66.67 | 1 | text | non_canonical_with_data |
| 171 | `Provinsi domisili penderita` | non_canonical | 2 | 66.67 | 1 | text | non_canonical_with_data |
| 172 | `Nama Orang Tua/Wali` | non_canonical | 3 | 100 | 3 | text | non_canonical_with_data, case_or_format_variant_header, formula_like_values |
| 173 | `No Telp/WA Orang Tua/Wali` | non_canonical | 3 | 100 | 3 | numeric | non_canonical_with_data, formula_like_values |
| 174 | `Petugas` | non_canonical | 3 | 100 | 3 | text | non_canonical_with_data |
| 175 | `Provinsi unit pelapor` | non_canonical | 3 | 100 | 1 | text | non_canonical_with_data |
| 176 | `Kab/Kota unit pelapor` | non_canonical | 3 | 100 | 1 | text | non_canonical_with_data |
| 177 | `Link PDF` | non_canonical | 3 | 100 | 3 | url | non_canonical_with_data |
| 178 | `Tanggal mulai sakit tenggorokan` | non_canonical | 3 | 100 | 3 | date | non_canonical_with_data |
| 179 | `Keluhan utama` | non_canonical | 3 | 100 | 3 | text | non_canonical_with_data, case_or_format_variant_header |
| 180 | `Demam?` | non_canonical | 3 | 100 | 1 | booleanish | non_canonical_with_data |
| 181 | `Tanggal mulai sakit tenggorokan (gejala)` | non_canonical | 3 | 100 | 3 | date | non_canonical_with_data |
| 182 | `Leher bengkak?` | non_canonical | 3 | 100 | 2 | booleanish | non_canonical_with_data |
| 183 | `Tanggal mulai leher bengkak` | non_canonical | 2 | 66.67 | 2 | date | non_canonical_with_data |
| 184 | `Tanggal mulai sesak nafas` | non_canonical | 0 | 0 | 0 | empty |  |
| 185 | `Tanggal muncul pseudomembran` | non_canonical | 2 | 66.67 | 2 | date | non_canonical_with_data |
| 186 | `Gejala lain, sebutkan` | non_canonical | 1 | 33.33 | 1 | text | non_canonical_with_data |
| 187 | `Status gizi` | non_canonical | 1 | 33.33 | 1 | text | non_canonical_with_data, case_or_format_variant_header |
| 188 | `Imunisasi DPT-HB-Hib 1` | non_canonical | 2 | 66.67 | 1 | booleanish | non_canonical_with_data |
| 189 | `Sumber informasi imunisasi DPT-HB-Hib 1` | non_canonical | 2 | 66.67 | 1 | text | non_canonical_with_data |
| 190 | `Imunisasi DPT-HB-Hib 2` | non_canonical | 2 | 66.67 | 1 | booleanish | non_canonical_with_data |
| 191 | `Sumber informasi imunisasi DPT-HB-Hib 2` | non_canonical | 2 | 66.67 | 1 | text | non_canonical_with_data |
| 192 | `Imunisasi DPT-HB-Hib 3` | non_canonical | 1 | 33.33 | 1 | booleanish | non_canonical_with_data |
| 193 | `Sumber informasi imunisasi DPT-HB-Hib 3` | non_canonical | 2 | 66.67 | 1 | text | non_canonical_with_data |
| 194 | `Imunisasi DPT-HB-Hib booster (18 bln)` | non_canonical | 2 | 66.67 | 2 | text | non_canonical_with_data |
| 195 | `Sumber informasi imunisasi DPT-HB-Hib booster (18 bln)` | non_canonical | 1 | 33.33 | 1 | text | non_canonical_with_data |
| 196 | `Imunisasi DT kelas 1` | non_canonical | 1 | 33.33 | 1 | booleanish | non_canonical_with_data |
| 197 | `Sumber informasi imunisasi DT kelas 1` | non_canonical | 1 | 33.33 | 1 | text | non_canonical_with_data |
| 198 | `Imunisasi Td kelas 2 dan 5` | non_canonical | 1 | 33.33 | 1 | booleanish | non_canonical_with_data |
| 199 | `Sumber informasi imunisasi Td kelas 2 dan 5` | non_canonical | 1 | 33.33 | 1 | text | non_canonical_with_data |
| 200 | `Jenis spesimen difteri` | non_canonical | 2 | 66.67 | 1 | text | non_canonical_with_data |
| 201 | `Tanggal pengambilan spesimen difteri` | non_canonical | 2 | 66.67 | 2 | date | non_canonical_with_data |
| 202 | `Kode spesimen difteri` | non_canonical | 0 | 0 | 0 | empty |  |
| 203 | `Tanggal pengiriman spesimen difteri` | non_canonical | 0 | 0 | 0 | empty |  |
| 204 | `Tanggal berobat ke RS` | non_canonical | 2 | 66.67 | 2 | date | non_canonical_with_data |
| 205 | `Nama Rumah Sakit` | non_canonical | 2 | 66.67 | 2 | text | non_canonical_with_data |
| 206 | `Trakeostomi di RS?` | non_canonical | 1 | 33.33 | 1 | booleanish | non_canonical_with_data |
| 207 | `Tanggal berobat ke Puskesmas` | non_canonical | 0 | 0 | 0 | empty |  |
| 208 | `Berobat ke dr praktek swasta?` | non_canonical | 1 | 33.33 | 1 | booleanish | non_canonical_with_data |
| 209 | `Tanggal berobat ke dr praktek swasta` | non_canonical | 0 | 0 | 0 | empty |  |
| 210 | `Berobat ke perawat/mantri/bidan?` | non_canonical | 1 | 33.33 | 1 | booleanish | non_canonical_with_data |
| 211 | `Tanggal berobat ke perawat/mantri/bidan` | non_canonical | 0 | 0 | 0 | empty |  |
| 212 | `Tidak berobat?` | non_canonical | 1 | 33.33 | 1 | booleanish | non_canonical_with_data |
| 213 | `Diagnosis sebagai suspek difteri?` | non_canonical | 1 | 33.33 | 1 | booleanish | non_canonical_with_data |
| 214 | `Tanggal diagnosis suspek difteri` | non_canonical | 1 | 33.33 | 1 | date | non_canonical_with_data |
| 215 | `Pemberian antibiotik?` | non_canonical | 1 | 33.33 | 1 | booleanish | non_canonical_with_data |
| 216 | `Tanggal mulai antibiotik` | non_canonical | 1 | 33.33 | 1 | date | non_canonical_with_data |
| 217 | `Pemberian ADS?` | non_canonical | 1 | 33.33 | 1 | booleanish | non_canonical_with_data |
| 218 | `Tanggal pemberian ADS` | non_canonical | 0 | 0 | 0 | empty |  |
| 219 | `Alasan tidak diberikan ADS` | non_canonical | 0 | 0 | 0 | empty |  |
| 220 | `Obat lain yang diberikan` | non_canonical | 1 | 33.33 | 1 | text | non_canonical_with_data, formula_like_values |
| 221 | `Tanggal sembuh/meninggal` | non_canonical | 0 | 0 | 0 | empty |  |
| 222 | `Bepergian 10 hari sebelum sakit s.d 2 hari setelah minum antibiotik?` | non_canonical | 2 | 66.67 | 1 | text | non_canonical_with_data |
| 223 | `Lokasi / daerah yang dikunjungi` | non_canonical | 0 | 0 | 0 | empty |  |
| 224 | `Berkunjung ke rumah teman/saudara dengan gejala sama?` | non_canonical | 2 | 66.67 | 1 | text | non_canonical_with_data |
| 225 | `Nama & alamat yang dikunjungi` | non_canonical | 0 | 0 | 0 | empty |  |
| 226 | `KontakEratJSON` | non_canonical | 3 | 100 | 2 | jsonish | non_canonical_with_data |

### PERT_Raw

| Col | Header | Status | Non-empty | Fill % | Distinct | Type | Flags |
| ---: | --- | --- | ---: | ---: | ---: | --- | --- |
| 1 | `ID Registrasi Kasus` | canonical | 0 | 0 | 0 | empty |  |
| 2 | `Nomor EPID` | canonical | 4 | 100 | 4 | text |  |
| 3 | `Nomor EPID Rekomendasi` | canonical | 0 | 0 | 0 | empty |  |
| 4 | `Nomor EPID Final` | canonical | 0 | 0 | 0 | empty |  |
| 5 | `DX` | canonical | 0 | 0 | 0 | empty | case_or_format_variant_header |
| 6 | `Tanggal Input` | canonical | 0 | 0 | 0 | empty |  |
| 7 | `Tanggal Update` | canonical | 0 | 0 | 0 | empty |  |
| 8 | `Timestamp` | canonical | 4 | 100 | 4 | date |  |
| 9 | `Last Updated At` | canonical | 0 | 0 | 0 | empty |  |
| 10 | `Diinput Oleh` | canonical | 0 | 0 | 0 | empty |  |
| 11 | `Role Penginput` | canonical | 0 | 0 | 0 | empty |  |
| 12 | `Tahap Workflow Terakhir` | canonical | 0 | 0 | 0 | empty |  |
| 13 | `Label Tahap Workflow Terakhir` | canonical | 0 | 0 | 0 | empty |  |
| 14 | `Diupdate Oleh Tahap Terakhir` | canonical | 0 | 0 | 0 | empty |  |
| 15 | `Role Pengupdate Tahap Terakhir` | canonical | 0 | 0 | 0 | empty |  |
| 16 | `Waktu Update Tahap Terakhir` | canonical | 0 | 0 | 0 | empty |  |
| 17 | `Sumber Laporan` | canonical | 4 | 100 | 1 | text |  |
| 18 | `Nama unit pelapor` | canonical | 4 | 100 | 2 | text |  |
| 19 | `Provinsi` | canonical | 0 | 0 | 0 | empty |  |
| 20 | `Kab/Kota` | canonical | 0 | 0 | 0 | empty |  |
| 21 | `Nama Petugas` | canonical | 0 | 0 | 0 | empty |  |
| 22 | `No Whatsapp Petugas` | canonical | 1 | 25 | 1 | numeric |  |
| 23 | `Email Petugas` | canonical | 4 | 100 | 3 | email |  |
| 24 | `Tanggal terima laporan` | canonical | 4 | 100 | 4 | date |  |
| 25 | `Tanggal Pelacakan` | canonical | 4 | 100 | 4 | date |  |
| 26 | `NIK` | canonical | 4 | 100 | 3 | numeric |  |
| 27 | `Nama` | canonical | 4 | 100 | 4 | text |  |
| 28 | `JK` | canonical | 4 | 100 | 1 | text |  |
| 29 | `Tanggal Lahir` | canonical | 4 | 100 | 3 | date |  |
| 30 | `Umur (auto)` | canonical | 4 | 100 | 4 | text |  |
| 31 | `Kelompok Umur Epidemiologis` | canonical | 0 | 0 | 0 | empty |  |
| 32 | `Nama orang tua/wali` | canonical | 0 | 0 | 0 | empty | case_or_format_variant_header |
| 33 | `No. kontak orang tua/wali` | canonical | 0 | 0 | 0 | empty |  |
| 34 | `Apakah sekolah/bekerja?` | canonical | 1 | 25 | 1 | booleanish |  |
| 35 | `Kelas Saat Ini` | canonical | 0 | 0 | 0 | empty |  |
| 36 | `Nama sekolah/tempat bekerja` | canonical | 0 | 0 | 0 | empty |  |
| 37 | `Tinggi Badan (cm)` | canonical | 2 | 50 | 2 | numeric |  |
| 38 | `Berat Badan (kg)` | canonical | 2 | 50 | 2 | numeric |  |
| 39 | `Alamat` | canonical | 4 | 100 | 3 | text |  |
| 40 | `RT` | canonical | 4 | 100 | 3 | numeric |  |
| 41 | `RW` | canonical | 4 | 100 | 3 | numeric |  |
| 42 | `Provinsi Pasien` | canonical | 0 | 0 | 0 | empty |  |
| 43 | `Kab/Kota Pasien` | canonical | 0 | 0 | 0 | empty |  |
| 44 | `Kecamatan` | canonical | 4 | 100 | 3 | text |  |
| 45 | `Kelurahan` | canonical | 4 | 100 | 3 | text |  |
| 46 | `Latitude` | canonical | 0 | 0 | 0 | empty |  |
| 47 | `Longitude` | canonical | 0 | 0 | 0 | empty |  |
| 48 | `Ambil Lokasi` | canonical | 0 | 0 | 0 | empty |  |
| 49 | `Tanggal mulai batuk` | canonical | 4 | 100 | 4 | date |  |
| 50 | `Batuk terus menerus?` | canonical | 4 | 100 | 1 | booleanish |  |
| 51 | `Batuk ≥ 2 minggu?` | canonical | 0 | 0 | 0 | empty |  |
| 52 | `Whoop` | canonical | 0 | 0 | 0 | empty |  |
| 53 | `Muntah setelah batuk` | canonical | 0 | 0 | 0 | empty |  |
| 54 | `Apnea` | canonical | 0 | 0 | 0 | empty |  |
| 55 | `Tanggal mulai apnea` | canonical | 0 | 0 | 0 | empty |  |
| 56 | `Gejala lain pertusis` | canonical | 0 | 0 | 0 | empty |  |
| 57 | `Rawat inap?` | canonical | 0 | 0 | 0 | empty |  |
| 58 | `Nama Rumah Sakit` | canonical | 2 | 50 | 2 | text |  |
| 59 | `Nomor Rekam Medik` | canonical | 2 | 50 | 2 | date |  |
| 60 | `Tanggal Masuk Rawat Inap` | canonical | 0 | 0 | 0 | empty | case_or_format_variant_header |
| 61 | `Tanggal Keluar` | canonical | 0 | 0 | 0 | empty | case_or_format_variant_header |
| 62 | `Kontak batuk lama` | canonical | 0 | 0 | 0 | empty |  |
| 63 | `Ada klaster/kejadian serupa` | canonical | 0 | 0 | 0 | empty |  |
| 64 | `Jumlah kasus sekitar PERT` | canonical | 0 | 0 | 0 | empty |  |
| 65 | `Perjalanan 1 bulan PERT` | canonical | 0 | 0 | 0 | empty |  |
| 66 | `Lokasi perjalanan PERT` | canonical | 0 | 0 | 0 | empty |  |
| 67 | `Tanggal pergi PERT` | canonical | 0 | 0 | 0 | empty |  |
| 68 | `Tanggal kembali PERT` | canonical | 0 | 0 | 0 | empty |  |
| 69 | `Spesimen pertusis diambil?` | canonical | 0 | 0 | 0 | empty |  |
| 70 | `Tanggal ambil spesimen pertusis` | canonical | 0 | 0 | 0 | empty |  |
| 71 | `Jenis spesimen pertusis` | canonical | 0 | 0 | 0 | empty |  |
| 72 | `Tanggal kirim spesimen pertusis` | canonical | 0 | 0 | 0 | empty |  |
| 73 | `Spesimen lain pertusis diambil?` | canonical | 0 | 0 | 0 | empty |  |
| 74 | `Jenis spesimen lain pertusis` | canonical | 0 | 0 | 0 | empty |  |
| 75 | `Tanggal ambil spesimen lain pertusis` | canonical | 0 | 0 | 0 | empty |  |
| 76 | `Tanggal kirim spesimen lain pertusis` | canonical | 0 | 0 | 0 | empty |  |
| 77 | `Status akhir PERT` | canonical | 0 | 0 | 0 | empty |  |
| 78 | `Tanggal meninggal PERT` | canonical | 0 | 0 | 0 | empty |  |
| 79 | `Status Verifikasi EPID` | canonical | 0 | 0 | 0 | empty |  |
| 80 | `Tanggal Verifikasi EPID` | canonical | 0 | 0 | 0 | empty |  |
| 81 | `Petugas Verifikator` | canonical | 0 | 0 | 0 | empty |  |
| 82 | `Review Admin Terakhir` | canonical | 0 | 0 | 0 | empty |  |
| 83 | `Catatan Verifikasi EPID` | canonical | 0 | 0 | 0 | empty |  |
| 84 | `Pemeriksaan Sampel Dilakukan` | canonical | 0 | 0 | 0 | empty |  |
| 85 | `Jenis Sampel Diuji` | canonical | 0 | 0 | 0 | empty |  |
| 86 | `Nomor Sampel / Lab` | canonical | 0 | 0 | 0 | empty |  |
| 87 | `Tanggal Hasil Sampel` | canonical | 0 | 0 | 0 | empty |  |
| 88 | `Hasil Pemeriksaan Sampel` | canonical | 0 | 0 | 0 | empty |  |
| 89 | `Interpretasi Hasil Sampel` | canonical | 0 | 0 | 0 | empty |  |
| 90 | `Status Pasien/Kasus` | canonical | 0 | 0 | 0 | empty |  |
| 91 | `Tanggal Update Status` | canonical | 0 | 0 | 0 | empty |  |
| 92 | `Dasar Penetapan Status` | canonical | 0 | 0 | 0 | empty |  |
| 93 | `Catatan Status Pasien` | canonical | 0 | 0 | 0 | empty |  |
| 94 | `Riwayat Status Kasus` | canonical | 0 | 0 | 0 | empty |  |
| 95 | `Kecamatan Pengampu` | canonical | 0 | 0 | 0 | empty |  |
| 96 | `Kelurahan Pengampu` | canonical | 0 | 0 | 0 | empty |  |
| 97 | `KodePuskesmas Pengampu` | canonical | 0 | 0 | 0 | empty |  |
| 98 | `Puskesmas Pengampu` | canonical | 0 | 0 | 0 | empty |  |
| 99 | `Kepala Puskesmas Pengampu` | canonical | 0 | 0 | 0 | empty |  |
| 100 | `Email Kapus Pengampu` | canonical | 0 | 0 | 0 | empty |  |
| 101 | `Petugas Surveilans Pengampu` | canonical | 0 | 0 | 0 | empty |  |
| 102 | `Email Petugas Pengampu` | canonical | 0 | 0 | 0 | empty |  |
| 103 | `SpreadsheetId Pengampu` | canonical | 0 | 0 | 0 | empty |  |
| 104 | `SpreadsheetUrl Pengampu` | canonical | 0 | 0 | 0 | empty |  |
| 105 | `Telegram Chat Id Pengampu` | canonical | 0 | 0 | 0 | empty |  |
| 106 | `Status Routing Pengampu` | canonical | 0 | 0 | 0 | empty |  |
| 107 | `Status Notifikasi Pengampu` | canonical | 0 | 0 | 0 | empty |  |
| 108 | `Reason Notifikasi Pengampu` | canonical | 0 | 0 | 0 | empty |  |
| 109 | `Notified At Pengampu` | canonical | 0 | 0 | 0 | empty |  |
| 110 | `Notified To Pengampu` | canonical | 0 | 0 | 0 | empty |  |
| 111 | `Status Sinkronisasi Pengampu` | canonical | 0 | 0 | 0 | empty |  |
| 112 | `Reason Sinkronisasi Pengampu` | canonical | 0 | 0 | 0 | empty |  |
| 113 | `Synced At Pengampu` | canonical | 0 | 0 | 0 | empty |  |
| 114 | `Sync Target Pengampu` | canonical | 0 | 0 | 0 | empty |  |
| 115 | `Status Notifikasi Telegram` | canonical | 0 | 0 | 0 | empty |  |
| 116 | `Reason Notifikasi Telegram` | canonical | 0 | 0 | 0 | empty |  |
| 117 | `Telegram Notified At` | canonical | 0 | 0 | 0 | empty |  |
| 118 | `Telegram Target` | canonical | 0 | 0 | 0 | empty |  |
| 119 | `Telegram Retry Count` | canonical | 0 | 0 | 0 | empty |  |
| 120 | `Pipeline Fingerprint` | canonical | 0 | 0 | 0 | empty |  |
| 121 | `Pipeline Last Run At` | canonical | 0 | 0 | 0 | empty |  |
| 122 | `Status Notifikasi Revisi Pengampu` | canonical | 0 | 0 | 0 | empty |  |
| 123 | `Reason Notifikasi Revisi Pengampu` | canonical | 0 | 0 | 0 | empty |  |
| 124 | `Revision Notified At Pengampu` | canonical | 0 | 0 | 0 | empty |  |
| 125 | `Revision Notified To Pengampu` | canonical | 0 | 0 | 0 | empty |  |
| 126 | `Status Notifikasi Revisi Telegram` | canonical | 0 | 0 | 0 | empty |  |
| 127 | `Reason Notifikasi Revisi Telegram` | canonical | 0 | 0 | 0 | empty |  |
| 128 | `Revision Telegram Notified At` | canonical | 0 | 0 | 0 | empty |  |
| 129 | `Revision Telegram Target` | canonical | 0 | 0 | 0 | empty |  |
| 130 | `Revision Notification Fingerprint` | canonical | 0 | 0 | 0 | empty |  |
| 131 | `Revision Notification Last Run At` | canonical | 0 | 0 | 0 | empty |  |
| 132 | `Status Verifikasi Sebelumnya` | canonical | 0 | 0 | 0 | empty |  |
| 133 | `Notifikasi Revisi Dibaca` | canonical | 0 | 0 | 0 | empty |  |
| 134 | `Waktu Permintaan Revisi` | canonical | 0 | 0 | 0 | empty |  |
| 135 | `Waktu Verifikasi Pending` | canonical | 0 | 0 | 0 | empty |  |
| 136 | `dx` | non_canonical | 4 | 100 | 1 | text | non_canonical_with_data, case_or_format_variant_header |
| 137 | `Klasifikasi` | non_canonical | 4 | 100 | 1 | text | non_canonical_with_data |
| 138 | `Koordinat (lat,lon)` | non_canonical | 0 | 0 | 0 | empty |  |
| 139 | `Nama Orang Tua/Wali` | non_canonical | 4 | 100 | 3 | text | non_canonical_with_data, case_or_format_variant_header, formula_like_values |
| 140 | `No Telp/WA Orang Tua/Wali` | non_canonical | 4 | 100 | 3 | text | non_canonical_with_data, formula_like_values |
| 141 | `Petugas` | non_canonical | 4 | 100 | 3 | text | non_canonical_with_data |
| 142 | `Provinsi unit pelapor` | non_canonical | 4 | 100 | 1 | text | non_canonical_with_data |
| 143 | `Kab/Kota unit pelapor` | non_canonical | 4 | 100 | 2 | text | non_canonical_with_data |
| 144 | `Link PDF` | non_canonical | 4 | 100 | 4 | url | non_canonical_with_data |
| 145 | `Apnea?` | non_canonical | 4 | 100 | 2 | booleanish | non_canonical_with_data |
| 146 | `Batuk rejan?` | non_canonical | 2 | 50 | 1 | booleanish | non_canonical_with_data |
| 147 | `Muntah setelah batuk?` | non_canonical | 2 | 50 | 2 | booleanish | non_canonical_with_data |
| 148 | `Gejala lain, sebutkan` | non_canonical | 1 | 25 | 1 | text | non_canonical_with_data |
| 149 | `Keadaan saat ini` | non_canonical | 2 | 50 | 1 | text | non_canonical_with_data |
| 150 | `Kasus dirawat di Rumah Sakit?` | non_canonical | 3 | 75 | 2 | booleanish | non_canonical_with_data |
| 151 | `Tanggal masuk rawat inap` | non_canonical | 2 | 50 | 2 | date | non_canonical_with_data, case_or_format_variant_header |
| 152 | `Tanggal keluar` | non_canonical | 2 | 50 | 2 | date | non_canonical_with_data, case_or_format_variant_header |
| 153 | `Imunisasi pertusis usia 2 bulan` | non_canonical | 2 | 50 | 1 | booleanish | non_canonical_with_data |
| 154 | `Sumber informasi imunisasi 2 bulan` | non_canonical | 2 | 50 | 2 | text | non_canonical_with_data |
| 155 | `Imunisasi pertusis usia 3 bulan` | non_canonical | 1 | 25 | 1 | booleanish | non_canonical_with_data |
| 156 | `Sumber informasi imunisasi 3 bulan` | non_canonical | 1 | 25 | 1 | text | non_canonical_with_data |
| 157 | `Imunisasi pertusis usia 4 bulan` | non_canonical | 1 | 25 | 1 | booleanish | non_canonical_with_data |
| 158 | `Sumber informasi imunisasi 4 bulan` | non_canonical | 1 | 25 | 1 | text | non_canonical_with_data |
| 159 | `Imunisasi pertusis usia 18 bulan` | non_canonical | 1 | 25 | 1 | booleanish | non_canonical_with_data |
| 160 | `Sumber informasi imunisasi 18 bulan` | non_canonical | 1 | 25 | 1 | text | non_canonical_with_data |
| 161 | `Imunisasi pertusis saat ORI?` | non_canonical | 0 | 0 | 0 | empty |  |
| 162 | `Sumber informasi imunisasi ORI` | non_canonical | 0 | 0 | 0 | empty |  |
| 163 | `Tanggal vaksinasi pertusis terakhir` | non_canonical | 0 | 0 | 0 | empty |  |
| 164 | `Ada kasus sekitar dengan gejala sama?` | non_canonical | 2 | 50 | 1 | booleanish | non_canonical_with_data |
| 165 | `Jumlah kasus sekitar` | non_canonical | 0 | 0 | 0 | empty |  |
| 166 | `Bepergian 1 bulan terakhir?` | non_canonical | 2 | 50 | 1 | booleanish | non_canonical_with_data |
| 167 | `Lokasi/daerah yang dikunjungi` | non_canonical | 0 | 0 | 0 | empty |  |
| 168 | `Tanggal pergi` | non_canonical | 0 | 0 | 0 | empty |  |
| 169 | `Tanggal kembali` | legacy_alias | 0 | 0 | 0 | empty | legacy_alias_live |
| 170 | `Spesimen diambil?` | legacy_alias | 2 | 50 | 2 | booleanish | legacy_alias_live |
| 171 | `Jenis spesimen` | legacy_alias | 1 | 25 | 1 | text | legacy_alias_live |
| 172 | `Tanggal ambil spesimen` | legacy_alias | 1 | 25 | 1 | date | legacy_alias_live |
| 173 | `Tanggal pengiriman spesimen` | non_canonical | 1 | 25 | 1 | date | non_canonical_with_data |
| 174 | `Spesimen lain diambil?` | non_canonical | 1 | 25 | 1 | booleanish | non_canonical_with_data |
| 175 | `Jenis sampel lain` | non_canonical | 0 | 0 | 0 | empty |  |
| 176 | `Tanggal ambil spesimen lain` | non_canonical | 0 | 0 | 0 | empty |  |
| 177 | `Tanggal pengiriman spesimen lain` | non_canonical | 0 | 0 | 0 | empty |  |
| 178 | `KontakEratJSON` | non_canonical | 4 | 100 | 1 | jsonish | non_canonical_with_data |
| 179 | `(blank)` | blank_header | 1 | 25 | 1 | numeric | blank_header_with_data |

### TN_Raw

| Col | Header | Status | Non-empty | Fill % | Distinct | Type | Flags |
| ---: | --- | --- | ---: | ---: | ---: | --- | --- |
| 1 | `ID Registrasi Kasus` | canonical | 0 | 0 | 0 | empty |  |
| 2 | `Nomor EPID` | canonical | 0 | 0 | 0 | empty |  |
| 3 | `Nomor EPID Rekomendasi` | canonical | 0 | 0 | 0 | empty |  |
| 4 | `Nomor EPID Final` | canonical | 0 | 0 | 0 | empty |  |
| 5 | `DX` | canonical | 0 | 0 | 0 | empty | case_or_format_variant_header |
| 6 | `Tanggal Input` | canonical | 0 | 0 | 0 | empty |  |
| 7 | `Tanggal Update` | canonical | 0 | 0 | 0 | empty |  |
| 8 | `Timestamp` | canonical | 0 | 0 | 0 | empty |  |
| 9 | `Last Updated At` | canonical | 0 | 0 | 0 | empty |  |
| 10 | `Diinput Oleh` | canonical | 0 | 0 | 0 | empty |  |
| 11 | `Role Penginput` | canonical | 0 | 0 | 0 | empty |  |
| 12 | `Tahap Workflow Terakhir` | canonical | 0 | 0 | 0 | empty |  |
| 13 | `Label Tahap Workflow Terakhir` | canonical | 0 | 0 | 0 | empty |  |
| 14 | `Diupdate Oleh Tahap Terakhir` | canonical | 0 | 0 | 0 | empty |  |
| 15 | `Role Pengupdate Tahap Terakhir` | canonical | 0 | 0 | 0 | empty |  |
| 16 | `Waktu Update Tahap Terakhir` | canonical | 0 | 0 | 0 | empty |  |
| 17 | `Sumber Laporan` | canonical | 0 | 0 | 0 | empty |  |
| 18 | `Nama unit pelapor` | canonical | 0 | 0 | 0 | empty |  |
| 19 | `Provinsi` | canonical | 0 | 0 | 0 | empty |  |
| 20 | `Kab/Kota` | canonical | 0 | 0 | 0 | empty |  |
| 21 | `Nama Petugas` | canonical | 0 | 0 | 0 | empty |  |
| 22 | `No Whatsapp Petugas` | canonical | 0 | 0 | 0 | empty |  |
| 23 | `Email Petugas` | canonical | 0 | 0 | 0 | empty |  |
| 24 | `Tanggal terima laporan` | canonical | 0 | 0 | 0 | empty |  |
| 25 | `Tanggal Pelacakan` | canonical | 0 | 0 | 0 | empty |  |
| 26 | `NIK` | canonical | 0 | 0 | 0 | empty |  |
| 27 | `Nama` | canonical | 0 | 0 | 0 | empty |  |
| 28 | `JK` | canonical | 0 | 0 | 0 | empty |  |
| 29 | `Tanggal Lahir` | canonical | 0 | 0 | 0 | empty |  |
| 30 | `Umur (auto)` | canonical | 0 | 0 | 0 | empty |  |
| 31 | `Kelompok Umur Epidemiologis` | canonical | 0 | 0 | 0 | empty |  |
| 32 | `Nama orang tua/wali` | canonical | 0 | 0 | 0 | empty | case_or_format_variant_header |
| 33 | `No. kontak orang tua/wali` | canonical | 0 | 0 | 0 | empty |  |
| 34 | `Apakah sekolah/bekerja?` | canonical | 0 | 0 | 0 | empty |  |
| 35 | `Kelas Saat Ini` | canonical | 0 | 0 | 0 | empty |  |
| 36 | `Nama sekolah/tempat bekerja` | canonical | 0 | 0 | 0 | empty |  |
| 37 | `Tinggi Badan (cm)` | canonical | 0 | 0 | 0 | empty |  |
| 38 | `Berat Badan (kg)` | canonical | 0 | 0 | 0 | empty |  |
| 39 | `Alamat` | canonical | 0 | 0 | 0 | empty |  |
| 40 | `RT` | canonical | 0 | 0 | 0 | empty |  |
| 41 | `RW` | canonical | 0 | 0 | 0 | empty |  |
| 42 | `Provinsi Pasien` | canonical | 0 | 0 | 0 | empty |  |
| 43 | `Kab/Kota Pasien` | canonical | 0 | 0 | 0 | empty |  |
| 44 | `Kecamatan` | canonical | 0 | 0 | 0 | empty |  |
| 45 | `Kelurahan` | canonical | 0 | 0 | 0 | empty |  |
| 46 | `Latitude` | canonical | 0 | 0 | 0 | empty |  |
| 47 | `Longitude` | canonical | 0 | 0 | 0 | empty |  |
| 48 | `Ambil Lokasi` | canonical | 0 | 0 | 0 | empty |  |
| 49 | `Nama Ibu` | canonical | 0 | 0 | 0 | empty |  |
| 50 | `Anak ke-` | canonical | 0 | 0 | 0 | empty |  |
| 51 | `Usia ibu` | canonical | 0 | 0 | 0 | empty |  |
| 52 | `Pekerjaan ibu` | canonical | 0 | 0 | 0 | empty | case_or_format_variant_header |
| 53 | `Pendidikan ibu` | canonical | 0 | 0 | 0 | empty | case_or_format_variant_header |
| 54 | `Lama tinggal di desa` | canonical | 0 | 0 | 0 | empty |  |
| 55 | `Apakah bayi lahir hidup` | canonical | 0 | 0 | 0 | empty |  |
| 56 | `Bayi menangis saat lahir` | canonical | 0 | 0 | 0 | empty |  |
| 57 | `Tanda kelahiran hidup` | canonical | 0 | 0 | 0 | empty |  |
| 58 | `Bayi bisa menyusu dengan baik` | canonical | 0 | 0 | 0 | empty |  |
| 59 | `Mulut mencucu dan tidak bisa menyusu` | canonical | 0 | 0 | 0 | empty |  |
| 60 | `Bayi mudah kejang` | canonical | 0 | 0 | 0 | empty |  |
| 61 | `Tanggal mulai sakit` | canonical | 0 | 0 | 0 | empty |  |
| 62 | `Apakah bayi dirawat` | canonical | 0 | 0 | 0 | empty |  |
| 63 | `Tempat perawatan TN` | canonical | 0 | 0 | 0 | empty |  |
| 64 | `Tanggal mulai dirawat TN` | canonical | 0 | 0 | 0 | empty |  |
| 65 | `Keadaan bayi setelah dirawat` | canonical | 0 | 0 | 0 | empty |  |
| 66 | `Tanggal meninggal TN` | canonical | 0 | 0 | 0 | empty |  |
| 67 | `Umur bayi meninggal (hari)` | canonical | 0 | 0 | 0 | empty |  |
| 68 | `Jumlah kunjungan ANC` | canonical | 0 | 0 | 0 | empty |  |
| 69 | `Tempat pemeriksaan ibu hamil` | canonical | 0 | 0 | 0 | empty | case_or_format_variant_header |
| 70 | `Pemeriksa kehamilan` | canonical | 0 | 0 | 0 | empty |  |
| 71 | `Pemeriksa kehamilan lainnya` | canonical | 0 | 0 | 0 | empty |  |
| 72 | `Tempat persalinan` | canonical | 0 | 0 | 0 | empty |  |
| 73 | `Tempat persalinan lainnya` | canonical | 0 | 0 | 0 | empty |  |
| 74 | `Usia gestasi` | canonical | 0 | 0 | 0 | empty |  |
| 75 | `Penolong persalinan` | canonical | 0 | 0 | 0 | empty |  |
| 76 | `Penolong persalinan lainnya` | canonical | 0 | 0 | 0 | empty |  |
| 77 | `Alat potong tali pusat` | canonical | 0 | 0 | 0 | empty |  |
| 78 | `Alat potong tali pusat lainnya` | canonical | 0 | 0 | 0 | empty |  |
| 79 | `Perawatan tali pusat` | canonical | 0 | 0 | 0 | empty |  |
| 80 | `Perawatan tali pusat lainnya` | canonical | 0 | 0 | 0 | empty |  |
| 81 | `Keadaan ibu saat ini` | canonical | 0 | 0 | 0 | empty |  |
| 82 | `Sumber informasi imunisasi ibu` | canonical | 0 | 0 | 0 | empty |  |
| 83 | `Td kehamilan ini` | canonical | 0 | 0 | 0 | empty |  |
| 84 | `Jumlah Td kehamilan ini` | canonical | 0 | 0 | 0 | empty |  |
| 85 | `Usia kehamilan Td1` | canonical | 0 | 0 | 0 | empty |  |
| 86 | `Tanggal Td1 kehamilan ini` | canonical | 0 | 0 | 0 | empty |  |
| 87 | `Usia kehamilan Td2` | canonical | 0 | 0 | 0 | empty |  |
| 88 | `Tanggal Td2 kehamilan ini` | canonical | 0 | 0 | 0 | empty |  |
| 89 | `Td kehamilan sebelumnya` | canonical | 0 | 0 | 0 | empty |  |
| 90 | `Tanggal Td1 kehamilan sebelumnya` | canonical | 0 | 0 | 0 | empty |  |
| 91 | `Tanggal Td2 kehamilan sebelumnya` | canonical | 0 | 0 | 0 | empty |  |
| 92 | `Td calon pengantin` | canonical | 0 | 0 | 0 | empty |  |
| 93 | `Tanggal Td calon pengantin` | canonical | 0 | 0 | 0 | empty |  |
| 94 | `Riwayat DPT-HB-HiB 1 ibu` | canonical | 0 | 0 | 0 | empty |  |
| 95 | `Riwayat DPT-HB-HiB 2 ibu` | canonical | 0 | 0 | 0 | empty |  |
| 96 | `Riwayat DPT-HB-HiB 3 ibu` | canonical | 0 | 0 | 0 | empty |  |
| 97 | `Riwayat DPT-HB-HiB 4 ibu` | canonical | 0 | 0 | 0 | empty |  |
| 98 | `Riwayat DT kelas 1 ibu` | canonical | 0 | 0 | 0 | empty |  |
| 99 | `Riwayat Td kelas 2 ibu` | canonical | 0 | 0 | 0 | empty |  |
| 100 | `Riwayat Td kelas 5 ibu` | canonical | 0 | 0 | 0 | empty |  |
| 101 | `Status T ibu` | canonical | 0 | 0 | 0 | empty |  |
| 102 | `Status imunisasi TT/Td ibu` | canonical | 0 | 0 | 0 | empty |  |
| 103 | `Vaksin Td saat investigasi` | canonical | 0 | 0 | 0 | empty |  |
| 104 | `Tanggal vaksin Td saat investigasi` | canonical | 0 | 0 | 0 | empty |  |
| 105 | `Cakupan DPT-HB-Hib 1` | canonical | 0 | 0 | 0 | empty |  |
| 106 | `Cakupan DPT-HB-Hib 2` | canonical | 0 | 0 | 0 | empty |  |
| 107 | `Cakupan DPT-HB-Hib 3` | canonical | 0 | 0 | 0 | empty |  |
| 108 | `Cakupan DT Kelas 1` | canonical | 0 | 0 | 0 | empty |  |
| 109 | `Cakupan Td kelas 2` | canonical | 0 | 0 | 0 | empty |  |
| 110 | `Cakupan Td kelas 5` | canonical | 0 | 0 | 0 | empty |  |
| 111 | `Cakupan TT 2+` | canonical | 0 | 0 | 0 | empty |  |
| 112 | `Cakupan persalinan faskes` | canonical | 0 | 0 | 0 | empty |  |
| 113 | `Cakupan KN1` | canonical | 0 | 0 | 0 | empty |  |
| 114 | `Cakupan KN2` | canonical | 0 | 0 | 0 | empty |  |
| 115 | `Cakupan KN3` | canonical | 0 | 0 | 0 | empty |  |
| 116 | `Akses desa ke faskes` | canonical | 0 | 0 | 0 | empty |  |
| 117 | `Faktor pelaksanaan imunisasi` | canonical | 0 | 0 | 0 | empty |  |
| 118 | `Faktor pertolongan persalinan` | canonical | 0 | 0 | 0 | empty |  |
| 119 | `Berat lahir` | canonical | 0 | 0 | 0 | empty |  |
| 120 | `Riwayat kasus serupa di wilayah` | canonical | 0 | 0 | 0 | empty |  |
| 121 | `Status akhir TN` | canonical | 0 | 0 | 0 | empty |  |
| 122 | `Status Verifikasi EPID` | canonical | 0 | 0 | 0 | empty |  |
| 123 | `Tanggal Verifikasi EPID` | canonical | 0 | 0 | 0 | empty |  |
| 124 | `Petugas Verifikator` | canonical | 0 | 0 | 0 | empty |  |
| 125 | `Review Admin Terakhir` | canonical | 0 | 0 | 0 | empty |  |
| 126 | `Catatan Verifikasi EPID` | canonical | 0 | 0 | 0 | empty |  |
| 127 | `Pemeriksaan Sampel Dilakukan` | canonical | 0 | 0 | 0 | empty |  |
| 128 | `Jenis Sampel Diuji` | canonical | 0 | 0 | 0 | empty |  |
| 129 | `Nomor Sampel / Lab` | canonical | 0 | 0 | 0 | empty |  |
| 130 | `Tanggal Hasil Sampel` | canonical | 0 | 0 | 0 | empty |  |
| 131 | `Hasil Pemeriksaan Sampel` | canonical | 0 | 0 | 0 | empty |  |
| 132 | `Interpretasi Hasil Sampel` | canonical | 0 | 0 | 0 | empty |  |
| 133 | `Status Pasien/Kasus` | canonical | 0 | 0 | 0 | empty |  |
| 134 | `Tanggal Update Status` | canonical | 0 | 0 | 0 | empty |  |
| 135 | `Dasar Penetapan Status` | canonical | 0 | 0 | 0 | empty |  |
| 136 | `Catatan Status Pasien` | canonical | 0 | 0 | 0 | empty |  |
| 137 | `Riwayat Status Kasus` | canonical | 0 | 0 | 0 | empty |  |
| 138 | `Kecamatan Pengampu` | canonical | 0 | 0 | 0 | empty |  |
| 139 | `Kelurahan Pengampu` | canonical | 0 | 0 | 0 | empty |  |
| 140 | `KodePuskesmas Pengampu` | canonical | 0 | 0 | 0 | empty |  |
| 141 | `Puskesmas Pengampu` | canonical | 0 | 0 | 0 | empty |  |
| 142 | `Kepala Puskesmas Pengampu` | canonical | 0 | 0 | 0 | empty |  |
| 143 | `Email Kapus Pengampu` | canonical | 0 | 0 | 0 | empty |  |
| 144 | `Petugas Surveilans Pengampu` | canonical | 0 | 0 | 0 | empty |  |
| 145 | `Email Petugas Pengampu` | canonical | 0 | 0 | 0 | empty |  |
| 146 | `SpreadsheetId Pengampu` | canonical | 0 | 0 | 0 | empty |  |
| 147 | `SpreadsheetUrl Pengampu` | canonical | 0 | 0 | 0 | empty |  |
| 148 | `Telegram Chat Id Pengampu` | canonical | 0 | 0 | 0 | empty |  |
| 149 | `Status Routing Pengampu` | canonical | 0 | 0 | 0 | empty |  |
| 150 | `Status Notifikasi Pengampu` | canonical | 0 | 0 | 0 | empty |  |
| 151 | `Reason Notifikasi Pengampu` | canonical | 0 | 0 | 0 | empty |  |
| 152 | `Notified At Pengampu` | canonical | 0 | 0 | 0 | empty |  |
| 153 | `Notified To Pengampu` | canonical | 0 | 0 | 0 | empty |  |
| 154 | `Status Sinkronisasi Pengampu` | canonical | 0 | 0 | 0 | empty |  |
| 155 | `Reason Sinkronisasi Pengampu` | canonical | 0 | 0 | 0 | empty |  |
| 156 | `Synced At Pengampu` | canonical | 0 | 0 | 0 | empty |  |
| 157 | `Sync Target Pengampu` | canonical | 0 | 0 | 0 | empty |  |
| 158 | `Status Notifikasi Telegram` | canonical | 0 | 0 | 0 | empty |  |
| 159 | `Reason Notifikasi Telegram` | canonical | 0 | 0 | 0 | empty |  |
| 160 | `Telegram Notified At` | canonical | 0 | 0 | 0 | empty |  |
| 161 | `Telegram Target` | canonical | 0 | 0 | 0 | empty |  |
| 162 | `Telegram Retry Count` | canonical | 0 | 0 | 0 | empty |  |
| 163 | `Pipeline Fingerprint` | canonical | 0 | 0 | 0 | empty |  |
| 164 | `Pipeline Last Run At` | canonical | 0 | 0 | 0 | empty |  |
| 165 | `Status Notifikasi Revisi Pengampu` | canonical | 0 | 0 | 0 | empty |  |
| 166 | `Reason Notifikasi Revisi Pengampu` | canonical | 0 | 0 | 0 | empty |  |
| 167 | `Revision Notified At Pengampu` | canonical | 0 | 0 | 0 | empty |  |
| 168 | `Revision Notified To Pengampu` | canonical | 0 | 0 | 0 | empty |  |
| 169 | `Status Notifikasi Revisi Telegram` | canonical | 0 | 0 | 0 | empty |  |
| 170 | `Reason Notifikasi Revisi Telegram` | canonical | 0 | 0 | 0 | empty |  |
| 171 | `Revision Telegram Notified At` | canonical | 0 | 0 | 0 | empty |  |
| 172 | `Revision Telegram Target` | canonical | 0 | 0 | 0 | empty |  |
| 173 | `Revision Notification Fingerprint` | canonical | 0 | 0 | 0 | empty |  |
| 174 | `Revision Notification Last Run At` | canonical | 0 | 0 | 0 | empty |  |
| 175 | `Status Verifikasi Sebelumnya` | canonical | 0 | 0 | 0 | empty |  |
| 176 | `Notifikasi Revisi Dibaca` | canonical | 0 | 0 | 0 | empty |  |
| 177 | `Waktu Permintaan Revisi` | canonical | 0 | 0 | 0 | empty |  |
| 178 | `Waktu Verifikasi Pending` | canonical | 0 | 0 | 0 | empty |  |
| 179 | `dx` | non_canonical | 0 | 0 | 0 | empty | case_or_format_variant_header |
| 180 | `Klasifikasi` | non_canonical | 0 | 0 | 0 | empty |  |
| 181 | `Koordinat (lat,lon)` | non_canonical | 0 | 0 | 0 | empty |  |
| 182 | `Nama Orang Tua/Wali` | non_canonical | 0 | 0 | 0 | empty | case_or_format_variant_header |
| 183 | `No Telp/WA Orang Tua/Wali` | non_canonical | 0 | 0 | 0 | empty |  |
| 184 | `Petugas` | non_canonical | 0 | 0 | 0 | empty |  |
| 185 | `Provinsi unit pelapor` | non_canonical | 0 | 0 | 0 | empty |  |
| 186 | `Kab/Kota unit pelapor` | non_canonical | 0 | 0 | 0 | empty |  |
| 187 | `Link PDF` | non_canonical | 0 | 0 | 0 | empty |  |
| 188 | `Nama Bayi (ulang)` | non_canonical | 0 | 0 | 0 | empty |  |
| 189 | `Usia Ibu (tahun)` | non_canonical | 0 | 0 | 0 | empty |  |
| 190 | `Pekerjaan Ibu` | non_canonical | 0 | 0 | 0 | empty | case_or_format_variant_header |
| 191 | `Pendidikan Ibu` | non_canonical | 0 | 0 | 0 | empty | case_or_format_variant_header |
| 192 | `Lama tinggal Ibu di desa (tahun)` | non_canonical | 0 | 0 | 0 | empty |  |
| 193 | `Apakah bayi lahir hidup?` | non_canonical | 0 | 0 | 0 | empty |  |
| 194 | `Tanggal lahir bayi` | non_canonical | 0 | 0 | 0 | empty |  |
| 195 | `Tanggal meninggal bayi` | non_canonical | 0 | 0 | 0 | empty |  |
| 196 | `Bayi menangis saat lahir?` | non_canonical | 0 | 0 | 0 | empty |  |
| 197 | `Tanda-tanda kelahiran hidup lain?` | non_canonical | 0 | 0 | 0 | empty |  |
| 198 | `Bayi bisa menyusu/minum dengan baik?` | non_canonical | 0 | 0 | 0 | empty |  |
| 199 | `Mulut bayi mencucu & tidak bisa menyusu setelah 3 hari?` | non_canonical | 0 | 0 | 0 | empty |  |
| 200 | `Bayi mudah kejang bila disentuh/terkena sinar/bunyi?` | non_canonical | 0 | 0 | 0 | empty |  |
| 201 | `Bayi dirawat?` | non_canonical | 0 | 0 | 0 | empty |  |
| 202 | `Tempat perawatan bayi` | non_canonical | 0 | 0 | 0 | empty |  |
| 203 | `Tanggal mulai dirawat` | non_canonical | 0 | 0 | 0 | empty |  |
| 204 | `Tempat pemeriksaan Ibu Hamil` | non_canonical | 0 | 0 | 0 | empty | case_or_format_variant_header |
| 205 | `Pemeriksaan kehamilan oleh` | non_canonical | 0 | 0 | 0 | empty |  |
| 206 | `Pemeriksaan kehamilan oleh (lainnya)` | non_canonical | 0 | 0 | 0 | empty |  |
| 207 | `Tempat persalinan - Lainnya` | non_canonical | 0 | 0 | 0 | empty |  |
| 208 | `Usia kehamilan saat persalinan (minggu)` | non_canonical | 0 | 0 | 0 | empty |  |
| 209 | `Penolong persalinan (lainnya)` | non_canonical | 0 | 0 | 0 | empty |  |
| 210 | `Alat potong tali pusat - Gunting` | non_canonical | 0 | 0 | 0 | empty |  |
| 211 | `Alat potong tali pusat - Silet` | non_canonical | 0 | 0 | 0 | empty |  |
| 212 | `Alat potong tali pusat - Pisau` | non_canonical | 0 | 0 | 0 | empty |  |
| 213 | `Alat potong tali pusat - Sembilu` | non_canonical | 0 | 0 | 0 | empty |  |
| 214 | `Alat potong tali pusat - Tidak tahu` | non_canonical | 0 | 0 | 0 | empty |  |
| 215 | `Alat potong tali pusat - Lainnya (teks)` | non_canonical | 0 | 0 | 0 | empty |  |
| 216 | `Perawatan tali pusat - Alkohol` | non_canonical | 0 | 0 | 0 | empty |  |
| 217 | `Perawatan tali pusat - Betadine/Yodium` | non_canonical | 0 | 0 | 0 | empty |  |
| 218 | `Perawatan tali pusat - Ramuan tradisional (ya/tidak)` | non_canonical | 0 | 0 | 0 | empty |  |
| 219 | `Perawatan tali pusat - Ramuan tradisional (sebutkan)` | non_canonical | 0 | 0 | 0 | empty |  |
| 220 | `Ibu mendapat imunisasi Td pada kehamilan ini?` | non_canonical | 0 | 0 | 0 | empty |  |
| 221 | `Jumlah imunisasi Td pada kehamilan ini` | non_canonical | 0 | 0 | 0 | empty |  |
| 222 | `Td kehamilan ini - suntikan pertama: usia kehamilan (bulan)` | non_canonical | 0 | 0 | 0 | empty |  |
| 223 | `Td kehamilan ini - suntikan pertama: tanggal imunisasi` | non_canonical | 0 | 0 | 0 | empty |  |
| 224 | `Td kehamilan ini - suntikan kedua: usia kehamilan (bulan)` | non_canonical | 0 | 0 | 0 | empty |  |
| 225 | `Td kehamilan ini - suntikan kedua: tanggal imunisasi` | non_canonical | 0 | 0 | 0 | empty |  |
| 226 | `Ibu mendapat imunisasi Td pada kehamilan sebelumnya?` | non_canonical | 0 | 0 | 0 | empty |  |
| 227 | `Td kehamilan sebelumnya - suntikan pertama: tanggal imunisasi` | non_canonical | 0 | 0 | 0 | empty |  |
| 228 | `Td kehamilan sebelumnya - suntikan kedua: tanggal imunisasi` | non_canonical | 0 | 0 | 0 | empty |  |
| 229 | `Ibu mendapat imunisasi Td calon pengantin?` | non_canonical | 0 | 0 | 0 | empty |  |
| 230 | `Td calon pengantin - tanggal imunisasi` | non_canonical | 0 | 0 | 0 | empty |  |
| 231 | `Riwayat imunisasi DPT-HB-Hib (1)` | non_canonical | 0 | 0 | 0 | empty |  |
| 232 | `Riwayat imunisasi DPT-HB-Hib (2)` | non_canonical | 0 | 0 | 0 | empty |  |
| 233 | `Riwayat imunisasi DPT-HB-Hib (3)` | non_canonical | 0 | 0 | 0 | empty |  |
| 234 | `Riwayat imunisasi DPT-HB-Hib (4)` | non_canonical | 0 | 0 | 0 | empty |  |
| 235 | `Riwayat imunisasi DT kelas 1` | non_canonical | 0 | 0 | 0 | empty |  |
| 236 | `Riwayat imunisasi Td kelas 2` | non_canonical | 0 | 0 | 0 | empty |  |
| 237 | `Riwayat imunisasi Td kelas 5` | non_canonical | 0 | 0 | 0 | empty |  |
| 238 | `Status T ibu hamil saat ini` | non_canonical | 0 | 0 | 0 | empty |  |
| 239 | `Ibu mendapat vaksin Td saat investigasi?` | non_canonical | 0 | 0 | 0 | empty |  |
| 240 | `Alasan ibu tidak mendapat vaksin Td saat investigasi` | non_canonical | 0 | 0 | 0 | empty |  |
| 241 | `Tanggal pemberian vaksin Td saat investigasi` | non_canonical | 0 | 0 | 0 | empty |  |
| 242 | `Cakupan DPT-HB-Hib 1 (%)` | non_canonical | 0 | 0 | 0 | empty |  |
| 243 | `Cakupan DPT-HB-Hib 2 (%)` | non_canonical | 0 | 0 | 0 | empty |  |
| 244 | `Cakupan DPT-HB-Hib 3 (%)` | non_canonical | 0 | 0 | 0 | empty |  |
| 245 | `Cakupan DPT-HB-Hib 4 (%)` | non_canonical | 0 | 0 | 0 | empty |  |
| 246 | `Cakupan DT kelas 1 (%)` | non_canonical | 0 | 0 | 0 | empty |  |
| 247 | `Cakupan Td kelas 2 (%)` | non_canonical | 0 | 0 | 0 | empty |  |
| 248 | `Cakupan Td kelas 5 (%)` | non_canonical | 0 | 0 | 0 | empty |  |
| 249 | `Cakupan TT 2+ (%)` | non_canonical | 0 | 0 | 0 | empty |  |
| 250 | `Cakupan persalinan di fasilitas kesehatan (%)` | non_canonical | 0 | 0 | 0 | empty |  |
| 251 | `Cakupan kunjungan neonatus KN1 (%)` | non_canonical | 0 | 0 | 0 | empty |  |
| 252 | `Cakupan kunjungan neonatus KN2 (%)` | non_canonical | 0 | 0 | 0 | empty |  |
| 253 | `Cakupan kunjungan neonatus KN3 (%)` | non_canonical | 0 | 0 | 0 | empty |  |
| 254 | `Akses desa kasus ke fasilitas pelayanan kesehatan` | non_canonical | 0 | 0 | 0 | empty |  |
| 255 | `Faktor lain yang berpengaruh terhadap pelaksanaan imunisasi` | non_canonical | 0 | 0 | 0 | empty |  |
| 256 | `Faktor lain yang berpengaruh terhadap pertolongan persalinan` | non_canonical | 0 | 0 | 0 | empty |  |
| 257 | `KontakEratJSON` | non_canonical | 0 | 0 | 0 | empty |  |

### AFP_Raw

| Col | Header | Status | Non-empty | Fill % | Distinct | Type | Flags |
| ---: | --- | --- | ---: | ---: | ---: | --- | --- |
| 1 | `ID Registrasi Kasus` | canonical | 0 | 0 | 0 | empty |  |
| 2 | `Nomor EPID` | canonical | 3 | 100 | 3 | text |  |
| 3 | `Nomor EPID Rekomendasi` | canonical | 0 | 0 | 0 | empty |  |
| 4 | `Nomor EPID Final` | canonical | 0 | 0 | 0 | empty |  |
| 5 | `DX` | canonical | 0 | 0 | 0 | empty | case_or_format_variant_header |
| 6 | `Tanggal Input` | canonical | 0 | 0 | 0 | empty |  |
| 7 | `Tanggal Update` | canonical | 0 | 0 | 0 | empty |  |
| 8 | `Timestamp` | canonical | 3 | 100 | 3 | date |  |
| 9 | `Last Updated At` | canonical | 0 | 0 | 0 | empty |  |
| 10 | `Diinput Oleh` | canonical | 0 | 0 | 0 | empty |  |
| 11 | `Role Penginput` | canonical | 0 | 0 | 0 | empty |  |
| 12 | `Tahap Workflow Terakhir` | canonical | 0 | 0 | 0 | empty |  |
| 13 | `Label Tahap Workflow Terakhir` | canonical | 0 | 0 | 0 | empty |  |
| 14 | `Diupdate Oleh Tahap Terakhir` | canonical | 0 | 0 | 0 | empty |  |
| 15 | `Role Pengupdate Tahap Terakhir` | canonical | 0 | 0 | 0 | empty |  |
| 16 | `Waktu Update Tahap Terakhir` | canonical | 0 | 0 | 0 | empty |  |
| 17 | `Sumber Laporan` | canonical | 3 | 100 | 1 | text |  |
| 18 | `Nama unit pelapor` | canonical | 3 | 100 | 2 | text |  |
| 19 | `Provinsi` | canonical | 0 | 0 | 0 | empty |  |
| 20 | `Kab/Kota` | canonical | 0 | 0 | 0 | empty |  |
| 21 | `Nama Petugas` | canonical | 0 | 0 | 0 | empty |  |
| 22 | `No Whatsapp Petugas` | canonical | 3 | 100 | 2 | numeric |  |
| 23 | `Email Petugas` | canonical | 3 | 100 | 2 | email |  |
| 24 | `Tanggal terima laporan` | canonical | 3 | 100 | 2 | date |  |
| 25 | `Tanggal Pelacakan` | canonical | 3 | 100 | 2 | date |  |
| 26 | `NIK` | canonical | 3 | 100 | 2 | numeric |  |
| 27 | `Nama` | canonical | 3 | 100 | 2 | text |  |
| 28 | `JK` | canonical | 3 | 100 | 1 | text |  |
| 29 | `Tanggal Lahir` | canonical | 3 | 100 | 2 | date |  |
| 30 | `Umur (auto)` | canonical | 3 | 100 | 2 | text |  |
| 31 | `Kelompok Umur Epidemiologis` | canonical | 0 | 0 | 0 | empty |  |
| 32 | `Nama orang tua/wali` | canonical | 0 | 0 | 0 | empty | case_or_format_variant_header |
| 33 | `No. kontak orang tua/wali` | canonical | 0 | 0 | 0 | empty |  |
| 34 | `Apakah sekolah/bekerja?` | canonical | 2 | 66.67 | 1 | booleanish |  |
| 35 | `Kelas Saat Ini` | canonical | 0 | 0 | 0 | empty |  |
| 36 | `Nama sekolah/tempat bekerja` | canonical | 0 | 0 | 0 | empty |  |
| 37 | `Tinggi Badan (cm)` | canonical | 0 | 0 | 0 | empty |  |
| 38 | `Berat Badan (kg)` | canonical | 0 | 0 | 0 | empty |  |
| 39 | `Alamat` | canonical | 3 | 100 | 2 | text |  |
| 40 | `RT` | canonical | 3 | 100 | 2 | numeric |  |
| 41 | `RW` | canonical | 3 | 100 | 2 | numeric |  |
| 42 | `Provinsi Pasien` | canonical | 0 | 0 | 0 | empty |  |
| 43 | `Kab/Kota Pasien` | canonical | 0 | 0 | 0 | empty |  |
| 44 | `Kecamatan` | canonical | 3 | 100 | 2 | text |  |
| 45 | `Kelurahan` | canonical | 3 | 100 | 2 | text |  |
| 46 | `Latitude` | canonical | 0 | 0 | 0 | empty |  |
| 47 | `Longitude` | canonical | 0 | 0 | 0 | empty |  |
| 48 | `Ambil Lokasi` | canonical | 0 | 0 | 0 | empty |  |
| 49 | `Tanggal mulai sakit/gejala awal` | canonical | 0 | 0 | 0 | empty |  |
| 50 | `Tgl mulai lumpuh` | canonical | 0 | 0 | 0 | empty |  |
| 51 | `Sifat akut` | canonical | 0 | 0 | 0 | empty |  |
| 52 | `Lumpuh layuh` | canonical | 0 | 0 | 0 | empty |  |
| 53 | `Asimetris` | canonical | 0 | 0 | 0 | empty |  |
| 54 | `Demam saat onset` | canonical | 0 | 0 | 0 | empty |  |
| 55 | `Rudapaksa AFP` | canonical | 0 | 0 | 0 | empty |  |
| 56 | `Pengobatan tradisional AFP` | canonical | 0 | 0 | 0 | empty |  |
| 57 | `Nama tempat pengobatan tradisional AFP` | canonical | 0 | 0 | 0 | empty |  |
| 58 | `Tanggal berkunjung pengobatan tradisional AFP` | canonical | 0 | 0 | 0 | empty |  |
| 59 | `Berobat ke Rumah Sakit AFP` | canonical | 0 | 0 | 0 | empty |  |
| 60 | `Nama Rumah Sakit` | canonical | 1 | 33.33 | 1 | text |  |
| 61 | `Tanggal berobat AFP` | canonical | 0 | 0 | 0 | empty |  |
| 62 | `Diagnosis AFP` | canonical | 0 | 0 | 0 | empty |  |
| 63 | `Nomor Rekam Medik` | canonical | 0 | 0 | 0 | empty | case_or_format_variant_header |
| 64 | `Tanggal meninggal AFP` | canonical | 0 | 0 | 0 | empty |  |
| 65 | `Tungkai kanan lumpuh` | canonical | 0 | 0 | 0 | empty |  |
| 66 | `Tungkai kanan kekuatan` | canonical | 0 | 0 | 0 | empty |  |
| 67 | `Tungkai kanan rasa raba` | canonical | 0 | 0 | 0 | empty |  |
| 68 | `Tungkai kiri lumpuh` | canonical | 0 | 0 | 0 | empty |  |
| 69 | `Tungkai kiri kekuatan` | canonical | 0 | 0 | 0 | empty |  |
| 70 | `Tungkai kiri rasa raba` | canonical | 0 | 0 | 0 | empty |  |
| 71 | `Lengan kanan lumpuh` | canonical | 0 | 0 | 0 | empty |  |
| 72 | `Lengan kanan kekuatan` | canonical | 0 | 0 | 0 | empty |  |
| 73 | `Lengan kanan rasa raba` | canonical | 0 | 0 | 0 | empty |  |
| 74 | `Lengan kiri lumpuh` | canonical | 0 | 0 | 0 | empty |  |
| 75 | `Lengan kiri kekuatan` | canonical | 0 | 0 | 0 | empty |  |
| 76 | `Lengan kiri rasa raba` | canonical | 0 | 0 | 0 | empty |  |
| 77 | `Lokasi kelumpuhan` | canonical | 0 | 0 | 0 | empty |  |
| 78 | `Perjalanan 35 hari AFP` | canonical | 0 | 0 | 0 | empty |  |
| 79 | `Lokasi perjalanan AFP` | canonical | 0 | 0 | 0 | empty |  |
| 80 | `Tanggal pergi AFP` | canonical | 0 | 0 | 0 | empty |  |
| 81 | `Kontak OPV 75 hari AFP` | canonical | 0 | 0 | 0 | empty |  |
| 82 | `Punya jamban sendiri` | canonical | 0 | 0 | 0 | empty |  |
| 83 | `Jenis jamban` | canonical | 1 | 33.33 | 1 | text |  |
| 84 | `Jenis jamban lainnya` | canonical | 0 | 0 | 0 | empty |  |
| 85 | `Selalu pakai jamban` | canonical | 0 | 0 | 0 | empty |  |
| 86 | `Jamban aman` | canonical | 0 | 0 | 0 | empty |  |
| 87 | `Pembuangan diapers` | canonical | 0 | 0 | 0 | empty |  |
| 88 | `Pembuangan diapers lainnya` | canonical | 0 | 0 | 0 | empty |  |
| 89 | `Dosis OPV rutin` | canonical | 0 | 0 | 0 | empty |  |
| 90 | `Dosis IPV rutin` | canonical | 0 | 0 | 0 | empty |  |
| 91 | `Dosis Hexavalen rutin` | canonical | 0 | 0 | 0 | empty |  |
| 92 | `Sumber info imunisasi rutin AFP` | canonical | 0 | 0 | 0 | empty |  |
| 93 | `Program imunisasi tambahan AFP` | canonical | 0 | 0 | 0 | empty |  |
| 94 | `Dosis OPV tambahan AFP` | canonical | 0 | 0 | 0 | empty |  |
| 95 | `Dosis IPV tambahan AFP` | canonical | 0 | 0 | 0 | empty |  |
| 96 | `Sumber info imunisasi tambahan AFP` | canonical | 0 | 0 | 0 | empty |  |
| 97 | `Tanggal OPV terakhir AFP` | canonical | 0 | 0 | 0 | empty |  |
| 98 | `Tanggal IPV terakhir AFP` | canonical | 0 | 0 | 0 | empty |  |
| 99 | `Tanggal Hexavalen terakhir AFP` | canonical | 0 | 0 | 0 | empty |  |
| 100 | `Spesimen tinja 1 diambil?` | canonical | 0 | 0 | 0 | empty |  |
| 101 | `Tanggal tinja 1` | canonical | 0 | 0 | 0 | empty |  |
| 102 | `Tanggal kirim tinja 1 kab-prov` | canonical | 0 | 0 | 0 | empty |  |
| 103 | `Tanggal kirim tinja 1 prov-lab` | canonical | 0 | 0 | 0 | empty |  |
| 104 | `Spesimen tinja 2 diambil?` | canonical | 0 | 0 | 0 | empty |  |
| 105 | `Tanggal tinja 2` | canonical | 0 | 0 | 0 | empty |  |
| 106 | `Tanggal kirim tinja 2 kab-prov` | canonical | 0 | 0 | 0 | empty |  |
| 107 | `Tanggal kirim tinja 2 prov-lab` | canonical | 0 | 0 | 0 | empty |  |
| 108 | `Alasan tidak diambil spesimen AFP` | canonical | 0 | 0 | 0 | empty |  |
| 109 | `Kondisi spesimen baik` | canonical | 0 | 0 | 0 | empty |  |
| 110 | `Hasil pemeriksaan AFP` | canonical | 0 | 0 | 0 | empty |  |
| 111 | `Nama dokter AFP` | canonical | 0 | 0 | 0 | empty |  |
| 112 | `No. Telp dokter AFP` | canonical | 0 | 0 | 0 | empty |  |
| 113 | `Tanggal follow up 60 hari` | canonical | 0 | 0 | 0 | empty |  |
| 114 | `Masih ada kelumpuhan` | canonical | 0 | 0 | 0 | empty |  |
| 115 | `Status Verifikasi EPID` | canonical | 0 | 0 | 0 | empty |  |
| 116 | `Tanggal Verifikasi EPID` | canonical | 0 | 0 | 0 | empty |  |
| 117 | `Petugas Verifikator` | canonical | 0 | 0 | 0 | empty |  |
| 118 | `Review Admin Terakhir` | canonical | 0 | 0 | 0 | empty |  |
| 119 | `Catatan Verifikasi EPID` | canonical | 0 | 0 | 0 | empty |  |
| 120 | `Pemeriksaan Sampel Dilakukan` | canonical | 0 | 0 | 0 | empty |  |
| 121 | `Jenis Sampel Diuji` | canonical | 0 | 0 | 0 | empty |  |
| 122 | `Nomor Sampel / Lab` | canonical | 0 | 0 | 0 | empty |  |
| 123 | `Tanggal Hasil Sampel` | canonical | 0 | 0 | 0 | empty |  |
| 124 | `Hasil Pemeriksaan Sampel` | canonical | 0 | 0 | 0 | empty |  |
| 125 | `Interpretasi Hasil Sampel` | canonical | 0 | 0 | 0 | empty |  |
| 126 | `Status Pasien/Kasus` | canonical | 0 | 0 | 0 | empty |  |
| 127 | `Tanggal Update Status` | canonical | 0 | 0 | 0 | empty |  |
| 128 | `Dasar Penetapan Status` | canonical | 0 | 0 | 0 | empty |  |
| 129 | `Catatan Status Pasien` | canonical | 0 | 0 | 0 | empty |  |
| 130 | `Riwayat Status Kasus` | canonical | 0 | 0 | 0 | empty |  |
| 131 | `Kecamatan Pengampu` | canonical | 0 | 0 | 0 | empty |  |
| 132 | `Kelurahan Pengampu` | canonical | 0 | 0 | 0 | empty |  |
| 133 | `KodePuskesmas Pengampu` | canonical | 0 | 0 | 0 | empty |  |
| 134 | `Puskesmas Pengampu` | canonical | 0 | 0 | 0 | empty |  |
| 135 | `Kepala Puskesmas Pengampu` | canonical | 0 | 0 | 0 | empty |  |
| 136 | `Email Kapus Pengampu` | canonical | 0 | 0 | 0 | empty |  |
| 137 | `Petugas Surveilans Pengampu` | canonical | 0 | 0 | 0 | empty |  |
| 138 | `Email Petugas Pengampu` | canonical | 0 | 0 | 0 | empty |  |
| 139 | `SpreadsheetId Pengampu` | canonical | 0 | 0 | 0 | empty |  |
| 140 | `SpreadsheetUrl Pengampu` | canonical | 0 | 0 | 0 | empty |  |
| 141 | `Telegram Chat Id Pengampu` | canonical | 0 | 0 | 0 | empty |  |
| 142 | `Status Routing Pengampu` | canonical | 0 | 0 | 0 | empty |  |
| 143 | `Status Notifikasi Pengampu` | canonical | 0 | 0 | 0 | empty |  |
| 144 | `Reason Notifikasi Pengampu` | canonical | 0 | 0 | 0 | empty |  |
| 145 | `Notified At Pengampu` | canonical | 0 | 0 | 0 | empty |  |
| 146 | `Notified To Pengampu` | canonical | 0 | 0 | 0 | empty |  |
| 147 | `Status Sinkronisasi Pengampu` | canonical | 0 | 0 | 0 | empty |  |
| 148 | `Reason Sinkronisasi Pengampu` | canonical | 0 | 0 | 0 | empty |  |
| 149 | `Synced At Pengampu` | canonical | 0 | 0 | 0 | empty |  |
| 150 | `Sync Target Pengampu` | canonical | 0 | 0 | 0 | empty |  |
| 151 | `Status Notifikasi Telegram` | canonical | 0 | 0 | 0 | empty |  |
| 152 | `Reason Notifikasi Telegram` | canonical | 0 | 0 | 0 | empty |  |
| 153 | `Telegram Notified At` | canonical | 0 | 0 | 0 | empty |  |
| 154 | `Telegram Target` | canonical | 0 | 0 | 0 | empty |  |
| 155 | `Telegram Retry Count` | canonical | 0 | 0 | 0 | empty |  |
| 156 | `Pipeline Fingerprint` | canonical | 0 | 0 | 0 | empty |  |
| 157 | `Pipeline Last Run At` | canonical | 0 | 0 | 0 | empty |  |
| 158 | `Status Notifikasi Revisi Pengampu` | canonical | 0 | 0 | 0 | empty |  |
| 159 | `Reason Notifikasi Revisi Pengampu` | canonical | 0 | 0 | 0 | empty |  |
| 160 | `Revision Notified At Pengampu` | canonical | 0 | 0 | 0 | empty |  |
| 161 | `Revision Notified To Pengampu` | canonical | 0 | 0 | 0 | empty |  |
| 162 | `Status Notifikasi Revisi Telegram` | canonical | 0 | 0 | 0 | empty |  |
| 163 | `Reason Notifikasi Revisi Telegram` | canonical | 0 | 0 | 0 | empty |  |
| 164 | `Revision Telegram Notified At` | canonical | 0 | 0 | 0 | empty |  |
| 165 | `Revision Telegram Target` | canonical | 0 | 0 | 0 | empty |  |
| 166 | `Revision Notification Fingerprint` | canonical | 0 | 0 | 0 | empty |  |
| 167 | `Revision Notification Last Run At` | canonical | 0 | 0 | 0 | empty |  |
| 168 | `Status Verifikasi Sebelumnya` | canonical | 0 | 0 | 0 | empty |  |
| 169 | `Notifikasi Revisi Dibaca` | canonical | 0 | 0 | 0 | empty |  |
| 170 | `Waktu Permintaan Revisi` | canonical | 0 | 0 | 0 | empty |  |
| 171 | `Waktu Verifikasi Pending` | canonical | 0 | 0 | 0 | empty |  |
| 172 | `dx` | non_canonical | 3 | 100 | 1 | text | non_canonical_with_data, case_or_format_variant_header |
| 173 | `Klasifikasi` | non_canonical | 3 | 100 | 1 | text | non_canonical_with_data |
| 174 | `Koordinat (lat,lon)` | non_canonical | 0 | 0 | 0 | empty |  |
| 175 | `Nama Orang Tua/Wali` | non_canonical | 3 | 100 | 2 | text | non_canonical_with_data, case_or_format_variant_header |
| 176 | `No Telp/WA Orang Tua/Wali` | non_canonical | 3 | 100 | 2 | numeric | non_canonical_with_data |
| 177 | `Petugas` | non_canonical | 3 | 100 | 2 | text | non_canonical_with_data |
| 178 | `Provinsi unit pelapor` | non_canonical | 3 | 100 | 1 | text | non_canonical_with_data |
| 179 | `Kab/Kota unit pelapor` | non_canonical | 3 | 100 | 1 | text | non_canonical_with_data |
| 180 | `Link PDF` | non_canonical | 3 | 100 | 3 | url | non_canonical_with_data |
| 181 | `Tanggal mulai sakit/gejala awal sebelum lumpuh` | non_canonical | 2 | 66.67 | 2 | date | non_canonical_with_data |
| 182 | `Tanggal mulai kelumpuhan` | non_canonical | 3 | 100 | 3 | date | non_canonical_with_data |
| 183 | `Tanggal meninggal` | non_canonical | 0 | 0 | 0 | empty |  |
| 184 | `Menggunakan pengobatan tradisional/alternatif?` | non_canonical | 3 | 100 | 1 | booleanish | non_canonical_with_data |
| 185 | `Nama tempat pengobatan tradisional` | non_canonical | 0 | 0 | 0 | empty |  |
| 186 | `Tanggal berkunjung pengobatan tradisional` | non_canonical | 0 | 0 | 0 | empty |  |
| 187 | `Berobat ke Rumah Sakit?` | non_canonical | 3 | 100 | 2 | booleanish | non_canonical_with_data |
| 188 | `Tanggal berobat ke RS` | non_canonical | 1 | 33.33 | 1 | date | non_canonical_with_data |
| 189 | `Diagnosis RS` | non_canonical | 1 | 33.33 | 1 | text | non_canonical_with_data |
| 190 | `Nomor rekam medik` | non_canonical | 1 | 33.33 | 1 | date | non_canonical_with_data, case_or_format_variant_header |
| 191 | `Kelumpuhan akut (1-14 hari)?` | non_canonical | 3 | 100 | 1 | booleanish | non_canonical_with_data |
| 192 | `Kelumpuhan flaksid (layuh)?` | non_canonical | 3 | 100 | 1 | booleanish | non_canonical_with_data |
| 193 | `Kelumpuhan akibat rudapaksa?` | non_canonical | 3 | 100 | 1 | booleanish | non_canonical_with_data |
| 194 | `Demam sebelum lemah/lumpuh?` | non_canonical | 3 | 100 | 2 | booleanish | non_canonical_with_data |
| 195 | `Kelumpuhan tungkai kanan?` | non_canonical | 2 | 66.67 | 1 | booleanish | non_canonical_with_data |
| 196 | `Kekuatan otot tungkai kanan (0-5)` | non_canonical | 0 | 0 | 0 | empty |  |
| 197 | `Gangguan rasa raba tungkai kanan?` | non_canonical | 2 | 66.67 | 1 | booleanish | non_canonical_with_data |
| 198 | `Kelumpuhan tungkai kiri?` | non_canonical | 2 | 66.67 | 1 | booleanish | non_canonical_with_data |
| 199 | `Kekuatan otot tungkai kiri (0-5)` | non_canonical | 0 | 0 | 0 | empty |  |
| 200 | `Gangguan rasa raba tungkai kiri?` | non_canonical | 2 | 66.67 | 1 | booleanish | non_canonical_with_data |
| 201 | `Kelumpuhan lengan kanan?` | non_canonical | 0 | 0 | 0 | empty |  |
| 202 | `Kekuatan otot lengan kanan (0-5)` | non_canonical | 0 | 0 | 0 | empty |  |
| 203 | `Gangguan rasa raba lengan kanan?` | non_canonical | 0 | 0 | 0 | empty |  |
| 204 | `Kelumpuhan lengan kiri?` | non_canonical | 0 | 0 | 0 | empty |  |
| 205 | `Kekuatan otot lengan kiri (0-5)` | non_canonical | 0 | 0 | 0 | empty |  |
| 206 | `Gangguan rasa raba lengan kiri?` | non_canonical | 0 | 0 | 0 | empty |  |
| 207 | `Kelumpuhan bagian lain (muka/leher, dll)` | non_canonical | 0 | 0 | 0 | empty |  |
| 208 | `Riwayat bepergian 35 hari terakhir?` | non_canonical | 2 | 66.67 | 1 | booleanish | non_canonical_with_data |
| 209 | `Lokasi perjalanan` | legacy_alias | 0 | 0 | 0 | empty | legacy_alias_live |
| 210 | `Tanggal pergi` | non_canonical | 0 | 0 | 0 | empty |  |
| 211 | `Riwayat kontak dengan anak yang baru imunisasi OPV 75 hari?` | non_canonical | 0 | 0 | 0 | empty |  |
| 212 | `Memiliki jamban sendiri di rumah?` | non_canonical | 1 | 33.33 | 1 | booleanish | non_canonical_with_data |
| 213 | `Jenis jamban (lainnya)` | non_canonical | 0 | 0 | 0 | empty |  |
| 214 | `Frekuensi penggunaan jamban` | non_canonical | 1 | 33.33 | 1 | text | non_canonical_with_data |
| 215 | `Jamban punya saluran pembuangan kedap & aman?` | non_canonical | 1 | 33.33 | 1 | booleanish | non_canonical_with_data |
| 216 | `Masih menggunakan diapers?` | non_canonical | 1 | 33.33 | 1 | booleanish | non_canonical_with_data |
| 217 | `Cara pembuangan diapers` | non_canonical | 1 | 33.33 | 1 | text | non_canonical_with_data |
| 218 | `Cara pembuangan diapers (lainnya)` | non_canonical | 0 | 0 | 0 | empty |  |
| 219 | `Jumlah dosis OPV rutin` | non_canonical | 3 | 100 | 2 | text | non_canonical_with_data |
| 220 | `Jumlah dosis IPV rutin` | non_canonical | 3 | 100 | 2 | text | non_canonical_with_data |
| 221 | `Jumlah dosis Hexavalen rutin` | non_canonical | 1 | 33.33 | 1 | text | non_canonical_with_data |
| 222 | `Sumber informasi imunisasi rutin` | non_canonical | 3 | 100 | 2 | text | non_canonical_with_data |
| 223 | `Jumlah dosis OPV tambahan` | non_canonical | 3 | 100 | 2 | text | non_canonical_with_data |
| 224 | `Jumlah dosis IPV tambahan` | non_canonical | 3 | 100 | 2 | text | non_canonical_with_data |
| 225 | `Sumber informasi imunisasi tambahan` | non_canonical | 3 | 100 | 1 | text | non_canonical_with_data |
| 226 | `Tanggal imunisasi OPV terakhir` | non_canonical | 2 | 66.67 | 1 | date | non_canonical_with_data |
| 227 | `Tanggal imunisasi IPV terakhir` | non_canonical | 2 | 66.67 | 1 | date | non_canonical_with_data |
| 228 | `Tanggal imunisasi Hexavalen terakhir` | non_canonical | 0 | 0 | 0 | empty |  |
| 229 | `Tanggal imunisasi polio terakhir tidak diketahui?` | non_canonical | 0 | 0 | 0 | empty |  |
| 230 | `Tanggal ambil spesimen 1` | non_canonical | 0 | 0 | 0 | empty |  |
| 231 | `Tanggal kirim spesimen 1 ke provinsi` | non_canonical | 0 | 0 | 0 | empty |  |
| 232 | `Tanggal kirim spesimen 1 ke lab` | non_canonical | 0 | 0 | 0 | empty |  |
| 233 | `Tanggal ambil spesimen 2` | non_canonical | 0 | 0 | 0 | empty |  |
| 234 | `Tanggal kirim spesimen 2 ke provinsi` | non_canonical | 0 | 0 | 0 | empty |  |
| 235 | `Tanggal kirim spesimen 2 ke lab` | non_canonical | 0 | 0 | 0 | empty |  |
| 236 | `Alasan tidak diambil spesimen` | non_canonical | 1 | 33.33 | 1 | text | non_canonical_with_data |
| 237 | `Nama Petugas Investigasi` | non_canonical | 3 | 100 | 2 | text | non_canonical_with_data |
| 238 | `Diagnosis akhir` | non_canonical | 3 | 100 | 2 | text | non_canonical_with_data |
| 239 | `Nama dokter pemeriksa` | non_canonical | 3 | 100 | 2 | text | non_canonical_with_data |
| 240 | `No Telp/HP dokter pemeriksa` | non_canonical | 1 | 33.33 | 1 | numeric | non_canonical_with_data |
