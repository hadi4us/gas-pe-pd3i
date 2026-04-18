# ROLE MATRIX — PE PD3I

Dokumen ini merangkum peran (role) yang dipakai di aplikasi PE PD3I dan hak akses yang diharapkan.

---

## 1. Tujuan

Role matrix dibutuhkan agar:
- pembatasan akses tidak hanya terjadi di UI
- backend punya aturan yang konsisten
- perilaku aplikasi lebih jelas untuk admin, petugas, dan viewer
- UAT dapat menguji hak akses dengan ekspektasi yang eksplisit

---

## 2. Role yang dikenali

### Admin
Hak utama:
- lihat data
- input data baru
- edit / update data
- menjalankan aksi admin
- mengakses dashboard penuh
- retry sinkronisasi / notifikasi / telegram
- export CSV

### Petugas
Hak utama:
- lihat data
- input data baru
- edit / update data
- menggunakan workflow operasional sehari-hari

Batasan:
- tidak menjalankan aksi admin
- tidak mengakses operasi retry admin / export admin yang dibatasi

### Viewer
Hak utama:
- lihat data
- cari data
- buka record existing dalam mode lihat
- membaca dashboard sesuai izin yang tersedia

Batasan:
- tidak boleh save/update data
- tidak boleh menjalankan aksi admin
- form harus tampil read-only

---

## 3. Ringkasan capability

| Capability | Admin | Petugas | Viewer |
|---|---|---:|---:|
| Lihat data | Ya | Ya | Ya |
| Cari / buka record | Ya | Ya | Ya |
| Input data baru | Ya | Ya | Tidak |
| Edit / update data | Ya | Ya | Tidak |
| Verifikasi EPID | Ya | Ya | Tidak |
| Input hasil sampel | Ya | Ya | Tidak |
| Update status pasien/kasus | Ya | Ya | Tidak |
| Dashboard statistik | Ya | Ya* | Ya* |
| Retry sinkronisasi/notifikasi | Ya | Tidak | Tidak |
| Export CSV | Ya | Tidak | Tidak |
| Akses admin menu | Ya | Tidak | Tidak |

> Catatan: akses dashboard untuk non-admin bisa dibatasi lagi sesuai kebijakan berikutnya.

---

## 4. Implementasi yang diharapkan

### UI
- Admin melihat semua kontrol
- Petugas melihat kontrol operasional, tanpa kontrol admin
- Viewer melihat **mode lihat** yang jelas:
  - banner read-only
  - field terkunci
  - CTA `Buka / Lihat`

### Backend
- viewer harus ditolak eksplisit untuk aksi write
- aksi admin harus diverifikasi di backend, bukan hanya disembunyikan di UI
- audit login/login gagal/logout dicatat

---

## 5. Arah lanjutan

Role matrix ini masih bisa dikembangkan ke model yang lebih rinci, misalnya:
- admin
- koordinator
- surveilans kab/kota
- surveilans puskesmas
- viewer

Atau pembatasan berbasis wilayah/fasyankes jika nanti dibutuhkan.
