# Next Steps

## Status Saat Ini

- Reorder live untuk `MR_Raw`, `DIF_Raw`, `PERT_Raw`, `TN_Raw`, dan `AFP_Raw` sudah berhasil dijalankan dengan backup sheet `*_PRE_REORDER_*`
- Audit header live bisa direproduksi lewat `scripts/audit-live-raw-headers.js`
- Audit cleanup live bisa direproduksi lewat `scripts/analyze-live-raw-cleanup.js`
- Snapshot terbaru menunjukkan **missing canonical header sudah `0` untuk semua DX**
- Temuan tersisa: `PERT_Raw` masih punya 1 blank header dengan data, `MR_Raw` punya kandidat backfill alias terbanyak, dan semua DX masih menyimpan header legacy/non-canonical untuk masa transisi

## Prioritas Berikutnya

1. **Tangani blank header `PERT_Raw` secara terkontrol**
   - Audit terbaru menemukan blank header di kolom 179 dan kolom itu berisi data pada 1 baris
   - Helper backend tersedia di `src/migration.js`: `previewPertRawBlankHeaderRepair(token)` dan `repairPertRawBlankHeader(token, options)`
   - Default repair membuat backup `PERT_Raw_PRE_PERT_BLANK_REPAIR_*`, memindahkan nilai ke `No Telp/WA Orang Tua/Wali` bila target kosong, lalu menghapus kolom blank hanya jika sudah kosong setelah pemindahan
   - Setelah tindakan, jalankan ulang `node scripts/analyze-live-raw-cleanup.js --format md`

2. **Buat batch backfill / normalisasi alias yang aman**
   - Fokus awal: kandidat `MR_Raw` yang target canonical masih kosong, terutama `Provinsi` → `Provinsi unit pelapor` dan `Kab/Kota` → `Kab/Kota unit pelapor`
   - Untuk pasangan tanggal yang beda format (`dd/mm/yyyy` vs `yyyy-mm-dd`), jangan overwrite sebelum aturan normalisasi tanggal eksplisit dibuat
   - Pertahankan kompatibilitas baca/tulis selama masa transisi

3. **Regression check pasca-cleanup schema**
   - Uji buka record existing
   - Uji save input awal, verifikasi, hasil sampel, dan update status
   - Uji inbox/queue serta dashboard yang membaca field workflow baru

4. **Baru setelah itu putuskan cleanup legacy**
   - Tandai kolom yang hanya alias transisi
   - Tentukan apakah cukup dipertahankan di belakang, diarsipkan, atau benar-benar dihentikan pemakaiannya

## Catatan Operasional

- Cleanup berikutnya harus tetap **non-destruktif**
- Urutan aman sekarang: **audit blank/data → backfill canonical kosong → verifikasi runtime → cleanup legacy**
- Jangan declare schema raw “bersih” sebelum kolom blank berdata dan alias legacy sudah ditangani tanpa mengganggu record lama
