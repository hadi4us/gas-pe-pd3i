# UI CSS Rewrite Specification

Status: audit complete, rewrite not active.

## Baseline

- Development baseline: `@87`
- Production: untouched
- Current active stylesheet: `src/Views/style.html`
- Duplicate `style.shell.html`: removed
- Backup: `.backup-style-total-20260822T142700Z/`
- Selector matrix: `docs/UI_SELECTOR_MATRIX.generated.json`
- Node regression: 271/271 pass before rewrite

## Non-negotiable runtime hooks

Preserve every ID and `pd3i-*` class referenced by:

- `src/Views/app*.html`
- `src/Views/workspace_*.html`
- `src/SARS/*.html`
- `src/**/*.js`
- `src/**/*.gs`

CSS may change appearance, but must not rename/remove hooks. Generated runtime classes require explicit rules or safe defaults.

## Rewrite architecture

One `style.html`, ordered sections:

1. `@layer reset` and design tokens
2. base typography and accessibility
3. application shell (`#app`, sidebar, page, topbar, content)
4. navigation and responsive drawer
5. shared primitives (buttons, badges, cards, fields, banners, tables, modal, loading)
6. workflow forms and validation
7. search/case registry
8. dashboard and charts
9. SARS / Zero Reporting
10. PIE
11. settings / administration
12. responsive rules
13. print rules

Do not add another stylesheet. Do not use broad `!important` overrides. Do not use duplicate token names. Keep third-party Choices/Leaflet styling scoped.

## Visual target

- Sidebar: compact dark navigation, width 224px desktop.
- Page: slate-white background, content uses available width.
- Cards: white surface, one border, one radius, one shadow.
- Accent: one teal/blue primary; status colors reserved for status.
- SARS and PIE: same card, field, table, badge, button vocabulary.
- Mobile: drawer sidebar, one-column forms, horizontally scrollable data tables, no page overflow.

## Gates

1. Static hook check: no required ID/class removed.
2. `npm test`: all tests pass.
3. Browser desktop smoke: Daftar Kasus, SARS, PIE, Dashboard.
4. Browser mobile smoke: same routes, no horizontal page overflow.
5. Screenshot comparison shows intended change.
6. Development deploy only. Production requires explicit request.
