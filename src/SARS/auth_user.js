/******************************************************
 * auth_user.gs — fungsi user/default sederhana
 ******************************************************/

function getActiveUserEmail() {
  try {
    return Session.getActiveUser().getEmail() || "";
  } catch (e) {
    return "";
  }
}

// Jika Anda punya mapping default WA per user, taruh di sini.
function getDefaultWA() {
  return "";
}

function getDefaultFacilityType() {
  // ✅ default klinik
  return "klinik";
}

function getDefaultFacilityName() {
  return "";
}
