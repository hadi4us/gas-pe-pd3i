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
  const ixKode = idx(["KodePuskesmas", "Kode Puskesmas", "Kode PKM"]);
  const ixScope = idx(["ScopeLevel", "Scope Level"]);
  const ixWa = idx(["No Whatsapp", "No WhatsApp", "Whatsapp", "WhatsApp", "NoWA", "No WA", "WA"]);

  return {
    unitKerja: ixUnit !== -1 ? String(row[ixUnit] || "").trim() : "",
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
  return String(email || "").trim().toLowerCase();
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
      noWhatsapp: scopeInfo.noWhatsapp
    }};
  }

  return { error: "Email belum terdaftar. Hubungi admin." };
}

function requestLoginOtp(email) {
  try {
    email = _normalizeGmail_(email);
    if (!email || !/@gmail\.com$/i.test(email)) return { status: "error", message: "Gunakan alamat Gmail yang valid." };

    const found = _findUserByEmail_(email);
    if (!found.user) return { status: "error", message: found.error || "Email belum terdaftar." };

    const cooldownKey = _authOtpCooldownKey_(email);
    if (AUTH_CACHE.get(cooldownKey)) return { status: "error", message: "Tunggu 60 detik sebelum meminta OTP lagi.", cooldownSec: 60 };

    const otp = _generateLoginOtp_();
    AUTH_CACHE.put(_authOtpKey_(email), _hashOtpValue_(email, otp), 5 * 60);
    AUTH_CACHE.put(cooldownKey, "1", 60);

    MailApp.sendEmail({
      to: email,
      subject: "Kode OTP SS PD3I",
      body: "Kode OTP Anda adalah: " + otp + "\n\nKode berlaku selama 5 menit.\n\nAbaikan email ini jika Anda tidak meminta OTP."
    });

    return { status: "success", message: "OTP sudah dikirim ke Gmail Anda.", cooldownSec: 60 };
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
    AUTH_CACHE.put("TOKEN_" + token, JSON.stringify({ user: user, ts: nowTs, ttl: ttl }), ttl);
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
    AUTH_CACHE.put("TOKEN_" + token, JSON.stringify({ user: found, ts: nowTs, ttl: ttl }), ttl);

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

    const ttl = obj.ttl || Session_Manager.getTtlForRole(obj.user.role);
    const nowTs = Date.now();
    obj.ts = nowTs;
    obj.ttl = ttl;
    AUTH_CACHE.put("TOKEN_" + token, JSON.stringify(obj), ttl);
    return { status: "success", token: token, user: obj.user, ttlSec: ttl, issuedAt: nowTs, expiresAt: nowTs + (ttl * 1000) };
  } catch (e) {
    return _publicAuthError_(e, "Sesi belum bisa diperiksa. Silakan login ulang.");
  }
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
    const ixKode = headerIndex(["KodePuskesmas", "Kode Puskesmas", "Kode PKM"]);
    const ixScope = headerIndex(["ScopeLevel", "Scope Level"]);
    const ixAktif = headerIndex(["Aktif", "StatusAktif"]);
    const ixCatatan = headerIndex(["Catatan"]);

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
        kodePuskesmas: ixKode !== -1 ? String(row[ixKode] || "").trim() : "",
        scopeLevel: ixScope !== -1 ? String(row[ixScope] || "").trim() : "",
        statusAktif: ixAktif !== -1 ? String(row[ixAktif] || "").trim() : "AKTIF",
        catatan: ixCatatan !== -1 ? String(row[ixCatatan] || "").trim() : ""
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
    const ixKode = headerIndex(["KodePuskesmas", "Kode Puskesmas", "Kode PKM"]);
    const ixScope = headerIndex(["ScopeLevel", "Scope Level"]);
    const ixAktif = headerIndex(["Aktif", "StatusAktif"]);
    const ixCatatan = headerIndex(["Catatan"]);

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
      else if (h === "KodePuskesmas" || h === "Kode Puskesmas" || h === "Kode PKM") val = String(userPayload.kodePuskesmas || "").trim();
      else if (h === "ScopeLevel" || h === "Scope Level") val = String(userPayload.scopeLevel || "puskesmas").trim().toLowerCase();
      else if (h === "Aktif" || h === "StatusAktif") val = String(userPayload.statusAktif || "YA").trim().toUpperCase();
      else if (h === "Catatan") val = String(userPayload.catatan || "").trim();
      else if (h === "LoginMethod" && !val) val = "OTP_GMAIL";
      else if (h === "OtpEnabled" && !val) val = "YA";
      else if (h === "OtpTtlMinutes" && !val) val = 5;
      else if (h === "OtpCooldownSeconds" && !val) val = 60;
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
