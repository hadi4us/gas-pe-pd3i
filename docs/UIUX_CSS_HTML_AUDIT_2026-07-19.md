# UI/UX CSS + HTML Audit

Tanggal: 2026-07-19
Scope: `src/**/*.html`, inline `<style>`, shared `src/Views/style.html`, `src/SARS/style.html`, generated HTML in `src/Views/*.js.html`.

## Baseline

- HTML files: 37
- Shared main stylesheet: `src/Views/style.html` — 304,960 bytes / 10,830 lines
- Largest HTML-like files:
  - `src/Views/app.js.html` — 8,951 lines
  - `src/Views/workspace_pie.html` — 690 lines
  - `src/Views/workspace_settings.html` — 580 lines
  - `src/Views/index.html` — 215 lines
- Inline `style="..."` attributes: 51
- `<style>` blocks: 15
- Current local gate before refactor: must run `npm test`, `git diff --check`.
- Browser/extension QA unavailable in current OpenClaw runtime; live visual claims remain unverified.

## Findings (initial static pass)

### 1. CSS ownership is too broad

`src/Views/style.html` owns global utility aliases (`.grid`, `.flex`, `.block`, `.hidden`, positioning and spacing utilities) with `!important`. These aliases can override component CSS and make DOM geometry difficult to reason about. Page-specific settings containment rules were recently removed, but the global aliases remain a systemic risk.

### 2. Mixed styling systems

The main app mixes canonical `pd3i-*` components with utility classes and legacy compatibility markup. Dynamic HTML in `app.js.html` also emits both component classes and utility classes. This increases cascade surface and makes visual parity between Input Kasus and Settings fragile.

### 3. Oversized shared stylesheet

`style.html` is monolithic. Component rules, responsive rules, compatibility aliases, modal rules, and page-specific rules are interleaved. A safe refactor should first add clear section boundaries and a selector inventory, then extract only rules with verified ownership. Blind splitting risks Apps Script include-order regressions.

### 4. Oversized runtime template

`app.js.html` contains UI rendering, event wiring, workflow state, search, queue, dashboard, and modal logic. It is not safe to split mechanically because Apps Script HTML includes and global function dependencies are order-sensitive. Refactor should be behavior-preserving and batch by subsystem.

### 5. Multiple inline style attributes

There are 51 inline style attributes. Some are appropriate for dynamic overlays/coordinates, but static layout styles should migrate to named `pd3i-*` classes. First target: static frame geometry and repeated modal/card styles; preserve dynamic runtime styles.

### 6. Local style blocks in workspace templates

`workspace_pie.html` and `workspace_settings.html` contain local style blocks. Some are component-specific and should remain temporarily; frame geometry overrides should not be duplicated in both local templates and shared stylesheet.

## Refactor policy

1. Preserve DOM IDs, `data-*` hooks, global function names, routes, and server contracts.
2. Do not touch Production deployment.
3. Development deployment only after all gates pass and after MasBro approves deployment if required.
4. One batch at a time; each batch gets tests + `git diff --check`.
5. No browser QA claim until browser tool is available.
6. Do not delete a selector until static references and generated HTML references are checked.

## Planned batches

### Batch A — inventory and guardrails
- Add audit notes and selector reports.
- Confirm test/hygiene baseline.
- No runtime behavior change.

### Batch B — settings/local frame cleanup
- Remove duplicate frame geometry only where exact duplicate is proven.
- Keep table overflow and review modal behavior.
- Verify settings DOM hooks.

### Batch C — component token consolidation
- Identify repeated card/button/input declarations.
- Consolidate only exact semantic duplicates into canonical `pd3i-*` classes.
- Keep compatibility aliases until tests prove no references remain.

### Batch D — safe template extraction
- Extract only self-contained static HTML fragments from oversized templates.
- Preserve Apps Script include order and all globals.
- No mechanical split of `app.js.html` without dependency map.

### Batch E — visual QA
- Browser extension required.
- Compare Input Kasus, Settings, modal, table, mobile breakpoints.
- Fix only observed computed-style/layout defects.
