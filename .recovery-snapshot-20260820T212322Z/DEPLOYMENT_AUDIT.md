# Deployment audit — 2026-08-20/21

## Protected source
- Base branch: `perf-isolated-2026-07-28` at `b586831`
- Recovery worktree: `../gas-pe-pd3i-recovery-audit`
- Local snapshot: `.recovery-snapshot-20260820T212322Z/`
- PDF stash retained: `stash@{0}`

## Change sets

### Local working tree (candidate 19–20 Aug)
- `src/Auth/auth.js`: Brevo OTP sender, email normalization, error handling. External service/config dependency. High risk.
- `src/Controllers/print.js`: PDF cache identity patch. Medium risk; must preserve older print flow.
- `src/SARS/dashboard_sars.js`: `ALL/SEMUA/*` week filter. Medium risk; overlaps stash SARS changes.
- `src/SARS/submit_sars.js`: FaskesKey header fallback and duplicate check. Medium risk; schema compatibility.
- `src/Views/workspace_sars.html`: all-week selector and summary. Medium risk; overlaps stash UI.
- `docs/ENDPOINT_SECURITY_MATRIX.generated.json`: generated documentation only; regenerate/verify after code merge.

### Stash `stash@{0}` (6 Aug, 25 files, +951/-129)
- PDF export/routing and templates
- SARS dashboard/UI
- workflow/app JS and styles
- migration/schema/data changes
- tests and appsscript manifest
- socialization docs/assets also present as untracked files

## Conflict
`src/SARS/dashboard_sars.js` conflicts between base and stash. Base contains newer facility-scope matching; stash contains broader SARS changes. Resolve by taking stash feature changes while preserving base facility scope logic, then layer local ALL-week patch.

## Deployment gate
Do not push/deploy until:
1. Merge into isolated release branch.
2. Run full tests and targeted PDF/SARS checks.
3. Review generated security matrix.
4. `clasp status/push` against correct script ID/account.
5. Development deploy only, with version/hash recorded.
6. HTTP and browser smoke tests pass.
7. Production remains untouched unless explicitly approved.
