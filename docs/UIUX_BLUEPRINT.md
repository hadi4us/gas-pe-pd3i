# SIMPEL Surveilans — UI/UX Blueprint

Status: canonical UI/UX blueprint for redesign implementation

## 1. Canonical experience

SIMPEL is an operational surveillance console, not a marketing app. Every screen must answer:

- What am I looking at?
- Which cases/tasks need action?
- What is the status?
- What is the next safe action?

## 2. Shell model

Keep SIMPEL sidebar model. Do not force full top-navigation because SIMPEL has long role-based workflows.

### Sidebar

Groups:

- Beranda.
- Surveilans PD3I.
- Surveilans PIE.
- Administrasi.
- Panduan Aplikasi.

Role visibility must hide inaccessible items and empty groups.

### Topbar/header

Use for:

- user identity.
- role/unit.
- notifications later.
- dark mode pending; keep all user-facing themes light mode first.
- session context.

### Content

- Comfortable max-width for forms and lists.
- Wider composition allowed for dashboards.
- No decorative hero on operational pages.

## 3. Page patterns

### Beranda

Reference: `light/index.html`.

Pattern:

- Title + factual subtitle.
- KPI cards weighted by operational importance.
- Work-priority cards.
- Alert panel only when critical threshold exists.
- Recent activity/queue summary if data available.

### Dashboard statistik

Reference: `light/index.html`, `chart-chartjs.html`; `dark/index.html` deferred.

Pattern:

- KPI strip.
- Trend panels.
- Distribution panels.
- Status verification panel.
- Alert panel only for true alert/KLB.

### Daftar Kasus

Reference: `doctors-all.html`, `doctor-profile.html`.

Pattern:

- Filter/search bar.
- Desktop list/table hybrid.
- Mobile case cards.
- Patient/case identity primary.
- EPID, date, wilayah as neutral metadata.
- Status pills semantic.
- Primary action visible.

### Detail kasus

Reference: `doctor-profile.html`.

Pattern:

- Case identity summary.
- Timeline/status workflow.
- Clinical/epidemiologic facts grouped.
- Lab/exam summary.
- Audit/activity list if available.
- Next action panel according to role.

### Input/Edit form

Reference: `forms-wizard.html`, `forms-validation.html`.

Pattern:

- Workflow stepper.
- Diagnosis-aware sections.
- Required/error summary.
- Review before save.
- Sticky mobile action allowed.
- No long explanation blocks.

### Workflow queues

Reference: `app-taskboard.html`, `app-inbox.html`.

Pattern:

- Queue columns/cards by workflow stage.
- Each item shows case identity, disease, wilayah, age/queue time when available, status, next action.
- Empty state per queue.
- Error state per queue.
- Primary action role-aware.

### Administrasi

Reference: `app-inbox.html`, `forms-validation.html`, error pages.

Pattern:

- Secure operations console.
- Warning tone for super-admin/system-sensitive actions.
- Approval queue clear and auditable.
- Config changes guarded.
- User management table readable.

### Panduan Aplikasi

Reference: `page-faq.html`.

Pattern:

- Quick-reference cards.
- Role-specific steps later.
- Searchable FAQ later.
- Short Indonesian copy.

### Login/auth

Reference: `page-lockscreen.html`, `page-forgot-password.html`, `forms-validation.html`.

Pattern:

- Official access gateway.
- Clear OTP flow.
- Data confidentiality disclaimer.
- Account request form official and compact.

## 4. Status language

Use these semantic buckets:

- Success: verified, approved, confirmed.
- Warning: pending, needs action, suspected.
- Info: in process, investigation, sample/status queue.
- Muted: rejected, discarded, unavailable, closed.
- Danger: outbreak, KLB, critical, high-priority alert only.

## 5. Mobile rules

- Touch targets at least 40px where practical.
- Sidebar/drawer role visibility must still work.
- Cards should stack one column.
- Avoid dense 5-column grids on small screens.
- Primary action must remain reachable.

## 6. Implementation guardrails

- Preserve IDs/selectors used by JS/tests.
- Prefer CSS class additions over markup rewrites unless hierarchy requires source cleanup.
- Avoid global Bootstrap overrides that break modules.
- Do not hide required content with CSS if source can be fixed safely.
- Run full test gate before deploy.
