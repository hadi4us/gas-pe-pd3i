# UI Migration Progress

## 2026-08-22

- Baseline audited across 14 workspace views.
- Confirmed duplicate button systems, card systems, page headers, local style blocks, and inline styles.
- Created `UI-MIGRATION-PLAN.md` with batch order, safety rules, and acceptance gates.
- Batch 0 complete: Settings Rule ID inline width moved to `.pd3i-settings-rule-id`.
- Batch 1 started: existing final UI standardization layer audited as compatibility layer for legacy and canonical button systems.
- Settings and Search migration started: Settings section surfaces now opt into `.pd3i-section-card`; Search page and filter headers opt into `.pd3i-page-header` while retaining legacy classes.
- Dashboard and Overview headers now opt into `.pd3i-page-header` while retaining existing layout classes and handlers.
- Form, Input, Verification, Status, and Sample section headers now opt into `.pd3i-page-header` while retaining existing form classes, compact modifiers, IDs, and handlers.
- SARS filter headers and PIE command hero now opt into `.pd3i-page-header`; existing SARS/PIE classes remain for local behavior and responsive styling.
- No business logic, IDs, handlers, access rules, or deployment targets changed.
- Development/Production deployment not performed in this step.

## Next checkpoint

- Add canonical page action-group and card-level primitives without removing legacy selectors.
- Complete Settings, Search, Dashboard, and Overview migration.
- Run repository checks and inspect responsive selectors for migrated forms.
- Complete safe SARS/PIE header migration.
- Inspect remaining PIE nested cards and SARS local styles before deciding next card migration.
- Repository check attempted: `npm run test:node` currently fails on an existing workflow-search assertion (`normalized === 'search'` branch), unrelated to current UI changes; no Development deploy yet.
- PIE regression assertion updated to match already-committed safe nested-card rule (`min-width:0`), but full suite remains blocked by the unrelated existing assertion.
- PIE inline widths for template preview and case filters moved to scoped classes; mini-bar fixed heights moved to CSS, preserving dynamic width percentage.
- SARS empty-state spacing and rows-per-page width moved to local classes; runtime display behavior preserved.
- SARS weekly-detail table borders and empty-state presentation moved from generated inline styles to CSS classes.
- Remaining PIE `style="width:'+pct+'%"` is intentional dynamic data-bar width; fixed presentation dimensions already moved to CSS.
- Run targeted/static checks and responsive smoke review before first Development deploy.
- Hygiene check passed.
- Endpoint security matrix check passed; generated line-number metadata refreshed after source edits.
- Workflow-search assertion corrected to current intended behavior: opening Search clears inbox and waits for explicit search.
- Full Node regression suite passed: 271/271.
- Full `npm test` passed: Node tests, hygiene, and endpoint security checks.
- No UI-specific test failure remains.
- Development deployment updated successfully: `AKfycbyvwxhm2ycZ-1R45QeTKSM4l5JQ9OIX7MqN9uBusGKhUM8McveAM5ydHXc5WaACD6Od @81`.
- Deployment description: `UI migration batch 1 - shared government UI primitives`.
- Development URL opened successfully; page title confirmed `SIMPEL Surveilans Kota Depok`.
- Production deployment unchanged. User visual smoke test remains next acceptance gate.
- Run visual/responsive smoke checks before each Development deployment.
- Keep `.clasp.json` restored to repository default outside deployment operation.
## 2026-08-25 — Browser tooling reconciliation and hybrid QA mode

- Browser shared human/tool session recovery stopped by Main Review.
- Root cause confirmed: Gateway managed browser runs on host, while noVNC/Xvfb live inside sandbox-browser container; host Gateway cannot access sandbox X display.
- Option 1 sandbox attach route closed: `SUPPORTED_SANDBOX_ATTACH_ROUTE=NO`; no raw CDP follow-up.
- Rollback state healthy: Gateway active, managed `openclaw` remains headless, no config JSON mutation, no source/dev/prod mutation.
- Program tooling mode updated: `PROGRAM_TOOLING_MODE=HYBRID_HUMAN_ASSISTED_QA`; `PROGRAM_BLOCKED=NO`; `APPLICATION_PROGRAM_BLOCKED=NO`.
- Evidence model: source evidence from `ui-dev`; runtime visual evidence from human-controlled noVNC screenshots; runtime interaction evidence from non-destructive human-assisted checks; DOM evidence marked `AVAILABLE` or `NOT_AVAILABLE_TARGET_LIMITATION`.
- Dashboard `DASH-001` remains fixed on current DEV; do not reimplement. Next: pending hybrid post-deploy validation and Main Post-Deploy Review.
- Edit reopened after Dashboard: `PAGE=edit`, `PAGE_STATE=DEEP_AUDIT_PENDING`, `EDIT-001=AUDIT_INPUT_NOT_PROVEN`; no speculative fix.
- Search/UI-009 remains frozen. Production unchanged.
## 2026-08-25 — Dashboard @176 hybrid QA evidence

- Human noVNC screenshots received for Dashboard PD3I current DEV @176.
- Runtime visual evidence shows authenticated dashboard loaded after transient session-check screen.
- Evidence observed: sidebar/topbar visible, Dashboard PD3I active, filters render, MR 2026 data cards render, weekly epidemiology chart renders, regional top lists render, choropleth/hotspot map renders, age/epidemiology distribution panels render, export action visible.
- No obvious app-owned horizontal overflow in supplied desktop captures; vertical scroll expected for long dashboard.
- Not fully validated from supplied captures: explicit Back to Workspace click behavior, mobile/tablet breakpoints 900/768/390/360, non-destructive filter interaction.
- Dashboard state: `POST_DEPLOY_HYBRID_QA=PARTIAL_PASS_WITH_HUMAN_RUNTIME_EVIDENCE`; Main Post-Deploy Review pending remaining breakpoint/action evidence before ACCEPTED.
