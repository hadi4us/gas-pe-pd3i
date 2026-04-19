# Next Steps

## Status Saat Ini
- Autentikasi `clasp` sudah selesai
- Source sudah sinkron lokal ↔ GitHub ↔ Apps Script
- Deployment produksi sudah diredeploy ke versi terbaru
- Batch ekspansi form berdasarkan blueprint + gap audit sudah masuk ke codebase

## Prioritas Berikutnya

1. **UAT runtime batch ekspansi form**
   - Gunakan checklist: `docs/FORM-EXPANSION-UAT.md`
   - Verifikasi render, save, edit, dan auto-header untuk MR/DIF/PERT/TN/AFP

2. **Perbarui matriks gap setelah UAT**
   - Tandai gap yang sudah tertutup
   - Pisahkan gap tersisa: `high / medium / low`

3. **Review manual hasil migrasi referensi**
   - Cek `REF_USER.Catatan Migrasi`
   - Pastikan `UnitKerja`, `KodePuskesmas`, dan `ScopeLevel` sudah benar
   - Gunakan `docs/REFERENCE-DATA-DICTIONARY.md` sebagai acuan perubahan

4. **Dashboard sebaran wilayah**
   - Agregasi per diagnosis untuk kecamatan / kelurahan / RW / RT
   - Pastikan konsisten dengan model wilayah baru (`REF_PENGAMPU` + domisili pasien)

5. **Hotspot map dari koordinat**
   - Peta titik kasus
   - Layer heatmap / hotspot
   - Filter diagnosis / periode

6. **Polish dashboard admin review**
   - Tambah filter puskesmas / tanggal input pada queue verifikasi
   - Tambah badge status verifikasi di kartu statistik utama
   - Pertimbangkan bulk triage / quick-open dari queue
