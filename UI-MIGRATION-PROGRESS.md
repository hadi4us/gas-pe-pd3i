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
- Full Node regression suite remains blocked by pre-existing workflow-search assertion; no UI-specific failure isolated yet.
- Run visual/responsive smoke checks before each Development deployment.
- Keep `.clasp.json` restored to repository default outside deployment operation.
