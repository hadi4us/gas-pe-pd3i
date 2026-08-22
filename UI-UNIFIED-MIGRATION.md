# Unified UI migration

Status: staged, not active.

## Safety baseline

- Baseline `src/Views/style.html` restored from `.backup-style-rewrite-20260822T134732Z/style.html`.
- Current tests: 271/271 pass.
- Production untouched.
- Development deployment not changed by failed rewrite attempt.

## Rules

- Preserve all HTML IDs, JS handlers, backend/API, workflow behavior.
- One visual token set for shell, forms, SARS, PIE, dashboard, settings.
- No rewrite activation until full `npm test` passes.
- No Development deploy until browser screenshot verifies visible change.

## Migration order

1. Token + shell layer.
2. Shared cards, fields, buttons, tables, banners.
3. SARS selectors and generated tables.
4. PIE cards, filters, bars, result panels.
5. Dashboard/search/settings workspace-specific layout only.
6. Remove obsolete CSS blocks and update regression assertions.

## Current blocker

Existing UI regression tests assert legacy CSS marker comments/selectors. Rewrite must migrate those assertions first, or tests lose value. Do not bypass tests.
