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

# (opsional) deploy baru jika diperlukan
# clasp deploy --description "prod/webapp"
```

> Catatan: detail command deploy bisa berbeda tergantung state deployment lama. Gunakan `clasp deployments` dulu sebelum deploy baru.

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
