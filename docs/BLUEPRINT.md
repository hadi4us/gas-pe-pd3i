# BLUEPRINT — GAS PE PD3I

Dokumen ini adalah **blueprint utama** untuk proyek **GAS PE PD3I**: gambaran produk, ruang lingkup, arsitektur, alur kerja, prinsip desain, dan arah pengembangan.

---

## 1) Identitas Proyek

- **Nama proyek:** GAS PE PD3I
- **Jenis aplikasi:** Google Apps Script Web App
- **Project ID (Apps Script):** `1laS5GQZob0FQWsLdOGXdx6ea6iyxC7uHeaDE_wVl5rDV8fNQs-3jHUVu`
- **Repository lokal:** `./`
- **Source code utama:** `src/`
- **Dokumentasi:** `docs/`

### Tujuan utama
Menyediakan aplikasi input, pelacakan, pengelolaan, dan monitoring **Penyelidikan Epidemiologi (PE) PD3I** berbasis web yang ringan, mudah dioperasikan, dan bisa dijalankan di ekosistem Google Workspace tanpa infrastruktur server kompleks.

---

## 2) Latar Belakang Masalah

Pelaksanaan PE PD3I di lapangan sering masih bergantung pada formulir manual dan proses rekap yang tersebar. Kondisi ini menimbulkan beberapa masalah utama:

1. **Input data lambat dan tidak seragam**
   - Variabel tidak selalu diisi konsisten
   - Format antar petugas/fasyankes berbeda

2. **Tindak lanjut kasus sulit dilacak**
   - Notifikasi, sinkronisasi, dan distribusi informasi bergantung pada proses manual
   - Riwayat pembaruan kasus tidak selalu terdokumentasi rapi

3. **Analisis dan monitoring tidak real-time**
   - Dashboard dan rekap biasanya tertunda
   - Sulit memantau progres tindak lanjut atau keterlambatan input

4. **Risiko kehilangan konteks operasional**
   - Alur kerja PE berbeda per diagnosis
   - Kebutuhan programatik sering berubah lebih cepat daripada formulir manual

Blueprint ini menempatkan aplikasi sebagai **platform operasional PE PD3I**, bukan sekadar form digital.

---

## 3) Ruang Lingkup Diagnosa

Aplikasi mendukung lima kelompok diagnosis utama:

- **MR** — Campak / Rubella
- **DIF** — Difteri
- **PERT** — Pertusis
- **TN** — Tetanus Neonatorum
- **AFP** — Acute Flaccid Paralysis

Setiap diagnosis memiliki:
- identitas kasus
- pelapor/unit pelapor
- variabel klinis utama
- riwayat imunisasi
- variabel epidemiologis
- spesimen (bila relevan)
- outcome / status akhir
- dukungan pencarian dan audit

---

## 4) Sasaran Pengguna

### Pengguna utama
1. **Petugas surveilans / pelaksana PE**
   - input kasus baru
   - edit kasus
   - pelacakan dan pembaruan kasus

2. **Admin / pengelola sistem**
   - konfigurasi aplikasi
   - monitoring pipeline dan retry
   - akses administratif tertentu

3. **Viewer / pemantau**
   - akses baca dashboard dan pencarian tertentu
   - tanpa hak ubah data

### Entitas operasional terkait
- Puskesmas
- Rumah sakit
- Fasyankes lain
- Pengampu wilayah / pengelola rujukan kasus
- Laboratorium / sistem rujukan spesimen

---

## 5) Tujuan Produk

### Tujuan jangka pendek
- Menggantikan input manual PE menjadi input digital terstruktur
- Menstandarkan pengisian data minimum per diagnosis
- Mempermudah pencarian, update, dan pelacakan kasus
- Menyediakan print/export yang konsisten

### Tujuan jangka menengah
- Membuat notifikasi, sinkronisasi, dan routing tindak lanjut lebih otomatis
- Menyediakan dashboard operasional lintas diagnosis
- Menurunkan duplikasi dan inkonsistensi data

### Tujuan jangka panjang
- Menjadi fondasi **sistem surveilans operasional PD3I** yang lebih matang
- Mendukung indikator mutu surveilans, alert, dan monitoring tindak lanjut
- Menjembatani form lapangan manual dengan alur kerja digital yang lebih cepat

---

## 6) Prinsip Desain

### 6.1 Satu form inti, banyak diagnosis
Aplikasi memakai pola **common fields + diagnosis-specific config** agar:
- identitas dan pelapor tetap seragam
- tiap diagnosis bisa punya blok field khusus
- pengembangan lebih modular

### 6.2 Config-driven, bukan hardcoded per halaman
Diagnosis dikonfigurasi lewat file seperti:
- `config_MR.html`
- `config_DIF.html`
- `config_PERT.html`
- `config_TN.html`
- `config_AFP.html`
- `config_common.html`

Targetnya: perubahan form cukup dilakukan lewat konfigurasi dan rule, bukan bongkar ulang seluruh UI.

### 6.3 Spreadsheet sebagai storage operasional
Google Spreadsheet dipakai sebagai backend data operasional karena:
- mudah diadopsi
- familiar untuk tim program
- ringan untuk deployment
- mudah diaudit dan diverifikasi manual jika perlu

### 6.4 Auditability over cleverness
Setiap perubahan penting sebaiknya bisa:
- dilacak
- dicek sumbernya
- diverifikasi ulang
- diexport bila dibutuhkan

### 6.5 Graceful degradation
Jika layanan eksternal atau pipeline bermasalah, sistem tetap harus:
- menyimpan data kasus inti
- menyisakan jejak error/reason
- memungkinkan retry tanpa merusak data utama

---

## 7) Arsitektur Konseptual

### Lapisan aplikasi

#### A. Frontend
Berupa HTML + JavaScript client-side di Google Apps Script:
- `index.html`
- `login.html`
- `style.html`
- `app.js.html`
- `app.init.js.html`
- `app.foundation.js.html`
- `app.validation.js.html`
- `app.search.js.html`
- `app.submit.js.html`
- `app.dashboard.js.html`
- `app.draft.js.html`
- `app.geo.js.html`

Fungsi utama frontend:
- render field common + field diagnosis
- validasi input
- draft handling
- pencarian dan edit mode
- dashboard awal
- dukungan geolocation

#### B. Backend Apps Script
Fungsi server-side modular:
- `routes.js` → entry point, save orchestration, retry, pipeline
- `data.js` → CRUD kasus, pencarian, duplicate check, alias header
- `auth.js` → login/check/logout/change PIN
- `dashboard.js` → agregasi statistik dashboard
- `audit.js` → audit trail
- `config.js` → config manager via Script Properties
- `cache.js` → cache manager
- `utils.js` → helper umum
- `print.js` → render print/PDF
- `pipeline.queue.js` → async queue pipeline

#### C. Storage
Google Spreadsheet sebagai data store utama:
- `MR_Raw`
- `DIF_Raw`
- `PERT_Raw`
- `TN_Raw`
- `AFP_Raw`
- `REF_USER`
- `REF_FASKES`
- `REF_PENGAMPU`
- `REF_IMUN`
- `AUDIT_LOG`
- `PIPELINE_QUEUE` (jika mode async aktif)

#### D. Integrasi eksternal
- Email (`MailApp`)
- Telegram bot (`UrlFetchApp`)
- Sinkronisasi spreadsheet pengampu
- Print URL / dokumen PDF

---

## 8) Alur Proses Inti

### 8.1 Alur input kasus
1. Petugas login
2. Memilih diagnosis
3. Mengisi field common + field diagnosis
4. Frontend memvalidasi input
5. Payload dikirim ke `doPost`
6. Backend memvalidasi token sesi dan role
7. Data disimpan ke sheet diagnosis terkait
8. Sistem menghasilkan / memastikan **Nomor EPID**
9. Pipeline pasca-simpan dijalankan (sinkron / async)
10. Audit log dicatat

### 8.2 Alur pencarian dan edit
1. Pengguna mencari berdasarkan EPID / nama / filter lain
2. Sistem mengambil row terkait
3. Form di-hydrate ke mode edit
4. User memperbarui data
5. Sistem menyimpan perubahan dan audit

### 8.3 Alur pipeline pasca-simpan
Tergantung diagnosis dan konfigurasi, sistem dapat:
- kirim email
- kirim Telegram
- sinkronisasi ke sheet pengampu
- menandai status sukses/gagal
- menyimpan reason/fingerprint untuk idempotency

### 8.4 Mode pipeline
- **Sync** → dieksekusi langsung saat save
- **Async** → dimasukkan ke `PIPELINE_QUEUE`, diproses trigger berkala

Default yang lebih aman saat ini: **sync**, kecuali ada kebutuhan throughput/ketahanan tertentu.

---

## 9) Model Konfigurasi Form

Arsitektur form dibangun dari dua komponen:

### A. Common fields
Tersedia untuk semua diagnosis, misalnya:
- identitas pelapor
- identitas pasien
- lokasi wilayah
- EPID
- kontak orang tua/wali
- koordinat

### B. Diagnosis-specific sections
Setiap diagnosis punya blok field masing-masing untuk:
- klinis
- epidemiologis
- imunisasi
- spesimen
- kontak erat
- outcome

Keuntungan model ini:
- reusable
- konsisten
- scalable saat diagnosis bertambah atau form direvisi

---

## 10) Status Kapabilitas Saat Ini

### Yang sudah kuat / relatif matang
- input kasus multi-diagnosis
- struktur form berbasis konfigurasi
- login berbasis PIN
- pencarian dan edit kasus
- riwayat imunisasi berbasis tabel dinamis
- kontak erat berbasis tabel dinamis
- dashboard dasar
- audit log
- print MR
- pipeline pasca-simpan sinkron
- async queue mode (opsional)
- validasi numerik dan normalisasi field tertentu

### Yang sudah ada tapi masih perlu pendalaman
- duplicate detection
- role/access control
- monitoring pipeline
- kelengkapan validasi per diagnosis
- keamanan deployment web app

---

## 11) Gap Fungsional Utama

Dari pembandingan dengan form manual PE, terdapat gap penting antara form lapangan dan form input aplikasi saat ini.

### Ringkasan gap terbesar
1. **TN** → paling banyak field manual yang belum masuk
2. **AFP**
3. **PERT**
4. **DIF**
5. **MR**

### Tema gap utama
- field diagnosis yang belum lengkap
- detail imunisasi spesifik program yang belum eksplisit
- detail outcome dan rawat inap yang belum setara form manual
- beberapa field surveilans dan faktor risiko yang belum masuk
- beberapa blok masih terwakili parsial melalui tabel umum, belum sebagai field khusus

Dokumen detail gap tersedia di:
- `docs/FIELD-GAP-MATRIX.md`

---

## 12) Arah Pengembangan Produk

### Fase 1 — Menutup gap form manual
Fokus:
- menyamakan form input dengan form manual resmi
- menambah field yang masih belum ada
- memperjelas field yang masih parsial

### Fase 2 — Memperkuat validasi epidemiologis
Fokus:
- mandatory fields per diagnosis
- validasi lintas-field
- validasi logika klinis/epidemiologis dasar

### Fase 3 — Memperkuat monitoring operasional
Fokus:
- status pipeline
- retry dan failure handling
- dashboard monitoring operasional lintas diagnosis

### Fase 4 — Evolusi ke sistem surveilans yang lebih matang
Fokus:
- indikator mutu surveilans
- timeliness dan completeness
- duplicate scoring yang lebih cerdas
- cluster/alert detection
- analisis epidemiologis bertahap

---

## 13) Risiko dan Constraint

### Risiko teknis
- Perubahan schema harus kompatibel dengan sheet existing
- Mode async perlu trigger aktif agar queue tidak menumpuk
- Integrasi email/telegram/sinkronisasi dapat gagal intermiten
- Apps Script punya keterbatasan runtime dan quota

### Risiko operasional
- Form manual bisa berubah, sehingga config harus mudah direvisi
- Petugas lapangan memerlukan UI yang ringkas; field terlalu banyak dapat menurunkan kualitas input
- Data sensitif kesehatan perlu pengendalian akses yang lebih ketat

### Catatan keamanan
Saat ini manifest masih mengizinkan:
- `webapp.access = ANYONE_ANONYMOUS`

Walau aksi sensitif dibatasi token sesi internal, desain ini tetap perlu ditinjau berkala.

---

## 14) Definisi Sukses

Blueprint dianggap berhasil diwujudkan jika aplikasi:

1. Mampu menampung form PE PD3I secara lebih lengkap dan konsisten
2. Memudahkan petugas melakukan input, edit, cari, dan tindak lanjut kasus
3. Mengurangi duplikasi dan kehilangan informasi lapangan
4. Menyediakan monitoring operasional yang dapat dipakai pengelola program
5. Tetap cukup sederhana untuk dipelihara di ekosistem Apps Script + Spreadsheet

---

## 15) Dokumen Terkait

- `docs/ARCHITECTURE.md`
- `docs/MODULE-MAP.md`
- `docs/DEPLOYMENT.md`
- `docs/USER-FLOW.md`
- `docs/PROGRESS.md`
- `docs/NEXT-STEPS.md`
- `docs/PHASE3-VERIFICATION.md`
- `docs/BLUEPRINT-CONTINUATION.md`
- `docs/FIELD-GAP-MATRIX.md`

---

## 16) Catatan Penggunaan Dokumen Ini

- **`BLUEPRINT.md`** → dokumen utama level produk dan arah pengembangan
- **`BLUEPRINT-CONTINUATION.md`** → checkpoint resume kerja teknis jika sesi/pekerjaan terputus
- **`FIELD-GAP-MATRIX.md`** → daftar detail gap field manual vs form input

Dokumen ini sebaiknya diperbarui saat ada perubahan besar pada:
- ruang lingkup diagnosis
- model data
- arsitektur pipeline
- prioritas roadmap
- penutupan gap terhadap form manual
