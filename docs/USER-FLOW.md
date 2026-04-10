# Diagram Alur Pengguna

## 1) Alur Utama Pengguna (End-to-End)

```mermaid
flowchart TD
    A[Mulai] --> B[User buka Web App]
    B --> C[Login: username + PIN]
    C --> D{Login valid?}
    D -- Tidak --> E[Tampilkan error login]
    E --> C
    D -- Ya --> F[Masuk ke Dashboard/Form]

    F --> G[Pilih DX: MR/DIF/PERT/TN/AFP]
    G --> H[Isi form kasus]
    H --> I[Submit]

    I --> J[Backend validasi session & role]
    J --> K[Simpan ke sheet DX_Raw]
    K --> L[Generate/validasi EPID]
    L --> M[Simpan link print]

    M --> N{DX = MR?}
    N -- Tidak --> O[Return sukses ke user]
    N -- Ya --> P[Routing pengampu dari REF_PENGAMPU]
    P --> Q[Kirim email pengampu]
    Q --> R[Sinkronisasi ke spreadsheet pengampu]
    R --> S[Kirim notifikasi Telegram]
    S --> T[Update status notifikasi/sinkronisasi di row MR]
    T --> O

    O --> U[User lihat hasil simpan + EPID]
    U --> V[Opsi: cari / edit / cetak PDF / dashboard]
    V --> W[Selesai]
```

## 2) Alur Pencarian & Edit Data

```mermaid
flowchart TD
    A[User buka fitur Search] --> B[Isi filter: EPID/Nama/Tgl Lahir/dll]
    B --> C[Backend searchRecords + pagination]
    C --> D[Tampilkan daftar hasil]
    D --> E[User pilih 1 kasus]
    E --> F[Load detail by EPID]
    F --> G[User edit data]
    G --> H[Submit update]
    H --> I[saveDxRecord update row existing]
    I --> J[Audit log UPDATE]
    J --> K[Tampilkan sukses]
```

## 3) Alur Cetak PDF

```mermaid
flowchart TD
    A[User klik Cetak] --> B[Generate URL print action=print]
    B --> C[Backend handlePrintRequest]
    C --> D{Token valid?}
    D -- Tidak --> E[Tampil pesan sesi habis]
    D -- Ya --> F[Ambil record by DX+EPID]
    F --> G[Render template print_MR]
    G --> H[Tampil halaman print]
    H --> I[Print/Save PDF]
```

## 4) Alur Dashboard

```mermaid
flowchart TD
    A[User buka Dashboard] --> B[Pilih DX + Tahun]
    B --> C[getDashboardStats]
    C --> D[Cache first: Cache_Manager]
    D --> E{Cache hit?}
    E -- Ya --> F[Gunakan data cache]
    E -- Tidak --> G[Baca sheet lalu simpan ke cache]
    F --> H[Hitung agregasi total/per kecamatan/per bulan]
    G --> H
    H --> I{DX = MR?}
    I -- Ya --> J[Tambahkan status notifikasi & sinkronisasi]
    I -- Tidak --> K[Agregasi standar]
    J --> L[Tampilkan dashboard]
    K --> L
```

## 5) Ringkasan Role Pengguna
- **Admin**: full akses + setup config + audit log + retry batch.
- **Petugas**: input/edit data operasional.
- **Viewer**: baca/lihat data terbatas (tanpa aksi tulis tertentu).
