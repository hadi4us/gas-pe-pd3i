# UI BLUEPRINT — TABLER-STYLE SHELL FOR PE PD3I

Dokumen ini menjelaskan arah redesign UI untuk aplikasi **PE PD3I** dengan pendekatan **Bootstrap 5 + Tabler-inspired admin shell**.

---

## 1. Tujuan Redesign

Redesign UI dilakukan karena model sebelumnya masih terasa seperti:
- form teknis panjang dalam satu halaman
- search/edit, admin tools, dan dashboard terasa menempel tanpa hirarki yang kuat
- belum ada shell aplikasi yang membedakan area kerja, area navigasi, dan area ringkasan

Target redesign:
1. membuat aplikasi terasa seperti **produk operasional yang matang**
2. memperjelas alur kerja petugas surveilans
3. memisahkan navigasi, input, edit, dan monitoring secara visual
4. tetap mempertahankan backend Apps Script + logic existing

---

## 2. Prinsip UI

### 2.1 Shell dulu, backend tetap
Redesign tidak menulis ulang backend. Fokus utama ada di:
- `index.html`
- `style.html`
- helper UI di `app.js.html`

### 2.2 Fokus pada operasional surveilans
UI harus nyaman untuk:
- input form PE yang panjang
- koreksi/edit data
- validasi data
- membaca warning epidemiologis
- berpindah cepat antar area kerja

### 2.3 Ringkasan selalu terlihat
Petugas harus selalu bisa melihat:
- diagnosis aktif
- mode kerja (input/edit)
- umur dan kelompok umur epidemiologis
- nomor EPID
- warning/isu validasi
- user aktif

---

## 3. Arsitektur Layar Baru

## 3.1 Sidebar kiri
Sidebar dipakai untuk:
- branding aplikasi
- navigasi cepat ke section utama
- akses cepat dashboard statistik
- daftar diagnosis yang didukung

Menu utama:
- Dashboard Form
- Cari / Edit
- Informasi Pelapor
- Demografi Pasien
- Data Spesifik Kasus
- Dashboard Statistik

## 3.2 Topbar
Topbar dipakai untuk:
- judul workspace aktif
- subtitle operasional
- badge user aktif
- admin menu
- ubah PIN
- logout

## 3.3 Content area
Area utama dibagi menjadi 3 lapis:

### Lapis A — Overview / hero
Berisi:
- positioning aplikasi
- diagnosis aktif
- mode kerja
- jumlah warning ringkas

### Lapis B — Search/Edit shell
Berisi:
- area pencarian existing case
- kriteria pencarian
- hasil pencarian

### Lapis C — Form workspace
Berisi:
- section pelapor
- section demografi pasien
- section spesifik diagnosis
- sidebar kanan untuk summary + submit

---

## 4. Struktur Form Workspace

Form tidak lagi hanya tampil sebagai blok tunggal. Struktur yang dipakai:

### Kolom kiri — pengisian utama
1. **Input kasus**
   - informasi pelapor
   - data demografi pasien
   - data spesifik diagnosis
2. **Verifikasi penentuan nomor EPID**
3. **Input hasil pemeriksaan sampel** (opsional)
4. **Update status pasien / kasus**
   - suspek
   - discarded
   - klinis
   - probable
   - konfirmasi
   - status lain sesuai kebutuhan program

### Kolom kanan — control tower
1. **Edit badge**
2. **Alert / validasi**
3. **Summary panel**
4. **Submit / cancel action**
5. **Workflow singkat**

Model ini dipilih agar petugas tidak kehilangan konteks saat form menjadi panjang.

---

## 5. Komponen Utama

### 5.1 Hero metrics
Menampilkan:
- mode aktif
- diagnosis aktif
- jumlah isu/warning

### 5.2 Search card
Berfungsi sebagai workspace pencarian yang tetap terpisah dari area input.

### 5.3 Summary panel
Menampilkan:
- diagnosis
- kode DX
- nomor EPID
- umur
- kelompok umur epi
- mode kerja
- user aktif
- jumlah isu validasi

### 5.4 Action card
Berisi:
- tombol submit utama
- tombol batal edit
- helper text tentang validasi dan submit

### 5.5 Workflow card
Memberi arahan cepat kepada user soal urutan kerja.

---

## 6. Kenapa memilih Tabler-style

Dari opsi template admin yang dipertimbangkan:
- Tabler
- AdminLTE
- CoreUI

Pendekatan **Tabler-style** dipilih karena:
1. visual lebih modern dan ringan
2. cocok untuk dashboard + form panjang
3. bersih untuk aplikasi kesehatan / surveilans
4. tidak terlalu terasa seperti aplikasi kantor lawas
5. mudah dipadukan dengan struktur existing project

---

## 7. Strategi Implementasi

### Fase 1 — Shell aplikasi
- sidebar
- topbar
- hero section
- search shell
- form workspace dua kolom

### Fase 2 — Summary dan navigasi konteks
- summary panel dinamis
- badge mode input/edit
- quick navigation ke section form

### Fase 3 — Dashboard visual lanjutan
- statistik ringkas
- quality cards
- operational monitoring

### Fase 4 — Form flow lanjutan
- wizard / stepper per diagnosis
- review page sebelum submit
- sticky validation summary yang lebih kaya

---

## 8. Constraint Implementasi

Karena project saat ini masih memakai banyak utility Tailwind pada field generator existing:
- Tailwind tetap dipertahankan sementara
- Tabler dipakai untuk shell/layout/look-and-feel
- migrasi penuh ke komponen Bootstrap/Tabler dapat dilakukan bertahap

Jadi pendekatan saat ini adalah:
**Tabler-inspired shell + kompatibel dengan renderer existing**

---

## 9. Hasil yang Diharapkan

Setelah redesign shell ini:
- aplikasi terasa lebih modern
- alur kerja lebih terbaca
- form panjang lebih terkendali
- panel ringkasan membantu validasi sebelum submit
- fondasi siap untuk redesign dashboard dan wizard form berikutnya

---

## 10. Scale-up UI/UX SARING-PIE + PD3I — Progress 2026-07-11

Scale-up dilakukan bertahap dengan prinsip **progressive enhancement**: route, ID field, endpoint, dan logic backend dipertahankan; perubahan difokuskan pada design token, aksesibilitas, komponen reusable, dan microcopy operasional.

### 10.1 Fondasi design system

Sudah tersedia token dasar di `src/Views/style.html`:
- warna utama, surface, border, text
- warna status: success, warning, danger, info
- semantic background/border status
- focus ring terang/gelap
- spacing scale `--space-1` sampai `--space-7`
- radius, shadow, header/sidebar/content width
- alias legacy `--pd3i-*` tetap dipetakan agar UI lama tidak pecah

Komponen reusable yang sudah ada:
- button/action: `.pd3i-btn`, `.pd3i-action-btn`, `.pd3i-row-actions`
- status/risk: `.pd3i-status-chip`, `.pd3i-risk-badge`
- UI state: `.pd3i-ui-state`, `renderPd3iUiState()`, `setPd3iUiState()`
- skeleton: `.pd3i-skeleton`, `renderPd3iSkeleton()`
- table/filter/mobile: `.pd3i-filter-toolbar`, `.pd3i-data-table-wrap`, `.pd3i-data-table`, `.pd3i-mobile-list-card`
- form: `.pd3i-form-section`, `.pd3i-form-grid`, `.pd3i-form-field`, `.pd3i-field-help`, `.pd3i-field-error`
- feedback: `showPd3iBanner()`, `showPd3iToast()`
- dialogs: `pd3iConfirmDialog()`, `pd3iPromptDialog()`

### 10.2 Navigasi dan app shell

Sudah selesai:
- sidebar Surveilans PD3I + Kasus PD3I accordion
- page breadcrumb `#pd3i-breadcrumb`
- workspace header dinamis via `updateWorkspaceHeader()`
- mobile drawer dengan overlay, Escape close, focus restore, reduced motion
- menu **Zero Reporting** mengganti label user-facing lama “SARS” agar tidak rancu dengan SARS-CoV-2

Catatan teknis:
- route/ID internal `sars-*` masih dipertahankan untuk kompatibilitas.
- label UI, dialog, header, dan microcopy sudah memakai “Zero Reporting”.

### 10.3 SARING-PIE operational UI

Sudah selesai:
- menu SARING-PIE dipisah per konteks operasi/lab/analytics
- filters dan CSV export entity
- timeline/audit kasus
- analytics: period trend, SLA, faskes burden, archive reason, summary export
- buttons SARING-PIE pakai `.pd3i-btn`
- risk/status badge SARING-PIE pakai `.pd3i-risk-badge` dan `.pd3i-status-chip`
- prompt arsip kasus PIE memakai `pd3iPromptDialog()`
- list/loading SARING-PIE memakai skeleton reusable
- form screening SARING-PIE memakai form section/grid/field reusable

### 10.4 Zero Reporting workspace

Sudah selesai:
- user-facing terminology: **Zero Reporting**
- alert/confirm native browser diganti banner/dialog
- submit/delete memakai `confirmSarsAction()` berbasis reusable confirm dialog
- sukses route ke toast saat tersedia
- dashboard/detail memakai reusable table/filter/mobile hooks
- form memakai reusable form hooks tanpa mengubah ID/form logic

### 10.5 Microcopy dan feedback

Aturan aktif:
- sukses non-kritis → toast
- error/blocker/actionable → banner
- loading list/dashboard → skeleton
- empty/error/success state in-section → `renderPd3iUiState()`

Contoh microcopy baru:
- `Data belum berhasil dimuat. Periksa koneksi, lalu coba kembali.`
- `Data tidak ditemukan. Periksa kriteria pencarian atau nomor kasus.`
- `Isi minimal satu kriteria pencarian sebelum mencari data.`

### 10.6 Regression guard

Guard utama ada di `tests/uiux.scaleup.test.js` dan mencakup:
- sidebar/accordion/app shell
- design tokens
- breadcrumb/header
- UI state + skeleton
- mobile drawer
- table/filter/mobile card hooks
- dialog/prompt/toast
- buttons/action pattern
- status/risk badge
- form hooks
- Zero Reporting terminology
- microcopy routing toast/banner
- semantic/focus tokenization

Selain itu, SARING-PIE blueprint guard ada di `tests/pie.blueprint.test.js`.

### 10.7 Rollout checklist sebelum stable `/exec`

Dev QA wajib lewat di:
`https://script.google.com/macros/s/AKfycbzYZ9jl6-uLQw-a75l1p1Fz0zW43EUfx3qWjjJb8WzQ/dev`

Checklist browser QA:
- login Google account PD3I benar: `ccc19depok@gmail.com`
- sidebar accordion + mobile drawer
- breadcrumb dan workspace header
- toast/banner/dialog/prompt
- PD3I Daftar Kasus: cari, edit, hapus dialog
- Zero Reporting: input, delete row, submit report, dashboard detail
- SARING-PIE: screening, archive prompt, timeline, export CSV, analytics
- responsive mobile cards/table scroll
- no visible “SARS/SARS-CoV-2” user-facing label untuk modul Zero Reporting

Stable `/exec` versioned deployment hanya dilakukan setelah browser QA dev lulus.

### 10.8 Next UI/UX scale-up backlog

Prioritas berikutnya:
1. lanjut audit hardcoded spacing/radius/layout yang masih aman ditokenkan
2. reusable modal base/focus trap untuk dialog umum
3. konsolidasi internal naming `sars-*` → `zero-reporting-*` bila sudah siap migrasi route aman
4. visual polish dashboard analytics dan mobile card density
5. dokumentasi UAT ringan untuk operator faskes/dinkes

### Scale-up UI/UX PD3I — Diagnosis-aware wizard foundation

- Form PE stepper now includes a diagnosis-aware guide below the main stepper.
- `renderDiagnosisStepGuide(activeStepId)` derives the active diagnosis from `#form-selector` or edit/view badges, then highlights the current workflow step.
- Guide keeps existing payload/API untouched; it only adds contextual microcopy for Input, Verifikasi EPID, Hasil Pemeriksaan, and Status Pasien/Kasus.
- Regression guard: `tests/uiux.scaleup.test.js` verifies DOM anchors, JS helpers, active-step rendering, and style hooks.

### Scale-up UI/UX PD3I — Full review panel before submit

- Submit area now includes `#pd3i-submit-review-panel` before the save button, so users can see mode, workflow stage, diagnosis, EPID behavior, and active warning count before opening the final confirm dialog.
- `renderPd3iSubmitReviewPanel(submitMode, activeStageOnSubmit, warnings)` reuses `getPd3iSubmitReviewItems(...)` to keep panel and dialog copy consistent.
- Warning state uses `.has-warning`; no backend payload/API change.
- Regression guard ensures the panel appears before `#btn-submit`, uses shared review items, and has style hooks.

### Scale-up UI/UX PD3I — Rich diagnosis-specific wizard hints

- Diagnosis-aware wizard guide now summarizes `DIAGNOSIS_CONFIG[dx].sections` instead of showing only a generic field count.
- `countDiagnosisSpecificFields(cfg)` supports both flat `fields` and grouped `sections[].fields` configs.
- Status step microcopy reads diagnosis-specific status option count via `getCaseStatusOptions(dx)` when available.
- Result: stepper gives clearer per-diagnosis focus while preserving the existing form schema and save API.

### Scale-up UI/UX PD3I — Actionable diagnosis guide

- Diagnosis-aware wizard guide items are now `<button>` controls with `data-guide-step`.
- Clicking a guide item calls `goToWorkflowStep(stepId)`, so the guide doubles as contextual navigation.
- Active guide item exposes `aria-current="step"`; focus-visible styling uses the global focus ring token.
- Regression guard verifies button markup, delegated click handling, and keyboard-visible focus hook.

### Scale-up UI/UX PD3I — Submit review completion snapshot

- Submit review panel now includes a required-field completion snapshot for each workflow step.
- `renderPd3iSubmitCompletionSnapshot(activeStageOnSubmit)` reuses `countRequiredCompletionForSections(...)` and `getWorkflowStepDefinitions()`.
- Active step is visually highlighted, and each step shows filled/total required fields plus a compact progress meter.
- Regression guard verifies helper, reuse of completion counter, panel markup, and meter styles.

### Scale-up UI/UX PD3I — Submit readiness state

- Submit review panel now shows a readiness badge before metadata and completion snapshot.
- `getPd3iSubmitReadinessState(warnings)` combines visible required-field validation and diagnosis business-rule validation.
- States: `ready` (`Siap simpan`), `warning` (`Siap dengan catatan`), and `blocked` (`Belum siap simpan`).
- Blockers are surfaced inside the panel with `.has-error`; warnings continue to use `.has-warning`.

### Scale-up UI/UX PD3I — Live submit review refresh

- Submit review/readiness panel now refreshes when form values change, instead of waiting for submit click or step navigation.
- `schedulePd3iSubmitReviewRefresh(reason)` debounces ordinary input updates and refreshes immediately when diagnosis changes.
- Hooked into existing `input` and `change` listeners for dynamic form shells and `#form-selector`.
- Regression guard verifies debounced scheduler and live refresh hooks.

### Scale-up UI/UX PD3I — Jump to first blocker

- Blocked submit readiness now can show `Lompat ke field pertama` when the first invalid visible required field has an id.
- Live readiness uses `getFirstInvalidRequiredVisibleField(...)` to detect blockers without focusing/reporting validity on every keystroke.
- Clicking the jump button opens the related workflow step via `goToWorkflowStep(...)`, then focuses and scrolls the field into view.
- Regression guard verifies quiet invalid-field detection, jump button markup, focus behavior, and styles.

### Scale-up UI/UX PD3I — Mobile submit review bar

- Form submit area now has a mobile-only sticky mini bar: `#pd3i-mobile-submit-bar`.
- The bar mirrors submit readiness label/message through `updatePd3iMobileSubmitBar(readiness)` and supports `ready`, `warning`, and `blocked` border states.
- `#pd3i-mobile-submit-jump` scrolls users back to the full review panel or submit button, reducing mobile backtracking on long forms.
- Regression guard verifies DOM anchors, JS sync, sticky mobile CSS, and 44px tap target.

### Scale-up UI/UX PD3I — Mobile blocker shortcut

- Mobile submit bar now stores `data-first-blocker-id` from submit readiness.
- Button label changes from `Review` to `Perbaiki` when a blocker field is available.
- Mobile click first tries `jumpToPd3iSubmitBlocker(blockerId)`; if no blocker exists, it falls back to scrolling to the full review panel.
- Desktop and mobile blocker jumps share the same helper, reducing behavior drift.

### Scale-up UI/UX PD3I — Actionable validation summary

- Sticky validation summary items now render as buttons with `data-validation-issue`.
- `jumpToPd3iValidationIssue(issue)` attempts to match issue text to form labels, opens the related workflow step, then focuses and scrolls the field.
- If no target is found, the item remains a harmless summary control.
- Regression guard verifies jump helpers, button markup, delegated click handling, and focus-visible style.

### Scale-up UI/UX PD3I — Explicit validation target hints

- Actionable validation summary now uses `PD3I_VALIDATION_TARGET_HINTS` before falling back to loose label-text matching.
- Target hints cover common business-rule messages: chronology dates, EPID verification, lab result fields, status rationale, school/age checks, MR/DIF/PERT/TN/AFP specific blockers.
- `findPd3iControlByLabelText(labelText)` centralizes label-to-control lookup for validation jumps.
- Regression guard verifies representative target hints and registry-first matching.

### Scale-up UI/UX PD3I — Field jump highlight

- Validation and submit blocker jumps now call `highlightPd3iFieldTarget(target)` after focus/scroll.
- The helper marks the field wrapper with `.pd3i-field-jump-highlight` for 2.2 seconds, then removes it.
- CSS pulse uses the primary token and respects `prefers-reduced-motion: reduce`.
- Regression guard verifies helper, timer cleanup, jump usage, animation, and reduced-motion fallback.

### Scale-up UI/UX PD3I — Collapsible submit review panel

- Submit review panel now has an accessible detail toggle: `#pd3i-submit-review-toggle`.
- `setPd3iSubmitReviewCollapsed(collapsed)` updates `data-collapsed`, `hidden`, `aria-expanded`, and button copy.
- Default remains expanded so review content is visible before submit; users can collapse after checking details.
- Regression guard verifies markup, ARIA, toggle logic, and focus styling.

### Scale-up UI/UX PD3I — Review auto-expand on warning/blocker

- Collapsible submit review panel now auto-expands when readiness state is `warning` or `blocked`.
- This prevents users from hiding active validation notes or blockers while keeping the panel collapsible when the form is clean.
- Regression guard verifies auto-expand runs from `renderPd3iSubmitReviewPanel(...)`.

### Scale-up UI/UX PD3I — Safe persisted review collapse state

- User collapse choice for the submit review panel is tracked in `PD3I_SUBMIT_REVIEW_USER_COLLAPSED` during the session.
- Clean/ready forms preserve the user's collapsed preference across live refreshes.
- Warning or blocked readiness still auto-expands the panel, overriding the preference so active issues are visible.
- Regression guard verifies user-driven collapse state, safe restore, and warning/blocker override.

### Hotfix — SARING-PIE operations/lab panel visibility

- Fixed empty **Operasional & PE** and **Lab & One Health** tabs caused by role visibility toggles reusing the same `.hidden` class as tab isolation.
- `applyPieRoleUi()` now uses `.pie-role-hidden`, while `applyPieTab()` keeps ownership of tab/subtab `.hidden` and `aria-hidden` state.
- `initPieWorkspace()` and `refreshPieOperational()` reapply role visibility first, then tab visibility, preventing role refresh from clobbering active tab panels.
- Regression guard verifies role visibility no longer toggles `.hidden` on `data-pie-panel` and that operations/lab tab visibility is reapplied after role UI.

### Hotfix guard — SARING-PIE active tab content visibility

- Added `ensurePieActiveTabHasVisibleContent(tab)` as a defensive guard after SARING-PIE tab/role visibility changes.
- Operations tab checks whether any operation subpanel is visible; if not, it restores the active/default operation panel (`alerts`).
- Lab tab explicitly restores `data-pie-subtab="lab"` visibility after role/tab refresh.
- Regression guard verifies operations and lab visibility guard wiring.

### Hotfix guard — SARING-PIE visible empty states

- Added `renderPieEmptyState(title, detail)` and `ensurePieVisibleListFallbacks()` so active SARING-PIE panels never look blank while data is empty/loading.
- Fallbacks cover alerts, tasks, classification, PE forms, case list, specimens, labs, clusters, and One Health lists.
- The active-tab visibility guard and operational refresh call the fallback helper after visibility/data refresh.
- Regression guard verifies all critical list anchors have fallback coverage and `.pie-empty-state` styling.

### Hotfix guard — SARING-PIE active tab health banner

- Added `#pie-tab-health` status banner for SARING-PIE tabs.
- `ensurePieActiveTabHasVisibleContent(tab)` now performs a final self-check after recovery/fallbacks. If the active tab still has no visible panel, users see a warning instead of a blank screen.
- The banner suggests reload or role-access check and clears automatically when active content is visible.
- Regression guard verifies banner anchor, `setPieTabHealth(...)`, final visibility check, and warning-token styling.

### Scale-up UI/UX SARING-PIE — Accessible operations subnav

- Operations subnav buttons now use `role="tab"`, `aria-controls`, and roving `tabindex` state.
- Operation content blocks now use matching `id="pie-ops-panel-*"` anchors and `role="tabpanel"`.
- Changing an operations subtab reruns the active-tab content guard so the health banner state stays current after subnav clicks.
- Regression guard verifies tab/panel ARIA wiring for alerts, tasks, classification, PE, and cases.

### Scale-up UI/UX SARING-PIE — Main tab navigation state

- Sidebar links for SARING-PIE tabs keep their existing `data-pie-tab` anchors for screening, dashboard, operations, and lab.
- `applyPieTab(tab)` now marks the active tab link with `aria-current="page"` and removes it from inactive SARING-PIE tab links.
- This keeps visible active state and assistive-technology state aligned when switching SARING-PIE sections.
- Regression guard verifies all four tab anchors and `aria-current` cleanup behavior.

### Scale-up UI/UX SARING-PIE — Operations subnav keyboard navigation

- Operations subnav now supports keyboard movement across tabs with ArrowRight/ArrowDown, ArrowLeft/ArrowUp, Home, and End.
- `handlePieOpsTabKeydown(e)` activates the next target, reruns the active-tab content guard, and moves focus to the selected tab.
- This complements roving `tabindex` so keyboard users can move between Notifikasi, Tugas, Klasifikasi, Form PE, and Daftar Kasus without pointer input.
- Regression guard verifies key support, focus transfer, panel activation, and content guard refresh.

### Scale-up UI/UX SARING-PIE — Operations tab/panel ARIA linkage

- Each operations tab now has a stable `id="pie-ops-tab-*"`.
- Each matching operations panel now declares `aria-labelledby="pie-ops-tab-*"`.
- This completes the accessible tab pattern started by `role="tab"`, `aria-controls`, `role="tabpanel"`, `aria-selected`, and roving `tabindex`.
- Regression guard verifies bidirectional tab/panel linkage for alerts, tasks, classification, PE, and cases.

### Scale-up UI/UX — Cross-module control normalization

- Added a shared normalization layer under `.pd3i-body` for legacy Bootstrap controls that still appear across SARING-PIE, Settings, Zero Reporting, and generated workspaces.
- Raw `.btn`, `.btn-sm`, primary/outline/danger variants, `.form-control`, `.form-select`, `.rounded`, `.rounded-3`, and common border/surface utility combinations now map to PD3I tokens for radius, spacing, border, color, focus ring, and shadow.
- This keeps existing markup, routes, field IDs, and Apps Script payloads unchanged while reducing visual drift in buttons, inputs, cards, and utility panels.
- Regression guard verifies the token-backed normalization layer so future modules do not drift back to unstyled Bootstrap defaults.

### SARING-PIE tab-section DOM isolation fix (2026-07-11)

Browser screenshots showed **Operasional & PE** and **Lab & One Health** rendering only the shared module header and mode cards, with the content area blank. Root cause: the shared content wrapper was marked `data-pie-tab-section="screening" data-pie-panel="rs"`, so tab isolation hid the parent wrapper before child panels for `operations` and `lab` could display.

Fix:

- Keep the shared wrapper tab-neutral.
- Mark only screening-specific result/direction/debug cards as `data-pie-tab-section="screening" data-pie-panel="rs"`.
- Keep the combined Dinkes panel as `data-pie-tab-section="operations lab" data-pie-panel="dinkes"`.
- Regression guard: `SARING-PIE operations and lab panels are not nested inside screening-only wrapper`.

This confirms the pages are valid to split. Blank content was DOM nesting/visibility state, not a limitation of separating **Operasional & PE** and **Lab & One Health**.

### SARING-PIE Form PE template preview (2026-07-11)

User QA found the **Form PE** subpanel only showed the PE list, which is empty until a draft is created from a case. To make the form format discoverable before a draft exists, the Form PE subpanel now includes a read-only **Preview format Form PE** card.

Preview behavior:

- Location: **SARING-PIE → Operasional & PE → Form PE**.
- Template selector options: `FLU_BURUNG_RESPIRATORY`, `RABIES`, `LEPTOSPIROSIS`, `NEUROLOGIC_ZOONOSIS`, `CLUSTER_KLB`, `GENERAL`.
- Preview shows shared PE investigation fields plus disease/template-specific field groups.
- Existing draft workflow is unchanged: real editable Form PE still opens from **Buka Form PE** or **Lanjutkan ke Form PE** after a case/draft exists.
- Regression guard: `SARING-PIE Form PE tab exposes template preview before draft exists`.

### SARING-PIE operations workflow clarification (2026-07-11)

User QA found **Klasifikasi** duplicated action buttons already available in **Daftar Kasus**. Workflow was adjusted so each operations subpanel has one clear job:

- **Klasifikasi** is now triage/read-only review: risk, clinical acuity, candidate disease, notification, current classification.
- **Daftar Kasus** is now the canonical mutation/action hub: `UNDER_REVIEW`, `SUSPECT`, `PROBABLE`, `CONFIRMED`, `DISCARDED`, lab prefill, timeline, archive.
- Klasifikasi cards include **Buka aksi di Daftar Kasus** to jump to the relevant case row without duplicating mutation buttons.
- Regression guard: `SARING-PIE classification panel is triage-only and case actions live in Daftar Kasus`.

### Zero Reporting internal naming migration (2026-07-11)

The former user-facing **SARS** labels had already been replaced with **Zero Reporting**. This batch moves the app-shell/workspace internals toward canonical `zero-reporting-*` names while preserving legacy compatibility.

Changed:

- Sidebar workspace IDs now use `zero-reporting-form` and `zero-reporting-dashboard`.
- Section IDs now use `section-zero-reporting-form` and `section-zero-reporting-dashboard`.
- CSS hooks now use `pd3i-zero-reporting-*` and `pd3i-nav-link-zero-reporting`.
- `normalizeSidebarWorkspace()` maps legacy `sars`, `sars-form`, `section-sars-form`, `sars-dashboard`, and `section-sars-dashboard` to canonical Zero Reporting workspaces.
- `routes.js` accepts both legacy page params (`sars-form`, `sars-dashboard`) and new page params (`zero-reporting-form`, `zero-reporting-dashboard`).

Deferred for a later compatibility window:

- Apps Script backend folder/function names such as `src/SARS`, `submitSARS`, and `SARS_CONFIG` remain unchanged because they are sheet/API/runtime compatibility boundaries.

Regression guard: `Zero Reporting internal workspace naming uses zero-reporting aliases while preserving legacy compatibility`.

### Canonical PD3I UI system override layer (2026-07-11)

User QA requested CSS cleanup instead of continued patch-by-patch styling. A canonical final override layer was added to `src/Views/style.html` as the source of truth for cross-module visual consistency.

Scope:

- Shared UI variables: `--ui-control-height`, `--ui-control-radius`, `--ui-card-radius`, `--ui-card-pad`, `--ui-focus`, and related aliases.
- Unified buttons across `.btn`, `.pd3i-btn`, `.pd3i-action-btn`, confirm buttons, overview buttons, queue/page buttons, and native `button[type]` controls.
- Unified inputs across `input`, `select`, `textarea`, `.form-control`, and `.form-select`.
- Unified cards/panels across `.pd3i-shell-card`, `.pd3i-form-section`, `.pd3i-zero-reporting-card`, `.bg-white.border`, `.border.rounded`, `.border.rounded-3`, and `.card`.
- Unified status chips/badges, table headers/cells, filter/status strips, spacing, focus, disabled, and mobile touch targets.
- Legacy Bootstrap/Tailwind/older PD3I class names are treated as aliases into the canonical system, not separate styling systems.

Regression guard: `canonical PD3I UI system overrides legacy controls consistently across modules`.

### Deep UI QA hard reset v2 (2026-07-11)

Browser/CDP computed-style audit across logged-in production modules found remaining visual drift caused by legacy module selectors overriding the canonical UI layer:

- Zero Reporting dynamic row buttons still used `6px` radius and some 34px heights.
- Zero Reporting form fields still used mixed `6px` and `11px` radius.
- PIE legacy `rounded`/`rounded-3` cards still resolved to `14px` in several operation panels.
- Checkbox controls in PIE were correctly excluded from text-field normalization.

Fix:

- Added **Canonical UI hard reset v2** below the canonical system layer.
- Stronger selectors normalize `.btn-remove`, `.btn-add`, `.pd3i-btn`, native `button[type]`, Zero Reporting/SARS form fields, and card aliases.
- Checkbox/radio controls keep compact 18px dimensions and primary accent color.
- Compact `p-2 border rounded` mini-cards intentionally use 14px radius; main cards use 18px.

Regression guard: `canonical UI hard reset beats legacy module selectors for controls and cards`.

### CSS cleanup after canonical hard reset (2026-07-11)

After the canonical UI system and hard reset v2 proved stable, the earlier `Cross-module UI normalization` block was retired to reduce patch layering. The final canonical layer now owns Bootstrap/Tailwind legacy aliases for controls, form fields, cards, tables, badges, and mobile touch targets.

Updated regression guard: `cross-module Bootstrap controls are normalized to canonical PD3I UI tokens`.
