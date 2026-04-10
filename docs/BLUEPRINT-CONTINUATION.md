# BLUEPRINT CONTINUATION — PD3I GAS Project

Dokumen ini adalah **panduan lanjut kerja** jika project terputus di tengah jalan.

---

## 1) Identitas Project

- **Project ID (Apps Script):** `1laS5GQZob0FQWsLdOGXdx6ea6iyxC7uHeaDE_wVl5rDV8fNQs-3jHUVu`
- **Workspace lokal:**
  - `projects/gas-1laS5GQZob0FQWsLdOGXdx6ea6iyxC7uHeaDE_wVl5rDV8fNQs-3jHUVu/`
- **Source utama:** `src/`
- **Dokumentasi:** `docs/`

---

## 2) Status Terakhir (Checkpoint)

### Milestone yang sudah selesai
1. Clone source project + inventaris file.
2. Dokumentasi arsitektur (`ARCHITECTURE.md`), deployment (`DEPLOYMENT.md`), module map (`MODULE-MAP.md`), user flow (`USER-FLOW.md`).
3. Pipeline post-save diubah jadi **config-driven** lintas DX.
4. Generalisasi header/status routing untuk semua DX.
5. Idempotency fingerprint + reason terstruktur per step.
6. Validasi numerik frontend (angka-only, panjang NIK/RT/RW/WA, normalisasi prefix WA, padding RT/RW, tooltip hint).
7. **Async pipeline queue mode** (opsional) ditambahkan.

### Commit penting (urut terbaru)
- `dec4d8e` → async pipeline queue mode (`pipeline.queue.js`, integrasi `routes.js`)
- `a05b6e2` → tooltip/hint numeric fields
- `89a28bc` → normalisasi prefix WA + RT/RW zero-padding
- `272641c` → length rules numeric fields
- `a795ff4` → numeric-only validation
- `d3e18b0` → idempotent fingerprint + structured reasons
- `73cb41c` → generalisasi header/status lintas DX
- `37bcacd` → refactor orchestration lintas DX

---

## 3) File Kunci yang Harus Dipahami Dulu

1. `src/routes.js`
   - Orkestrasi save pipeline
   - Sync vs async mode (`PIPELINE_MODE`)
2. `src/pipeline.queue.js`
   - Queue sheet (`PIPELINE_QUEUE`)
   - enqueue + processor
3. `src/data.js`
   - Header common pipeline lintas DX
   - Routing pengampu
4. `src/dashboard.js`
   - Agregasi status lintas DX
5. `src/app.validation.js.html`
   - Rule numeric validation
6. `src/app.js.html`
   - Integrasi validasi di event input/blur + submit

---

## 4) Cara Lanjut Kerja (Quick Resume)

### A. Sync code terbaru
```bash
cd /root/.openclaw/workspace/projects/gas-1laS5GQZob0FQWsLdOGXdx6ea6iyxC7uHeaDE_wVl5rDV8fNQs-3jHUVu/src
clasp pull
clasp status
```

### B. Lanjut coding
Edit file di `src/` lalu push:
```bash
clasp push -f
```

### C. Catat progres
Update:
- `docs/PROGRESS.md`
- `docs/PHASE3-VERIFICATION.md`

### D. Commit lokal
```bash
cd /root/.openclaw/workspace
git add .
git commit -m "<ringkas perubahan>"
```

---

## 5) Cara Aktifkan Async Pipeline (Opsional)

> Default aman saat ini: mode sinkron (`sync`).

### Konfigurasi mode async
Set property config:
- `PIPELINE_MODE=async`

Bisa lewat fungsi admin `setupConfig(token, configMap)` dengan payload berisi:
```json
{
  "PIPELINE_MODE": "async"
}
```

### Trigger processor queue
Buat **time-driven trigger** di Apps Script:
- Function: `processPipelineQueue`
- Interval: tiap 1–5 menit

### Rollback cepat jika bermasalah
Set kembali:
- `PIPELINE_MODE=sync`

---

## 6) UAT / Verifikasi yang Masih Perlu Dilanjutkan

Lihat dokumen utama:
- `docs/PHASE3-VERIFICATION.md`

Target berikutnya:
1. TC-01..TC-06 full PASS di runtime operasional.
2. Validasi skenario async queue (queued → done/failed).
3. Monitoring sheet `PIPELINE_QUEUE` untuk failure reason dan retry.

---

## 7) Backlog Prioritas Berikutnya

### Prioritas tinggi
1. **Monitoring Pipeline UI**
   - ringkasan pending/done/failed per DX
   - retry per EPID / per DX
2. **Dead-letter handling**
   - item gagal berulang dipindah ke status khusus + alert
3. **DX validation pack**
   - rule mandatory/cross-field spesifik tiap DX

### Prioritas menengah
4. Export/report operasional per DX + SLA notifikasi.
5. Hardening akses webapp dan kebijakan token print URL.

---

## 8) Risiko yang Perlu Diingat

1. Mode async perlu trigger aktif; tanpa trigger queue akan menumpuk.
2. Integrasi external (email/telegram/spreadsheet) bisa gagal intermiten — reason harus dipantau.
3. Semua perubahan schema header harus kompatibel dengan sheet existing.

---

## 9) Definisi Selesai Sprint Berikutnya

Sprint dianggap selesai jika:
- Async queue stabil di produksi kecil (pilot),
- Dashboard monitoring pipeline tersedia,
- UAT TC-01..TC-06 + skenario async minimal 90% PASS,
- Rollback ke mode sync teruji.

---

## 10) Referensi Dokumen Terkait

- `docs/ARCHITECTURE.md`
- `docs/DEPLOYMENT.md`
- `docs/MODULE-MAP.md`
- `docs/USER-FLOW.md`
- `docs/PROGRESS.md`
- `docs/PHASE3-VERIFICATION.md`
