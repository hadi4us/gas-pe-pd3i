# Field Gap Matrix per Diagnosis

> Catatan: dokumen ini adalah **baseline audit gap** yang dipakai sebagai dasar implementasi batch form pada 2026-04-18. Setelah batch implementasi terbaru, sebagian gap pada dokumen ini sudah mulai ditutup di codebase dan perlu diperbarui lagi pada audit berikutnya.

Analisis ini membandingkan **form manual PE PD3I** yang diberikan user dengan **form input aktif** pada saat audit dilakukan.

## Sumber pembanding
- Form input aplikasi:
  - `src/config_common.html`
  - `src/config_MR.html`
  - `src/config_DIF.html`
  - `src/config_PERT.html`
  - `src/config_TN.html`
  - `src/config_AFP.html`
- Pemeriksaan tambahan:
  - `src/app.js.html`
  - `src/app.foundation.js.html`
  - `src/data.js`
  - `src/print_MR.html`

## Arti status
- **ADA**: field/variabel sudah tersedia jelas pada form input aktif.
- **PARSIAL**: sudah ada representasi sebagian, tetapi belum setara detail/struktur dengan form manual.
- **BELUM ADA**: tidak ditemukan pada form input aktif; bila ada di print/legacy string saja tetap dihitung belum ada.

---

# 1) MR / Campak-Rubella

## Identitas & pelaporan
- Provinsi -> **ADA**
- Kabupaten -> **ADA** (`Kab/Kota`)
- Nomor EPID -> **ADA**
- Sumber Laporan -> **ADA**
- Nama unit pelapor -> **ADA**
- Tanggal Terima Laporan -> **ADA**
- Tanggal Pelacakan -> **ADA**
- Nama Kasus -> **ADA** (`Nama`)
- Jenis Kelamin -> **ADA** (`JK`)
- Tanggal Lahir -> **ADA**
- Umur tahun/bulan/hari -> **ADA** (`Umur (auto)`)
- Alamat -> **ADA**
- Kelurahan -> **ADA**
- Kecamatan -> **ADA**
- Nama Orangtua/Wali -> **ADA**
- No. Kontak Orangtua/Wali -> **ADA**
- Kasus KLB -> **BELUM ADA**
- KLB ke -> **BELUM ADA**
- Nomor KLB -> **BELUM ADA**

## Informasi klinis
- Demam (Ya/Tidak) -> **PARSIAL** (yang ada: `Tanggal mulai demam`; status Ya/Tidak bisa diinferensikan di backend, tapi belum jadi input eksplisit)
- Tanggal Mulai Demam -> **ADA**
- Ruam Makulopapular (Ya/Tidak) -> **PARSIAL** (yang ada: `Tanggal mulai ruam`; status Ya/Tidak belum eksplisit di form)
- Tanggal Mulai Ruam -> **ADA**
- Batuk -> **ADA**
- Pilek -> **ADA**
- Mata Merah -> **ADA**
- Adenopathy -> **ADA**
- Lokasi Adenopathy -> **ADA**
- Arthralgia -> **ADA**
- Bagian Sendi -> **ADA**
- Kehamilan -> **ADA**
- Umur Kehamilan -> **ADA**
- Gejala lain (indikator) -> **ADA**
- Sebutkan gejala lain -> **ADA**

## Komplikasi
- Diare -> **ADA**
- Bronchopneumonia -> **ADA**
- Kebutaan -> **ADA**
- Otitis media -> **ADA**
- Pneumonia -> **ADA**
- Encephalitis -> **ADA**
- Malnutrisi -> **ADA**
- Ulkus mukosa mulut -> **ADA**
- Komplikasi lainnya -> **ADA**
- Sebutkan komplikasi lainnya -> **ADA**

## Riwayat pengobatan
- Apakah kasus dirawat di Rumah Sakit -> **ADA** (`Apakah dirawat inap?`)
- Nama Rumah Sakit -> **ADA**
- Nomor Rekam Medik -> **ADA**
- Tanggal Masuk Rawat Inap -> **ADA**
- Tanggal Keluar -> **PARSIAL** (yang ada: `Tanggal Pulang`, ekuivalen tetapi label berbeda)

## Riwayat imunisasi
- Imunisasi campak-rubela dosis 1 -> **PARSIAL** (bisa direpresentasikan via tabel `Riwayat Imunisasi`, tapi bukan field khusus per formulir)
- Sumber informasi dosis 1 -> **PARSIAL**
- Imunisasi campak-rubela dosis 2 -> **PARSIAL**
- Sumber informasi dosis 2 -> **PARSIAL**
- Imunisasi campak-rubela saat BIAS -> **BELUM ADA** (hanya ada referensi legacy/summary/print, bukan input aktif di config)
- Sumber informasi BIAS -> **BELUM ADA**
- Pernah menerima imunisasi MMR sebelumnya -> **BELUM ADA** (hanya ada referensi legacy/summary/print)
- Sumber informasi MMR -> **BELUM ADA**
- Pernah menerima imunisasi campak-rubela saat imunisasi tambahan -> **BELUM ADA** (hanya ada referensi legacy/summary/print)
- Sumber informasi imunisasi tambahan -> **BELUM ADA**
- Tanggal imunisasi campak-rubela terakhir -> **BELUM ADA** (ada di legacy summary/print, belum ada field input aktif)

## Informasi epidemiologis
- Pemberian Vitamin A -> **ADA**
- Ada anggota keluarga/masyarakat sekitar yang mengalami sakit yang sama -> **ADA**
- Jumlah -> **ADA** (`Jumlah kasus sekitar`)
- Apakah bepergian 1 bulan terakhir -> **ADA**
- Lokasi -> **ADA**
- Tanggal pergi -> **ADA**
- Tanggal kembali -> **ADA**

## Informasi spesimen
- Apakah spesimen darah diambil -> **ADA**
- Jenis Sampel Darah -> **ADA**
- Tanggal ambil spesimen darah -> **ADA**
- Tanggal pengiriman spesimen darah ke lab -> **ADA**
- Apakah spesimen lain diambil -> **ADA**
- Jenis Sampel Lain -> **ADA**
- Tanggal ambil spesimen lain -> **ADA**
- Tanggal pengiriman spesimen lain ke lab -> **ADA**

## Outcome
- Keadaan saat ini (Hidup/Meninggal/Lost to follow-up) -> **ADA**

## Kontak erat
- Tabel kontak erat -> **ADA**
- Nama -> **ADA**
- Umur -> **ADA**
- Alamat -> **ADA**
- Hubungan dengan kasus -> **ADA**
- Berapa kali pernah imunisasi campak-rubella -> **PARSIAL** (yang ada hanya `Status Imunisasi: Lengkap/Tidak lengkap/Tidak tahu`, belum jumlah kali)
- Kondisi saat itu -> **PARSIAL** (ada `Kondisi`, tetapi opsi spesifik form manual belum identik)
- Penanda kontak hamil -> **BELUM ADA**

---

# 2) DIF / Difteri

## Identitas pelapor
- Nama -> **PARSIAL** (yang ada `Nama Petugas`, bukan persis identitas pelapor seperti form manual)
- Nama Kantor & Jabatan -> **BELUM ADA**
- Kabupaten/Kota -> **ADA**
- Provinsi -> **ADA**
- Tanggal Terima Laporan -> **ADA**
- Tanggal Pelacakan Laporan -> **ADA**
- Puskesmas -> **PARSIAL** (yang ada `Nama unit pelapor`, tidak spesifik field `Puskesmas`)

## Identitas penderita
- Nama -> **ADA**
- Nama Orang Tua/KK -> **ADA** (`Nama orang tua/wali`)
- Jenis Kelamin -> **ADA**
- Tanggal Lahir -> **ADA**
- Umur -> **ADA**
- Berat Badan -> **ADA**
- Tinggi Badan -> **ADA**
- Alamat Lengkap -> **ADA**
- Desa/Kelurahan -> **ADA**
- Kecamatan -> **ADA**
- Kabupaten/Kota -> **ADA** (`Kab/Kota Pasien`)
- Provinsi -> **ADA** (`Provinsi Pasien`)
- Tel/HP -> **BELUM ADA** (yang ada hanya kontak orang tua/wali)
- Pekerjaan -> **PARSIAL** (yang ada status sekolah/kegiatan + nama sekolah/tempat kerja, bukan field pekerjaan spesifik)
- Alamat Tempat Kerja -> **BELUM ADA**
- Orang tua/Wali/Saudara dekat yang dapat dihubungi -> **BELUM ADA** sebagai field relasi khusus
- Alamat Lengkap Wali -> **BELUM ADA**
- Desa/Kelurahan Wali -> **BELUM ADA**
- Kecamatan Wali -> **BELUM ADA**
- Kabupaten/Kota Wali -> **BELUM ADA**
- Provinsi Wali -> **BELUM ADA**
- Nomor Telepon/HP Wali -> **BELUM ADA**

## Riwayat sakit
- Tanggal mulai sakit -> **ADA**
- Keluhan utama yang mendorong berobat -> **ADA**
- Demam -> **ADA**
- Tanggal demam -> **ADA**
- Sakit tenggorokan -> **ADA**
- Tanggal sakit tenggorokan -> **ADA**
- Leher bengkak -> **ADA** (`Bull neck`)
- Tanggal leher bengkak -> **ADA**
- Sesak nafas -> **ADA**
- Tanggal sesak nafas -> **ADA**
- Pseudomembran -> **ADA**
- Tanggal pseudomembran -> **ADA**
- Gejala lain -> **ADA**

## Imunisasi & status gizi
- Status imunisasi difteri (Belum pernah/Pernah/Tidak tahu) -> **PARSIAL** (di app memakai tabel riwayat imunisasi, bukan field ringkas sesuai form manual)
- DPT-HB-Hib 1,2,3 -> **PARSIAL** (via tabel imunisasi)
- DPT-HB-Hib booster 18 bulan -> **PARSIAL**
- DT kelas 1 -> **PARSIAL**
- TD kelas 2 dan 5 -> **PARSIAL**
- Sumber Informasi imunisasi -> **PARSIAL** (via tabel imunisasi)
- Status Gizi -> **ADA**

## Spesimen
- Jenis spesimen diambil -> **ADA**
- Tanggal pengambilan spesimen -> **ADA**
- No. Kode Spesimen -> **ADA**
- Tanggal pengiriman spesimen -> **ADA**

## Riwayat pengobatan
- Berobat ke Rumah Sakit -> **ADA**
- Tanggal berobat ke RS -> **ADA**
- Tracheostomi -> **ADA**
- Berobat ke Puskesmas -> **ADA**
- Tanggal berobat ke Puskesmas -> **ADA**
- Berobat ke Dokter Praktek Swasta -> **BELUM ADA**
- Tanggal berobat ke Dokter Praktek Swasta -> **BELUM ADA**
- Berobat ke Perawat/Mantri/Bidan -> **BELUM ADA**
- Tanggal berobat ke Perawat/Mantri/Bidan -> **BELUM ADA**
- Tidak berobat -> **BELUM ADA** sebagai opsi eksplisit
- Diagnosis sebagai suspek difteri -> **ADA**
- Tanggal diagnosis -> **ADA**
- Pemberian antibiotik -> **ADA**
- Tanggal antibiotik -> **ADA**
- Jenis antibiotik -> **ADA**
- Pemberian ADS -> **ADA**
- Dosis ADS -> **ADA**
- Tanggal ADS -> **ADA**
- Alasan tidak ADS -> **ADA**
- Obat lain -> **ADA**
- Kondisi kasus saat ini -> **ADA**
- Tanggal sembuh -> **ADA**
- Tanggal meninggal -> **ADA**

## Riwayat kontak/perjalanan
- Pernah bepergian dalam 10 hari terakhir -> **ADA**
- Daerah perjalanan -> **ADA**
- Pernah berkunjung ke rumah teman/saudara yang sehat atau sakit/meninggal dengan gejala sama -> **PARSIAL** (di app ada `Riwayat kontak suspek/konfirmasi difteri`, tapi tidak memisahkan sehat/sakit/meninggal seperti manual)
- Nama dan alamat yang dikunjungi -> **ADA**

## Kontak kasus
- Tabel kontak kasus -> **ADA**
- Nama -> **ADA**
- Umur -> **ADA**
- Alamat -> **ADA**
- Hubungan dengan kasus -> **ADA**
- Berapa kali pernah imunisasi difteri -> **PARSIAL** (hanya `Status Imunisasi`, belum jumlah kali)

---

# 3) PERT / Pertusis

## Identitas & pelaporan
- Provinsi -> **ADA**
- Kabupaten -> **ADA**
- Nomor EPID -> **ADA**
- Sumber Laporan -> **ADA**
- Nama unit pelapor -> **ADA**
- Tanggal Terima Laporan -> **ADA**
- Tanggal Pelacakan -> **ADA**
- Nama Kasus -> **ADA**
- Jenis Kelamin -> **ADA**
- Tanggal Lahir -> **ADA**
- Umur tahun/bulan/hari -> **ADA**
- Alamat -> **ADA**
- Kelurahan -> **ADA**
- Kecamatan -> **ADA**
- Nama Orangtua/Wali -> **ADA**
- No. Kontak Orangtua/Wali -> **ADA**

## Informasi klinis
- Batuk terus menerus -> **ADA**
- Tanggal mulai batuk -> **ADA**
- Apnea -> **ADA**
- Tanggal mulai apnea -> **BELUM ADA**
- Batuk rejan -> **PARSIAL** (`Whoop`)
- Muntah setelah batuk -> **ADA**
- Gejala lain (lainnya) -> **BELUM ADA**

## Riwayat pengobatan
- Apakah kasus dirawat di Rumah Sakit -> **PARSIAL** (`Rawat inap?` ada, tapi belum lengkap unsur rawat inap manual)
- Nama Rumah Sakit -> **BELUM ADA**
- Nomor Rekam Medik -> **BELUM ADA**
- Tanggal Masuk Rawat Inap -> **BELUM ADA**
- Tanggal Keluar -> **BELUM ADA**

## Riwayat vaksinasi
- DPT-HB-HiB usia 2 bulan -> **PARSIAL** (bisa dicatat di tabel `Riwayat Imunisasi`, belum field spesifik)
- Sumber informasi usia 2 bulan -> **PARSIAL**
- DPT-HB-HiB usia 3 bulan -> **PARSIAL**
- Sumber informasi usia 3 bulan -> **PARSIAL**
- DPT-HB-HiB usia 4 bulan -> **PARSIAL**
- Sumber informasi usia 4 bulan -> **PARSIAL**
- DPT-HB-HiB usia 18 bulan -> **PARSIAL**
- Sumber informasi usia 18 bulan -> **PARSIAL**
- Pernah menerima imunisasi DPT-HB-HiB pada saat ORI -> **BELUM ADA**
- Sumber informasi ORI -> **BELUM ADA**
- Tanggal vaksinasi DPT-HB-HiB terakhir -> **BELUM ADA**

## Informasi epidemiologis
- Ada anggota keluarga/masyarakat sekitar yang mengalami sakit yang sama -> **PARSIAL** (yang ada `Ada klaster/kejadian serupa`, tapi bukan wording kasus serupa + jumlah)
- Jumlah -> **BELUM ADA**
- Apakah bepergian 1 bulan terakhir -> **BELUM ADA**
- Lokasi -> **BELUM ADA**
- Tanggal pergi -> **BELUM ADA**
- Tanggal kembali -> **BELUM ADA**

## Informasi spesimen
- Apakah spesimen diambil -> **ADA**
- Jenis spesimen -> **ADA**
- Tanggal ambil spesimen -> **ADA**
- Tanggal pengiriman spesimen ke lab -> **ADA**
- Apakah spesimen lain diambil -> **BELUM ADA**
- Jenis sampel lain -> **BELUM ADA**
- Tanggal ambil spesimen lain -> **BELUM ADA**
- Tanggal pengiriman spesimen lain -> **BELUM ADA**

## Outcome
- Keadaan saat ini (Hidup/Meninggal/Lost to follow-up) -> **BELUM ADA**

## Pelaksana investigasi
- Petugas pelaksana -> **ADA** (`Nama Petugas`)
- No. kontak -> **PARSIAL** (`No Whatsapp Petugas`)

---

# 4) TN / Tetanus Neonatorum

## Identitas & pelaporan
- Provinsi -> **ADA**
- Nomor EPID -> **ADA**
- Kabupaten -> **ADA**
- Sumber Laporan -> **ADA**
- Nama Unit Pelapor -> **ADA**
- Tanggal Terima Laporan -> **ADA**
- Tanggal Pelacakan -> **ADA**

## Identitas bayi dan ibu
- Nama Bayi -> **ADA** (`Nama`)
- Jenis Kelamin -> **ADA**
- Anak ke- -> **BELUM ADA**
- Nama Ibu -> **ADA**
- Usia ibu -> **BELUM ADA**
- Pekerjaan ibu -> **BELUM ADA**
- Pendidikan ibu -> **BELUM ADA**
- Alamat -> **ADA**
- Desa/Kelurahan -> **ADA**
- Kecamatan -> **ADA**
- Sudah berapa lama ibu tinggal di desa ini -> **BELUM ADA**

## Informasi kelahiran bayi
- Apakah bayi lahir hidup -> **BELUM ADA**
- Tanggal lahir bayi -> **ADA** (`Tanggal Lahir`)
- Tanggal mulai sakit -> **ADA**
- Bila bayi meninggal, tanggal meninggal -> **PARSIAL** (`Tanggal meninggal TN` ada, tapi tidak spesifik “bila bayi meninggal” pada blok kelahiran)
- Umur bayi meninggal (hari) -> **BELUM ADA**
- Waktu lahir apakah bayi menangis -> **BELUM ADA**
- Bila no.4 tidak tahu, tanda-tanda kelahiran hidup -> **BELUM ADA**
- Setelah lahir apakah bayi bisa menyusu/minum dengan baik -> **BELUM ADA**
- Apakah 3 hari kemudian mulut bayi mencucu dan tidak bisa menyusu -> **BELUM ADA**
- Apakah bayi mudah kejang jika disentuh/terkena sinar/mendengar bunyi -> **BELUM ADA**
- Apakah bayi dirawat -> **BELUM ADA**
- Tempat perawatan -> **BELUM ADA**
- Tanggal mulai dirawat -> **BELUM ADA**
- Keadaan bayi setelah dirawat -> **BELUM ADA**

## Riwayat pemeriksaan kehamilan ibu
- Berapa kali kunjungan ANC dilakukan -> **BELUM ADA**
- Tempat pemeriksaan ibu hamil -> **BELUM ADA**
- Pemeriksaan kehamilan oleh -> **BELUM ADA**

## Riwayat persalinan
- Tempat persalinan -> **ADA**
- Usia kehamilan ibu saat persalinan -> **PARSIAL** (`Usia gestasi` ada, tapi satuan & konteks form tidak persis)
- Penolong persalinan -> **ADA**
- Alat potong tali pusat -> **BELUM ADA**
- Perawatan tali pusat -> **ADA**
- Keadaan ibu saat ini -> **BELUM ADA**

## Riwayat imunisasi ibu
- Sumber informasi -> **BELUM ADA**
- Ibu mendapat imunisasi Td pada kehamilan ini -> **BELUM ADA**
- Berapa kali mendapat imunisasi Td pada kehamilan ini -> **BELUM ADA**
- Usia kehamilan saat Td pertama -> **BELUM ADA**
- Tanggal imunisasi Td pertama -> **BELUM ADA**
- Usia kehamilan saat Td kedua -> **BELUM ADA**
- Tanggal imunisasi Td kedua -> **BELUM ADA**
- Ibu mendapat imunisasi Td pada kehamilan sebelumnya -> **BELUM ADA**
- Tanggal imunisasi kehamilan sebelumnya dosis 1 -> **BELUM ADA**
- Tanggal imunisasi kehamilan sebelumnya dosis 2 -> **BELUM ADA**
- Ibu mendapat imunisasi Td calon pengantin -> **BELUM ADA**
- Tanggal imunisasi calon pengantin -> **BELUM ADA**
- Riwayat DPT-HB-HiB 1 -> **BELUM ADA**
- Riwayat DPT-HB-HiB 2 -> **BELUM ADA**
- Riwayat DPT-HB-HiB 3 -> **BELUM ADA**
- Riwayat DPT-HB-HiB 4 -> **BELUM ADA**
- Riwayat DT kelas 1 -> **BELUM ADA**
- Riwayat Td kelas 2 -> **BELUM ADA**
- Riwayat Td kelas 5 -> **BELUM ADA**
- Status T ibu hamil saat ini (T1-T5) -> **BELUM ADA**
- Status imunisasi TT/Td ibu -> **PARSIAL** (ada field ringkas, tapi belum detail riwayat seperti form manual)

## Respon kasus
- Ibu mendapatkan vaksin Td pada saat investigasi kasus -> **BELUM ADA**
- Tanggal pemberian vaksin -> **BELUM ADA**

## Informasi lain
- Cakupan DPT-HB-Hib 1 -> **BELUM ADA**
- Cakupan DPT-HB-Hib 2 -> **BELUM ADA**
- Cakupan DPT-HB-Hib 3 -> **BELUM ADA**
- Cakupan DT kelas 1 -> **BELUM ADA**
- Cakupan Td kelas 2 -> **BELUM ADA**
- Cakupan Td kelas 5 -> **BELUM ADA**
- Cakupan TT 2+ -> **BELUM ADA**
- Cakupan persalinan di fasilitas kesehatan -> **BELUM ADA**
- Cakupan kunjungan neonatus KN1 -> **BELUM ADA**
- Cakupan kunjungan neonatus KN2 -> **BELUM ADA**
- Cakupan kunjungan neonatus KN3 -> **BELUM ADA**
- Apakah desa kasus TN mudah dijangkau dari fasilitas pelayanan kesehatan -> **BELUM ADA**
- Faktor lain yang mempengaruhi pelaksanaan imunisasi -> **BELUM ADA**
- Faktor lain yang mempengaruhi proses pertolongan persalinan -> **BELUM ADA**

## Variabel lain yang ada di app tapi tidak ditonjolkan di form manual TN
- Berat lahir -> **ADA di app, tidak disebut eksplisit pada form manual TN yang dikirim**
- Riwayat kasus serupa di wilayah -> **ADA di app, tidak eksplisit pada form manual**
- Status akhir kasus -> **ADA**
- Tanggal meninggal -> **ADA**

---

# 5) AFP / Acute Flaccid Paralysis

## Identitas & pelaporan
- Provinsi -> **ADA**
- Kab/Kota -> **ADA**
- Nomor EPID -> **ADA**
- Sumber laporan berasal -> **ADA** (`Sumber Laporan`)
- Nama instansi pelapor -> **PARSIAL** (`Nama unit pelapor`)
- Tanggal laporan diterima -> **ADA**
- Tanggal penyelidikan -> **ADA** (`Tanggal Pelacakan`)

## Identitas penderita
- Nama penderita -> **ADA**
- Jenis kelamin -> **ADA**
- Tanggal lahir -> **ADA**
- Umur -> **ADA**
- Alamat -> **ADA**
- Kelurahan/desa -> **ADA**
- Kecamatan -> **ADA**
- Nama orang tua -> **ADA**

## Riwayat sakit
- Tanggal mulai sakit/gejala awal sebelum lumpuh -> **BELUM ADA**
- Tanggal mulai lemah/lumpuh -> **PARSIAL** (`Tgl mulai lumpuh`)
- Tanggal meninggal -> **BELUM ADA**
- Pengobatan tradisional/alternatif -> **BELUM ADA**
- Nama tempat pengobatan tradisional -> **BELUM ADA**
- Tanggal berkunjung pengobatan tradisional -> **BELUM ADA**
- Berobat ke Rumah Sakit -> **BELUM ADA**
- Nama Rumah Sakit -> **BELUM ADA**
- Tanggal berobat -> **BELUM ADA**
- Diagnosis -> **BELUM ADA**
- No. rekam medik -> **BELUM ADA**
- Apakah kelemahan/kelumpuhan sifatnya akut (1-14 hari) -> **ADA** (`Sifat akut`)
- Apakah kelemahan/kelumpuhan sifatnya layuh -> **ADA** (`Lumpuh layuh`)
- Apakah kelemahan/kelumpuhan disebabkan rudapaksa -> **BELUM ADA**

## Gejala/Tanda neurologis
- Demam sebelum lemah/lumpuh -> **PARSIAL** (`Demam saat onset`)
- Tungkai kanan: kelumpuhan/kelemahan -> **BELUM ADA**
- Tungkai kanan: kekuatan otot (0-5) -> **BELUM ADA**
- Tungkai kanan: gangguan rasa raba -> **BELUM ADA**
- Tungkai kiri: kelumpuhan/kelemahan -> **BELUM ADA**
- Tungkai kiri: kekuatan otot (0-5) -> **BELUM ADA**
- Tungkai kiri: gangguan rasa raba -> **BELUM ADA**
- Lengan kanan: kelumpuhan/kelemahan -> **BELUM ADA**
- Lengan kanan: kekuatan otot (0-5) -> **BELUM ADA**
- Lengan kanan: gangguan rasa raba -> **BELUM ADA**
- Lengan kiri: kelumpuhan/kelemahan -> **BELUM ADA**
- Lengan kiri: kekuatan otot (0-5) -> **BELUM ADA**
- Lengan kiri: gangguan rasa raba -> **BELUM ADA**
- Lain-lain (muka, leher, dll) -> **PARSIAL** (`Lokasi kelumpuhan` ada sebagai teks bebas, tetapi tidak sedetail tabel manual)
- Asimetris -> **ADA**

## Riwayat kontak/perjalanan
- Bepergian ke luar kabupaten/provinsi/negeri dalam 35 hari terakhir -> **BELUM ADA**
- Lokasi -> **BELUM ADA**
- Tanggal pergi -> **BELUM ADA**
- Kontak dengan anak yang baru mendapat imunisasi polio oral dalam 75 hari terakhir -> **BELUM ADA**

## Sanitasi dasar
- Memiliki jamban sendiri di rumah -> **BELUM ADA**
- Jenis jamban -> **BELUM ADA**
- Selalu menggunakan jamban untuk BAB -> **BELUM ADA**
- Jamban dengan saluran pembuangan kedap dan aman -> **BELUM ADA**
- Cara pembuangan diapers/popok -> **BELUM ADA**

## Status imunisasi polio
- Jumlah dosis OPV imunisasi rutin -> **PARSIAL** (dapat direkam pada tabel `Riwayat Imunisasi`, belum sebagai field ringkas jumlah dosis)
- Jumlah dosis IPV imunisasi rutin -> **PARSIAL**
- Jumlah dosis Hexavalen imunisasi rutin -> **PARSIAL**
- Sumber informasi imunisasi rutin -> **PARSIAL**
- Imunisasi tambahan: Crash program/Sub-PIN/PIN -> **BELUM ADA**
- Jumlah dosis OPV imunisasi tambahan -> **BELUM ADA**
- Jumlah dosis IPV imunisasi tambahan -> **BELUM ADA**
- Sumber informasi imunisasi tambahan -> **BELUM ADA**
- Tanggal imunisasi polio terakhir OPV -> **BELUM ADA**
- Tanggal imunisasi polio terakhir IPV -> **BELUM ADA**
- Tanggal imunisasi polio terakhir Hexavalen -> **BELUM ADA**

## Pengumpulan spesimen
- Spesimen I tanggal ambil -> **PARSIAL** (`Tanggal tinja 1`)
- Spesimen I tanggal kirim kab/kota ke provinsi -> **BELUM ADA**
- Spesimen I tanggal kirim provinsi ke lab -> **BELUM ADA**
- Spesimen II tanggal ambil -> **PARSIAL** (`Tanggal tinja 2`)
- Spesimen II tanggal kirim kab/kota ke provinsi -> **BELUM ADA**
- Spesimen II tanggal kirim provinsi ke lab -> **BELUM ADA**
- Alasan tidak diambil spesimen -> **BELUM ADA**
- Kondisi spesimen baik -> **ADA**
- Hasil pemeriksaan -> **BELUM ADA**

## Follow up / hasil akhir
- Tanggal follow up 60 hari -> **ADA**
- Masih ada kelumpuhan -> **ADA**

## Verifikasi dokter/petugas
- Petugas investigasi nama -> **PARSIAL** (`Nama Petugas`)
- No. Telp/HP petugas -> **PARSIAL** (`No Whatsapp Petugas`)
- Diagnosis -> **BELUM ADA**
- Nama dokter -> **BELUM ADA**
- No. Telp./HP dokter -> **BELUM ADA**

---

# Ringkasan prioritas gap terbesar

## Gap paling besar
1. **TN**
2. **AFP**
3. **PERT**
4. **DIF**
5. **MR**

## Quick wins yang paling penting
- **MR**: field KLB + imunisasi MR spesifik (BIAS/MMR/imunisasi tambahan)
- **DIF**: identitas wali lengkap + riwayat berobat non-RS/non-Puskesmas
- **PERT**: outcome, rawat inap detail, perjalanan, spesimen lain
- **TN**: ANC, detail persalinan, detail Td ibu, respon kasus, indikator cakupan
- **AFP**: riwayat awal sakit, rudapaksa, pemeriksaan neurologis detail, sanitasi, logistik spesimen, imunisasi tambahan polio
