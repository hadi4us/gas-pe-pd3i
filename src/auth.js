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

  return {
    unitKerja: ixUnit !== -1 ? String(row[ixUnit] || "").trim() : "",
    kodePuskesmas: ixKode !== -1 ? String(row[ixKode] || "").trim() : "",
    scopeLevel: ixScope !== -1 ? String(row[ixScope] || "").trim().toLowerCase() : ""
  };
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
    return { status: "error", message: String(e) };
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
    return { status: "success", user: obj.user, ttlSec: ttl, issuedAt: nowTs, expiresAt: nowTs + (ttl * 1000) };
  } catch (e) {
    return { status: "error", message: String(e) };
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
    return { status: "error", message: String(e) };
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
    return { status: "error", message: String(e) };
  }
}
