# Next Steps

## Status Saat Ini
- Autentikasi `clasp` sudah selesai
- Source sudah sinkron lokal ↔ GitHub ↔ Apps Script
- Deployment produksi sudah diredeploy ke versi terbaru
- Batch ekspansi form berdasarkan blueprint + gap audit sudah masuk ke codebase

## Prioritas Berikutnya

1. **UAT runtime batch ekspansi form**
   - Gunakan checklist: `docs/FORM-EXPANSION-UAT.md`
   - Verifikasi render, save, edit, dan auto-header untuk MR/DIF/PERT/TN/AFP

2. **Perbarui matriks gap setelah UAT**
   - Tandai gap yang sudah tertutup
   - Pisahkan gap tersisa: `high / medium / low`

3. **Perbaiki issue hasil UAT**
   - Fokus pada bug render, show/hide, save, edit, dan regressions

4. **Lanjut ke validasi epidemiologis**
   - Mandatory fields per diagnosis
   - Validasi lintas-field yang penting
   - Guardrail untuk konsistensi data surveilans

5. **Hardening operasional**
   - Review keamanan web app
   - Monitoring deploy aktif
   - Review kompatibilitas sheet existing
