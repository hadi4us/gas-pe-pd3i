# SIMPEL Surveilans — Rencana dan Baseline UI/UX Sigap

Tanggal: 2026-07-22
Status: baseline implementasi awal untuk deployment UI/UX terpisah

## Tujuan

Mengarahkan SIMPEL Surveilans menjadi sistem informasi kesehatan resmi yang presisi, jernih, klinis, dan tepercaya. Fokus awal bukan rebrand besar, tetapi perbaikan struktur visual, hierarki halaman, keterbacaan dashboard, dan pemindaian status kasus.

## Prinsip desain

1. Light mode menjadi default untuk kerja harian.
2. Dark mode dipending. Seluruh tema aplikasi diarahkan ke light mode dulu, termasuk dashboard statistik.
3. Maksimal dua lapis judul: breadcrumb dan judul halaman.
4. Hindari hero card bergradasi pada halaman operasional.
5. Angka KPI, tabel, dan indikator memakai font data/monospace dengan tabular numerals.
6. Metadata pill harus netral; warna hanya untuk status bermakna.
7. Merah hanya untuk alert/outbreak/kritis, bukan dekorasi.
8. Sidebar mengikuti mental model kerja: Beranda, Surveilans PD3I, Surveilans PIE, Administrasi, Panduan Aplikasi.
9. Menu tidak relevan disembunyikan berdasarkan role sejauh guard role tersedia.
10. Semua panel async harus memiliki loading/error/empty state.

## Token visual target

### Light mode

- Background: `#F8FAFC`
- Surface/card: `#FFFFFF`
- Border: `#E2E8F0`
- Text utama: `#0F172A`
- Text sekunder: `#475569`
- Aksen utama: teal `#0D9488`

### Status

- Success/terkonfirmasi: `#059669`
- Warning/pending/suspek: `#D97706`
- Info/investigasi/proses: `#2563EB`
- Muted/discarded/ditolak: `#64748B`
- Danger/outbreak/kritis: `#DC2626`

## Perubahan yang diimplementasikan pada baseline UI/UX

### 1. Sidebar information architecture

- Menghapus header `Navigasi Cepat` karena hanya berisi `Beranda`.
- `Beranda` tampil sebagai item tunggal langsung di bawah brand.
- Grup `Surveilans PD3I` memuat alur PD3I dan reporting:
  - Dasbor PD3I
  - Daftar Kasus
  - Input Kasus
  - Verifikasi EPID
  - Pemeriksaan Laboratorium
  - Status dan Klasifikasi
  - Input Reporting
  - Dasbor Reporting
- Grup PIE diganti dari `Kewaspadaan Dini` menjadi `Surveilans PIE`.
- Grup `Lainnya` dipisah menjadi:
  - `Administrasi`: Approval Permohonan Akun, Konfigurasi Sistem, Kelola Pengguna
  - `Panduan Aplikasi`: item mandiri.
- Menu dan grup kosong disembunyikan sesuai workspace yang diizinkan role.

### 2. Hierarki halaman

- Eyebrow/label kecil global disembunyikan agar halaman tidak bertumpuk judul.
- Hero Beranda dihilangkan sebagai kartu dekoratif; konten difokuskan ke judul, subjudul faktual, KPI, dan prioritas kerja.
- Card utama memakai permukaan putih, border tipis, shadow ringan.

### 3. Beranda/KPI

- KPI memakai bobot visual sesuai makna:
  - netral untuk total/cakupan
  - success untuk terverifikasi
  - warning untuk antrean verifikasi/revisi
  - info untuk antrean lab/status
- Angka KPI memakai font data/monospace dengan tabular numerals.
- Loading/error/empty state yang sudah ada tetap dipertahankan.

### 4. Daftar Kasus

- Metadata pill seperti ID, tanggal lahir, dan wilayah dipaksa netral abu-abu.
- Status pill diberi tone sesuai makna:
  - success: terverifikasi/konfirmasi/selesai
  - warning: pending/default
  - info: proses/investigasi/menunggu hasil/sampel
  - muted: ditolak/discarded/bukan kasus
  - danger: alert/outbreak/KLB/kritis
- Search/filter dan pagination existing tetap dipertahankan.

### 5. Brand dan shell

- Brand icon sidebar dibuat solid teal, tanpa gradient/glow consumer-style.
- Sidebar memakai slate solid agar terasa lebih institusional.
- Konten dibatasi `max-width` agar tidak melebar penuh di layar besar.

## Deployment map

Tiga link dipertahankan sebagai jalur kerja:

1. Production
   - URL stabil production.
   - Dipakai pengguna riil.
   - Tidak diubah oleh pekerjaan UI/UX ini.

2. Deployment inti / Development
   - URL development inti yang selama ini dipakai untuk bugfix PD3I.
   - Tetap tersedia sebagai jalur validasi fitur inti.

3. Deployment UI/UX
   - Link baru khusus validasi redesign UI/UX.
   - Dibuat dari versi Apps Script baru.
   - Tujuan: MasBro bisa membandingkan UI/UX tanpa mengganggu production maupun development inti.

## Rencana lanjutan setelah baseline

### Fase berikutnya: Beranda penuh

- Tambah panel outbreak yang hanya muncul saat threshold wilayah terlampaui.
- Tambah tren kasus PD3I vs PIE.
- Tambah sebaran wilayah dengan status pill.
- Tambah log aktivitas terbaru.

### Fase berikutnya: Daftar Kasus penuh

- Pecah card/tabel desktop vs mobile dengan hirarki informasi lebih ketat.
- Buat aksi utama lebih kontekstual per role.
- Tambah filter status yang lebih mudah dipindai.

### Fase berikutnya: Form input/edit

- Ringkas instruksi panjang.
- Konsolidasikan section form menjadi kelompok klinis.
- Review sebelum simpan tetap sebagai panel validasi, bukan dialog berat.

### Fase berikutnya: Light mode command dashboard

- Prioritas: Beranda, Dasbor PD3I, Dasbor PIE.
- Dark mode memakai background slate, grid halus, panel teknikal, border tipis, emerald accent.

## Validasi wajib sebelum promosi

- `npm test`
- Cek login dan session restore.
- Cek role admin, petugas puskesmas, lab/verifikator jika akun tersedia.
- Cek Beranda KPI tetap sesuai sheet.
- Cek Daftar Kasus mobile dan desktop.
- Cek edit kasus tidak kembali ke Beranda.
- Cek wilayah hydrate pada edit.
- Cek review sebelum simpan toggle tetap menampilkan detail.

## Iterasi fase 2 — Daftar Kasus clinical list (`@1220`)

Perubahan diterapkan ke deployment UI/UX khusus:

- Hierarki halaman Daftar Kasus dipadatkan: eyebrow non-informatif dihapus.
- Judul toolbar disederhanakan menjadi `Filter kasus`.
- Panduan tiga langkah disembunyikan dari tampilan utama agar halaman langsung fokus ke filter dan data.
- Header hasil berubah dari copy teknis `record` menjadi bahasa operasional `kasus`.
- Kartu hasil dibuat lebih klinis:
  - nama pasien sebagai fokus utama,
  - EPID/ID sebagai subline monospace,
  - metadata demografis dan wilayah tetap netral,
  - status kasus/verifikasi/sampel tetap semantic-pill,
  - alamat dibatasi dua baris,
  - aksi utama ditata sebagai kolom kanan stabil di desktop dan full-width di mobile.
- Test diperbarui untuk terminologi `kasus`.

Validasi sebelum deploy:

- `npm test`: 188/188 lulus.
- hygiene check: lulus.
- endpoint security check: lulus.

Deployment:

- UI/UX URL tetap: `https://script.google.com/macros/s/AKfycbzVgu6dp9t0AvXPv_U6ISfJciBT6YE5GvxoCe0i2xq30tQQaq0fIYdnlm_-H1Z9e5kn9A/exec`
- Version: `@1220`

## Iterasi fase 3 — Form Input/Edit clinical readability (`@1221`)

Perubahan diterapkan ke deployment UI/UX khusus:

- Kartu pengantar formulir yang panjang disembunyikan dari tampilan utama agar form langsung fokus ke blok data.
- Section form dibuat lebih klinis dan stabil:
  - border netral,
  - shadow ringan,
  - header section lebih jelas,
  - icon memakai biru resmi, bukan dekorasi ramai.
- Grid field dibuat adaptif `auto-fit` dengan minimum 240px supaya desktop/tablet/mobile tidak terlalu rapat.
- Field card mendapat state fokus yang jelas tanpa warna berlebihan.
- Input/select/textarea diseragamkan radius, border, dan tinggi minimal.
- Action panel dibuat lebih tenang: catatan simpan jadi panel netral, tombol tetap jelas.
- Review sebelum simpan diberi surface netral agar menyatu dengan form.

Validasi sebelum deploy:

- `npm test`: 188/188 lulus.
- hygiene check: lulus.
- endpoint security check: lulus.

Deployment:

- UI/UX URL tetap: `https://script.google.com/macros/s/AKfycbzVgu6dp9t0AvXPv_U6ISfJciBT6YE5GvxoCe0i2xq30tQQaq0fIYdnlm_-H1Z9e5kn9A/exec`
- Version: `@1221`

## Iterasi fase 4 — Dashboard statistik epidemiologis (`@1222`)

Deployment UI/UX khusus tetap memakai URL:

https://script.google.com/macros/s/AKfycbzVgu6dp9t0AvXPv_U6ISfJciBT6YE5GvxoCe0i2xq30tQQaq0fIYdnlm_-H1Z9e5kn9A/exec

Perubahan fase 4:

- Header dashboard dipadatkan menjadi `Analisis surveilans PD3I`.
- Copy dashboard diarahkan ke kurva epidemiologi, sebaran wilayah, kelompok umur, dan prioritas tindak lanjut.
- Filter toolbar dibuat lebih klinis: `Filter surveilans`, `Diagnosis dan tahun analisis`.
- State awal diganti ke terminologi diagnosis/tahun, bukan DX teknis.
- Panel KPI, chart, peta hotspot, tabel wilayah, dan distribusi usia dibuat lebih resmi dengan border netral, radius token, dan shadow ringan.
- Angka KPI/tabel memakai numeric tabular/monospace agar mudah dipindai.
- Status chip dan legend memakai token radius, menjaga audit UI tetap lulus.
- Responsive dashboard diperbaiki:
  - desktop: KPI tidak terlalu rapat
  - tablet: KPI 2–3 kolom
  - mobile: KPI 1 kolom, peta/chart lebih terbaca, bar distribusi usia tidak gepeng.

Validasi fase 4:

- `npm test`: 188/188 lulus
- `check:hygiene`: lulus
- `check:endpoints`: lulus

Catatan: fase 4 hanya dideploy ke deployment UI/UX khusus, bukan Production dan bukan Development/core.

## Iterasi fase 5 — Panduan Aplikasi (`@1223`)

Deployment UI/UX khusus tetap memakai URL:

https://script.google.com/macros/s/AKfycbzVgu6dp9t0AvXPv_U6ISfJciBT6YE5GvxoCe0i2xq30tQQaq0fIYdnlm_-H1Z9e5kn9A/exec

Perubahan fase 5:

- Panduan Aplikasi dipadatkan dari halaman instruksi panjang menjadi help center operasional.
- Judul menjadi `Panduan kerja SIMPEL Surveilans`.
- Ditambah 3 kartu ringkasan: kasus baru, data lama, pemantauan.
- Alur kasus dibuat lebih jelas: Input Kasus → Verifikasi EPID → Hasil Pemeriksaan → Status dan Klasifikasi → Daftar Kasus.
- Hak akses diringkas untuk Admin, Petugas, Viewer, dan Super-admin.
- Setiap menu punya kartu ringkas dengan langkah kerja pendek.
- Visual dibuat konsisten dengan UI/UX baseline: panel putih, border netral, radius token, shadow ringan, grid 2 kolom desktop dan 1 kolom mobile.

Validasi fase 5:

- `npm test`: 188/188 lulus
- `check:hygiene`: lulus
- `check:endpoints`: lulus

Catatan: fase 5 hanya dideploy ke deployment UI/UX khusus, bukan Production dan bukan Development/core.

## Iterasi fase 6 — Panduan Aplikasi quick-reference (`@1224`)

Deployment UI/UX khusus tetap memakai URL:

https://script.google.com/macros/s/AKfycbzVgu6dp9t0AvXPv_U6ISfJciBT6YE5GvxoCe0i2xq30tQQaq0fIYdnlm_-H1Z9e5kn9A/exec

Perubahan fase 6 berdasarkan screenshot MasBro:

- Panduan Aplikasi dipoles dari kartu dokumentasi menjadi quick-reference operasional.
- Tiga kartu ringkasan diberi ikon kecil dan highlight aksi utama:
  - `Input Kasus`
  - `Daftar Kasus`
  - `Dashboard statistik`
- Kartu `Urutan kerja kasus PD3I` dibuat lebih compact menjadi flow 5 langkah.
- Copy ringkasan dipendekkan agar halaman lebih cepat dipindai.
- Kartu panduan menu diberi ikon kecil di judul untuk orientasi cepat.
- Responsive flow:
  - desktop 5 langkah horizontal
  - tablet 3 kolom
  - mobile 1 kolom
- CSS tetap memakai design token agar audit spacing/radius lulus.

Validasi fase 6:

- `npm test`: 188/188 lulus
- `check:hygiene`: lulus
- `check:endpoints`: lulus

Catatan: fase 6 hanya dideploy ke deployment UI/UX khusus, bukan Production dan bukan Development/core.

## Iterasi fase 7 — Administrasi secure operations console (`@1225`)

Deployment UI/UX khusus tetap memakai URL:

https://script.google.com/macros/s/AKfycbzVgu6dp9t0AvXPv_U6ISfJciBT6YE5GvxoCe0i2xq30tQQaq0fIYdnlm_-H1Z9e5kn9A/exec

Perubahan fase 7:

- Administrasi dipoles sebagai konsol operasi sensitif, bukan halaman admin template.
- Status strip super-admin dibuat lebih tegas dengan tone peringatan resmi.
- Panel konfigurasi, approval akun, form pengguna, dan tabel dibuat konsisten:
  - surface putih
  - border netral
  - radius token
  - shadow ringan
- Statistik approval akun memakai angka tabular/monospace.
- Status permohonan memakai warna semantik:
  - pending = warning
  - approved = success
  - rejected = danger
- Tabel approval dan tabel pengguna dibuat lebih resmi dengan header uppercase ringan.
- Modal review akun dibuat selaras dengan token border/radius.
- Mobile spacing panel administrasi dirapikan.

Validasi fase 7:

- `npm test`: 188/188 lulus
- `check:hygiene`: lulus
- `check:endpoints`: lulus

Catatan: fase 7 hanya dideploy ke deployment UI/UX khusus, bukan Production dan bukan Development/core.

## Iterasi fase 8 — Login official access gateway (`@1226`)

Deployment UI/UX khusus tetap memakai URL:

https://script.google.com/macros/s/AKfycbzVgu6dp9t0AvXPv_U6ISfJciBT6YE5GvxoCe0i2xq30tQQaq0fIYdnlm_-H1Z9e5kn9A/exec

Perubahan fase 8:

- Login dipoles sebagai gerbang akses resmi, bukan kartu SaaS/consumer.
- Background login dibuat lebih tenang dan institusional.
- Login card memakai surface putih, border netral, radius token, dan shadow ringan.
- Accent bar dikurangi supaya tetap resmi.
- Ikon/mark login diselaraskan dengan token warna SIMPEL.
- Input, fokus, tombol OTP, dan tombol permohonan akun baru memakai token desain yang sama dengan aplikasi utama.
- Disclaimer login dibuat sebagai panel informasi resmi yang lebih terbaca.
- Modal permohonan akun diselaraskan:
  - shell resmi
  - guide panel klinis-institusional
  - routing notice/info access/Telegram info memakai tone semantik
  - mobile steps lebih mudah dipindai satu kolom.

Validasi fase 8:

- `npm test`: 188/188 lulus
- `check:hygiene`: lulus
- `check:endpoints`: lulus

Catatan: fase 8 hanya dideploy ke deployment UI/UX khusus, bukan Production dan bukan Development/core.

## Iterasi fase 9 — Workflow queue surveillance workbench (`@1227`)

Deployment UI/UX khusus tetap memakai URL:

https://script.google.com/macros/s/AKfycbzVgu6dp9t0AvXPv_U6ISfJciBT6YE5GvxoCe0i2xq30tQQaq0fIYdnlm_-H1Z9e5kn9A/exec

Perubahan fase 9:

- Workflow queue untuk Verifikasi EPID, Pemeriksaan Laboratorium, dan Status/Klasifikasi dipoles sebagai meja kerja surveilans.
- Label `Inbox workflow` diganti menjadi `Meja kerja surveilans`.
- Container queue dibuat putih, border netral, radius token, dan shadow ringan.
- Queue card, toolbar, table header, row title, status, pagination, dan action button diselaraskan dengan token UI/UX blueprint.
- Row queue diberi strip status semantik.
- Status pill memakai tone semantik dan metadata tetap netral.
- Tombol aksi utama minimal 40px agar aman untuk mobile/touch.
- Pagination copy diterjemahkan ke Bahasa Indonesia.
- Mobile queue dibuat lebih mudah dipindai dan tombol aksi memenuhi lebar layar.

Validasi fase 9:

- `npm test`: 188/188 lulus
- `check:hygiene`: lulus
- `check:endpoints`: lulus

Catatan: fase 9 hanya dideploy ke deployment UI/UX khusus, bukan Production dan bukan Development/core.


## Iterasi fase 10 — Detail kasus operational case profile (`@1228`)

Deployment UI/UX khusus tetap memakai URL:

https://script.google.com/macros/s/AKfycbzVgu6dp9t0AvXPv_U6ISfJciBT6YE5GvxoCe0i2xq30tQQaq0fIYdnlm_-H1Z9e5kn9A/exec

Perubahan fase 10:

- Panel ringkasan kasus diposisikan sebagai profil operasional/detail kasus aktif.
- Copy edit mode diperjelas: `Detail kasus aktif untuk tinjauan, koreksi, dan aksi lanjutan`.
- Header panel berubah menjadi `Detail kasus` / `Ringkasan operasional`.
- Panel workflow berubah menjadi `Timeline status` / `Alur kasus aktif`.
- Ringkasan kasus memakai surface putih, border netral, radius token, dan angka tabular.
- Item ringkasan dibuat grid 2 kolom desktop dan 1 kolom mobile.
- Status workflow tampil sebagai timeline ringkas dengan status pill netral/semantik, bukan gradient dekoratif.
- Tombol kembali ke daftar kasus tetap minimal 40px.

Validasi fase 10:

- `npm test`: 189/189 lulus
- `check:hygiene`: lulus
- `check:endpoints`: lulus

Catatan: fase 10 hanya dideploy ke deployment UI/UX khusus, bukan Production dan bukan Development/core.

## Iterasi fase 11 — Dashboard statistik epidemiology command panel (`@1229`)

Deployment UI/UX khusus tetap memakai URL:

https://script.google.com/macros/s/AKfycbzVgu6dp9t0AvXPv_U6ISfJciBT6YE5GvxoCe0i2xq30tQQaq0fIYdnlm_-H1Z9e5kn9A/exec

Perubahan fase 11:

- Dashboard statistik dipoles ulang sebagai panel komando epidemiologi.
- KPI strip dibuat lebih operasional dengan metrik kasus/laporan, suspek baru, suspek aktif, konfirmasi, sembuh, dan meninggal.
- Copy dashboard dirapikan ke bahasa resmi dan ringkas.
- Tone dekoratif rose/violet dihindari untuk elemen rutin.
- Notifikasi dan antrean tindak lanjut memakai warning/amber, bukan merah dekoratif.
- Panel peta, kurva, antrean verifikasi, distribusi kecamatan, dan distribusi usia diperkuat dengan border netral, card putih, radius token, dan shadow ringan.
- Angka KPI, tabel, bulan, dan chip status memakai tabular numerals.
- Scope dashboard menyesuaikan konteks faskes pelapor atau puskesmas pengampu bila tersedia.

Validasi fase 11:

- `npm test`: 190/190 lulus
- `check:hygiene`: lulus
- `check:endpoints`: lulus

Catatan: fase 11 hanya dideploy ke deployment UI/UX khusus, bukan Production dan bukan Development/core.

## Iterasi fase 12 — Daftar Kasus operational registry refinement (@1230)

Surface: Daftar Kasus / ruang pencarian kasus.

Perubahan UI/UX:
- Header hasil pencarian menjadi ringkasan registri operasional: total kasus, halaman aktif, dan aksi workflow.
- Empty state memakai istilah `kasus`, bukan `record`.
- Subtitle hasil pencarian dipadatkan: daftar sesuai filter, hak akses, dan urutan terbaru.
- Label aksi utama diganti menjadi `Tindak lanjut`.
- Link PDF memakai copy `Dokumen PE` agar terasa resmi.
- Metadata non-status tetap netral; status pill tetap semantik.
- Nomor urut, diagnosis, dan ringkasan numerik memakai tabular nums.
- Fokus keyboard pada kartu kasus dibuat terlihat.
- Mobile menyederhanakan leading index agar kartu lebih hemat ruang.

Guardrail:
- ID dan selector pencarian dipertahankan.
- Production dan Development inti tidak disentuh.

## UI/UX Form wizard guided clinical entry refinement — @1231

Surface: Input Kasus and Form Input/Edit.

Changes:
- Form stepper now reads as operational case workflow, not generic wizard.
- Input Kasus introduction and lifecycle copy clarify that initial entry is separated from later verification/lab/status work.
- Save controls use `Review dan simpan` language and shorter official button copy.
- Stepper cards use neutral surfaces, semantic active state, tabular step indexes, and responsive density.
- Submit review panel keeps neutral/warning/error state discipline.

Deployment target: dedicated UI/UX deployment only.
Production and Development/core were not touched.

## UI/UX Administrasi secure operations refinement — @1232

Surface: Administrasi, Konfigurasi Sistem, Kelola Pengguna, Approval Permohonan Akun.

Changes:
- Added operational summary for access, integrations, and sensitive operations.
- Refined copy toward official secure console language.
- Warning tone reserved for sensitive operations; no decorative red.
- Buttons meet 40px touch target discipline.
- User/access numbers use tabular numeric styling.

Deployment target: dedicated UI/UX deployment only.
Production and Development/core were not touched.

## UI/UX Zero Reporting weekly surveillance reporting refinement — @1233

Surface: Zero Reporting form / laporan nihil mingguan.

Changes:
- Added three-part operational summary: period, case/nihil choice, immediate reporting.
- Refined visible copy to official Indonesian sentence case.
- Warning tone reserved for urgent reporting instruction.
- Disease cards use calmer neutral header and official surfaces.
- Submit action strengthened to 44px touch target.
- Numeric/date fields use tabular numeric discipline.

Deployment target: dedicated UI/UX deployment only.
Production and Development/core were not touched.

## UI/UX SARING-PIE dashboard epidemiology command refinement — @1234

Surface: SARING-PIE dashboard / situasi PIE.

Changes:
- Hero reframed as epidemiology command panel.
- Added priority strip for active notifications, delayed tasks, and E3/EX risk.
- Export actions use Indonesian official copy.
- Overdue task KPI changed to warning tone, not rose/red.
- KPI numbers use official data font and tabular numerals.
- Responsive priority strip stacks on smaller screens.

Deployment target: dedicated UI/UX deployment only.
Production and Development/core were not touched.

## UI/UX Dashboard statistik situation summary refinement — @1235

Surface: Dashboard statistik / Dasbor PD3I.

Changes:
- Added situation summary strip above KPI grid.
- Summary cards cover active cases, work queue, and workflow completeness.
- Work queue pressure uses warning tone; red remains reserved for outbreak/KLB/critical only.
- Dashboard labels normalized to official Indonesian copy.
- Summary numerics use data font and tabular numerals.
- Strip stacks on smaller screens.

Deployment target: dedicated UI/UX deployment only.
Production and Development/core were not touched.

## UI/UX Dashboard statistik light command dashboard foundation — @1236

Surface: Dashboard statistik / Dasbor PD3I.

Changes:
- Dashboard uses a light command-dashboard foundation; dark mode is pending.
- Added `Light mode` chip and dashboard-scoped light shell class.
- Panels use slate background, thin neutral borders, and restrained shadows.
- Data accents use cyan/teal; routine pending work stays amber warning.
- Red remains reserved for outbreak/KLB/critical only.
- Dashboard selectors and behavior preserved.

Deployment target: dedicated UI/UX deployment only.
Production and Development/core were not touched.

## UI/UX Workflow forms operational stage strip — @1237

Surface: Verifikasi EPID, Pemeriksaan Laboratorium, Status dan Klasifikasi.

Changes:
- Added compact operational stage strip above dense workflow forms.
- Verifikasi: Review kasus → Keputusan EPID → Arahkan antrean.
- Laboratorium: Review ringkasan → Input hasil → Kirim status.
- Status/Klasifikasi: Review konteks → Tentukan status → Tutup tindak lanjut.
- Current stage uses info tone; routine workflow avoids red.
- Stage strip stacks to one column on mobile.
- Existing IDs, submit handlers, and generated field containers preserved.

Deployment target: dedicated UI/UX deployment only.
Production and Development/core were not touched.

## UI/UX Panduan Aplikasi searchable FAQ foundation — @1238

Surface: Panduan Aplikasi.

Changes:
- Added `Cari panduan cepat` panel above guide cards.
- Added accessible search field with placeholder `Contoh: verifikasi EPID`.
- Search copy states filter is local visual foundation and does not change app data.
- Added topic chips for Input kasus, Verifikasi EPID, Laboratorium, Status, and Dashboard.
- Target guide cards show visible focus state after chip navigation.
- FAQ panel stacks to one column on mobile.

Deployment target: dedicated UI/UX deployment only.
Production and Development/core were not touched.

## UI/UX Login OTP access stage refinement — @1239

Surface: Login / gerbang akses resmi.

Perubahan:
- Login menampilkan strip tahap akses sebelum OTP: `Email dinas`, `Verifikasi OTP`, `Akses sesuai peran`.
- Tambah panel kepercayaan ringkas: akses resmi, sesi berbasis peran, data medis rahasia.
- Tone tetap resmi/klinis dengan slate/teal netral; merah tidak dipakai sebagai dekorasi.
- Struktur form dan ID login/OTP dipertahankan agar handler Apps Script tetap aman.

Validasi:
- `npm test`: `200/200`.
- Hygiene check lulus.
- Endpoint security check lulus.

## UI/UX Login account request official compact refinement — @1240

Surface: Login / permohonan akun.

Perubahan:
- Permohonan akun mendapat strip tahap akses resmi: `Identitas`, `Unit kerja`, `Persetujuan`.
- Panel ringkasan form ditambahkan sebelum field: email aktif, unit/faskes resmi, role ditetapkan admin.
- Copy diperketat: permohonan diverifikasi administrator sebelum akses aktif.
- ID modal, field faskes/wilayah, consent, dan submit handler dipertahankan.
- Tone tetap resmi/klinis; merah hanya untuk wajib/error, bukan dekorasi.

Validasi:
- `npm test`: `201/201`.
- Hygiene check lulus.
- Endpoint security check lulus.

## UI/UX Beranda operational situation strip — @1241

Beranda gains an operational situation strip between KPI cards and focus cards. It shows coverage, workflow workload, and verification completeness using existing data. Routine queue pressure stays amber; red remains reserved for KLB/outbreak/critical signals. Mobile layout stacks cleanly.

## UI/UX Dashboard statistik verification status panel — @1242

Dashboard statistik gains a verification status panel between situation summary and KPI cards. The panel makes verification completeness, pending EPID, revision, and lab queue visible before charts. It uses existing counts, semantic tones, tabular numerics, light-mode compatibility, and mobile stacking.

## UI/UX Daftar Kasus search readiness strip — @1243

Daftar Kasus now shows a compact readiness strip before filters. It guides users to search by case identity, narrow by wilayah, and decide next work from case/verification status. Existing search controls and JS handlers remain unchanged.

## UI/UX Form wizard input readiness strip — @1244

Input Kasus now includes a compact readiness strip before dense form sections. It helps users confirm pelapor, patient identity, clinical data, and review/save expectations while preserving all dynamic form IDs and save behavior.

## UI/UX Administrasi secure guardrail strip — @1245

Administrasi now includes a compact guardrail strip before dense settings panels. It reminds admins to verify access, audit changes, test configuration, and treat setup/rule/super-admin operations as restricted. Existing panel IDs and handlers remain unchanged.

## UI/UX Detail kasus role-aware next action panel — @1246

Deployment target: dedicated UI/UX deployment only.
UI/UX URL tetap:
https://script.google.com/macros/s/AKfycbzVgu6dp9t0AvXPv_U6ISfJciBT6YE5GvxoCe0i2xq30tQQaq0fIYdnlm_-H1Z9e5kn9A/exec

Perubahan:

- Added role-aware next action panel in detail-case sidebar.
- Shows `Aksi berikutnya`, `Keputusan aman`, priority, active role/capability, and workflow target.
- Copy adapts for viewer, validation blocker, verified case, edit review, and new input states.
- Preserved existing detail summary and workflow timeline IDs/handlers.
- Styling scoped to `.pd3i-next-action-*` with neutral/info operational tone.

Validation:

- `npm test` passed `206/206`.
- Project hygiene passed.
- Endpoint security check passed.


## UI/UX Login reduce decorative eyebrow density — @1247

Deployment target: dedicated UI/UX deployment only.
UI/UX URL tetap:
https://script.google.com/macros/s/AKfycbzVgu6dp9t0AvXPv_U6ISfJciBT6YE5GvxoCe0i2xq30tQQaq0fIYdnlm_-H1Z9e5kn9A/exec

Perubahan:

- Removed visible uppercase kicker/eyebrow above `Akses SIMPEL`.
- Merged SIMPEL identity into subtitle below main title.
- Replaced three trust chips with one compact footer line.
- Kept OTP flow, stage strip, account request flow, and auth IDs unchanged.

Validation:

- `npm test` passed `207/207`.
- Project hygiene passed.
- Endpoint security check passed.


## UI/UX Workflow queues operational workbench clarity — @1248

Deployment target: dedicated UI/UX deployment only.
UI/UX URL tetap:
https://script.google.com/macros/s/AKfycbzVgu6dp9t0AvXPv_U6ISfJciBT6YE5GvxoCe0i2xq30tQQaq0fIYdnlm_-H1Z9e5kn9A/exec

Perubahan:

- Queue Verifikasi EPID, Pemeriksaan Laboratorium, dan Status/Klasifikasi kini menampilkan umur antrean per kasus bila timestamp tersedia.
- Setiap baris antrean menampilkan arahan aksi berikutnya sesuai workspace/peran kerja.
- Eyebrow dekoratif di workflow inbox disembunyikan agar header lebih bersih.
- Pagination, empty state, dan tombol buka kasus tetap dipertahankan.

Validation:

- `npm test` passed `208/208`.
- Project hygiene passed.
- Endpoint security check passed.


## UI/UX Panduan role-specific steps — @1249

Deployment target: dedicated UI/UX deployment only.
UI/UX URL tetap:
https://script.google.com/macros/s/AKfycbzVgu6dp9t0AvXPv_U6ISfJciBT6YE5GvxoCe0i2xq30tQQaq0fIYdnlm_-H1Z9e5kn9A/exec

Perubahan:

- Panduan Aplikasi menambahkan langkah cepat sesuai peran: petugas faskes/puskesmas, admin/verifikator EPID, laboratorium, dan pengelola status.
- Eyebrow dekoratif pada kartu panduan disapu agar halaman tidak terasa penuh label kecil.
- Search panduan, chip topik, dan anchor topik tetap dipertahankan.

Validation:

- `npm test` passed `209/209`.
- Project hygiene passed.
- Endpoint security check passed.


## UI/UX Login OTP CTA contrast — @1250

Deployment target: dedicated UI/UX deployment only.
UI/UX URL tetap:
https://script.google.com/macros/s/AKfycbzVgu6dp9t0AvXPv_U6ISfJciBT6YE5GvxoCe0i2xq30tQQaq0fIYdnlm_-H1Z9e5kn9A/exec

Perubahan:

- Tombol `Kirim OTP` diberi override kontras khusus agar teks dan ikon tetap putih saat tombol aktif.
- Disabled state tombol tetap terbaca dengan warna abu gelap.
- Flow OTP, permohonan akun, dan handler login tidak berubah.

Validation:

- `npm test` passed `210/210`.
- Project hygiene passed.
- Endpoint security check passed.
