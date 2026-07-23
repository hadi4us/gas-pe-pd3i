# SARING-PIE MVP SOP

## Scope
SARING-PIE runs inside the existing PD3I Apps Script + Spreadsheet. It is not a separate app.

## URLs
- Development URL: https://script.google.com/macros/s/AKfycbzYZ9jl6-uLQw-a75l1p1Fz0zW43EUfx3qWjjJb8WzQ/dev
- Production URL: https://script.google.com/macros/s/AKfycbzWfWu1LsZGhqPAVKuS6GBp5Z_3eRv1cKlKLD6Xgfvq1hhWr1HCQVIRW6ilvNO0QOzEJA/exec

Use the development URL without `?workspace=pie` for QA.

## First-run admin steps
1. Open the development URL as a super-admin/editor.
2. Open **Pengaturan PD3I / SARING-PIE**.
3. Click **Siapkan Sheet PIE**.
4. Configure Telegram in **Notifikasi & Integrasi**:
   - `TELEGRAM_BOT_TOKEN`
   - `PIE_TELEGRAM_CHAT_ID` for PIE-specific alerts, or fallback `TELEGRAM_CHAT_ID`.
5. Click **Simpan Config**.
6. Click **Cek Config Telegram PIE**.
7. Click **Test Kirim**.
8. Open **SARING-PIE** and create one E3/EX test encounter.
9. Confirm alert row, operational dashboard update, and Telegram notification.

## User-facing menu separation
- **Skrining PIE**: quick screening, rule result, save encounter, Form PE follow-up trigger.
- **Dashboard PIE**: KPI, disease/risk/classification breakdown, trend, SLA, burden, archive, validation history, summary export.
- **Operasional & PE**: alert inbox, action tasks, case classification, PE form list/editor, case list, case timeline/audit.
- **Lab & One Health**: lab result entry, specimen list, lab result list, cluster links, One Health signals, entity filters, entity exports.
- **Pengaturan PD3I / SARING-PIE**: super-admin only setup/config, validation metrics, draft KB rule workflow.

## Triage codes
- `C*` = clinical acuity. Patient severity/urgency.
- `E*` = epidemiological risk. Public health signal strength.
- `EX` = exposure-only urgent; time-critical exposure without requiring symptomatic illness.

Examples:
- Leptospirosis signal: `E2`.
- Avian influenza signal: `E3`.
- Severe unexplained cluster: `E3`.
- Rabies mammal bite exposure: `EX`.

## Operational workflow
1. User completes quick screening.
2. Rule engine returns risk, acuity, candidate disease, explanation, and required actions.
3. User saves encounter.
4. System writes entity/event sheets:
   - `PIE_CASE`
   - `PIE_PATIENT_LINK`
   - `PIE_ENCOUNTER`
   - `PIE_SCREENING`
   - `PIE_ANSWER`
   - `PIE_RULE_RESULT`
   - `PIE_ALERT`
   - `PIE_ACTION_TASK`
   - `PIE_CLASSIFICATION`
   - `PIE_NOTIFICATION`
   - `PIE_AUDIT`
5. E3/EX creates an alert and sends Telegram surveillance notification when configured.
6. User acknowledges/resolves alerts.
7. User completes action tasks.
8. User creates/updates PE follow-up where needed.
9. User records specimens and lab results.
10. User links clusters and One Health signals when relevant.
11. User sets classification: `UNDER_REVIEW`, `SUSPECT`, `PROBABLE`, `CONFIRMED`, `DISCARDED`.
12. User archives duplicate/closed/non-relevant cases with reason.

## Notification rules
- Telegram is sent for `E3` and `EX` only.
- Notification message avoids patient name/NIK/phone.
- Notification records are written to `PIE_NOTIFICATION`.
- Idempotency key prevents duplicate notification records for the same alert.

## Data review and exports
Available exports:
- Case CSV: `pie-cases-YYYY-MM-DD.csv`
- Form PE CSV: `pie-form-pe-YYYY-MM-DD.csv`
- Validation CSV: `pie-validation-YYYY-MM-DD.csv`
- Spesimen CSV: `pie-specimen-YYYY-MM-DD.csv`
- Hasil Lab CSV: `pie-lab-result-YYYY-MM-DD.csv`
- Klaster CSV: `pie-cluster-link-YYYY-MM-DD.csv`
- One Health CSV: `pie-onehealth-signal-YYYY-MM-DD.csv`
- Ringkasan CSV: `pie-summary-report-YYYY-MM-DD.csv`

Entity exports for Spesimen, Hasil Lab, Klaster, and One Health follow the active UI filters.

## Case timeline and audit review
1. Open **Operasional & PE**.
2. In **Daftar kasus PIE terbaru**, click **Timeline**.
3. Review ordered events across case, screening, PE, specimen, lab, alert, task, classification, cluster, One Health, and audit.
4. Open **Audit raw** only when troubleshooting or validating an operational dispute.

## Analytics interpretation
Dashboard analytics are MVP operational indicators, not a full BI warehouse:
- Daily, weekly, and monthly case trends.
- SLA alert acknowledgement ≤24 hours.
- SLA specimen-to-lab result ≤72 hours.
- PPV classification proxy.
- Burden by faskes.
- Archive/discarded reasons.
- Data quality gaps and validation history.

## Production readiness checklist
- [ ] `npm test` passes.
- [ ] `npx clasp push` to dev succeeds.
- [ ] Development URL loads after Google login.
- [ ] **Pengaturan** opens for super-admin and hides for non-super-admin.
- [ ] `setupPieSheets` run successfully in target spreadsheet.
- [ ] Telegram config status shows bot + target configured.
- [ ] Test notification succeeds.
- [ ] E3/EX test creates alert + Telegram notification.
- [ ] Ack/Resolve works.
- [ ] Action task completion works.
- [ ] Classification update works.
- [ ] PE draft/editor save works.
- [ ] Specimen and lab result workflow works.
- [ ] Cluster and One Health workflow works.
- [ ] Case timeline/audit loads.
- [ ] Entity filters work.
- [ ] All CSV exports work.
- [ ] Dashboard analytics render.
- [ ] No PII in Telegram alert.

## Promote to production
After the checklist passes, create/update a versioned Apps Script deployment for the existing production `/exec` URL. Keep the existing production URL unless explicitly replacing deployment.
