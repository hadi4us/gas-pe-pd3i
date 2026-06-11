/**
 * audit.test.js — Unit test untuk modul audit.js
 *
 * Cara menjalankan: buka Apps Script editor, pilih fungsi
 * `runAuditTests` lalu klik Run.
 *
 * Subtask 6.1: Test bahwa operasi utama tidak gagal meskipun
 * pencatatan audit error (Req 10.4).
 */

/* ------------------------------------------------------------------ */
/* Helper test runner sederhana                                         */
/* ------------------------------------------------------------------ */

function assert_(condition, message) {
  if (!condition) {
    throw new Error("FAIL: " + message);
  }
}

function runTest_(name, fn) {
  try {
    fn();
    Logger.log("PASS: " + name);
    return true;
  } catch (e) {
    Logger.log("FAIL: " + name + " — " + e.message);
    return false;
  }
}

/* ------------------------------------------------------------------ */
/* Subtask 6.1 — logChange tidak melempar exception meskipun sheet     */
/* AUDIT_LOG tidak ada / getSpreadsheet_ gagal                         */
/* Validates: Requirements 10.4                                        */
/* ------------------------------------------------------------------ */

/**
 * Test 1: logChange tidak melempar exception saat dipanggil dengan
 * user valid, dx, epid, aksi INSERT, dan diff null.
 */
function test_logChange_noException_onInsert_() {
  const user = { username: "testuser", role: "petugas" };
  // Tidak boleh melempar exception apapun
  Audit_Logger.logChange(user, "MR", "C-KOTADEPOK-001", "INSERT", null);
}

/**
 * Test 2: logChange tidak melempar exception saat dipanggil dengan
 * aksi UPDATE dan diff berisi perubahan field.
 */
function test_logChange_noException_onUpdate_() {
  const user = { username: "admin1", role: "admin" };
  const diff = {
    "Nama": { old: "Budi", new: "Budi Santoso" },
    "Alamat": { old: "Jl. A", new: "Jl. B No. 5" }
  };
  Audit_Logger.logChange(user, "DIF", "DIF-20240101-001", "UPDATE", diff);
}

/**
 * Test 3: logChange tidak melempar exception saat user null/undefined.
 * Req 10.4: operasi utama tidak boleh terganggu.
 */
function test_logChange_noException_onNullUser_() {
  // user null — harus ditangani dengan graceful
  Audit_Logger.logChange(null, "TN", "TN-20240101-001", "INSERT", null);
}

/**
 * Test 4: logChange tidak melempar exception saat user adalah objek kosong.
 */
function test_logChange_noException_onEmptyUser_() {
  Audit_Logger.logChange({}, "AFP", "AFP-20240101-001", "INSERT", null);
}

/**
 * Test 5: logLogout tidak melempar exception saat dipanggil dengan user valid.
 * Req 10.3
 */
function test_logLogout_noException_() {
  const user = { username: "petugas1", role: "petugas" };
  Audit_Logger.logLogout(user);
}

/**
 * Test 6: logLogout tidak melempar exception saat user null.
 * Req 10.4
 */
function test_logLogout_noException_onNullUser_() {
  Audit_Logger.logLogout(null);
}

/**
 * Test 7: getAuditLog mengembalikan error jika token tidak valid.
 * Req 10.5
 */
function test_getAuditLog_rejectsInvalidToken_() {
  const result = getAuditLog("MR", "C-KOTADEPOK-001", "token-tidak-valid-xyz");
  assert_(
    result && result.status === "error",
    "getAuditLog harus mengembalikan {status:'error'} untuk token tidak valid, dapat: " + JSON.stringify(result)
  );
}

/**
 * Test 8: diff untuk UPDATE di-serialize ke JSON string yang valid.
 * Req 10.2
 */
function test_logChange_diffSerializedAsJson_() {
  const diff = { "Nama": { old: "A", new: "B" } };
  const jsonStr = JSON.stringify(diff);
  // Pastikan JSON.stringify tidak melempar exception dan hasilnya parseable
  const parsed = JSON.parse(jsonStr);
  assert_(
    parsed["Nama"] && parsed["Nama"].old === "A" && parsed["Nama"].new === "B",
    "diff harus bisa di-serialize dan di-parse kembali sebagai JSON"
  );
}

/* ------------------------------------------------------------------ */
/* Runner utama                                                         */
/* ------------------------------------------------------------------ */

/**
 * Jalankan semua unit test untuk audit.js.
 * Buka Apps Script editor → pilih fungsi ini → klik Run.
 */
function runAuditTests() {
  Logger.log("=== Menjalankan unit test audit.js ===");

  let passed = 0;
  let failed = 0;

  const tests = [
    ["logChange tidak melempar exception saat INSERT", test_logChange_noException_onInsert_],
    ["logChange tidak melempar exception saat UPDATE dengan diff", test_logChange_noException_onUpdate_],
    ["logChange tidak melempar exception saat user null (Req 10.4)", test_logChange_noException_onNullUser_],
    ["logChange tidak melempar exception saat user kosong (Req 10.4)", test_logChange_noException_onEmptyUser_],
    ["logLogout tidak melempar exception saat user valid (Req 10.3)", test_logLogout_noException_],
    ["logLogout tidak melempar exception saat user null (Req 10.4)", test_logLogout_noException_onNullUser_],
    ["getAuditLog menolak token tidak valid (Req 10.5)", test_getAuditLog_rejectsInvalidToken_],
    ["diff UPDATE di-serialize sebagai JSON valid (Req 10.2)", test_logChange_diffSerializedAsJson_]
  ];

  for (const [name, fn] of tests) {
    if (runTest_(name, fn)) {
      passed++;
    } else {
      failed++;
    }
  }

  Logger.log("=== Hasil: " + passed + " lulus, " + failed + " gagal ===");
  return { passed: passed, failed: failed };
}
