# Endpoint Security Matrix — GAS PE PD3I

Tanggal: 2026-06-11  
Scope: inventory public web app surface, Apps Script callable functions, dan guard baseline.

## Ringkasan

Aplikasi deploy sebagai web app anonymous (`ANYONE_ANONYMOUS`) dan berjalan sebagai deployer, jadi semua function callable harus dianggap public internet surface. Matrix ini menjadi baseline sebelum perubahan guard/authz berikutnya.

Generated source: `docs/ENDPOINT_SECURITY_MATRIX.generated.json` via `npm run check:endpoints`.

| Guard class | Makna |
|---|---|
| `public-login` | Endpoint login publik; boleh tanpa token tetapi wajib rate limit dan audit failed login. |
| `mixed-public-entry` | Entry HTML/print; perlu branch-level guard untuk aksi sensitif. |
| `token-or-save-payload` | Menerima payload aplikasi; save path wajib membawa token/session dalam payload. |
| `token` | Wajib session token valid. |
| `token-scope` | Wajib token valid dan record/sheet read-write scope. |
| `admin` | Wajib token admin via `_requireAdminFromToken_` atau guard setara. |

## Matrix

Detail lengkap ada di generated JSON agar bisa diregenerasi oleh gate:

```bash
npm run check:endpoints
```

Ringkasan saat dibuat:

- Total callable/public functions terinventarisasi: 59
- `reviewNeeded`: 0
- Guard classes: `admin`, `mixed-public-entry`, `public-login`, `token`, `token-or-save-payload`, `token-scope`

## Function penting untuk audit lanjutan

| Function | Guard baseline | Catatan |
|---|---|---|
| `authLogin` | `public-login` | Satu-satunya function yang memang publik; rate limit ada di auth module. |
| `doGet` | `mixed-public-entry` | Public app shell; branch `action=print` harus selalu masuk print handler token/scope. |
| `doPost` | `token-or-save-payload` | Public POST entry; dedicated actions dipetakan ke workflow function dan fallback save payload. |
| `saveFormData` | `token-or-save-payload` | Entry write utama; prioritas test token kosong/invalid. |
| `getPdfPrintUrl` | `token-scope` | Menghasilkan URL print; token di URL adalah risiko lanjutan. |
| `handlePrintRequest_` | `token-scope` | Print GET surface; token/scope wajib selalu dijaga. |
| `getRecordForPrint` | `token-scope` | Record print read harus scope-aware. |
| `setupConfig` | `admin` | Sensitive config; harus tetap admin-only. |
| `previewPertRawBlankHeaderRepair` | `admin` | Operational repair; admin-only, preview-first. |
| `repairPertRawBlankHeader` | `admin` | Operational repair; admin-only dan destructive-ish. |

## Hardening yang sudah diterapkan

- Public write entry (`doPost`/`saveFormData`) tidak mengembalikan `String(err)` mentah; error teknis dicatat ke log internal dan client menerima pesan aman.
- Auth callable (`authLogin`, `authCheck`, `authLogout`, `authChangePin`) memakai sanitizer error publik agar exception internal tidak bocor ke client.
- `getPdfPrintUrl(dx, epid, token)` sekarang scope-aware: URL print hanya dibuat setelah record bisa dibaca oleh token/session tersebut.
- `saveFormPayload_` memakai idempotency fingerprint berbasis actor + payload canonical. Submit sukses yang identik dalam 10 menit dikembalikan dari cache dengan `duplicateSubmission: true` sehingga double-click/retry tidak memicu insert/notifikasi berulang.

## Follow-up P0

1. Konsolidasikan authz facade agar callable baru wajib deklarasi guard.
2. Kurangi token di query string print flow dengan short-lived/one-time print token.
3. Tambahkan test runtime Apps Script/integration untuk membuktikan invalid token tidak menyentuh SpreadsheetApp mock/real sheet.
4. Tambahkan telemetry/audit ringkas untuk duplicate submission agar pola double-submit bisa dipantau.

## Gate

`npm test` sekarang menjalankan:

1. `npm run test:node`
2. `npm run check:hygiene`
3. `npm run check:endpoints`
