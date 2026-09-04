function pieNowIso_() { return new Date().toISOString(); }
function pieUserEmail_() { try { return Session.getActiveUser().getEmail() || ''; } catch (e) { return ''; } }
function pieId_(prefix) { return prefix + '-' + Utilities.getUuid().slice(0, 8).toUpperCase() + '-' + Date.now().toString(36).toUpperCase(); }
function pieHash_(value) { return Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(value || ''))).slice(0, 43); }
function pieMaskNik_(nik) { nik = String(nik || '').replace(/\D/g, ''); return nik ? nik.slice(0, 4) + '********' + nik.slice(-4) : ''; }
function pieMaskPhone_(phone) { phone = String(phone || '').replace(/\D/g, ''); return phone ? phone.slice(0, 3) + '****' + phone.slice(-3) : ''; }
function pieGetSheet_(name) {
  const ss = getSpreadsheet_();
  let sh = ss.getSheetByName(name);
  const headers = getPieSchema_()[name];
  if (!sh && headers) {
    try { sh = ss.insertSheet(name); }
    catch (e) { sh = ss.getSheetByName(name); if (!sh) throw e; }
    if (sh.getLastRow() < 1) { sh.getRange(1, 1, 1, headers.length).setValues([headers]); sh.setFrozenRows(1); }
  }
  if (!sh) throw new Error('Sheet SARING-PIE belum siap: ' + name + '. Jalankan setupPieSheets sebagai admin.');
  return sh;
}
function pieAppend_(sheetName, obj) { const sh = pieGetSheet_(sheetName); const headers = getTrimmedHeaders_(sh); sh.appendRow(headers.map(function(h) { return obj[h] === undefined ? '' : obj[h]; })); }

function _requirePieSession_(token, options) {
  token = String(token || '').trim();
  const sess = _getSessionFromToken_(token);
  if (!sess.ok || !sess.user) throw new Error(sess.message || 'Sesi tidak valid.');
  const rawRole = String(sess.user.role || '').trim().toLowerCase().replace(/[_\s]+/g, '-');
  const roleMap = {
    'system-admin': 'super-admin', 'kb-approver': 'super-admin', auditor: 'super-admin',
    'surveilans-dinkes': 'surveilans', 'epidemiolog-verifikator': 'surveilans', 'one-health': 'surveilans',
    triage: 'petugas', clinician: 'petugas', 'surveilans-faskes': 'petugas', ppi: 'petugas', 'lab-faskes': 'petugas', 'kb-editor': 'admin'
  };
  const role = roleMap[rawRole] || rawRole;
  if (options && options.superAdminOnly && ['super-admin', 'superadmin'].indexOf(role) === -1) throw new Error('Aksi ini hanya untuk SUPER-ADMIN.');
  if (options && options.adminOnly && ['admin', 'super-admin', 'superadmin'].indexOf(role) === -1) throw new Error('Aksi ini hanya untuk admin.');
  if (options && options.roles && options.roles.length && options.roles.indexOf(role) === -1) throw new Error('Role tidak berwenang untuk aksi SARING-PIE ini.');
  sess.user.effectivePieRole = role;
  return sess;
}

function pieValidatePayload_(payload, facts, evalResult) {
  const errors = [], warnings = [];
  const anyFact = Object.keys(facts || {}).some(function(k) { return facts[k] === true; });
  if (!anyFact) errors.push('Minimal pilih satu gejala atau pajanan.');
  if (!String((payload && payload.faskes_key) || '').trim()) {
    if (evalResult && (evalResult.epi_risk === 'E3' || evalResult.epi_risk === 'EX')) errors.push('Faskes wajib untuk kasus E3/EX.');
    else warnings.push('Faskes kosong; lengkapi untuk routing surveilans.');
  }
  if ((facts.poultry || facts.bat || facts.pig || facts.sap) && !facts.exposureWindow14 && facts.respiratory) warnings.push('Pajanan respiratory tanpa window 0–14 hari; rule avian tidak aktif.');
  if (facts.exposureWindow14 && !(facts.poultry || facts.bat || facts.pig || facts.sap || facts.biteMammal || facts.flood || facts.rodent || facts.livestock || facts.carcass || facts.unpasteurizedDairy || facts.mosquitoVector)) warnings.push('Periode pajanan dicentang, tetapi jenis pajanan belum dipilih.');
  if ((facts.jaundice || facts.aki) && !facts.fever) warnings.push('Jaundice/AKI tanpa demam: pastikan sindrom klinis utama sudah benar.');
  if (facts.biteMammal && (facts.poultry || facts.bat || facts.pig || facts.livestock)) warnings.push('Pajanan gigitan mamalia bercampur dengan pajanan hewan lain; pastikan ini bukan dua kejadian berbeda.');
  if ((facts.poultry || facts.bat || facts.pig || facts.sap || facts.flood || facts.rodent || facts.biteMammal || facts.livestock || facts.carcass || facts.unpasteurizedDairy || facts.mosquitoVector) && !String((payload && payload.exposure_notes) || '').trim()) warnings.push('Detail pajanan belum diisi; lengkapi bila lanjut Form PE.');
  if ((evalResult && ['E2','E3','EX'].indexOf(String(evalResult.epi_risk || '').toUpperCase()) !== -1) && !String((payload && payload.onset_date) || '').trim()) warnings.push('Tanggal onset belum diisi; penting untuk kompatibilitas waktu pajanan.');
  if ((evalResult && ['E3','EX'].indexOf(String(evalResult.epi_risk || '').toUpperCase()) !== -1) && !String((payload && payload.address) || '').trim()) warnings.push('Domisili/alamat belum lengkap untuk tindak lanjut PE risiko tinggi.');
  return { errors: errors, warnings: warnings };
}

function pieUpsertByKey_(sheetName, keyHeader, obj) {
  const sh = pieGetSheet_(sheetName);
  const headers = getTrimmedHeaders_(sh);
  const keyIdx = headers.indexOf(keyHeader);
  if (keyIdx === -1) throw new Error('Kolom kunci tidak ditemukan: ' + keyHeader);
  const keyValue = String(obj[keyHeader] || '').trim();
  if (!keyValue) throw new Error('Nilai kunci kosong: ' + keyHeader);
  const values = sh.getDataRange().getValues();
  let targetRow = -1;
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][keyIdx] || '').trim() === keyValue) { targetRow = i + 1; break; }
  }
  const row = headers.map(function(h) { return obj[h] === undefined ? '' : obj[h]; });
  if (targetRow === -1) sh.appendRow(row);
  else sh.getRange(targetRow, 1, 1, headers.length).setValues([row]);
}

function pieFactsFromPayload_(payload) {
  payload = payload || {};
  const b = function(k) { return payload[k] === true || payload[k] === 'true' || payload[k] === 'Ya' || payload[k] === '1'; };
  return { emergency: b('emergency'), severe: b('severe'), respiratory: b('respiratory'), neuro: b('neuro'), fever: b('fever'), hemorrhage: b('hemorrhage'), skinLesion: b('skinLesion'), vesicularRash: b('vesicularRash'), lymphadenopathy: b('lymphadenopathy'), severeVomitingDiarrhea: b('severeVomitingDiarrhea'), hepaticRenalImpairment: b('hepaticRenalImpairment'), neckStiffness: b('neckStiffness'), purpuraPetechiae: b('purpuraPetechiae'), acuteFlaccidParalysis: b('acuteFlaccidParalysis'), maculopapularRash: b('maculopapularRash'), conjunctivitis: b('conjunctivitis'), arthralgia: b('arthralgia'), handFootMouthVesicles: b('handFootMouthVesicles'), persistentVomiting: b('persistentVomiting'), poultry: b('poultry'), bat: b('bat'), pig: b('pig'), sap: b('sap'), biteMammal: b('biteMammal'), flood: b('flood'), rodent: b('rodent'), livestock: b('livestock'), carcass: b('carcass'), unpasteurizedDairy: b('unpasteurizedDairy'), mosquitoVector: b('mosquitoVector'), tickBite: b('tickBite'), animalBloodContact: b('animalBloodContact'), waterAerosolExposure: b('waterAerosolExposure'), bushForestExposure: b('bushForestExposure'), travelRisk: b('travelRisk') || b('travelRisk21'), humanContactRisk: b('humanContactRisk') || b('healthcareExposure'), bodyFluidContact: b('bodyFluidContact'), funeralContact: b('funeralContact'), contaminatedObject: b('contaminatedObject'), sexualCloseContact: b('sexualCloseContact'), crowdDormitory: b('crowdDormitory'), lowPolioImmunization: b('lowPolioImmunization'), yellowFeverUnvaccinated: b('yellowFeverUnvaccinated'), pregnant: b('pregnant'), jaundice: b('jaundice'), aki: b('aki'), clusterSevere: b('clusterSevere'), exposureWindow14: b('exposureWindow14'), onset_date: !!payload.onset_date, exposure_start_at: !!payload.exposure_start_at };
}

function pieActorFromSession_(sess) {
  const user = sess && sess.user;
  return String((user && (user.username || user.email || user.name)) || pieUserEmail_() || 'unknown');
}

function pieSetCaseNotificationStatus_(caseId, status, reason, target, now, actor) {
  try {
    pieUpdateById_('PIE_CASE', 'case_id', caseId, { notification_status: status, updated_at: now, updated_by: actor });
  } catch (e) {}
}

function pieHasNotificationIdempotency_(idempotencyKey) {
  try {
    const rows = pieReadRows_('PIE_NOTIFICATION', 500);
    return rows.some(function(r) { return String(r.idempotency_key || '').trim() === String(idempotencyKey || '').trim(); });
  } catch (e) { return false; }
}

function pieNotifySurveillance_(caseId, screeningId, alertId, payload, evalResult, actor, now) {
  const idempotency = pieHash_(caseId + ':' + alertId + ':SURVEILLANCE');
  if (pieHasNotificationIdempotency_(idempotency)) return { sent: false, reason: 'DUPLICATE_SKIPPED', target: '' };
  const lead = (evalResult.matched_rules[0] && evalResult.matched_rules[0].disease_code) || 'UNKNOWN_SIGNAL';
  const lines = [
    '🚨 *SARING-PIE Alert*',
    'Case: `' + caseId + '`',
    'Risk: *' + evalResult.epi_risk + '* | Acuity: *' + evalResult.clinical_acuity + '*',
    'Kandidat: *' + lead + '*',
    'Faskes: ' + String((payload && payload.faskes_key) || '-'),
    'Alasan: ' + String((evalResult.matched_rules[0] && evalResult.matched_rules[0].explanation) || '-'),
    'Tindak lanjut: buka SARING-PIE → Alert inbox.'
  ];
  let res = { sent: false, reason: 'NOT_CONFIGURED', target: '' };
  try {
    const target = String(Config_Manager.getConfig('PIE_TELEGRAM_CHAT_ID') || Config_Manager.getConfig('TELEGRAM_CHAT_ID') || '').trim();
    if (target && typeof _sendTelegramText_ === 'function') res = _sendTelegramText_(target, lines);
  } catch (e) {
    res = { sent: false, reason: String((e && e.message) || e), target: '' };
  }
  const status = res.sent ? 'SENT' : (res.reason || 'FAILED');
  pieAppend_('PIE_NOTIFICATION', { notification_id: pieId_('PIENOTIF'), case_id: caseId, alert_id: alertId, screening_id: screeningId, channel: 'TELEGRAM', target: res.target || '', status: status, reason: res.sent ? '' : (res.reason || ''), sent_at: res.sent ? now : '', message: lines.join('\n'), idempotency_key: idempotency, created_at: now, created_by: actor });
  pieSetCaseNotificationStatus_(caseId, status, res.reason || '', res.target || '', now, actor);
  pieAppend_('PIE_AUDIT', { audit_id: pieId_('PIEAUD'), entity_type: 'PIE_NOTIFICATION', entity_id: alertId, action: 'NOTIFY_SURVEILLANCE', actor: actor, occurred_at: now, summary: 'PIE surveillance notification ' + status, after_json: JSON.stringify({ case_id: caseId, alert_id: alertId, status: status, target: res.target || '', reason: res.reason || '' }) });
  return res;
}

function pieCreateActionTasks_(caseId, screeningId, actions, user, now) {
  const defs = {};
  pieGetActionDefinitions_().forEach(function(a) { defs[a.action_code] = a; });
  const actor = pieActorFromSession_({ user: user });
  (actions || []).forEach(function(code) {
    const def = defs[code] || { action_code: code, label: code, owner_role: '', default_due_hours: 24 };
    const due = new Date(Date.now() + (Number(def.default_due_hours || 0) * 3600000)).toISOString();
    pieAppend_('PIE_ACTION_TASK', { task_id: pieId_('PIETASK'), case_id: caseId, screening_id: screeningId, action_code: code, label: def.label || code, status: 'OPEN', owner_role: def.owner_role || '', due_at: due, created_at: now, created_by: actor, updated_at: now, updated_by: actor });
  });
}

function pieAppendStructuredScreening_(caseId, screeningId, payload, facts, user, now) {
  const symptomMap = [
    ['emergency','RED_FLAG'], ['respiratory','RESPIRATORY_SYNDROME'], ['neuro','NEUROLOGIC_SYNDROME'],
    ['fever','FEVER'], ['jaundice','JAUNDICE'], ['aki','ACUTE_KIDNEY_INJURY'], ['clusterSevere','SEVERE_CLUSTER_SIGNAL']
  ];
  symptomMap.forEach(function(pair) {
    if (!facts[pair[0]]) return;
    pieAppend_('PIE_SYMPTOM', { symptom_id: pieId_('PIESYM'), screening_id: screeningId, symptom_code: pair[1], present: true, severity_code: payload.emergency ? 'SEVERE' : '', onset_date: payload.onset_date || '', notes: payload.symptom_notes || '', created_at: now, created_by: user });
  });
  if (facts.respiratory) pieAppend_('PIE_SYNDROME', { syndrome_id: pieId_('PIESYN'), screening_id: screeningId, syndrome_code: 'SARI_OR_RESPIRATORY', severity_code: payload.emergency ? 'SEVERE' : '', onset_date: payload.onset_date || '', evidence_quality: 'REPORTED', created_at: now, created_by: user });
  if (facts.neuro) pieAppend_('PIE_SYNDROME', { syndrome_id: pieId_('PIESYN'), screening_id: screeningId, syndrome_code: 'ACUTE_NEUROLOGIC', severity_code: payload.emergency ? 'SEVERE' : '', onset_date: payload.onset_date || '', evidence_quality: 'REPORTED', created_at: now, created_by: user });

  const expMap = [
    ['poultry','ANIMAL_CONTACT','POULTRY'], ['biteMammal','ANIMAL_BITE','MAMMAL'], ['bat','ANIMAL_CONTACT','BAT'],
    ['pig','ANIMAL_CONTACT','PIG'], ['sap','FOOD_OR_DRINK','SAP_NIRA'], ['flood','ENVIRONMENT_WATER','FLOOD'], ['rodent','ANIMAL_CONTACT','RODENT']
  ];
  expMap.forEach(function(pair) {
    if (!facts[pair[0]]) return;
    pieAppend_('PIE_EXPOSURE_EVENT', { exposure_id: pieId_('PIEEXP'), screening_id: screeningId, exposure_type_code: pair[1], animal_code: pair[2], animal_condition: payload.animal_condition || '', contact_mode_code: payload.contact_mode_code || '', exposure_start_at: payload.exposure_start_at || '', exposure_end_at: payload.exposure_end_at || '', ppe_used: payload.ppe_used || '', skin_or_mucosa_exposed: payload.skin_or_mucosa_exposed || '', evidence_quality: 'REPORTED', notes: payload.exposure_notes || '', created_at: now, created_by: user });
  });
  if (payload.travel_location || payload.travel_start_at || payload.travel_end_at) pieAppend_('PIE_TRAVEL_EVENT', { travel_id: pieId_('PIETRV'), screening_id: screeningId, location_text: payload.travel_location || '', start_at: payload.travel_start_at || '', end_at: payload.travel_end_at || '', purpose_code: payload.travel_purpose || '', evidence_quality: 'REPORTED', notes: payload.travel_notes || '', created_at: now, created_by: user });
  if (payload.contact_type_code || payload.contact_date) pieAppend_('PIE_CONTACT_EVENT', { contact_id: pieId_('PIECTC'), screening_id: screeningId, contact_type_code: payload.contact_type_code || '', setting_code: payload.contact_setting_code || '', contact_date: payload.contact_date || '', known_case_identifier: payload.known_case_identifier || '', ppe_used: payload.contact_ppe_used || '', evidence_quality: 'REPORTED', notes: payload.contact_notes || '', created_at: now, created_by: user });
  if (facts.clusterSevere) pieAppend_('PIE_CLUSTER_LINK', { cluster_link_id: pieId_('PIECLU'), case_id: caseId, cluster_id: payload.cluster_id || ('CLUSTER-PENDING-' + caseId.slice(-6)), relationship_code: 'POTENTIAL_MEMBER', evidence_quality: 'REPORTED', created_at: now, created_by: user });
}

function piePeTemplateForDisease_(diseaseCode) {
  const map = {
    AVIAN_INFLUENZA: 'PE_FLU_BURUNG_EMERGING_RESPIRATORY',
    RABIES_EXPOSURE: 'PE_GHPR_RABIES_EXPOSURE',
    LEPTOSPIROSIS: 'PE_LEPTOSPIROSIS',
    NIPAH_OR_RABIES_LIKE: 'PE_EMERGING_ZOONOSIS_NEUROLOGIC',
    SEVERE_UNEXPLAINED_CLUSTER: 'PE_KLB_CLUSTER_INVESTIGATION',
    MPOX_SUSPECT: 'PE_MPOX_INVESTIGATION'
  };
  return map[String(diseaseCode || '').toUpperCase()] || 'PE_PIE_GENERIC_INVESTIGATION';
}

function pieCreatePeFollowUp(token, caseId, notes) {
  const sess = _requirePieSession_(token, { roles: ['super-admin', 'admin', 'surveilans'] });
  const now = pieNowIso_(), actor = pieActorFromSession_(sess);
  const cases = pieReadRows_('PIE_CASE', 500);
  const found = cases.filter(function(c) { return String(c.case_id || '') === String(caseId || ''); })[0];
  if (!found) throw new Error('Kasus PIE tidak ditemukan: ' + caseId);
  const disease = found.lead_candidate_disease_code || '';
  const template = piePeTemplateForDisease_(disease);
  const screenings = pieReadRows_('PIE_SCREENING', 500);
  const screening = screenings.filter(function(s) { return String(s.case_id || '') === String(caseId || ''); })[0] || {};
  const patients = pieReadRows_('PIE_PATIENT_LINK', 500);
  const patient = patients.filter(function(p) { return String(p.patient_id || '') === String(found.patient_id || ''); })[0] || {};
  const prefill = { case_id: caseId, screening_id: screening.screening_id || '', patient_id: found.patient_id || '', name: patient.name || '', nik_masked: patient.nik_masked || '', medical_record_number: patient.medical_record_number || '', date_of_birth: patient.date_of_birth || '', sex: patient.sex || '', address: patient.address || '', province_code: patient.province_code || '', city_code: patient.city_code || '', district_code: patient.district_code || '', village_code: patient.village_code || '', faskes_key: found.owner_faskes_key || '', disease_code: disease, epi_risk: found.current_epi_risk || '', clinical_acuity: found.current_clinical_acuity || '' };
  const peFormId = pieId_('PIEPE');
  pieAppend_('PIE_PE_FORM', { pe_form_id: peFormId, case_id: caseId, screening_id: screening.screening_id || '', template_code: template, disease_code: disease, status: 'DRAFT', prefill_json: JSON.stringify(prefill), investigation_json: JSON.stringify({ notes: notes || '' }), created_at: now, created_by: actor, updated_at: now, updated_by: actor });
  const taskId = pieId_('PIETASK');
  pieAppend_('PIE_ACTION_TASK', { task_id: taskId, case_id: caseId, screening_id: screening.screening_id || '', action_code: 'START_PE_INVESTIGATION', label: 'Lanjutkan ke Form PE: ' + template, status: 'OPEN', owner_role: 'surveilans', due_at: new Date(Date.now() + 24 * 3600000).toISOString(), notes: notes || template, created_at: now, created_by: actor, updated_at: now, updated_by: actor });
  pieUpdateById_('PIE_CASE', 'case_id', caseId, { case_status: 'INVESTIGATION', updated_at: now, updated_by: actor });
  pieAppend_('PIE_AUDIT', { audit_id: pieId_('PIEAUD'), entity_type: 'PIE_PE_FORM', entity_id: peFormId, action: 'CREATE_PE_FORM_DRAFT', actor: actor, occurred_at: now, summary: 'PE form draft created: ' + template, after_json: JSON.stringify({ case_id: caseId, disease_code: disease, template: template, task_id: taskId, pe_form_id: peFormId }) });
  return { ok: true, data: { case_id: caseId, task_id: taskId, pe_form_id: peFormId, disease_code: disease, pe_template: template, prefill: prefill, case_status: 'INVESTIGATION' }, meta: { serverTime: now } };
}


function pieGetPeForm(token, peFormId) {
  _requirePieSession_(token, { roles: ['super-admin', 'admin', 'surveilans'] });
  peFormId = String(peFormId || '').trim();
  if (!peFormId) throw new Error('pe_form_id kosong.');
  const form = pieReadRows_('PIE_PE_FORM', 1000).filter(function(r) { return String(r.pe_form_id || '') === peFormId; })[0];
  if (!form) throw new Error('Form PE tidak ditemukan.');
  let investigation = {};
  try { investigation = form.investigation_json ? JSON.parse(form.investigation_json) : {}; } catch (e) { investigation = {}; }
  return { ok: true, data: { form: form, investigation: investigation }, meta: { serverTime: pieNowIso_() } };
}

function pieSavePeInvestigation(token, peFormId, investigation) {
  const sess = _requirePieSession_(token, { roles: ['super-admin', 'admin', 'surveilans'] });
  peFormId = String(peFormId || '').trim();
  if (!peFormId) throw new Error('pe_form_id kosong.');
  const now = pieNowIso_(), actor = pieActorFromSession_(sess);
  const form = pieReadRows_('PIE_PE_FORM', 1000).filter(function(r) { return String(r.pe_form_id || '') === peFormId; })[0] || {};
  const validation = pieValidatePeInvestigation_(form.template_code || '', investigation || {});
  const status = validation.missing_required.length ? 'COMPLETE_WITH_GAPS' : 'COMPLETE';
  pieUpdateById_('PIE_PE_FORM', 'pe_form_id', peFormId, { status: status, investigation_json: JSON.stringify(investigation || {}), updated_at: now, updated_by: actor });
  pieAppend_('PIE_AUDIT', { audit_id: pieId_('PIEAUD'), entity_type: 'PIE_PE_FORM', entity_id: peFormId, action: 'SAVE_PE_INVESTIGATION', actor: actor, occurred_at: now, summary: 'PE investigation saved', after_json: JSON.stringify({ pe_form_id: peFormId, status: status, validation: validation }) });
  return { ok: true, data: { pe_form_id: peFormId, status: status, validation: validation }, meta: { serverTime: now } };
}

function pieValidatePeInvestigation_(templateCode, investigation) {
  const missing = [], warnings = [];
  const v = function(path) { return String(path.split('.').reduce(function(o, k) { return (o && o[k] !== undefined) ? o[k] : ''; }, investigation) || '').trim(); };
  const req = function(path, label) { if (!v(path)) missing.push(label); };
  req('summary', 'Ringkasan penyelidikan');
  req('case_definition', 'Definisi kasus yang dipakai');
  req('chronology.onset', 'Tanggal onset/keluhan awal');
  req('chronology.care', 'Riwayat berobat/rujukan');
  req('chronology.control', 'Tindakan pengendalian awal');
  const t = String(templateCode || '').toUpperCase();
  if (t.indexOf('FLU_BURUNG') !== -1 || t.indexOf('RESPIRATORY') !== -1) { req('template_fields.avian_poultry', 'Detail unggas/pasar/peternakan'); req('template_fields.avian_specimen', 'Spesimen standar flu burung/respiratory'); }
  else if (t.indexOf('RABIES') !== -1) { req('template_fields.rabies_wound', 'Kategori luka/gigitan'); req('template_fields.rabies_pep', 'PEP/VAR/SAR'); req('template_fields.rabies_animal', 'Status hewan penggigit'); }
  else if (t.indexOf('LEPTOSPIROSIS') !== -1) { req('template_fields.lepto_water', 'Paparan air/tikus'); req('template_fields.lepto_organ', 'Tanda berat leptospirosis'); }
  else if (t.indexOf('NEUROLOGIC') !== -1 || t.indexOf('ZOONOSIS') !== -1) { req('template_fields.neuro', 'Gejala neurologis utama'); req('template_fields.animal', 'Riwayat hewan/produk hewan'); }
  else if (t.indexOf('MPOX') !== -1) { req('template_fields.mpox_case_info', 'Informasi kasus Mpox'); req('template_fields.mpox_clinical', 'Informasi klinis dan lesi Mpox'); req('template_fields.mpox_exposure', 'Riwayat paparan 21 hari Mpox'); req('template_fields.mpox_specimen', 'Pemeriksaan penunjang Mpox'); }
  else if (t.indexOf('CLUSTER') !== -1 || t.indexOf('KLB') !== -1) { req('template_fields.cluster_line', 'Line list/tautan klaster'); req('template_fields.cluster_hypothesis', 'Hipotesis awal KLB'); }
  if (!v('specimen_plan')) warnings.push('Rencana spesimen belum diisi.');
  if (!v('chronology.contact')) warnings.push('Riwayat kontak erat belum diisi.');
  return { missing_required: missing, warnings: warnings, complete: missing.length === 0 };
}

function pieCreateSpecimen(token, payload) {
  const sess = _requirePieSession_(token, { roles: ['super-admin', 'admin', 'surveilans', 'petugas'] });
  payload = payload || {};
  if (!payload.case_id) throw new Error('case_id kosong.');
  const now = pieNowIso_(), actor = pieActorFromSession_(sess);
  const id = pieId_('PIESPC');
  pieAppend_('PIE_SPECIMEN', { specimen_id: id, case_id: payload.case_id, screening_id: payload.screening_id || '', specimen_type_code: payload.specimen_type_code || '', collection_at: payload.collection_at || '', collector: payload.collector || actor, status: payload.status || 'COLLECTED', shipment_at: payload.shipment_at || '', destination_lab: payload.destination_lab || '', chain_of_custody_ref: payload.chain_of_custody_ref || '', notes: payload.notes || '', created_at: now, created_by: actor, updated_at: now, updated_by: actor });
  pieAppend_('PIE_AUDIT', { audit_id: pieId_('PIEAUD'), entity_type: 'PIE_SPECIMEN', entity_id: id, action: 'CREATE_SPECIMEN', actor: actor, occurred_at: now, summary: 'Spesimen PIE dicatat', after_json: JSON.stringify({ specimen_id: id, case_id: payload.case_id }) });
  return { ok: true, data: { specimen_id: id, case_id: payload.case_id, status: payload.status || 'COLLECTED' }, meta: { serverTime: now } };
}

function pieSaveLabResult(token, payload) {
  const sess = _requirePieSession_(token, { roles: ['super-admin', 'admin', 'surveilans'] });
  payload = payload || {};
  if (!payload.case_id || !payload.specimen_id) throw new Error('case_id/specimen_id kosong.');
  const now = pieNowIso_(), actor = pieActorFromSession_(sess);
  const id = pieId_('PIELAB');
  pieAppend_('PIE_LAB_RESULT', { lab_result_id: id, case_id: payload.case_id, specimen_id: payload.specimen_id, test_code: payload.test_code || '', result_code: payload.result_code || '', result_text: payload.result_text || '', result_at: payload.result_at || now, verified_by: actor, verified_at: now, attachment_ref: payload.attachment_ref || '', created_at: now, created_by: actor });
  pieAppend_('PIE_AUDIT', { audit_id: pieId_('PIEAUD'), entity_type: 'PIE_LAB_RESULT', entity_id: id, action: 'SAVE_LAB_RESULT', actor: actor, occurred_at: now, summary: 'Hasil lab PIE dicatat', after_json: JSON.stringify({ lab_result_id: id, case_id: payload.case_id, specimen_id: payload.specimen_id }) });
  return { ok: true, data: { lab_result_id: id, case_id: payload.case_id, specimen_id: payload.specimen_id }, meta: { serverTime: now } };
}

function pieAddOneHealthSignal(token, payload) {
  const sess = _requirePieSession_(token, { roles: ['super-admin', 'admin', 'surveilans'] });
  payload = payload || {};
  if (!payload.case_id) throw new Error('case_id kosong.');
  const now = pieNowIso_(), actor = pieActorFromSession_(sess), id = pieId_('PIEOH');
  pieAppend_('PIE_ONEHEALTH_SIGNAL', { signal_id: id, case_id: payload.case_id, screening_id: payload.screening_id || '', signal_type_code: payload.signal_type_code || '', species_or_environment: payload.species_or_environment || '', location_text: payload.location_text || '', event_at: payload.event_at || '', source_agency: payload.source_agency || '', summary: payload.summary || '', created_at: now, created_by: actor });
  pieAppend_('PIE_AUDIT', { audit_id: pieId_('PIEAUD'), entity_type: 'PIE_ONEHEALTH_SIGNAL', entity_id: id, action: 'ADD_ONEHEALTH_SIGNAL', actor: actor, occurred_at: now, summary: 'Sinyal One Health ditambahkan', after_json: JSON.stringify({ signal_id: id, case_id: payload.case_id }) });
  return { ok: true, data: { signal_id: id, case_id: payload.case_id }, meta: { serverTime: now } };
}

function pieAddClusterLink(token, payload) {
  const sess = _requirePieSession_(token, { roles: ['super-admin', 'admin', 'surveilans'] });
  payload = payload || {};
  if (!payload.case_id || !payload.cluster_id) throw new Error('case_id/cluster_id kosong.');
  const now = pieNowIso_(), actor = pieActorFromSession_(sess), id = pieId_('PIECLU');
  pieAppend_('PIE_CLUSTER_LINK', { cluster_link_id: id, case_id: payload.case_id, cluster_id: payload.cluster_id, relationship_code: payload.relationship_code || 'POTENTIAL_MEMBER', evidence_quality: payload.evidence_quality || 'REPORTED', created_at: now, created_by: actor });
  pieAppend_('PIE_AUDIT', { audit_id: pieId_('PIEAUD'), entity_type: 'PIE_CLUSTER_LINK', entity_id: id, action: 'ADD_CLUSTER_LINK', actor: actor, occurred_at: now, summary: 'Tautan klaster ditambahkan', after_json: JSON.stringify({ cluster_link_id: id, case_id: payload.case_id, cluster_id: payload.cluster_id }) });
  return { ok: true, data: { cluster_link_id: id, case_id: payload.case_id, cluster_id: payload.cluster_id }, meta: { serverTime: now } };
}

function pieArchiveCase(token, caseId, reason) {
  const sess = _requirePieSession_(token, { roles: ['super-admin', 'admin', 'surveilans'] });
  caseId = String(caseId || '').trim();
  if (!caseId) throw new Error('case_id kosong.');
  const now = pieNowIso_(), actor = pieActorFromSession_(sess);
  const cases = pieReadRows_('PIE_CASE', 500);
  const found = cases.filter(function(c) { return String(c.case_id || '') === caseId; })[0];
  if (!found) throw new Error('Kasus PIE tidak ditemukan: ' + caseId);
  const archiveId = pieId_('PIEARC');
  pieAppend_('PIE_ARCHIVE_CASE', { archive_id: archiveId, case_id: caseId, archive_reason: reason || 'ARSIP_OPERASIONAL', archived_at: now, archived_by: actor, case_json: JSON.stringify(found) });
  pieUpdateById_('PIE_CASE', 'case_id', caseId, { case_status: 'ARCHIVED', updated_at: now, updated_by: actor });
  pieAppend_('PIE_AUDIT', { audit_id: pieId_('PIEAUD'), entity_type: 'PIE_CASE', entity_id: caseId, action: 'ARCHIVE_CASE', actor: actor, occurred_at: now, summary: 'Kasus PIE diarsipkan', after_json: JSON.stringify({ archive_id: archiveId, reason: reason || '' }) });
  return { ok: true, data: { case_id: caseId, archive_id: archiveId, case_status: 'ARCHIVED' }, meta: { serverTime: now } };
}

function pieAddKbRuleDraft(token, payload) {
  const sess = _requirePieSession_(token, { roles: ['super-admin', 'admin'] });
  payload = payload || {};
  const disease = String(payload.disease_code || '').trim().toUpperCase();
  const facts = String(payload.required_facts || '').trim();
  if (!disease || !facts) throw new Error('Disease code dan required facts wajib diisi.');
  const now = pieNowIso_(), actor = pieActorFromSession_(sess), id = pieId_('PIEKB');
  pieAppend_('PIE_KB_RULE', { rule_id: id, rule_set_version: PIE_CONFIG.RULE_SET_VERSION, rule_version: 'DRAFT', disease_code: disease, rule_type: payload.rule_type || 'DRAFT_SCREENING_RULE', minimum_epi_risk: payload.minimum_epi_risk || 'E2', priority: payload.priority || 50, hard_trigger: String(payload.hard_trigger || 'false'), required_facts: facts, optional_facts: payload.optional_facts || '', exclusion_facts: payload.exclusion_facts || '', recommended_actions: payload.recommended_actions || 'START_PE_INVESTIGATION', specimen_guidance: payload.specimen_guidance || '', explanation_template: payload.explanation_template || 'Draft rule - perlu approval sebelum aktif.', active: false });
  pieAppend_('PIE_AUDIT', { audit_id: pieId_('PIEAUD'), entity_type: 'PIE_KB_RULE', entity_id: id, action: 'ADD_KB_RULE_DRAFT', actor: actor, occurred_at: now, summary: 'Draft rule KB PIE ditambahkan', after_json: JSON.stringify({ rule_id: id, disease_code: disease }) });
  return { ok: true, data: { rule_id: id, status: 'DRAFT', active: false }, meta: { serverTime: now } };
}

function pieApproveKbRule(token, ruleId, notes) {
  const sess = _requirePieSession_(token, { superAdminOnly: true });
  ruleId = String(ruleId || '').trim();
  if (!ruleId) throw new Error('rule_id kosong.');
  const now = pieNowIso_(), actor = pieActorFromSession_(sess);
  pieUpdateById_('PIE_KB_RULE', 'rule_id', ruleId, { rule_version: PIE_CONFIG.RULE_SET_VERSION, active: true });
  pieAppend_('PIE_AUDIT', { audit_id: pieId_('PIEAUD'), entity_type: 'PIE_KB_RULE', entity_id: ruleId, action: 'APPROVE_KB_RULE', actor: actor, occurred_at: now, summary: 'Rule KB PIE disetujui. Engine runtime belum otomatis membaca custom rule sampai scoring engine aktif.', after_json: JSON.stringify({ rule_id: ruleId, notes: notes || '', active: true }) });
  return { ok: true, data: { rule_id: ruleId, active: true, rule_version: PIE_CONFIG.RULE_SET_VERSION }, meta: { serverTime: now } };
}

function pieCalculateValidationMetrics(token) {
  const sess = _requirePieSession_(token, { roles: ['super-admin', 'admin', 'surveilans'] });
  const now = pieNowIso_(), actor = pieActorFromSession_(sess);
  const cases = pieReadRows_('PIE_CASE', 1000);
  const specimens = pieReadRows_('PIE_SPECIMEN', 1000);
  const labs = pieReadRows_('PIE_LAB_RESULT', 1000);
  const alerts = pieReadRows_('PIE_ALERT', 1000);
  const classifications = pieReadRows_('PIE_CLASSIFICATION_HISTORY', 1000);
  const peForms = pieReadRows_('PIE_PE_FORM', 1000);
  const highRisk = cases.filter(function(c) { return ['E3','EX'].indexOf(String(c.current_epi_risk || '').toUpperCase()) !== -1; });
  const avgHours = function(values) { values = values.filter(function(v) { return isFinite(v) && v >= 0; }); return values.length ? Math.round((values.reduce(function(a,b){return a+b;},0) / values.length) * 10) / 10 : 0; };
  const alertAckHours = alerts.map(function(a) { const t = Date.parse(a.triggered_at || ''), ack = Date.parse(a.acknowledged_at || ''); return (t && ack) ? (ack - t) / 3600000 : NaN; });
  const specimenToLabHours = labs.map(function(l) { const sp = specimens.filter(function(s) { return String(s.specimen_id || '') === String(l.specimen_id || ''); })[0] || {}; const c = Date.parse(sp.collection_at || ''), r = Date.parse(l.result_at || l.created_at || ''); return (c && r) ? (r - c) / 3600000 : NaN; });
  const classHours = classifications.map(function(h) { const c = cases.filter(function(x) { return String(x.case_id || '') === String(h.case_id || ''); })[0] || {}; const opened = Date.parse(c.opened_at || ''), changed = Date.parse(h.changed_at || ''); return (opened && changed) ? (changed - opened) / 3600000 : NaN; });
  const metrics = {
    total_cases: cases.length,
    high_risk_cases: highRisk.length,
    unclassified_cases: cases.filter(function(c) { return !String(c.classification_status || '').trim() || String(c.classification_status || '').toUpperCase() === 'UNCLASSIFIED'; }).length,
    high_risk_without_specimen: highRisk.filter(function(c) { return !specimens.some(function(s) { return String(s.case_id || '') === String(c.case_id || ''); }); }).length,
    specimens_without_lab_result: specimens.filter(function(s) { return !labs.some(function(l) { return String(l.specimen_id || '') === String(s.specimen_id || ''); }); }).length,
    open_alerts: alerts.filter(function(a) { return String(a.status || '').toUpperCase() !== 'RESOLVED'; }).length,
    pe_forms_total: peForms.length,
    pe_forms_complete: peForms.filter(function(p) { return String(p.status || '').toUpperCase() === 'COMPLETE'; }).length,
    pe_forms_with_gaps: peForms.filter(function(p) { return String(p.status || '').toUpperCase() === 'COMPLETE_WITH_GAPS'; }).length,
    pe_forms_draft: peForms.filter(function(p) { return ['DRAFT','OPEN',''].indexOf(String(p.status || '').toUpperCase()) !== -1; }).length,
    avg_alert_ack_hours: avgHours(alertAckHours),
    avg_specimen_to_lab_hours: avgHours(specimenToLabHours),
    avg_case_to_classification_hours: avgHours(classHours)
  };
  const start = new Date(Date.now() - 30 * 24 * 3600000).toISOString().slice(0, 10);
  const end = now.slice(0, 10);
  Object.keys(metrics).forEach(function(k) {
    pieAppend_('PIE_VALIDATION_METRIC', { metric_id: pieId_('PIEVAL'), validation_type: 'OPERATIONAL_DATA_QUALITY', metric_key: k, metric_value: metrics[k], dimension_json: JSON.stringify({ module: 'SARING-PIE' }), period_start: start, period_end: end, calculated_at: now, created_by: actor });
  });
  pieAppend_('PIE_AUDIT', { audit_id: pieId_('PIEAUD'), entity_type: 'PIE_VALIDATION_METRIC', entity_id: now, action: 'CALCULATE_VALIDATION_METRICS', actor: actor, occurred_at: now, summary: 'Metrik validasi SARING-PIE dihitung', after_json: JSON.stringify(metrics) });
  return { ok: true, data: { validation_type: 'OPERATIONAL_DATA_QUALITY', period_start: start, period_end: end, metrics: metrics }, meta: { serverTime: now } };
}

function pieTestKbRule(token, payload) {
  _requirePieSession_(token, { roles: ['super-admin', 'admin'] });
  payload = payload || {};
  const facts = {};
  String(payload.facts || '').split(/[;,]+/).map(function(x) { return x.trim(); }).filter(Boolean).forEach(function(k) { facts[k] = true; });
  const required = pieParseRuleFacts_(payload.required_facts || '');
  const optional = pieParseRuleFacts_(payload.optional_facts || '');
  const excluded = pieParseRuleFacts_(payload.exclusion_facts || '');
  const missing = required.filter(function(k) { return !facts[k]; });
  const excludedMatched = excluded.filter(function(k) { return !!facts[k]; });
  const optionalMatched = optional.filter(function(k) { return !!facts[k]; });
  const matched = missing.length === 0 && excludedMatched.length === 0 && (!optional.length || optionalMatched.length > 0 || required.length > 0);
  const actions = pieParseRuleFacts_(payload.recommended_actions || 'START_PE_INVESTIGATION');
  const score_detail = pieScoreRuleComponents_({ required_facts: payload.required_facts || '', optional_facts: payload.optional_facts || '', priority: payload.priority || 50 }, facts);
  return { ok: true, data: { matched: matched, score: score_detail.total, score_detail: score_detail, minimum_epi_risk: payload.minimum_epi_risk || 'E2', disease_code: String(payload.disease_code || '').toUpperCase(), actions: actions, facts: facts, missing_required_facts: missing, matched_optional_facts: optionalMatched, matched_exclusion_facts: excludedMatched, explanation: payload.explanation_template || (matched ? 'Rule match pada simulasi.' : 'Rule belum match pada simulasi.') }, meta: { serverTime: pieNowIso_() } };
}

function pieCreateEncounter(token, payload) {
  const sess = _requirePieSession_(token, { roles: ['super-admin', 'admin', 'petugas', 'surveilans'] });
  payload = payload || {};
  const now = pieNowIso_(), user = pieActorFromSession_(sess);
  const caseId = pieId_('PIECASE'), patientId = pieId_('PIEPT'), encounterId = pieId_('PIEENC'), screeningId = pieId_('PIESCR');
  const facts = pieFactsFromPayload_(payload), evalResult = pieEvaluateFacts_(facts);
  const validation = pieValidatePayload_(payload, facts, evalResult);
  if (validation.errors.length) throw new Error(validation.errors.join(' '));
  const lead = (evalResult.matched_rules[0] && evalResult.matched_rules[0].disease_code) || '';
  pieAppend_('PIE_PATIENT_LINK', { patient_id: patientId, nik_hash: payload.nik ? pieHash_(payload.nik) : '', nik_masked: pieMaskNik_(payload.nik), medical_record_number: payload.medical_record_number || '', name: payload.name || '', date_of_birth: payload.date_of_birth || '', sex: payload.sex || '', phone_masked: pieMaskPhone_(payload.phone), address: payload.address || '', province_code: payload.province_code || '', city_code: payload.city_code || '', district_code: payload.district_code || '', village_code: payload.village_code || '', latitude: payload.latitude || '', longitude: payload.longitude || '', identity_source: 'MANUAL', consent_or_legal_basis_code: 'SURVEILLANCE_PUBLIC_HEALTH', created_at: now, created_by: user, updated_at: now, updated_by: user });
  pieAppend_('PIE_CASE', { case_id: caseId, human_case_number: 'PIE-' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMdd') + '-' + caseId.slice(-6), patient_id: patientId, primary_encounter_id: encounterId, case_status: 'SCREENED', current_epi_risk: evalResult.epi_risk, current_clinical_acuity: evalResult.clinical_acuity, lead_candidate_disease_code: lead, classification_status: 'UNCLASSIFIED', notification_status: (evalResult.epi_risk === 'E3' || evalResult.epi_risk === 'EX') ? 'REQUIRED' : 'NOT_REQUIRED', owner_user_id: user, owner_faskes_key: payload.faskes_key || '', opened_at: now, rule_set_version_at_open: PIE_CONFIG.RULE_SET_VERSION, data_sensitivity_level: 'PII', row_version: 1, created_at: now, created_by: user, updated_at: now, updated_by: user });
  pieAppend_('PIE_ENCOUNTER', { encounter_id: encounterId, case_id: caseId, patient_id: patientId, faskes_key: payload.faskes_key || '', service_unit: payload.service_unit || '', encounter_type: payload.encounter_type || 'OUTPATIENT', arrival_at: payload.arrival_at || now, screening_started_at: payload.screening_started_at || now, screening_completed_at: now, source_system: 'SARING_PIE_WEBAPP', created_at: now, created_by: user, updated_at: now, updated_by: user });
  pieAppend_('PIE_SCREENING', { screening_id: screeningId, encounter_id: encounterId, case_id: caseId, screening_type: 'UNIVERSAL', screening_version: '1', status: 'COMPLETED', clinical_acuity: evalResult.clinical_acuity, epi_risk: evalResult.epi_risk, universal_screen_positive: evalResult.epi_risk !== 'E0', critical_missing_data: validation.warnings.join('; '), screening_completed_by: user, screening_completed_at: now, rule_set_version: PIE_CONFIG.RULE_SET_VERSION, evaluation_fingerprint: pieHash_(JSON.stringify(facts) + PIE_CONFIG.RULE_SET_VERSION), last_evaluated_at: now, created_at: now, created_by: user, updated_at: now, updated_by: user });
  Object.keys(facts).forEach(function(k) { pieAppend_('PIE_ANSWER', { answer_id: pieId_('PIEANS'), screening_id: screeningId, question_code: k, answer_type: 'boolean', answer_boolean: facts[k], source: 'UNIVERSAL_SCREEN', entered_by: user, entered_at: now }); });
  ['onset_date','symptom_notes','exposure_start_at','exposure_end_at','exposure_notes','animal_condition','contact_mode_code','travel_location','contact_type_code'].forEach(function(k) { if (payload[k]) pieAppend_('PIE_ANSWER', { answer_id: pieId_('PIEANS'), screening_id: screeningId, question_code: k, answer_type: 'text', answer_text: payload[k], source: 'STRUCTURED_SCREEN', entered_by: user, entered_at: now }); });
  pieAppendStructuredScreening_(caseId, screeningId, payload, facts, user, now);
  evalResult.matched_rules.forEach(function(r) { pieAppend_('PIE_RULE_RESULT', { rule_result_id: pieId_('PIERULE'), screening_id: screeningId, rule_id: r.rule_id, rule_version: PIE_CONFIG.RULE_SET_VERSION, disease_code: r.disease_code, matched: true, hard_trigger: r.hard_trigger, candidate_score: r.score, minimum_epi_risk: r.minimum_epi_risk || evalResult.epi_risk, matched_facts: JSON.stringify(facts), explanation: r.explanation, evaluated_at: now, engine_version: PIE_CONFIG.APP_VERSION, input_hash: pieHash_(JSON.stringify(facts)) }); });
  if (evalResult.epi_risk === 'E3' || evalResult.epi_risk === 'EX') {
    const alertId = pieId_('PIEALT');
    pieAppend_('PIE_ALERT', { alert_id: alertId, case_id: caseId, screening_id: screeningId, alert_type: evalResult.epi_risk, severity: evalResult.epi_risk === 'E3' ? 'HIGH' : 'MEDIUM', status: 'OPEN', triggered_by_rule_id: (evalResult.matched_rules[0] || {}).rule_id || '', triggered_at: now, due_at: now, idempotency_key: pieHash_(caseId + screeningId + evalResult.epi_risk) });
    pieNotifySurveillance_(caseId, screeningId, alertId, payload, evalResult, user, now);
  }
  pieCreateActionTasks_(caseId, screeningId, evalResult.recommended_actions, sess.user, now);
  pieAppend_('PIE_CLASSIFICATION', { classification_id: pieId_('PIECLS'), case_id: caseId, screening_id: screeningId, disease_code: lead, classification_status: 'SIGNAL_UNDER_REVIEW', basis: 'RULE_ENGINE_MVP', classified_at: now, classified_by: user, created_at: now, created_by: user });
  pieAppend_('PIE_CLASSIFICATION_HISTORY', { history_id: pieId_('PIECLSH'), case_id: caseId, screening_id: screeningId, disease_code: lead, from_status: '', to_status: 'SIGNAL_UNDER_REVIEW', basis: 'RULE_ENGINE_MVP', changed_at: now, changed_by: user, notes: 'Initial screening classification history' });
  pieAppend_('PIE_AUDIT', { audit_id: pieId_('PIEAUD'), entity_type: 'PIE_CASE', entity_id: caseId, action: 'CREATE_ENCOUNTER', actor: user, occurred_at: now, summary: 'SARING-PIE encounter created', after_json: JSON.stringify({ case_id: caseId, screening_id: screeningId, epi_risk: evalResult.epi_risk, clinical_acuity: evalResult.clinical_acuity }) });
  let adminTelegramNotifications = [];
  try {
    adminTelegramNotifications = sendAdminOperationalTelegramNotificationsOnce('INPUT_PIE_BARU', {
      caseCode: caseId,
      diagnosisCode: lead || 'PIE',
      action: 'Review input PIE baru',
      workspace: 'saring-pie',
      status: evalResult.epi_risk || 'BARU'
    });
  } catch (_e) {}
  return { ok: true, status: 'success', requestId: pieId_('REQ'), data: { case_id: caseId, patient_id: patientId, encounter_id: encounterId, screening_id: screeningId, result: evalResult, warnings: validation.warnings, adminTelegramNotifications: adminTelegramNotifications,
      adminWahaNotification: adminWahaNotification }, meta: { appVersion: PIE_CONFIG.APP_VERSION, ruleSetVersion: PIE_CONFIG.RULE_SET_VERSION, serverTime: now } };
}

function pieReadRows_(sheetName, limit) {
  const sh = pieGetSheet_(sheetName);
  const headers = getTrimmedHeaders_(sh);
  const lastRow = sh.getLastRow();
  if (lastRow < 2) return [];
  const values = sh.getRange(2, 1, lastRow - 1, headers.length).getValues();
  const rows = values.map(function(row, idx) {
    const obj = { _rowNumber: idx + 2 };
    headers.forEach(function(h, i) { obj[h] = row[i]; });
    return obj;
  }).filter(function(obj) { return Object.keys(obj).some(function(k) { return k !== '_rowNumber' && obj[k] !== ''; }); });
  rows.reverse();
  return limit ? rows.slice(0, Number(limit)) : rows;
}

function pieDashboardCacheGet_(key) {
  try {
    const raw = CacheService.getScriptCache().get(String(key || ''));
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function pieDashboardCachePut_(key, value, ttlSec) {
  try {
    const json = JSON.stringify(value);
    if (json.length < 95000) CacheService.getScriptCache().put(String(key || ''), json, Number(ttlSec || 60));
  } catch (e) {}
}

function pieGetOperationalDashboard(token) {
  const sess = _requirePieSession_(token);
  const role = String((sess.user && sess.user.role) || '').trim().toLowerCase().replace(/[_\s]+/g, '-');
  const user = String((sess.user && (sess.user.username || sess.user.email || sess.user.userId)) || '').trim().toLowerCase();
  const cacheKey = ['PIE_OPERATIONAL_DASHBOARD_V2', role, user].join('|');
  const cached = pieDashboardCacheGet_(cacheKey);
  if (cached) {
    cached.cached = true;
    if (cached.meta) cached.meta.cached = true;
    return cached;
  }
  const cases = pieReadRows_('PIE_CASE', 200);
  const alertsAll = pieReadRows_('PIE_ALERT', 200);
  const alerts = alertsAll.filter(function(a) { return String(a.status || '').toUpperCase() !== 'RESOLVED'; }).slice(0, 20);
  const tasksAll = pieReadRows_('PIE_ACTION_TASK', 300);
  const tasks = tasksAll.filter(function(t) { return String(t.status || '').toUpperCase() !== 'DONE'; }).slice(0, 30);
  const specimens = pieReadRows_('PIE_SPECIMEN', 300).slice(0, 100);
  const labResults = pieReadRows_('PIE_LAB_RESULT', 300).slice(0, 100);
  const clusterLinks = pieReadRows_('PIE_CLUSTER_LINK', 200).slice(0, 60);
  const oneHealthSignals = pieReadRows_('PIE_ONEHEALTH_SIGNAL', 200).slice(0, 60);
  const validationMetrics = pieReadRows_('PIE_VALIDATION_METRIC', 200).slice(0, 50);
  const peForms = pieReadRows_('PIE_PE_FORM', 300).slice(0, 120);
  const archives = pieReadRows_('PIE_ARCHIVE_CASE', 200).slice(0, 80);
  const classHistDash = pieReadRows_('PIE_CLASSIFICATION_HISTORY', 300);
  const highRisk = cases.filter(function(c) { return ['E3', 'EX'].indexOf(String(c.current_epi_risk || '').toUpperCase()) !== -1; }).length;
  const overdueTasks = tasks.filter(function(t) { const due = Date.parse(t.due_at || ''); return due && due < Date.now(); }).length;
  const byDisease = {}, byDay = {}, byWeek = {}, byMonth = {}, byFaskes = {}, bySpecimenStatus = {}, byLabResult = {}, byArchiveReason = {};
  const inc = function(obj, key) { key = String(key || 'UNKNOWN') || 'UNKNOWN'; obj[key] = (obj[key] || 0) + 1; };
  const weekKey = function(iso) { const d = new Date(iso || ''); if (!isFinite(d.getTime())) return 'UNKNOWN'; const onejan = new Date(Date.UTC(d.getUTCFullYear(),0,1)); const week = Math.ceil((((d - onejan) / 86400000) + onejan.getUTCDay() + 1) / 7); return d.getUTCFullYear() + '-W' + String(week).padStart(2,'0'); };
  cases.forEach(function(c) { const day = String(c.opened_at || '').slice(0, 10) || 'UNKNOWN'; inc(byDisease, c.lead_candidate_disease_code || 'UNSPECIFIED'); inc(byDay, day); inc(byWeek, weekKey(c.opened_at || c.created_at)); inc(byMonth, day.slice(0, 7) || 'UNKNOWN'); inc(byFaskes, c.owner_faskes_key || c.dinkes_owner || 'UNSPECIFIED'); });
  specimens.forEach(function(s) { inc(bySpecimenStatus, s.status || 'UNKNOWN'); });
  labResults.forEach(function(l) { inc(byLabResult, l.result_code || 'UNKNOWN'); });
  archives.forEach(function(a) { inc(byArchiveReason, a.archive_reason || 'UNKNOWN'); });
  const missingClass = cases.filter(function(c) { return !String(c.classification_status || '').trim() || String(c.classification_status || '').toUpperCase() === 'UNCLASSIFIED'; }).length;
  const missingSpecimenHighRisk = cases.filter(function(c) { return ['E3','EX'].indexOf(String(c.current_epi_risk || '').toUpperCase()) !== -1 && !specimens.some(function(s) { return String(s.case_id || '') === String(c.case_id || ''); }); }).length;
  const missingLabForSpecimen = specimens.filter(function(s) { return !labResults.some(function(l) { return String(l.specimen_id || '') === String(s.specimen_id || ''); }); }).length;
  const avgHoursDash = function(values) { values = values.filter(function(v) { return isFinite(v) && v >= 0; }); return values.length ? Math.round((values.reduce(function(a,b){return a+b;},0) / values.length) * 10) / 10 : 0; };
  const pct = function(num, den) { return den ? Math.round((num / den) * 1000) / 10 : 0; };
  const alertAckDash = alertsAll.map(function(a) { const t = Date.parse(a.triggered_at || ''), ack = Date.parse(a.acknowledged_at || ''); return (t && ack) ? (ack - t) / 3600000 : NaN; });
  const classHoursDash = classHistDash.map(function(h) { const c = cases.filter(function(x) { return String(x.case_id || '') === String(h.case_id || ''); })[0] || {}; const opened = Date.parse(c.opened_at || ''), changed = Date.parse(h.changed_at || ''); return (opened && changed) ? (changed - opened) / 3600000 : NaN; });
  const labHoursDash = labResults.map(function(l) { const sp = specimens.filter(function(s) { return String(s.specimen_id || '') === String(l.specimen_id || ''); })[0] || {}; const c = Date.parse(sp.collection_at || ''), r = Date.parse(l.result_at || l.created_at || ''); return (c && r) ? (r - c) / 3600000 : NaN; });
  const ackWithin24 = alertAckDash.filter(function(h) { return isFinite(h) && h <= 24; }).length;
  const labWithin72 = labHoursDash.filter(function(h) { return isFinite(h) && h <= 72; }).length;
  const classified = cases.filter(function(c) { return ['SUSPECT','PROBABLE','CONFIRMED','DISCARDED','UNDER_REVIEW'].indexOf(String(c.classification_status || '').toUpperCase()) !== -1; }).length;
  const positiveClass = cases.filter(function(c) { return ['SUSPECT','PROBABLE','CONFIRMED'].indexOf(String(c.classification_status || '').toUpperCase()) !== -1; }).length;
  const discarded = cases.filter(function(c) { return String(c.classification_status || '').toUpperCase() === 'DISCARDED' || String(c.case_status || '').toUpperCase() === 'ARCHIVED'; }).length;
  const dataQuality = { unclassified_cases: missingClass, high_risk_without_specimen: missingSpecimenHighRisk, specimens_without_lab_result: missingLabForSpecimen, pe_forms_total: peForms.length, pe_forms_complete: peForms.filter(function(p) { return String(p.status || '').toUpperCase() === 'COMPLETE'; }).length, pe_forms_with_gaps: peForms.filter(function(p) { return String(p.status || '').toUpperCase() === 'COMPLETE_WITH_GAPS'; }).length, pe_forms_draft: peForms.filter(function(p) { return ['DRAFT','OPEN',''].indexOf(String(p.status || '').toUpperCase()) !== -1; }).length, avg_alert_ack_hours: avgHoursDash(alertAckDash), avg_specimen_to_lab_hours: avgHoursDash(labHoursDash), avg_case_to_classification_hours: avgHoursDash(classHoursDash), sla_alert_ack_24h_pct: pct(ackWithin24, alertAckDash.filter(isFinite).length), sla_specimen_to_lab_72h_pct: pct(labWithin72, labHoursDash.filter(isFinite).length), ppv_classification_proxy_pct: pct(positiveClass, classified), discarded_or_archived_cases: discarded };
  const result = { ok: true, data: { summary: { total_cases: cases.length, open_alerts: alerts.length, open_tasks: tasks.length, overdue_tasks: overdueTasks, high_risk_cases: highRisk, specimen_count: specimens.length, lab_result_count: labResults.length, by_disease: byDisease, by_day: byDay, by_week: byWeek, by_month: byMonth, by_faskes: byFaskes, by_specimen_status: bySpecimenStatus, by_lab_result: byLabResult, by_archive_reason: byArchiveReason, data_quality: dataQuality }, cases: cases.slice(0, 50), alerts: alerts, tasks: tasks, specimens: specimens, lab_results: labResults, cluster_links: clusterLinks, onehealth_signals: oneHealthSignals, pe_forms: peForms.slice(0, 80), archive_cases: archives, validation_metrics: validationMetrics }, meta: { appVersion: PIE_CONFIG.APP_VERSION, ruleSetVersion: PIE_CONFIG.RULE_SET_VERSION, serverTime: pieNowIso_() } };
  pieDashboardCachePut_(cacheKey, result, 90);
  return result;
}

function pieGetCaseTimeline(token, caseId) {
  _requirePieSession_(token, { roles: ['super-admin', 'admin', 'surveilans', 'petugas'] });
  caseId = String(caseId || '').trim();
  if (!caseId) throw new Error('case_id kosong.');
  const cases = pieReadRows_('PIE_CASE', 1000);
  const c = cases.filter(function(x) { return String(x.case_id || '') === caseId; })[0];
  if (!c) throw new Error('Kasus PIE tidak ditemukan: ' + caseId);
  const screeningIds = pieReadRows_('PIE_SCREENING', 1000).filter(function(r) { return String(r.case_id || '') === caseId; }).map(function(r) { return String(r.screening_id || ''); });
  const peForms = pieReadRows_('PIE_PE_FORM', 1000).filter(function(r) { return String(r.case_id || '') === caseId; });
  const specimens = pieReadRows_('PIE_SPECIMEN', 1000).filter(function(r) { return String(r.case_id || '') === caseId; });
  const specimenIds = specimens.map(function(r) { return String(r.specimen_id || ''); });
  const labs = pieReadRows_('PIE_LAB_RESULT', 1000).filter(function(r) { return String(r.case_id || '') === caseId || specimenIds.indexOf(String(r.specimen_id || '')) !== -1; });
  const alerts = pieReadRows_('PIE_ALERT', 1000).filter(function(r) { return String(r.case_id || '') === caseId; });
  const tasks = pieReadRows_('PIE_ACTION_TASK', 1000).filter(function(r) { return String(r.case_id || '') === caseId; });
  const classes = pieReadRows_('PIE_CLASSIFICATION_HISTORY', 1000).filter(function(r) { return String(r.case_id || '') === caseId; });
  const clusters = pieReadRows_('PIE_CLUSTER_LINK', 1000).filter(function(r) { return String(r.case_id || '') === caseId; });
  const onehealth = pieReadRows_('PIE_ONEHEALTH_SIGNAL', 1000).filter(function(r) { return String(r.case_id || '') === caseId; });
  const audits = pieReadRows_('PIE_AUDIT', 1000).filter(function(a) {
    const eid = String(a.entity_id || '');
    const after = String(a.after_json || '');
    return eid === caseId || screeningIds.indexOf(eid) !== -1 || specimenIds.indexOf(eid) !== -1 || after.indexOf(caseId) !== -1;
  });
  const events = [];
  const add = function(at, type, label, detail, entityId) { events.push({ at: at || '', type: type, label: label, detail: detail || '', entity_id: entityId || '' }); };
  add(c.opened_at || c.created_at, 'CASE', 'Kasus dibuka', c.current_epi_risk + ' • ' + (c.lead_candidate_disease_code || '-'), caseId);
  peForms.forEach(function(r){ add(r.created_at, 'PE', 'Form PE dibuat', (r.template_code || '-') + ' • ' + (r.status || '-'), r.pe_form_id); if (r.updated_at && r.updated_at !== r.created_at) add(r.updated_at, 'PE', 'Form PE diperbarui', r.status || '-', r.pe_form_id); });
  specimens.forEach(function(r){ add(r.collection_at || r.created_at, 'SPECIMEN', 'Spesimen dicatat', (r.specimen_type_code || '-') + ' • ' + (r.status || '-'), r.specimen_id); });
  labs.forEach(function(r){ add(r.result_at || r.created_at, 'LAB', 'Hasil lab dicatat', (r.test_code || '-') + ' • ' + (r.result_code || '-'), r.lab_result_id); });
  alerts.forEach(function(r){ add(r.triggered_at || r.created_at, 'ALERT', 'Alert dibuat', (r.severity || r.alert_type || '-') + ' • ' + (r.status || '-'), r.alert_id); });
  tasks.forEach(function(r){ add(r.created_at, 'TASK', 'Task dibuat', (r.label || r.action_code || '-') + ' • ' + (r.status || '-'), r.task_id); if (r.completed_at) add(r.completed_at, 'TASK', 'Task selesai', r.label || r.action_code || '-', r.task_id); });
  classes.forEach(function(r){ add(r.changed_at, 'CLASSIFICATION', 'Klasifikasi berubah', (r.from_status || '-') + ' → ' + (r.to_status || '-'), r.history_id); });
  clusters.forEach(function(r){ add(r.created_at, 'CLUSTER', 'Tautan klaster', (r.cluster_id || '-') + ' • ' + (r.relationship_code || '-'), r.cluster_link_id); });
  onehealth.forEach(function(r){ add(r.event_at || r.created_at, 'ONEHEALTH', 'Sinyal One Health', (r.signal_type_code || '-') + ' • ' + (r.source_agency || '-'), r.signal_id); });
  audits.forEach(function(r){ add(r.occurred_at, 'AUDIT', r.action || 'AUDIT', r.summary || '', r.audit_id); });
  events.sort(function(a,b){ return String(a.at || '').localeCompare(String(b.at || '')); });
  return { ok: true, data: { case: c, timeline: events, audit: audits, related: { pe_forms: peForms, specimens: specimens, lab_results: labs, alerts: alerts, tasks: tasks, classification_history: classes, cluster_links: clusters, onehealth_signals: onehealth } }, meta: { serverTime: pieNowIso_() } };
}

function pieUpdateById_(sheetName, keyHeader, keyValue, updates) {
  const sh = pieGetSheet_(sheetName);
  const headers = getTrimmedHeaders_(sh);
  const keyIdx = headers.indexOf(keyHeader);
  if (keyIdx === -1) throw new Error('Kolom kunci tidak ditemukan: ' + keyHeader);
  const values = sh.getDataRange().getValues();
  let rowNumber = -1;
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][keyIdx] || '').trim() === String(keyValue || '').trim()) { rowNumber = i + 1; break; }
  }
  if (rowNumber === -1) throw new Error('Data tidak ditemukan: ' + keyValue);
  Object.keys(updates || {}).forEach(function(k) {
    const idx = headers.indexOf(k);
    if (idx !== -1) sh.getRange(rowNumber, idx + 1).setValue(updates[k]);
  });
  return rowNumber;
}

function pieCompleteActionTask(token, taskId, notes) {
  const sess = _requirePieSession_(token);
  taskId = String(taskId || '').trim();
  if (!taskId) throw new Error('task_id kosong.');
  const sh = pieGetSheet_('PIE_ACTION_TASK');
  const headers = getTrimmedHeaders_(sh);
  const idIdx = headers.indexOf('task_id');
  if (idIdx === -1) throw new Error('Kolom task_id tidak ditemukan.');
  const values = sh.getDataRange().getValues();
  let rowNumber = -1;
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][idIdx] || '').trim() === taskId) { rowNumber = i + 1; break; }
  }
  if (rowNumber === -1) throw new Error('Task tidak ditemukan: ' + taskId);
  const now = pieNowIso_();
  const actor = pieActorFromSession_(sess);
  const updates = { status: 'DONE', completed_at: now, completed_by: actor, notes: notes || '', updated_at: now, updated_by: actor };
  Object.keys(updates).forEach(function(k) {
    const idx = headers.indexOf(k);
    if (idx !== -1) sh.getRange(rowNumber, idx + 1).setValue(updates[k]);
  });
  pieAppend_('PIE_AUDIT', { audit_id: pieId_('PIEAUD'), entity_type: 'PIE_ACTION_TASK', entity_id: taskId, action: 'COMPLETE_TASK', actor: actor, occurred_at: now, summary: 'PIE action task completed', after_json: JSON.stringify(updates) });
  return { ok: true, status: 'success', data: { task_id: taskId, status: 'DONE' }, meta: { serverTime: now } };
}

function pieSetCaseClassification(token, caseId, status, notes) {
  const sess = _requirePieSession_(token, { roles: ['super-admin', 'admin', 'surveilans'] });
  caseId = String(caseId || '').trim();
  status = String(status || '').trim().toUpperCase();
  const allowed = ['UNDER_REVIEW', 'SUSPECT', 'PROBABLE', 'CONFIRMED', 'DISCARDED'];
  if (!caseId) throw new Error('case_id kosong.');
  if (allowed.indexOf(status) === -1) throw new Error('Status klasifikasi tidak valid.');
  const now = pieNowIso_(), actor = pieActorFromSession_(sess);
  pieUpdateById_('PIE_CASE', 'case_id', caseId, { classification_status: status, updated_at: now, updated_by: actor });
  pieAppend_('PIE_CLASSIFICATION', { classification_id: pieId_('PIECLS'), case_id: caseId, disease_code: '', classification_status: status, basis: 'OPERATIONAL_REVIEW', classified_at: now, classified_by: actor, notes: notes || '', created_at: now, created_by: actor });
  pieAppend_('PIE_CLASSIFICATION_HISTORY', { history_id: pieId_('PIECLSH'), case_id: caseId, disease_code: '', from_status: '', to_status: status, basis: 'OPERATIONAL_REVIEW', changed_at: now, changed_by: actor, notes: notes || '' });
  pieAppend_('PIE_AUDIT', { audit_id: pieId_('PIEAUD'), entity_type: 'PIE_CASE', entity_id: caseId, action: 'SET_CLASSIFICATION', actor: actor, occurred_at: now, summary: 'PIE case classification set to ' + status, after_json: JSON.stringify({ classification_status: status, notes: notes || '' }) });
  return { ok: true, status: 'success', data: { case_id: caseId, classification_status: status }, meta: { serverTime: now } };
}

function pieAcknowledgeAlert(token, alertId, notes) {
  const sess = _requirePieSession_(token, { roles: ['super-admin', 'admin', 'surveilans'] });
  alertId = String(alertId || '').trim();
  if (!alertId) throw new Error('alert_id kosong.');
  const now = pieNowIso_(), actor = pieActorFromSession_(sess);
  pieUpdateById_('PIE_ALERT', 'alert_id', alertId, { status: 'ACKNOWLEDGED', acknowledged_at: now, acknowledged_by: actor });
  pieAppend_('PIE_AUDIT', { audit_id: pieId_('PIEAUD'), entity_type: 'PIE_ALERT', entity_id: alertId, action: 'ACK_ALERT', actor: actor, occurred_at: now, summary: 'PIE alert acknowledged', after_json: JSON.stringify({ status: 'ACKNOWLEDGED', notes: notes || '' }) });
  return { ok: true, status: 'success', data: { alert_id: alertId, status: 'ACKNOWLEDGED' }, meta: { serverTime: now } };
}

function pieResolveAlert(token, alertId, notes) {
  const sess = _requirePieSession_(token, { roles: ['super-admin', 'admin', 'surveilans'] });
  alertId = String(alertId || '').trim();
  if (!alertId) throw new Error('alert_id kosong.');
  const now = pieNowIso_(), actor = pieActorFromSession_(sess);
  pieUpdateById_('PIE_ALERT', 'alert_id', alertId, { status: 'RESOLVED', resolved_at: now, resolution_code: 'DONE', resolution_notes: notes || '' });
  pieAppend_('PIE_AUDIT', { audit_id: pieId_('PIEAUD'), entity_type: 'PIE_ALERT', entity_id: alertId, action: 'RESOLVE_ALERT', actor: actor, occurred_at: now, summary: 'PIE alert resolved', after_json: JSON.stringify({ status: 'RESOLVED', notes: notes || '' }) });
  return { ok: true, status: 'success', data: { alert_id: alertId, status: 'RESOLVED' }, meta: { serverTime: now } };
}

function pieSetupTelegramConfig(token, config) {
  _requirePieSession_(token, { superAdminOnly: true });
  config = config || {};
  const saved = [];
  const props = PropertiesService.getScriptProperties();
  const bot = String(config.telegram_bot_token || '').trim();
  const pieChat = String(config.pie_telegram_chat_id || '').trim();
  const globalChat = String(config.telegram_chat_id || '').trim();
  const wahaEnabled = String(config.waha_enabled || '').trim();
  const wahaBaseUrl = String(config.waha_base_url || '').trim();
  const wahaApiKey = String(config.waha_api_key || '').trim();
  const wahaSession = String(config.waha_session || '').trim();
  const wahaDinkesChatId = String(config.waha_dinkes_chat_id || '').trim();
  if (bot) { props.setProperty('TELEGRAM_BOT_TOKEN', bot); saved.push('TELEGRAM_BOT_TOKEN'); }
  if (pieChat) { props.setProperty('PIE_TELEGRAM_CHAT_ID', pieChat); saved.push('PIE_TELEGRAM_CHAT_ID'); }
  if (globalChat) { props.setProperty('TELEGRAM_CHAT_ID', globalChat); saved.push('TELEGRAM_CHAT_ID'); }
  if (wahaEnabled) { props.setProperty('WAHA_ENABLED', wahaEnabled); saved.push('WAHA_ENABLED'); }
  if (wahaBaseUrl) { props.setProperty('WAHA_BASE_URL', wahaBaseUrl); saved.push('WAHA_BASE_URL'); }
  if (wahaApiKey) { props.setProperty('WAHA_API_KEY', wahaApiKey); saved.push('WAHA_API_KEY'); }
  if (wahaSession) { props.setProperty('WAHA_SESSION', wahaSession); saved.push('WAHA_SESSION'); }
  if (wahaDinkesChatId) { props.setProperty('WAHA_DINKES_CHAT_ID', wahaDinkesChatId); saved.push('WAHA_DINKES_CHAT_ID'); }
  return { ok: true, status: 'success', data: { saved: saved }, meta: { serverTime: pieNowIso_() } };
}

function pieSendTestNotification(token) {
  _requirePieSession_(token, { superAdminOnly: true });
  const target = String(Config_Manager.getConfig('PIE_TELEGRAM_CHAT_ID') || Config_Manager.getConfig('TELEGRAM_CHAT_ID') || '').trim();
  if (!target) return { ok: false, status: 'error', message: 'Target Telegram belum dikonfigurasi.' };
  if (typeof _sendTelegramText_ !== 'function') return { ok: false, status: 'error', message: 'Telegram sender tidak tersedia.' };
  const res = _sendTelegramText_(target, ['✅ *SARING-PIE test notification*', 'Konfigurasi Telegram aktif.', 'Waktu: ' + pieNowIso_()]);
  return { ok: !!res.sent, status: res.sent ? 'success' : 'error', data: { sent: !!res.sent, target_preview: target ? ('***' + target.slice(-4)) : '', reason: res.reason || '' }, meta: { serverTime: pieNowIso_() } };
}

function pieGetPd3iNotificationConfigStatus(token) {
  _requirePieSession_(token, { superAdminOnly: true });
  const out = {
    telegram_bot_token_configured: !!String(Config_Manager.getConfig('TELEGRAM_BOT_TOKEN') || '').trim(),
    dinkes_global_telegram_chat_id_configured: !!String(Config_Manager.getConfig('TELEGRAM_CHAT_ID') || '').trim(),
    waha_enabled: String(Config_Manager.getConfig('WAHA_ENABLED') || '').trim().toLowerCase() === 'true',
    waha_base_url_configured: !!String(Config_Manager.getConfig('WAHA_BASE_URL') || '').trim(),
    waha_api_key_configured: !!String(Config_Manager.getConfig('WAHA_API_KEY') || '').trim(),
    waha_session_configured: !!String(Config_Manager.getConfig('WAHA_SESSION') || '').trim(),
    waha_dinkes_chat_id_configured: !!String(Config_Manager.getConfig('WAHA_DINKES_CHAT_ID') || '').trim(),
    ref_pengampu_sheet_found: false,
    ref_pengampu_rows: 0,
    pengampu_with_petugas_email: 0,
    pengampu_with_kapus_email: 0,
    pengampu_with_telegram_chat_id: 0,
    pengampu_with_spreadsheet_id: 0,
    pengampu_with_waha_chat_id: 0,
    missing_headers: []
  };
  try {
    const sh = getSpreadsheet_().getSheetByName('REF_PENGAMPU');
    if (!sh) return { ok: true, data: out, meta: { serverTime: pieNowIso_() } };
    out.ref_pengampu_sheet_found = true;
    const headers = getTrimmedHeaders_(sh);
    const required = ['Email Petugas Pengampu', 'Email Kapus Pengampu', 'Telegram Chat Id Pengampu', 'SpreadsheetId Pengampu'];
    out.missing_headers = required.filter(function(h) { return headers.indexOf(h) === -1; });
    const idxPetugas = headers.indexOf('Email Petugas Pengampu');
    const idxKapus = headers.indexOf('Email Kapus Pengampu');
    const idxTelegram = headers.indexOf('Telegram Chat Id Pengampu');
    const idxSpreadsheet = headers.indexOf('SpreadsheetId Pengampu');
    const idxWaha = headers.indexOf('WAHA Chat Id Pengampu') !== -1 ? headers.indexOf('WAHA Chat Id Pengampu') : (headers.indexOf('WhatsApp Chat Id Pengampu') !== -1 ? headers.indexOf('WhatsApp Chat Id Pengampu') : headers.indexOf('Whatsapp Chat Id Pengampu')); 
    const lastRow = sh.getLastRow();
    if (lastRow < 2) return { ok: true, data: out, meta: { serverTime: pieNowIso_() } };
    const values = sh.getRange(2, 1, lastRow - 1, headers.length).getValues();
    values.forEach(function(row) {
      if (!row.some(function(v) { return String(v || '').trim(); })) return;
      out.ref_pengampu_rows++;
      if (idxPetugas !== -1 && String(row[idxPetugas] || '').trim()) out.pengampu_with_petugas_email++;
      if (idxKapus !== -1 && String(row[idxKapus] || '').trim()) out.pengampu_with_kapus_email++;
      if (idxTelegram !== -1 && String(row[idxTelegram] || '').trim()) out.pengampu_with_telegram_chat_id++;
      if (idxSpreadsheet !== -1 && String(row[idxSpreadsheet] || '').trim()) out.pengampu_with_spreadsheet_id++;
      if (idxWaha !== -1 && String(row[idxWaha] || '').trim()) out.pengampu_with_waha_chat_id++;
    });
  } catch (e) {
    out.error = String((e && e.message) || e);
  }
  return { ok: true, data: out, meta: { serverTime: pieNowIso_() } };
}

function pieGetNotificationConfigStatus(token) {
  _requirePieSession_(token, { superAdminOnly: true });
  const bot = String(Config_Manager.getConfig('TELEGRAM_BOT_TOKEN') || '').trim();
  const pieTarget = String(Config_Manager.getConfig('PIE_TELEGRAM_CHAT_ID') || '').trim();
  const globalTarget = String(Config_Manager.getConfig('TELEGRAM_CHAT_ID') || '').trim();
  const effectiveTarget = pieTarget || globalTarget;
  return { ok: true, data: { telegram_bot_token_configured: !!bot, pie_telegram_chat_id_configured: !!pieTarget, telegram_chat_id_configured: !!globalTarget, effective_target_configured: !!effectiveTarget, effective_target_source: pieTarget ? 'PIE_TELEGRAM_CHAT_ID' : (globalTarget ? 'TELEGRAM_CHAT_ID' : ''), effective_target_preview: effectiveTarget ? ('***' + effectiveTarget.slice(-4)) : '' }, meta: { serverTime: pieNowIso_() } };
}

function pieEvaluateScreeningPayload(token, payload) {
  _requirePieSession_(token);
  payload = payload || {};
  const facts = pieFactsFromPayload_(payload);
  const result = pieEvaluateFacts_(facts);
  const validation = pieValidatePayload_(payload, facts, result);
  result.validation = validation;
  return { ok: validation.errors.length === 0, data: result, message: validation.errors.join(' '), meta: { appVersion: PIE_CONFIG.APP_VERSION, ruleSetVersion: PIE_CONFIG.RULE_SET_VERSION, serverTime: pieNowIso_() } };
}
