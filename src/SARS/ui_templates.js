/************************************
 *  TEMPLATE HTML BARIS KASUS
 ************************************/

/**
 * Generate 1 baris kasus default utk tiap jenis penyakit
 * Dipakai di index.html via: <?!= generateCaseRow('afp', false) ?>
 */
function generateCaseRow(diseaseKey, isPenolong) {
  var placeholders = {
    afp: {
      nama: "Contoh: Andi",
      ortu: "Contoh: Budi",
      gejala: "Contoh: lumpuh layuh mendadak",
      diag: "Contoh: AFP klinis",
      alamat: "Alamat lengkap & nomor telepon"
    },
    mr: {
      nama: "Contoh: Siti",
      ortu: "Contoh: Budi",
      gejala: "Contoh: demam, rash makulopapular",
      diag: "Contoh: Campak klinis",
      alamat: "Alamat lengkap & nomor telepon"
    },
    dif: {
      nama: "Contoh: Rina",
      ortu: "Contoh: Budi",
      gejala: "Contoh: pseudomembran, stridor",
      diag: "Contoh: Suspek Difteri",
      alamat: "Alamat lengkap & nomor telepon"
    },
    tn: {
      nama: "Contoh: Bayi A",
      ortu: "Contoh: Ibu Siti",
      gejala: "Contoh: mulut mencucu, kejang rangsang",
      diag: "Contoh: Suspek Tetanus Neonatorum",
      alamat: "Alamat ibu & nomor telepon"
    },
    pert: {
      nama: "Contoh: Anak A",
      ortu: "Contoh: Ibu Siti",
      gejala: "Contoh: batuk rejan, apnea, muntah",
      diag: "Contoh: Suspek Pertusis",
      alamat: "Alamat lengkap & nomor telepon"
    }
  };

  var ph = placeholders[diseaseKey] || placeholders.mr;

  var nameLabel  = (diseaseKey === 'tn') ? 'Nama Bayi' : 'Nama Kasus';
  var ortuLabel  = (diseaseKey === 'tn') ? 'Nama Ibu'  : 'Nama Orang Tua/Wali';

  var imunisasiLabel =
    diseaseKey === 'afp' ? 'Status Imunisasi (Polio)' :
    diseaseKey === 'mr'  ? 'Status Imunisasi (Campak Rubela)' :
    diseaseKey === 'dif' ? 'Status Imunisasi (DPT/DT/Td)' :
    diseaseKey === 'tn'  ? 'Status Imunisasi (TT Ibu)' :
                           'Status Imunisasi (DPT)';

  var tglMulaiLabel =
    diseaseKey === 'afp' ? 'Tgl MULAI Lumpuh' :
    diseaseKey === 'mr'  ? 'Tgl MULAI Rash' :
                           'Tgl MULAI Sakit';

  var spesimenField = isPenolong
    ? '<div class="pd3i-sars-col-1">' +
        '<label>Penolong Persalinan</label>' +
        '<input type="text" name="penolong" placeholder="Contoh: Bidan Desa">' +
        '<div class="pd3i-sars-help-text">* Isi "-" bila bukan bayi (Pertusis)</div>' +
      '</div>'
    : '<div class="pd3i-sars-col-1">' +
        '<label>Spesimen</label>' +
        '<select name="spesimen">' +
          '<option value="">Pilih</option>' +
          '<option value="YA">YA</option>' +
          '<option value="Tidak">Tidak</option>' +
        '</select>' +
      '</div>';

  var html =
'<div class="pd3i-sars-case-row">' +
'  <button type="button" class="pd3i-sars-remove-btn" onclick="removeRow(this)">Hapus</button>' +

'  <div class="pd3i-sars-row">' +
'    <div class="pd3i-sars-col-2">' +
'      <label>' + nameLabel + '</label>' +
'      <input type="text" name="nama" placeholder="' + ph.nama + '">' +
'    </div>' +
'    <div class="pd3i-sars-col-1">' +
'      <label>Tanggal Lahir</label>' +
'      <input type="date" name="tglLahir">' +
'    </div>' +
'    <div class="pd3i-sars-col-1">' +
'      <label>Jenis Kelamin</label>' +
'      <select name="jk">' +
'        <option value="">Pilih</option>' +
'        <option value="L">Laki-laki</option>' +
'        <option value="P">Perempuan</option>' +
'      </select>' +
'    </div>' +
'  </div>' +

'  <div class="pd3i-sars-row">' +
'    <div class="pd3i-sars-col-2">' +
'      <label>' + ortuLabel + '</label>' +
'      <input type="text" name="namaOrtu" placeholder="' + ph.ortu + '">' +
'    </div>' +
'    <div class="pd3i-sars-col-3">' +
'      <label>Alamat & No Telp</label>' +
'      <input type="text" name="alamat" placeholder="' + ph.alamat + '">' +
'    </div>' +
'    <div class="pd3i-sars-col-1">' +
'      <label>' + tglMulaiLabel + '</label>' +
'      <input type="date" name="tglMulai">' +
'    </div>' +
'  </div>' +

'  <div class="pd3i-sars-row">' +
'    <div class="pd3i-sars-col-2">' +
'      <label>Gejala yang Muncul</label>' +
'      <input type="text" name="gejala" placeholder="' + ph.gejala + '">' +
'    </div>' +
'    <div class="pd3i-sars-col-2">' +
'      <label>' + imunisasiLabel + '</label>' +
'      <input type="text" name="imunisasi" placeholder="Contoh: lengkap / tidak lengkap">' +
'    </div>' +
'    <div class="pd3i-sars-col-1">' +
'      <label>Keadaan (H/M)</label>' +
'      <select name="keadaan">' +
'        <option value="">Pilih</option>' +
'        <option value="H">Hidup</option>' +
'        <option value="M">Meninggal</option>' +
'      </select>' +
'    </div>' +
       spesimenField +
'  </div>' +

'  <div class="pd3i-sars-row">' +
'    <div class="pd3i-sars-col-3">' +
'      <label>Diagnosis Medis/Banding</label>' +
'      <input type="text" name="diagnosis" placeholder="' + ph.diag + '">' +
'    </div>' +
'  </div>' +
'</div>';

  return html;
}
