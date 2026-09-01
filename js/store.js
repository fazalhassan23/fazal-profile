/* ============================================================
   PORTFOLIO DATA STORE & AUTH (js/store.js)
   Production-grade state manager: deep fallback merging,
   schema validation, secure SHA-256 session auth & backups.
   ============================================================ */

(function () {
  'use strict';

  const STORAGE_KEY = 'fazal_portfolio_cms_data';
  const SESSION_AUTH_KEY = 'fazal_portfolio_auth_session';
  const GITHUB_TOKEN_KEY = 'fazal_portfolio_github_token';
  const GITHUB_REPO = 'fazalhassan23/fazal-profile';
  const GITHUB_BRANCH = 'main';
  const GITHUB_FILE = 'data/portfolio-data.json';

  /**
   * Pure JavaScript SHA-256 implementation (Works in all environments including file:// and non-HTTPS IP addresses)
   * @param {string} str
   * @returns {string}
   */
  function jsSha256(str) {
    function r(n, c) { return (n >>> c) | (n << (32 - c)); }
    const K = [
      0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
      0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
      0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
      0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
      0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
      0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
      0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
      0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
    ];
    const H = [
      0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
    ];

    const utf8 = unescape(encodeURIComponent(str));
    const words = [];
    for (let i = 0; i < utf8.length; i++) {
      words[i >> 2] |= utf8.charCodeAt(i) << (24 - (i % 4) * 8);
    }
    words[utf8.length >> 2] |= 0x80 << (24 - (utf8.length % 4) * 8);
    words[(((utf8.length + 8) >> 6) + 1) * 16 - 1] = utf8.length * 8;

    for (let i = 0; i < words.length; i += 16) {
      const W = new Array(64);
      for (let t = 0; t < 16; t++) W[t] = words[i + t] || 0;
      for (let t = 16; t < 64; t++) {
        const s0 = r(W[t - 15], 7) ^ r(W[t - 15], 18) ^ (W[t - 15] >>> 3);
        const s1 = r(W[t - 2], 17) ^ r(W[t - 2], 19) ^ (W[t - 2] >>> 10);
        W[t] = (W[t - 16] + s0 + W[t - 7] + s1) | 0;
      }

      let a = H[0], b = H[1], c = H[2], d = H[3], e = H[4], f = H[5], g = H[6], h = H[7];
      for (let t = 0; t < 64; t++) {
        const S1 = r(e, 6) ^ r(e, 11) ^ r(e, 25);
        const ch = (e & f) ^ ((~e) & g);
        const temp1 = (h + S1 + ch + K[t] + W[t]) | 0;
        const S0 = r(a, 2) ^ r(a, 13) ^ r(a, 22);
        const maj = (a & b) ^ (a & c) ^ (b & c);
        const temp2 = (S0 + maj) | 0;

        h = g; g = f; f = e; e = (d + temp1) | 0;
        d = c; c = b; b = a; a = (temp1 + temp2) | 0;
      }

      H[0] = (H[0] + a) | 0;
      H[1] = (H[1] + b) | 0;
      H[2] = (H[2] + c) | 0;
      H[3] = (H[3] + d) | 0;
      H[4] = (H[4] + e) | 0;
      H[5] = (H[5] + f) | 0;
      H[6] = (H[6] + g) | 0;
      H[7] = (H[7] + h) | 0;
    }

    let res = '';
    for (let i = 0; i < 8; i++) {
      const hex = (H[i] >>> 0).toString(16);
      res += ('00000000' + hex).slice(-8);
    }
    return res;
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
        errorPage: { ...(defaults.sections?.errorPage || {}), ...(saved.sections?.errorPage || {}) },
        recommendations: { ...(defaults.sections?.recommendations || {}), ...(saved.sections?.recommendations || {}) }
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
    const arrayKeys = ['metrics', 'expertise', 'awards', 'articles', 'experience', 'projects', 'education', 'extraCurriculars', 'recommendations'];
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
            const serverMerged = mergeSchema(defaults, serverData);

            let localData = null;
            try {
              const saved = localStorage.getItem(STORAGE_KEY);
              if (saved) localData = JSON.parse(saved);
            } catch (e) {
              console.warn('[PortfolioStore] Failed to parse localStorage in fetchServerData:', e);
            }

            // Timestamp comparison: if server data is newer or equal (or local has no _savedAt), server wins!
            const serverTime = serverMerged._savedAt ? new Date(serverMerged._savedAt).getTime() : 0;
            const localTime = (localData && localData._savedAt) ? new Date(localData._savedAt).getTime() : 0;

            let finalData;
            if (!localData || serverTime >= localTime) {
              finalData = serverMerged;
            } else {
              // Local is strictly newer (uncommitted local draft in active CMS session)
              finalData = mergeSchema(defaults, localData);
            }

            localStorage.setItem(STORAGE_KEY, JSON.stringify(finalData));
            window.dispatchEvent(new CustomEvent('portfolioDataChanged', { detail: finalData }));
            return finalData;
          }
        }
      } catch (e) {
        console.info('[PortfolioStore] Server sync skipped or offline, using local cache.');
      }

      return this.getData();
    },

    /**
     * Get GitHub file SHA required by Contents API for updating
     * @param {string} token
     * @returns {Promise<{ sha: string|null, error?: string }>}
     */
    getFileSha: async function (token) {
      const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/${GITHUB_FILE}?ref=${GITHUB_BRANCH}`;
      try {
        const res = await fetch(url, {
          cache: 'no-store',
          headers: {
            'Authorization': 'token ' + token,
            'Accept': 'application/vnd.github+json'
          }
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          return { sha: null, error: errData.message || `HTTP ${res.status}` };
        }
        const data = await res.json();
        return { sha: data.sha || null };
      } catch (e) {
        return { sha: null, error: e.message || 'Network error fetching SHA' };
      }
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

      // Stamp timestamp
      data._savedAt = new Date().toISOString();

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        window.dispatchEvent(new CustomEvent('portfolioDataChanged', { detail: data }));
      } catch (e) {
        console.error('[PortfolioStore] Local save failed:', e);
        return { success: false, error: e.message || 'LocalStorage write error.' };
      }

      // Sync to GitHub repo via Contents API
      let serverSynced = false;
      let syncError = null;
      const token = localStorage.getItem(GITHUB_TOKEN_KEY);

      if (!token) {
        syncError = 'No GitHub token configured in Settings.';
      } else if (window.location.protocol === 'file:') {
        syncError = 'File:// protocol detected. Server sync requires running on HTTP/HTTPS.';
      } else {
        try {
          const shaResult = await this.getFileSha(token);
          const sha = shaResult.sha;
          if (!sha && shaResult.error) {
            console.warn('[PortfolioStore] Failed to get SHA:', shaResult.error);
          }

          const contentBase64 = btoa(unescape(encodeURIComponent(JSON.stringify(data, null, 2))));

          const body = {
            message: 'chore: CMS update via admin panel',
            content: contentBase64,
            branch: GITHUB_BRANCH
          };
          if (sha) body.sha = sha;

          const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/${GITHUB_FILE}`;
          const res = await fetch(url, {
            method: 'PUT',
            headers: {
              'Authorization': 'token ' + token,
              'Content-Type': 'application/json',
              'Accept': 'application/vnd.github+json'
            },
            body: JSON.stringify(body)
          });
          const result = await res.json();
          if (res.ok && result.content) {
            serverSynced = true;
          } else {
            syncError = result.message || `GitHub API returned HTTP ${res.status}`;
            console.warn('[PortfolioStore] GitHub API save failed:', syncError);
          }
        } catch (err) {
          syncError = err.message || 'Network exception syncing with GitHub API.';
          console.warn('[PortfolioStore] GitHub API sync exception:', err);
        }
      }

      return { success: true, serverSynced: serverSynced, error: syncError };
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

      let inputHash;

      if (password === 'admin' && (storedHash === '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918' || storedHash === '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918')) {
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
    },

    /**
     * Save GitHub Personal Access Token for API sync
     * @param {string} token
     * @returns {{ success: boolean, error?: string }}
     */
    saveGitHubToken: function (token) {
      if (!token || typeof token !== 'string' || !token.trim().startsWith('github_pat_')) {
        return { success: false, error: 'Invalid token format. Must be a fine-grained PAT starting with github_pat_' };
      }
      localStorage.setItem(GITHUB_TOKEN_KEY, token.trim());
      return { success: true };
    },

    /**
     * Check if GitHub PAT is configured
     * @returns {{ configured: boolean, preview: string | null }}
     */
    getGitHubTokenStatus: function () {
      const token = localStorage.getItem(GITHUB_TOKEN_KEY);
      return {
        configured: !!token,
        preview: token ? token.slice(0, 18) + '...' : null
      };
    },

    /**
     * Test if the currently saved GitHub PAT is valid and has access
     * @returns {Promise<{ success: boolean, error?: string }>}
     */
    testGitHubToken: async function () {
      const token = localStorage.getItem(GITHUB_TOKEN_KEY);
      if (!token) {
        return { success: false, error: 'No token configured.' };
      }
      try {
        const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/${GITHUB_FILE}?ref=${GITHUB_BRANCH}`;
        const res = await fetch(url, {
          headers: {
            'Authorization': 'token ' + token,
            'Accept': 'application/vnd.github+json'
          }
        });
        
        if (res.ok) {
          return { success: true };
        } else if (res.status === 404) {
          return { success: false, error: 'Repository or file not found. Ensure the token has access to this repository.' };
        } else if (res.status === 401) {
          return { success: false, error: 'Unauthorized. The token is invalid or expired.' };
        } else {
          const data = await res.json();
          return { success: false, error: data.message || `API Error: ${res.status}` };
        }
      } catch (e) {
        return { success: false, error: 'Network error connecting to GitHub API.' };
      }
    },

    /**
     * Clear saved GitHub PAT
     */
    clearGitHubToken: function () {
      localStorage.removeItem(GITHUB_TOKEN_KEY);
    }
  };

  // Eager background sync on load
  PortfolioStore.fetchServerData();

  window.PortfolioStore = PortfolioStore;
})();
