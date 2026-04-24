# Next Steps

## Status Saat Ini

- Reorder live untuk `MR_Raw`, `DIF_Raw`, `PERT_Raw`, `TN_Raw`, dan `AFP_Raw` sudah berhasil dijalankan dengan backup sheet `*_PRE_REORDER_*`
- Audit pasca-reorder sekarang bisa direproduksi lewat `scripts/audit-live-raw-headers.js`
- Temuan utama: hanya `MR_Raw` yang sudah cukup dekat ke schema runtime baru, sedangkan `DIF/PERT/TN/AFP` masih dominan memakai struktur sheet lama

## Prioritas Berikutnya

1. **Append missing canonical headers secara non-destruktif**
   - Fokus pertama: `DIF_Raw`, `PERT_Raw`, `TN_Raw`, `AFP_Raw`
   - Tambahkan juga 7 header canonical yang masih hilang di `MR_Raw`
   - Jangan hapus kolom legacy pada tahap ini

2. **Buat batch backfill / normalisasi alias yang aman**
   - Konsolidasikan pasangan alias lama → header target baru, terutama di `MR_Raw`
   - Pertahankan kompatibilitas baca/tulis selama masa transisi

3. **Audit blank trailing columns**
   - Verifikasi 6 blank trailing headers pada `DIF_Raw`, `PERT_Raw`, `TN_Raw`, dan `AFP_Raw`
   - Pastikan benar-benar kosong sebelum dipindah, diarsipkan, atau dibersihkan

4. **Regression check pasca-schema append**
   - Uji buka record existing
   - Uji save input awal, verifikasi, hasil sampel, dan update status
   - Uji inbox/queue serta dashboard yang membaca field workflow baru

5. **Baru setelah itu putuskan cleanup legacy**
   - Tandai kolom yang hanya alias transisi
   - Tentukan apakah cukup dipertahankan di belakang, diarsipkan, atau benar-benar dihentikan pemakaiannya

## Catatan Operasional

- Cleanup berikutnya harus tetap **non-destruktif**
- Urutan aman: **append missing headers → backfill/compatibility → verifikasi runtime → cleanup legacy**
- Jangan declare schema raw “bersih” sebelum gap live lintas DX benar-benar turun dan queue/runtime tidak lagi bergantung pada campuran header lama
