# UI Migration Plan — SIMPEL Surveilans

Status: Active
Owner: MasBro + Bang Toyib
Scope: global UI consistency across all workspace menus
Production: locked; no Production deploy without explicit approval
Development: deploy only after batch gates pass

## Rules
- Preserve IDs, event handlers, business logic, access scope, and sensitive-data boundaries.
- One UI system: `.pd3i-btn`, shared page header, shared card levels, shared form controls, shared table wrapper.
- No new inline styles.
- No new `!important`.
- Do not delete legacy selectors until all consumers migrate and compatibility is verified.
- Every batch: baseline diff, implementation, `git diff --check`, targeted tests, desktop/mobile review, commit, Development deploy, metadata verification.
- `.clasp.json` must point to Development before Development push/deploy and be restored after.

## Baseline findings
- Main global CSS: `src/Views/style.html`.
- Local style blocks: `workspace_pie.html`, `workspace_sars.html`, `workspace_settings.html`.
- Duplicate button systems: `.pd3i-primary-button`/`.pd3i-ghost-button` and `.pd3i-btn.is-*`.
- Multiple card systems: `.pd3i-card`, `.pd3i-shell-card`, `.pd3i-form-card`, `.pd3i-form-card-section`, `.pd3i-overview-panel`, `.pd3i-settings-surface`, `.pie-inner-card`.
- Multiple page-header systems: card header, dashboard toolbar, search toolbar, SARS filter head, PIE hero, settings hero.
- Inline style inventory exists in PIE, SARS, Settings.
- Existing untracked recovery directories must not be modified or deleted.

## Batch sequence
### Batch 0 — control and compatibility layer — COMPLETE
- Record baseline and freeze local CSS expansion.
- Define canonical tokens and compatibility aliases only where needed.
- Normalize Settings Rule ID inline width.
- Gate: diff check, no behavior change.

### Batch 1 — global primitives — IN PROGRESS
- Canonical button geometry/states.
- Canonical page header/action group.
- Canonical card levels and shared form controls.
- Do not remove legacy selectors yet.

### Batch 2 — core workflow menus
Order: Dashboard, Overview, Search, Input, Verification, Status, Sample.

### Batch 3 — SARS and PIE
- Align headers, filters, action groups, cards, tables, responsive behavior.
- Keep clinical/epidemiological behavior unchanged.

### Batch 4 — Settings and Guide
- Normalize administrative panels, warnings, confirmation actions, and guide cards.
- Remove safe inline styles.

### Batch 5 — cleanup and hardening
- Remove obsolete selectors only after repository-wide consumer search.
- Reduce duplicate rules and local `<style>` blocks.
- Accessibility and responsive regression pass.

## Acceptance gates
- `git diff --check` clean.
- No changed business logic unless explicitly scoped.
- No changed IDs/handlers/access rules.
- Desktop, laptop, mobile review.
- Loading, empty, error, disabled, modal, table-overflow states checked.
- Development deployment metadata recorded.
- Production unchanged unless explicitly approved.
