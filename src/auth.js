function authLogin(username, pin) {
  try {
    username = String(username || "").trim();
    pin = String(pin || "").trim();

    if (!username || !pin) {
      return { status: "error", message: "Username dan PIN wajib diisi." };
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
      return { status: "error", message: "Kolom Username/PIN belum ada di REF_USER." };
    }

    const uLower = username.toLowerCase();
    let found = null;

    for (const r of rows) {
      const u = String(r[ixUser] || "").trim();
      if (!u) continue;
      if (u.toLowerCase() !== uLower) continue;

      if (ixAktif !== -1) {
        const aktif = String(r[ixAktif] || "").trim().toUpperCase();
        if (aktif && aktif !== "YA" && aktif !== "AKTIF") {
          return { status: "error", message: "Akun tidak aktif." };
        }
      }

      const p = String(r[ixPin] || "").trim();
      if (p !== pin) {
        return { status: "error", message: "Password/PIN salah." };
      }

      found = {
        username: u,
        nama: (ixNama !== -1 ? String(r[ixNama] || "").trim() : u) || u,
        role: ixRole !== -1 ? String(r[ixRole] || "").trim().toLowerCase() : ""
      };
      break;
    }

    if (!found) {
      return { status: "error", message: "Username tidak ditemukan." };
    }

    const token = Utilities.getUuid();
    const ttl = Session_Manager.getTtlForRole(found.role);
    AUTH_CACHE.put("TOKEN_" + token, JSON.stringify({ user: found, ts: Date.now(), ttl: ttl }), ttl);

    return { status: "success", token: token, user: found };
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
    AUTH_CACHE.put("TOKEN_" + token, JSON.stringify(obj), ttl);
    return { status: "success", user: obj.user };
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

function authChangePin(token, oldPin, newPin) {
  try {
    oldPin = String(oldPin || "").trim();
    newPin = String(newPin || "").trim();

    const sess = _getSessionFromToken_(token);
    if (!sess.ok) {
      return { status: "error", message: sess.message || "Sesi habis. Login ulang." };
    }

    if (newPin.length < 6) {
      return { status: "error", message: "PIN baru minimal 6 karakter." };
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
      return { status: "error", message: "Kolom Username/PIN belum ada di REF_USER." };
    }

    for (let i = 1; i < data.length; i++) {
      const u = String(data[i][ixUser] || "").trim();
      if (u.toLowerCase() !== username.toLowerCase()) continue;

      const p = String(data[i][ixPin] || "").trim();
      if (p !== oldPin) {
        return { status: "error", message: "PIN lama salah." };
      }

      sh.getRange(i + 1, ixPin + 1).setValue(newPin);
      return { status: "success", message: "PIN berhasil diubah." };
    }

    return { status: "error", message: "User tidak ditemukan." };
  } catch (e) {
    return { status: "error", message: String(e) };
  }
}
