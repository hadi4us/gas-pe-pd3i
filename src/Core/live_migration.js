/**
 * One-off live spreadsheet migration for 2026-07-09.
 *
 * Run manually from Apps Script editor:
 *   runLiveSpreadsheetCleanup20260709
 *
 * This avoids Google Sheets API. It uses SpreadsheetApp from Apps Script runtime.
 * It backs up target sheets, trims Raw sheets to fields used by active PE forms +
 * required system/workflow columns, and migrates REF_USER to Gmail OTP schema.
 */

const LIVE_CLEANUP_20260709_TARGET_SHEETS_ = ['REF_USER', 'MR_Raw', 'DIF_Raw', 'AFP_Raw', 'PERT_Raw', 'TN_Raw'];

const LIVE_CLEANUP_20260709_SYSTEM_COLUMNS_ = [
  'ID Registrasi Kasus', 'Nomor EPID', 'DX',
  'Tanggal Input', 'Tanggal Update', 'Timestamp', 'Last Updated At', 'Diinput Oleh', 'Role Penginput',
  'Tahap Workflow Terakhir', 'Label Tahap Workflow Terakhir', 'Diupdate Oleh Tahap Terakhir',
  'Role Pengupdate Tahap Terakhir', 'Waktu Update Tahap Terakhir',
  'Status Verifikasi EPID', 'Tanggal Verifikasi EPID', 'Petugas Verifikator', 'Review Admin Terakhir', 'Catatan Verifikasi EPID',
  'Pemeriksaan Sampel Dilakukan', 'Jenis Sampel Diuji', 'Jam Pengambilan Spesimen', 'Nomor Sampel / Lab', 'Tanggal Hasil Sampel',
  'Hasil Pemeriksaan Sampel', 'Interpretasi Hasil Sampel',
  'Status Pasien/Kasus', 'Tanggal Update Status', 'Dasar Penetapan Status', 'Catatan Status Pasien', 'Riwayat Status Kasus',
  'Kecamatan Pengampu', 'Kelurahan Pengampu', 'KodeFaskes Pengampu', 'Puskesmas Pengampu',
  'Kepala Puskesmas Pengampu', 'Email Kapus Pengampu', 'Petugas Surveilans Pengampu', 'Email Petugas Pengampu',
  'SpreadsheetId Pengampu', 'SpreadsheetUrl Pengampu', 'Telegram Chat Id Pengampu',
  'Status Routing Pengampu', 'Status Notifikasi Pengampu', 'Reason Notifikasi Pengampu', 'Notified At Pengampu', 'Notified To Pengampu',
  'Status Sinkronisasi Pengampu', 'Reason Sinkronisasi Pengampu', 'Synced At Pengampu', 'Sync Target Pengampu',
  'Status Notifikasi Telegram', 'Reason Notifikasi Telegram', 'Telegram Notified At', 'Telegram Target', 'Telegram Retry Count',
  'Pipeline Fingerprint', 'Pipeline Last Run At',
  'Status Notifikasi Revisi Pengampu', 'Reason Notifikasi Revisi Pengampu', 'Revision Notified At Pengampu', 'Revision Notified To Pengampu',
  'Status Notifikasi Revisi Telegram', 'Reason Notifikasi Revisi Telegram', 'Revision Telegram Notified At', 'Revision Telegram Target',
  'Revision Notification Fingerprint', 'Revision Notification Last Run At',
  'Status Verifikasi Sebelumnya', 'Notifikasi Revisi Dibaca', 'Waktu Permintaan Revisi', 'Waktu Verifikasi Pending'
];

const LIVE_CLEANUP_20260709_COMMON_FIELDS_ = [
  'Sumber Laporan', 'Nama unit pelapor', 'Provinsi', 'Kab/Kota', 'Nama Petugas', 'No Whatsapp Petugas',
  'Email Petugas', 'Tanggal terima laporan', 'Tanggal Pelacakan', 'Nomor EPID', 'NIK', 'Nama', 'JK',
  'Tanggal Lahir', 'Umur (auto)', 'Nama Orang Tua/Wali', 'No HP Orang Tua/Wali', 'Alamat Lengkap',
  'Kecamatan', 'Kelurahan', 'RT', 'RW', 'Latitude', 'Longitude', 'Nama Fasyankes', 'Jenis Fasyankes',
  'Kecamatan Fasyankes', 'Kelurahan Fasyankes', 'Tanggal Mulai Sakit', 'Tanggal Berobat', 'Tanggal Masuk RS',
  'Tanggal Keluar RS', 'Dirawat', 'Nama RS', 'Keadaan Akhir', 'Tanggal Meninggal', 'Diagnosis Klinis',
  'Riwayat Kontak', 'Riwayat Perjalanan', 'Catatan PE'
];

const LIVE_CLEANUP_20260709_DX_FIELDS_ = {
  MR: [
    'Gejala demam', 'Tanggal mulai demam', 'Gejala ruam', 'Tanggal mulai ruam', 'Batuk', 'Pilek', 'Mata merah',
    'Koplik spot', 'Diare', 'Pneumonia', 'Ensefalitis', 'Gizi buruk', 'Komplikasi lain', 'Status imunisasi MR',
    'Jumlah dosis MR', 'Tanggal imunisasi MR terakhir', 'Sumber informasi imunisasi MR', 'Riwayat imunisasi campak',
    'Riwayat imunisasi rubella', 'Spesimen serum diambil', 'Tanggal ambil serum', 'Spesimen urine diambil',
    'Tanggal ambil urine', 'Klasifikasi akhir MR'
  ],
  DIF: [
    'Sakit tenggorokan', 'Demam', 'Pseudomembran', 'Lokasi pseudomembran', 'Leher bengkak', 'Sesak napas',
    'Stridor', 'Miokarditis', 'Neuritis', 'Status imunisasi DPT', 'Jumlah dosis DPT', 'Tanggal imunisasi DPT terakhir',
    'Sumber informasi imunisasi DPT', 'Spesimen swab diambil', 'Tanggal ambil swab', 'Antibiotik diberikan',
    'Tanggal mulai antibiotik', 'ADS diberikan', 'Tanggal pemberian ADS', 'Klasifikasi akhir DIF'
  ],
  AFP: [
    'Tanggal mulai lumpuh', 'Kelumpuhan akut', 'Kelumpuhan flaksid', 'Lokasi kelumpuhan', 'Asimetris',
    'Demam sebelum lumpuh', 'Refleks menurun', 'Gangguan sensorik', 'Status imunisasi polio', 'Jumlah dosis OPV',
    'Jumlah dosis IPV', 'Tanggal imunisasi polio terakhir', 'Spesimen tinja 1 diambil', 'Tanggal ambil tinja 1',
    'Spesimen tinja 2 diambil', 'Tanggal ambil tinja 2', 'Kunjungan ulang 60 hari', 'Residual paralysis',
    'Klasifikasi akhir AFP'
  ],
  PERT: [
    'Batuk', 'Tanggal mulai batuk', 'Batuk paroksismal', 'Whoop', 'Muntah setelah batuk', 'Apnea', 'Sianosis',
    'Pneumonia', 'Kejang', 'Status imunisasi pertusis', 'Jumlah dosis pertusis', 'Tanggal imunisasi pertusis terakhir',
    'Sumber informasi imunisasi pertusis', 'Spesimen nasofaring diambil', 'Tanggal ambil spesimen nasofaring',
    'Antibiotik diberikan', 'Tanggal mulai antibiotik pertusis', 'Klasifikasi akhir PERT'
  ],
  TN: [
    'Umur bayi saat sakit', 'Tanggal mulai gejala TN', 'Kesulitan menyusu', 'Mulut mencucu', 'Kaku otot', 'Kejang',
    'Riwayat persalinan', 'Penolong persalinan', 'Tempat persalinan', 'Alat potong tali pusat', 'Perawatan tali pusat',
    'Status imunisasi TT/Td ibu', 'Jumlah dosis TT/Td ibu', 'Tanggal TT/Td terakhir ibu', 'Status akhir TN'
  ]
};


const LIVE_CLEANUP_20260709_EXACT_RAW_HEADERS_ = {
  MR: ["ID Registrasi Kasus","Nomor EPID","DX","Tanggal Input","Tanggal Update","Timestamp","Last Updated At","Diinput Oleh","Role Penginput","Tahap Workflow Terakhir","Label Tahap Workflow Terakhir","Diupdate Oleh Tahap Terakhir","Role Pengupdate Tahap Terakhir","Waktu Update Tahap Terakhir","Sumber Laporan","Nama unit pelapor","Provinsi","Kab/Kota","Nama Petugas","No Whatsapp Petugas","Email Petugas","Tanggal terima laporan","Tanggal Pelacakan","NIK","Nama","JK","Tanggal Lahir","Umur (auto)","Kelompok Umur Epidemiologis","Nama orang tua/wali","No. kontak orang tua/wali","Apakah sekolah/bekerja?","Kelas Saat Ini","Nama sekolah/tempat bekerja","Tinggi Badan (cm)","Berat Badan (kg)","Alamat","RT","RW","Provinsi Pasien","Kab/Kota Pasien","Kecamatan","Kelurahan","Latitude","Longitude","Ambil Lokasi","Kasus KLB","KLB ke","Nomor KLB","Demam?","Tanggal mulai demam","Ruam Makulopapular?","Tanggal mulai ruam","Batuk","Pilek","Mata merah","Arthralgia","Bagian Sendi","Adenopathy","Lokasi Adenopathy","Kehamilan","Umur kehamilan","Gejala lain","Sebutkan gejala lain","Diare","Bronchopneumonia","Kebutaan","Otitis media","Pneumonia","Encephalitis","Malnutrisi","Ulkus mukosa mulut","Lainnya komplikasi","Sebutkan komplikasi lain","Apakah dirawat inap?","Nama Rumah Sakit","Nomor Rekam Medik","Tanggal Masuk Rawat Inap","Status Pasien Rawat Inap","Tanggal Pulang","Pemberian Vitamin A","Ada kasus serupa di lingkungan","Jumlah kasus sekitar","Riwayat perjalanan 7-21 hari","Lokasi perjalanan","Tanggal pergi","Tanggal pulang perjalanan","Riwayat kontak kasus serupa","Riwayat kunjungan fasilitas kesehatan","Cluster/kejadian luar biasa","Apakah spesimen darah diambil","Jenis Sampel Darah","Tanggal ambil spesimen darah","Tanggal pengiriman spesimen darah ke lab","Apakah spesimen lain diambil","Jenis Sampel Lain","Tanggal ambil spesimen lain","Tanggal pengiriman spesimen lain ke lab","Status akhir kasus","Tanggal meninggal","Penyebab kematian","Status Verifikasi EPID","Tanggal Verifikasi EPID","Petugas Verifikator","Review Admin Terakhir","Catatan Verifikasi EPID","Pemeriksaan Sampel Dilakukan","Jenis Sampel Diuji","Jam Pengambilan Spesimen","Nomor Sampel / Lab","Tanggal Hasil Sampel","Hasil Pemeriksaan Sampel","Interpretasi Hasil Sampel","Status Pasien/Kasus","Tanggal Update Status","Dasar Penetapan Status","Catatan Status Pasien","Riwayat Status Kasus","Kecamatan Pengampu","Kelurahan Pengampu","KodeFaskes Pengampu","Puskesmas Pengampu","Kepala Puskesmas Pengampu","Email Kapus Pengampu","Petugas Surveilans Pengampu","Email Petugas Pengampu","SpreadsheetId Pengampu","SpreadsheetUrl Pengampu","Telegram Chat Id Pengampu","Status Routing Pengampu","Status Notifikasi Pengampu","Reason Notifikasi Pengampu","Notified At Pengampu","Notified To Pengampu","Status Sinkronisasi Pengampu","Reason Sinkronisasi Pengampu","Synced At Pengampu","Sync Target Pengampu","Status Notifikasi Telegram","Reason Notifikasi Telegram","Telegram Notified At","Telegram Target","Telegram Retry Count","Pipeline Fingerprint","Pipeline Last Run At","Status Notifikasi Revisi Pengampu","Reason Notifikasi Revisi Pengampu","Revision Notified At Pengampu","Revision Notified To Pengampu","Status Notifikasi Revisi Telegram","Reason Notifikasi Revisi Telegram","Revision Telegram Notified At","Revision Telegram Target","Revision Notification Fingerprint","Revision Notification Last Run At","Status Verifikasi Sebelumnya","Notifikasi Revisi Dibaca","Waktu Permintaan Revisi","Waktu Verifikasi Pending","Riwayat Imunisasi"],
  DIF: ["ID Registrasi Kasus","Nomor EPID","DX","Tanggal Input","Tanggal Update","Timestamp","Last Updated At","Diinput Oleh","Role Penginput","Tahap Workflow Terakhir","Label Tahap Workflow Terakhir","Diupdate Oleh Tahap Terakhir","Role Pengupdate Tahap Terakhir","Waktu Update Tahap Terakhir","Sumber Laporan","Nama unit pelapor","Provinsi","Kab/Kota","Nama Petugas","No Whatsapp Petugas","Email Petugas","Tanggal terima laporan","Tanggal Pelacakan","NIK","Nama","JK","Tanggal Lahir","Umur (auto)","Kelompok Umur Epidemiologis","Nama orang tua/wali","No. kontak orang tua/wali","Apakah sekolah/bekerja?","Kelas Saat Ini","Nama sekolah/tempat bekerja","Tinggi Badan (cm)","Berat Badan (kg)","Alamat","RT","RW","Provinsi Pasien","Kab/Kota Pasien","Kecamatan","Kelurahan","Latitude","Longitude","Ambil Lokasi","No. kontak pasien","Orang tua/Wali/Saudara dekat","No. Telepon Wali","Alamat Lengkap Wali","Desa/Kelurahan Wali","Kecamatan Wali","Kab/Kota Wali","Provinsi Wali","Pekerjaan","Alamat tempat kerja","Tanggal mulai sakit","Keluhan Utama","Demam","Tanggal mulai demam","Sakit tenggorokan?","Tanggal sakit tenggorokan","Bull neck","Tanggal leher bengkak","Sesak nafas?","Tanggal sesak nafas","Pseudomembran?","Tanggal pseudomembran","Lokasi pseudomembran","Gejala lain DIF","Status Gizi","Swab diambil?","Lokasi ambil swab","Tanggal ambil swab","No Kode Spesimen","Tanggal kirim swab","Rawat inap?","Berobat ke RS?","Tanggal berobat RS","Tracheostomi","Berobat ke Puskesmas?","Tanggal berobat Puskesmas","Berobat ke Dokter Swasta?","Tanggal berobat Dokter Swasta","Berobat ke Perawat/Bidan?","Tanggal berobat Perawat/Bidan","Tidak berobat","Diagnosis suspek difteri","Tanggal diagnosis suspek","Antibiotik diberikan?","Jenis antibiotik","Tanggal antibiotik","ADS diberikan?","Dosis ADS (IU)","Tanggal ADS","Alasan tidak ADS","Obat lain DIF","Kondisi kasus saat ini","Tanggal sembuh DIF","Tanggal meninggal DIF","Riwayat perjalanan 10 hari","Daerah perjalanan DIF","Riwayat kontak suspek/konfirmasi difteri","Nama alamat kontak DIF","Status Verifikasi EPID","Tanggal Verifikasi EPID","Petugas Verifikator","Review Admin Terakhir","Catatan Verifikasi EPID","Pemeriksaan Sampel Dilakukan","Jenis Sampel Diuji","Jam Pengambilan Spesimen","Nomor Sampel / Lab","Tanggal Hasil Sampel","Hasil Pemeriksaan Sampel","Interpretasi Hasil Sampel","Status Pasien/Kasus","Tanggal Update Status","Dasar Penetapan Status","Catatan Status Pasien","Riwayat Status Kasus","Kecamatan Pengampu","Kelurahan Pengampu","KodeFaskes Pengampu","Puskesmas Pengampu","Kepala Puskesmas Pengampu","Email Kapus Pengampu","Petugas Surveilans Pengampu","Email Petugas Pengampu","SpreadsheetId Pengampu","SpreadsheetUrl Pengampu","Telegram Chat Id Pengampu","Status Routing Pengampu","Status Notifikasi Pengampu","Reason Notifikasi Pengampu","Notified At Pengampu","Notified To Pengampu","Status Sinkronisasi Pengampu","Reason Sinkronisasi Pengampu","Synced At Pengampu","Sync Target Pengampu","Status Notifikasi Telegram","Reason Notifikasi Telegram","Telegram Notified At","Telegram Target","Telegram Retry Count","Pipeline Fingerprint","Pipeline Last Run At","Status Notifikasi Revisi Pengampu","Reason Notifikasi Revisi Pengampu","Revision Notified At Pengampu","Revision Notified To Pengampu","Status Notifikasi Revisi Telegram","Reason Notifikasi Revisi Telegram","Revision Telegram Notified At","Revision Telegram Target","Revision Notification Fingerprint","Revision Notification Last Run At","Status Verifikasi Sebelumnya","Notifikasi Revisi Dibaca","Waktu Permintaan Revisi","Waktu Verifikasi Pending"],
  AFP: ["ID Registrasi Kasus","Nomor EPID","DX","Tanggal Input","Tanggal Update","Timestamp","Last Updated At","Diinput Oleh","Role Penginput","Tahap Workflow Terakhir","Label Tahap Workflow Terakhir","Diupdate Oleh Tahap Terakhir","Role Pengupdate Tahap Terakhir","Waktu Update Tahap Terakhir","Sumber Laporan","Nama unit pelapor","Provinsi","Kab/Kota","Nama Petugas","No Whatsapp Petugas","Email Petugas","Tanggal terima laporan","Tanggal Pelacakan","NIK","Nama","JK","Tanggal Lahir","Umur (auto)","Kelompok Umur Epidemiologis","Nama orang tua/wali","No. kontak orang tua/wali","Apakah sekolah/bekerja?","Kelas Saat Ini","Nama sekolah/tempat bekerja","Tinggi Badan (cm)","Berat Badan (kg)","Alamat","RT","RW","Provinsi Pasien","Kab/Kota Pasien","Kecamatan","Kelurahan","Latitude","Longitude","Ambil Lokasi","Tanggal mulai sakit/gejala awal","Tgl mulai lumpuh","Sifat akut","Lumpuh layuh","Asimetris","Demam saat onset","Rudapaksa AFP","Pengobatan tradisional AFP","Nama tempat pengobatan tradisional AFP","Tanggal berkunjung pengobatan tradisional AFP","Berobat ke Rumah Sakit AFP","Nama Rumah Sakit","Tanggal berobat AFP","Diagnosis AFP","Nomor Rekam Medik","Tanggal meninggal AFP","Tungkai kanan lumpuh","Tungkai kanan kekuatan","Tungkai kanan rasa raba","Tungkai kiri lumpuh","Tungkai kiri kekuatan","Tungkai kiri rasa raba","Lengan kanan lumpuh","Lengan kanan kekuatan","Lengan kanan rasa raba","Lengan kiri lumpuh","Lengan kiri kekuatan","Lengan kiri rasa raba","Lokasi kelumpuhan","Perjalanan 35 hari AFP","Lokasi perjalanan AFP","Tanggal pergi AFP","Kontak OPV 75 hari AFP","Punya jamban sendiri","Jenis jamban","Jenis jamban lainnya","Selalu pakai jamban","Jamban aman","Pembuangan diapers","Pembuangan diapers lainnya","Dosis OPV rutin","Dosis IPV rutin","Dosis Hexavalen rutin","Sumber info imunisasi rutin AFP","Program imunisasi tambahan AFP","Dosis OPV tambahan AFP","Dosis IPV tambahan AFP","Sumber info imunisasi tambahan AFP","Tanggal OPV terakhir AFP","Tanggal IPV terakhir AFP","Tanggal Hexavalen terakhir AFP","Spesimen tinja 1 diambil?","Tanggal tinja 1","Tanggal kirim tinja 1 kab-prov","Tanggal kirim tinja 1 prov-lab","Spesimen tinja 2 diambil?","Tanggal tinja 2","Tanggal kirim tinja 2 kab-prov","Tanggal kirim tinja 2 prov-lab","Alasan tidak diambil spesimen AFP","Kondisi spesimen baik","Hasil pemeriksaan AFP","Nama dokter AFP","No. Telp dokter AFP","Tanggal follow up 60 hari","Masih ada kelumpuhan","Status Verifikasi EPID","Tanggal Verifikasi EPID","Petugas Verifikator","Review Admin Terakhir","Catatan Verifikasi EPID","Pemeriksaan Sampel Dilakukan","Jenis Sampel Diuji","Jam Pengambilan Spesimen","Nomor Sampel / Lab","Tanggal Hasil Sampel","Hasil Pemeriksaan Sampel","Interpretasi Hasil Sampel","Status Pasien/Kasus","Tanggal Update Status","Dasar Penetapan Status","Catatan Status Pasien","Riwayat Status Kasus","Kecamatan Pengampu","Kelurahan Pengampu","KodeFaskes Pengampu","Puskesmas Pengampu","Kepala Puskesmas Pengampu","Email Kapus Pengampu","Petugas Surveilans Pengampu","Email Petugas Pengampu","SpreadsheetId Pengampu","SpreadsheetUrl Pengampu","Telegram Chat Id Pengampu","Status Routing Pengampu","Status Notifikasi Pengampu","Reason Notifikasi Pengampu","Notified At Pengampu","Notified To Pengampu","Status Sinkronisasi Pengampu","Reason Sinkronisasi Pengampu","Synced At Pengampu","Sync Target Pengampu","Status Notifikasi Telegram","Reason Notifikasi Telegram","Telegram Notified At","Telegram Target","Telegram Retry Count","Pipeline Fingerprint","Pipeline Last Run At","Status Notifikasi Revisi Pengampu","Reason Notifikasi Revisi Pengampu","Revision Notified At Pengampu","Revision Notified To Pengampu","Status Notifikasi Revisi Telegram","Reason Notifikasi Revisi Telegram","Revision Telegram Notified At","Revision Telegram Target","Revision Notification Fingerprint","Revision Notification Last Run At","Status Verifikasi Sebelumnya","Notifikasi Revisi Dibaca","Waktu Permintaan Revisi","Waktu Verifikasi Pending"],
  PERT: ["ID Registrasi Kasus","Nomor EPID","DX","Tanggal Input","Tanggal Update","Timestamp","Last Updated At","Diinput Oleh","Role Penginput","Tahap Workflow Terakhir","Label Tahap Workflow Terakhir","Diupdate Oleh Tahap Terakhir","Role Pengupdate Tahap Terakhir","Waktu Update Tahap Terakhir","Sumber Laporan","Nama unit pelapor","Provinsi","Kab/Kota","Nama Petugas","No Whatsapp Petugas","Email Petugas","Tanggal terima laporan","Tanggal Pelacakan","NIK","Nama","JK","Tanggal Lahir","Umur (auto)","Kelompok Umur Epidemiologis","Nama orang tua/wali","No. kontak orang tua/wali","Apakah sekolah/bekerja?","Kelas Saat Ini","Nama sekolah/tempat bekerja","Tinggi Badan (cm)","Berat Badan (kg)","Alamat","RT","RW","Provinsi Pasien","Kab/Kota Pasien","Kecamatan","Kelurahan","Latitude","Longitude","Ambil Lokasi","Tanggal mulai batuk","Batuk terus menerus?","Batuk ≥ 2 minggu?","Whoop","Muntah setelah batuk","Apnea","Tanggal mulai apnea","Gejala lain pertusis","Rawat inap?","Nama Rumah Sakit","Nomor Rekam Medik","Tanggal Masuk Rawat Inap","Tanggal Keluar","Kontak batuk lama","Ada klaster/kejadian serupa","Jumlah kasus sekitar PERT","Perjalanan 1 bulan PERT","Lokasi perjalanan PERT","Tanggal pergi PERT","Tanggal kembali PERT","Spesimen pertusis diambil?","Tanggal ambil spesimen pertusis","Jenis spesimen pertusis","Tanggal kirim spesimen pertusis","Spesimen lain pertusis diambil?","Jenis spesimen lain pertusis","Tanggal ambil spesimen lain pertusis","Tanggal kirim spesimen lain pertusis","Status akhir PERT","Tanggal meninggal PERT","Status Verifikasi EPID","Tanggal Verifikasi EPID","Petugas Verifikator","Review Admin Terakhir","Catatan Verifikasi EPID","Pemeriksaan Sampel Dilakukan","Jenis Sampel Diuji","Jam Pengambilan Spesimen","Nomor Sampel / Lab","Tanggal Hasil Sampel","Hasil Pemeriksaan Sampel","Interpretasi Hasil Sampel","Status Pasien/Kasus","Tanggal Update Status","Dasar Penetapan Status","Catatan Status Pasien","Riwayat Status Kasus","Kecamatan Pengampu","Kelurahan Pengampu","KodeFaskes Pengampu","Puskesmas Pengampu","Kepala Puskesmas Pengampu","Email Kapus Pengampu","Petugas Surveilans Pengampu","Email Petugas Pengampu","SpreadsheetId Pengampu","SpreadsheetUrl Pengampu","Telegram Chat Id Pengampu","Status Routing Pengampu","Status Notifikasi Pengampu","Reason Notifikasi Pengampu","Notified At Pengampu","Notified To Pengampu","Status Sinkronisasi Pengampu","Reason Sinkronisasi Pengampu","Synced At Pengampu","Sync Target Pengampu","Status Notifikasi Telegram","Reason Notifikasi Telegram","Telegram Notified At","Telegram Target","Telegram Retry Count","Pipeline Fingerprint","Pipeline Last Run At","Status Notifikasi Revisi Pengampu","Reason Notifikasi Revisi Pengampu","Revision Notified At Pengampu","Revision Notified To Pengampu","Status Notifikasi Revisi Telegram","Reason Notifikasi Revisi Telegram","Revision Telegram Notified At","Revision Telegram Target","Revision Notification Fingerprint","Revision Notification Last Run At","Status Verifikasi Sebelumnya","Notifikasi Revisi Dibaca","Waktu Permintaan Revisi","Waktu Verifikasi Pending"],
  TN: ["ID Registrasi Kasus","Nomor EPID","DX","Tanggal Input","Tanggal Update","Timestamp","Last Updated At","Diinput Oleh","Role Penginput","Tahap Workflow Terakhir","Label Tahap Workflow Terakhir","Diupdate Oleh Tahap Terakhir","Role Pengupdate Tahap Terakhir","Waktu Update Tahap Terakhir","Sumber Laporan","Nama unit pelapor","Provinsi","Kab/Kota","Nama Petugas","No Whatsapp Petugas","Email Petugas","Tanggal terima laporan","Tanggal Pelacakan","NIK","Nama","JK","Tanggal Lahir","Umur (auto)","Kelompok Umur Epidemiologis","Nama orang tua/wali","No. kontak orang tua/wali","Apakah sekolah/bekerja?","Kelas Saat Ini","Nama sekolah/tempat bekerja","Tinggi Badan (cm)","Berat Badan (kg)","Alamat","RT","RW","Provinsi Pasien","Kab/Kota Pasien","Kecamatan","Kelurahan","Latitude","Longitude","Ambil Lokasi","Nama Ibu","Anak ke-","Usia ibu","Pekerjaan ibu","Pendidikan ibu","Lama tinggal di desa","Apakah bayi lahir hidup","Bayi menangis saat lahir","Tanda kelahiran hidup","Bayi bisa menyusu dengan baik","Mulut mencucu dan tidak bisa menyusu","Bayi mudah kejang","Tanggal mulai sakit","Apakah bayi dirawat","Tempat perawatan TN","Tanggal mulai dirawat TN","Keadaan bayi setelah dirawat","Tanggal meninggal TN","Umur bayi meninggal (hari)","Jumlah kunjungan ANC","Tempat pemeriksaan ibu hamil","Pemeriksa kehamilan","Pemeriksa kehamilan lainnya","Tempat persalinan","Tempat persalinan lainnya","Usia gestasi","Penolong persalinan","Penolong persalinan lainnya","Alat potong tali pusat","Alat potong tali pusat lainnya","Perawatan tali pusat","Perawatan tali pusat lainnya","Keadaan ibu saat ini","Sumber informasi imunisasi ibu","Td kehamilan ini","Jumlah Td kehamilan ini","Usia kehamilan Td1","Tanggal Td1 kehamilan ini","Usia kehamilan Td2","Tanggal Td2 kehamilan ini","Td kehamilan sebelumnya","Tanggal Td1 kehamilan sebelumnya","Tanggal Td2 kehamilan sebelumnya","Td calon pengantin","Tanggal Td calon pengantin","Riwayat DPT-HB-HiB 1 ibu","Riwayat DPT-HB-HiB 2 ibu","Riwayat DPT-HB-HiB 3 ibu","Riwayat DPT-HB-HiB 4 ibu","Riwayat DT kelas 1 ibu","Riwayat Td kelas 2 ibu","Riwayat Td kelas 5 ibu","Status T ibu","Status imunisasi TT/Td ibu","Vaksin Td saat investigasi","Tanggal vaksin Td saat investigasi","Cakupan DPT-HB-Hib 1","Cakupan DPT-HB-Hib 2","Cakupan DPT-HB-Hib 3","Cakupan DT Kelas 1","Cakupan Td kelas 2","Cakupan Td kelas 5","Cakupan TT 2+","Cakupan persalinan faskes","Cakupan KN1","Cakupan KN2","Cakupan KN3","Akses desa ke faskes","Faktor pelaksanaan imunisasi","Faktor pertolongan persalinan","Berat lahir","Riwayat kasus serupa di wilayah","Status akhir TN","Status Verifikasi EPID","Tanggal Verifikasi EPID","Petugas Verifikator","Review Admin Terakhir","Catatan Verifikasi EPID","Pemeriksaan Sampel Dilakukan","Jenis Sampel Diuji","Jam Pengambilan Spesimen","Nomor Sampel / Lab","Tanggal Hasil Sampel","Hasil Pemeriksaan Sampel","Interpretasi Hasil Sampel","Status Pasien/Kasus","Tanggal Update Status","Dasar Penetapan Status","Catatan Status Pasien","Riwayat Status Kasus","Kecamatan Pengampu","Kelurahan Pengampu","KodeFaskes Pengampu","Puskesmas Pengampu","Kepala Puskesmas Pengampu","Email Kapus Pengampu","Petugas Surveilans Pengampu","Email Petugas Pengampu","SpreadsheetId Pengampu","SpreadsheetUrl Pengampu","Telegram Chat Id Pengampu","Status Routing Pengampu","Status Notifikasi Pengampu","Reason Notifikasi Pengampu","Notified At Pengampu","Notified To Pengampu","Status Sinkronisasi Pengampu","Reason Sinkronisasi Pengampu","Synced At Pengampu","Sync Target Pengampu","Status Notifikasi Telegram","Reason Notifikasi Telegram","Telegram Notified At","Telegram Target","Telegram Retry Count","Pipeline Fingerprint","Pipeline Last Run At","Status Notifikasi Revisi Pengampu","Reason Notifikasi Revisi Pengampu","Revision Notified At Pengampu","Revision Notified To Pengampu","Status Notifikasi Revisi Telegram","Reason Notifikasi Revisi Telegram","Revision Telegram Notified At","Revision Telegram Target","Revision Notification Fingerprint","Revision Notification Last Run At","Status Verifikasi Sebelumnya","Notifikasi Revisi Dibaca","Waktu Permintaan Revisi","Waktu Verifikasi Pending"],
};

function runLiveSpreadsheetCleanup20260709() {
  const ss = getSpreadsheet_();
  const stamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'Etc/UTC', 'yyyyMMdd_HHmmss');
  const result = { spreadsheetId: ss.getId(), backupStamp: stamp, backups: [], raw: [], refUser: null };

  LIVE_CLEANUP_20260709_TARGET_SHEETS_.forEach(function(name) {
    const sh = ss.getSheetByName(name);
    if (!sh) throw new Error('Target sheet tidak ditemukan: ' + name);
    const backup = sh.copyTo(ss).setName('BACKUP_' + name + '_' + stamp);
    result.backups.push(backup.getName());
  });

  ['MR', 'DIF', 'AFP', 'PERT', 'TN'].forEach(function(dx) {
    result.raw.push(_cleanupRawSheet20260709_(ss, dx));
  });
  result.refUser = _cleanupRefUser20260709_(ss);

  Logger.log(JSON.stringify(result, null, 2));
  return result;
}

function previewLiveSpreadsheetCleanup20260709() {
  const ss = getSpreadsheet_();
  const result = { spreadsheetId: ss.getId(), raw: [], refUser: null };
  ['MR', 'DIF', 'AFP', 'PERT', 'TN'].forEach(function(dx) {
    const sh = ss.getSheetByName(dx + '_Raw');
    const headers = _getHeaders20260709_(sh);
    const keep = _rawKeepHeaders20260709_(dx, headers);
    result.raw.push({ sheet: dx + '_Raw', before: headers.length, after: keep.length, removed: headers.length - keep.length });
  });
  const ref = ss.getSheetByName('REF_USER');
  result.refUser = { beforeHeaders: _getHeaders20260709_(ref), afterHeaders: _refUserHeaders20260709_() };
  Logger.log(JSON.stringify(result, null, 2));
  return result;
}

function _cleanupRawSheet20260709_(ss, dx) {
  const name = dx + '_Raw';
  const sh = ss.getSheetByName(name);
  const values = sh.getDataRange().getValues();
  const headers = values[0].map(function(h) { return String(h || '').trim(); }).filter(String);
  const keepHeaders = _rawKeepHeaders20260709_(dx, headers);
  const index = {};
  headers.forEach(function(h, i) { index[h] = i; });
  const output = [keepHeaders];
  for (var r = 1; r < values.length; r++) {
    const row = values[r];
    if (!row.some(function(v) { return String(v || '').trim() !== ''; })) continue;
    output.push(keepHeaders.map(function(h) { return index[h] !== undefined ? row[index[h]] : ''; }));
  }
  sh.clearContents();
  sh.clearFormats();
  _resizeSheet20260709_(sh, output.length, keepHeaders.length);
  sh.getRange(1, 1, output.length, keepHeaders.length).setValues(output);
  sh.setFrozenRows(1);
  return { sheet: name, before: headers.length, after: keepHeaders.length, rows: output.length };
}

function _cleanupRefUser20260709_(ss) {
  const sh = ss.getSheetByName('REF_USER');
  const values = sh.getDataRange().getValues();
  const headers = values[0].map(function(h) { return String(h || '').trim(); });
  const idx = {};
  headers.forEach(function(h, i) { idx[h] = i; });
  const outHeaders = _refUserHeaders20260709_();
  const output = [outHeaders];
  let placeholderCount = 0;

  function get(row, names) {
    for (var i = 0; i < names.length; i++) {
      const ix = idx[names[i]];
      if (ix !== undefined && String(row[ix] || '').trim() !== '') return row[ix];
    }
    return '';
  }

  for (var r = 1; r < values.length; r++) {
    const row = values[r];
    if (!row.some(function(v) { return String(v || '').trim() !== ''; })) continue;
    const username = String(get(row, ['Username']) || get(row, ['Nama']) || '').trim();
    const oldEmail = String(get(row, ['Gmail', 'Email', 'EmailPetugas']) || '').trim().toLowerCase();
    let gmail = _toGmail20260709_(oldEmail, username);
    const catatan = [];
    const oldCat = String(get(row, ['Catatan Migrasi', 'Catatan']) || '').trim();
    if (oldCat) catatan.push(oldCat);
    if (!oldEmail) {
      placeholderCount++;
      catatan.push('Gmail placeholder dibuat dari username; wajib diverifikasi sebelum produksi.');
    } else if (oldEmail !== gmail) {
      catatan.push('Email lama dikonversi ke Gmail dari ' + oldEmail + '; wajib diverifikasi.');
    }
    catatan.push('Login OTP Gmail; PIN dihapus.');

    output.push([
      username,
      gmail,
      String(get(row, ['Nama']) || username).trim(),
      String(get(row, ['Role']) || 'petugas').trim().toLowerCase(),
      get(row, ['UnitKerja']),
      get(row, ['KodeFaskes']),
      String(get(row, ['ScopeLevel']) || 'puskesmas').trim().toLowerCase(),
      String(get(row, ['StatusAktif']) || 'AKTIF').trim().toUpperCase(),
      'OTP_GMAIL',
      gmail ? 'YA' : 'TIDAK',
      5,
      60,
      '',
      catatan.join(' | ')
    ]);
  }

  sh.clearContents();
  sh.clearFormats();
  _resizeSheet20260709_(sh, output.length, outHeaders.length);
  sh.getRange(1, 1, output.length, outHeaders.length).setValues(output);
  sh.setFrozenRows(1);
  return { sheet: 'REF_USER', rows: output.length, cols: outHeaders.length, placeholders: placeholderCount };
}

function _rawKeepHeaders20260709_(dx, headers) {
  const exact = LIVE_CLEANUP_20260709_EXACT_RAW_HEADERS_[dx] || [];
  const existing = {};
  headers.forEach(function(h) { existing[h] = true; });
  return exact.filter(function(h) { return existing[h]; });
}

function _getHeaders20260709_(sh) {
  if (!sh) return [];
  return sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(function(h) { return String(h || '').trim(); }).filter(String);
}

function _refUserHeaders20260709_() {
  return ['Username', 'Gmail', 'Nama', 'Role', 'UnitKerja', 'KodeFaskes', 'ScopeLevel', 'StatusAktif', 'LoginMethod', 'OtpEnabled', 'OtpTtlMinutes', 'OtpCooldownSeconds', 'LastLoginAt', 'Catatan'];
}

function _toGmail20260709_(email, username) {
  email = String(email || '').trim().toLowerCase();
  if (/@gmail\.com$/i.test(email)) return email;
  let local = email ? email.split('@')[0] : String(username || 'user');
  local = local.toLowerCase().replace(/^uptd\s+/, '').replace(/^pkm\s+/, 'pkm ').replace(/[^a-z0-9]+/g, '.').replace(/^\.+|\.+$/g, '');
  return (local || 'user') + '@gmail.com';
}

function _resizeSheet20260709_(sh, rows, cols) {
  rows = Math.max(1, rows);
  cols = Math.max(1, cols);
  if (sh.getMaxRows() < rows) sh.insertRowsAfter(sh.getMaxRows(), rows - sh.getMaxRows());
  if (sh.getMaxColumns() < cols) sh.insertColumnsAfter(sh.getMaxColumns(), cols - sh.getMaxColumns());
  if (sh.getMaxRows() > rows) sh.deleteRows(rows + 1, sh.getMaxRows() - rows);
  if (sh.getMaxColumns() > cols) sh.deleteColumns(cols + 1, sh.getMaxColumns() - cols);
}
