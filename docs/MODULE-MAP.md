# Module Map

## Backend (.js)
- `main.js` — placeholder entry, referensi modul utama.
- `routes.js` — endpoint `doGet/doPost`, save orchestration, retry logic.
- `auth.js` — autentikasi user berbasis `REF_USER`.
- `data.js` — CRUD data kasus, search, duplicate check, routing pengampu.
- `dashboard.js` — statistik dashboard & export CSV.
- `print.js` — endpoint/utility print dan URL PDF.
- `utils.js` — helper umum (sheet/session/EPID/include/response).
- `config.js` — manager config dari Script Properties.
- `cache.js` — manager cache + invalidasi.
- `audit.js` — audit logging ke `AUDIT_LOG`.

## Frontend Templates
- `index.html` — shell utama UI.
- `login.html` — halaman/login component.
- `pin.html` — komponen pengelolaan PIN.
- `style.html` — CSS global.
- `app.js.html` — bootstrap frontend utama.
- `app.init.js.html` — init state/event.
- `app.foundation.js.html` — util/foundation frontend.
- `app.search.js.html` — fitur pencarian data.
- `app.submit.js.html` — submit form.
- `app.validation.js.html` — validasi form.
- `app.dashboard.js.html` — dashboard frontend.
- `app.draft.js.html` — manajemen draft.
- `app.geo.js.html` — geolocation/map helper.
- `auth.js.html` / `utils.js.html` — helper client-side.
- `print_MR.html` — template cetak MR.

## Konfigurasi & Tes
- `appsscript.json` — manifest runtime/deployment web app.
- `routes.test.js`, `audit.test.js` — unit test backend tertentu.
- `.clasp.json` — mapping lokal ke script project ID.
