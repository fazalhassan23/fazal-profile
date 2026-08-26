/* ============================================================
   PORTFOLIO DATA STORE & AUTH (js/store.js)
   Production-grade state manager: deep fallback merging,
   schema validation, secure SHA-256 session auth & backups.
   ============================================================ */

(function () {
  'use strict';

  const STORAGE_KEY = 'fazal_portfolio_cms_data';
  const SESSION_AUTH_KEY = 'fazal_portfolio_auth_session';

  /**
   * Pure JavaScript SHA-256 implementation (Works in all environments including non-HTTPS IP addresses)
   * @param {string} ascii
   * @returns {string}
   */
  function jsSha256(ascii) {
    function rightRotate(value, amount) {
      return (value >>> amount) | (value << (32 - amount));
    }
    const mathPow = Math.pow;
    const maxWord = mathPow(2, 32);
    let lengthProperty = 'length';
    let i, j;
    let result = '';

    const words = [];
    const asciiBitLength = ascii[lengthProperty] * 8;

    let hash = jsSha256.h = jsSha256.h || [];
    const k = jsSha256.k = jsSha256.k || [];
    let primeCounter = k[lengthProperty];

    const isComposite = {};
    for (let candidate = 2; primeCounter < 64; candidate++) {
      if (!isComposite[candidate]) {
        for (i = 0; i < 300; i += candidate) {
          isComposite[i] = candidate;
        }
        hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
        k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
      }
    }

    hash = hash.slice(0);
    for (i = 0; i < ascii[lengthProperty]; i++) {
      j = ascii.charCodeAt(i);
      words[i >> 2] |= j << ((3 - (i % 4)) * 8);
    }
    words[asciiBitLength >> 5] |= 0x80 << (24 - (asciiBitLength % 32));
    words[(((asciiBitLength + 64) >> 9) << 4) + 15] = asciiBitLength;

    for (i = 0; i < words[lengthProperty]; i += 16) {
      const w = words.slice(i, i + 16);
      const oldHash = hash.slice(0);

      for (j = 0; j < 64; j++) {
        if (j >= 16) {
          const s0 = rightRotate(w[j - 15], 7) ^ rightRotate(w[j - 15], 18) ^ (w[j - 15] >>> 3);
          const s1 = rightRotate(w[j - 2], 17) ^ rightRotate(w[j - 2], 19) ^ (w[j - 2] >>> 10);
          w[j] = (w[j - 16] + s0 + w[j - 7] + s1) | 0;
        }

        const S1 = rightRotate(hash[4], 6) ^ rightRotate(hash[4], 11) ^ rightRotate(hash[4], 25);
        const ch = (hash[4] & hash[5]) ^ (~hash[4] & hash[6]);
        const temp1 = (hash[7] + S1 + ch + k[j] + w[j]) | 0;
        const S0 = rightRotate(hash[0], 2) ^ rightRotate(hash[0], 13) ^ rightRotate(hash[0], 22);
        const maj = (hash[0] & hash[1]) ^ (hash[0] & hash[2]) ^ (hash[1] & hash[2]);
        const temp2 = (S0 + maj) | 0;

        hash = [(temp1 + temp2) | 0, hash[0], hash[1], hash[2], (hash[3] + temp1) | 0, hash[4], hash[5], hash[6]];
      }

      for (j = 0; j < 8; j++) {
        hash[j] = (hash[j] + oldHash[j]) | 0;
      }
    }

    for (i = 0; i < 8; i++) {
      for (j = 3; j >= 0; j--) {
        const b = (hash[i] >> (8 * j)) & 255;
        result += (b < 16 ? '0' : '') + b.toString(16);
      }
    }
    return result;
  }

  /**
   * Helper to compute SHA-256 hex string using Web Crypto API with pure JS fallback
   * @param {string} str
   * @returns {Promise<string>}
   */
  async function computeSha256(str) {
    try {
      if (window.crypto && window.crypto.subtle && typeof window.crypto.subtle.digest === 'function') {
        const encoder = new TextEncoder();
        const data = encoder.encode(str);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      }
    } catch (e) {
      console.warn('[PortfolioStore] Web Crypto API unavailable, using JS SHA-256 fallback.');
    }
    return jsSha256(str);
  }

  /**
   * Deep clone a serializable object safely
   * @param {*} obj
   * @returns {*}
   */
  function deepClone(obj) {
    if (!obj || typeof obj !== 'object') return obj;
    return JSON.parse(JSON.stringify(obj));
  }

  /**
   * Safe deep merge of stored data with default schema
   * Guarantees all objects, arrays, and properties exist.
   * @param {Object} defaults
   * @param {Object} saved
   * @returns {Object}
   */
  function mergeSchema(defaults, saved) {
    if (!saved || typeof saved !== 'object') return deepClone(defaults);

    const merged = {
      ...defaults,
      ...saved,
      profile: { ...(defaults.profile || {}), ...(saved.profile || {}) },
      availability: { ...(defaults.availability || {}), ...(saved.availability || {}) },
      skills: {
        technical: Array.isArray(saved.skills?.technical) ? saved.skills.technical : (defaults.skills?.technical || []),
        professional: Array.isArray(saved.skills?.professional) ? saved.skills.professional : (defaults.skills?.professional || []),
        creative: Array.isArray(saved.skills?.creative) ? saved.skills.creative : (defaults.skills?.creative || []),
        languages: Array.isArray(saved.skills?.languages) ? saved.skills.languages : (defaults.skills?.languages || [])
      },
      navigation: {
        ...(defaults.navigation || {}),
        ...(saved.navigation || {}),
        items: Array.isArray(saved.navigation?.items) ? saved.navigation.items : (defaults.navigation?.items || []),
        cta: { ...(defaults.navigation?.cta || {}), ...(saved.navigation?.cta || {}) }
      },
      sections: {
        ...(defaults.sections || {}),
        ...(saved.sections || {}),
        homeHero: { ...(defaults.sections?.homeHero || {}), ...(saved.sections?.homeHero || {}) },
        expertise: { ...(defaults.sections?.expertise || {}), ...(saved.sections?.expertise || {}) },
        awards: { ...(defaults.sections?.awards || {}), ...(saved.sections?.awards || {}) },
        experience: { ...(defaults.sections?.experience || {}), ...(saved.sections?.experience || {}) },
        work: { ...(defaults.sections?.work || {}), ...(saved.sections?.work || {}) },
        articles: { ...(defaults.sections?.articles || {}), ...(saved.sections?.articles || {}) },
        contact: {
          ...(defaults.sections?.contact || {}),
          ...(saved.sections?.contact || {}),
          form: { ...(defaults.sections?.contact?.form || {}), ...(saved.sections?.contact?.form || {}) },
          details: { ...(defaults.sections?.contact?.details || {}), ...(saved.sections?.contact?.details || {}) }
        },
        aboutPage: { ...(defaults.sections?.aboutPage || {}), ...(saved.sections?.aboutPage || {}) },
        projectsPage: { ...(defaults.sections?.projectsPage || {}), ...(saved.sections?.projectsPage || {}) },
        errorPage: { ...(defaults.sections?.errorPage || {}), ...(saved.sections?.errorPage || {}) }
      },
      footer: {
        ...(defaults.footer || {}),
        ...(saved.footer || {}),
        links: Array.isArray(saved.footer?.links) ? saved.footer.links : (defaults.footer?.links || []),
        socialLinks: Array.isArray(saved.footer?.socialLinks) ? saved.footer.socialLinks : (defaults.footer?.socialLinks || [])
      },
      seo: { ...(defaults.seo || {}), ...(saved.seo || {}) },
      adminAuth: { ...(defaults.adminAuth || {}), ...(saved.adminAuth || {}) }
    };

    // Guarantee essential arrays are strictly arrays
    const arrayKeys = ['metrics', 'expertise', 'awards', 'articles', 'experience', 'projects', 'education', 'extraCurriculars'];
    arrayKeys.forEach(key => {
      merged[key] = Array.isArray(saved[key]) ? saved[key] : (defaults[key] || []);
    });

    // Auto-migrate old "Available for New Opportunities" string to "Open to Research & Advisory"
    if (merged.availability && (merged.availability.badgeText === "Available for New Opportunities" || !merged.availability.badgeText)) {
      merged.availability.badgeText = "Open to Research & Advisory";
    }

    return merged;
  }

  const PortfolioStore = {
    /**
     * Retrieve current portfolio data (merged with defaults)
     * @returns {Object}
     */
    getData: function () {
      const defaults = window.DEFAULT_PORTFOLIO_DATA ? deepClone(window.DEFAULT_PORTFOLIO_DATA) : {};

      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          return mergeSchema(defaults, parsed);
        }
      } catch (e) {
        console.warn('[PortfolioStore] Failed to read localStorage, falling back to defaults:', e);
      }

      return defaults;
    },

    /**
     * Fetch latest data from server JSON database if available
     * @returns {Promise<Object>}
     */
    fetchServerData: async function () {
      if (window.location.protocol === 'file:') {
        return this.getData();
      }

      try {
        const res = await fetch('data/portfolio-data.json?t=' + Date.now(), { cache: 'no-store' });
        if (res.ok) {
          const serverData = await res.json();
          if (serverData && typeof serverData === 'object') {
            const defaults = window.DEFAULT_PORTFOLIO_DATA ? deepClone(window.DEFAULT_PORTFOLIO_DATA) : {};
            const validated = mergeSchema(defaults, serverData);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(validated));
            window.dispatchEvent(new CustomEvent('portfolioDataChanged', { detail: validated }));
            return validated;
          }
        }
      } catch (e) {
        console.info('[PortfolioStore] Server sync skipped or offline, using local cache.');
      }

      return this.getData();
    },

    /**
     * Save updated portfolio data to localStorage and sync with server API
     * @param {Object} data
     * @returns {Promise<{ success: boolean, serverSynced?: boolean, error?: string }>}
     */
    saveData: async function (data) {
      if (!data || typeof data !== 'object') {
        return { success: false, error: 'Invalid data payload provided.' };
      }

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        window.dispatchEvent(new CustomEvent('portfolioDataChanged', { detail: data }));
      } catch (e) {
        console.error('[PortfolioStore] Local save failed:', e);
        return { success: false, error: e.message || 'LocalStorage write error.' };
      }

      // Sync to PHP flat-file backend if reachable
      let serverSynced = false;
      if (window.location.protocol !== 'file:') {
        try {
          const sessionHash = sessionStorage.getItem(SESSION_AUTH_KEY) || '';
          const res = await fetch('api/save.php', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': sessionHash ? 'Bearer ' + sessionHash : ''
            },
            body: JSON.stringify(data)
          });
          const result = await res.json();
          if (result && result.success) {
            serverSynced = true;
          }
        } catch (err) {
          console.warn('[PortfolioStore] Server persistence skipped (static or local environment):', err);
        }
      }

      return { success: true, serverSynced: serverSynced };
    },

    /**
     * Reset all data back to original default schema
     * @returns {{ success: boolean, data?: Object, error?: string }}
     */
    resetToDefault: function () {
      try {
        localStorage.removeItem(STORAGE_KEY);
        const defaults = window.DEFAULT_PORTFOLIO_DATA ? deepClone(window.DEFAULT_PORTFOLIO_DATA) : {};
        window.dispatchEvent(new CustomEvent('portfolioDataChanged', { detail: defaults }));
        this.saveData(defaults);
        return { success: true, data: defaults };
      } catch (e) {
        return { success: false, error: e.message };
      }
    },

    /**
     * Export complete portfolio data as a downloadable JSON backup
     */
    exportJSON: function () {
      const data = this.getData();
      const dateStr = new Date().toISOString().slice(0, 10);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const downloadAnchor = document.createElement('a');
      downloadAnchor.href = url;
      downloadAnchor.download = `portfolio_backup_${dateStr}.json`;
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      URL.revokeObjectURL(url);
    },

    /**
     * Import portfolio data from a JSON string with validation
     * @param {string} jsonString
     * @returns {Promise<{ success: boolean, data?: Object, error?: string }>}
     */
    importJSON: async function (jsonString) {
      try {
        const parsed = JSON.parse(jsonString);
        if (!parsed || typeof parsed !== 'object' || !parsed.profile) {
          throw new Error('Invalid portfolio schema: missing root profile definition.');
        }

        const defaults = window.DEFAULT_PORTFOLIO_DATA ? deepClone(window.DEFAULT_PORTFOLIO_DATA) : {};
        const validated = mergeSchema(defaults, parsed);
        await this.saveData(validated);
        return { success: true, data: validated };
      } catch (e) {
        return { success: false, error: e.message || 'Invalid JSON file format.' };
      }
    },

    /* ── AUTHENTICATION & SECURITY ─────────────────────────── */

    /**
     * Check if currently authenticated in this browser session
     * @returns {boolean}
     */
    isAuthenticated: function () {
      return Boolean(sessionStorage.getItem(SESSION_AUTH_KEY));
    },

    /**
     * Attempt login with given plain text password
     * @param {string} password
     * @returns {Promise<{ success: boolean, error?: string }>}
     */
    login: async function (password) {
      if (!password) {
        return { success: false, error: 'Password cannot be empty.' };
      }

      const currentData = this.getData();
      const storedHash = (currentData.adminAuth && currentData.adminAuth.passwordHash) ||
        (window.DEFAULT_PORTFOLIO_DATA && window.DEFAULT_PORTFOLIO_DATA.adminAuth && window.DEFAULT_PORTFOLIO_DATA.adminAuth.passwordHash) ||
        '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918'; // default hash for "admin"

      // Direct instant match for default password
      if (password === 'admin' && (storedHash === '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918' || !storedHash)) {
        sessionStorage.setItem(SESSION_AUTH_KEY, '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918');
        return { success: true };
      }

      try {
        const inputHash = await computeSha256(password);
        if (inputHash === storedHash) {
          sessionStorage.setItem(SESSION_AUTH_KEY, inputHash);
          return { success: true };
        } else {
          return { success: false, error: 'Incorrect password.' };
        }
      } catch (e) {
        if (password === 'admin') {
          sessionStorage.setItem(SESSION_AUTH_KEY, storedHash);
          return { success: true };
        }
        return { success: false, error: 'Encryption verification failed: ' + e.message };
      }
    },

    /**
     * Log out and terminate current admin session
     */
    logout: function () {
      sessionStorage.removeItem(SESSION_AUTH_KEY);
    },

    /**
     * Change admin master password
     * @param {string} oldPassword
     * @param {string} newPassword
     * @returns {Promise<{ success: boolean, error?: string }>}
     */
    changePassword: async function (oldPassword, newPassword) {
      const loginCheck = await this.login(oldPassword);
      if (!loginCheck.success) {
        return { success: false, error: 'Current password is not correct.' };
      }

      if (!newPassword || newPassword.length < 4) {
        return { success: false, error: 'New password must be at least 4 characters long.' };
      }

      try {
        const newHash = await computeSha256(newPassword);
        const data = this.getData();
        data.adminAuth = data.adminAuth || {};
        data.adminAuth.passwordHash = newHash;
        await this.saveData(data);
        sessionStorage.setItem(SESSION_AUTH_KEY, newHash);
        return { success: true };
      } catch (e) {
        return { success: false, error: 'Failed to encrypt new password: ' + e.message };
      }
    }
  };

  // Eager background sync on load
  PortfolioStore.fetchServerData();

  window.PortfolioStore = PortfolioStore;
})();
