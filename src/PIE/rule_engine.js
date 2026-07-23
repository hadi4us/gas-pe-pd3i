function pieGetRuleDefinitions_() {
  return [
    { rule_id: 'R-INFZOO-001', disease_code: 'AVIAN_INFLUENZA', rule_type: 'HARD_TRIGGER', minimum_epi_risk: 'E3', priority: 100, hard_trigger: true, required_facts: ['respiratory','poultry','exposureWindow14'], recommended_actions: ['MASK','SEPARATE','NOTIFY_SURVEILLANCE','CONSULT_SPECIMEN'], specimen_guidance: 'Swab nasofaring/orofaring sesuai arahan surveilans/lab rujukan.', explanation_template: 'Sindrom pernapasan + pajanan unggas/burung dalam 0–14 hari.' },
    { rule_id: 'R-INFZOO-002', disease_code: 'NIPAH_OR_RABIES_LIKE', rule_type: 'HARD_TRIGGER', minimum_epi_risk: 'E3', priority: 95, hard_trigger: true, required_facts: ['neuro'], optional_facts: ['bat','pig','sap'], recommended_actions: ['ISOLATE','NOTIFY_SURVEILLANCE','CLINICIAN_REVIEW'], specimen_guidance: 'Koordinasi jenis spesimen dengan surveilans/lab rujukan.', explanation_template: 'Sindrom neurologis + pajanan kelelawar/babi/nira.' },
    { rule_id: 'R-INFZOO-003', disease_code: 'RABIES_EXPOSURE', rule_type: 'EXPOSURE_TRIGGER', minimum_epi_risk: 'EX', priority: 90, hard_trigger: true, required_facts: ['biteMammal'], recommended_actions: ['WOUND_WASH','RABIES_PEP_ASSESSMENT','NOTIFY_SURVEILLANCE'], specimen_guidance: 'Tidak menunggu lab untuk asesmen PEP.', explanation_template: 'Gigitan/cakaran mamalia membutuhkan tata laksana pajanan rabies.' },
    { rule_id: 'R-INFZOO-004', disease_code: 'LEPTOSPIROSIS', rule_type: 'HARD_TRIGGER', minimum_epi_risk: 'E2', priority: 80, hard_trigger: true, required_facts: ['fever'], optional_facts: ['flood','rodent','jaundice','aki'], recommended_actions: ['CLINICIAN_REVIEW','CONSULT_SPECIMEN'], specimen_guidance: 'Pertimbangkan darah/serologi sesuai hari sakit dan pedoman lab.', explanation_template: 'Demam + banjir/tikus + jaundice/AKI.' },
    { rule_id: 'R-INFZOO-005', disease_code: 'SEVERE_UNEXPLAINED_CLUSTER', rule_type: 'CLUSTER_TRIGGER', minimum_epi_risk: 'E3', priority: 100, hard_trigger: true, required_facts: ['clusterSevere'], recommended_actions: ['NOTIFY_SURVEILLANCE','INVESTIGATE_CLUSTER'], specimen_guidance: 'Koordinasi pengambilan spesimen klaster dengan surveilans.', explanation_template: 'Klaster penyakit berat tidak terjelaskan.' },
    { rule_id: 'R-INFZOO-006', disease_code: 'MERS_COV_OR_RESP_TRAVEL', rule_type: 'HARD_TRIGGER', minimum_epi_risk: 'E3', priority: 92, hard_trigger: true, required_facts: ['respiratory'], optional_facts: ['travelRisk','humanContactRisk'], recommended_actions: ['MASK','SEPARATE','NOTIFY_SURVEILLANCE','CLINICIAN_REVIEW','CONSULT_SPECIMEN'], specimen_guidance: 'Swab respiratori dan koordinasi rujukan sesuai pedoman ISPA berat/PIE.', explanation_template: 'Sindrom pernapasan + riwayat perjalanan/kontak healthcare/lab berisiko.' },
    { rule_id: 'R-INFZOO-007', disease_code: 'ANTHRAX_SUSPECT', rule_type: 'HARD_TRIGGER', minimum_epi_risk: 'E3', priority: 88, hard_trigger: true, required_facts: ['skinLesion'], optional_facts: ['livestock','carcass'], recommended_actions: ['NOTIFY_SURVEILLANCE','CLINICIAN_REVIEW','CONSULT_SPECIMEN'], specimen_guidance: 'Koordinasi swab lesi/darah sesuai manifestasi dan pedoman lab.', explanation_template: 'Lesi kulit/ulkus/eschar + pajanan ternak/karkas.' },
    { rule_id: 'R-INFZOO-008', disease_code: 'PLAGUE_OR_RODENT_FEVER', rule_type: 'HARD_TRIGGER', minimum_epi_risk: 'E3', priority: 86, hard_trigger: true, required_facts: ['fever','rodent'], optional_facts: ['clusterSevere'], recommended_actions: ['NOTIFY_SURVEILLANCE','CLINICIAN_REVIEW','CONSULT_SPECIMEN'], specimen_guidance: 'Koordinasi spesimen darah/aspirat sesuai presentasi klinis dan rujukan lab.', explanation_template: 'Demam + pajanan rodent/klaster berat.' },
    { rule_id: 'R-INFZOO-009', disease_code: 'BRUCELLOSIS_SUSPECT', rule_type: 'EXPOSURE_TRIGGER', minimum_epi_risk: 'E2', priority: 72, hard_trigger: false, required_facts: ['fever'], optional_facts: ['livestock','unpasteurizedDairy'], recommended_actions: ['CLINICIAN_REVIEW','CONSULT_SPECIMEN'], specimen_guidance: 'Pertimbangkan kultur/serologi sesuai pedoman klinis dan lab.', explanation_template: 'Demam + pajanan ternak atau produk hewan tidak dipasteurisasi.' },
    { rule_id: 'R-INFZOO-010', disease_code: 'ARBOVIRUS_HEMORRHAGIC_SIGNAL', rule_type: 'HARD_TRIGGER', minimum_epi_risk: 'E2', priority: 78, hard_trigger: true, required_facts: ['fever'], optional_facts: ['hemorrhage','mosquitoVector'], recommended_actions: ['CLINICIAN_REVIEW','NOTIFY_SURVEILLANCE','CONSULT_SPECIMEN'], specimen_guidance: 'Pertimbangkan NS1/PCR/serologi sesuai hari sakit dan pedoman setempat.', explanation_template: 'Demam + perdarahan atau pajanan vektor/nyamuk.' },
    { rule_id: 'R-INFZOO-011', disease_code: 'HANTAVIRUS_SUSPECT', rule_type: 'HARD_TRIGGER', minimum_epi_risk: 'E3', priority: 84, hard_trigger: true, required_facts: ['fever','rodent'], optional_facts: ['respiratory','aki','hemorrhage'], recommended_actions: ['CLINICIAN_REVIEW','NOTIFY_SURVEILLANCE','CONSULT_SPECIMEN'], specimen_guidance: 'Koordinasi serum/PCR sesuai fase sakit dan rujukan lab untuk hantavirus.', explanation_template: 'Demam + pajanan rodent dengan sindrom respiratori/ginjal/perdarahan.' },
    { rule_id: 'R-INFZOO-012', disease_code: 'MPOX_SUSPECT', rule_type: 'HARD_TRIGGER', minimum_epi_risk: 'E2', priority: 82, hard_trigger: true, required_facts: ['vesicularRash'], optional_facts: ['fever','lymphadenopathy','humanContactRisk','sexualCloseContact','travelRisk'], recommended_actions: ['MASK','SEPARATE','NOTIFY_SURVEILLANCE','CLINICIAN_REVIEW','CONSULT_SPECIMEN'], specimen_guidance: 'Swab lesi/keropeng sesuai pedoman Mpox dan koordinasi lab rujukan.', explanation_template: 'Ruam vesikular/pustular + demam/limfadenopati/kontak erat berisiko.' },
    { rule_id: 'R-INFZOO-013', disease_code: 'EBOLA_MARBURG_VHF_SUSPECT', rule_type: 'HARD_TRIGGER', minimum_epi_risk: 'E3', priority: 98, hard_trigger: true, required_facts: ['fever'], optional_facts: ['travelRisk','humanContactRisk','bodyFluidContact','funeralContact','contaminatedObject','bat','hemorrhage','severeVomitingDiarrhea','hepaticRenalImpairment'], recommended_actions: ['ISOLATE','NOTIFY_SURVEILLANCE','CLINICIAN_REVIEW','CONSULT_SPECIMEN'], specimen_guidance: 'PCR/rujukan BBLBK sesuai pedoman viral hemorrhagic fever; koordinasi sebelum pengiriman.', explanation_template: 'Demam + pajanan 21 hari/kontak cairan tubuh/jenazah/benda terkontaminasi dengan sinyal VHF.' },
    { rule_id: 'R-INFZOO-014', disease_code: 'MENINGOCOCCAL_DISEASE_SUSPECT', rule_type: 'HARD_TRIGGER', minimum_epi_risk: 'E3', priority: 89, hard_trigger: true, required_facts: ['fever'], optional_facts: ['neuro','neckStiffness','purpuraPetechiae','humanContactRisk','travelRisk','crowdDormitory'], recommended_actions: ['MASK','SEPARATE','NOTIFY_SURVEILLANCE','CLINICIAN_REVIEW'], specimen_guidance: 'Koordinasi kultur/PCR darah atau LCS sesuai kondisi klinis dan pedoman lab.', explanation_template: 'Demam + meningitis/ruam purpura atau kontak erat/asrama/perjalanan outbreak.' },
    { rule_id: 'R-INFZOO-015', disease_code: 'POLIO_AFP_SUSPECT', rule_type: 'HARD_TRIGGER', minimum_epi_risk: 'E3', priority: 93, hard_trigger: true, required_facts: ['acuteFlaccidParalysis'], optional_facts: ['travelRisk','lowPolioImmunization','clusterSevere'], recommended_actions: ['NOTIFY_SURVEILLANCE','INVESTIGATE_CLUSTER','CONSULT_SPECIMEN'], specimen_guidance: 'Ambil dua spesimen tinja sesuai pedoman AFP/polio dan kirim ke lab rujukan.', explanation_template: 'Lumpuh layuh akut dengan risiko polio/perjalanan/imunisasi rendah.' },
    { rule_id: 'R-INFZOO-016', disease_code: 'CCHF_OR_VHF_TICK_LIVESTOCK', rule_type: 'HARD_TRIGGER', minimum_epi_risk: 'E3', priority: 87, hard_trigger: true, required_facts: ['fever'], optional_facts: ['hemorrhage','tickBite','livestock','carcass','animalBloodContact'], recommended_actions: ['ISOLATE','NOTIFY_SURVEILLANCE','CLINICIAN_REVIEW','CONSULT_SPECIMEN'], specimen_guidance: 'Koordinasi spesimen VHF/CCHF dengan lab rujukan; gunakan kewaspadaan biosafety.', explanation_template: 'Demam + perdarahan dan pajanan kutu/ternak/karkas/darah hewan.' },
    { rule_id: 'R-INFZOO-017', disease_code: 'YELLOW_FEVER_SUSPECT', rule_type: 'HARD_TRIGGER', minimum_epi_risk: 'E3', priority: 85, hard_trigger: true, required_facts: ['fever'], optional_facts: ['jaundice','hemorrhage','travelRisk','mosquitoVector','yellowFeverUnvaccinated'], recommended_actions: ['NOTIFY_SURVEILLANCE','CLINICIAN_REVIEW','CONSULT_SPECIMEN'], specimen_guidance: 'Koordinasi PCR/serologi arbovirus/yellow fever sesuai hari sakit dan riwayat vaksin.', explanation_template: 'Demam + ikterus/perdarahan dengan perjalanan endemis/vektor dan status vaksin berisiko.' },
    { rule_id: 'R-INFZOO-018', disease_code: 'LASSA_FEVER_SUSPECT', rule_type: 'HARD_TRIGGER', minimum_epi_risk: 'E3', priority: 84, hard_trigger: true, required_facts: ['fever'], optional_facts: ['rodent','travelRisk','humanContactRisk','bodyFluidContact','hemorrhage','severeVomitingDiarrhea'], recommended_actions: ['ISOLATE','NOTIFY_SURVEILLANCE','CLINICIAN_REVIEW','CONSULT_SPECIMEN'], specimen_guidance: 'Koordinasi spesimen demam Lassa/VHF dengan lab rujukan.', explanation_template: 'Demam + riwayat rodent/perjalanan/kontak kasus dengan gejala VHF.' },
    { rule_id: 'R-INFZOO-019', disease_code: 'RIFT_VALLEY_FEVER_SUSPECT', rule_type: 'HARD_TRIGGER', minimum_epi_risk: 'E2', priority: 80, hard_trigger: true, required_facts: ['fever'], optional_facts: ['livestock','carcass','animalBloodContact','mosquitoVector','jaundice','hemorrhage'], recommended_actions: ['NOTIFY_SURVEILLANCE','CLINICIAN_REVIEW','CONSULT_SPECIMEN'], specimen_guidance: 'Koordinasi PCR/serologi Rift Valley fever sesuai fase penyakit dan pajanan ternak/vektor.', explanation_template: 'Demam + pajanan ternak/karkas/darah hewan atau vektor dengan ikterus/perdarahan.' },
    { rule_id: 'R-INFZOO-020', disease_code: 'ZIKA_SUSPECT', rule_type: 'EXPOSURE_TRIGGER', minimum_epi_risk: 'E2', priority: 74, hard_trigger: false, required_facts: ['maculopapularRash'], optional_facts: ['fever','conjunctivitis','arthralgia','mosquitoVector','travelRisk','pregnant'], recommended_actions: ['CLINICIAN_REVIEW','NOTIFY_SURVEILLANCE','CONSULT_SPECIMEN'], specimen_guidance: 'PCR/serologi Zika sesuai hari sakit; prioritaskan bila hamil.', explanation_template: 'Ruam + demam/konjungtivitis/arthralgia dengan pajanan nyamuk/perjalanan, terutama hamil.' },
    { rule_id: 'R-INFZOO-021', disease_code: 'RICKETTSIOSIS_SUSPECT', rule_type: 'EXPOSURE_TRIGGER', minimum_epi_risk: 'E2', priority: 73, hard_trigger: false, required_facts: ['fever'], optional_facts: ['skinLesion','maculopapularRash','tickBite','bushForestExposure'], recommended_actions: ['CLINICIAN_REVIEW','CONSULT_SPECIMEN'], specimen_guidance: 'Pertimbangkan serologi/PCR sesuai pedoman dan fase penyakit.', explanation_template: 'Demam + eschar/ruam dengan pajanan kutu/tungau/semak/hutan.' },
    { rule_id: 'R-INFZOO-022', disease_code: 'HFMD_EV71_SEVERE_SIGNAL', rule_type: 'HARD_TRIGGER', minimum_epi_risk: 'E3', priority: 83, hard_trigger: true, required_facts: ['handFootMouthVesicles'], optional_facts: ['fever','neuro','respiratory','persistentVomiting','crowdDormitory','clusterSevere'], recommended_actions: ['CLINICIAN_REVIEW','NOTIFY_SURVEILLANCE','INVESTIGATE_CLUSTER'], specimen_guidance: 'Koordinasi spesimen tenggorok/feses/vesikel sesuai pedoman HFMD/EV-71.', explanation_template: 'HFMD dengan red flag neurologis/respiratori/muntah persisten atau klaster sekolah/PAUD.' },
    { rule_id: 'R-INFZOO-023', disease_code: 'LEGIONELLOSIS_CLUSTER_SIGNAL', rule_type: 'CLUSTER_TRIGGER', minimum_epi_risk: 'E2', priority: 77, hard_trigger: true, required_facts: ['respiratory'], optional_facts: ['waterAerosolExposure','clusterSevere','humanContactRisk'], recommended_actions: ['CLINICIAN_REVIEW','NOTIFY_SURVEILLANCE','INVESTIGATE_CLUSTER','CONSULT_SPECIMEN'], specimen_guidance: 'Pertimbangkan antigen urin/kultur/PCR respiratori dan investigasi sumber air/aerosol.', explanation_template: 'Pneumonia/demam respiratori + pajanan aerosol air atau klaster/faskes.' },
    { rule_id: 'R-INFZOO-024', disease_code: 'DISEASE_X_SEVERE_UNKNOWN_SIGNAL', rule_type: 'CLUSTER_TRIGGER', minimum_epi_risk: 'E3', priority: 91, hard_trigger: true, required_facts: ['emergency'], optional_facts: ['clusterSevere','travelRisk','humanContactRisk','humanContactRisk'], recommended_actions: ['ISOLATE','NOTIFY_SURVEILLANCE','CLINICIAN_REVIEW','INVESTIGATE_CLUSTER','CONSULT_SPECIMEN'], specimen_guidance: 'Koordinasi paket spesimen sindromik dengan surveilans/lab rujukan; rule ini bukan diagnosis.', explanation_template: 'Penyakit berat tidak jelas dengan klaster/perjalanan/kontak faskes atau paparan manusia.' }
  ];
}

function pieGetActionDefinitions_() {
  return [
    { action_code: 'STABILIZE', action_type: 'CLINICAL', label: 'Stabilisasi pasien', description: 'Tatalaksana emergensi sesuai kondisi klinis.', default_due_hours: 0, owner_role: 'clinician' },
    { action_code: 'CLINICIAN_REVIEW', action_type: 'CLINICAL', label: 'Review klinisi', description: 'Klinisi menilai diagnosis kerja dan kebutuhan rujukan.', default_due_hours: 2, owner_role: 'clinician' },
    { action_code: 'MASK', action_type: 'PPI', label: 'Masker pasien/petugas', description: 'Terapkan masker dan etika batuk.', default_due_hours: 0, owner_role: 'faskes' },
    { action_code: 'SEPARATE', action_type: 'PPI', label: 'Pisahkan dari ruang tunggu umum', description: 'Kurangi pajanan ke pasien/pengunjung lain.', default_due_hours: 0, owner_role: 'faskes' },
    { action_code: 'ISOLATE', action_type: 'PPI', label: 'Isolasi kewaspadaan', description: 'Terapkan kewaspadaan isolasi sesuai risiko.', default_due_hours: 0, owner_role: 'faskes' },
    { action_code: 'NOTIFY_SURVEILLANCE', action_type: 'SURVEILLANCE', label: 'Notifikasi surveilans', description: 'Laporkan sinyal ke petugas surveilans/Dinkes.', default_due_hours: 1, owner_role: 'surveilans' },
    { action_code: 'CONSULT_SPECIMEN', action_type: 'LAB', label: 'Konsultasi spesimen', description: 'Konfirmasi jenis dan rute spesimen.', default_due_hours: 4, owner_role: 'lab' },
    { action_code: 'WOUND_WASH', action_type: 'CLINICAL', label: 'Cuci luka 15 menit', description: 'Cuci luka gigitan/cakaran dengan sabun dan air mengalir.', default_due_hours: 0, owner_role: 'clinician' },
    { action_code: 'RABIES_PEP_ASSESSMENT', action_type: 'CLINICAL', label: 'Asesmen PEP rabies', description: 'Tentukan VAR/SAR sesuai kategori pajanan.', default_due_hours: 1, owner_role: 'clinician' },
    { action_code: 'INVESTIGATE_CLUSTER', action_type: 'SURVEILLANCE', label: 'Investigasi klaster', description: 'Mulai penyelidikan epidemiologi klaster.', default_due_hours: 24, owner_role: 'surveilans' }
  ];
}

function pieEvaluateFacts_(facts) {
  facts = facts || {};
  const matched = [], actions = [];
  let clinical = facts.emergency ? 'C3' : (facts.severe ? 'C1' : 'C0');
  let epi = 'E0';
  const rank = { E0: 0, E1: 1, E2: 2, EX: 2, E3: 3 };
  function raise(level) { if ((rank[level] || 0) > (rank[epi] || 0)) epi = level; }
  function addActions(list) { (list || []).forEach(function(a) { actions.push(a); }); }
  if (facts.emergency) addActions(['STABILIZE', 'CLINICIAN_REVIEW']);

  const runtimeRules = pieGetRuleDefinitions_().concat(pieGetActiveKbRules_());
  runtimeRules.forEach(function(rule) {
    let ok = false;
    if (rule.rule_id === 'R-INFZOO-001') ok = !!(facts.respiratory && facts.poultry && facts.exposureWindow14);
    if (rule.rule_id === 'R-INFZOO-002') ok = !!(facts.neuro && (facts.bat || facts.pig || facts.sap));
    if (rule.rule_id === 'R-INFZOO-003') ok = !!facts.biteMammal;
    if (rule.rule_id === 'R-INFZOO-004') ok = !!(facts.fever && (facts.flood || facts.rodent) && (facts.jaundice || facts.aki));
    if (rule.rule_id === 'R-INFZOO-005') ok = !!facts.clusterSevere;
    if (rule.rule_id === 'R-INFZOO-006') ok = !!(facts.respiratory && (facts.travelRisk || facts.humanContactRisk));
    if (rule.rule_id === 'R-INFZOO-007') ok = !!(facts.skinLesion && (facts.livestock || facts.carcass));
    if (rule.rule_id === 'R-INFZOO-008') ok = !!(facts.fever && facts.rodent && (facts.clusterSevere || facts.emergency || facts.aki || facts.respiratory));
    if (rule.rule_id === 'R-INFZOO-009') ok = !!(facts.fever && (facts.livestock || facts.unpasteurizedDairy));
    if (rule.rule_id === 'R-INFZOO-010') ok = !!(facts.fever && (facts.hemorrhage || facts.mosquitoVector));
    if (rule.rule_id === 'R-INFZOO-011') ok = !!(facts.fever && facts.rodent && (facts.respiratory || facts.aki || facts.hemorrhage));
    if (rule.rule_id === 'R-INFZOO-012') ok = !!(facts.vesicularRash && (facts.fever || facts.lymphadenopathy || facts.humanContactRisk || facts.sexualCloseContact || facts.travelRisk));
    if (rule.rule_id === 'R-INFZOO-013') ok = !!(facts.fever && (facts.travelRisk || facts.humanContactRisk || facts.bodyFluidContact || facts.funeralContact || facts.contaminatedObject || facts.bat) && (facts.hemorrhage || facts.severeVomitingDiarrhea || facts.hepaticRenalImpairment || facts.emergency || facts.humanContactRisk || facts.bodyFluidContact || facts.funeralContact));
    if (rule.rule_id === 'R-INFZOO-014') ok = !!(facts.fever && (facts.neuro || facts.neckStiffness || facts.purpuraPetechiae) && (facts.humanContactRisk || facts.travelRisk || facts.crowdDormitory || facts.purpuraPetechiae || facts.neckStiffness));
    if (rule.rule_id === 'R-INFZOO-015') ok = !!facts.acuteFlaccidParalysis;
    if (rule.rule_id === 'R-INFZOO-016') ok = !!(facts.fever && facts.hemorrhage && (facts.tickBite || facts.livestock || facts.carcass || facts.animalBloodContact));
    if (rule.rule_id === 'R-INFZOO-017') ok = !!(facts.fever && (facts.jaundice || facts.hemorrhage) && (facts.travelRisk || facts.mosquitoVector || facts.yellowFeverUnvaccinated));
    if (rule.rule_id === 'R-INFZOO-018') ok = !!(facts.fever && (facts.rodent || facts.travelRisk || facts.humanContactRisk || facts.bodyFluidContact) && (facts.hemorrhage || facts.severeVomitingDiarrhea || facts.emergency || facts.bodyFluidContact));
    if (rule.rule_id === 'R-INFZOO-019') ok = !!(facts.fever && (facts.livestock || facts.carcass || facts.animalBloodContact || facts.mosquitoVector) && (facts.jaundice || facts.hemorrhage || facts.emergency));
    if (rule.rule_id === 'R-INFZOO-020') ok = !!(facts.maculopapularRash && (facts.fever || facts.conjunctivitis || facts.arthralgia) && (facts.mosquitoVector || facts.travelRisk || facts.pregnant));
    if (rule.rule_id === 'R-INFZOO-021') ok = !!(facts.fever && (facts.skinLesion || facts.maculopapularRash) && (facts.tickBite || facts.bushForestExposure));
    if (rule.rule_id === 'R-INFZOO-022') ok = !!(facts.handFootMouthVesicles && (facts.neuro || facts.respiratory || facts.persistentVomiting || facts.clusterSevere || facts.emergency || facts.crowdDormitory));
    if (rule.rule_id === 'R-INFZOO-023') ok = !!(facts.respiratory && facts.waterAerosolExposure && (facts.clusterSevere || facts.humanContactRisk || facts.emergency));
    if (rule.rule_id === 'R-INFZOO-024') ok = !!(facts.emergency && (facts.clusterSevere || facts.travelRisk || facts.humanContactRisk || facts.humanContactRisk));
    if (String(rule.rule_type || '').indexOf('KB_') === 0 || String(rule.rule_type || '').indexOf('DRAFT_') === 0) ok = pieRuleFactsMatch_(rule, facts);
    if (!ok) return;
    const scoreDetail = pieScoreRuleComponents_(rule, facts);
    matched.push({ rule_id: rule.rule_id, disease_code: rule.disease_code, hard_trigger: rule.hard_trigger, score: scoreDetail.total, score_detail: scoreDetail, minimum_epi_risk: rule.minimum_epi_risk, explanation: rule.explanation_template + ' | Skor: ' + scoreDetail.total + ' (klinis ' + scoreDetail.clinical + ', pajanan ' + scoreDetail.exposure + ', waktu ' + scoreDetail.temporal + ', klaster ' + scoreDetail.cluster + ', kualitas data ' + scoreDetail.data_quality + ')', recommended_actions: rule.recommended_actions, specimen_guidance: rule.specimen_guidance });
    if (rule.minimum_epi_risk === 'EX') epi = 'EX'; else raise(rule.minimum_epi_risk);
    addActions(rule.recommended_actions);
  });

  matched.sort(function(a, b) { return Number(b.score || 0) - Number(a.score || 0); });
  return { clinical_acuity: clinical, epi_risk: epi, matched_rules: matched, recommended_actions: Array.from(new Set(actions)), rule_set_version: PIE_CONFIG.RULE_SET_VERSION };
}

function pieScoreRuleComponents_(rule, facts) {
  const required = pieParseRuleFacts_(rule.required_facts);
  const optional = pieParseRuleFacts_(rule.optional_facts);
  const all = required.concat(optional);
  let clinical = 0, exposure = 0, temporal = 0, cluster = 0, dataQuality = 0;
  ['respiratory','neuro','fever','jaundice','aki','emergency','hemorrhage','skinLesion','vesicularRash','lymphadenopathy'].forEach(function(k) { if (facts[k] && all.indexOf(k) !== -1) clinical += 10; });
  ['poultry','biteMammal','bat','pig','sap','flood','rodent','livestock','carcass','unpasteurizedDairy','mosquitoVector','travelRisk','humanContactRisk','sexualCloseContact'].forEach(function(k) { if (facts[k] && all.indexOf(k) !== -1) exposure += 10; });
  if (facts.exposureWindow14 || facts.exposure_start_at || facts.onset_date) temporal += 15;
  if (facts.clusterSevere) cluster += 20;
  const missingRequired = required.filter(function(k) { return !facts[k]; }).length;
  dataQuality = Math.max(-20, -5 * missingRequired);
  const base = Number(rule.priority || 50);
  const total = Math.max(0, Math.min(100, Math.round(base * 0.4 + clinical + exposure + temporal + cluster + dataQuality)));
  return { total: total, base: base, clinical: clinical, exposure: exposure, temporal: temporal, cluster: cluster, data_quality: dataQuality, missing_required: missingRequired };
}

function pieParseRuleFacts_(value) {
  if (Array.isArray(value)) return value.map(String).map(function(x) { return x.trim(); }).filter(Boolean);
  return String(value || '').split(/[;,]+/).map(function(x) { return x.trim(); }).filter(Boolean);
}

function pieRuleFactsMatch_(rule, facts) {
  const required = pieParseRuleFacts_(rule.required_facts);
  const optional = pieParseRuleFacts_(rule.optional_facts);
  const excluded = pieParseRuleFacts_(rule.exclusion_facts);
  if (excluded.some(function(k) { return !!facts[k]; })) return false;
  if (required.length && !required.every(function(k) { return !!facts[k]; })) return false;
  if (optional.length && !optional.some(function(k) { return !!facts[k]; })) return false;
  return required.length > 0 || optional.length > 0;
}

function pieGetActiveKbRules_() {
  try {
    if (typeof pieReadRows_ !== 'function') return [];
    return pieReadRows_('PIE_KB_RULE', 300).filter(function(r) {
      const active = String(r.active || '').toLowerCase();
      if (!(active === 'true' || active === 'yes' || active === '1')) return false;
      return String(r.rule_id || '').indexOf('R-INFZOO-') !== 0;
    }).map(function(r) {
      return { rule_id: r.rule_id, disease_code: r.disease_code, rule_type: 'KB_APPROVED_RULE', minimum_epi_risk: r.minimum_epi_risk || 'E2', priority: Number(r.priority || 50), hard_trigger: String(r.hard_trigger || '').toLowerCase() === 'true', required_facts: r.required_facts || '', optional_facts: r.optional_facts || '', exclusion_facts: r.exclusion_facts || '', recommended_actions: pieParseRuleFacts_(r.recommended_actions || 'START_PE_INVESTIGATION'), specimen_guidance: r.specimen_guidance || '', explanation_template: r.explanation_template || 'Approved KB rule matched.' };
    });
  } catch (e) { return []; }
}
