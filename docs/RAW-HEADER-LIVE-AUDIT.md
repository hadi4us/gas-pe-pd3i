# RAW Header Live Audit

Audit ini merekam kondisi **header live** pasca-eksekusi reorder `*_Raw` di spreadsheet produksi.

## Cara baca / reproduksi

Sumber audit memakai pembacaan header publik via `gviz/tq?tqx=out:csv`, lalu dibandingkan dengan:

- schema canonical lokal di `src/raw_schema.js`
- alias header transisi di `src/data.js`

Perintah reproduksi:

```bash
node scripts/audit-live-raw-headers.js --format md
```

Spreadsheet target:

- Spreadsheet ID: `1ck-98iYBxvNrHV7NxgcBSwiMxzmJ2zORVA93xuT9hIs`

Snapshot angka di bawah berasal dari inspeksi `2026-04-24T01:00:06.883Z`.

## Ringkasan hasil

| DX | Cols | Blank headers | Alias legacy live | Non-canonical live | Missing canonical |
| --- | ---: | ---: | ---: | ---: | ---: |
| MR | 199 | 0 | 43 | 46 | 7 |
| DIF | 97 | 6 | 1 | 62 | 135 |
| PERT | 76 | 6 | 7 | 43 | 108 |
| TN | 117 | 6 | 0 | 79 | 146 |
| AFP | 99 | 6 | 2 | 69 | 147 |

## Temuan utama

### 1. `MR_Raw` sudah paling dekat ke schema runtime sekarang

`MR_Raw` berhasil direorder dan sudah membawa banyak blok workflow/pipeline baru. Tapi sheet ini masih **hybrid**:

- masih ada banyak header alias lama yang hidup berdampingan dengan header target baru
- masih ada kolom non-canonical transisi seperti `dx`, `Klasifikasi`, `Link PDF`, `RAW_ROW_NUMBER`, dan jejak audit/staging lama
- masih ada 7 header canonical yang belum muncul di live sheet

Artinya, untuk MR langkah berikutnya bukan reorder lagi, tapi **konsolidasi alias** dan **append header canonical yang masih kurang**.

### 2. `DIF_Raw`, `PERT_Raw`, `TN_Raw`, `AFP_Raw` masih dominan struktur lama

Keempat sheet ini menunjukkan gap besar terhadap schema canonical aktif di codebase:

- jumlah `missing canonical` masih sangat tinggi
- sebagian besar field workflow/system/pipeline terbaru belum ada sebagai kolom live
- ada `blank trailing headers` masing-masing 6 kolom, tanda struktur sheet lama pernah menyisakan kolom kosong di ujung

Kesimpulannya, reorder live yang kemarin **berhasil**, tapi tidak cukup untuk meng-upgrade sheet lama menjadi schema runtime baru karena kolom-kolom itu memang belum pernah ada di sheet.

### 3. Cleanup aman harus berbentuk append/backfill, bukan delete langsung

Karena kondisi live masih campuran, cleanup aman harus pakai fase berikut:

1. **append** header canonical yang belum ada, tanpa menghapus kolom lama
2. **backfill / dual-read** dari alias lama ke header target bila perlu
3. verifikasi runtime save, buka record, queue, dan dashboard tetap normal
4. baru putuskan apakah kolom alias lama bisa dipindah ke belakang permanen, diarsipkan, atau dibiarkan untuk kompatibilitas

## Kandidat prioritas batch berikutnya

### Prioritas A, non-destruktif

- Tambahkan missing canonical headers untuk `DIF_Raw`, `PERT_Raw`, `TN_Raw`, `AFP_Raw`
- Tambahkan 7 missing canonical headers pada `MR_Raw`
- Audit blank trailing columns pada `DIF/PERT/TN/AFP` untuk memastikan benar-benar kosong sebelum diarsipkan

### Prioritas B, konsolidasi semantik

Khusus `MR_Raw`, pasangan alias berikut sudah jelas merupakan kandidat konsolidasi setelah backfill:

- `Nama orang tua/wali` → `Nama Orang Tua/Wali`
- `No. kontak orang tua/wali` → `No Telp/WA Orang Tua/Wali`
- `Nama Petugas` → `Petugas`
- `Tanggal mulai demam` → `Tanggal Mulai Demam`
- `Tanggal mulai ruam` → `Tanggal Mulai Ruam`
- `Mata merah` → `Mata Merah`
- `Umur kehamilan` → `Umur Kehamilan`
- `Gejala lain` → `Gejala Lain`
- `Sebutkan gejala lain` → `Sebutkan Gejala Lain`
- `Diare` / `Bronchopneumonia` / `Kebutaan` / `Otitis media` / `Pneumonia` / `Encephalitis` / `Malnutrisi` / `Ulkus mukosa mulut` → kelompok `Komp_*`
- `Apakah dirawat inap?` → `Rawat inap?`
- `Pemberian Vitamin A` → `Pemberian vitamin A?`
- `Ada kasus serupa di lingkungan` → `Ada kasus sekitar?`
- `Riwayat perjalanan 7-21 hari` → `Berpergian 1 bulan terakhir?`
- `Lokasi perjalanan` → `Tujuan perjalanan`
- `Tanggal pulang perjalanan` → `Tanggal pulang`
- `Status akhir kasus` → `Keadaan saat ini`
- `Kontak Erat` → `KontakEratJSON`

## Kesimpulan batch

Batch reorder live **sudah berhasil**, tapi audit live menunjukkan pekerjaan schema belum selesai.

Status jujurnya:

- **fondasi reorder aman**: selesai
- **audit live pasca-reorder**: selesai
- **pembersihan schema sampai benar-benar seragam lintas DX**: belum, dan butuh batch append/backfill non-destruktif berikutnya
