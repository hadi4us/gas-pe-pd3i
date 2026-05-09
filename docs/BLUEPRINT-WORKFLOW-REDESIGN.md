# Blueprint Perubahan Signifikan Aplikasi PE PD3I

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Membongkar ulang alur aplikasi dari pola “form besar + patch workflow” menjadi aplikasi operasional yang record-first, stage-based, jelas untuk petugas/admin, dan tidak mudah nyangkut saat input laporan kasus, edit inputan, verifikasi, input hasil sampel/laboratorium, dan update status pemantauan kasus.

**Architecture:** Pertahankan Google Apps Script + Google Sheets sebagai backend, tetapi ubah kontrak aplikasi menjadi state machine kasus. Frontend harus dipecah menjadi modul workflow kecil: shell/navigasi, queue/inbox, record drawer/detail, stage forms, submit controller, dan success/action router. Backend harus menyediakan API record/workflow eksplisit, bukan hanya `saveFormData(payload)` generik.

**Tech Stack:** Google Apps Script V8, HtmlService templates, `google.script.run`, Google Sheets raw tables (`*_Raw`), Node syntax/regression checks, clasp.

---

## 0. Alur Bisnis Inti yang Harus Didukung

Aplikasi ini dipakai untuk operasional surveilans harian dengan alur utama berikut:

```text
1. Petugas input laporan kasus / PE awal
   → sistem membuat ID Registrasi Kasus
   → status verifikasi awal = Pending
   → kasus masuk daftar Verifikasi Admin

2. Admin melakukan verifikasi laporan kasus
   → keputusan: Terverifikasi / Perlu Revisi
   → jika Terverifikasi, Nomor EPID final disimpan
   → kasus lanjut ke tahap berikutnya berdasarkan kebutuhan sampel/lab

3. Jika inputan menyatakan ada pemeriksaan sampel/laboratorium
   → kasus yang sudah terverifikasi muncul di list Input Hasil Sampel/Lab
   → petugas/admin mengisi hasil pemeriksaan
   → setelah hasil disimpan, kasus lanjut ke update status pemantauan

4. Step akhir adalah update status pemantauan kasus
   → status pasien/kasus diperbarui sampai final/selesai
   → kasus keluar dari queue aktif dan masuk riwayat/done

5. Sepanjang alur, user berwenang harus bisa membuka menu Edit Inputan
   → edit data laporan awal tanpa merusak status workflow
   → perubahan penting tercatat audit trail
   → bila field kritis berubah, kasus bisa ditandai perlu verifikasi ulang
```

Menu utama yang harus jelas di sidebar/topbar:

1. **Input Laporan Kasus** — membuat laporan baru.
2. **Edit Inputan** — mencari dan memperbaiki laporan yang sudah pernah diinput.
3. **Verifikasi Admin** — worklist admin untuk verifikasi EPID/laporan.
4. **Input Hasil Sampel/Lab** — hanya berisi kasus terverifikasi yang memang ada pemeriksaan sampel/lab.
5. **Update Status Pemantauan** — tahap akhir untuk update status pasien/kasus.
6. **Pencarian/Riwayat** — lookup semua record sesuai hak akses.

---

## 1. Temuan dari Screenshot dan Kode Aktual

### Yang terlihat di screenshot

1. Admin sedang di aplikasi **Surveilans PD3I Terintegrasi**.
2. Sidebar aktif di **Verifikasi EPID**.
3. Ada tabel **Antrian review admin** berisi 8 entri, kolom: No, Nama Kasus, Wilayah/DX, ID Record, Status, Update, Aksi.
4. Item pertama: `SAKINAH TITANIA PUTRI`, status `Pending review`, catatan kecil `sampel belum diterima`, tombol `Buka`.
5. Screenshot sebelumnya menunjukkan layar setelah klik simpan verifikasi: tombol biru `Menyimpan...` di bawah form tetap loading.
6. Pada form verifikasi, admin mengisi `Nomor EPID Final`, `Review Admin Terakhir`, dan `Catatan Verifikasi EPID / Alasan Revisi` berisi `sampel belum diterima`.

### Bukti kode yang relevan

- Shell memasukkan banyak workspace dalam satu halaman: `src/index.html:145-158`.
- Frontend utama sangat besar: `src/app.js.html` berisi 6.760 baris.
- Backend workflow tersebar di `src/routes.js`, `src/data.js`, `src/dashboard.js`.
- `showSuccessModal` generik ada di `src/app.js.html:4988-5045`.
- Ada patch khusus verifikasi di bawah, bukan desain native: `patchSuccessModalForVerificationWorkflow` di `src/app.js.html:6333-6428`.
- Submit semua stage memakai satu handler besar: `handleMainFormSubmit` di `src/app.js.html:6454-6752`.
- Inbox workflow dibuat dari `_buildWorkflowInboxData_` di `src/dashboard.js:221-423`, lalu dicache 120 detik di `getWorkflowInbox` `src/dashboard.js:425-470`.
- Save backend memakai `saveFormPayload_` generik di `src/routes.js:1655-1776`.
- Upsert raw data ada di `saveDxRecord_` `src/data.js:540-776`.

## 2. Diagnosis Root Cause

Masalah bukan cuma tombol loading. Akar masalahnya arsitektur alur.

### Root cause A — aplikasi masih “form-first”, bukan “case workflow-first”

Saat ini menu Verifikasi/Hasil Sampel/Status hanya mengarahkan user ke bagian tertentu dari form besar. Workflow state tidak menjadi pusat. Akibatnya:

- admin melihat queue, klik `Buka`, lalu masuk ke form panjang yang konteksnya tidak cukup tajam;
- setelah save, aplikasi harus menebak apakah kembali ke queue, tetap di halaman, atau reset form;
- muncul patch-patch seperti `patchSuccessModalForVerificationWorkflow`, tanda bahwa success flow tidak dirancang dari awal untuk stage workflow.

### Root cause B — satu submit handler menanggung semua stage

`handleMainFormSubmit` mengurus input awal, edit, verifikasi, sampel, status, validasi umum, payload build, fallback POST, `google.script.run`, success modal, refresh inbox, dan reset tombol. Ini terlalu banyak tanggung jawab. Efeknya:

- satu bug di verifikasi bisa mengganggu stage lain;
- state tombol mudah nyangkut bila response sukses tapi modal/redirect gagal;
- validasi semua form bercampur, sehingga field dari stage lain dapat ikut menghambat stage aktif.

### Root cause C — backend belum punya API workflow eksplisit

Backend menyimpan semua lewat `saveFormData(payload)` → `saveFormPayload_` → `saveDxRecord_`. Stage dikenali lewat `__workflowStage`, tetapi fungsi server masih generik. Seharusnya ada API khusus:

- `verifyCase(recordKey, dx, decision, finalEpid, note, token)`
- `saveSampleResult(recordKey, dx, samplePayload, token)`
- `updateCaseStatus(recordKey, dx, statusPayload, token)`

Dengan begitu rules tiap tahap bisa jelas dan kecil.

### Root cause D — inbox dicache terlalu lama untuk aksi kerja

`getWorkflowInbox` cache 120 detik. Setelah admin menyimpan verifikasi, daftar bisa masih menampilkan data lama. Untuk dashboard agregat cache oke, untuk queue kerja operasional sebaiknya cache pendek sekali atau invalidate by mutation.

### Root cause E — UX queue tidak mendukung keputusan cepat

Tabel queue hanya memberi `Buka`. Admin perlu melihat ringkasan kasus, alasan/catatan, kelengkapan minimal, dan pilihan aksi langsung. Saat ini admin harus membuka form untuk memahami konteks.

## 3. Prinsip Desain Baru

1. **Record-first:** user memilih kasus dulu, baru stage action.
2. **State machine eksplisit:** setiap kasus punya status workflow yang bisa dihitung dan ditampilkan konsisten.
3. **Stage API eksplisit:** backend punya endpoint khusus per aksi utama.
4. **Queue harus real-time-ish:** setelah aksi selesai, item langsung hilang/pindah tanpa menunggu cache.
5. **Form kecil per stage:** Verifikasi, Sampel, Status bukan sekadar potongan form besar; masing-masing punya model, validasi, submit, dan success action sendiri.
6. **Context read-only + action editable:** data pasien/pelapor ditampilkan sebagai ringkasan read-only; hanya field stage aktif yang editable.
7. **No patch-on-patch:** hapus wrapper/patch success modal; ganti dengan action router native.
8. **No new production URL by default:** gunakan `clasp push` / update deployment existing sesuai konvensi project.

## 4. Target Alur Baru

### A. Input Kasus

```text
Petugas/Admin → Input Laporan Kasus → pilih DX → isi PE awal → Simpan Laporan
→ record punya ID Registrasi Kasus
→ masuk queue Verifikasi Admin
```

Output wajib:

- `ID Registrasi Kasus`
- `Status Verifikasi EPID = Pending`
- `Nomor EPID Rekomendasi`
- routing pengampu jika wilayah cukup

UX wajib:

- setelah simpan, tampilkan ringkasan record dan tombol: `Input kasus baru`, `Lihat detail`, `Edit inputan`;
- jangan langsung mengarahkan user ke verifikasi kecuali role admin dan user memilih aksi itu;
- laporan baru harus mudah ditemukan lagi lewat menu **Edit Inputan** dan **Pencarian/Riwayat**.

### A2. Edit Inputan

```text
Petugas/Admin → Edit Inputan
→ cari berdasarkan ID Registrasi / Nomor EPID / Nama / NIK / wilayah / tanggal input
→ buka record
→ edit field laporan awal yang diizinkan
→ simpan perubahan
→ audit trail tersimpan
→ jika field kritis berubah, status workflow ditandai perlu review/verifikasi ulang
```

Rules edit:

- Edit inputan bukan stage baru yang memajukan workflow; edit adalah koreksi data sumber.
- Record yang masih `Pending` boleh diedit oleh petugas pemilik/sesuai scope dan admin.
- Record yang sudah `Terverifikasi` boleh diedit terbatas; field kritis harus memicu `Perlu Review Ulang` atau catatan audit untuk admin.
- Nomor EPID final tidak boleh berubah lewat menu edit biasa; perubahan EPID harus lewat verifikasi/admin action.
- Field hasil sampel/lab tidak diedit dari menu Edit Inputan; gunakan menu **Input Hasil Sampel/Lab**.
- Field status pemantauan tidak diedit dari menu Edit Inputan; gunakan menu **Update Status Pemantauan**.
- Setiap edit menyimpan `Edited At`, `Edited By`, `Edit Reason`, dan daftar field berubah.

### B. Verifikasi Admin

```text
Admin → Verifikasi EPID
→ lihat queue Pending/Perlu Revisi
→ klik record
→ panel ringkasan kasus + panel keputusan
→ pilih: Terverifikasi / Perlu Revisi
→ simpan
→ queue refresh langsung
```

Untuk `Terverifikasi`:

- finalisasi `Nomor EPID`
- trigger pipeline pengampu/email/telegram/sync
- jika field `Pemeriksaan Sampel Dilakukan` / field lab terkait menyatakan ada pemeriksaan sampel/laboratorium, record pindah ke queue **Input Hasil Sampel/Lab**
- jika tidak ada pemeriksaan sampel/laboratorium, record langsung pindah ke queue **Update Status Pemantauan**

Untuk `Perlu Revisi`:

- kosongkan `Nomor EPID Final` dan `Nomor EPID`
- catatan revisi wajib
- trigger notifikasi revisi
- record pindah ke queue revisi petugas

### C. Hasil Sampel

```text
Admin/Pengampu sesuai scope → Input Hasil Sampel/Lab
→ queue kasus terverifikasi yang butuh sampel/lab
→ buka record
→ input hasil pemeriksaan sampel/laboratorium saja
→ simpan
→ record pindah ke queue Update Status Pemantauan jika belum final
```

Queue sampel wajib hanya berisi record yang memenuhi semua kondisi:

- `Status Verifikasi EPID = Terverifikasi`;
- ada indikator pemeriksaan sampel/lab pada input laporan;
- hasil sampel/lab belum lengkap/final.

### D. Status Pasien/Kasus

```text
Admin/Pengampu sesuai scope → Update Status Pemantauan
→ queue kasus terverifikasi yang belum final
→ update status kasus
→ simpan
→ jika final, keluar dari queue aktif dan masuk done
```

Queue status wajib berisi:

- kasus terverifikasi tanpa kebutuhan sampel/lab; atau
- kasus terverifikasi dengan hasil sampel/lab sudah diinput; dan
- status pemantauan belum final/selesai.

## 5. Kontrak Backend Baru

### 5.1 DTO minimal record queue

Tambahkan builder server-side yang konsisten:

```js
{
  dx: 'MR',
  recordKey: 'REG-MR-...',
  recordId: 'REG-MR-...',
  epid: 'C-...',
  nama: '...',
  wilayahLabel: 'MR • Kecamatan • Kelurahan',
  statusVerifikasi: 'Pending',
  statusKasus: '',
  sampleState: 'not_required|required|waiting|done',
  nextStage: 'verification|sample|status|done|revision',
  updatedAt: '...',
  warnings: ['Belum ada hasil lab'],
  actions: ['open','verify','request_revision']
}
```

### 5.2 API baru

Tambahkan ke `src/routes.js` atau file baru `src/workflow.api.js`:

```js
function getWorkflowBoard(token, options) {}
function getWorkflowRecord(token, dx, recordKey) {}
function searchEditableRecords(token, query) {}
function updateInitialReport(token, payload) {}
function verifyCase(token, payload) {}
function saveSampleStage(token, payload) {}
function saveStatusStage(token, payload) {}
```

Rules:

- Semua API pakai `_getSessionFromToken_` dan role/scope checks.
- API stage/edit menerima `recordKey`, `dx`, dan payload sesuai domainnya saja.
- API stage fetch existing row, merge field yang boleh diubah, lalu save.
- API stage mengembalikan `{status, message, record, boardDelta}`.
- `boardDelta` memberi instruksi frontend: remove item dari bucket lama, add ke bucket baru, update counters.
- `updateInitialReport` wajib memisahkan field laporan awal dari field workflow; field verifikasi/sampel/status tidak boleh ikut tertimpa dari edit inputan.
- Jika `updateInitialReport` mengubah field kritis setelah record terverifikasi, response harus memberi flag `requiresReverification: true` dan mencatat alasan.

### 5.3 Cache policy

- `getWorkflowBoard`: cache maksimal 15 detik atau tanpa cache untuk admin queue.
- Setelah `verifyCase/saveSampleStage/saveStatusStage`: invalidate cache workflow + sheet cache.
- Dashboard statistik boleh tetap cache lebih lama.

## 6. Frontend Baru

### 6.1 Pecah `app.js.html`

Target modul HtmlService:

```text
src/app.state.js.html          // session, active workspace, active record
src/app.shell.js.html          // sidebar, routing, topbar
src/app.board.js.html          // workflow board/queue rendering
src/app.record.js.html         // open record, context summary, drawer/panel
src/app.edit.js.html           // search/edit laporan awal
src/app.stage.verify.js.html   // form & submit verifikasi
src/app.stage.sample.js.html   // form & submit sampel
src/app.stage.status.js.html   // form & submit status
src/app.submit.js.html         // common request helper, button state, alerts
src/app.forms.js.html          // generated DX form only for input/edit full PE
```

`src/index.html` include modul secara urut setelah config.

### 6.2 Layout baru untuk workflow

Untuk Verifikasi/Sampel/Status, gunakan layout 2 kolom:

```text
[Queue / Worklist kiri] [Record Detail + Stage Action kanan]
```

Di mobile: queue di atas, detail di bawah.

Untuk **Edit Inputan**, gunakan layout:

```text
[Search/filter record] → [Hasil pencarian] → [Form PE awal yang bisa diedit] → [Audit reason + Simpan]
```

Edit Inputan harus punya label jelas bahwa user sedang mengubah laporan awal, bukan sedang memverifikasi atau mengisi hasil lab/status.

### 6.3 Komponen record summary

Tampilkan ringkasan tetap:

- Nama kasus
- DX
- ID Registrasi
- EPID rekomendasi/final
- Wilayah pasien
- Unit pelapor
- Status verifikasi
- Status kasus
- Kebutuhan sampel
- Catatan terakhir

Jangan tampilkan semua field manual kecuali admin klik “Lihat detail lengkap”.

### 6.4 Submit UX wajib

Semua submit stage harus memakai pola tunggal:

```js
withButtonBusy(button, 'Menyimpan...', async function() {
  const res = await callServer('verifyCase', payload);
  applyBoardDelta(res.boardDelta);
  showStageResult(res.message, { primaryAction: 'backToQueue' });
});
```

Syarat:

- tombol selalu reset di `finally`;
- error server ditampilkan jelas;
- success tidak memakai `Input Data Baru` generik;
- tidak ada wrapper patch modal khusus stage.

## 7. Data Model / Header yang Perlu Ditata

Pertahankan sheet `*_Raw`, tapi tambah/standarkan field workflow internal:

```text
Workflow Stage Terakhir
Workflow State
Workflow Updated At
Workflow Updated By
Workflow Lock By
Workflow Lock At
Edited At
Edited By
Edit Reason
Edit Diff Summary
ID Registrasi Kasus
Nomor EPID Rekomendasi
Nomor EPID Final
Status Verifikasi EPID
Catatan Verifikasi EPID
Status Sampel Workflow
Status Pasien/Kasus
```

Catatan: jangan hapus header legacy dulu. Tambah compatibility layer di serializer/deserializer sampai UAT aman.

## 8. Rencana Implementasi Bite-Sized

### Task 1: Tambah regression test untuk stuck loading verifikasi

**Files:**
- Create: `tests/workflow-submit-ui.test.js`
- Modify: `package.json` bila perlu untuk command test

**Objective:** Pastikan stage submit selalu reset tombol pada success/error.

**Test expectation:** source mengandung helper `withStageSubmitBusy` atau sejenis yang memakai `try/finally`.

### Task 2: Ekstrak helper submit button state

**Files:**
- Modify: `src/app.js.html` sementara atau create `src/app.submit.js.html`

**Objective:** Semua submit memakai satu helper busy-state.

**Acceptance:** Tidak ada tombol stage yang bisa tertinggal `Menyimpan...` setelah promise selesai/gagal.

### Task 3: Buat backend API `getWorkflowRecord`

**Files:**
- Create/Modify: `src/workflow.api.js`
- Modify: `src/index.html` include order jika file HTML frontend ikut dibuat
- Test: `src/routes.test.js` atau test GAS-compatible baru

**Objective:** Frontend tidak lagi hydrate form besar langsung dari queue; record detail diambil dengan kontrak ringkas.

### Task 3A: Buat menu dan API Edit Inputan

**Files:**
- Create/Modify: `src/workflow.api.js`
- Create: `src/app.edit.js.html`
- Create/Modify: `src/workspace_edit_input.html`
- Modify: `src/index.html`
- Modify: `src/app.js.html` atau `src/app.shell.js.html`
- Test: GAS-compatible test untuk pencarian record dan guard field workflow

**Objective:** User bisa mencari, membuka, dan memperbaiki laporan kasus awal tanpa mengubah field verifikasi/sampel/status secara tidak sengaja.

**Rules:**
- Tambahkan menu sidebar **Edit Inputan**.
- Pencarian minimal berdasarkan `ID Registrasi Kasus`, `Nomor EPID`, `Nama`, dan wilayah.
- `updateInitialReport` hanya menerima whitelist field laporan awal.
- Wajib ada `Edit Reason` untuk record yang sudah terverifikasi.
- Jika field kritis berubah, set flag review ulang / tampilkan warning ke admin.
- Setelah simpan, tampilkan ringkasan field berubah dan tombol kembali ke hasil pencarian.

### Task 4: Buat backend API `verifyCase`

**Files:**
- Modify: `src/workflow.api.js`
- Modify: `src/routes.js` jika helper pipeline dipakai
- Test: GAS-compatible test untuk validasi status `Terverifikasi` dan `Perlu Revisi`

**Objective:** Verifikasi tidak lewat payload form besar.

**Rules:**
- Admin only.
- `Perlu Revisi` wajib catatan.
- `Terverifikasi` wajib EPID final.
- Return `boardDelta`.

### Task 5: Buat workflow board server contract

**Files:**
- Modify: `src/dashboard.js` atau pindahkan ke `src/workflow.board.js`

**Objective:** Ganti `getWorkflowInbox` menjadi board dengan bucket eksplisit: `verification.pending`, `verification.revision`, `sample.pending`, `status.pending`, `done`.

### Task 6: Bangun UI board baru

**Files:**
- Create: `src/app.board.js.html`
- Modify: `src/index.html`
- Modify: `src/workspace_search.html` atau create `src/workspace_workflow_board.html`

**Objective:** Queue tampil sebagai worklist operasional, bukan tabel pasif.

### Task 7: Bangun panel detail record

**Files:**
- Create: `src/app.record.js.html`
- Create/Modify: `src/workspace_record_detail.html`

**Objective:** Klik record menampilkan ringkasan + action stage tanpa harus membuka seluruh form panjang.

### Task 8: Implement stage Verifikasi native

**Files:**
- Create: `src/app.stage.verify.js.html`
- Modify: `src/workspace_verifikasi_form.html`

**Objective:** Verifikasi memakai API `verifyCase`, bukan `saveFormData` generik.

### Task 9: Implement stage Sampel native

**Files:**
- Create: `src/app.stage.sample.js.html`
- Modify: `src/workspace_sampel_form.html`
- Backend: `saveSampleStage`

### Task 10: Implement stage Status native

**Files:**
- Create: `src/app.stage.status.js.html`
- Modify: `src/workspace_status_form.html`
- Backend: `saveStatusStage`

### Task 11: Matikan patch success modal verifikasi

**Files:**
- Modify: `src/app.js.html`

**Objective:** Hapus `patchSuccessModalForVerificationWorkflow` setelah stage verifikasi native jalan.

### Task 12: Kurangi cache queue kerja

**Files:**
- Modify: `src/dashboard.js` / `src/workflow.board.js`

**Objective:** Queue admin tidak stale setelah aksi.

### Task 13: UAT end-to-end

**Scenarios:**

1. Petugas input kasus → masuk pending admin.
2. Petugas membuka **Edit Inputan** → cari record → koreksi field non-workflow → audit edit tersimpan.
3. Edit record terverifikasi pada field kritis → sistem memberi warning/flag perlu review ulang.
4. Admin verifikasi `Perlu Revisi` → muncul di revisi petugas, tidak ada stuck loading.
5. Admin verifikasi `Terverifikasi` → EPID final tersimpan, pipeline queued/sent.
6. Kasus terverifikasi dengan pemeriksaan sampel/lab → masuk queue Input Hasil Sampel/Lab.
7. Kasus terverifikasi tanpa pemeriksaan sampel/lab → langsung masuk queue Update Status Pemantauan.
8. Hasil sampel/lab disimpan → keluar dari queue sampel dan masuk queue status bila belum final.
9. Status final disimpan → keluar dari queue status.
10. Refresh browser tidak membuat workspace salah atau record lama kebuka sendiri.

## 9. Urutan Eksekusi yang Disarankan

1. Stabilkan bug langsung: tombol `Menyimpan...` harus selalu reset dengan `finally`.
2. Tambah menu **Edit Inputan** + guard backend agar koreksi data awal tidak merusak workflow.
3. Tambah API `verifyCase` karena screenshot menunjukkan verifikasi adalah pain paling nyata.
4. Ganti UI Verifikasi menjadi native stage action.
5. Lanjutkan routing otomatis: terverifikasi + ada lab → Sampel; terverifikasi + tanpa lab → Status.
6. Implement Sampel dan Status native.
7. Setelah input/edit/verifikasi/sampel/status stabil, pecah `app.js.html` menjadi modul.
8. Baru rapikan dashboard/overview dan docs.

## 10. Commands Verifikasi

```bash
cd /root/.hermes/workspace/gas-pe-pd3i
node --check src/*.js
node --test src/*.test.js
node --check scripts/*.js
git diff --check
cd src && clasp status
```

Untuk embedded HTML JS, ekstrak script block dan jalankan `node --check` seperti workflow skill `google-apps-script-webapp-ui`.

## 11. Catatan Deployment

- Jangan buat URL produksi baru untuk routine fix.
- Pakai `clasp push -f` untuk source update.
- Jika perlu update deployment produksi, gunakan deployment ID existing:

```text
AKfycbzAiozqZDZ2XYrr9nnuEtyHJaLMo4fsOJAIdUH-rSGbovriD77myFzdAB8LH_P5KL7V
```

---

## 12. Keputusan Desain Final

Aplikasi harus berhenti menjadi “semua workspace adalah variasi dari form besar”. Untuk operasional surveilans harian, aplikasi harus menjadi:

```text
Queue kerja → pilih kasus → lihat ringkasan → ambil keputusan stage → simpan → queue update
```

Form PE lengkap tetap ada untuk input/edit data awal. Tetapi verifikasi, sampel, dan status harus menjadi workflow action yang kecil, jelas, dan punya API backend sendiri.
