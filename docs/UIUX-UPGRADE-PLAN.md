# Rencana Upgrade UI/UX Dashboard & Layout - Medis Modern (SIMPEL Kota Depok)

Dokumen ini memuat rencana kerja terstruktur untuk meningkatkan visualisasi, struktur tata letak (grid), kegunaan, dan skema warna aplikasi **SIMPEL Kota Depok** agar menyatu sempurna dalam Google Sites dengan gaya **Medis Modern**.

---

## 1. Analisis Desain Referensi vs Kondisi Saat Ini

Berdasarkan analisis tangkapan layar dashboard referensi, berikut adalah perbandingan elemen desain yang akan diadopsi:

| Elemen Desain | Desain Referensi | Kondisi Saat Ini (Legacy) | Target Migrasi |
| :--- | :--- | :--- | :--- |
| **Warna Dominan** | Deep Navy Gradient (Sidebar), Soft Slate (Background), Blue/Emerald/Amber/Rose (KPI) | Teal (`#0f5f5a`, `#147d73`), White, Soft Gray | Menggunakan **Deep Navy Medis** (`#0f172a` ke `#162447`), warna kartu metrik modern, dan latar belakang slate muda (`#f8fafc`). |
| **Tata Letak (Grid)** | Flex Row (Sidebar kiri `260px` + Content area fleksibel `flex-1`). Grid 5-kolom KPI, Grid 12-kolom charts/peta/alerts. | Grid Bootstrap 5 + layout buatan sendiri di `style.html`. | Memperkuat integrasi CSS custom dengan utility-class Tailwind CSS untuk tata letak yang presisi dan responsif. |
| **Kartu Metrik (KPI)** | 5 kartu metrik dengan ikon bulat berwarna pastel-soft, angka tebal, persentase tren naik/turun di kanan bawah. | 4 kartu metrik standar (biru, rose, amber, emerald). | Menambah metrik kasus baru dan menyamakan tone dengan referensi. |
| **Visualisasi Tren** | Line chart multi-series (Kasus Baru, Sembuh, Meninggal) dengan legenda terintegrasi. | Area chart bulanan Google Charts. | Peningkatan visualisasi Chart.js / Google Charts area dengan grid line yang lebih tenang dan tooltip yang bersih. |
| **Peta Sebaran** | Peta choropleth Indonesia / Kota Depok dengan legenda titik kasus di kiri bawah. | Leaflet map dengan custom marker lingkaran. | Memoles tampilan Leaflet map agar sesuai dengan warna dasar peta (menggunakan ubin yang lebih bersih) dan meletakkan legenda terstruktur. |
| **Kelompok Umur** | Donut chart demografi dengan total kasus di tengah lubang donat. | Pie chart standar dari Google Charts. | Mengubah pie chart menjadi **Donut Chart** dengan counter total kasus di tengahnya. |

---

## 2. Struktur Layout Baru (Grid Utama)

Dashboard akan didefinisikan menggunakan struktur grid modular agar pas saat di-embed di Google Sites:

1. **Sidebar Kiri (`w-[260px] h-screen fixed`)**:
   - Skema gradien: `from-blue-900 to-blue-800`
   - Berisi logo Puskesmas/SIMPEL, navigasi per kategori (Navigasi Cepat, Surveilans PD3I, Pelaporan Rutin, Kewaspadaan Dini, Pengaturan)
   - Informasi profil pengguna aktif di bagian bawah.
2. **Main Content (`ml-[260px] p-6 bg-slate-50`)**:
   - **Header**: Judul dashboard, tombol filter tanggal aktif, filter wilayah, tombol perbarui data (Link biru).
   - **Row 1 (Metrik Utama)**: 5 kolom card (Total Kasus, Kasus Baru, Kasus Aktif, Sembuh, Meninggal).
   - **Row 2 (Analisis Waktu & Tempat)**: 
     - 4-kolom: Line Chart Tren Kasus.
     - 4-kolom: Peta Sebaran Kasus.
     - 4-kolom: Panel Alerts Terbaru (Kewaspadaan Dini).
   - **Row 3 (Analisis Orang & Wilayah)**:
     - 8-kolom: Tabel Kasus Tertinggi (5 Penyakit/Wilayah Teratas).
     - 4-kolom: Donut Chart Kelompok Umur (Epidemiologis).

---

## 3. Rencana Kerja Multi-Tahap (Phased Roadmap)

Agar proses upgrade berjalan aman tanpa merusak fungsionalitas yang ada (terutama logic penyimpanan dan otorisasi), pekerjaan dibagi menjadi 4 tahap:

### Tahap 1: Pengayaan Aset & Penyelarasan Layout Dasar (UI Shell) [SELESAI]
* **Tujuan**: Membawa CDN Tailwind CSS secara aman dan mengonfigurasi skema warna utama (biru medis) tanpa tabrakan dengan utility Bootstrap 5 yang sudah ada.
* **Langkah**:
  1. Tambahkan link CDN Tailwind CSS di `index.html`. [SELESAI]
  2. Perbarui `style.html` untuk menambahkan class palette baru berbasis CSS Variables (biru medis, soft slate background). [SELESAI]
  3. Sesuaikan visual sidebar kiri agar memiliki gradien deep-blue yang modern dan teks kontras tinggi. [SELESAI]
* **Uji**: Sidebar ter-render dengan gradien baru dan menu terlihat jelas di Google Sites.

### Tahap 2: Peningkatan Grid Kartu KPI & Filter Analitik [SELESAI]
* **Tujuan**: Merestrukturisasi barisan metrik dari 4 kartu menjadi 5 kartu seperti referensi visual (menambahkan metrik Kasus Baru/Aktif yang dinamis).
* **Langkah**:
  1. Perbarui HTML di `workspace_dashboard.html` untuk menambahkan layout 5 kolom. [SELESAI]
  2. Perbaiki fungsi `renderDashboard` di `app.dashboard.js.html` untuk mengisi 5 data metrik tersebut (menggunakan data dari `getDashboardStats`). [SELESAI]
  3. Percantik styling kartu: tambahkan ikon bulat berwarna pastel soft, angka tebal (`font-black`), dan sub-text keterangan. [SELESAI]
* **Uji**: Kartu metrik menampilkan angka yang akurat dan responsif pada layar tablet/desktop.

### Tahap 3: Transformasi Visualisasi & Chart (Tren Waktu & Demografi) [SELESAI]
* **Tujuan**: Mengubah visualisasi data agar sesuai analisis Orang, Tempat, dan Waktu (OTW).
* **Langkah**:
  1. Ubah visualisasi Google Charts dari Pie Chart menjadi Donut Chart untuk kelompok umur di `app.dashboard.js.html` (opsi `pieHole: 0.4`). [SELESAI]
  2. Tambahkan counter total kasus di tengah donat chart. [SELESAI]
  3. Poles line/area chart tren bulanan agar menggunakan warna garis biru medis (`#2563eb`), hijau (`#10b981`), dan merah (`#ef4444`) dengan gridline abu-abu tipis. [SELESAI]
  4. Perbaiki styling peta Leaflet agar legends berada di pojok kiri bawah dengan box yang bersih. [SELESAI]
* **Uji**: Kedua chart ter-render dengan sempurna, interaktif, dan tidak terjadi kebocoran memori (memory leak) saat ganti filter DX.

### Tahap 4: Panel Alert & Tabel 5 Penyakit Teratas [SELESAI]
* **Tujuan**: Mengimplementasikan area ringkasan alert kasus baru/urgensi tinggi serta melengkapi tabel kasus teratas dengan mini sparklines.
* **Langkah**:
  1. Rancang panel alert di sisi kanan Row 2 dengan daftar notifikasi terverifikasi atau gagal sinkronisasi yang butuh perhatian admin. [SELESAI]
  2. Susun tabel 5 Penyakit/Wilayah Kasus Tertinggi dengan layout baris bersih, indikator jumlah, dan link selengkapnya ke workbench drilldown. [SELESAI]
  3. Integrasikan interaksi klik drilldown agar ketika wilayah atau baris data diklik, langsung membuka detail kasus di bawahnya. [SELESAI]
* **Uji**: Interaksi drill-down berfungsi dan verifikasi admin/pengampu dapat diakses langsung dari dashboard. [SELESAI]

---

## 4. Parameter Keberhasilan (UAT Checklist)
- [ ] Tampilan dashboard simetris dan rapi saat diembed di Google Sites (`iframe` friendly).
- [ ] Seluruh metric cards (5 buah) menampilkan data sinkron dengan database sheet.
- [ ] Tidak ada tabrakan (conflict) CSS antara Bootstrap 5 dan Tailwind CSS CDN.
- [ ] Fitur export CSV tetap berfungsi normal untuk semua role non-viewer.
- [ ] Performa loading data tetap terjaga dengan memanfaatkan `Cache_Manager`.
