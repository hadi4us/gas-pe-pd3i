# Reference Data Dictionary — `REF_USER` & `REF_PENGAMPU`

Dokumen ini menjelaskan kolom referensi yang saat ini dipakai aplikasi PE PD3I, relasi antar-sheet, dan modul kode yang bergantung padanya.

Tujuan:
- mencegah refactor yang memutus relasi kolom diam-diam
- menjadi acuan saat rename / tambah / hapus kolom
- memisahkan kolom **wajib operasional** vs **opsional/legacy**

---

## 1. Prinsip desain saat ini

### `REF_USER`
Berfungsi sebagai **akun login + otorisasi + unit/scope kerja**.

### `REF_PENGAMPU`
Berfungsi sebagai **source of truth wilayah kerja** dan juga **routing operasional**.

Rule akses hasil pemeriksaan saat ini:
1. ambil domisili pasien: `Kab/Kota + Kecamatan + Kelurahan`
2. cari mapping wilayah di `REF_PENGAMPU`
3. dapatkan `KodePuskesmas` / `NamaPuskesmas` pengampu
4. cocokkan dengan `UnitKerja` / `KodePuskesmas` user di `REF_USER`
5. admin tetap bisa bypass sebagai role pusat

---

## 2. Data dictionary — `REF_USER`

### Peran sheet
- sumber autentikasi login (`auth.js`)
- sumber role dan scope akses (`auth.js`, `routes.js`, `app.js.html`)
- acuan TTL sesi berbasis role (`utils.js`)

### Kolom aktif yang direkomendasikan

| Kolom | Status | Fungsi | Dipakai di modul | Catatan |
|---|---|---|---|---|
| `Username` | Wajib | Identifier login utama | `auth.js` | Harus unik |
| `PIN` | Wajib | Kredensial login / change pin | `auth.js` | Bisa plain legacy atau `sha256:` untuk PIN baru |
| `Email` | Opsional | Kontak user | belum kritikal langsung | Dipertahankan untuk kebutuhan operasional / masa depan |
| `Nama` | Wajib | Nama tampilan user | `auth.js`, `auth.js.html`, `app.js.html` | Dipakai di badge user & audit metadata |
| `Role` | Wajib | Hak akses utama | `auth.js`, `routes.js`, `app.js.html`, `utils.js` | Contoh: `admin`, `petugas`, `viewer`, `lab`, `status` |
| `UnitKerja` | Wajib untuk non-admin | Nama unit / puskesmas | `auth.js`, `routes.js`, `app.js.html` | Dipakai untuk cocokkan hasil mapping pengampu |
| `KodePuskesmas` | Sangat dianjurkan | Kode unit / puskesmas | `auth.js`, `routes.js`, `app.js.html` | Match yang paling stabil dibanding nama |
| `ScopeLevel` | Wajib | Level scope akses | `auth.js`, `routes.js`, `app.js.html` | Contoh: `puskesmas`, `dinkes` |
| `StatusAktif` | Wajib | Menandai akun aktif/tidak | `auth.js` | Pertahankan nama ini agar konsisten |
| `Catatan Migrasi` | Opsional | Penanda hasil migrasi/manual review | manual review | Tidak dipakai runtime, tapi penting saat transisi |

### Relasi penting
- `Role` -> menentukan workflow stage permission
- `ScopeLevel` -> membedakan `dinkes` vs `puskesmas`
- `KodePuskesmas` / `UnitKerja` -> dicocokkan dengan hasil lookup dari `REF_PENGAMPU`

### Kolom legacy yang pernah ada
Kolom seperti berikut **jangan diasumsikan masih jadi source of truth**:
- `Kelurahan Wilayah Kerja`
- `Kecamatan Wilayah Kerja`
- daftar kelurahan mentah per user

Kolom-kolom itu dipindahkan konsepnya ke model yang lebih sehat:
- wilayah -> `REF_PENGAMPU`
- akun/scope -> `REF_USER`

---

## 3. Data dictionary — `REF_PENGAMPU`

### Peran sheet
- source of truth wilayah -> pengampu/puskesmas
- sumber metadata pengampu untuk raw record
- sumber routing email / spreadsheet / telegram

### Kolom aktif yang direkomendasikan

| Kolom | Status | Fungsi | Dipakai di modul | Catatan |
|---|---|---|---|---|
| `Status` | Dianjurkan | Menandai baris aktif/nonaktif | potensi operasional/manual | Saat ini belum banyak dipakai runtime, tapi bagus dipertahankan |
| `Kab/Kota` | Wajib | Bagian dari key mapping wilayah | `data.js`, `routes.js` | Penting karena ada nama kelurahan sama di kecamatan/kota berbeda |
| `Kecamatan` | Wajib | Bagian dari key mapping wilayah | `data.js`, `routes.js` | Dipakai bersama kelurahan |
| `Kelurahan` | Wajib | Bagian dari key mapping wilayah | `data.js`, `routes.js` | Jangan dipakai sendiri tanpa kecamatan |
| `KodePuskesmas` | Sangat dianjurkan | Hasil mapping wilayah -> unit kerja | `data.js`, `routes.js` | Kunci yang lebih stabil untuk otorisasi |
| `NamaPuskesmas` | Wajib | Nama unit pengampu | `data.js`, `routes.js`, `app.js.html` | Dipakai sebagai fallback bila kode belum tersedia |
| `Pengampu` | Dianjurkan | Identitas pengampu wilayah | `data.js` | Metadata record / pelacakan |
| `PetugasSurveilans` | Dianjurkan | Nama petugas surveilans pengampu | `data.js` | Metadata notifikasi/routing |
| `EmailPetugas` | Dianjurkan | Email petugas pengampu | `data.js`, pipeline/notifikasi | Dipakai untuk notifikasi email |
| `KepalaPuskesmas` | Opsional penting | Nama kapus | `data.js` | Metadata record / routing |
| `EmailKapus` | Opsional penting | Email kapus | `data.js`, pipeline/notifikasi | Dipakai untuk notifikasi email |
| `SpreadsheetId` | Opsional penting | Target spreadsheet pengampu | `data.js`, `routes.js` | Dipakai sinkronisasi/pipeline |
| `SpreadsheetUrl` | Opsional penting | URL spreadsheet pengampu | `data.js` | Metadata & debugging |
| `SpreadsheetIdTujuan` | Legacy-kompatibel | Target sinkronisasi tujuan | `routes.js`, pipeline | Pertahankan dulu untuk kompatibilitas |
| `SpreadsheetUrlTujuan` | Legacy-kompatibel | URL sinkronisasi tujuan | pipeline/manual ops | Pertahankan dulu |
| `NamaSheetTujuan` | Legacy-kompatibel | Sheet tujuan sinkronisasi | pipeline | Pertahankan dulu |
| `TelegramChatId` | Legacy-kompatibel | Target notifikasi telegram | pipeline/notifikasi | Pertahankan dulu |
| `Catatan` | Opsional | Keterangan manual | manual review | Berguna untuk operasional |

### Relasi penting
- `Kab/Kota + Kecamatan + Kelurahan` -> `KodePuskesmas / NamaPuskesmas`
- `KodePuskesmas / NamaPuskesmas` -> dicocokkan dengan `REF_USER`
- metadata pengampu -> diinjeksikan ke raw record saat save/routing

### Kenapa tidak boleh disederhanakan terlalu minimal
Karena `REF_PENGAMPU` bukan cuma dipakai untuk otorisasi wilayah, tapi juga untuk:
- isi metadata pengampu pada record
- status routing / sinkronisasi
- email notifikasi petugas / kapus
- target spreadsheet pengampu
- kebutuhan telegram/pipeline tertentu

---

## 4. Relasi antar-sheet

### Relasi utama
`REF_USER` (akun) <-> `REF_PENGAMPU` (wilayah/puskesmas)

```text
User login
  -> ambil Role, ScopeLevel, UnitKerja, KodePuskesmas dari REF_USER
  -> ambil domisili pasien (Kab/Kota, Kecamatan, Kelurahan)
  -> lookup REF_PENGAMPU
  -> dapat pengampu + puskesmas pengampu
  -> bandingkan dengan user
  -> putuskan boleh/tidak untuk tahap hasil pemeriksaan
```

### Relasi khusus akses tahap
- **Verifikasi EPID** -> admin only
- **Hasil pemeriksaan** -> admin atau user yang `UnitKerja/KodePuskesmas`-nya match dengan hasil lookup `REF_PENGAMPU`
- **Update status** -> mengikuti role/stage permission

---

## 5. Modul kode yang bergantung pada sheet referensi

### `REF_USER`
- `src/auth.js`
  - login
  - parse user profile
  - baca `UnitKerja`, `KodePuskesmas`, `ScopeLevel`
- `src/routes.js`
  - enforcement hak simpan berdasarkan role + scope
- `src/app.js.html`
  - helper UI hak akses/stage
  - helper text & capability summary
- `src/utils.js`
  - TTL sesi berbasis role

### `REF_PENGAMPU`
- `src/data.js`
  - `getPengampuByWilayah_`
  - injeksi metadata pengampu ke raw record
- `src/routes.js`
  - pipeline sync/notifikasi
  - enforcement akses hasil pemeriksaan berbasis wilayah/puskesmas pengampu
- potensi modul pipeline/notifikasi
  - status routing pengampu
  - target spreadsheet / email / telegram

---

## 6. Kolom yang aman diubah vs tidak aman

### Tidak aman diubah tanpa refactor kode + UAT
#### `REF_USER`
- `Username`
- `PIN`
- `Nama`
- `Role`
- `UnitKerja`
- `KodePuskesmas`
- `ScopeLevel`
- `StatusAktif`

#### `REF_PENGAMPU`
- `Kab/Kota`
- `Kecamatan`
- `Kelurahan`
- `KodePuskesmas`
- `NamaPuskesmas`
- `PetugasSurveilans`
- `EmailPetugas`
- `SpreadsheetId`
- `SpreadsheetIdTujuan`
- `NamaSheetTujuan`
- `TelegramChatId`

### Relatif aman ditambah
- kolom notes/administratif baru
- kolom penanda manual review
- kolom audit internal spreadsheet

### Jangan dihapus dulu walau terasa duplikat
- `SpreadsheetId` vs `SpreadsheetIdTujuan`
- `SpreadsheetUrl` vs `SpreadsheetUrlTujuan`
- `Pengampu` vs `PetugasSurveilans`

Kolom-kolom itu masih layak diaudit lagi nanti, tapi **jangan dipangkas sebelum semua alur routing/sync dipastikan aman**.

---

## 7. Checklist sebelum ubah struktur sheet referensi

Sebelum rename/hapus/tambah kolom di `REF_USER` atau `REF_PENGAMPU`:

1. cek dokumen ini
2. cek scan dependensi di source (`grep REF_USER / REF_PENGAMPU / header kolom`)
3. tentukan apakah perubahan menyentuh:
   - auth
   - scope akses
   - routing pengampu
   - notifikasi
   - sinkronisasi spreadsheet
4. update kode + docs
5. jalankan UAT minimal:
   - login
   - save input awal
   - verifikasi admin
   - hasil pemeriksaan berbasis wilayah
   - update status
   - pipeline/notifikasi yang relevan

---

## 8. Rekomendasi lanjutan

Batch lanjutan yang masuk akal:
1. review manual row `REF_USER` hasil migrasi yang masih ambigu (`Catatan Migrasi`)
2. audit apakah `SpreadsheetId*` / `SpreadsheetUrl*` bisa disederhanakan
3. tambah validasi admin tool untuk mendeteksi row referensi yang tidak lengkap
4. tampilkan health check referensi di UI admin/dashboard

---

## 9. Kesimpulan

- `REF_USER` = akun + role + scope
- `REF_PENGAMPU` = wilayah + pengampu + routing operasional
- relasi aktif paling penting sekarang adalah:
  - **Kab/Kota + Kecamatan + Kelurahan**
  - **KodePuskesmas / NamaPuskesmas**
- dokumen ini harus jadi acuan sebelum perubahan struktur sheet referensi berikutnya
