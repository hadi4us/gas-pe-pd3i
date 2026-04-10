# Phase 3 Verification Checklist (Multi-DX Pipeline)

Dokumen ini untuk verifikasi implementasi:
- Pipeline lintas DX
- Idempotency fingerprint
- Structured reason per step
- Agregasi status dashboard lintas DX

## Scope
- File terkait:
  - `src/routes.js`
  - `src/data.js`
  - `src/dashboard.js`

## Prasyarat Uji
1. Script sudah di-`clasp push` ke environment uji.
2. `REF_USER` punya akun admin/petugas.
3. `REF_PENGAMPU` terisi minimal 1 mapping kecamatan+kelurahan yang valid.
4. Config tersedia:
   - `TELEGRAM_BOT_TOKEN`
   - `TELEGRAM_CHAT_ID`
   - `SPREADSHEET_ID`
5. Semua sheet DX tersedia: `MR_Raw`, `DIF_Raw`, `PERT_Raw`, `TN_Raw`, `AFP_Raw`.

---

## Test Matrix

### TC-01 — Save baru lintas DX
**Langkah**
1. Login sebagai petugas/admin.
2. Simpan kasus baru untuk tiap DX: MR, DIF, PERT, TN, AFP.

**Expected**
- Save sukses (`status=success`).
- `Nomor EPID` terbentuk.
- Kolom pipeline common tersedia & terisi status awal:
  - `Status Routing Pengampu`
  - `Status Notifikasi Pengampu`
  - `Status Sinkronisasi Pengampu`
  - `Status Notifikasi Telegram`

---

### TC-02 — Idempotent (payload sama, submit ulang)
**Langkah**
1. Ambil 1 record yang baru dibuat.
2. Submit ulang data yang sama (EPID sama).

**Expected**
- Response tetap sukses.
- `pipelineIdempotent = true`.
- Step yang sudah sukses sebelumnya tidak dieksekusi ulang (status tetap, reason `SKIPPED_IDEMPOTENT` pada step yang diskip).
- `Telegram Retry Count` tidak naik jika step telegram diskip idempotent.

---

### TC-03 — Non-idempotent (payload berubah)
**Langkah**
1. Edit field relevan (misalnya routing target/email target).
2. Submit update.

**Expected**
- Fingerprint berubah.
- Step dieksekusi ulang sesuai policy.
- Status/reason di-update sesuai hasil terbaru.

---

### TC-04 — Structured reason tercatat
**Langkah**
1. Simulasikan kegagalan 1 step (mis. kosongkan email pengampu atau token telegram).
2. Submit record.

**Expected**
- Status step menjadi failure reason code (`NO_RECIPIENT`, `NOT_CONFIGURED`, dll).
- Kolom reason terisi:
  - `Reason Notifikasi Pengampu`
  - `Reason Sinkronisasi Pengampu`
  - `Reason Notifikasi Telegram`

---

### TC-05 — Dashboard lintas DX
**Langkah**
1. Buka dashboard per DX.
2. Panggil `getDashboardStats(dx, tahun, token)` untuk beberapa DX.

**Expected**
- `totalKasus`, `perKecamatan`, `perBulan` keluar normal.
- `statusNotifikasi`/`statusSinkronisasi` muncul jika kolom ada (tidak lagi MR-only).

---

### TC-06 — Retry batch lintas DX
**Langkah**
1. Jalankan retry batch (`sync`, `notify`, `telegram`) untuk subset DX.
2. Ulangi untuk semua DX.

**Expected**
- `byDx` berisi ringkasan per DX.
- Item yang sudah done tidak diproses ulang.
- `status` bisa `success` / `PARTIAL` sesuai durasi proses.

---

## Template Hasil Uji

| Test Case | Status (PASS/FAIL) | Catatan |
|---|---|---|
| TC-01 |  |  |
| TC-02 |  |  |
| TC-03 |  |  |
| TC-04 |  |  |
| TC-05 |  |  |
| TC-06 |  |  |

---

## Catatan Operasional
- Jika performa lambat, pertimbangkan pindahkan notifikasi ke queue async/time-based trigger.
- Simpan reason code terstandar agar mudah dipakai dashboard operasional.
