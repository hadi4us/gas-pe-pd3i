# UI BLUEPRINT — TABLER-STYLE SHELL FOR PE PD3I

Dokumen ini menjelaskan arah redesign UI untuk aplikasi **PE PD3I** dengan pendekatan **Bootstrap 5 + Tabler-inspired admin shell**.

---

## 1. Tujuan Redesign

Redesign UI dilakukan karena model sebelumnya masih terasa seperti:
- form teknis panjang dalam satu halaman
- search/edit, admin tools, dan dashboard terasa menempel tanpa hirarki yang kuat
- belum ada shell aplikasi yang membedakan area kerja, area navigasi, dan area ringkasan

Target redesign:
1. membuat aplikasi terasa seperti **produk operasional yang matang**
2. memperjelas alur kerja petugas surveilans
3. memisahkan navigasi, input, edit, dan monitoring secara visual
4. tetap mempertahankan backend Apps Script + logic existing

---

## 2. Prinsip UI

### 2.1 Shell dulu, backend tetap
Redesign tidak menulis ulang backend. Fokus utama ada di:
- `index.html`
- `style.html`
- helper UI di `app.js.html`

### 2.2 Fokus pada operasional surveilans
UI harus nyaman untuk:
- input form PE yang panjang
- koreksi/edit data
- validasi data
- membaca warning epidemiologis
- berpindah cepat antar area kerja

### 2.3 Ringkasan selalu terlihat
Petugas harus selalu bisa melihat:
- diagnosis aktif
- mode kerja (input/edit)
- umur dan kelompok umur epidemiologis
- nomor EPID
- warning/isu validasi
- user aktif

---

## 3. Arsitektur Layar Baru

## 3.1 Sidebar kiri
Sidebar dipakai untuk:
- branding aplikasi
- navigasi cepat ke section utama
- akses cepat dashboard statistik
- daftar diagnosis yang didukung

Menu utama:
- Dashboard Form
- Cari / Edit
- Informasi Pelapor
- Demografi Pasien
- Data Spesifik Kasus
- Dashboard Statistik

## 3.2 Topbar
Topbar dipakai untuk:
- judul workspace aktif
- subtitle operasional
- badge user aktif
- admin menu
- ubah PIN
- logout

## 3.3 Content area
Area utama dibagi menjadi 3 lapis:

### Lapis A — Overview / hero
Berisi:
- positioning aplikasi
- diagnosis aktif
- mode kerja
- jumlah warning ringkas

### Lapis B — Search/Edit shell
Berisi:
- area pencarian existing case
- kriteria pencarian
- hasil pencarian

### Lapis C — Form workspace
Berisi:
- section pelapor
- section demografi pasien
- section spesifik diagnosis
- sidebar kanan untuk summary + submit

---

## 4. Struktur Form Workspace

Form tidak lagi hanya tampil sebagai blok tunggal. Struktur yang dipakai:

### Kolom kiri — pengisian utama
1. **Informasi Pelapor**
2. **Data Demografi Pasien**
3. **Data Spesifik Kasus**
   - klinis
   - epidemiologi
   - imunisasi
   - spesimen
   - outcome
   - kontak erat

### Kolom kanan — control tower
1. **Edit badge**
2. **Alert / validasi**
3. **Summary panel**
4. **Submit / cancel action**
5. **Workflow singkat**

Model ini dipilih agar petugas tidak kehilangan konteks saat form menjadi panjang.

---

## 5. Komponen Utama

### 5.1 Hero metrics
Menampilkan:
- mode aktif
- diagnosis aktif
- jumlah isu/warning

### 5.2 Search card
Berfungsi sebagai workspace pencarian yang tetap terpisah dari area input.

### 5.3 Summary panel
Menampilkan:
- diagnosis
- kode DX
- nomor EPID
- umur
- kelompok umur epi
- mode kerja
- user aktif
- jumlah isu validasi

### 5.4 Action card
Berisi:
- tombol submit utama
- tombol batal edit
- helper text tentang validasi dan submit

### 5.5 Workflow card
Memberi arahan cepat kepada user soal urutan kerja.

---

## 6. Kenapa memilih Tabler-style

Dari opsi template admin yang dipertimbangkan:
- Tabler
- AdminLTE
- CoreUI

Pendekatan **Tabler-style** dipilih karena:
1. visual lebih modern dan ringan
2. cocok untuk dashboard + form panjang
3. bersih untuk aplikasi kesehatan / surveilans
4. tidak terlalu terasa seperti aplikasi kantor lawas
5. mudah dipadukan dengan struktur existing project

---

## 7. Strategi Implementasi

### Fase 1 — Shell aplikasi
- sidebar
- topbar
- hero section
- search shell
- form workspace dua kolom

### Fase 2 — Summary dan navigasi konteks
- summary panel dinamis
- badge mode input/edit
- quick navigation ke section form

### Fase 3 — Dashboard visual lanjutan
- statistik ringkas
- quality cards
- operational monitoring

### Fase 4 — Form flow lanjutan
- wizard / stepper per diagnosis
- review page sebelum submit
- sticky validation summary yang lebih kaya

---

## 8. Constraint Implementasi

Karena project saat ini masih memakai banyak utility Tailwind pada field generator existing:
- Tailwind tetap dipertahankan sementara
- Tabler dipakai untuk shell/layout/look-and-feel
- migrasi penuh ke komponen Bootstrap/Tabler dapat dilakukan bertahap

Jadi pendekatan saat ini adalah:
**Tabler-inspired shell + kompatibel dengan renderer existing**

---

## 9. Hasil yang Diharapkan

Setelah redesign shell ini:
- aplikasi terasa lebih modern
- alur kerja lebih terbaca
- form panjang lebih terkendali
- panel ringkasan membantu validasi sebelum submit
- fondasi siap untuk redesign dashboard dan wizard form berikutnya
