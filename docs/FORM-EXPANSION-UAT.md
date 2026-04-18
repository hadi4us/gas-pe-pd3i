# FORM EXPANSION UAT — PD3I

Dokumen ini adalah checklist verifikasi setelah batch implementasi ekspansi form berdasarkan:
- `docs/BLUEPRINT.md`
- `docs/FIELD-GAP-MATRIX.md`

Target utama UAT ini:
1. memastikan field baru benar-benar **muncul di UI**
2. memastikan field baru **tersimpan ke sheet**
3. memastikan data baru bisa **dibuka lagi di mode edit**
4. memastikan perubahan tidak merusak alur lama (save, search, edit, dashboard, print MR)

---

## 1) Prasyarat

1. Source terbaru sudah:
   - di-push ke GitHub
   - di-push ke Apps Script
   - di-redeploy ke Web App produksi
2. Login petugas/admin tersedia di `REF_USER`
3. Semua sheet DX tersedia:
   - `MR_Raw`
   - `DIF_Raw`
   - `PERT_Raw`
   - `TN_Raw`
   - `AFP_Raw`
4. Uji dilakukan pada deployment produksi aktif yang dipakai app
5. Siapkan minimal 1 data dummy / data uji per diagnosis

---

## 2) Aturan Hasil Uji

Gunakan status berikut:
- **PASS** → tampil/simpan/edit sesuai harapan
- **PARTIAL** → sebagian jalan, ada mismatch minor
- **FAIL** → tidak tampil / tidak tersimpan / error / edit rusak
- **N/A** → tidak relevan untuk diagnosis tersebut

---

## 3) Uji Umum Lintas Diagnosis

### TC-GEN-01 — Render form diagnosis
**Langkah**
1. Buka aplikasi.
2. Pilih diagnosis satu per satu: MR, DIF, PERT, TN, AFP.

**Expected**
- Form tampil tanpa blank screen / error JS.
- Section common tetap muncul.
- Section spesifik diagnosis berubah sesuai pilihan DX.

---

### TC-GEN-02 — Save data baru
**Langkah**
1. Isi minimal data wajib.
2. Tambahkan beberapa field baru hasil ekspansi.
3. Submit.

**Expected**
- Save sukses.
- `Nomor EPID` terbentuk.
- Row baru masuk ke sheet DX terkait.
- Header baru otomatis ditambahkan jika belum ada.

---

### TC-GEN-03 — Search dan edit data
**Langkah**
1. Cari data yang baru disimpan.
2. Buka mode edit.
3. Pastikan field baru terisi kembali.
4. Ubah salah satu field baru dan simpan ulang.

**Expected**
- Data lama ter-hydrate dengan benar.
- Field baru tidak hilang.
- Update tersimpan ke row yang sama.

---

### TC-GEN-04 — Dynamic table kontak erat
**Langkah**
1. Tambah beberapa row pada `Kontak Erat`.
2. Isi kolom baru seperti:
   - jumlah imunisasi terkait
   - kondisi saat itu
   - kontak hamil
   - keterangan
3. Simpan, lalu buka ulang mode edit.

**Expected**
- Semua kolom baru bisa diisi.
- JSON tabel tersimpan dan ter-restore saat edit.

---

### TC-GEN-05 — Tidak merusak field lama
**Langkah**
1. Isi field lama yang sebelumnya sudah ada.
2. Simpan dan edit ulang.

**Expected**
- Field lama tetap normal.
- Save/search/edit lama tidak rusak.

---

## 4) UAT per Diagnosis

# A. MR / Campak-Rubella

### TC-MR-01 — Field KLB
Cek field:
- `Kasus KLB`
- `KLB ke`
- `Nomor KLB`

**Expected**
- Saat `Kasus KLB = Ya`, field `KLB ke` dan `Nomor KLB` tampil.
- Nilai tersimpan dan muncul lagi saat edit.

### TC-MR-02 — Gejala utama eksplisit
Cek field:
- `Demam?`
- `Tanggal mulai demam`
- `Ruam Makulopapular?`
- `Tanggal mulai ruam`

**Expected**
- Tanggal hanya relevan saat jawaban `Ya`.
- Save/edit tetap konsisten.

### TC-MR-03 — Imunisasi MR spesifik
Cek field:
- dosis 1 + sumber
- dosis 2 + sumber
- BIAS + sumber
- MMR + sumber
- imunisasi tambahan + sumber
- tanggal imunisasi terakhir

**Expected**
- Semua field tampil.
- Semua field tersimpan.
- Tidak bentrok dengan tabel `Riwayat Imunisasi`.

### TC-MR-04 — Kontak erat MR
**Expected**
- Tabel kontak bisa menyimpan jumlah imunisasi terkait dan kontak hamil.

---

# B. DIF / Difteri

### TC-DIF-01 — Identitas tambahan
Cek field:
- `Nama Kantor & Jabatan`
- `No. Kontak Pasien`
- `Pekerjaan`
- `Alamat Tempat Kerja`
- seluruh blok wali/kontak darurat

**Expected**
- Semua field tampil dan tersimpan.

### TC-DIF-02 — Riwayat pengobatan lengkap
Cek field:
- dokter praktek swasta
- tanggal dokter swasta
- perawat/mantri/bidan
- tanggal perawat/mantri/bidan
- `Tidak berobat`

**Expected**
- Semua field baru bisa diisi tanpa merusak field lama.

---

# C. PERT / Pertusis

### TC-PERT-01 — Klinis tambahan
Cek field:
- `Tanggal mulai apnea`
- `Gejala lain`

### TC-PERT-02 — Rawat inap detail
Cek field:
- `Nama Rumah Sakit`
- `Nomor Rekam Medik`
- `Tanggal Masuk Rawat Inap`
- `Tanggal Keluar`

### TC-PERT-03 — Vaksinasi spesifik
Cek field:
- ORI
- sumber informasi ORI
- tanggal vaksinasi terakhir

### TC-PERT-04 — Epidemiologi dan spesimen tambahan
Cek field:
- jumlah kasus serupa
- perjalanan 1 bulan
- spesimen lain
- status akhir kasus

**Expected**
- Semua blok baru tampil, tersimpan, dan bisa diedit ulang.

---

# D. TN / Tetanus Neonatorum

### TC-TN-01 — Identitas ibu-bayi
Cek field:
- anak ke-
- usia ibu
- pekerjaan ibu
- pendidikan ibu
- lama tinggal di desa

### TC-TN-02 — Informasi kelahiran
Cek field:
- lahir hidup
- menangis saat lahir
- tanda kelahiran hidup
- bisa menyusu
- mulut mencucu
- mudah kejang
- dirawat / tempat / tanggal mulai dirawat
- keadaan setelah dirawat

### TC-TN-03 — ANC dan persalinan
Cek field:
- jumlah kunjungan ANC
- tempat pemeriksaan ibu hamil
- pemeriksa kehamilan
- alat potong tali pusat
- keadaan ibu saat ini

### TC-TN-04 — Imunisasi ibu
Cek field:
- sumber informasi
- Td kehamilan ini
- Td kehamilan sebelumnya
- Td calon pengantin
- riwayat DPT/DT/Td
- status T ibu

### TC-TN-05 — Respon kasus & informasi lain
Cek field:
- vaksin Td saat investigasi
- tanggal pemberian vaksin
- cakupan imunisasi
- cakupan KN1/KN2/KN3
- akses desa ke faskes
- faktor imunisasi
- faktor pertolongan persalinan

**Expected**
- Semua field TN baru tampil dan tersimpan.
- Tidak ada blank form / lag berat berlebihan.

---

# E. AFP / Acute Flaccid Paralysis

### TC-AFP-01 — Riwayat sakit
Cek field:
- tanggal gejala awal
- tanggal lumpuh
- tanggal meninggal
- pengobatan tradisional
- rawat RS
- diagnosis
- no. rekam medik
- rudapaksa

### TC-AFP-02 — Pemeriksaan neurologis
Cek field:
- tungkai kanan/kiri
- lengan kanan/kiri
- kekuatan otot
- rasa raba
- lokasi tambahan

### TC-AFP-03 — Sanitasi dasar
Cek field:
- jamban
- jenis jamban
- penggunaan jamban
- saluran aman
- pembuangan diapers

### TC-AFP-04 — Imunisasi polio ringkas
Cek field:
- OPV/IPV/Hexavalen rutin
- program tambahan
- OPV/IPV tambahan
- tanggal terakhir OPV/IPV/Hexavalen

### TC-AFP-05 — Logistik spesimen
Cek field:
- tanggal ambil spesimen I/II
- tanggal kirim kab→prov
- tanggal kirim prov→lab
- alasan tidak diambil
- hasil pemeriksaan
- data dokter

**Expected**
- Semua blok baru bisa diisi dan disimpan.
- Field pencarian/edit tetap berjalan normal.

---

## 5) Verifikasi Penyimpanan Sheet

Setelah tiap diagnosis diuji, cek sheet DX terkait:
- header baru otomatis muncul
- nilai field baru masuk ke kolom yang benar
- update kedua tidak membuat row baru jika EPID sama

Checklist:
- [ ] MR_Raw
- [ ] DIF_Raw
- [ ] PERT_Raw
- [ ] TN_Raw
- [ ] AFP_Raw

---

## 6) Verifikasi Workflow Baru

### TC-WF-01 — Wizard navigation
- tombol `Langkah Sebelumnya` / `Langkah Berikutnya` berpindah ke section yang tepat
- progress wizard berubah sesuai step aktif
- stepper menunjukkan step aktif / complete secara konsisten
- `Langkah Berikutnya` menahan perpindahan bila field wajib di step aktif belum lengkap

### TC-WF-02 — Verifikasi EPID
- isi `Status Verifikasi EPID`
- isi `Tanggal Verifikasi EPID`
- isi `Petugas Verifikator`
- pastikan summary panel dan workflow summary ikut berubah

### TC-WF-03 — Hasil sampel
- ubah `Pemeriksaan Sampel Dilakukan`
- isi interpretasi hasil bila ada
- pastikan summary panel membaca state sampel dengan benar

### TC-WF-04 — Status pasien dan timeline
- ubah `Status Pasien/Kasus`
- isi `Tanggal Update Status`
- cek apakah opsi `Dasar Penetapan Status` menyesuaikan konteks status
- cek apakah row baru muncul di `Riwayat Status Kasus`
- simpan lalu edit ulang, pastikan timeline tetap ada

### TC-WF-05 — Search result workflow badges
- cari data existing
- pastikan hasil pencarian menampilkan:
  - status kasus
  - status verifikasi EPID
  - status sampel

---

## 7) Verifikasi Risiko Regresi

### TC-REG-01 — Login
- login tetap berhasil
- sesi lama direstore tanpa flicker modal berlebihan
- token sesi tidak lagi disimpan persisten di local browser antar-tab bila sessionStorage tersedia
- brute-force guard mengunci sementara setelah percobaan gagal berulang
- role viewer tidak dapat melakukan save/update walau mencoba bypass UI
- role viewer melihat badge / mode UI yang jelas sebagai read-only

### TC-REG-02 — Search
- cari berdasarkan EPID/nama tetap jalan

### TC-REG-03 — Dashboard
- dashboard tetap bisa dibuka
- quality cards dan indikator epidemiologis muncul tanpa error
- prioritas tindak lanjut tampil konsisten bila ambang masalah operasional terpenuhi

### TC-REG-04 — Retry admin
- retry sync / notify / telegram tetap tampil untuk admin

### TC-REG-05 — Print MR
- print MR tetap bisa dibuka
- field MR lama tidak rusak

---

## 8) Hasil Eksekusi

| Test Case | Status | Catatan |
|---|---|---|
| TC-GEN-01 | PENDING | |
| TC-GEN-02 | PENDING | |
| TC-GEN-03 | PENDING | |
| TC-GEN-04 | PENDING | |
| TC-GEN-05 | PENDING | |
| TC-MR-01 | PENDING | |
| TC-MR-02 | PENDING | |
| TC-MR-03 | PENDING | |
| TC-MR-04 | PENDING | |
| TC-DIF-01 | PENDING | |
| TC-DIF-02 | PENDING | |
| TC-PERT-01 | PENDING | |
| TC-PERT-02 | PENDING | |
| TC-PERT-03 | PENDING | |
| TC-PERT-04 | PENDING | |
| TC-TN-01 | PENDING | |
| TC-TN-02 | PENDING | |
| TC-TN-03 | PENDING | |
| TC-TN-04 | PENDING | |
| TC-TN-05 | PENDING | |
| TC-AFP-01 | PENDING | |
| TC-AFP-02 | PENDING | |
| TC-AFP-03 | PENDING | |
| TC-AFP-04 | PENDING | |
| TC-AFP-05 | PENDING | |
| TC-WF-01 | PENDING | |
| TC-WF-02 | PENDING | |
| TC-WF-03 | PENDING | |
| TC-WF-04 | PENDING | |
| TC-WF-05 | PENDING | |
| TC-REG-01 | PENDING | |
| TC-REG-02 | PENDING | |
| TC-REG-03 | PENDING | |
| TC-REG-04 | PENDING | |
| TC-REG-05 | PENDING | |

---

## 9) Definisi Lulus Batch Ekspansi Form

Batch dianggap cukup aman untuk lanjut ke penutupan gap berikutnya jika:
- semua diagnosis bisa dirender tanpa error
- minimal 1 save + edit ulang sukses untuk tiap DX
- header baru masuk otomatis ke tiap sheet
- tidak ada regresi besar pada login/search/dashboard/print MR
- issue sisa tercatat untuk perbaikan batch berikutnya
