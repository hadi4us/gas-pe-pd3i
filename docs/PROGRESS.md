# Progress Proyek

## 2026-04-10
- [x] `clasp` berhasil di-install (`v3.3.0`)
- [x] Folder proyek dirapikan (`src/`, `docs/`, `assets/`)
- [x] Login `clasp` selesai
- [x] Clone source project ke `src/`
- [x] Inventaris file dan fungsi utama
- [x] Dokumentasi arsitektur dan alur deployment
- [x] Phase 1: pipeline post-save config-driven untuk semua DX
- [x] Phase 2: generalisasi header/status routing lintas DX
- [x] Phase 3: idempotency fingerprint + reason terstruktur per step
- [x] Checklist verifikasi/UAT Phase 3 dibuat
- [x] Sprint Reliability tahap awal: async pipeline queue (mode opsional via PIPELINE_MODE=async)

## 2026-04-18
- [x] Blueprint utama proyek distandarkan ke `docs/BLUEPRINT.md`
- [x] Matriks gap field manual vs form input dibuat di `docs/FIELD-GAP-MATRIX.md`
- [x] `docs/BLUEPRINT-CONTINUATION.md` dihapus agar tidak ada blueprint ganda
- [x] Form MR diperluas untuk field KLB, imunisasi MR spesifik (dosis 1/2, BIAS, MMR, imunisasi tambahan), dan penguatan eksplisit demam/ruam
- [x] Form DIF diperluas untuk identitas wali/kontak darurat dan riwayat pengobatan yang lebih lengkap
- [x] Form PERT diperluas untuk apnea onset, detail rawat inap, ORI, perjalanan, spesimen lain, dan status akhir kasus
- [x] Form TN diperluas besar-besaran mengikuti struktur form manual (identitas ibu-bayi, ANC, persalinan, imunisasi ibu, respon kasus, dan faktor konteks)
- [x] Form AFP diperluas besar-besaran (riwayat sakit, pemeriksaan neurologis, sanitasi, imunisasi polio ringkas, logistik spesimen, dan data dokter)
- [x] Penyimpanan backend diperkuat agar header sheet baru otomatis ditambahkan saat field baru masuk
- [x] Tabel kontak erat diperluas agar bisa menampung jumlah imunisasi terkait, kondisi saat itu, dan penanda kontak hamil
- [x] Source terbaru sudah dipush ke Apps Script (`clasp push -f`)
- [x] Deployment produksi yang dipakai aplikasi berhasil diredeploy ke versi `238` tanpa mengganti URL web app
- [x] Checklist UAT khusus batch ekspansi form dibuat di `docs/FORM-EXPANSION-UAT.md`
- [x] `docs/NEXT-STEPS.md` diperbarui ke fokus pasca-implementasi batch ekspansi form
- [x] Validasi submit diperkuat agar field wajib/show-if benar-benar dicek sebelum simpan
- [x] Guardrail epidemiologis awal ditambahkan untuk MR, DIF, PERT, TN, dan AFP (urutan tanggal penting + rule klinis minimum)
- [x] UI blueprint Tabler-style ditulis di `docs/UI-BLUEPRINT.md`
- [x] Halaman utama direstruktur ke model admin shell (sidebar + topbar + workspace + summary panel) dengan pendekatan Tabler-inspired
