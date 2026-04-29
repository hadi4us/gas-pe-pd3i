# RAW Cleanup Current Audit

Dokumen ini adalah snapshot audit cleanup terbaru untuk sheet live `*_Raw` setelah canonical header sudah lengkap lintas diagnosis. Audit ini bersifat **read-only** dan tidak mengubah spreadsheet produksi.

## Cara reproduksi

```bash
node scripts/analyze-live-raw-cleanup.js --format md
```

Untuk investigasi contoh nilai secara lokal saja, gunakan opsi `--max-examples N`. Jangan commit output contoh nilai karena bisa memuat data pasien/kontak.

## Kesimpulan operasional

- Missing canonical header sudah `0` untuk semua DX; batch append header tidak lagi menjadi prioritas utama.
- `PERT_Raw` masih memiliki 1 blank header di kolom 179 dan kolom itu berisi data pada 1 baris, sehingga tidak boleh langsung dihapus.
- Kandidat backfill alias yang terukur saat ini hanya muncul di `MR_Raw`.
- Cleanup berikutnya harus tetap non-destruktif: backup sheet, backfill canonical bila target kosong, verifikasi runtime, baru evaluasi kolom legacy/blank.

## Rekomendasi batch berikutnya

1. Tangani kolom blank `PERT_Raw` kolom 179 secara manual/terkontrol: identifikasi header asalnya, pindahkan nilainya ke canonical yang tepat bila valid, lalu audit ulang.
2. Buat helper backfill alias untuk pasangan MR yang target canonical masih kosong, terutama `Provinsi` → `Provinsi unit pelapor` dan `Kab/Kota` → `Kab/Kota unit pelapor`.
   - Helper backend tersedia di `src/migration.js`: `previewRawSheetAliasBackfill(token, dxList)` dan `backfillRawSheetAliases(token, dxList, options)`.
   - Default backfill hanya mengisi target canonical yang kosong dan membuat backup `*_PRE_ALIAS_BACKFILL_*`; nilai target yang sudah berisi tidak dioverwrite kecuali `options.applyDifferentValues === true`.
3. Untuk pasangan alias tanggal MR yang nilainya berbeda format (`dd/mm/yyyy` vs `yyyy-mm-dd`), jangan overwrite; cukup normalisasi setelah ada aturan tanggal eksplisit.
4. Setelah backfill, jalankan regression UAT: buka record existing, save input awal, verifikasi EPID, input hasil sampel, update status, dashboard.

---

# Live Raw Cleanup Analysis

- Spreadsheet ID: `1ck-98iYBxvNrHV7NxgcBSwiMxzmJ2zORVA93xuT9hIs`
- Inspected at: 2026-04-29T00:51:31.478Z
- Source: public `gviz/tq?tqx=out:csv` full-sheet read per `*_Raw` sheet

## Ringkasan

| DX | Rows | Cols | Blank headers | Blank headers with data | Alias legacy live | Alias backfill candidates | Non-canonical live | Missing canonical |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| MR | 33 | 206 | 0 | 0 | 43 | 5 | 46 | 0 |
| DIF | 4 | 226 | 0 | 0 | 8 | 0 | 62 | 0 |
| PERT | 5 | 179 | 1 | 1 | 14 | 0 | 43 | 0 |
| TN | 1 | 257 | 0 | 0 | 7 | 0 | 79 | 0 |
| AFP | 4 | 240 | 0 | 0 | 9 | 0 | 69 | 0 |

## MR

- Sheet: `MR_Raw`
- Rows read: 33 (32 data rows)
- Total columns: 206
- Missing canonical: 0
- Blank headers: 0

### Alias backfill candidates

- `Provinsi` → `Provinsi unit pelapor`: source-filled/target-empty=17, different=0
- `Kab/Kota` → `Kab/Kota unit pelapor`: source-filled/target-empty=17, different=0
- `Tanggal mulai demam` → `Tanggal Mulai Demam`: source-filled/target-empty=0, different=2
- `Tanggal mulai ruam` → `Tanggal Mulai Ruam`: source-filled/target-empty=0, different=1
- `Kab/Kota Pasien` → `Kab/Kota`: source-filled/target-empty=0, different=1

### Alias legacy live

- `Provinsi` → `Provinsi unit pelapor`
- `Kab/Kota` → `Kab/Kota unit pelapor`
- `Nama Petugas` → `Petugas`
- `Nama orang tua/wali` → `Nama Orang Tua/Wali`
- `No. kontak orang tua/wali` → `No Telp/WA Orang Tua/Wali`
- `Provinsi Pasien` → `Provinsi`
- `Kab/Kota Pasien` → `Kab/Kota`
- `Tanggal mulai demam` → `Tanggal Mulai Demam`
- `Tanggal mulai ruam` → `Tanggal Mulai Ruam`
- `Mata merah` → `Mata Merah`
- `Bagian Sendi` → `Bagian Sendi`
- `Lokasi Adenopathy` → `Lokasi Adenopathy`
- `Umur kehamilan` → `Umur Kehamilan`
- `Gejala lain` → `Gejala Lain`
- `Sebutkan gejala lain` → `Sebutkan Gejala Lain`
- `Diare` → `Komp_Diare`
- `Bronchopneumonia` → `Komp_Bronchopneumonia`
- `Kebutaan` → `Komp_Kebutaan`
- `Otitis media` → `Komp_Otitis Media`
- `Pneumonia` → `Komp_Pneumonia`
- `Encephalitis` → `Komp_Encephalitis`
- `Malnutrisi` → `Komp_Malnutrisi`
- `Ulkus mukosa mulut` → `Komp_Ulkus Mukosa Mulut`
- `Lainnya komplikasi` → `Komp_Lainnya`
- `Sebutkan komplikasi lain` → `Komp_Lainnya_Sebutkan`
- `Apakah dirawat inap?` → `Rawat inap?`
- `Pemberian Vitamin A` → `Pemberian vitamin A?`
- `Ada kasus serupa di lingkungan` → `Ada kasus sekitar?`
- `Jumlah kasus sekitar` → `Jumlah kasus sekitar`
- `Riwayat perjalanan 7-21 hari` → `Berpergian 1 bulan terakhir?`
- `Lokasi perjalanan` → `Tujuan perjalanan`
- `Tanggal pergi` → `Tanggal pergi`
- `Tanggal pulang perjalanan` → `Tanggal pulang`
- `Apakah spesimen darah diambil` → `Apakah spesimen darah diambil`
- `Jenis Sampel Darah` → `Jenis Sampel Darah`
- `Tanggal ambil spesimen darah` → `Tanggal ambil spesimen darah`
- `Tanggal pengiriman spesimen darah ke lab` → `Tanggal pengiriman spesimen darah ke lab`
- `Apakah spesimen lain diambil` → `Apakah spesimen lain diambil`
- `Jenis Sampel Lain` → `Jenis Sampel Lain`
- `Tanggal ambil spesimen lain` → `Tanggal ambil spesimen lain`
- `Tanggal pengiriman spesimen lain ke lab` → `Tanggal pengiriman spesimen lain ke lab`
- `Status akhir kasus` → `Keadaan saat ini`
- `Kontak Erat` → `KontakEratJSON`

## DIF

- Sheet: `DIF_Raw`
- Rows read: 4 (3 data rows)
- Total columns: 226
- Missing canonical: 0
- Blank headers: 0

### Alias legacy live

- `Provinsi` → `Provinsi unit pelapor`
- `Kab/Kota` → `Kab/Kota unit pelapor`
- `Nama Petugas` → `Petugas`
- `Nama orang tua/wali` → `Nama Orang Tua/Wali`
- `No. kontak orang tua/wali` → `No Telp/WA Orang Tua/Wali`
- `Provinsi Pasien` → `Provinsi`
- `Kab/Kota Pasien` → `Kab/Kota`
- `Tanggal mulai demam` → `Tanggal Mulai Demam`

## PERT

- Sheet: `PERT_Raw`
- Rows read: 5 (4 data rows)
- Total columns: 179
- Missing canonical: 0
- Blank headers: 1

### Blank header columns

- Column 179: 1 non-empty cells

### Alias legacy live

- `Provinsi` → `Provinsi unit pelapor`
- `Kab/Kota` → `Kab/Kota unit pelapor`
- `Nama Petugas` → `Petugas`
- `Nama orang tua/wali` → `Nama Orang Tua/Wali`
- `No. kontak orang tua/wali` → `No Telp/WA Orang Tua/Wali`
- `Provinsi Pasien` → `Provinsi`
- `Kab/Kota Pasien` → `Kab/Kota`
- `Jumlah kasus sekitar` → `Jumlah kasus sekitar`
- `Tanggal pergi` → `Tanggal pergi`
- `Tanggal kembali` → `Tanggal pulang`
- `Spesimen diambil?` → `Apakah spesimen darah diambil`
- `Jenis spesimen` → `Jenis Sampel Darah`
- `Tanggal ambil spesimen` → `Tanggal ambil spesimen darah`
- `Tanggal ambil spesimen lain` → `Tanggal ambil spesimen lain`

## TN

- Sheet: `TN_Raw`
- Rows read: 1 (0 data rows)
- Total columns: 257
- Missing canonical: 0
- Blank headers: 0

### Alias legacy live

- `Provinsi` → `Provinsi unit pelapor`
- `Kab/Kota` → `Kab/Kota unit pelapor`
- `Nama Petugas` → `Petugas`
- `Nama orang tua/wali` → `Nama Orang Tua/Wali`
- `No. kontak orang tua/wali` → `No Telp/WA Orang Tua/Wali`
- `Provinsi Pasien` → `Provinsi`
- `Kab/Kota Pasien` → `Kab/Kota`

## AFP

- Sheet: `AFP_Raw`
- Rows read: 4 (3 data rows)
- Total columns: 240
- Missing canonical: 0
- Blank headers: 0

### Alias legacy live

- `Provinsi` → `Provinsi unit pelapor`
- `Kab/Kota` → `Kab/Kota unit pelapor`
- `Nama Petugas` → `Petugas`
- `Nama orang tua/wali` → `Nama Orang Tua/Wali`
- `No. kontak orang tua/wali` → `No Telp/WA Orang Tua/Wali`
- `Provinsi Pasien` → `Provinsi`
- `Kab/Kota Pasien` → `Kab/Kota`
- `Lokasi perjalanan` → `Tujuan perjalanan`
- `Tanggal pergi` → `Tanggal pergi`
