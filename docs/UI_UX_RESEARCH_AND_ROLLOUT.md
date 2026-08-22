# SIMPEL Surveilans — UI/UX research and rollout

Tanggal: 2026-08-22

## Keputusan desain

Rewrite CSS total dibatalkan sebagai strategi rollout. `src/Views/style.html` besar dan memiliki banyak selector/media rule legacy; mengganti seluruhnya sekaligus menaikkan risiko regresi pada workflow, responsive path, dan hook runtime.

Rollout memakai vertical slice:

1. preserve DOM IDs, `data-*` attributes, route anchors, and runtime classes;
2. improve one workflow surface at a time;
3. add contract tests against actual markup/runtime hooks;
4. verify desktop and mobile before Development deployment;
5. Production only with explicit approval.

## Prinsip riset yang dipakai

- **Actionable first:** beranda harus menjawab “apa yang perlu dikerjakan berikutnya”, bukan hanya menampilkan angka.
- **Data trust:** setiap KPI perlu label yang jelas tentang cakupan dan makna; status loading/empty/error harus terlihat dan tidak menggantung.
- **Progressive disclosure:** detail sekunder tetap tersedia, tetapi tidak memenuhi layar awal.
- **Error prevention:** navigasi menuju antrian kerja, validasi, dan review sebelum tindakan sensitif.
- **Accessibility:** focus-visible, keyboard path, readable contrast, semantic headings/labels, responsive touch targets.
- **Workflow fit:** UI tidak menambah langkah administratif yang tidak membantu tugas surveilans.
- **Stability:** perubahan visual tidak boleh mengubah route, permission, server-side authorization, atau data contract.

## Sumber riset

- Design Practices for Data Dashboards in Health Care, scoping review: https://pmc.ncbi.nlm.nih.gov/articles/PMC12980066
- Developing public health surveillance dashboards, scoping review: https://pmc.ncbi.nlm.nih.gov/articles/PMC10848508
- Public health dashboard usability checklist: https://pmc.ncbi.nlm.nih.gov/articles/PMC9552210/
- CDC surveillance system evaluation guidelines: https://www.cdc.gov/mmwr/preview/mmwrhtml/rr5013a1.htm
- W3C WAI Forms: https://www.w3.org/WAI/tutorials/forms/
- Nielsen Norman Group, Progressive Disclosure: https://www.nngroup.com/articles/progressive-disclosure/
- AHRQ dashboard visualization practices: https://www.ahrq.gov/evidencenow/tools/dashboard-best-practice.html

## Slice 1 — Beranda command center

Existing runtime hooks retained:

- `section-overview`
- `overview-role-summary`
- `overview-kpi-grid`
- `overview-situation-strip`
- `overview-kpi-focus`
- `overview-quick-actions`
- `overview-work-summary`
- `overview-work-inbox`
- `data-overview-workspace`
- `data-overview-task-workspace`

Target hierarchy:

1. context/session scope;
2. priority workload and next safe action;
3. operational KPI;
4. secondary diagnosis/context detail;
5. quick actions.

No API, permission, route, or server logic changes in this slice.
