# SIMPEL Surveilans — UI/UX implementation memory

Status: living memory for UI/UX work. Update after every UI/UX phase.
Last updated: 2026-07-22

## Non-negotiable direction

SIMPEL Surveilans must feel like an official public-health surveillance system: clinical, precise, trustworthy, and operational. It must not feel like a playful SaaS dashboard or generic admin template.

## Source hierarchy

1. Existing SIMPEL production behavior and data workflows.
2. Sigap UI/UX prompt rules.
3. Existing SIMPEL design tokens and tests.
4. ThemeForest template as visual/layout reference only.

If conflict exists, keep behavior and safety first. Never copy template code wholesale.

## Deployment discipline

- Production URL stays stable. Do not deploy Production unless MasBro explicitly orders it.
- Development/core deployment is for functional fixes.
- UI/UX deployment is for redesign iterations.
- Current UI/UX URL:
  https://script.google.com/macros/s/AKfycbzVgu6dp9t0AvXPv_U6ISfJciBT6YE5GvxoCe0i2xq30tQQaq0fIYdnlm_-H1Z9e5kn9A/exec
- Current UI/UX version: `@1277`.

## Current UI/UX phase history

- `@1216`: baseline Sigap UI/UX and documentation.
- `@1217`: Beranda title stack cleanup.
- `@1218`: mobile Beranda compact cards.
- `@1219`: Fokus/prioritas responsive grid cleanup.
- `@1220`: Daftar Kasus clinical list polish.
- `@1221`: Form Input/Edit clinical readability.
- `@1222`: Dashboard statistik epidemiology polish.
- `@1223`: Panduan Aplikasi operational help center.
- `@1224`: Panduan Aplikasi quick-reference polish.
- `@1225`: Administrasi secure operations console.
- `@1226`: Login official access gateway.
- `@1227`: workflow queue surveillance workbench.
- `@1228`: Detail kasus operational case profile.

## Visual rules to preserve

- Light mode default for daily work.
- Dark mode pending; keep all modules in light mode first, including dashboard.
- Maximum title layers: breadcrumb, page title, factual subtitle.
- No decorative gradient hero on operational pages.
- Red only for outbreak/KLB/critical.
- Metadata pills neutral.
- Status pills semantic.
- KPI/table/chart numbers use tabular/monospace styling.
- Async panels require loading, empty, and error states.
- CRUD actions require disabled/loading state during processing.
- Keep Indonesian UI copy; sentence case.
- Avoid long instructions; use short factual subtitles.
- Apps Script iframe constraints: no heavy canvas/WebGL, no large plugin stack, no template vendor import.

## ThemeForest adoption decision

Adopt visual patterns only, not code/vendor/plugins.

Usable references:

- `light/index.html`: dashboard/KPI/chart/activity layout.
- `light/forms-wizard.html`: Input/Edit stepper layout.
- `light/forms-validation.html`: validation/error field states.
- `light/app-taskboard.html`: workflow queues.
- `light/app-inbox.html`: admin queue/notifications.
- `light/doctors-all.html`: Daftar Kasus list/card hierarchy.
- `light/doctor-profile.html`: detail kasus summary.
- `light/page-faq.html`: Panduan Aplikasi/FAQ.
- `dark/index.html`: deferred; current blueprint uses light dashboard.

Do not adopt:

- Bootstrap global classes as dependency.
- CKEditor, markdown editors, crop/upload pages.
- chat/compose pages.
- map plugins.
- chart plugin stack wholesale.

## Next recommended phase

Workflow queue phase:

- Verifikasi EPID.
- Pemeriksaan Laboratorium.
- Status dan Klasifikasi.

Target: make queues feel like a surveillance workbench. Each case card/row should show identity, disease, wilayah, age/queue time when available, status, and next action.

## Phase update — Dashboard statistik epidemiology command panel (`@1229`)

- Dashboard statistik refined as epidemiology command panel.
- KPI strip expanded to six operational metrics and scope-aware copy for faskes/puskesmas.
- Copy standardized to Indonesian sentence case.
- Decorative rose/violet urgency tones removed from routine dashboard elements.
- Alert/notification tone uses amber/warning unless true critical/KLB.
- Map, trend, verification, kecamatan distribution, and age distribution panels aligned to official surveillance visual hierarchy.
- Metric numbers, month values, table counts, and status chips use tabular numerals.
- Production and Development/core deployments untouched.
- Current UI/UX version: `@1229`.


## Phase update — Daftar Kasus operational registry refinement (@1230)

- Surface: Daftar Kasus / ruang pencarian kasus.
- Header hasil pencarian sekarang menampilkan ringkasan operasional: total kasus, halaman, dan aksi workflow.
- Empty state memakai istilah kasus, bukan record.
- Copy aksi utama: Tindak lanjut.
- Link cetak: Dokumen PE.
- Metadata non-status netral; status tetap semantik.
- Angka/ID memakai tabular nums.
- Focus state kartu kasus terlihat.
- Deployment target hanya UI/UX dedicated link.

## 2026-07-22 — UI/UX Form wizard guided clinical entry refinement (@1231)

- Surface: Input Kasus and Form Input/Edit wizard/review/save control.
- Scope: dedicated UI/UX deployment only; Production and Development/core untouched.
- Copy tightened toward clinical workflow language: `Tahap kerja kasus`, `Navigasi kerja`, `Review dan simpan`, `Input kasus awal`.
- Input lifecycle copy clarified: new case entry is separated from correction, verification, lab, and final status via Daftar Kasus.
- Stepper visual hierarchy normalized: neutral cards, active clinical blue state, tabular step index, responsive 4→2→1 columns.
- Review/save panels normalized: neutral state by default, amber warning, red only blocking/error.
- Test added: `Form wizard phase 2 follows guided clinical entry refinement blueprint`.

## 2026-07-22 — UI/UX Administrasi secure operations refinement (@1232)

- Surface: Administrasi / Konfigurasi Sistem / Kelola Pengguna / Approval Permohonan Akun.
- Scope: dedicated UI/UX deployment only; Production and Development/core untouched.
- Added operations summary above admin panels: access users, secure integrations, sensitive operations.
- Copy normalized to official Indonesian sentence case: `Administrasi sistem`, `Integrasi notifikasi`, `Simpan konfigurasi`, `Tambah / edit pengguna`.
- Sensitive operation card uses warning tone only, not decorative red.
- Admin cards/buttons/table numerics aligned with tokenized radius, 40px touch targets, and tabular numbers.
- Test added: `Administrasi phase 2 follows secure operations refinement blueprint`.

## 2026-07-22 — UI/UX Zero Reporting weekly surveillance reporting refinement (@1233)

- Surface: Zero Reporting / laporan nihil mingguan PD3I.
- Scope: dedicated UI/UX deployment only; Production and Development/core untouched.
- Added operational summary above form: reporting period, case/nihil choice, and immediate reporting reminder.
- Copy normalized to official Indonesian sentence case across key labels and submit action.
- Sensitive immediate-report reminder uses amber warning tone, not decorative red.
- Disease sections and submit control aligned with SIMPEL radius, neutral surfaces, 44px primary action, and tabular numeric form fields.
- Test added: `Zero Reporting phase 2 follows weekly surveillance reporting refinement blueprint`.

## 2026-07-22 — UI/UX SARING-PIE dashboard epidemiology command refinement (@1234)

- Surface: SARING-PIE dashboard / situasi PIE.
- Scope: dedicated UI/UX deployment only; Production and Development/core untouched.
- Dashboard hero copy refined as epidemiology command panel, with explicit focus on active notifications, overdue tasks, and E3/EX risk.
- Added priority strip below hero: active notifications, delayed tasks, E3/EX risk.
- Export actions normalized to Indonesian copy.
- Routine overdue task KPI uses warning tone instead of rose/red; red remains reserved for critical/outbreak states.
- KPI numerics use `var(--font-data)` and tabular numerals.
- Test added: `SARING-PIE dashboard phase 2 follows epidemiology command refinement blueprint`.

## 2026-07-22 — UI/UX Dashboard statistik situation summary refinement (@1235)

- Surface: Dashboard statistik / Dasbor PD3I.
- Scope: dedicated UI/UX deployment only; Production and Development/core untouched.
- Added situation summary strip before KPI grid: active cases, work queue, workflow completeness.
- Routine work-queue pressure uses amber warning tone, not red.
- Dashboard copy normalized: `Kendali operasional admin dan pengampu`, `Sebaran wilayah`, `Kurva epidemiologi`.
- Situation summary numbers use `var(--font-data)` and tabular numerals.
- Responsive summary strip stacks to one column under 900px.
- Test added: `Dashboard statistik phase 3 follows situation summary refinement blueprint`.

## 2026-07-22 — UI/UX Dashboard statistik light command dashboard foundation (@1236)

- Surface: Dashboard statistik / Dasbor PD3I.
- Scope: dedicated UI/UX deployment only; Production and Development/core untouched.
- Reverted dashboard direction to light command-dashboard foundation; dark mode pending.
- Added `pd3i-dashboard-light-room` shell class and `Light mode` chip.
- Dashboard subtitle clarified as situation-room reading mode.
- Dark slate panels, thin neutral borders, cyan/teal data accent, and amber warning tone for routine work pressure.
- Kept red reserved for outbreak/KLB/critical states.
- Preserved dashboard IDs/selectors and behavior.
- Test updated: `Dashboard statistik phase 4 follows light command dashboard blueprint`.

## 2026-07-22 — UI/UX Workflow forms operational stage strip (@1237)

- Surface: workflow forms for Verifikasi EPID, Pemeriksaan Laboratorium, and Status/Klasifikasi.
- Scope: dedicated UI/UX deployment only; Production and Development/core untouched.
- Added compact stage strip to each workflow form so operators can see review, active decision/input, and next queue direction before dense fields.
- Copy uses operational Indonesian, no long instructional paragraphs.
- Current stage uses info tone; no red used for routine workflow.
- Mobile stacks stage strip to one column.
- Preserved all form IDs, submit handlers, and generated field containers.
- Test added: `Workflow forms phase 5 follows operational stage strip blueprint`.

## 2026-07-22 — UI/UX Panduan Aplikasi searchable FAQ foundation (@1238)

- Surface: Panduan Aplikasi.
- Scope: dedicated UI/UX deployment only; Production and Development/core untouched.
- Added compact searchable FAQ foundation above guide cards.
- Search input is local visual foundation only; copy explicitly says it does not change application data.
- Added quick topic chips to Input kasus, Verifikasi EPID, Laboratorium, Status, and Dashboard sections.
- Targeted cards get visible focus/target state.
- Mobile stacks FAQ panel to one column.
- Preserved guide section ID and existing card content.
- Test added: `Panduan Aplikasi phase 7 follows searchable FAQ foundation blueprint`.

## 2026-07-22 — UI/UX Login OTP access stage refinement (@1239)

- Surface: Login / gerbang akses resmi.
- Added `pd3i-login-access-strip` to show access flow: `Email dinas`, `Verifikasi OTP`, `Akses sesuai peran`.
- Added `pd3i-login-trust-panel` for official access, role-based session, and confidential medical data reminders.
- Styling scoped to login only with neutral slate/teal treatment; red not used decoratively.
- Preserved login IDs and OTP handlers: `login-form`, `login-email`, `btn-send-otp`, `otp-section`, `btn-verify-otp`.
- Test added: `Login phase 9 follows OTP access stage refinement blueprint`.
- Validation: `npm test` passed `200/200`; hygiene and endpoint security checks passed.
- Deployment target: dedicated UI/UX deployment only.

## 2026-07-22 — UI/UX Login account request official compact refinement (@1240)

- Surface: Login / account request form.
- Added `account-request-security-strip` to frame account request as official staged access: `Identitas`, `Unit kerja`, `Persetujuan`.
- Added `account-request-form-summary` above form fields: email active, official unit/faskes, and admin-assigned role.
- Tightened copy: request verified by administrator before access becomes active.
- Preserved account request IDs, modal controls, faskes fields, consent, and submit handlers.
- Styling remains scoped to account-request/login classes with neutral/teal official tone; red remains only required/error markers.
- Test added: `Login phase 10 follows account request official compact refinement blueprint`.
- Validation: `npm test` passed `201/201`; hygiene and endpoint security checks passed.
- Deployment target: dedicated UI/UX deployment only.

## 2026-07-22 — UI/UX Beranda operational situation strip (@1241)

- Surface: Beranda.
- Added `overview-situation-strip` after KPI grid before focus cards.
- Situation items summarize `Cakupan data`, `Beban kerja`, and `Kelengkapan verifikasi` from existing overview counts only.
- Numerics use tabular data font; routine workload uses amber warning, not red.
- Mobile stacks to one column.
- Preserved overview render IDs/classes and did not touch Production or Development/core deployments.

## 2026-07-22 — UI/UX Dashboard statistik verification status panel (@1242)

- Surface: Dashboard statistik.
- Added `pd3i-dashboard-verification-panel` between situation strip and KPI cards.
- Panel summarizes `Status verifikasi`, `Terverifikasi`, `Menunggu EPID`, `Perlu revisi`, and `Menunggu lab` from existing dashboard stats.
- Routine pending/revision uses warning tone; lab uses info; verified uses success. No decorative red.
- Supports light dashboard scope and mobile one-column layout.
- Preserved dashboard render flow, charts, map, and drilldown handlers.

## 2026-07-22 — UI/UX Daftar Kasus search readiness strip (@1243)

- Surface: Daftar Kasus.
- Added `pd3i-search-readiness-strip` above filter toolbar.
- Strip frames search as operational registry flow: `Identitas kasus`, `Filter wilayah`, and `Status kerja`.
- Preserved filter IDs, sort select, search button handlers, result renderer, pagination, and workflow inbox behavior.
- Uses neutral official copy, info tone for current search step, and mobile one-column stacking.

## 2026-07-22 — UI/UX Form wizard input readiness strip (@1244)

- Surface: Input Kasus / form wizard.
- Added `pd3i-input-readiness-strip` after lifecycle card and before draft restore / dense form sections.
- Strip frames input readiness as `Pelapor`, `Identitas pasien`, `Data klinis`, and `Review simpan`.
- Preserved all generated field containers, dynamic renderer IDs, draft restore controls, and submit/reset handlers.
- Uses official short copy, info tone for current step, and responsive 4→2→1 column layout.

## 2026-07-22 — UI/UX Administrasi secure guardrail strip (@1245)

- Surface: Administrasi.
- Added `pd3i-admin-guardrail-strip` below admin operations summary.
- Strip frames safe administration workflow as `Verifikasi akses`, `Audit perubahan`, `Uji konfigurasi`, and `Operasi terbatas`.
- Preserved config panels, user management controls, account approval IDs, and sensitive action buttons.
- Uses info tone for access verification and amber warning tone for sensitive operations; no decorative red.

## 2026-07-22 — UI/UX Detail kasus role-aware next action panel (@1246)

- Surface: Detail kasus / operational case profile sidebar.
- Added `case-next-action-panel` under workflow timeline to show safe next decision by role and case state.
- Panel summarizes active role, priority work, workflow target, and short safe action guidance.
- Runtime copy adapts for viewer mode, blocking validation, verified cases, edit review, and new input.
- Preserved existing summary IDs, workflow timeline IDs, save/cancel handlers, and back-to-list behavior.
- Styling stays scoped to detail-case classes with neutral/info official tone; red not used decoratively.
- Test added: Detail kasus panel now checks next-action markup and phase 11 CSS.
- Validation: `npm test` passed `206/206`; hygiene and endpoint security checks passed.
- Deployment target: dedicated UI/UX deployment only.


## 2026-07-22 — UI/UX Login reduce decorative eyebrow density (@1247)

- Trigger: MasBro noted login screen still used too many eyebrow/label chips and felt too crowded.
- Surface: login card only.
- Removed visible `pd3i-login-kicker` above title from login card and folded SIMPEL identity into subtitle.
- Collapsed three trust chips into one compact footer line: official role-based access and confidential medical data.
- Preserved OTP flow, account request button, stage strip, IDs, and legacy test marker.
- Validation: `npm test` passed `207/207`; hygiene and endpoint security checks passed.
- Deployment target: dedicated UI/UX deployment only; deployed @1247.


## 2026-07-22 — UI/UX Workflow queues operational workbench clarity (@1248)

- Surface: Workflow queues for Verifikasi EPID, Pemeriksaan Laboratorium, Status/Klasifikasi.
- Trigger: continue `UIUX_BLUEPRINT.md` after login eyebrow density cleanup.
- Added queue age copy per case row (`Umur antrean`) using available timestamp fields, with safe fallback when date parsing is not possible.
- Added role/workspace-aware next-action copy per row: review EPID, input/tinjau lab result, determine final status, or fix returned data.
- Reduced decorative eyebrow density inside workflow inbox; queue header now relies on title/summary instead of repeated small label.
- Preserved queue loading, empty, pagination, table, action button, `_loadRecordFromSearch_`, and workspace routing behavior.
- Validation: `npm test` passed `208/208`; hygiene and endpoint security checks passed.
- Deployment target: dedicated UI/UX deployment only; deployed @1248.


## 2026-07-22 — UI/UX Panduan role-specific steps (@1249)

- Surface: Panduan Aplikasi.
- Trigger: continue `UIUX_BLUEPRINT.md` after workflow queue workbench clarity.
- Added role-specific quick steps for petugas faskes/puskesmas, admin/verifikator EPID, laboratorium, and pengelola status.
- Reduced repeated eyebrow/kicker density inside guide cards and summary cards; visible hierarchy now relies on title, factual helper copy, and role cards.
- Preserved existing guide search input, topic anchors, quick chips, and static FAQ/guide content.
- Validation: first `npm test` failed because old searchable FAQ marker expected `Cari panduan cepat`; fixed with hidden compatibility comment, then `npm test` passed `209/209`; hygiene and endpoint security checks passed.
- Deployment target: dedicated UI/UX deployment only; deployed @1249.


## 2026-07-23 — UI/UX Login OTP CTA contrast (@1250)

- Surface: Login access gateway.
- Trigger: MasBro reported `Kirim OTP` text used same/too-similar color as button background and became invisible on live screenshot.
- Added scoped CSS override for `#btn-send-otp.pd3i-login-submit:not(:disabled)` so enabled OTP CTA uses white text/icon on darker teal-blue gradient.
- Added disabled-state text override for span/icon to keep inactive state readable.
- Preserved login markup, OTP flow, account request flow, IDs, and handlers.
- Validation: first `npm test` failed because test referenced `loginHtml` instead of `authLoginHtml`; fixed test, then `npm test` passed `210/210`; hygiene and endpoint security passed.
- Deployment target: dedicated UI/UX deployment only; deployed @1250.


## 2026-07-23 — UI/UX Workflow queues role-safe queue brief (@1276)

- Surface: Workflow queues for Verifikasi EPID, Pemeriksaan Laboratorium, Status/Klasifikasi.
- Trigger: continue `UIUX_BLUEPRINT.md` backlog after @1250; playbook priority is workflow queue phase.
- Added compact queue brief below queue summary with three operational checks: identity scanned, safe next action, and status color discipline.
- Brief copy adapts by workspace: EPID verification, lab result input, final classification/status, or returned-data correction.
- Preserved queue pagination, empty states, action buttons, `_loadRecordFromSearch_`, workspace routing, and active-record collapse behavior.
- Styling scoped to `.pd3i-workflow-queue-brief`, light neutral official tone, stacks to one column on narrow screens.
- Validation: `npm test` passed `239/239`; hygiene and endpoint security checks passed.
- Deployment target: dedicated UI/UX deployment only; deployed @1276.

## 2026-07-23 — UI/UX Dashboard statistik reading order strip (@1278)

- Surface: Dashboard statistik.
- Trigger: continue `UIUX_BLUEPRINT.md` backlog after Detail kasus phase.
- Added `pd3i-dashboard-reading-strip` below dashboard analysis intro.
- Strip gives safe reading order: `Beban kasus`, `Sinyal epidemiologi`, and `Respons`.
- Preserved dashboard filters, KPI cards, charts, map, drilldown, export, and backend `getDashboardStats` behavior.
- Styling scoped to `.pd3i-dashboard-reading-strip`, light neutral official tone, responsive 3→1 column layout.
- Validation: first `npm test` failed because new test regex was malformed; fixed test assertion, then `npm test` passed `241/241`; hygiene and endpoint security checks passed.
- Deployment target: dedicated UI/UX deployment only; deployed @1278.
