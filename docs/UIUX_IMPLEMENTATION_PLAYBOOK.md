# SIMPEL Surveilans — UI/UX Implementation Playbook

Status: execution checklist for OpenClaw or future implementers

## 1. Before editing

1. Read:
   - `docs/UIUX_IMPLEMENTATION_MEMORY.md`
   - `docs/UIUX_PRD.md`
   - `docs/UIUX_BLUEPRINT.md`
   - `docs/UIUX_SIGAP_BASELINE_2026-07-22.md`
2. Confirm target deployment:
   - UI/UX only unless MasBro explicitly says otherwise.
3. Inspect relevant source files.
4. Inspect existing tests if selectors/IDs may be affected.

## 2. Work pattern

For each phase:

1. Define exact surface.
2. Map it to blueprint pattern.
3. Change source minimally.
4. Preserve JS-dependent IDs/classes.
5. Add CSS under named dated/fase comment.
6. Add or update regression tests if behavior/selectors change.
7. Run gate.
8. Deploy UI/UX.
9. Update docs and memory.
10. Report concise result with version and URL.

## 3. Required gate

Run:

```bash
npm test
```

This includes:

- node tests.
- hygiene check.
- endpoint security check.

Do not claim success without gate output or named blocker.

## 4. Apps Script deploy command pattern

Use global clasp:

```bash
/root/.nvm/versions/node/v22.22.2/bin/clasp push
/root/.nvm/versions/node/v22.22.2/bin/clasp version "UIUX <phase name> <date>"
/root/.nvm/versions/node/v22.22.2/bin/clasp deploy --deploymentId AKfycbzVgu6dp9t0AvXPv_U6ISfJciBT6YE5GvxoCe0i2xq30tQQaq0fIYdnlm_-H1Z9e5kn9A --versionNumber <VERSION> --description "UIUX <phase name> <date>"
```

Do not use `npx clasp`.
Do not rotate Production URL.
Do not use combined shorthand that previously failed.

## 5. Anti-hallucination rules

- Do not invent routes, IDs, or backend functions.
- Grep/read source before naming a selector or function.
- If template reference is not locally available, state limitation.
- If data field is unavailable, design placeholder/empty state, not fake data.
- Do not claim browser/manual validation unless performed.
- Do not claim Production change unless deployment ID confirms it.

## 6. Next phase backlog

Priority order:

1. Workflow queue phase:
   - Verifikasi EPID.
   - Pemeriksaan Laboratorium.
   - Status dan Klasifikasi.
2. Detail kasus phase.
3. Dashboard statistik phase 2.
4. Daftar Kasus refinement phase 2.
5. Form wizard refinement phase 2.
6. Light command dashboard. Dark mode pending.

## 7. Done response template

Use concise final format:

- phase name.
- changed surfaces.
- validation result.
- deployment URL.
- version.
- Production untouched statement.
