# Deployment & Operasional (clasp)

## Prasyarat
- `node` + `npm`
- `clasp` terpasang (`clasp --version`)
- Sudah login:
  - `clasp login --no-localhost`

## Struktur Lokal
- Root project:
  - `./`
- Source GAS:
  - `src/`
- Dokumentasi:
  - `docs/`

## Workflow Harian
Dari folder `src`:

```bash
cd src

# cek status perubahan
clasp status

# push kode lokal ke Apps Script
clasp push

# pull update dari server
clasp pull
```

## Buat Versi & Deploy Web App
```bash
cd src

# buat version snapshot
clasp version "update: <catatan perubahan>"

# lihat deployment aktif
clasp deployments

# deploy baru jika benar-benar butuh URL baru
clasp deploy --description "prod/webapp"
```

## Deployment Produksi Saat Ini
- **Web App URL produksi:**
  - `https://script.google.com/macros/s/AKfycbzAiozqZDZ2XYrr9nnuEtyHJaLMo4fsOJAIdUH-rSGbovriD77myFzdAB8LH_P5KL7V/exec`
- **Deployment ID yang dipakai aplikasi:**
  - `AKfycbzAiozqZDZ2XYrr9nnuEtyHJaLMo4fsOJAIdUH-rSGbovriD77myFzdAB8LH_P5KL7V`
- **Versi terbaru yang sudah dideploy:**
  - `238`
- **Deskripsi deployment versi 238:**
  - `Expand PD3I forms from blueprint and field-gap matrix`

## Redeploy Tanpa Ganti URL
Kalau aplikasi sudah hardcoded ke URL produksi yang ada, **jangan bikin deployment baru** kecuali memang ingin URL baru. Gunakan redeploy ke deployment ID yang sama:

```bash
cd src

# 1) push source terbaru
clasp push -f

# 2) buat version snapshot baru
clasp version "<catatan perubahan>"

# 3) cek nomor version terbaru
clasp versions | tail -n 10

# 4) redeploy ke deployment produksi yang sama (URL tetap)
clasp deploy \
  -i AKfycbzAiozqZDZ2XYrr9nnuEtyHJaLMo4fsOJAIdUH-rSGbovriD77myFzdAB8LH_P5KL7V \
  -V <nomor_version_baru> \
  -d "<catatan perubahan>"
```

> Catatan: untuk project ini, pola yang aman adalah **redeploy ke deployment produksi yang sama**, bukan membuat URL web app baru setiap kali update.

## Konfigurasi Runtime (PropertiesService)
Konfigurasi sensitif dikelola backend (`Config_Manager`), bukan hardcode:
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`
- `SPREADSHEET_ID`
- `CACHE_TTL_SEC`
- `SESSION_TTL_ADMIN`
- `SESSION_TTL_PETUGAS`
- `SESSION_TTL_VIEWER`

Set melalui fungsi backend `setupConfig(token, configMap)` dengan role admin.

## Verifikasi Pasca Deploy
1. Login aplikasi berhasil (`authLogin`).
2. Simpan form baru berhasil + EPID terbentuk.
3. Link print bisa dibuka (`action=print`).
4. Untuk MR: cek status notifikasi/sinkronisasi di row hasil simpan.
5. Cek `AUDIT_LOG` terisi untuk INSERT/UPDATE.

## Rollback Cepat
Jika perlu rollback, pakai versi deployment sebelumnya:
1. `clasp versions` untuk melihat daftar versi.
2. Redeploy ke versi stabil sebelumnya melalui Apps Script Deployments UI atau `clasp` sesuai kebutuhan.
