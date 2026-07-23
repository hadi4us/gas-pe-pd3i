function getPieSchema_() {
  return {
    PIE_KB_RULE_SET: ['rule_set_version','status','effective_from','effective_to','engine_version','description','created_at','created_by'],
    PIE_KB_RULE: ['rule_id','rule_set_version','rule_version','disease_code','rule_type','minimum_epi_risk','priority','hard_trigger','required_facts','optional_facts','exclusion_facts','recommended_actions','specimen_guidance','explanation_template','active'],
    PIE_KB_ACTION: ['action_code','action_type','label','description','default_due_hours','owner_role','active'],
    PIE_CASE: ['case_id','human_case_number','patient_id','primary_encounter_id','case_status','current_epi_risk','current_clinical_acuity','primary_syndrome_code','lead_candidate_disease_code','classification_status','notification_status','owner_user_id','owner_faskes_key','dinkes_owner','opened_at','closed_at','rule_set_version_at_open','data_sensitivity_level','row_version','created_at','created_by','updated_at','updated_by'],
    PIE_PATIENT_LINK: ['patient_id','nik_hash','nik_masked','medical_record_number','name','date_of_birth','sex','phone_masked','address','province_code','city_code','district_code','village_code','latitude','longitude','identity_source','consent_or_legal_basis_code','created_at','created_by','updated_at','updated_by'],
    PIE_ENCOUNTER: ['encounter_id','case_id','patient_id','faskes_key','service_unit','encounter_type','arrival_at','screening_started_at','screening_completed_at','clinician_reviewed_at','disposition','referral_faskes','source_system','source_encounter_id','created_at','created_by','updated_at','updated_by'],
    PIE_SCREENING: ['screening_id','encounter_id','case_id','screening_type','screening_version','status','clinical_acuity','epi_risk','universal_screen_positive','critical_missing_data','screening_completed_by','screening_completed_at','rule_set_version','evaluation_fingerprint','last_evaluated_at','created_at','created_by','updated_at','updated_by'],
    PIE_ANSWER: ['answer_id','screening_id','question_code','answer_type','answer_boolean','answer_number','answer_text','answer_date','answer_datetime','answer_code','unit','source','entered_by','entered_at'],
    PIE_SYNDROME: ['syndrome_id','screening_id','syndrome_code','severity_code','onset_date','evidence_quality','created_at','created_by'],
    PIE_SYMPTOM: ['symptom_id','screening_id','symptom_code','present','severity_code','onset_date','notes','created_at','created_by'],
    PIE_EXPOSURE_EVENT: ['exposure_id','screening_id','exposure_type_code','animal_code','animal_condition','contact_mode_code','exposure_start_at','exposure_end_at','ppe_used','skin_or_mucosa_exposed','evidence_quality','notes','created_at','created_by'],
    PIE_TRAVEL_EVENT: ['travel_id','screening_id','location_text','province_code','city_code','district_code','start_at','end_at','purpose_code','evidence_quality','notes','created_at','created_by'],
    PIE_CONTACT_EVENT: ['contact_id','screening_id','contact_type_code','setting_code','contact_date','known_case_identifier','ppe_used','evidence_quality','notes','created_at','created_by'],
    PIE_PE_FORM: ['pe_form_id','case_id','screening_id','template_code','disease_code','status','prefill_json','investigation_json','created_at','created_by','updated_at','updated_by'],
    PIE_RULE_RESULT: ['rule_result_id','screening_id','rule_id','rule_version','disease_code','matched','hard_trigger','candidate_score','minimum_epi_risk','matched_facts','unmatched_critical_facts','explanation','evaluated_at','engine_version','input_hash'],
    PIE_ALERT: ['alert_id','case_id','screening_id','alert_type','severity','status','triggered_by_rule_id','triggered_at','acknowledged_at','acknowledged_by','assigned_to','due_at','escalated_at','resolved_at','resolution_code','resolution_notes','idempotency_key'],
    PIE_NOTIFICATION: ['notification_id','case_id','alert_id','screening_id','channel','target','status','reason','sent_at','message','idempotency_key','created_at','created_by'],
    PIE_ACTION_TASK: ['task_id','case_id','screening_id','action_code','label','status','owner_role','assigned_to','due_at','completed_at','completed_by','notes','created_at','created_by','updated_at','updated_by'],
    PIE_SPECIMEN: ['specimen_id','case_id','screening_id','specimen_type_code','collection_at','collector','status','shipment_at','destination_lab','chain_of_custody_ref','notes','created_at','created_by','updated_at','updated_by'],
    PIE_LAB_RESULT: ['lab_result_id','case_id','specimen_id','test_code','result_code','result_text','result_at','verified_by','verified_at','attachment_ref','created_at','created_by'],
    PIE_CLASSIFICATION: ['classification_id','case_id','screening_id','disease_code','classification_status','basis','classified_at','classified_by','notes','created_at','created_by'],
    PIE_CLASSIFICATION_HISTORY: ['history_id','case_id','screening_id','disease_code','from_status','to_status','basis','changed_at','changed_by','notes'],
    PIE_CLUSTER_LINK: ['cluster_link_id','case_id','cluster_id','relationship_code','evidence_quality','created_at','created_by'],
    PIE_ONEHEALTH_SIGNAL: ['signal_id','case_id','screening_id','signal_type_code','species_or_environment','location_text','event_at','source_agency','summary','created_at','created_by'],
    PIE_DAILY_METRIC: ['metric_date','metric_key','metric_value','dimension_json','calculated_at'],
    PIE_VALIDATION_METRIC: ['metric_id','validation_type','metric_key','metric_value','dimension_json','period_start','period_end','calculated_at','created_by'],
    PIE_ARCHIVE_CASE: ['archive_id','case_id','archive_reason','archived_at','archived_by','case_json'],
    REF_USER_PERMISSION: ['permission_id','user_key','module','permission_code','scope_level','scope_value','active','created_at','created_by'],
    REF_PIE_DISEASE: ['disease_code','disease_name','disease_group','active'],
    REF_PIE_QUESTION: ['question_code','question_group','label','answer_type','required','active'],
    PIE_AUDIT: ['audit_id','entity_type','entity_id','action','actor','occurred_at','summary','before_json','after_json']
  };
}

function setupPieSheets(token) {
  const sess = _requirePieSession_(token, { superAdminOnly: true });
  const ss = getSpreadsheet_();
  const schema = getPieSchema_();
  Object.keys(schema).forEach(function(name) {
    let sh = ss.getSheetByName(name);
    if (!sh) {
      try { sh = ss.insertSheet(name); }
      catch (e) { sh = ss.getSheetByName(name); if (!sh) throw e; }
    }
    const headers = schema[name];
    if (sh.getLastRow() < 1) {
      sh.getRange(1, 1, 1, headers.length).setValues([headers]);
      sh.setFrozenRows(1);
    } else {
      const existing = getTrimmedHeaders_(sh);
      const missing = headers.filter(function(h) { return existing.indexOf(h) === -1; });
      if (missing.length) sh.getRange(1, existing.length + 1, 1, missing.length).setValues([missing]);
    }
  });
  seedPieKnowledgeBase_(sess.user);
  return { ok: true, status: 'success', message: 'SARING-PIE schema + KB MVP siap.', sheets: Object.keys(schema) };
}

function seedPieKnowledgeBase_(user) {
  const now = pieNowIso_();
  const actor = String((user && (user.username || user.email || user.name)) || pieUserEmail_() || 'system');
  const rules = pieGetRuleDefinitions_();
  pieUpsertByKey_('PIE_KB_RULE_SET', 'rule_set_version', {
    rule_set_version: PIE_CONFIG.RULE_SET_VERSION,
    status: 'ACTIVE',
    effective_from: now.slice(0, 10),
    engine_version: PIE_CONFIG.APP_VERSION,
    description: 'MVP SARING-PIE rule set: emerging/zoonosis hard-trigger screening.',
    created_at: now,
    created_by: actor
  });
  rules.forEach(function(rule) {
    pieUpsertByKey_('PIE_KB_RULE', 'rule_id', Object.assign({}, rule, {
      rule_set_version: PIE_CONFIG.RULE_SET_VERSION,
      rule_version: PIE_CONFIG.RULE_SET_VERSION,
      required_facts: JSON.stringify(rule.required_facts || []),
      optional_facts: JSON.stringify(rule.optional_facts || []),
      exclusion_facts: JSON.stringify(rule.exclusion_facts || []),
      recommended_actions: JSON.stringify(rule.recommended_actions || []),
      active: true
    }));
  });
  pieGetActionDefinitions_().forEach(function(action) {
    pieUpsertByKey_('PIE_KB_ACTION', 'action_code', Object.assign({}, action, { active: true }));
  });
}
