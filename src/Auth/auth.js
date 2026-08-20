function _publicAuthError_(err, fallbackMessage) {
  const fallback = String(fallbackMessage || "Login belum bisa diproses. Silakan coba lagi atau hubungi admin.").trim();
  const raw = String((err && err.message) || err || "").trim();
  const allowedPatterns = [
    /^Username/i,
    /^Password/i,
    /^Token/i,
    /^Sesi/i,
    /^Akun tidak aktif/i,
    /^Terlalu banyak/i,
    /^REF_USER/i,
    /^Sheet REF_USER/i,
    /^Kolom Username\/PIN/i,
    /^Username atau password salah/i,
    /^Password baru/i,
    /^Password lama/i,
    /^Email/i,
    /^Gmail/i,
    /^OTP/i,
    /^Tunggu/i
  ];
  const message = allowedPatterns.some(function(pattern) { return pattern.test(raw); }) ? raw : fallback;
  try { console.error("Public auth endpoint error:", err); } catch (logErr) {}
  return { status: "error", message: message };
}

function _authAttemptCacheKey_(username) {
  return "LOGIN_ATTEMPT_" + String(username || "").trim().toLowerCase();
}

function _readLoginAttemptState_(username) {
  try {
    const raw = AUTH_CACHE.get(_authAttemptCacheKey_(username));
    if (!raw) return { count: 0, lockUntil: 0 };
    const obj = JSON.parse(raw);
    return {
      count: Number(obj && obj.count || 0),
      lockUntil: Number(obj && obj.lockUntil || 0)
    };
  } catch (e) {
    return { count: 0, lockUntil: 0 };
  }
}

function _writeLoginAttemptState_(username, state, ttlSec) {
  try {
    AUTH_CACHE.put(_authAttemptCacheKey_(username), JSON.stringify(state || {}), ttlSec || 300);
  } catch (e) {
    console.error("Auth: gagal simpan state login attempt:", e);
  }
}

function _clearLoginAttemptState_(username) {
  try {
    AUTH_CACHE.remove(_authAttemptCacheKey_(username));
  } catch (e) {}
}

function _verifyPinValue_(storedPin, suppliedPin) {
  storedPin = String(storedPin || "").trim();
  suppliedPin = String(suppliedPin || "").trim();
  if (!storedPin || !suppliedPin) return false;

  if (/^sha256:/i.test(storedPin)) {
    const expected = storedPin.replace(/^sha256:/i, "").trim().toLowerCase();
    const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, suppliedPin, Utilities.Charset.UTF_8);
    const actual = digest.map(function(b) {
      const v = (b < 0 ? b + 256 : b).toString(16);
      return v.length === 1 ? "0" + v : v;
    }).join("").toLowerCase();
    return actual === expected;
  }

  return storedPin === suppliedPin;
}

function _extractUserScopeInfoFromRow_(row, headers) {
  function idx(names) {
    for (var i = 0; i < names.length; i++) {
      var found = headers.indexOf(names[i]);
      if (found !== -1) return found;
    }
    return -1;
  }

  const ixUnit = idx(["UnitKerja", "Unit Kerja", "Nama Puskesmas", "Puskesmas"]);
  const ixFaskes = idx(["NamaFaskes", "Nama Faskes", "Nama Fasyankes", "Faskes"]);
  const ixKode = idx(["KodeFaskes", "Kode Faskes", "Kode PKM"]);
  const ixScope = idx(["ScopeLevel", "Scope Level"]);
  const ixWa = idx(["No Whatsapp", "No WhatsApp", "Whatsapp", "WhatsApp", "NoWA", "No WA", "WA"]);

  return {
    unitKerja: ixUnit !== -1 ? String(row[ixUnit] || "").trim() : "",
    namaFaskes: ixFaskes !== -1 ? String(row[ixFaskes] || "").trim() : "",
    kodePuskesmas: ixKode !== -1 ? String(row[ixKode] || "").trim() : "",
    scopeLevel: ixScope !== -1 ? String(row[ixScope] || "").trim().toLowerCase() : "",
    noWhatsapp: ixWa !== -1 ? String(row[ixWa] || "").trim() : ""
  };
}


function _authOtpKey_(email) {
  return "OTP_LOGIN_" + String(email || "").trim().toLowerCase();
}

function _authOtpCooldownKey_(email) {
  return "OTP_LOGIN_COOLDOWN_" + String(email || "").trim().toLowerCase();
}

function _normalizeGmail_(email) {
  return String(email == null ? "" : email)
    .replace(/[\u0000-\u001F\u007F\u00A0\u200B-\u200D\uFEFF]/g, "")
    .trim()
    .replace(/^mailto:/i, "")
    .trim()
    .toLowerCase();
}

function _hashOtpValue_(email, otp) {
  const raw = _normalizeGmail_(email) + ":" + String(otp || "").trim();
  const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, raw, Utilities.Charset.UTF_8);
  return digest.map(function(b) {
    const v = (b < 0 ? b + 256 : b).toString(16);
    return v.length === 1 ? "0" + v : v;
  }).join("");
}

function _generateLoginOtp_() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

/** Run once from Apps Script editor to authorize MailApp scope. */
function authorizeMailScope() {
  return { service: "Brevo", configured: !!PropertiesService.getScriptProperties().getProperty("BREVO_API_KEY") };
}

function testBrevoConnection() {
  const props = PropertiesService.getScriptProperties();
  const apiKey = String(props.getProperty("BREVO_API_KEY") || "").replace(/[\\r\\n\\t]/g, "").trim();
  const senderEmail = String(props.getProperty("BREVO_SENDER_EMAIL") || "").replace(/[\\r\\n\\t]/g, "").trim();
  if (!apiKey || !senderEmail) return { status: "error", configured: false, hasApiKey: !!apiKey, hasSenderEmail: !!senderEmail };
  const response = UrlFetchApp.fetch("https://api.brevo.com/v3/account", {
    method: "get",
    headers: { "api-key": apiKey, "accept": "application/json" },
    muteHttpExceptions: true
  });
  const code = response.getResponseCode();
  let body = response.getContentText() || "";
  try {
    const obj = JSON.parse(body);
    body = obj.message || obj.code || (obj.email ? "account_ok" : "response_received");
  } catch (e) { body = body.slice(0, 200); }
  return { status: code >= 200 && code < 300 ? "success" : "error", httpCode: code, configured: true, senderEmail: senderEmail, brevoMessage: body };
}

function _sendOtpViaBrevo_(to, otp) {
  const props = PropertiesService.getScriptProperties();
  const apiKey = String(props.getProperty("BREVO_API_KEY") || "").replace(/[\\r\\n\\t]/g, "").trim();
  const senderEmail = String(props.getProperty("BREVO_SENDER_EMAIL") || "").replace(/[\\r\\n\\t]/g, "").trim();
  const senderName = "SIMPEL Surveilans Dinkes Kota Depok";
  if (!apiKey || !senderEmail) throw new Error("BREVO_API_KEY atau BREVO_SENDER_EMAIL belum diset di Script Properties.");
  const response = UrlFetchApp.fetch("https://api.brevo.com/v3/smtp/email", {
    method: "post",
    contentType: "application/json",
    headers: { "api-key": apiKey, "accept": "application/json" },
    payload: JSON.stringify({
      sender: { email: senderEmail, name: senderName },
      to: [{ email: String(to).trim() }],
      subject: "Kode OTP SIMPEL Surveilans",
      textContent: "Kode OTP Anda adalah: " + otp + "\n\nKode berlaku selama 5 menit. Jangan bagikan kode ini."
    }),
    muteHttpExceptions: true
  });
  const status = response.getResponseCode();
  const body = response.getContentText();
  if (status < 200 || status >= 300) throw new Error("Brevo HTTP " + status + ": " + body.slice(0, 300));
  return body;
}

function _findUserByEmail_(email) {
  email = _normalizeGmail_(email);
  const sh = getSheetOrNull_("REF_USER");
  if (!sh) return { error: "Sheet REF_USER tidak ditemukan." };

  const values = sh.getDataRange().getValues();
  if (!values || values.length < 2) return { error: "REF_USER masih kosong." };

  const headers = values[0].map(function(h) { return String(h || "").trim(); });
  const rows = values.slice(1);

  function headerIndex(names) {
    for (var i = 0; i < names.length; i++) {
      const ix = headers.indexOf(names[i]);
      if (ix !== -1) return ix;
    }
    return -1;
  }

  function fieldIndex(names) { return headerIndex(names); }

  const ixEmail = headerIndex(["Email", "Gmail", "EmailPetugas"]);
  const ixUser = headerIndex(["Username"]);
  const ixNama = headerIndex(["Nama", "Nama Petugas"]);
  const ixRole = headerIndex(["Role"]);
  const ixAktif = headerIndex(["Aktif", "StatusAktif"]);

  if (ixEmail === -1) return { error: "Kolom Email/Gmail belum ada di REF_USER." };

  for (var r = 0; r < rows.length; r++) {
    const row = rows[r];
    const rowEmail = _normalizeGmail_(row[ixEmail]);
    if (!rowEmail || rowEmail !== email) continue;

    if (ixAktif !== -1) {
      const aktif = String(row[ixAktif] || "").trim().toUpperCase();
      if (aktif && aktif !== "YA" && aktif !== "AKTIF" && aktif !== "TRUE") {
        return { error: "Akun tidak aktif. Hubungi admin." };
      }
    }

    const username = ixUser !== -1 ? String(row[ixUser] || "").trim() : email;
    const scopeInfo = _extractUserScopeInfoFromRow_(row, headers);
    return { user: {
      username: username || email,
      email: email,
      nama: (ixNama !== -1 ? String(row[ixNama] || "").trim() : username) || username || email,
      role: ixRole !== -1 ? String(row[ixRole] || "").trim().toLowerCase() : "",
      unitKerja: scopeInfo.unitKerja,
      kodePuskesmas: scopeInfo.kodePuskesmas,
      scopeLevel: scopeInfo.scopeLevel,
      noWhatsapp: scopeInfo.noWhatsapp,
      otpChannel: fieldIndex(['OtpChannel']) !== -1 ? String(row[fieldIndex(['OtpChannel'])] || '').trim().toLowerCase() : 'email',
      otpFallbackChannel: fieldIndex(['OtpFallbackChannel']) !== -1 ? String(row[fieldIndex(['OtpFallbackChannel'])] || 'email').trim().toLowerCase() : 'email',
      telegramChatId: fieldIndex(['TelegramChatId']) !== -1 ? String(row[fieldIndex(['TelegramChatId'])] || '').trim() : '',
      telegramStatus: fieldIndex(['TelegramStatus']) !== -1 ? String(row[fieldIndex(['TelegramStatus'])] || '').trim().toUpperCase() : '',
      notificationChannel: fieldIndex(['NotificationChannel']) !== -1 ? String(row[fieldIndex(['NotificationChannel'])] || 'none').trim().toLowerCase() : 'none'
    }};
  }

  return { error: "Email belum terdaftar. Hubungi admin." };
}

function requestLoginOtp(email) {
  try {
    email = _normalizeGmail_(email);
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(email)) return { status: "error", message: "Gunakan alamat email yang valid." };

    const found = _findUserByEmail_(email);
    if (!found.user) return { status: "error", message: found.error || "Email belum terdaftar." };

    const cooldownKey = _authOtpCooldownKey_(email);
    if (AUTH_CACHE.get(cooldownKey)) return { status: "error", message: "Tunggu 60 detik sebelum meminta OTP lagi.", cooldownSec: 60 };

    const otp = _generateLoginOtp_();
    AUTH_CACHE.put(_authOtpKey_(email), _hashOtpValue_(email, otp), 5 * 60);
    AUTH_CACHE.put(cooldownKey, "1", 60);

    let fallbackReason = '';
    if (found.user.otpChannel === 'telegram' || found.user.otpChannel === 'both') {
      if (found.user.telegramChatId && found.user.telegramStatus === 'ACTIVE') {
        try {
          _telegramApi_('sendMessage', { chat_id: found.user.telegramChatId, text: 'Kode OTP SIMPEL Surveilans Kota Depok: ' + otp + '\n\nBerlaku selama 5 menit. Jangan bagikan kode ini.' });
          return { status: "success", message: "OTP sudah dikirim ke Telegram Anda.", channel: "telegram", cooldownSec: 60 };
        } catch (telegramErr) {
          fallbackReason = 'TELEGRAM_SEND_FAILED';
          if (found.user.otpFallbackChannel !== 'email') return _publicAuthError_(telegramErr, "OTP Telegram gagal dikirim. Hubungkan ulang Telegram atau hubungi admin.");
        }
      } else {
        fallbackReason = 'TELEGRAM_NOT_PAIRED';
        if (found.user.otpFallbackChannel !== 'email') return { status: "error", message: "Telegram belum terhubung. Hubungkan ulang Telegram atau hubungi admin." };
      }
    }

    try {
      _sendOtpViaBrevo_(email, otp);
    } catch (mailErr) {
      // Keep OTP value private; expose actionable service failure only.
      let detail = String(mailErr && mailErr.message || mailErr || '').trim();
      let message = "OTP email gagal dikirim. ";
      if (/^Brevo HTTP\s+401\b/i.test(detail)) message += "API key Brevo tidak valid atau sudah dicabut.";
      else if (/^Brevo HTTP\s+400\b/i.test(detail)) message += "Sender Brevo belum terverifikasi atau payload email tidak valid.";
      else if (/^Brevo HTTP\s+403\b/i.test(detail)) message += "API key Brevo tidak punya izin SMTP.";
      else if (/^Brevo HTTP\s+429\b/i.test(detail)) message += "Brevo sedang membatasi pengiriman. Coba lagi nanti.";
      else if (/too many times|quota|limit/i.test(detail)) message += "Quota/rate limit layanan email tercapai.";
      else if (/(invalid\s+(argument|email|recipient)|invalid.*(recipient|email address)|recipient.*invalid|bad.*email)/i.test(detail)) message += "Alamat email penerima ditolak layanan email.";
      else message += "Layanan email menolak pengiriman. Cek detail Apps Script Executions.";
      try { console.error("OTP email send failed:", { email: email, detail: detail, fallbackReason: fallbackReason }); } catch (logErr) {}
      return { status: "error", message: message, code: "OTP_EMAIL_SEND_FAILED", fallbackReason: fallbackReason || "EMAIL_SEND_FAILED" };
    }

    return { status: "success", message: fallbackReason ? "OTP Telegram belum tersedia. OTP dikirim ke email Anda." : "OTP sudah dikirim ke email Anda.", channel: fallbackReason ? "email_fallback" : "email", fallbackReason: fallbackReason, cooldownSec: 60 };
  } catch (e) {
    return _publicAuthError_(e, "OTP belum bisa dikirim. Silakan coba lagi atau hubungi admin.");
  }
}

function verifyLoginOtp(email, otp) {
  try {
    email = _normalizeGmail_(email);
    otp = String(otp || "").trim();
    if (!email || !otp) return { status: "error", message: "Email dan OTP wajib diisi." };

    const found = _findUserByEmail_(email);
    if (!found.user) return { status: "error", message: found.error || "Email tidak terdaftar." };

    const savedHash = AUTH_CACHE.get(_authOtpKey_(email));
    if (!savedHash) return { status: "error", message: "OTP sudah kedaluwarsa. Silakan minta ulang." };
    if (savedHash !== _hashOtpValue_(email, otp)) return { status: "error", message: "OTP tidak sesuai." };

    AUTH_CACHE.remove(_authOtpKey_(email));
    const user = found.user;
    const token = Utilities.getUuid();
    const ttl = Session_Manager.getTtlForRole(user.role);
    const nowTs = Date.now();
    const absoluteExpiresAt = nowTs + (SESSION_ABSOLUTE_TTL_SECONDS * 1000);
    AUTH_CACHE.put("TOKEN_" + token, JSON.stringify({ user: user, ts: nowTs, issuedAt: nowTs, ttl: ttl, absoluteExpiresAt: absoluteExpiresAt }), ttl);
    if (typeof Audit_Logger !== "undefined" && Audit_Logger.logLogin) Audit_Logger.logLogin(user);
    return { status: "success", token: token, user: user, ttlSec: ttl, issuedAt: nowTs, expiresAt: nowTs + (ttl * 1000) };
  } catch (e) {
    return _publicAuthError_(e, "OTP belum bisa diverifikasi. Silakan coba lagi atau hubungi admin.");
  }
}

function authLogin(username, pin) {
  try {
    username = String(username || "").trim();
    pin = String(pin || "").trim();

    if (!username || !pin) {
      return { status: "error", message: "Username dan password wajib diisi." };
    }

    const attemptState = _readLoginAttemptState_(username);
    if (attemptState.lockUntil && Date.now() < attemptState.lockUntil) {
      const waitSec = Math.max(1, Math.ceil((attemptState.lockUntil - Date.now()) / 1000));
      return { status: "error", message: "Terlalu banyak percobaan login. Coba lagi dalam " + waitSec + " detik." };
    }

    const sh = getSheetOrNull_("REF_USER");
    if (!sh) {
      return { status: "error", message: "Sheet REF_USER tidak ditemukan." };
    }

    const values = sh.getDataRange().getValues();
    if (!values || values.length < 2) {
      return { status: "error", message: "REF_USER masih kosong." };
    }

    const headers = values[0].map(h => String(h || "").trim());
    const rows = values.slice(1);

    const ixUser = headers.indexOf("Username");
    const ixPin = headers.indexOf("PIN");
    const ixNama = headers.indexOf("Nama");
    const ixRole = headers.indexOf("Role");
    const ixAktif = headers.indexOf("Aktif") !== -1 ? headers.indexOf("Aktif") : headers.indexOf("StatusAktif");

    if (ixUser === -1 || ixPin === -1) {
      return { status: "error", message: "Kolom Username/PIN untuk password belum ada di REF_USER." };
    }

    const uLower = username.toLowerCase();
    let found = null;
    let matchedUserRow = null;

    for (const r of rows) {
      const u = String(r[ixUser] || "").trim();
      if (!u) continue;
      if (u.toLowerCase() !== uLower) continue;
      matchedUserRow = r;

      if (ixAktif !== -1) {
        const aktif = String(r[ixAktif] || "").trim().toUpperCase();
        if (aktif && aktif !== "YA" && aktif !== "AKTIF") {
          return { status: "error", message: "Akun tidak aktif. Hubungi admin." };
        }
      }

      const p = String(r[ixPin] || "").trim();
      if (!_verifyPinValue_(p, pin)) {
        matchedUserRow = r;
        break;
      }

      const scopeInfo = _extractUserScopeInfoFromRow_(r, headers);
      found = {
        username: u,
        nama: (ixNama !== -1 ? String(r[ixNama] || "").trim() : u) || u,
        role: ixRole !== -1 ? String(r[ixRole] || "").trim().toLowerCase() : "",
        unitKerja: scopeInfo.unitKerja,
        kodePuskesmas: scopeInfo.kodePuskesmas,
        scopeLevel: scopeInfo.scopeLevel
      };
      break;
    }

    if (!found) {
      const nextCount = Number(attemptState.count || 0) + 1;
      const lockUntil = nextCount >= 5 ? (Date.now() + 5 * 60 * 1000) : 0;
      _writeLoginAttemptState_(username, { count: nextCount, lockUntil: lockUntil }, 5 * 60);

      if (typeof Audit_Logger !== "undefined" && Audit_Logger.logAuthFailed) {
        Audit_Logger.logAuthFailed(username, matchedUserRow ? "PIN_SALAH" : "USER_TIDAK_DITEMUKAN");
      }

      if (lockUntil) {
        return { status: "error", message: "Terlalu banyak percobaan login. Akun dikunci sementara selama 5 menit." };
      }

      return { status: "error", message: "Username atau password salah." };
    }

    _clearLoginAttemptState_(username);

    const token = Utilities.getUuid();
    const ttl = Session_Manager.getTtlForRole(found.role);
    const nowTs = Date.now();
    const absoluteExpiresAt = nowTs + (SESSION_ABSOLUTE_TTL_SECONDS * 1000);
    AUTH_CACHE.put("TOKEN_" + token, JSON.stringify({ user: found, ts: nowTs, issuedAt: nowTs, ttl: ttl, absoluteExpiresAt: absoluteExpiresAt }), ttl);

    if (typeof Audit_Logger !== "undefined" && Audit_Logger.logLogin) {
      Audit_Logger.logLogin(found);
    }

    return { status: "success", token: token, user: found, ttlSec: ttl, issuedAt: nowTs, expiresAt: nowTs + (ttl * 1000) };
  } catch (e) {
    return _publicAuthError_(e);
  }
}

function authCheck(token) {
  try {
    token = String(token || "").trim();
    if (!token) return { status: "error", message: "Token kosong." };

    const raw = AUTH_CACHE.get("TOKEN_" + token);
    if (!raw) return { status: "error", message: "Sesi habis. Silakan login ulang." };

    let obj = null;
    try {
      obj = JSON.parse(raw);
    } catch (e) {
      obj = null;
    }

    if (!obj || !obj.user) {
      return { status: "error", message: "Sesi tidak valid." };
    }

    // REF_USER is source of truth. Never return stale user scope from browser/cache.
    // This keeps UnitKerja, KodePuskesmas, Role, and ScopeLevel aligned with sheet.
    const currentUser = _refreshAuthUserFromRefUser_(obj.user);
    if (!currentUser) return { status: "error", message: "Akun tidak ditemukan di REF_USER." };
    obj.user = currentUser;

    const nowTs = Date.now();
    const issuedAt = Number(obj.issuedAt || obj.ts || nowTs);
    const absoluteExpiresAt = Number(obj.absoluteExpiresAt || (issuedAt + (SESSION_ABSOLUTE_TTL_SECONDS * 1000)));
    if (nowTs >= absoluteExpiresAt) {
      AUTH_CACHE.remove("TOKEN_" + token);
      return { status: "error", message: "Sesi habis. Silakan login ulang." };
    }
    const configuredTtl = obj.ttl || Session_Manager.getTtlForRole(obj.user.role);
    const ttl = Math.min(configuredTtl, Math.max(1, Math.ceil((absoluteExpiresAt - nowTs) / 1000)));
    obj.issuedAt = issuedAt;
    obj.absoluteExpiresAt = absoluteExpiresAt;
    obj.ts = nowTs;
    obj.ttl = ttl;
    AUTH_CACHE.put("TOKEN_" + token, JSON.stringify(obj), ttl);
    return { status: "success", token: token, user: obj.user, ttlSec: ttl, issuedAt: issuedAt, expiresAt: nowTs + (ttl * 1000), absoluteExpiresAt: absoluteExpiresAt };
  } catch (e) {
    return _publicAuthError_(e, "Sesi belum bisa diperiksa. Silakan login ulang.");
  }
}

function _refreshAuthUserFromRefUser_(cachedUser) {
  const sh = getSheetOrNull_("REF_USER");
  if (!sh) return null;
  const values = sh.getDataRange().getValues();
  if (!values || values.length < 2) return null;
  const headers = values[0].map(function(h) { return String(h || "").trim(); });
  function ix(names) {
    for (var i = 0; i < names.length; i++) { var n = headers.indexOf(names[i]); if (n !== -1) return n; }
    return -1;
  }
  const ixUser = ix(["Username"]), ixEmail = ix(["Email", "Gmail", "EmailPetugas"]);
  const ixNama = ix(["Nama", "Nama Petugas"]), ixRole = ix(["Role"]), ixAktif = ix(["Aktif", "StatusAktif"]);
  const wantedUser = String((cachedUser && cachedUser.username) || "").trim().toLowerCase();
  const wantedEmail = _normalizeGmail_(cachedUser && cachedUser.email);
  for (var r = 1; r < values.length; r++) {
    const row = values[r];
    const rowUser = ixUser === -1 ? "" : String(row[ixUser] || "").trim();
    const rowEmail = ixEmail === -1 ? "" : _normalizeGmail_(row[ixEmail]);
    if (!((wantedEmail && rowEmail === wantedEmail) || (wantedUser && rowUser.toLowerCase() === wantedUser))) continue;
    if (ixAktif !== -1) { const aktif = String(row[ixAktif] || "").trim().toUpperCase(); if (aktif && !["YA", "AKTIF", "TRUE"].includes(aktif)) return null; }
    const scope = _extractUserScopeInfoFromRow_(row, headers);
    return { username: rowUser || cachedUser.username, email: rowEmail || cachedUser.email || "", nama: (ixNama !== -1 ? String(row[ixNama] || "").trim() : rowUser) || rowUser, role: ixRole !== -1 ? String(row[ixRole] || "").trim().toLowerCase() : "", unitKerja: scope.unitKerja, namaFaskes: scope.namaFaskes, kodePuskesmas: scope.kodePuskesmas, scopeLevel: scope.scopeLevel, noWhatsapp: scope.noWhatsapp };
  }
  return null;
}

function authLogout(token) {
  try {
    token = String(token || "").trim();
    if (token) {
      const raw = AUTH_CACHE.get("TOKEN_" + token);
      let user = null;
      if (raw) {
        try {
          const obj = JSON.parse(raw);
          if (obj && obj.user) user = obj.user;
        } catch (e) { /* abaikan */ }
      }
      if (user && typeof Audit_Logger !== "undefined" && Audit_Logger.logLogout) {
        Audit_Logger.logLogout(user);
      }
      AUTH_CACHE.remove("TOKEN_" + token);
    }
    return { status: "success" };
  } catch (e) {
    return _publicAuthError_(e, "Logout belum bisa diproses. Silakan coba lagi.");
  }
}

function _hashPinForStorage_(pin) {
  pin = String(pin || "").trim();
  const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, pin, Utilities.Charset.UTF_8);
  const hex = digest.map(function(b) {
    const v = (b < 0 ? b + 256 : b).toString(16);
    return v.length === 1 ? "0" + v : v;
  }).join("");
  return "sha256:" + hex;
}

function authChangePin(token, oldPin, newPin) {
  try {
    oldPin = String(oldPin || "").trim();
    newPin = String(newPin || "").trim();

    const sess = _getSessionFromToken_(token);
    if (!sess.ok) {
      return { status: "error", message: sess.message || "Sesi habis. Login ulang." };
    }

    if (newPin.length < 6) {
      return { status: "error", message: "Password baru minimal 6 karakter." };
    }

    const username = String(sess.user.username || "").trim();
    if (!username) {
      return { status: "error", message: "Sesi tidak valid." };
    }

    const sh = getSheetOrNull_("REF_USER");
    if (!sh) {
      return { status: "error", message: "Sheet REF_USER tidak ditemukan." };
    }

    const data = sh.getDataRange().getValues();
    if (!data || data.length < 2) {
      return { status: "error", message: "REF_USER kosong." };
    }

    const headers = data[0].map(h => String(h || "").trim());
    const ixUser = headers.indexOf("Username");
    const ixPin = headers.indexOf("PIN");

    if (ixUser === -1 || ixPin === -1) {
      return { status: "error", message: "Kolom Username/PIN untuk password belum ada di REF_USER." };
    }

    for (let i = 1; i < data.length; i++) {
      const u = String(data[i][ixUser] || "").trim();
      if (u.toLowerCase() !== username.toLowerCase()) continue;

      const p = String(data[i][ixPin] || "").trim();
      if (!_verifyPinValue_(p, oldPin)) {
        return { status: "error", message: "Password lama salah." };
      }

      sh.getRange(i + 1, ixPin + 1).setValue(_hashPinForStorage_(newPin));
      return { status: "success", message: "Password berhasil diubah." };
    }

    return { status: "error", message: "User tidak ditemukan." };
  } catch (e) {
    return _publicAuthError_(e, "Ubah password belum bisa diproses. Silakan coba lagi atau hubungi admin.");
  }
}

function manageGetUsers(token) {
  try {
    _requirePieSession_(token, { superAdminOnly: true });
    const sh = getSheetOrNull_("REF_USER");
    if (!sh) return { ok: false, error: "Sheet REF_USER tidak ditemukan." };

    const values = sh.getDataRange().getValues();
    if (!values || values.length < 2) return { ok: true, users: [] };

    const headers = values[0].map(function(h) { return String(h || "").trim(); });
    const rows = values.slice(1);

    function headerIndex(names) {
      for (var i = 0; i < names.length; i++) {
        const ix = headers.indexOf(names[i]);
        if (ix !== -1) return ix;
      }
      return -1;
    }

    const ixUser = headerIndex(["Username"]);
    const ixGmail = headerIndex(["Gmail", "Email", "EmailPetugas"]);
    const ixNama = headerIndex(["Nama", "Nama Petugas"]);
    const ixRole = headerIndex(["Role"]);
    const ixUnit = headerIndex(["UnitKerja", "Unit Kerja", "Nama Puskesmas", "Puskesmas"]);
    const ixFaskes = headerIndex(["NamaFaskes", "Nama Faskes", "Nama Fasyankes", "Faskes"]);
    const ixKode = headerIndex(["KodeFaskes", "Kode Faskes", "Kode PKM"]);
    const ixScope = headerIndex(["ScopeLevel", "Scope Level"]);
    const ixAktif = headerIndex(["Aktif", "StatusAktif"]);
    const ixLoginMethod = headerIndex(["LoginMethod", "Login Method"]);
    const ixOtpEnabled = headerIndex(["OtpEnabled", "Otp Enabled"]);
    const ixOtpTtl = headerIndex(["OtpTtlMinutes", "Otp Ttl Minutes", "OtpTtl"]);
    const ixOtpCooldown = headerIndex(["OtpCooldownSeconds", "Otp Cooldown Seconds", "OtpCooldown"]);
    const ixLastLogin = headerIndex(["LastLoginAt", "Last Login At", "LastLogin"]);
    const ixCatatan = headerIndex(["Catatan"]);
    const ixOtpChannel = headerIndex(["OtpChannel"]), ixOtpFallback = headerIndex(["OtpFallbackChannel"]), ixNotifChannel = headerIndex(["NotificationChannel"]);

    const users = [];
    for (var r = 0; r < rows.length; r++) {
      const row = rows[r];
      // Skip empty rows
      if (!row.some(function(v) { return String(v || "").trim() !== ""; })) continue;

      users.push({
        username: ixUser !== -1 ? String(row[ixUser] || "").trim() : "",
        gmail: ixGmail !== -1 ? String(row[ixGmail] || "").trim() : "",
        nama: ixNama !== -1 ? String(row[ixNama] || "").trim() : "",
        role: ixRole !== -1 ? String(row[ixRole] || "").trim() : "",
        unitKerja: ixUnit !== -1 ? String(row[ixUnit] || "").trim() : "",
        namaFaskes: ixFaskes !== -1 ? String(row[ixFaskes] || "").trim() : "",
        kodePuskesmas: ixKode !== -1 ? String(row[ixKode] || "").trim() : "",
        scopeLevel: ixScope !== -1 ? String(row[ixScope] || "").trim() : "",
        statusAktif: ixAktif !== -1 ? String(row[ixAktif] || "").trim() : "YA",
        loginMethod: ixLoginMethod !== -1 ? String(row[ixLoginMethod] || "").trim() : "OTP_GMAIL",
        otpEnabled: ixOtpEnabled !== -1 ? String(row[ixOtpEnabled] || "").trim() : "YA",
        otpTtlMinutes: ixOtpTtl !== -1 ? Number(row[ixOtpTtl] || 5) : 5,
        otpCooldownSeconds: ixOtpCooldown !== -1 ? Number(row[ixOtpCooldown] || 60) : 60,
        lastLoginAt: ixLastLogin !== -1 ? String(row[ixLastLogin] || "").trim() : "",
        catatan: ixCatatan !== -1 ? String(row[ixCatatan] || "").trim() : ""
        ,otpChannel: ixOtpChannel !== -1 ? String(row[ixOtpChannel] || "email").trim().toLowerCase() : "email"
        ,otpFallbackChannel: ixOtpFallback !== -1 ? String(row[ixOtpFallback] || "none").trim().toLowerCase() : "none"
        ,notificationChannel: ixNotifChannel !== -1 ? String(row[ixNotifChannel] || "none").trim().toLowerCase() : "none"
      });
    }

    return { ok: true, users: users };
  } catch (e) {
    return { ok: false, error: e.message || String(e) };
  }
}

function manageSaveUser(token, userPayload) {
  try {
    _requirePieSession_(token, { superAdminOnly: true });
    const sh = getSheetOrNull_("REF_USER");
    if (!sh) return { ok: false, error: "Sheet REF_USER tidak ditemukan." };

    const values = sh.getDataRange().getValues();
    const headers = values[0].map(function(h) { return String(h || "").trim(); });

    function headerIndex(names) {
      for (var i = 0; i < names.length; i++) {
        const ix = headers.indexOf(names[i]);
        if (ix !== -1) return ix;
      }
      return -1;
    }

    const ixUser = headerIndex(["Username"]);
    const ixGmail = headerIndex(["Gmail", "Email", "EmailPetugas"]);
    const ixNama = headerIndex(["Nama", "Nama Petugas"]);
    const ixRole = headerIndex(["Role"]);
    const ixUnit = headerIndex(["UnitKerja", "Unit Kerja", "Nama Puskesmas", "Puskesmas"]);
    const ixFaskes = headerIndex(["NamaFaskes", "Nama Faskes", "Nama Fasyankes", "Faskes"]);
    const ixKode = headerIndex(["KodeFaskes", "Kode Faskes", "Kode PKM"]);
    const ixScope = headerIndex(["ScopeLevel", "Scope Level"]);
    const ixAktif = headerIndex(["Aktif", "StatusAktif"]);
    const ixCatatan = headerIndex(["Catatan"]);
    const ixOtpChannel = headerIndex(["OtpChannel"]), ixOtpFallback = headerIndex(["OtpFallbackChannel"]), ixNotifChannel = headerIndex(["NotificationChannel"]);

    if (ixUser === -1 || ixGmail === -1) {
      return { ok: false, error: "Kolom Username dan Gmail wajib ada di REF_USER." };
    }

    const targetUser = String(userPayload.username || "").trim();
    const targetGmail = String(userPayload.gmail || "").trim().toLowerCase();

    if (!targetUser || !targetGmail) {
      return { ok: false, error: "Username dan Gmail wajib diisi." };
    }

    let foundRowIndex = -1;
    for (var i = 1; i < values.length; i++) {
      const rowUser = String(values[i][ixUser] || "").trim().toLowerCase();
      const rowGmail = String(values[i][ixGmail] || "").trim().toLowerCase();
      if (rowUser === targetUser.toLowerCase() || rowGmail === targetGmail) {
        foundRowIndex = i + 1;
        break;
      }
    }

    // Prepare row values
    const rowValues = [];
    // If updating, fetch existing values first, else fill defaults
    const currentValues = foundRowIndex !== -1 ? sh.getRange(foundRowIndex, 1, 1, headers.length).getValues()[0] : [];

    headers.forEach(function(h, colIdx) {
      let val = currentValues[colIdx] !== undefined ? currentValues[colIdx] : "";
      if (h === "Username") val = targetUser;
      else if (h === "Gmail" || h === "Email" || h === "EmailPetugas") val = targetGmail;
      else if (h === "Nama" || h === "Nama Petugas") val = String(userPayload.nama || "").trim();
      else if (h === "Role") val = String(userPayload.role || "petugas").trim().toLowerCase();
      else if (h === "UnitKerja" || h === "Unit Kerja" || h === "Nama Puskesmas" || h === "Puskesmas") val = String(userPayload.unitKerja || "").trim();
      else if (h === "NamaFaskes" || h === "Nama Faskes" || h === "Nama Fasyankes" || h === "Faskes") val = String(userPayload.namaFaskes || userPayload.unitKerja || "").trim();
      else if (h === "KodeFaskes" || h === "Kode Faskes" || h === "Kode PKM") val = String(userPayload.kodePuskesmas || "").trim();
      else if (h === "ScopeLevel" || h === "Scope Level") val = String(userPayload.scopeLevel || "puskesmas").trim().toLowerCase();
      else if (h === "Aktif" || h === "StatusAktif") val = String(userPayload.statusAktif || "YA").trim().toUpperCase();
      else if (h === "Catatan") val = String(userPayload.catatan || "").trim();
      else if (h === "LoginMethod") val = String(userPayload.loginMethod || "OTP_GMAIL").trim();
      else if (h === "OtpEnabled") val = String(userPayload.otpEnabled || "YA").trim().toUpperCase();
      else if (h === "OtpTtlMinutes") val = Number(userPayload.otpTtlMinutes || 5);
      else if (h === "OtpCooldownSeconds") val = Number(userPayload.otpCooldownSeconds || 60);
      else if (h === "OtpChannel") val = String(userPayload.otpChannel || "email").trim().toLowerCase();
      else if (h === "OtpFallbackChannel") val = String(userPayload.otpFallbackChannel || "none").trim().toLowerCase();
      else if (h === "NotificationChannel") val = String(userPayload.notificationChannel || "none").trim().toLowerCase();
      rowValues.push(val);
    });

    if (foundRowIndex !== -1) {
      sh.getRange(foundRowIndex, 1, 1, headers.length).setValues([rowValues]);
    } else {
      sh.appendRow(rowValues);
    }

    return { ok: true, message: "User berhasil disimpan." };
  } catch (e) {
    return { ok: false, error: e.message || String(e) };
  }
}

function manageDeleteUser(token, username) {
  try {
    _requirePieSession_(token, { superAdminOnly: true });
    const sh = getSheetOrNull_("REF_USER");
    if (!sh) return { ok: false, error: "Sheet REF_USER tidak ditemukan." };

    const values = sh.getDataRange().getValues();
    const headers = values[0].map(function(h) { return String(h || "").trim(); });
    const ixUser = headers.indexOf("Username");

    if (ixUser === -1) {
      return { ok: false, error: "Kolom Username tidak ditemukan di REF_USER." };
    }

    const targetUser = String(username || "").trim().toLowerCase();
    if (!targetUser) return { ok: false, error: "Username wajib diisi." };

    let foundRowIndex = -1;
    for (var i = 1; i < values.length; i++) {
      const rowUser = String(values[i][ixUser] || "").trim().toLowerCase();
      if (rowUser === targetUser) {
        foundRowIndex = i + 1;
        break;
      }
    }

    if (foundRowIndex === -1) {
      return { ok: false, error: "User tidak ditemukan." };
    }

    sh.deleteRow(foundRowIndex);
    return { ok: true, message: "User berhasil dihapus." };
  } catch (e) {
    return { ok: false, error: e.message || String(e) };
  }
}
