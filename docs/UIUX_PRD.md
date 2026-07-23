# SIMPEL Surveilans — UI/UX PRD

Status: active PRD for UI/UX redesign
Owner: MasBro / SIMPEL Surveilans
Implementation target: dedicated UI/UX deployment first

## 1. Product intent

SIMPEL Surveilans is a Google Apps Script web app for daily epidemiologic surveillance operations across PD3I, PIE, and routine reporting. UI/UX redesign must help trained health workers input, verify, monitor, and act on cases faster with fewer interpretation errors.

## 2. Users

- Petugas surveilans puskesmas/faskes: input and follow up cases.
- Verifikator/admin epidemiologi: verify EPID data and case progress.
- Laboratorium/verifikator pemeriksaan: review and update sample/exam results.
- Super-admin: manage configuration, user approval, access, and system operations.
- Leadership/viewer: monitor dashboard, trends, and alerts.

## 3. Problem statement

Current UI has improved but must stay consistent across pages. Risk areas:

- Generic admin-template feel.
- Inconsistent hierarchy between pages.
- Status and metadata colors competing.
- Workflow queues not yet as clear as a surveillance workbench.
- Potential hallucinated implementation if future work lacks a stable blueprint.

## 4. Design goals

1. Official clinical tone.
2. Fast scanability on desktop and mobile.
3. Clear workflow state and next action.
4. Consistent status semantics.
5. Safe asynchronous CRUD behavior.
6. Deployment isolation between Production, Development/core, and UI/UX experiment.

## 5. Non-goals

- No full frontend rewrite.
- No wholesale ThemeForest import.
- No production deployment without explicit approval.
- No dark-mode-first redesign for daily CRUD.
- No heavy plugin dependency stack.

## 6. Requirements

### R1 — Design system

- Use SIMPEL tokens for background, surface, border, text, radius, focus, status.
- Use tabular/monospace numbers for KPI, tables, charts, counts, and queue age.
- Keep red reserved for outbreak/KLB/critical only.

### R2 — Page hierarchy

Every page must use:

1. Breadcrumb or section context.
2. Page title.
3. Optional one-line factual subtitle.
4. Data/work area.

Do not add repeated eyebrows, long instruction paragraphs, or gradient hero cards.

### R3 — Tables/lists/cards

- Metadata neutral.
- Status semantic.
- Primary action obvious.
- Secondary actions grouped, not visually louder than primary.
- Mobile cards readable without horizontal-only dependence.

### R4 — Async states

Every async panel must include:

- loading state.
- empty state.
- error state with user-facing wording.

CRUD buttons must disable and show loading while request is running.

### R5 — Template synchronization

Use ThemeForest template only as layout reference:

- dashboard composition.
- wizard stepper pattern.
- taskboard/inbox queue pattern.
- profile/detail summary pattern.

No direct vendor/plugin import unless separately justified, tested, and approved.

## 7. Acceptance criteria

A UI/UX phase is done only when:

- Source change is scoped and documented.
- `npm test` passes.
- hygiene check passes.
- endpoint security check passes.
- Apps Script push succeeds.
- New version deploys to UI/UX deployment only.
- docs updated.
- memory updated.
- final reply includes URL and version.

## 8. Rollout strategy

1. UI/UX deployment only.
2. Screenshot feedback loop.
3. Stabilize pages.
4. Inspect diffs and test fully.
5. Promote to Development/core only if needed.
6. Promote to Production only on explicit MasBro order.
