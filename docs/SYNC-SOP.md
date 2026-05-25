# SYNC SOP — Apps Script ↔ Lokal ↔ GitHub

## Prinsip

Ada 3 sumber kode yang harus selalu sinkron:

1. **Apps Script (GAS server)** — versi live/deployed, di-pull/push via `clasp`
2. **Lokal (git repo)** — working copy di server
3. **GitHub (`github.com:hadi4us/gas-pe-pd3i`)** — remote backup & version control

## Alur Kerja Standar

### Setelah edit kode di lokal

```bash
cd /root/.openclaw/workspace/gas-pe-pd3i

# 1. Commit perubahan lokal
git add -A
git commit -m "deskripsi perubahan"

# 2. Push ke Apps Script (deploy ke server GAS)
cd src
clasp push
# Konfirmasi overwrite jika diminta

# 3. Push ke GitHub
cd ..
git push origin main
```

### Setelah edit langsung di Apps Script (online editor)

```bash
cd /root/.openclaw/workspace/gas-pe-pd3i

# 1. Pull dari Apps Script
cd src
clasp pull --force

# 2. Commit ke git
cd ..
git add -A
git commit -m "sync: pull from Apps Script server"

# 3. Push ke GitHub
git push origin main
```

### Setelah pull dari GitHub remote

```bash
cd /root/.openclaw/workspace/gas-pe-pd3i

# 1. Pull dari GitHub
git pull origin main

# 2. Push ke Apps Script
cd src
clasp push

# 3. Kembali ke repo root
cd ..
```

## Urutan Prioritas

| Situasi | Sumber kebenaran | Aksi |
|---|---|---|
| Edit di lokal | Lokal → GAS + GitHub | `clasp push` → `git push` |
| Edit di Apps Script | GAS → Lokal → GitHub | `clasp pull` → `git commit` → `git push` |
| Edit di GitHub (PR/remote) | GitHub → Lokal → GAS | `git pull` → `clasp push` |

## Checklist Sebelum Deploy

- [ ] `git status` — tidak ada perubahan yang tidak disengaja
- [ ] `clasp status` — tidak ada file yang tidak ter-sinkron
- [ ] Commit message jelas dan deskriptif
- [ ] Push berhasil ke Apps Script (`clasp push`)
- [ ] Push berhasil ke GitHub (`git push`)
- [ ] Verifikasi versi production di GAS (`clasp version`)

## Clasp Config

- Script ID: `1laS5GQZob0FQWsLdOGXdx6ea6iyxC7uHeaDE_wVl5rDV8fNQs-3jHUVu`
- Root: `src/`
- Config: `src/.clasp.json`
- Ignore: `.claspignore`

## Catatan

- Jangan pernah push langsung ke Apps Script tanpa commit ke git terlebih dahulu
- Jangan pernah pull dari Apps Script tanpa sinkron ke GitHub setelahnya
- File `.claspignore` dan `.clasp.json` hanya ada di git, tidak di-push ke Apps Script
