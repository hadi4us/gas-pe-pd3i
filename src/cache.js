/**
 * cache.js — Cache_Manager
 * Membungkus CacheService untuk caching data sheet dengan strategi chunking.
 *
 * Strategi chunking:
 *   - Jika JSON data > 90KB, dibagi menjadi entri CACHE_{sheetName}_0, CACHE_{sheetName}_1, dst.
 *   - Entri meta CACHE_{sheetName}_META berisi { chunks, ts, ttl }
 *   - Jika data <= 90KB, disimpan langsung di CACHE_{sheetName}_META dengan field `data`
 *
 * TTL default: 60 detik (dapat di-override via getConfig("CACHE_TTL_SEC"))
 */

const Cache_Manager = (function () {
  const CHUNK_SIZE_BYTES = 90 * 1024; // 90KB per chunk

  /**
   * Ambil TTL dari config jika tersedia, fallback ke 60 detik.
   * @returns {number}
   */
  function _getTtl_() {
    try {
      if (typeof getConfig === "function") {
        const val = parseInt(getConfig("CACHE_TTL_SEC"), 10);
        if (!isNaN(val) && val > 0) return val;
      }
    } catch (e) {
      // getConfig belum tersedia, gunakan default
    }
    return 60;
  }

  /**
   * Hitung ukuran string dalam bytes (UTF-8 approx).
   * @param {string} str
   * @returns {number}
   */
  function _byteLength_(str) {
    // Approximasi: setiap karakter bisa 1-4 byte; untuk ASCII murni = 1 byte.
    // Gunakan encodeURIComponent untuk estimasi akurat.
    return encodeURIComponent(str).replace(/%[0-9A-F]{2}/g, "x").length;
  }

  /**
   * Bagi string menjadi array chunk dengan ukuran maksimum CHUNK_SIZE_BYTES.
   * @param {string} str
   * @returns {string[]}
   */
  function _splitIntoChunks_(str) {
    const chunks = [];
    let start = 0;
    while (start < str.length) {
      // Potong berdasarkan karakter; estimasi konservatif
      let end = start + Math.floor(CHUNK_SIZE_BYTES / 4); // worst case 4 bytes/char
      if (end > str.length) end = str.length;
      // Pastikan chunk tidak melebihi CHUNK_SIZE_BYTES
      let chunk = str.slice(start, end);
      while (_byteLength_(chunk) > CHUNK_SIZE_BYTES && end > start + 1) {
        end--;
        chunk = str.slice(start, end);
      }
      chunks.push(chunk);
      start = end;
    }
    return chunks;
  }

  /**
   * Ambil data sheet dari cache.
   * @param {string} sheetName
   * @returns {Array[]|null} Data sheet atau null jika cache miss/expired
   */
  function getSheetData(sheetName) {
    const SHEET_CACHE = CacheService.getScriptCache();
    const metaKey = "CACHE_" + sheetName + "_META";
    const metaRaw = SHEET_CACHE.get(metaKey);
    if (!metaRaw) return null;

    let meta;
    try {
      meta = JSON.parse(metaRaw);
    } catch (e) {
      return null;
    }

    const ttl = _getTtl_();
    const now = Date.now();
    if (!meta || !meta.ts || (now - meta.ts) > ttl * 1000) {
      // Cache expired
      _deleteAllChunks_(SHEET_CACHE, sheetName, meta ? meta.chunks : 0);
      SHEET_CACHE.remove(metaKey);
      return null;
    }

    // Data kecil: tersimpan langsung di meta
    if (meta.chunks === 0 && meta.data !== undefined) {
      try {
        return JSON.parse(meta.data);
      } catch (e) {
        return null;
      }
    }

    // Data besar: gabungkan chunk
    const parts = [];
    for (let i = 0; i < meta.chunks; i++) {
      const chunkKey = "CACHE_" + sheetName + "_" + i;
      const part = SHEET_CACHE.get(chunkKey);
      if (part === null) return null; // chunk hilang, cache miss
      parts.push(part);
    }

    try {
      return JSON.parse(parts.join(""));
    } catch (e) {
      return null;
    }
  }

  /**
   * Simpan data sheet ke cache dengan strategi chunking.
   * @param {string} sheetName
   * @param {Array[]} data
   */
  function setSheetData(sheetName, data) {
    const SHEET_CACHE = CacheService.getScriptCache();
    const ttl = _getTtl_();
    const now = Date.now();
    const json = JSON.stringify(data);
    const metaKey = "CACHE_" + sheetName + "_META";

    if (_byteLength_(json) <= CHUNK_SIZE_BYTES) {
      // Data kecil: simpan langsung di meta
      const meta = { chunks: 0, ts: now, ttl: ttl, data: json };
      SHEET_CACHE.put(metaKey, JSON.stringify(meta), ttl);
    } else {
      // Data besar: chunking
      const chunks = _splitIntoChunks_(json);
      const cacheMap = {};
      chunks.forEach(function (chunk, i) {
        cacheMap["CACHE_" + sheetName + "_" + i] = chunk;
      });
      const meta = { chunks: chunks.length, ts: now, ttl: ttl };
      cacheMap[metaKey] = JSON.stringify(meta);
      SHEET_CACHE.putAll(cacheMap, ttl);
    }
  }

  /**
   * Hapus semua chunk untuk sheetName tertentu.
   * @param {GoogleAppsScript.Cache.Cache} cache
   * @param {string} sheetName
   * @param {number} chunkCount
   */
  function _deleteAllChunks_(cache, sheetName, chunkCount) {
    const keys = [];
    for (let i = 0; i < chunkCount; i++) {
      keys.push("CACHE_" + sheetName + "_" + i);
    }
    if (keys.length > 0) {
      cache.removeAll(keys);
    }
  }

  /**
   * Invalidasi cache untuk sheet tertentu.
   * Dapat dipanggil oleh modul lain setelah operasi tulis.
   * @param {string} sheetName
   */
  function invalidateSheetCache(sheetName) {
    const SHEET_CACHE = CacheService.getScriptCache();
    const metaKey = "CACHE_" + sheetName + "_META";
    const metaRaw = SHEET_CACHE.get(metaKey);

    let chunkCount = 0;
    if (metaRaw) {
      try {
        const meta = JSON.parse(metaRaw);
        chunkCount = meta && meta.chunks ? meta.chunks : 0;
      } catch (e) {
        // ignore
      }
    }

    _deleteAllChunks_(SHEET_CACHE, sheetName, chunkCount);
    SHEET_CACHE.remove(metaKey);
  }

  /**
   * Invalidasi seluruh cache sheet yang dikelola Cache_Manager.
   * Karena CacheService tidak mendukung list keys, fungsi ini hanya
   * menginvalidasi sheet yang namanya diketahui secara eksplisit.
   */
  function invalidateAll() {
    const knownSheets = ["MR_Raw", "DIF_Raw", "PERT_Raw", "TN_Raw", "AFP_Raw",
                         "REF_USER", "REF_FASKES", "REF_PENGAMPU", "AUDIT_LOG"];
    knownSheets.forEach(function (sheetName) {
      invalidateSheetCache(sheetName);
    });
  }

  return {
    getSheetData: getSheetData,
    setSheetData: setSheetData,
    invalidateSheetCache: invalidateSheetCache,
    invalidateAll: invalidateAll
  };
})();
