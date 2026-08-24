/* ============================================================
   PORTFOLIO DATA STORE & AUTH (js/store.js)
   Handles loading from localStorage, password security,
   session authentication, importing, and exporting.
   ============================================================ */

(function () {
  const STORAGE_KEY = 'fazal_portfolio_cms_data';
  const SESSION_AUTH_KEY = 'fazal_portfolio_auth_session';

  /**
   * Helper to compute SHA-256 hex string
   */
  async function computeSha256(str) {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  const PortfolioStore = {
    /**
     * Retrieve current portfolio data (from localStorage if present, else default)
     */
    getData: function () {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          return parsed;
        }
      } catch (e) {
        console.warn('Could not read portfolio data from localStorage:', e);
      }

      // Fallback to default
      if (window.DEFAULT_PORTFOLIO_DATA) {
        return JSON.parse(JSON.stringify(window.DEFAULT_PORTFOLIO_DATA));
      }

      return {};
    },

    /**
     * Save updated portfolio data to localStorage
     */
    saveData: function (data) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        window.dispatchEvent(new CustomEvent('portfolioDataChanged', { detail: data }));
        return { success: true };
      } catch (e) {
        console.error('Failed to save to localStorage:', e);
        return { success: false, error: e.message };
      }
    },

    /**
     * Reset data back to default data
     */
    resetToDefault: function () {
      try {
        localStorage.removeItem(STORAGE_KEY);
        const defaults = JSON.parse(JSON.stringify(window.DEFAULT_PORTFOLIO_DATA || {}));
        window.dispatchEvent(new CustomEvent('portfolioDataChanged', { detail: defaults }));
        return { success: true, data: defaults };
      } catch (e) {
        return { success: false, error: e.message };
      }
    },

    /**
     * Export data as a downloadable JSON file
     */
    exportJSON: function () {
      const data = this.getData();
      const jsonString = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", jsonString);
      downloadAnchor.setAttribute("download", `portfolio_backup_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    },

    /**
     * Import data from a JSON file string
     */
    importJSON: function (jsonString) {
      try {
        const parsed = JSON.parse(jsonString);
        if (!parsed.profile || !parsed.experience) {
          throw new Error("Invalid portfolio schema: missing essential profile or experience fields.");
        }
        this.saveData(parsed);
        return { success: true, data: parsed };
      } catch (e) {
        return { success: false, error: e.message };
      }
    },

    /* ── AUTHENTICATION & SECURITY ─────────────────────────── */

    /**
     * Check if currently authenticated in this browser session
     */
    isAuthenticated: function () {
      return sessionStorage.getItem(SESSION_AUTH_KEY) === 'authenticated_true';
    },

    /**
     * Attempt login with given plain text password
     */
    login: async function (password) {
      const currentData = this.getData();
      const storedHash = (currentData.adminAuth && currentData.adminAuth.passwordHash) ||
        (window.DEFAULT_PORTFOLIO_DATA && window.DEFAULT_PORTFOLIO_DATA.adminAuth && window.DEFAULT_PORTFOLIO_DATA.adminAuth.passwordHash) ||
        "8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918"; // default hash for "admin"

      const inputHash = await computeSha256(password);
      if (inputHash === storedHash) {
        sessionStorage.setItem(SESSION_AUTH_KEY, 'authenticated_true');
        return { success: true };
      } else {
        return { success: false, error: 'Incorrect password' };
      }
    },

    /**
     * Log out and terminate current admin session
     */
    logout: function () {
      sessionStorage.removeItem(SESSION_AUTH_KEY);
    },

    /**
     * Change admin password
     */
    changePassword: async function (oldPassword, newPassword) {
      const loginCheck = await this.login(oldPassword);
      if (!loginCheck.success) {
        return { success: false, error: 'Current password is not correct.' };
      }

      if (!newPassword || newPassword.length < 4) {
        return { success: false, error: 'New password must be at least 4 characters long.' };
      }

      const newHash = await computeSha256(newPassword);
      const data = this.getData();
      data.adminAuth = data.adminAuth || {};
      data.adminAuth.passwordHash = newHash;
      this.saveData(data);
      return { success: true };
    }
  };

  window.PortfolioStore = PortfolioStore;
})();
