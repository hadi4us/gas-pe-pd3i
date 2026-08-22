const TELEGRAM_REF_USER_HEADERS_ = [
  'OtpChannel', 'OtpFallbackChannel', 'NotificationChannel',
  'TelegramChatId', 'TelegramUsername', 'TelegramVerifiedAt', 'TelegramStatus'
];

function _maskOperationalName_(value) {
  const raw = String(value || '').trim().replace(/\s+/g, ' ');
  if (!raw) return '';
  return raw.split(' ').map(function(part) {
    const chars = Array.from(String(part || ''));
    if (chars.length <= 1) return chars[0] ? chars[0] + '***' : '';
    if (chars.length <= 3) return chars[0] + '***' + chars[chars.length - 1];
    return chars[0] + chars[1] + chars[2] + '***' + chars[chars.length - 1];
  }).join(' ');
}

function _operationalEventTitle_(eventType) {
  const key = String(eventType || '').trim().toUpperCase();
  const map = {
    PERMOHONAN_AKUN_BARU: 'Permohonan akun baru',
    KASUS_PD3I_BARU: 'Kasus PD3I baru perlu ditinjau',
    KASUS_PERLU_VERIFIKASI: 'Kasus menunggu verifikasi',
    KASUS_BARU_MASUK: 'Kasus baru masuk',
    INPUT_PIE_BARU: 'Input SARING-PIE baru',
    ZERO_REPORTING_BARU: 'Laporan Zero Reporting baru'
  };
  return map[key] || String(eventType || 'Notifikasi SIMPEL Surveilans').replace(/_/g, ' ').toLowerCase().replace(/(^|\s)\S/g, function(ch) { return ch.toUpperCase(); });
}

function _operationalWorkspaceLabel_(value) {
  const key = String(value || '').trim().toLowerCase();
  const map = {
    'admin-akun': 'Pengaturan → Permohonan akun',
    'verifikasi': 'Verifikasi EPID',
    'zero-reporting': 'Zero Reporting',
    'saring-pie': 'SARING-PIE',
    'search': 'Daftar Kasus',
    'edit': 'Daftar Kasus → Edit kasus',
    'sampel': 'Hasil pemeriksaan',
    'status': 'Update status pemantauan'
  };
  return map[key] || String(value || '').trim();
}

function _operationalStatusLabel_(value) {
  const key = String(value || '').trim().toUpperCase();
  const map = {
    PENDING: 'Menunggu tindak lanjut',
    MENUNGGU: 'Menunggu tindak lanjut',
    BARU: 'Baru masuk',
    OPEN: 'Perlu ditindaklanjuti'
  };
  return map[key] || String(value || '').trim();
}

function _pushOperationalLine_(lines, label, value) {
  if (value === undefined || value === null) return;
  const text = String(value).trim();
  if (!text) return;
  lines.push(label + ': ' + text.slice(0, 160));
}

function _buildOperationalNotificationLines_(eventType, details) {
  details = details || {};
  const title = _operationalEventTitle_(eventType);
  const action = String(details.action || '').trim();
  const workspace = _operationalWorkspaceLabel_(details.workspace);
  const status = _operationalStatusLabel_(details.status);
  const rawNamaPasien = String(details.namaPasien || details.nama || details['Nama'] || details['Nama Pasien'] || '').trim();
  const maskedNamaPasien = rawNamaPasien ? _maskOperationalName_(rawNamaPasien) : '';
  const lines = ['SIMPEL Surveilans — ' + title, 'Ada tugas baru yang perlu dicek admin.'];

  _pushOperationalLine_(lines, 'Kode', details.caseCode || details.epid || details.requestId || details.id);
  _pushOperationalLine_(lines, 'Diagnosis', details.diagnosisCode);
  _pushOperationalLine_(lines, 'Nama pemohon', details.namaPemohon);
  _pushOperationalLine_(lines, 'Asal pemohon', details.asalPemohon);
  _pushOperationalLine_(lines, 'Nama pasien', maskedNamaPasien);
  _pushOperationalLine_(lines, 'Asal faskes', details.asalFaskes);
  _pushOperationalLine_(lines, 'Nama faskes pelapor', details.namaFasyankes || details.namaFaskes || details.namaFaskesPelapor);
  _pushOperationalLine_(lines, 'Puskesmas pengampu', details.pengampu);
  _pushOperationalLine_(lines, 'Jumlah data', details.count);
  _pushOperationalLine_(lines, 'Status', status);
  _pushOperationalLine_(lines, 'Tenggat', details.dueAt);
  _pushOperationalLine_(lines, 'Tugas admin', action);
  _pushOperationalLine_(lines, 'Menu SIMPEL Surveilans', workspace);

  lines.push('', 'Silakan buka SIMPEL Surveilans untuk meninjau dan memproses tugas ini.');
  if (maskedNamaPasien) lines.push('Identitas pasien di notifikasi sudah dibatasi. Detail lengkap hanya tersedia di SIMPEL Surveilans.');
  return lines;
}

function _sendOperationalEmailNotification_(email, eventType, details, reason) {
  email = _normalizeGmail_(email);
  if (!email) return { sent: false, channel: 'email', reason: 'NO_EMAIL' };
  try {
    const lines = _buildOperationalNotificationLines_(eventType, details);
    if (reason) lines.push('', 'Catatan kanal: ' + String(reason).slice(0, 160));
    MailApp.sendEmail({
      to: email,
      subject: 'SIMPEL Surveilans — ' + String(eventType || 'Notifikasi operasional'),
      body: lines.join('\n'),
      name: 'Jarvis Surveilans PD3I'
    });
    return { sent: true, channel: 'email', target: email, eventType: eventType || '', reason: reason || '' };
  } catch (e) {
    return { sent: false, channel: 'email', target: email, reason: String((e && e.message) || e) };
  }
}

/** Operational notification. Never include patient identifiers or clinical detail. */
function sendOperationalTelegramNotification(email, eventType, details) {
  email = _normalizeGmail_(email);
  const found = _findUserByEmail_(email);
  if (!found.user) return { sent: false, reason: found.error || 'USER_NOT_FOUND' };
  const user = found.user;
  const channel = String(user.notificationChannel || 'email').toLowerCase();
  if (channel === 'none') return { sent: false, reason: 'CHANNEL_DISABLED' };
  if (channel === 'email') return _sendOperationalEmailNotification_(email, eventType, details, 'EMAIL_SELECTED');

  const canTelegram = !!(user.telegramChatId && user.telegramStatus === 'ACTIVE');
  if (!canTelegram) return _sendOperationalEmailNotification_(email, eventType, details, 'TELEGRAM_NOT_PAIRED');

  const lines = _buildOperationalNotificationLines_(eventType, details);
  lines[0] = '🔔 ' + lines[0];
  try {
    _telegramApi_('sendMessage', { chat_id: user.telegramChatId, text: lines.join('\n') });
    if (channel === 'both') {
      const emailResult = _sendOperationalEmailNotification_(email, eventType, details, 'BOTH_CHANNELS');
      return { sent: true, channel: 'both', target: user.telegramChatId, email: emailResult, eventType: eventType || '' };
    }
    return { sent: true, channel: 'telegram', target: user.telegramChatId, eventType: eventType || '' };
  } catch (e) {
    return _sendOperationalEmailNotification_(email, eventType, details, 'TELEGRAM_SEND_FAILED: ' + String((e && e.message) || e));
  }
}

function _operationalTelegramIdempotencyKey_(email, eventType, caseCode) {
  const raw = [_normalizeGmail_(email), String(eventType || '').trim().toUpperCase(), String(caseCode || '').trim()].join('|');
  const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, raw, Utilities.Charset.UTF_8);
  return digest.map(function(b) { return (b < 0 ? b + 256 : b).toString(16).padStart(2, '0'); }).join('');
}

function sendOperationalTelegramNotificationOnce(email, eventType, details) {
  details = details || {};
  const key = _operationalTelegramIdempotencyKey_(email, eventType, details.caseCode || details.epid);
  const cache = CacheService.getScriptCache();
  if (cache.get('TG_OPS_' + key)) return { sent: false, reason: 'DUPLICATE_SKIPPED', idempotencyKey: key };
  const rateKey = 'TG_RATE_' + _normalizeGmail_(email);
  if (cache.get(rateKey)) return { sent: false, reason: 'RATE_LIMITED', idempotencyKey: key };
  const result = sendOperationalTelegramNotification(email, eventType, details);
  if (result.sent) {
    cache.put('TG_OPS_' + key, 'SENT', 21600);
    cache.put(rateKey, '1', 30);
  }
  result.idempotencyKey = key;
  return result;
}

function sendOperationalTelegramNotificationsOnce(emails, eventType, details) {
  const seen = {};
  return (emails || []).map(function(email) {
    email = _normalizeGmail_(email);
    if (!email || seen[email]) return null;
    seen[email] = true;
    return sendOperationalTelegramNotificationOnce(email, eventType, details);
  }).filter(Boolean);
}

function getAdminOperationalNotificationEmails_() {
  try {
    const sh = getSheetOrNull_('REF_USER');
    if (!sh) return [];
    const values = sh.getDataRange().getValues();
    if (!values || values.length < 2) return [];
    const headers = values[0].map(function(h) { return String(h || '').trim(); });
    const idxEmail = _headerIndexCI_(headers, ['Email', 'Gmail', 'EmailPetugas']);
    const idxRole = _headerIndexCI_(headers, ['Role', 'role']);
    const idxAktif = _headerIndexCI_(headers, ['Aktif', 'StatusAktif', 'status']);
    if (idxEmail === undefined || idxRole === -1) return [];
    const seen = {};
    return values.slice(1).map(function(row) {
      const role = String(row[idxRole] || '').trim().toLowerCase().replace(/[_\s]+/g, '-');
      const isAdmin = role === 'admin' || role === 'super-admin' || role === 'superadmin';
      if (!isAdmin) return '';
      if (idxAktif !== undefined) {
        const aktif = String(row[idxAktif] || '').trim().toUpperCase();
        if (aktif && ['YA', 'AKTIF', 'TRUE', '1'].indexOf(aktif) === -1) return '';
      }
      const email = _normalizeGmail_(row[idxEmail]);
      if (!email || seen[email]) return '';
      seen[email] = true;
      return email;
    }).filter(Boolean);
  } catch (e) { return []; }
}

function sendAdminOperationalTelegramNotificationsOnce(eventType, details) {
  return sendOperationalTelegramNotificationsOnce(getAdminOperationalNotificationEmails_(), eventType, details || {});
}

function _isOperationalWahaEnabled_() {
  try {
    return String(Config_Manager.getConfig('WAHA_ENABLED') || '').trim().toLowerCase() === 'true';
  } catch (e) { return false; }
}

function _sendOperationalWahaText_(chatId, lines) {
  if (!_isOperationalWahaEnabled_()) return { sent: false, reason: 'WAHA_DISABLED' };
  const baseUrl = (typeof _currentWahaBaseUrl_ === 'function')
    ? _currentWahaBaseUrl_(Config_Manager.getConfig('WAHA_BASE_URL'))
    : String(Config_Manager.getConfig('WAHA_BASE_URL') || '').trim().replace(/\/+$/, '');
  const apiKey = String(Config_Manager.getConfig('WAHA_API_KEY') || '').trim();
  const session = String(Config_Manager.getConfig('WAHA_SESSION') || 'default').trim() || 'default';
  // Admin operational alerts must use notification group, not WAHA account's own chat.
  // Keep Script Properties override, but recover from stale/missing target after WAHA reset.
  const configuredTarget = String(chatId || Config_Manager.getConfig('WAHA_DINKES_CHAT_ID') || '').trim();
  const target = /@g\.us$/i.test(configuredTarget) ? configuredTarget : '120363404877183787@g.us';
  if (!baseUrl) return { sent: false, reason: 'WAHA_BASE_URL_NOT_CONFIGURED' };
  if (!apiKey) return { sent: false, reason: 'WAHA_API_KEY_NOT_CONFIGURED' };
  if (!target) return { sent: false, reason: 'WAHA_TARGET_NOT_CONFIGURED' };
  try {
    const res = UrlFetchApp.fetch(baseUrl + '/api/sendText', {
      method: 'post',
      contentType: 'application/json',
      headers: { 'X-Api-Key': apiKey },
      payload: JSON.stringify({ session: session, chatId: target, text: (lines || []).join('\n') }),
      muteHttpExceptions: true
    });
    const code = res.getResponseCode();
    const body = String(res.getContentText() || '');
    if (code >= 200 && code < 300) return { sent: true, target: target, responseCode: code };
    return { sent: false, target: target, reason: 'HTTP_' + code + ': ' + body.slice(0, 300) };
  } catch (e) {
    return { sent: false, target: target, reason: String((e && e.message) || e) };
  }
}

function _operationalWahaIdempotencyKey_(eventType, caseCode) {
  const raw = ['WAHA_ADMIN', String(eventType || '').trim().toUpperCase(), String(caseCode || '').trim()].join('|');
  const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, raw, Utilities.Charset.UTF_8);
  return digest.map(function(b) { return (b < 0 ? b + 256 : b).toString(16).padStart(2, '0'); }).join('');
}

function sendAdminOperationalWahaNotificationOnce(eventType, details) {
  details = details || {};
  const key = _operationalWahaIdempotencyKey_(eventType, details.caseCode || details.epid || details.requestId || details.id);
  const cache = CacheService.getScriptCache();
  if (cache.get('WAHA_OPS_' + key)) return { sent: false, reason: 'DUPLICATE_SKIPPED', idempotencyKey: key };
  const lines = _buildOperationalNotificationLines_(eventType, details);
  lines[0] = '🔔 ' + lines[0];
  const result = _sendOperationalWahaText_(Config_Manager.getConfig('WAHA_DINKES_CHAT_ID'), lines);
  if (result.sent) cache.put('WAHA_OPS_' + key, 'SENT', 21600);
  result.idempotencyKey = key;
  result.eventType = eventType || '';
  return result;
}
function getCaseCreatedOperationalNotificationEmails_(data) {
  data = data || {};
  const directEmails = [
    data['Email Petugas'],
    data['Email Pelapor'],
    data['Email'],
    data['Gmail'],
    data['Email Petugas Pengampu'],
    data['Email Kapus Pengampu'],
    data.__user && data.__user.email,
    data.__user && data.__user.gmail,
    data.__user && data.__user.username
  ];
  const kodeFaskes = String(data['KodeFaskes'] || data['Kode Puskesmas'] || data['KodePuskesmas'] || '').trim();
  const kodePengampu = String(data['KodeFaskes Pengampu'] || data['KodePuskesmas Pengampu'] || '').trim();
  const namaFaskes = String(data['NamaFaskes'] || data['Nama Faskes'] || data['UnitKerja'] || data['Puskesmas'] || '').trim();
  const namaPengampu = String(data['Puskesmas Pengampu'] || data['Pengampu'] || '').trim();
  const wantedCodes = {};
  [kodeFaskes, kodePengampu].forEach(function(v) { if (v) wantedCodes[v.toUpperCase()] = true; });
  const wantedNames = {};
  [namaFaskes, namaPengampu].forEach(function(v) { if (v) wantedNames[v.toUpperCase()] = true; });

  const out = _collectOperationalEmailValues_(directEmails);
  try {
    const sh = getSheetOrNull_('REF_USER');
    if (!sh) return out;
    const values = sh.getDataRange().getValues();
    if (!values || values.length < 2) return out;
    const headers = values[0].map(function(h) { return String(h || '').trim(); });
    function ix(names) {
      for (var i = 0; i < names.length; i++) {
        const found = headers.indexOf(names[i]);
        if (found !== -1) return found;
      }
      return -1;
    }
    const idxEmail = ix(['Email', 'Gmail', 'EmailPetugas']);
    const idxRole = ix(['Role']);
    const idxAktif = ix(['Aktif', 'StatusAktif']);
    const idxKode = ix(['KodeFaskes', 'Kode Faskes', 'KodePuskesmas', 'Kode Puskesmas', 'Kode PKM']);
    const idxFaskes = ix(['NamaFaskes', 'Nama Faskes', 'Nama Fasyankes', 'Faskes', 'UnitKerja', 'Unit Kerja', 'Puskesmas']);
    if (idxEmail === -1) return out;
    values.slice(1).forEach(function(row) {
      if (idxAktif !== -1) {
        const aktif = String(row[idxAktif] || '').trim().toUpperCase();
        if (aktif && ['YA', 'AKTIF', 'TRUE', '1'].indexOf(aktif) === -1) return;
      }
      const role = idxRole !== -1 ? String(row[idxRole] || '').trim().toLowerCase().replace(/[_\s]+/g, '-') : '';
      const isAdmin = role === 'admin' || role === 'super-admin' || role === 'superadmin';
      const rowKode = idxKode !== -1 ? String(row[idxKode] || '').trim().toUpperCase() : '';
      const rowFaskes = idxFaskes !== -1 ? String(row[idxFaskes] || '').trim().toUpperCase() : '';
      const isFacilityTarget = (rowKode && wantedCodes[rowKode]) || (rowFaskes && wantedNames[rowFaskes]);
      if (isAdmin || isFacilityTarget) out.push(row[idxEmail]);
    });
  } catch (e) {}
  const seen = {};
  return out.map(_normalizeGmail_).filter(function(email) {
    if (!email || seen[email]) return false;
    seen[email] = true;
    return true;
  });
}

function _collectOperationalEmailValues_(values) {
  const out = [];
  (values || []).forEach(function(v) {
    String(v || '').split(/[;,]/).forEach(function(x) {
      x = _normalizeGmail_(x);
      if (x) out.push(x);
    });
  });
  return out;
}

function sendCaseCreatedOperationalTelegramNotificationsOnce(data, details) {
  return sendOperationalTelegramNotificationsOnce(getCaseCreatedOperationalNotificationEmails_(data || {}), 'KASUS_BARU_MASUK', details || {});
}


function migrateRefUserTelegramColumns() {
  return ensureRefUserTelegramColumns();
}

function _telegramToken_() {
  return String(PropertiesService.getScriptProperties().getProperty('TELEGRAM_BOT_TOKEN') || '').trim();
}

const TELEGRAM_LOG_HEADERS_ = Object.freeze(['Timestamp','Direction','Method','UpdateId','ChatId','Username','Text','Status','Reason','TokenPreview','PayloadJson','ResponseJson']);
function _telegramLogSheet_(){
  const ss=getSpreadsheet_(); let sh=ss.getSheetByName('TELEGRAM_LOG'); if(!sh)sh=ss.insertSheet('TELEGRAM_LOG');
  const last=Math.max(1,sh.getLastColumn()); const h=sh.getRange(1,1,1,last).getDisplayValues()[0].map(function(v){return String(v||'').trim();});
  if(!h.some(function(x){return x;})) sh.getRange(1,1,1,TELEGRAM_LOG_HEADERS_.length).setValues([TELEGRAM_LOG_HEADERS_]);
  else TELEGRAM_LOG_HEADERS_.filter(function(x){return h.indexOf(x)<0;}).forEach(function(x){sh.getRange(1,sh.getLastColumn()+1).setValue(x);});
  sh.setFrozenRows(1); return sh;
}
function _telegramTokenPreview_(text){ const m=String(text||'').match(/^\/start\s+(.+)$/i); if(!m)return ''; const t=String(m[1]||''); return t ? (t.slice(0,6)+'…'+t.slice(-4)) : ''; }
function _telegramSafeJson_(v){ try{return JSON.stringify(v||{}).slice(0,3000);}catch(e){return String(v||'').slice(0,3000);} }
function _logTelegramEvent_(entry){
  try{
    entry=entry||{}; const sh=_telegramLogSheet_(), h=sh.getRange(1,1,1,sh.getLastColumn()).getDisplayValues()[0].map(function(v){return String(v||'').trim();});
    const row=h.map(function(k){ return ({Timestamp:new Date(),Direction:entry.direction||'',Method:entry.method||'',UpdateId:entry.updateId||'',ChatId:entry.chatId||'',Username:entry.username||'',Text:String(entry.text||'').slice(0,1000),Status:entry.status||'',Reason:entry.reason||'',TokenPreview:entry.tokenPreview||_telegramTokenPreview_(entry.text),PayloadJson:entry.payloadJson||'',ResponseJson:entry.responseJson||''}[k]||''); });
    sh.appendRow(row);
  }catch(e){ try{console.error('Telegram log failed', e);}catch(_e){} }
}
function _telegramRecentLogMatch_(criteria) {
  try {
    criteria = criteria || {};
    const sh = _telegramLogSheet_();
    const lastRow = sh.getLastRow();
    if (lastRow < 2) return false;
    const h = sh.getRange(1, 1, 1, sh.getLastColumn()).getDisplayValues()[0].map(function(v){ return String(v || '').trim(); });
    const ix = {}; h.forEach(function(k, i){ ix[k] = i; });
    const take = Math.min(500, lastRow - 1);
    const rows = sh.getRange(lastRow - take + 1, 1, take, h.length).getDisplayValues();
    for (var i = rows.length - 1; i >= 0; i--) {
      const row = rows[i];
      if (criteria.updateId && String(row[ix.UpdateId] || '') === String(criteria.updateId)) return true;
      if (criteria.chatId && String(row[ix.ChatId] || '') !== String(criteria.chatId)) continue;
      if (criteria.tokenPreview && String(row[ix.TokenPreview] || '') !== String(criteria.tokenPreview)) continue;
      if (criteria.statuses && criteria.statuses.indexOf(String(row[ix.Status] || '')) === -1) continue;
      if (criteria.chatId || criteria.tokenPreview || criteria.statuses) return true;
    }
  } catch (e) { try { console.error('Telegram recent log match failed', e); } catch (_e) {} }
  return false;
}

function _telegramApi_(method, payload) {
  const token = _telegramToken_();
  if (!token) throw new Error('TELEGRAM_BOT_TOKEN belum diatur.');
  payload = payload || {};
  const logEntry = {direction:'OUT', method:method, chatId:payload.chat_id||'', text:payload.text||'', payloadJson:_telegramSafeJson_(payload)};
  try {
    const res = UrlFetchApp.fetch('https://api.telegram.org/bot' + token + '/' + method, {
      method: 'post', contentType: 'application/json', payload: JSON.stringify(payload), muteHttpExceptions: true
    });
    const body = JSON.parse(res.getContentText() || '{}');
    logEntry.status = body.ok ? 'success' : 'error';
    logEntry.reason = body.ok ? '' : String(body.description || res.getResponseCode());
    logEntry.responseJson = _telegramSafeJson_(body);
    _logTelegramEvent_(logEntry);
    if (!body.ok) throw new Error('Telegram API gagal: ' + String(body.description || res.getResponseCode()));
    return body.result;
  } catch (e) {
    logEntry.status = 'exception'; logEntry.reason = String((e && e.message) || e);
    _logTelegramEvent_(logEntry);
    throw e;
  }
}

function getTelegramWebhookInfo() {
  const info = _telegramApi_('getWebhookInfo', {});
  return {
    url: String(info.url || ''),
    pendingUpdateCount: Number(info.pending_update_count || 0),
    lastErrorDate: info.last_error_date || null,
    lastErrorMessage: String(info.last_error_message || ''),
    maxConnections: info.max_connections || null
  };
}

function ensureProductionTelegramWebhook() {
  const target = 'https://script.google.com/macros/s/AKfycbzWfWu1LsZGhqPAVKuS6GBp5Z_3eRv1cKlKLD6Xgfvq1hhWr1HCQVIRW6ilvNO0QOzEJA/exec';
  const before = getTelegramWebhookInfo();
  let changed = false;
  if (before.url !== target) {
    _telegramApi_('setWebhook', { url: target, drop_pending_updates: false });
    changed = true;
  }
  return { changed: changed, target: target, before: before, after: getTelegramWebhookInfo() };
}

function ensureRefUserTelegramColumns() {
  const sh = getSheetOrNull_('REF_USER');
  if (!sh) throw new Error('Sheet REF_USER tidak ditemukan.');
  const last = Math.max(1, sh.getLastColumn());
  const headers = sh.getRange(1, 1, 1, last).getValues()[0].map(function(v) { return String(v || '').trim(); });
  const missing = TELEGRAM_REF_USER_HEADERS_.filter(function(h) { return headers.indexOf(h) === -1; });
  if (missing.length) sh.getRange(1, headers.length + 1, 1, missing.length).setValues([missing]);
  return { added: missing, headers: headers.concat(missing) };
}

function createTelegramPairing(email) {
  email = _normalizeGmail_(email);
  const found = _findUserByEmail_(email);
  if (!found.user) throw new Error(found.error || 'Email belum terdaftar.');
  ensureRefUserTelegramColumns();
  const token = Utilities.getUuid().replace(/-/g, '');
  CacheService.getScriptCache().put('TG_PAIR_' + token, email, 21600);
  const bot = _telegramApi_('getMe', {});
  return { status: 'success', url: 'https://t.me/' + bot.username + '?start=' + token, expiresSec: 21600 };
}

function requestTelegramPairing(email) {
  email = _normalizeGmail_(email);
  const found = _findUserByEmail_(email);
  if (!found.user) return { status: 'error', message: found.error || 'Email belum terdaftar.' };
  if (found.user.telegramChatId && found.user.telegramStatus === 'ACTIVE') return { status: 'paired' };
  const pairing = createTelegramPairing(email);
  return { status: 'pairing_required', url: pairing.url, expiresSec: pairing.expiresSec };
}

function createTelegramPairingForSession(token, email) {
  const session = authCheck(token);
  if (!session || !session.user) throw new Error('Sesi tidak valid.');
  const role = String(session.user.role || '').toLowerCase();
  if (!['super-admin', 'super_admin', 'admin'].includes(role)) throw new Error('Hanya admin yang boleh membuat link pairing.');
  return createTelegramPairing(email || session.user.email);
}

function _handleTelegramUpdate_(update) {
  const updateId = String(update && update.update_id || '').trim();
  const updateCache = CacheService.getScriptCache();
  const msg = update && update.message;
  const text = String(msg && msg.text || '').trim();
  const baseLog = {direction:'IN', method:'webhook', updateId:updateId, chatId:msg && msg.chat && msg.chat.id || '', username:msg && msg.from && msg.from.username || '', text:text, payloadJson:_telegramSafeJson_(update)};
  if (updateId && (updateCache.get('TG_UPDATE_' + updateId) || _telegramRecentLogMatch_({ updateId: updateId }))) { _logTelegramEvent_(Object.assign({}, baseLog, {status:'duplicate_update'})); return { status: 'duplicate_update' }; }
  if (updateId) updateCache.put('TG_UPDATE_' + updateId, '1', 21600);
  if (!msg || !text) { _logTelegramEvent_(Object.assign({}, baseLog, {status:'ignored', reason:'NO_MESSAGE_TEXT'})); return { status: 'ignored' }; }
  const match = text.match(/^\/start(?:\s+(.+))?$/i);
  // Reply briefly so user always gets clear bot feedback after opening pairing link.
  if (!match || !match[1]) {
    const missingKey = 'TG_START_MISSING_' + String(msg.chat && msg.chat.id || '');
    if (!updateCache.get(missingKey)) {
      updateCache.put(missingKey, '1', 21600);
      _telegramApi_('sendMessage', { chat_id: msg.chat.id, text: 'Halo! Untuk menghubungkan Telegram ke SIMPEL, silakan buka link pairing dari aplikasi/admin lalu tekan Start. Jika belum punya link, ajukan dari halaman login SIMPEL Surveilans atau hubungi admin.' });
    }
    _logTelegramEvent_(Object.assign({}, baseLog, {status:'start_missing_token'}));
    return { status: 'start_missing_token' };
  }
  const token = String(match[1]).trim();
  const requestEmail = CacheService.getScriptCache().get('TG_REQ_' + token);
  const email = CacheService.getScriptCache().get('TG_PAIR_' + token) || requestEmail;
  if (!email) {
    // Telegram may retry the same /start after Apps Script latency, or users may
    // tap the same expired link repeatedly. Never spam a chat for invalid token.
    if (CacheService.getScriptCache().get('TG_PAIR_DONE_' + token) || CacheService.getScriptCache().get('TG_REQ_DONE_' + token)) { _logTelegramEvent_(Object.assign({}, baseLog, {status:'paired_duplicate_done'})); return { status: 'paired' }; }
    const expiredKey = 'TG_EXPIRED_' + String(msg.chat && msg.chat.id || '') + '_' + token;
    const tokenPreview = _telegramTokenPreview_(text);
    if (updateCache.get(expiredKey) || _telegramRecentLogMatch_({ chatId: msg.chat && msg.chat.id || '', tokenPreview: tokenPreview, statuses: ['expired', 'expired_duplicate_suppressed'] })) { _logTelegramEvent_(Object.assign({}, baseLog, {status:'expired_duplicate_suppressed'})); return { status: 'expired_duplicate_suppressed' }; }
    updateCache.put(expiredKey, '1', 21600);
    _telegramApi_('sendMessage', { chat_id: msg.chat.id, text: 'Link Telegram sudah kedaluwarsa atau tidak valid. Silakan buat link baru dari halaman login SIMPEL Surveilans, atau minta admin membuat ulang link pairing dari menu Pengaturan.' });
    _logTelegramEvent_(Object.assign({}, baseLog, {status:'expired'}));
    return { status: 'expired' };
  }
  if (requestEmail) {
    CacheService.getScriptCache().put('TG_REQ_DONE_' + token, '1', 21600);
    const requestSheet = getSheetOrNull_('PERMOHONAN_USER');
    if (requestSheet) {
      const requestValues = requestSheet.getDataRange().getValues();
      const requestHeaders = requestValues[0].map(function(v) { return String(v || '').trim(); });
      const requestIdIx = _headerIndexCI_(requestHeaders, ['RequestId']);
      const requestEmailIx = _headerIndexCI_(requestHeaders, ['Gmail', 'Email']);
      const requestStatusIx = _headerIndexCI_(requestHeaders, ['StatusPermohonan']);
      const requestChatIx = _headerIndexCI_(requestHeaders, ['TelegramChatId']);
      const requestUserIx = _headerIndexCI_(requestHeaders, ['TelegramUsername']);
      for (var q = 1; q < requestValues.length; q++) {
        if (requestEmailIx >= 0 && requestStatusIx >= 0 &&
            _normalizeGmail_(requestValues[q][requestEmailIx]) === requestEmail &&
            String(requestValues[q][requestStatusIx] || '').trim() === 'MENUNGGU') {
          if (requestChatIx >= 0) requestValues[q][requestChatIx] = String(msg.chat && msg.chat.id || '');
          if (requestUserIx >= 0) requestValues[q][requestUserIx] = String(msg.from && msg.from.username || '');
          requestSheet.getRange(q + 1, 1, 1, requestHeaders.length).setValues([requestValues[q]]);
          _telegramApi_('sendMessage', { chat_id: msg.chat.id, text: 'Telegram berhasil dicatat untuk permohonan akun SIMPEL Surveilans Anda. Langkah berikutnya: tunggu admin menyetujui permohonan. Setelah disetujui, silakan login di aplikasi SIMPEL Surveilans menggunakan email yang didaftarkan.' });
          _logTelegramEvent_(Object.assign({}, baseLog, {status:'request_pair_received', reason:requestIdIx >= 0 ? requestValues[q][requestIdIx] : ''}));
          return { status: 'request_pair_received', requestId: requestIdIx >= 0 ? requestValues[q][requestIdIx] : '' };
        }
      }
    }
    _logTelegramEvent_(Object.assign({}, baseLog, {status:'request_pair_received', reason:'REQUEST_SHEET_NOT_UPDATED'}));
    return { status: 'request_pair_received', email: requestEmail };
  }
  ensureRefUserTelegramColumns();
  const sh = getSheetOrNull_('REF_USER');
  const values = sh.getDataRange().getValues();
  const headers = values[0].map(function(v) { return String(v || '').trim(); });
  const ixEmail = _headerIndexCI_(headers, ['Gmail', 'Email']);
  const ix = {}; headers.forEach(function(h, i) { ix[h] = i; });
  for (var r = 1; r < values.length; r++) {
    if (_normalizeGmail_(values[r][ixEmail]) !== email) continue;
    const newChatId = String(msg.chat.id);
    // Re-pairing from another chat revokes previous binding before replacing it.
    values[r][ix.TelegramChatId] = newChatId;
    values[r][ix.TelegramUsername] = String(msg.from && msg.from.username || '');
    values[r][ix.TelegramVerifiedAt] = new Date();
    values[r][ix.TelegramStatus] = 'ACTIVE';
    values[r][ix.OtpChannel] = 'telegram';
    values[r][ix.OtpFallbackChannel] = 'email';
    values[r][ix.NotificationChannel] = 'telegram';
    sh.getRange(r + 1, 1, 1, headers.length).setValues([values[r]]);
    CacheService.getScriptCache().put('TG_PAIR_DONE_' + token, '1', 21600);
    CacheService.getScriptCache().remove('TG_PAIR_' + token);
    _telegramApi_('sendMessage', { chat_id: msg.chat.id, text: 'Telegram berhasil dihubungkan dengan akun SIMPEL Surveilans Anda. Langkah berikutnya: buka aplikasi SIMPEL Surveilans, login menggunakan email terdaftar, lalu masukkan kode OTP yang dikirim lewat Telegram.' });
    // Pairing login flow: issue OTP immediately after Telegram Start.
    const otp = _generateLoginOtp_();
    AUTH_CACHE.put(_authOtpKey_(email), _hashOtpValue_(email, otp), 5 * 60);
    AUTH_CACHE.put(_authOtpCooldownKey_(email), '1', 60);
    _telegramApi_('sendMessage', { chat_id: msg.chat.id, text: 'Kode OTP SIMPEL Surveilans: ' + otp + '\n\nBerlaku 5 menit. Jangan bagikan kode ini kepada siapa pun. Jika belum berada di halaman login, silakan buka aplikasi SIMPEL Surveilans lalu masukkan kode ini.' });
    _logTelegramEvent_(Object.assign({}, baseLog, {status:'paired', reason:email}));
    return { status: 'paired' };
  }
  _logTelegramEvent_(Object.assign({}, baseLog, {status:'not_found', reason:email}));
  return { status: 'not_found' };
}
