# RAW Header Audit & Cleanup

Dokumen ini merangkum audit kode untuk sheet `*_Raw`, susunan header canonical yang direkomendasikan, serta cleanup file runtime lama.

## 1. Runtime aktif saat ini

File `.html` / include yang masih dimuat oleh `src/index.html`:

- `style`
- `login`
- `pin`
- `workspace_overview`
- `workspace_input_launcher`
- `workspace_input_form`
- `workspace_search`
- `workspace_verifikasi_form`
- `workspace_sampel_form`
- `workspace_status_form`
- `workspace_success_modal`
- `workspace_form`
- `workspace_dashboard`
- `workspace_guide`
- `utils.js`
- `config_common`
- `config_MR`
- `config_DIF`
- `config_PERT`
- `config_AFP`
- `config_TN`
- `config_registry`
- `auth.js`
- `app.js`
- `app.dashboard.js`

## 2. Cleanup file client lama

File split client lama berikut **sudah tidak dipakai runtime** dan telah dihapus agar tidak membingungkan / memicu load salah:

- `app.draft.js.html`
- `app.foundation.js.html`
- `app.geo.js.html`
- `app.init.js.html`
- `app.search.js.html`
- `app.submit.js.html`
- `app.validation.js.html`

File tmp lokal yang juga dibersihkan:

- `.tmp_renderQueueTable.js`
- `docs/_tmp_dashboard_ids.txt`

## 3. Urutan canonical header `*_Raw` yang direkomendasikan

Urutan kolom sheet raw sebaiknya diseragamkan per DX dengan blok berikut:

- **A. Identitas sistem & workflow** — `ID Registrasi Kasus`, `Nomor EPID`, `Nomor EPID Rekomendasi`, `Nomor EPID Final`, `DX`, metadata waktu input/update, tracking workflow
- **B. Pelapor** — semua field `COMMON_PELAPOR_FIELDS`
- **C. Pasien / domisili** — semua field `COMMON_PASIEN_FIELDS`
- **D. Diagnosis-specific** — field per DX sesuai urutan section config diagnosis
- **E. Verifikasi** — semua `COMMON_VERIFIKASI_FIELDS`
- **F. Hasil sampel** — semua `COMMON_HASIL_SAMPEL_FIELDS`
- **G. Status kasus** — semua `COMMON_STATUS_FIELDS`
- **H. Pipeline / routing** — `COMMON_PIPELINE_HEADERS_`
- **I. Internal tracking** — `INTERNAL_TRACKING_HEADERS_`
- **J. Legacy / alias lama** — diletakkan paling belakang atau diarsipkan bila sudah dipastikan tidak dipakai

## 4. Audit header array internal

- `COMMON_PIPELINE_HEADERS_`: 37 header, duplicate exact: tidak ada
- `INTERNAL_TRACKING_HEADERS_`: 8 header, duplicate exact: tidak ada

## 5. Audit per diagnosis (urutan section aktif)

### MR
1. Informasi Kejadian / KLB
2. Informasi Klinis & Gejala Utama
3. Gejala Klinis Khas Rubella
4. Kondisi Khusus
5. Gejala Lain
6. Komplikasi
7. Riwayat Perawatan
8. Informasi Epidemiologis
9. Informasi Spesimen
10. Kondisi Saat Ini
11. Kontak Erat

### DIF
1. Identitas Pelapor Tambahan
2. Identitas Penderita & Kontak Darurat
3. Informasi Klinis & Gejala
4. Informasi Spesimen
5. Riwayat Pengobatan / Perawatan
6. Informasi Epidemiologis
7. Kontak Erat

### PERT
1. Informasi Klinis & Gejala
2. Riwayat Pengobatan / Rawat Inap
3. Informasi Epidemiologis
4. Informasi Spesimen
5. Kondisi Saat Ini
6. Kontak Erat

### TN
1. Identitas Bayi dan Ibu
2. Informasi Kelahiran Bayi
3. Riwayat Pemeriksaan Kehamilan Ibu
4. Riwayat Persalinan
5. Riwayat Imunisasi Ibu
6. Respon Kasus
7. Informasi Lain
8. Variabel Epidemiologis Tambahan

### AFP
1. Riwayat Sakit
2. Gejala / Tanda Neurologis
3. Riwayat Kontak / Perjalanan
4. Sanitasi Dasar
5. Status Imunisasi Polio Ringkas
6. Pengumpulan Spesimen
7. Petugas / Dokter
8. Follow Up 60 Hari

## 6. Temuan duplicate exact dari config field id

- Tidak ditemukan **duplicate exact dalam file diagnosis yang sama**.
- Nama field yang sama lintas diagnosis (mis. `Nama Rumah Sakit`, `Tanggal mulai sakit`) masih normal karena masing-masing berada di sheet DX berbeda.

## 7. Kandidat kolom legacy / alias yang perlu dicek pada sheet live

Kolom berikut muncul sebagai **source alias lama** di `data.js`. Jika masih ada di `*_Raw`, besar kemungkinan itu kolom legacy / transisi yang perlu dievaluasi apakah masih dipakai:

- `Nama orang tua/wali` → sekarang dipetakan ke `Nama Orang Tua/Wali`
- `No. kontak orang tua/wali` → sekarang dipetakan ke `No Telp/WA Orang Tua/Wali`
- `Nama Petugas` → sekarang dipetakan ke `Petugas`
- `Tanggal mulai demam` → sekarang dipetakan ke `Tanggal Mulai Demam`
- `Tanggal mulai ruam` → sekarang dipetakan ke `Tanggal Mulai Ruam`
- `Mata merah` → sekarang dipetakan ke `Mata Merah`
- `Umur kehamilan` → sekarang dipetakan ke `Umur Kehamilan`
- `Gejala lain` → sekarang dipetakan ke `Gejala Lain`
- `Sebutkan gejala lain` → sekarang dipetakan ke `Sebutkan Gejala Lain`
- `Diare` → sekarang dipetakan ke `Komp_Diare`
- `Bronchopneumonia` → sekarang dipetakan ke `Komp_Bronchopneumonia`
- `Kebutaan` → sekarang dipetakan ke `Komp_Kebutaan`
- `Otitis media` → sekarang dipetakan ke `Komp_Otitis Media`
- `Pneumonia` → sekarang dipetakan ke `Komp_Pneumonia`
- `Encephalitis` → sekarang dipetakan ke `Komp_Encephalitis`
- `Malnutrisi` → sekarang dipetakan ke `Komp_Malnutrisi`
- `Ulkus mukosa mulut` → sekarang dipetakan ke `Komp_Ulkus Mukosa Mulut`
- `Lainnya komplikasi` → sekarang dipetakan ke `Komp_Lainnya`
- `Sebutkan komplikasi lain` → sekarang dipetakan ke `Komp_Lainnya_Sebutkan`
- `Apakah dirawat inap?` → sekarang dipetakan ke `Rawat inap?`
- `Ada kasus serupa di lingkungan` → sekarang dipetakan ke `Ada kasus sekitar?`
- `Pemberian Vitamin A` → sekarang dipetakan ke `Pemberian vitamin A?`
- `Riwayat perjalanan 7-21 hari` → sekarang dipetakan ke `Berpergian 1 bulan terakhir?`
- `Lokasi perjalanan` → sekarang dipetakan ke `Tujuan perjalanan`
- `Tanggal pulang perjalanan` → sekarang dipetakan ke `Tanggal pulang`
- `Tanggal kembali` → sekarang dipetakan ke `Tanggal pulang`
- `Spesimen diambil?` → sekarang dipetakan ke `Apakah spesimen darah diambil`
- `Jenis spesimen` → sekarang dipetakan ke `Jenis Sampel Darah`
- `Tanggal ambil spesimen` → sekarang dipetakan ke `Tanggal ambil spesimen darah`
- `Tanggal kirim spesimen` → sekarang dipetakan ke `Tanggal pengiriman spesimen darah ke lab`
- `Jenis spesimen lainnya` → sekarang dipetakan ke `Jenis Sampel Lain`
- `Status akhir kasus` → sekarang dipetakan ke `Keadaan saat ini`
- `Kontak Erat` → sekarang dipetakan ke `KontakEratJSON`
- `Provinsi Pasien` → sekarang dipetakan ke `Provinsi`
- `Kab/Kota Pasien` → sekarang dipetakan ke `Kab/Kota`
- `Provinsi` → sekarang dipetakan ke `Provinsi unit pelapor`
- `Kab/Kota` → sekarang dipetakan ke `Kab/Kota unit pelapor`

## 8. Catatan eksekusi sheet live

Eksekusi live untuk batch reorder `*_Raw` **sudah dijalankan** pada produksi dengan pola aman:

- audit header live per DX
- batal otomatis bila ada duplicate exact header
- buat backup sheet `*_PRE_REORDER_*`
- reorder hanya untuk header yang memang sudah ada, lalu pertahankan kolom legacy/unknown di belakang

Hasil penting setelah inspeksi pasca-reorder:

- **tidak ditemukan duplicate exact header** yang memblokir reorder
- `MR_Raw` sudah relatif dekat dengan struktur baru, tetapi masih membawa banyak kolom alias/transisi
- `DIF_Raw`, `PERT_Raw`, `TN_Raw`, dan `AFP_Raw` ternyata masih dominan memakai struktur lama, sehingga reorder saja **belum cukup** untuk menyamakan mereka dengan schema canonical runtime saat ini
- beberapa sheet lama masih punya **blank trailing headers**, jadi cleanup berikutnya tidak boleh langsung berupa hapus kolom massal

Untuk audit pasca-reorder yang bisa direproduksi dari header sheet live, lihat:

- `docs/RAW-HEADER-LIVE-AUDIT.md`
- `scripts/audit-live-raw-headers.js`

Kesimpulan batch ini: fondasi reorder live sudah beres, tetapi batch lanjutan harus fokus ke **append/backfill header canonical yang belum ada**, bukan sekadar menggeser urutan kolom.
