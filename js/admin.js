/* ============================================================
   PORTFOLIO CMS ADMIN LOGIC & AUTH (js/admin.js)
   With Built-in Rich Text WYSIWYG Editor Support
   ============================================================ */

function initAdminApp() {
  if (!window.PortfolioStore) {
    console.error('PortfolioStore not loaded.');
    return;
  }

  let data = window.PortfolioStore.getData();
  let aboutStoryEditor = null;

  /* ── 0. Built-in Rich Text Editor (WYSIWYG) Engine ─────── */
  function createRichTextEditor(container, initialContent = '', placeholder = 'Start writing...') {
    if (!container) return null;

    const wrapper = document.createElement('div');
    wrapper.className = 'rte-wrapper';

    wrapper.innerHTML = `
      <div class="rte-toolbar">
        <div class="rte-group">
          <button type="button" class="rte-btn" data-cmd="bold" title="Bold (Ctrl+B)"><strong>B</strong></button>
          <button type="button" class="rte-btn" data-cmd="italic" title="Italic (Ctrl+I)"><em>I</em></button>
          <button type="button" class="rte-btn" data-cmd="underline" title="Underline (Ctrl+U)"><u>U</u></button>
          <button type="button" class="rte-btn" data-cmd="strikeThrough" title="Strikethrough"><s>S</s></button>
        </div>

        <div class="rte-group">
          <button type="button" class="rte-btn rte-btn-tag" data-cmd="formatBlock" data-val="h2" title="Heading 2">H2</button>
          <button type="button" class="rte-btn rte-btn-tag" data-cmd="formatBlock" data-val="h3" title="Heading 3">H3</button>
          <button type="button" class="rte-btn rte-btn-tag" data-cmd="formatBlock" data-val="p" title="Paragraph">¶</button>
        </div>

        <div class="rte-group">
          <button type="button" class="rte-btn" data-cmd="insertUnorderedList" title="Bullet List">•≡</button>
          <button type="button" class="rte-btn" data-cmd="insertOrderedList" title="Numbered List">1≡</button>
          <button type="button" class="rte-btn" data-cmd="formatBlock" data-val="blockquote" title="Quote">“ ”</button>
          <button type="button" class="rte-btn" data-cmd="formatBlock" data-val="pre" title="Code Block">&lt;&gt;</button>
        </div>

        <div class="rte-group">
          <button type="button" class="rte-btn" data-action="link" title="Insert Link">🔗</button>
          <button type="button" class="rte-btn" data-cmd="unlink" title="Remove Link">⛓️‍💥</button>
          <button type="button" class="rte-btn" data-cmd="removeFormat" title="Clear Formatting">🧹</button>
        </div>

        <div class="rte-group">
          <button type="button" class="rte-btn" data-cmd="undo" title="Undo (Ctrl+Z)">↩</button>
          <button type="button" class="rte-btn" data-cmd="redo" title="Redo (Ctrl+Y)">↪</button>
        </div>

        <button type="button" class="rte-btn rte-btn-html" data-action="toggle-html" title="Toggle HTML Source Code">&lt;/&gt; HTML</button>
      </div>

      <div class="rte-content" contenteditable="true" data-placeholder="${PortfolioUtils.escapeHtml(placeholder)}"></div>
      <textarea class="rte-html-textarea" placeholder="Raw HTML code..."></textarea>
    `;

    container.innerHTML = '';
    container.appendChild(wrapper);

    const contentArea = wrapper.querySelector('.rte-content');
    const htmlArea = wrapper.querySelector('.rte-html-textarea');
    const toolbar = wrapper.querySelector('.rte-toolbar');
    let isHtmlMode = false;

    // Load initial content
    if (initialContent) {
      if (/<\/?[a-z][\s\S]*>/i.test(initialContent)) {
        contentArea.innerHTML = initialContent;
        htmlArea.value = initialContent;
      } else {
        const formatted = initialContent
          .split('\n\n')
          .map(p => `<p>${PortfolioUtils.escapeHtml(p)}</p>`)
          .join('');
        contentArea.innerHTML = formatted;
        htmlArea.value = formatted;
      }
    }

    // Handle toolbar actions
    toolbar.addEventListener('click', (e) => {
      const btn = e.target.closest('.rte-btn');
      if (!btn) return;
      e.preventDefault();

      const cmd = btn.getAttribute('data-cmd');
      const val = btn.getAttribute('data-val') || null;
      const action = btn.getAttribute('data-action');

      if (action === 'toggle-html') {
        isHtmlMode = !isHtmlMode;
        btn.classList.toggle('active', isHtmlMode);
        if (isHtmlMode) {
          htmlArea.value = contentArea.innerHTML;
          contentArea.style.display = 'none';
          htmlArea.style.display = 'block';
          htmlArea.focus();
        } else {
          contentArea.innerHTML = htmlArea.value;
          htmlArea.style.display = 'none';
          contentArea.style.display = 'block';
          contentArea.focus();
        }
        return;
      }

      if (isHtmlMode) return;

      if (action === 'link') {
        const url = prompt('Enter web link URL (e.g. https://...):');
        if (url) {
          // @deprecated � execCommand is deprecated, see MDN
          document.execCommand('createLink', false, url);
          contentArea.querySelectorAll('a').forEach(a => a.setAttribute('target', '_blank'));
        }
        return;
      }

      if (cmd) {
        // @deprecated � execCommand is deprecated, see MDN
        document.execCommand(cmd, false, val);
        updateActiveStates();
        contentArea.focus();
      }
    });

    function updateActiveStates() {
      toolbar.querySelectorAll('[data-cmd]').forEach(b => {
        const command = b.getAttribute('data-cmd');
        if (command && document.queryCommandState && ['bold', 'italic', 'underline', 'strikeThrough', 'insertUnorderedList', 'insertOrderedList'].includes(command)) {
          b.classList.toggle('active', document.queryCommandState(command));
        }
      });
    }

    contentArea.addEventListener('keyup', updateActiveStates);
    contentArea.addEventListener('mouseup', updateActiveStates);

    return {
      getHTML: () => {
        if (isHtmlMode) {
          return htmlArea.value.trim();
        }
        return contentArea.innerHTML.trim();
      },
      setHTML: (html) => {
        contentArea.innerHTML = html || '';
        htmlArea.value = html || '';
      }
    };
  }

  /* ── 1. Authentication & Lockscreen Management ─────────── */
  const lockscreen = document.getElementById('admin-lockscreen');
  const lockCard = document.getElementById('lock-card');
  const lockForm = document.getElementById('lock-form');
  const inputAdminPassword = document.getElementById('input-admin-password');
  const btnTogglePwd = document.getElementById('btn-toggle-pwd');
  const lockErrorMsg = document.getElementById('lock-error-msg');
  const sidebar = document.getElementById('admin-sidebar');
  const mainContent = document.getElementById('admin-main');
  const btnLogout = document.getElementById('btn-logout');

  function checkAuth() {
    if (window.PortfolioStore.isAuthenticated()) {
      unlockDashboard();
    } else {
      lockDashboard();
    }
  }

  function unlockDashboard() {
    if (lockscreen) lockscreen.classList.add('hidden');
    if (sidebar) sidebar.style.display = 'flex';
    if (mainContent) mainContent.style.display = 'block';
    try {
      populateAll();
    } catch (e) {
      console.warn('[Admin] populateAll partial error caught:', e);
    }
  }

  function lockDashboard() {
    if (lockscreen) lockscreen.classList.remove('hidden');
    if (sidebar) sidebar.style.display = 'none';
    if (mainContent) mainContent.style.display = 'none';
    if (inputAdminPassword) {
      inputAdminPassword.value = '';
      // BUG-17 FIX: Always reset to password type so it's never shown as plain text after logout
      inputAdminPassword.setAttribute('type', 'password');
      if (btnTogglePwd) btnTogglePwd.textContent = '👁️';
      inputAdminPassword.focus();
    }
    if (lockErrorMsg) lockErrorMsg.classList.remove('visible');
  }

  async function handleLogin() {
    const password = inputAdminPassword ? inputAdminPassword.value.trim() : '';
    if (!password) {
      showLockError('Please enter your password.');
      return;
    }

    const res = await window.PortfolioStore.login(password);
    if (res.success) {
      unlockDashboard();
      showToast('Welcome back, Fazal! Dashboard unlocked.');
    } else {
      showLockError('Incorrect password. Please try again.');
    }
  }

  function showLockError(msg) {
    if (lockErrorMsg) {
      lockErrorMsg.textContent = msg;
      lockErrorMsg.classList.add('visible');
    }
    if (lockCard) {
      lockCard.classList.remove('shake');
      void lockCard.offsetWidth;
      lockCard.classList.add('shake');
    }
    if (inputAdminPassword) {
      inputAdminPassword.focus();
      inputAdminPassword.select();
    }
  }

  function togglePasswordVisibility() {
    if (!inputAdminPassword) return;
    const current = inputAdminPassword.getAttribute('type') || 'password';
    const next = current === 'password' ? 'text' : 'password';
    inputAdminPassword.setAttribute('type', next);
    if (btnTogglePwd) {
      btnTogglePwd.textContent = next === 'password' ? '👁️' : '🙈';
      btnTogglePwd.setAttribute('title', next === 'password' ? 'Show password' : 'Hide password');
    }
    inputAdminPassword.focus();
  }

  const btnUnlockCms = document.getElementById('btn-unlock-cms');
  if (btnUnlockCms) {
    btnUnlockCms.addEventListener('click', (e) => {
      e.preventDefault();
      handleLogin();
    });
  }

  if (lockForm) {
    lockForm.addEventListener('submit', (e) => {
      e.preventDefault();
      handleLogin();
    });
  }

  if (inputAdminPassword) {
    inputAdminPassword.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleLogin();
      }
    });
  }

  if (btnTogglePwd) {
    btnTogglePwd.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      togglePasswordVisibility();
    });
  }

  if (btnLogout) {
    btnLogout.addEventListener('click', () => {
      window.PortfolioStore.logout();
      lockDashboard();
      showToast('Logged out of Admin CMS.', 'info');
    });
  }

  /* ── 2. Tab Navigation ──────────────────────────────────── */
  const navButtons = document.querySelectorAll('.admin-nav button');
  const panels = document.querySelectorAll('.admin-panel');

  navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.getAttribute('data-tab');
      navButtons.forEach(b => b.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const targetPanel = document.getElementById(`panel-${tab}`);
      if (targetPanel) targetPanel.classList.add('active');
    });
  });

  /* ── 3. Populate All Data into Form Fields ──────────────── */
  function populateAll() {
    data = window.PortfolioStore.getData();
    const p = data.profile || {};
    const avail = data.availability || {};

    // Profile & Bio
    setVal('input-name', p.name);
    setVal('input-firstName', p.firstName);
    setVal('input-roleTitle', p.roleTitle);
    setVal('input-heroBio', p.heroBio);
    setVal('input-aboutLead', p.aboutLead);
    setVal('input-fontPair', p.fontPair || 'geometric');
    
    // Initialize About Story Rich Text Editor
    const aboutStoryWrap = document.getElementById('editor-aboutParagraphs-wrap');
    if (aboutStoryWrap) {
      const initialAboutContent = (p.aboutBodyParagraphs || []).join('\n\n');
      aboutStoryEditor = createRichTextEditor(aboutStoryWrap, initialAboutContent, 'Write your detailed bio story with headings, bullet points, and formatting...');
    }

    setVal('input-contactIntro', p.contactIntro);
    setVal('input-email', p.email);
    setVal('input-phone', p.phone);
    setVal('input-linkedin', p.linkedinUrl);
    setVal('input-github', p.githubUrl);
    setVal('input-resumeUrl', p.resumeUrl || '');
    setVal('input-location', p.location);
    setVal('input-copyrightYear', p.copyrightYear || 2026);
    setVal('input-footerTagline', p.footerTagline);

    // Hero & Metrics
    setVal('input-avail-status', avail.status || 'available');
    setVal('input-avail-text', avail.badgeText || 'Open to Research & Advisory');
    setVal('input-typewriter-roles', (avail.typewriterRoles || []).join(', '));
    renderMetricsEditor();

    // Awards
    renderAwardsList();

    // Articles
    renderArticlesList();

    // Experience, Projects, Education, Skills
    renderExperienceList();
    renderProjectsList();
    renderEducationList();
    renderSkillsManager();
    renderRecommendationsList();

    // Site Structure & Layout Managers
    populateNavigation();
    populateSections();
    populateContact();
    populateFooter();
    populateSEO();
    populateGitHubTokenSection();
  }

  function setVal(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val !== undefined && val !== null ? val : '';
  }

  function getVal(id) {
    const el = document.getElementById(id);
    return el ? el.value.trim() : '';
  }

  function setChecked(id, bool) {
    const el = document.getElementById(id);
    if (el) el.checked = !!bool;
  }

  function getChecked(id) {
    const el = document.getElementById(id);
    return el ? el.checked : false;
  }

  /* ── 3B. Site Layout & Sections Managers ───────────────── */
  function populateNavigation() {
    if (!data.navigation) data.navigation = {};
    setVal('input-nav-logo-text', data.navigation.logoText || 'Fazal');
    setVal('input-nav-logo-link', data.navigation.logoLink || 'index.html');
    setChecked('checkbox-nav-logo-dot', data.navigation.logoDot !== false);

    const cta = data.navigation.cta || {};
    setVal('input-nav-cta-text', cta.text || '');
    setVal('input-nav-cta-url', cta.url || '');
    setChecked('checkbox-nav-cta-visible', !!cta.visible);

    renderNavItemsList();
  }

  function renderNavItemsList() {
    const container = document.getElementById('nav-items-list');
    if (!container) return;

    const items = data.navigation?.items || [];
    if (!items.length) {
      container.innerHTML = '<p class="admin-empty-notice">No navigation items added yet.</p>';
      return;
    }

    container.innerHTML = items.map((item, idx) => `
      <div class="admin-item-card">
        <div class="admin-item-content">
          <h4 class="admin-item-title">${PortfolioUtils.escapeHtml(item.label)} <span style="font-size:0.8rem; font-weight:normal; color:var(--adm-muted); font-family:var(--font-mono); margin-left:0.5rem;">(${PortfolioUtils.escapeHtml(item.url)})</span></h4>
          <p class="admin-item-sub">
            <span class="badge ${item.visible !== false ? 'badge-success' : 'badge-muted'}">${item.visible !== false ? 'Visible' : 'Hidden'}</span>
            ${item.isExternal ? '<span class="badge badge-info" style="margin-left:0.3rem;">External</span>' : ''}
          </p>
        </div>
        <div class="admin-item-actions">
          <button type="button" class="btn-adm btn-adm-secondary btn-adm-sm" data-action="moveNavItem" data-arg0="arg" data-arg1="-1" ${idx === 0 ? 'disabled' : ''} title="Move Up">↑</button>
          <button type="button" class="btn-adm btn-adm-secondary btn-adm-sm" data-action="moveNavItem" data-arg0="arg" data-arg1="1" ${idx === items.length - 1 ? 'disabled' : ''} title="Move Down">↓</button>
          <button type="button" class="btn-adm btn-adm-secondary btn-adm-sm" data-action="editNavItem" data-arg0="arg">Edit</button>
          <button type="button" class="btn-adm btn-adm-danger btn-adm-sm" data-action="deleteNavItem" data-arg0="arg">Delete</button>
        </div>
      </div>
    `).join('');
  }

  window.editNavItem = function(idx) {
    const item = data.navigation?.items ? data.navigation.items[idx] : null;
    if (!item) return;
    openNavItemModal(item, false, idx);
  };

  window.deleteNavItem = function(idx) {
    if (confirm('Delete this menu item?')) {
      data.navigation.items.splice(idx, 1);
      renderNavItemsList();
      showToast('Menu item removed.');
    }
  };

  window.moveNavItem = function(idx, dir) {
    const targetIdx = idx + dir;
    if (targetIdx < 0 || targetIdx >= data.navigation.items.length) return;
    const temp = data.navigation.items[idx];
    data.navigation.items[idx] = data.navigation.items[targetIdx];
    data.navigation.items[targetIdx] = temp;
    renderNavItemsList();
  };

  function openNavItemModal(item, isNew, idx) {
    const html = `
      <div class="form-group">
        <label class="form-label">Menu Item Label *</label>
        <input type="text" id="modal-nav-label" class="form-input" value="${PortfolioUtils.escapeHtml(item.label || '')}" placeholder="e.g. Articles" required />
      </div>
      <div class="form-group">
        <label class="form-label">Destination URL *</label>
        <input type="text" id="modal-nav-url" class="form-input" value="${PortfolioUtils.escapeHtml(item.url || '')}" placeholder="index.html#articles or https://..." required />
      </div>
      <div class="form-group">
        <label class="form-checkbox-label">
          <input type="checkbox" id="modal-nav-external" ${item.isExternal ? 'checked' : ''} />
          <span>Open link in new tab (External URL)</span>
        </label>
      </div>
      <div class="form-group">
        <label class="form-checkbox-label">
          <input type="checkbox" id="modal-nav-visible" ${item.visible !== false ? 'checked' : ''} />
          <span>Visible in navigation</span>
        </label>
      </div>
    `;

    openModal(isNew ? 'Add Navigation Item' : 'Edit Navigation Item', html, () => {
      const label = document.getElementById('modal-nav-label').value.trim();
      const url = document.getElementById('modal-nav-url').value.trim();
      const isExternal = document.getElementById('modal-nav-external').checked;
      const visible = document.getElementById('modal-nav-visible').checked;

      if (!label || !url) {
        alert('Please provide both a label and a URL.');
        return false;
      }

      if (isNew) {
        if (!data.navigation) data.navigation = {};
        if (!Array.isArray(data.navigation.items)) data.navigation.items = [];
        data.navigation.items.push({
          id: 'nav-' + Date.now(),
          label,
          url,
          isExternal,
          visible
        });
      } else {
        data.navigation.items[idx] = {
          ...data.navigation.items[idx],
          label,
          url,
          isExternal,
          visible
        };
      }

      renderNavItemsList();
      showToast(isNew ? 'New navigation item added.' : 'Navigation item updated.');
      return true;
    });
  }

  const btnAddNavItem = document.getElementById('btn-add-nav-item');
  if (btnAddNavItem) {
    btnAddNavItem.addEventListener('click', () => {
      openNavItemModal({ label: '', url: '', isExternal: false, visible: true }, true);
    });
  }

  function populateSections() {
    const s = data.sections || {};

    // Home Hero & CTAs
    const hh = s.homeHero || {};
    setVal('input-sec-home-hero-label', hh.label || 'home');
    setChecked('checkbox-sec-metrics-visible', hh.metricsVisible !== false);

    setVal('input-sec-hero-cta1-text', hh.cta1?.text || 'View My Work ↗');
    setVal('input-sec-hero-cta1-url', hh.cta1?.url || 'projects.html');
    setVal('input-sec-hero-cta2-text', hh.cta2?.text || 'About & Experience');
    setVal('input-sec-hero-cta2-url', hh.cta2?.url || 'about.html');
    setVal('input-sec-hero-cta3-text', hh.cta3?.text || 'Download Resume');
    setVal('input-sec-hero-cta3-url', hh.cta3?.url || 'about.html');

    // Expertise
    const exp = s.expertise || {};
    setVal('input-sec-exp-label', exp.label || 'expertise');
    setChecked('checkbox-sec-exp-vis', exp.visible !== false);

    // Awards
    const awd = s.awards || {};
    setVal('input-sec-awards-label', awd.label || 'recognition');
    setVal('input-sec-awards-subtext', awd.subtext || 'Selected awards, research accolades, and honors.');
    setChecked('checkbox-sec-awards-vis', awd.visible !== false);

    // Experience
    const ex = s.experience || {};
    setVal('input-sec-experience-label', ex.label || 'experience');
    setVal('input-sec-experience-subtext', ex.subtext || 'Selected professional background and key career milestones.');
    setVal('input-sec-experience-cta-text', ex.ctaText || 'Full history →');
    setVal('input-sec-experience-cta-url', ex.ctaUrl || 'about.html#experience');
    setChecked('checkbox-sec-experience-vis', ex.visible !== false);

    // Work
    const wk = s.work || {};
    setVal('input-sec-work-label', wk.label || 'work');
    setVal('input-sec-work-subtext', wk.subtext || 'Selected academic research and engineering projects.');
    setVal('input-sec-work-cta-text', wk.ctaText || 'All projects →');
    setVal('input-sec-work-cta-url', wk.ctaUrl || 'projects.html');
    setChecked('checkbox-sec-work-vis', wk.visible !== false);

    // Articles
    const art = s.articles || {};
    setVal('input-sec-art-label', art.label || 'insights');
    setVal('input-sec-art-subtext', art.subtext || 'Articles on technical project delivery, leadership, and systems architecture.');
    setChecked('checkbox-sec-art-vis', art.visible !== false);

    // Recommendations
    const rec = s.recommendations || {};
    setVal('input-rec-section-label', rec.label || 'endorsements');
    setVal('input-rec-section-subtext', rec.subtext || 'What colleagues, clients, and partners say about working with me.');
    setChecked('checkbox-sec-rec-vis', rec.visible !== false);

    // About Page
    const ab = s.aboutPage || {};
    setVal('input-sec-ab-hero-label', ab.heroLabel || 'about');
    setVal('input-sec-ab-bio-label', ab.bioLabel || 'biography');
    setVal('input-sec-ab-hero-sub', ab.heroSubtitle || '');
    setVal('input-sec-ab-awards-label', ab.awardsLabel || 'recognition');
    setChecked('checkbox-sec-ab-awards-vis', ab.awardsVisible !== false);
    setVal('input-sec-ab-edu-label', ab.educationLabel || 'education');
    setChecked('checkbox-sec-ab-edu-vis', ab.educationVisible !== false);
    setVal('input-sec-ab-exp-label', ab.experienceLabel || 'experience');
    setChecked('checkbox-sec-ab-exp-vis', ab.experienceVisible !== false);
    setVal('input-sec-ab-skills-label', ab.skillsLabel || 'skills');
    setChecked('checkbox-sec-ab-skills-vis', ab.skillsVisible !== false);
    setVal('input-sec-ab-extras-label', ab.extrasLabel || 'beyond work');
    setChecked('checkbox-sec-ab-extras-vis', ab.extrasVisible !== false);

    // Projects Page
    const pr = s.projectsPage || {};
    setVal('input-sec-pr-hero-label', pr.heroLabel || 'work');
    setVal('input-sec-pr-hero-title', pr.heroTitle || 'Projects & Research.');
    setVal('input-sec-pr-hero-sub', pr.heroSubtitle || '');
    setVal('input-sec-pr-res-label', pr.researchLabel || 'research');
    setChecked('checkbox-sec-pr-res-vis', pr.researchVisible !== false);
    setVal('input-sec-pr-pub-label', pr.publicationLabel || 'publication');
    setChecked('checkbox-sec-pr-pub-vis', pr.publicationVisible !== false);
    setVal('input-sec-pr-soft-label', pr.softwareLabel || 'software & engineering');
    setChecked('checkbox-sec-pr-soft-vis', pr.softwareVisible !== false);
    setVal('input-sec-pr-vol-label', pr.volunteerLabel || 'volunteer & leadership');
    setChecked('checkbox-sec-pr-vol-vis', pr.volunteerVisible !== false);

    // Error 404 Page
    const err = s.errorPage || {};
    setVal('input-sec-404-code', err.code || '404');
    setVal('input-sec-404-heading', err.heading || 'Page Not Found');
    setVal('input-sec-404-desc', err.description || '');
    setVal('input-sec-404-cta1-text', err.cta1Text || 'Return to Homepage ↗');
    setVal('input-sec-404-cta1-url', err.cta1Url || 'index.html');
    setVal('input-sec-404-cta2-text', err.cta2Text || 'Explore Projects');
    setVal('input-sec-404-cta2-url', err.cta2Url || 'projects.html');
  }

  function populateContact() {
    const c = data.sections?.contact || {};
    setVal('input-sec-contact-label', c.label || 'contact');
    setVal('input-sec-contact-heading', c.heading || "Let's work together.");
    setVal('textarea-sec-contact-subtext', c.subtext || '');
    setChecked('checkbox-sec-contact-vis', c.visible !== false);

    const f = c.form || {};
    setVal('input-contact-name-label', f.nameLabel || 'Your Name *');
    setVal('input-contact-name-ph', f.namePlaceholder || 'e.g. Alex Rahman');
    setVal('input-contact-email-label', f.emailLabel || 'Email Address *');
    setVal('input-contact-email-ph', f.emailPlaceholder || 'e.g. alex@company.com');
    setVal('input-contact-subj-label', f.subjectLabel || 'Subject');
    setVal('input-contact-subj-ph', f.subjectPlaceholder || 'Project collaboration / Inquiry');
    setVal('input-contact-msg-label', f.messageLabel || 'Message *');
    setVal('input-contact-msg-ph', f.messagePlaceholder || 'Tell me a bit about what you have in mind...');
    setVal('input-contact-submit-text', f.submitText || 'Send Message ↗');

    const d = c.details || {};
    setVal('input-contact-lbl-email', d.emailLabel || 'Direct Email');
    setVal('input-contact-lbl-phone', d.phoneLabel || 'Phone / WhatsApp');
    setVal('input-contact-lbl-location', d.locationLabel || 'Location');
    setVal('input-contact-lbl-connect', d.connectLabel || 'Connect');
  }

  function populateFooter() {
    const f = data.footer || {};
    setVal('textarea-footer-tagline', f.tagline || data.profile?.footerTagline || '');
    setVal('input-footer-col1-title', f.navTitle || 'Navigation');
    setVal('input-footer-col2-title', f.connectTitle || 'Connect');
    setVal('input-footer-copyright', f.copyright || `© ${data.profile?.copyrightYear || 2026} ${data.profile?.name || 'Fazal Mahmud Hassan'}. All rights reserved.`);

    renderFooterLinksList();
    renderFooterSocialList();
  }

  function renderFooterLinksList() {
    const container = document.getElementById('footer-links-list');
    if (!container) return;

    const links = data.footer?.links || [];
    if (!links.length) {
      container.innerHTML = '<p class="admin-empty-notice">No footer navigation links.</p>';
      return;
    }

    container.innerHTML = links.map((link, idx) => `
      <div class="admin-item-card">
        <div class="admin-item-content">
          <h4 class="admin-item-title">${PortfolioUtils.escapeHtml(link.label)} <span style="font-size:0.8rem; font-weight:normal; color:var(--adm-muted); font-family:var(--font-mono); margin-left:0.5rem;">(${PortfolioUtils.escapeHtml(link.url)})</span></h4>
        </div>
        <div class="admin-item-actions">
          <button type="button" class="btn-adm btn-adm-secondary btn-adm-sm" data-action="editFooterLink" data-arg0="arg">Edit</button>
          <button type="button" class="btn-adm btn-adm-danger btn-adm-sm" data-action="deleteFooterLink" data-arg0="arg">Delete</button>
        </div>
      </div>
    `).join('');
  }

  window.editFooterLink = function(idx) {
    const link = data.footer?.links ? data.footer.links[idx] : null;
    if (!link) return;
    openFooterLinkModal(link, false, idx);
  };

  window.deleteFooterLink = function(idx) {
    if (confirm('Delete this footer link?')) {
      data.footer.links.splice(idx, 1);
      renderFooterLinksList();
      showToast('Footer link removed.');
    }
  };

  function openFooterLinkModal(link, isNew, idx) {
    const html = `
      <div class="form-group">
        <label class="form-label">Link Label *</label>
        <input type="text" id="modal-fl-label" class="form-input" value="${PortfolioUtils.escapeHtml(link.label || '')}" placeholder="e.g. About" required />
      </div>
      <div class="form-group">
        <label class="form-label">Destination URL *</label>
        <input type="text" id="modal-fl-url" class="form-input" value="${PortfolioUtils.escapeHtml(link.url || '')}" placeholder="about.html" required />
      </div>
    `;

    openModal(isNew ? 'Add Footer Link' : 'Edit Footer Link', html, () => {
      const label = document.getElementById('modal-fl-label').value.trim();
      const url = document.getElementById('modal-fl-url').value.trim();

      if (!label || !url) {
        alert('Please provide both label and URL.');
        return false;
      }

      if (isNew) {
        if (!data.footer) data.footer = {};
        if (!Array.isArray(data.footer.links)) data.footer.links = [];
        data.footer.links.push({ id: 'fl-' + Date.now(), label, url });
      } else {
        data.footer.links[idx] = { ...data.footer.links[idx], label, url };
      }

      renderFooterLinksList();
      showToast(isNew ? 'Footer link added.' : 'Footer link updated.');
      return true;
    });
  }

  const btnAddFooterLink = document.getElementById('btn-add-footer-link');
  if (btnAddFooterLink) {
    btnAddFooterLink.addEventListener('click', () => {
      openFooterLinkModal({ label: '', url: '' }, true);
    });
  }

  function renderFooterSocialList() {
    const container = document.getElementById('footer-social-list');
    if (!container) return;

    const links = data.footer?.socialLinks || [];
    if (!links.length) {
      container.innerHTML = '<p class="admin-empty-notice">No footer connect links.</p>';
      return;
    }

    container.innerHTML = links.map((link, idx) => `
      <div class="admin-item-card">
        <div class="admin-item-content">
          <h4 class="admin-item-title">${PortfolioUtils.escapeHtml(link.label)} <span style="font-size:0.8rem; font-weight:normal; color:var(--adm-muted); font-family:var(--font-mono); margin-left:0.5rem;">(${PortfolioUtils.escapeHtml(link.url)})</span></h4>
        </div>
        <div class="admin-item-actions">
          <button type="button" class="btn-adm btn-adm-secondary btn-adm-sm" data-action="editFooterSocial" data-arg0="arg">Edit</button>
          <button type="button" class="btn-adm btn-adm-danger btn-adm-sm" data-action="deleteFooterSocial" data-arg0="arg">Delete</button>
        </div>
      </div>
    `).join('');
  }

  window.editFooterSocial = function(idx) {
    const link = data.footer?.socialLinks ? data.footer.socialLinks[idx] : null;
    if (!link) return;
    openFooterSocialModal(link, false, idx);
  };

  window.deleteFooterSocial = function(idx) {
    if (confirm('Delete this connect link?')) {
      data.footer.socialLinks.splice(idx, 1);
      renderFooterSocialList();
      showToast('Connect link removed.');
    }
  };

  function openFooterSocialModal(link, isNew, idx) {
    const html = `
      <div class="form-group">
        <label class="form-label">Link Label *</label>
        <input type="text" id="modal-sl-label" class="form-input" value="${PortfolioUtils.escapeHtml(link.label || '')}" placeholder="e.g. LinkedIn ↗" required />
      </div>
      <div class="form-group">
        <label class="form-label">Destination URL *</label>
        <input type="text" id="modal-sl-url" class="form-input" value="${PortfolioUtils.escapeHtml(link.url || '')}" placeholder="https://linkedin.com/..." required />
      </div>
    `;

    openModal(isNew ? 'Add Connect Link' : 'Edit Connect Link', html, () => {
      const label = document.getElementById('modal-sl-label').value.trim();
      const url = document.getElementById('modal-sl-url').value.trim();

      if (!label || !url) {
        alert('Please provide both label and URL.');
        return false;
      }

      if (isNew) {
        if (!data.footer) data.footer = {};
        if (!Array.isArray(data.footer.socialLinks)) data.footer.socialLinks = [];
        data.footer.socialLinks.push({ id: 'sl-' + Date.now(), label, url });
      } else {
        data.footer.socialLinks[idx] = { ...data.footer.socialLinks[idx], label, url };
      }

      renderFooterSocialList();
      showToast(isNew ? 'Connect link added.' : 'Connect link updated.');
      return true;
    });
  }

  const btnAddFooterSocial = document.getElementById('btn-add-footer-social');
  if (btnAddFooterSocial) {
    btnAddFooterSocial.addEventListener('click', () => {
      openFooterSocialModal({ label: '', url: '' }, true);
    });
  }

  function populateSEO() {
    const s = data.seo || {};
    setVal('input-seo-title', s.siteTitle || '');
    setVal('textarea-seo-desc', s.metaDescription || '');
    setVal('textarea-seo-keywords', s.keywords || '');
    setVal('input-seo-og-image', s.ogImage || '');
  }

  function populateGitHubTokenSection() {
    const statusEl = document.getElementById('github-token-status');
    const inputEl = document.getElementById('input-github-token');
    const saveBtn = document.getElementById('btn-save-github-token');
    const testBtn = document.getElementById('btn-test-github-token');
    const clearBtn = document.getElementById('btn-clear-github-token');

    if (!statusEl || !inputEl) return;

    const status = window.PortfolioStore.getGitHubTokenStatus();
    if (status.configured) {
      statusEl.innerHTML = `<span class="badge badge-success">✓ Token configured: ${PortfolioUtils.escapeHtml(status.preview)}</span>`;
    } else {
      statusEl.innerHTML = `<span class="badge badge-muted">✗ No token configured — changes will save locally only</span>`;
    }

    if (saveBtn && !saveBtn.dataset.bound) {
      saveBtn.dataset.bound = 'true';
      saveBtn.addEventListener('click', () => {
        const token = inputEl.value.trim();
        const result = window.PortfolioStore.saveGitHubToken(token);
        if (result.success) {
          showToast('✅ GitHub token saved. CMS will now sync to GitHub on save.');
          inputEl.value = '';
          populateGitHubTokenSection();
        } else {
          showToast('⚠️ ' + result.error, 'error');
        }
      });
    }

    if (testBtn && !testBtn.dataset.bound) {
      testBtn.dataset.bound = 'true';
      testBtn.addEventListener('click', async () => {
        const btnText = testBtn.innerText;
        testBtn.innerText = 'Testing...';
        testBtn.disabled = true;
        
        const result = await window.PortfolioStore.testGitHubToken();
        
        testBtn.innerText = btnText;
        testBtn.disabled = false;

        if (result.success) {
          showToast('✅ Success! The GitHub token is valid and has repository access.');
        } else {
          showToast('⚠️ Test Failed: ' + result.error, 'error');
        }
      });
    }

    if (clearBtn && !clearBtn.dataset.bound) {
      clearBtn.dataset.bound = 'true';
      clearBtn.addEventListener('click', () => {
        if (confirm('Remove the GitHub token? CMS saves will only be stored locally.')) {
          window.PortfolioStore.clearGitHubToken();
          showToast('GitHub token cleared.', 'info');
          populateGitHubTokenSection();
        }
      });
    }
  }

  /* ── 4. Metrics Editor ──────────────────────────────────── */
  function renderMetricsEditor() {
    const container = document.getElementById('metrics-editor-grid');
    if (!container) return;

    const metrics = data.metrics || [];
    container.innerHTML = metrics.map((m, idx) => `
      <div class="form-group" style="background: var(--adm-input-bg); padding: 1.25rem; border-radius: 10px; border: 1px solid var(--adm-border);">
        <label class="form-label" style="color: var(--adm-accent); font-weight: 600; margin-bottom: 0.25rem;">Metric #${idx + 1}</label>
        <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 0.5rem; margin-bottom: 0.5rem;">
          <input type="text" class="form-input" id="metric-num-${idx}" value="${PortfolioUtils.escapeHtml(m.number)}" placeholder="Number (e.g. 21)" />
          <input type="text" class="form-input" id="metric-suffix-${idx}" value="${PortfolioUtils.escapeHtml(m.suffix)}" placeholder="Suffix (+)" />
        </div>
        <input type="text" class="form-input" id="metric-label-${idx}" value="${PortfolioUtils.escapeHtml(m.label)}" placeholder="Label (e.g. Projects Managed)" style="margin-bottom: 0.5rem;" />
        <input type="text" class="form-input" id="metric-subtext-${idx}" value="${PortfolioUtils.escapeHtml(m.subtext)}" placeholder="Subtext description" />
      </div>
    `).join('');
  }

  /* ── 5. Awards & Honors Management ──────────────────────── */
  function renderAwardsList() {
    const list = document.getElementById('awards-list');
    if (!list) return;
    const awards = data.awards || [];

    if (!awards.length) {
      list.innerHTML = `<div class="empty-state">No awards added yet. Click "Add Award" to create one.</div>`;
      return;
    }

    list.innerHTML = awards.map((awd, index) => `
      <div class="item-row">
        <div class="item-info">
          <h4>${PortfolioUtils.escapeHtml(awd.title)} ${awd.badge ? `<span style="font-size:0.85rem; background:rgba(245,158,11,0.15); color:#FBBF24; padding:3px 8px; border-radius:4px; margin-left:6px;">${PortfolioUtils.escapeHtml(awd.badge)}</span>` : ''}</h4>
          <p>${PortfolioUtils.escapeHtml(awd.organization)} · <span style="color:var(--adm-accent)">${PortfolioUtils.escapeHtml(awd.year)}</span></p>
        </div>
        <div class="item-actions">
          <button class="btn-adm btn-adm-secondary btn-adm-sm" data-action="editAward" data-arg0="arg">Edit</button>
          <button class="btn-adm btn-adm-danger btn-adm-sm" data-action="deleteAward" data-arg0="arg">Delete</button>
        </div>
      </div>
    `).join('');
  }

  window.editAward = function (index) {
    const isNew = index === -1;
    const awd = !isNew ? data.awards[index] : {
      id: `awd-${Date.now()}`,
      title: '',
      organization: '',
      year: '',
      description: '',
      badge: ''
    };

    openModal(isNew ? 'Add Award & Honor' : 'Edit Award', `
      <div class="form-grid">
        <div class="form-group full-width">
          <label class="form-label">Award Title *</label>
          <input type="text" id="modal-awd-title" class="form-input" value="${PortfolioUtils.escapeHtml(awd.title)}" placeholder="e.g. Best Presentation Award" />
        </div>
        <div class="form-group">
          <label class="form-label">Organization / Conference *</label>
          <input type="text" id="modal-awd-org" class="form-input" value="${PortfolioUtils.escapeHtml(awd.organization)}" placeholder="e.g. Springer CNC-2018" />
        </div>
        <div class="form-group">
          <label class="form-label">Year / Date</label>
          <input type="text" id="modal-awd-year" class="form-input" value="${PortfolioUtils.escapeHtml(awd.year)}" placeholder="e.g. 2018" />
        </div>
        <div class="form-group full-width">
          <label class="form-label">Ribbon Badge Text (Optional)</label>
          <input type="text" id="modal-awd-badge" class="form-input" value="${PortfolioUtils.escapeHtml(awd.badge || '')}" placeholder="e.g. Springer Award" />
        </div>
        <div class="form-group full-width">
          <label class="form-label">Description</label>
          <textarea id="modal-awd-desc" class="form-textarea" style="min-height:90px;" placeholder="Details about this award...">${PortfolioUtils.escapeHtml(awd.description || '')}</textarea>
        </div>
      </div>
    `, () => {
      const title = document.getElementById('modal-awd-title').value.trim();
      const organization = document.getElementById('modal-awd-org').value.trim();
      const year = document.getElementById('modal-awd-year').value.trim();
      const badge = document.getElementById('modal-awd-badge').value.trim();
      const description = document.getElementById('modal-awd-desc').value.trim();

      if (!title || !organization) {
        alert('Please provide Award Title and Organization.');
        return false;
      }

      if (!data.awards) data.awards = [];

      const updated = { ...awd, title, organization, year, badge, description };
      if (isNew) {
        data.awards.push(updated);
      } else {
        data.awards[index] = updated;
      }

      renderAwardsList();
      return true;
    });
  };

  window.deleteAward = function (index) {
    if (confirm(`Are you sure you want to delete "${data.awards[index].title}"?`)) {
      data.awards.splice(index, 1);
      renderAwardsList();
      showToast('Award removed.');
    }
  };

  const btnAddAward = document.getElementById('btn-add-award');
  if (btnAddAward) btnAddAward.addEventListener('click', () => window.editAward(-1));

  /* ── 6. Articles & Insights Management (With Rich Text) ─── */
  function renderArticlesList() {
    const list = document.getElementById('articles-list');
    if (!list) return;
    const articles = data.articles || [];

    if (!articles.length) {
      list.innerHTML = `<div class="empty-state">No articles yet. Click "Write New Article" to add one.</div>`;
      return;
    }

    list.innerHTML = articles.map((art, index) => `
      <div class="item-row">
        <div class="item-info">
          <h4>${PortfolioUtils.escapeHtml(art.title)} <span style="font-size:0.85rem; background:rgba(59,130,246,0.15); color:var(--adm-accent-hover); padding:3px 8px; border-radius:4px; margin-left:6px;">${PortfolioUtils.escapeHtml(art.category || 'Article')}</span></h4>
          <p>${PortfolioUtils.escapeHtml(art.date)} · <span style="color:var(--adm-muted)">${PortfolioUtils.escapeHtml(art.readTime || '5 min read')}</span></p>
        </div>
        <div class="item-actions">
          <button class="btn-adm btn-adm-secondary btn-adm-sm" data-action="editArticle" data-arg0="arg">Edit</button>
          <button class="btn-adm btn-adm-danger btn-adm-sm" data-action="deleteArticle" data-arg0="arg">Delete</button>
        </div>
      </div>
    `).join('');
  }

  window.editArticle = function (index) {
    const isNew = index === -1;
    const art = !isNew ? data.articles[index] : {
      id: `art-${Date.now()}`,
      title: '',
      category: 'Leadership',
      date: 'Recent',
      readTime: '5 min read',
      summary: '',
      tags: ['Project Management'],
      content: ''
    };

    let currentArtEditor = null;

    openModal(isNew ? 'Write New Article' : 'Edit Article', `
      <div class="form-grid">
        <div class="form-group full-width">
          <label class="form-label">Article Title *</label>
          <input type="text" id="modal-art-title" class="form-input" value="${PortfolioUtils.escapeHtml(art.title)}" placeholder="e.g. Bridging the Gap: CS + MBA Thinking" />
        </div>
        <div class="form-group">
          <label class="form-label">Category</label>
          <input type="text" id="modal-art-category" class="form-input" value="${PortfolioUtils.escapeHtml(art.category)}" placeholder="e.g. Leadership / Operations" />
        </div>
        <div class="form-group">
          <label class="form-label">Publish Date &amp; Reading Time</label>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.5rem;">
            <input type="text" id="modal-art-date" class="form-input" value="${PortfolioUtils.escapeHtml(art.date)}" placeholder="e.g. Aug 2024" />
            <input type="text" id="modal-art-readTime" class="form-input" value="${PortfolioUtils.escapeHtml(art.readTime)}" placeholder="e.g. 5 min read" />
          </div>
        </div>
        <div class="form-group full-width">
          <label class="form-label">Summary / Excerpt (Displayed on homepage preview) *</label>
          <textarea id="modal-art-summary" class="form-textarea" style="min-height:75px;">${PortfolioUtils.escapeHtml(art.summary)}</textarea>
        </div>
        <div class="form-group full-width">
          <label class="form-label">Tags (Comma-separated)</label>
          <input type="text" id="modal-art-tags" class="form-input" value="${PortfolioUtils.escapeHtml((art.tags || []).join(', '))}" placeholder="Agile, SaaS, Leadership" />
        </div>
        <div class="form-group full-width">
          <label class="form-label">Full Article / Case Study Content (Rich Text Editor)</label>
          <div id="modal-art-editor-wrap"></div>
        </div>
      </div>
    `, () => {
      const title = document.getElementById('modal-art-title').value.trim();
      const category = document.getElementById('modal-art-category').value.trim();
      const date = document.getElementById('modal-art-date').value.trim();
      const readTime = document.getElementById('modal-art-readTime').value.trim();
      const summary = document.getElementById('modal-art-summary').value.trim();
      const tags = document.getElementById('modal-art-tags').value.split(',').map(t => t.trim()).filter(Boolean);
      const content = currentArtEditor ? currentArtEditor.getHTML() : '';

      if (!title || !summary) {
        alert('Please fill in Article Title and Summary.');
        return false;
      }

      if (!data.articles) data.articles = [];

      const updated = { ...art, title, category, date, readTime, summary, tags, content };
      if (isNew) {
        data.articles.push(updated);
      } else {
        data.articles[index] = updated;
      }

      renderArticlesList();
      return true;
    }, () => {
      // Initialize Rich Text Editor inside modal
      const editorWrap = document.getElementById('modal-art-editor-wrap');
      if (editorWrap) {
        currentArtEditor = createRichTextEditor(editorWrap, art.content || '', 'Write your complete article, project retrospective, or case study here...');
      }
    });
  };

  window.deleteArticle = function (index) {
    if (confirm(`Are you sure you want to delete "${data.articles[index].title}"?`)) {
      data.articles.splice(index, 1);
      renderArticlesList();
      showToast('Article deleted.');
    }
  };

  const btnAddArticle = document.getElementById('btn-add-article');
  if (btnAddArticle) btnAddArticle.addEventListener('click', () => window.editArticle(-1));

  /* ── 7. Experience Management ───────────────────────────── */
  function renderExperienceList() {
    const list = document.getElementById('experience-list');
    if (!list) return;

    list.innerHTML = (data.experience || []).map((job, index) => `
      <div class="item-row">
        <div class="item-info">
          <h4>${PortfolioUtils.escapeHtml(job.role)} <span style="color:var(--adm-muted)">at</span> ${PortfolioUtils.escapeHtml(job.company)} ${job.isCurrent ? '<span style="font-size:0.85rem; background:rgba(16,185,129,0.2); color:#34D399; padding:3px 7px; border-radius:4px;">Current</span>' : ''}</h4>
          <p>${PortfolioUtils.escapeHtml(job.period)}</p>
        </div>
        <div class="item-actions">
          <button class="btn-adm btn-adm-secondary btn-adm-sm" data-action="editExperience" data-arg0="arg">Edit</button>
          <button class="btn-adm btn-adm-danger btn-adm-sm" data-action="deleteExperience" data-arg0="arg">Delete</button>
        </div>
      </div>
    `).join('');
  }

  window.editExperience = function (index) {
    const isNew = index === -1;
    const job = !isNew ? data.experience[index] : {
      id: `job-${Date.now()}`,
      company: '',
      companyUrl: '',
      role: '',
      period: '',
      isCurrent: false,
      bullets: []
    };

    openModal(isNew ? 'Add Experience' : 'Edit Experience', `
      <div class="form-grid">
        <div class="form-group">
          <label class="form-label">Job Title / Role *</label>
          <input type="text" id="modal-exp-role" class="form-input" value="${PortfolioUtils.escapeHtml(job.role)}" />
        </div>
        <div class="form-group">
          <label class="form-label">Company Name *</label>
          <input type="text" id="modal-exp-company" class="form-input" value="${PortfolioUtils.escapeHtml(job.company)}" />
        </div>
        <div class="form-group">
          <label class="form-label">Company Website URL</label>
          <input type="url" id="modal-exp-companyUrl" class="form-input" value="${PortfolioUtils.escapeHtml(job.companyUrl || '')}" />
        </div>
        <div class="form-group">
          <label class="form-label">Period (e.g. Aug 2024 — Present) *</label>
          <input type="text" id="modal-exp-period" class="form-input" value="${PortfolioUtils.escapeHtml(job.period)}" />
        </div>
        <div class="form-group full-width">
          <label style="display:flex; align-items:center; gap:0.5rem; cursor:pointer;">
            <input type="checkbox" id="modal-exp-isCurrent" ${job.isCurrent ? 'checked' : ''} />
            <span>Mark as Current Position</span>
          </label>
        </div>
        <div class="form-group full-width">
          <label class="form-label">Key Responsibilities / Achievements (One per line)</label>
          <textarea id="modal-exp-bullets" class="form-textarea" style="min-height:140px;">${(job.bullets || []).join('\n')}</textarea>
        </div>
      </div>
    `, () => {
      const role = document.getElementById('modal-exp-role').value.trim();
      const company = document.getElementById('modal-exp-company').value.trim();
      const companyUrl = document.getElementById('modal-exp-companyUrl').value.trim();
      const period = document.getElementById('modal-exp-period').value.trim();
      const isCurrent = document.getElementById('modal-exp-isCurrent').checked;
      const bullets = document.getElementById('modal-exp-bullets').value.split('\n').map(b => b.trim()).filter(Boolean);

      if (!role || !company || !period) {
        alert('Please fill in Role, Company, and Period.');
        return false;
      }

      if (!data.experience) data.experience = [];

      const updated = { ...job, role, company, companyUrl, period, isCurrent, bullets };
      if (isNew) {
        data.experience.push(updated);
      } else {
        data.experience[index] = updated;
      }

      renderExperienceList();
      return true;
    });
  };

  window.deleteExperience = function (index) {
    if (confirm(`Delete experience entry for "${data.experience[index].role}"?`)) {
      data.experience.splice(index, 1);
      renderExperienceList();
      showToast('Experience entry deleted.');
    }
  };

  const btnAddExperience = document.getElementById('btn-add-experience');
  if (btnAddExperience) btnAddExperience.addEventListener('click', () => window.editExperience(-1));

  /* ── 8. Projects & Research Management ──────────────────── */
  function renderProjectsList() {
    const list = document.getElementById('projects-list');
    if (!list) return;

    list.innerHTML = (data.projects || []).map((proj, index) => `
      <div class="item-row">
        <div class="item-info">
          <h4>${PortfolioUtils.escapeHtml(proj.title)} <span style="font-size:0.8rem; background:rgba(255,255,255,0.06); color:var(--adm-muted); padding:2px 6px; border-radius:4px;">${PortfolioUtils.escapeHtml(proj.category)}</span></h4>
          <p>${PortfolioUtils.escapeHtml(proj.year)}</p>
        </div>
        <div class="item-actions">
          <button class="btn-adm btn-adm-secondary btn-adm-sm" data-action="editProject" data-arg0="arg">Edit</button>
          <button class="btn-adm btn-adm-danger btn-adm-sm" data-action="deleteProject" data-arg0="arg">Delete</button>
        </div>
      </div>
    `).join('');
  }

  window.editProject = function (index) {
    const isNew = index === -1;
    const proj = !isNew ? data.projects[index] : {
      id: `proj-${Date.now()}`,
      category: 'software',
      title: '',
      year: new Date().getFullYear().toString(),
      description: '',
      tags: [],
      link: '',
      badge: ''
    };

    openModal(isNew ? 'Add Project / Research' : 'Edit Project', `
      <div class="form-grid">
        <div class="form-group full-width">
          <label class="form-label">Project Title *</label>
          <input type="text" id="modal-proj-title" class="form-input" value="${PortfolioUtils.escapeHtml(proj.title)}" />
        </div>
        <div class="form-group">
          <label class="form-label">Category</label>
          <select id="modal-proj-category" class="form-input">
            <option value="research" ${proj.category === 'research' ? 'selected' : ''}>Thesis &amp; Research</option>
            <option value="publication" ${proj.category === 'publication' ? 'selected' : ''}>Publication</option>
            <option value="software" ${proj.category === 'software' ? 'selected' : ''}>Software &amp; Engineering</option>
            <option value="volunteer" ${proj.category === 'volunteer' ? 'selected' : ''}>Volunteer &amp; Leadership</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Year / Timeline *</label>
          <input type="text" id="modal-proj-year" class="form-input" value="${PortfolioUtils.escapeHtml(proj.year)}" />
        </div>
        <div class="form-group">
          <label class="form-label">External Project Link (Optional)</label>
          <input type="url" id="modal-proj-link" class="form-input" value="${PortfolioUtils.escapeHtml(proj.link || '')}" placeholder="https://..." />
        </div>
        <div class="form-group">
          <label class="form-label">Honor Badge (e.g. Best Presentation)</label>
          <input type="text" id="modal-proj-badge" class="form-input" value="${PortfolioUtils.escapeHtml(proj.badge || '')}" />
        </div>
        <div class="form-group full-width">
          <label class="form-label">Tags (Comma-separated)</label>
          <input type="text" id="modal-proj-tags" class="form-input" value="${PortfolioUtils.escapeHtml((proj.tags || []).join(', '))}" />
        </div>
        <div class="form-group full-width">
          <label class="form-label">Project Description</label>
          <textarea id="modal-proj-desc" class="form-textarea" style="min-height:95px;">${PortfolioUtils.escapeHtml(proj.description || '')}</textarea>
        </div>
      </div>
    `, () => {
      const title = document.getElementById('modal-proj-title').value.trim();
      const category = document.getElementById('modal-proj-category').value;
      const year = document.getElementById('modal-proj-year').value.trim();
      const link = document.getElementById('modal-proj-link').value.trim();
      const badge = document.getElementById('modal-proj-badge').value.trim();
      const tags = document.getElementById('modal-proj-tags').value.split(',').map(t => t.trim()).filter(Boolean);
      const description = document.getElementById('modal-proj-desc').value.trim();

      if (!title || !year) {
        alert('Please provide Title and Year.');
        return false;
      }

      if (!data.projects) data.projects = [];

      const updated = { ...proj, title, category, year, link, badge, tags, description };
      if (isNew) {
        data.projects.push(updated);
      } else {
        data.projects[index] = updated;
      }

      renderProjectsList();
      return true;
    });
  };

  window.deleteProject = function (index) {
    if (confirm(`Delete project "${data.projects[index].title}"?`)) {
      data.projects.splice(index, 1);
      renderProjectsList();
      showToast('Project removed.');
    }
  };

  const btnAddProject = document.getElementById('btn-add-project');
  if (btnAddProject) btnAddProject.addEventListener('click', () => window.editProject(-1));

  /* ── 9. Education Management ────────────────────────────── */
  function renderEducationList() {
    const list = document.getElementById('education-list');
    if (!list) return;

    list.innerHTML = (data.education || []).map((edu, index) => `
      <div class="item-row">
        <div class="item-info">
          <h4>${PortfolioUtils.escapeHtml(edu.degree)}</h4>
          <p>${PortfolioUtils.escapeHtml(edu.institution)} · <span style="color:var(--adm-accent)">${PortfolioUtils.escapeHtml(edu.year)}</span></p>
        </div>
        <div class="item-actions">
          <button class="btn-adm btn-adm-secondary btn-adm-sm" data-action="editEducation" data-arg0="arg">Edit</button>
          <button class="btn-adm btn-adm-danger btn-adm-sm" data-action="deleteEducation" data-arg0="arg">Delete</button>
        </div>
      </div>
    `).join('');
  }

  window.editEducation = function (index) {
    const isNew = index === -1;
    const edu = !isNew ? data.education[index] : {
      id: `edu-${Date.now()}`,
      degree: '',
      field: '',
      institution: '',
      year: '',
      grade: ''
    };

    openModal(isNew ? 'Add Education' : 'Edit Education', `
      <div class="form-grid">
        <div class="form-group full-width">
          <label class="form-label">Degree Title *</label>
          <input type="text" id="modal-edu-degree" class="form-input" value="${PortfolioUtils.escapeHtml(edu.degree)}" />
        </div>
        <div class="form-group">
          <label class="form-label">Field of Study</label>
          <input type="text" id="modal-edu-field" class="form-input" value="${PortfolioUtils.escapeHtml(edu.field)}" />
        </div>
        <div class="form-group">
          <label class="form-label">Institution Name *</label>
          <input type="text" id="modal-edu-institution" class="form-input" value="${PortfolioUtils.escapeHtml(edu.institution)}" />
        </div>
        <div class="form-group">
          <label class="form-label">Year of Completion</label>
          <input type="text" id="modal-edu-year" class="form-input" value="${PortfolioUtils.escapeHtml(edu.year)}" />
        </div>
        <div class="form-group">
          <label class="form-label">Grade / GPA / CGPA</label>
          <input type="text" id="modal-edu-grade" class="form-input" value="${PortfolioUtils.escapeHtml(edu.grade)}" />
        </div>
      </div>
    `, () => {
      const degree = document.getElementById('modal-edu-degree').value.trim();
      const field = document.getElementById('modal-edu-field').value.trim();
      const institution = document.getElementById('modal-edu-institution').value.trim();
      const year = document.getElementById('modal-edu-year').value.trim();
      const grade = document.getElementById('modal-edu-grade').value.trim();

      if (!degree || !institution) {
        alert('Please provide Degree and Institution.');
        return false;
      }

      if (!data.education) data.education = [];

      const updated = { ...edu, degree, field, institution, year, grade };
      if (isNew) {
        data.education.push(updated);
      } else {
        data.education[index] = updated;
      }

      renderEducationList();
      return true;
    });
  };

  window.deleteEducation = function (index) {
    if (confirm(`Delete education record "${data.education[index].degree}"?`)) {
      data.education.splice(index, 1);
      renderEducationList();
      showToast('Education record deleted.');
    }
  };

  const btnAddEducation = document.getElementById('btn-add-education');
  if (btnAddEducation) btnAddEducation.addEventListener('click', () => window.editEducation(-1));

  /* ── 10. Skills Management ──────────────────────────────── */
  function renderSkillsManager() {
    if (!data.skills) return;

    ['technical', 'professional', 'creative', 'languages'].forEach(cat => {
      const container = document.getElementById(`skills-tags-${cat}`);
      if (!container) return;

      const items = data.skills[cat] || [];
      container.innerHTML = items.map((skill, idx) => `
        <span class="tag-pill">
          ${PortfolioUtils.escapeHtml(skill)}
          <button type="button" data-action="removeSkillTag" data-arg0="arg" data-arg1="arg" title="Remove skill">&times;</button>
        </span>
      `).join('');
    });
  }

  window.removeSkillTag = function (cat, idx) {
    if (data.skills && data.skills[cat]) {
      data.skills[cat].splice(idx, 1);
      renderSkillsManager();
    }
  };

  document.querySelectorAll('[data-action="add-skill-btn"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const cat = btn.getAttribute('data-cat');
      const input = document.getElementById(`new-skill-${cat}`);
      if (!input) return;
      const val = input.value.trim();
      if (!val) return;

      if (!data.skills[cat]) data.skills[cat] = [];
      if (!data.skills[cat].includes(val)) {
        data.skills[cat].push(val);
        input.value = '';
        renderSkillsManager();
      }
    });
  });

  /* ── 10b. Recommendations & Endorsements Manager ────────── */
  function renderRecommendationsList() {
    const container = document.getElementById('rec-list-container');
    if (!container) return;

    const list = data.recommendations || [];
    if (!list.length) {
      container.innerHTML = '<p class="admin-empty-notice">No recommendations found. Upload a LinkedIn CSV or add one manually.</p>';
      return;
    }

    container.innerHTML = list.map((rec, idx) => `
      <div class="admin-item-card">
        <div class="admin-item-content">
          <div style="display:flex; align-items:center; gap:0.5rem;">
            <h4 class="admin-item-title">${PortfolioUtils.escapeHtml(rec.author)}</h4>
            ${rec.featured ? '<span class="admin-tag admin-tag-success" style="background:#e6f4ea; color:#137333; padding: 2px 6px; border-radius: 4px; font-size: 0.75rem;">★ Featured</span>' : ''}
            ${rec.visible === false ? '<span class="admin-tag admin-tag-danger" style="background:#fce8e6; color:#c5221f; padding: 2px 6px; border-radius: 4px; font-size: 0.75rem;">👁 Hidden</span>' : ''}
          </div>
          <p class="admin-item-subtitle" style="margin: 0.15rem 0;">${PortfolioUtils.escapeHtml(rec.headline || '')} at ${PortfolioUtils.escapeHtml(rec.company || '')}</p>
          <p class="admin-item-excerpt" style="font-size:0.85rem; color:var(--adm-muted); margin-top:0.25rem;">"${PortfolioUtils.escapeHtml(rec.text.slice(0, 120))}${rec.text.length > 120 ? '...' : ''}"</p>
        </div>
        <div class="admin-item-actions">
          <button type="button" class="btn-adm btn-adm-secondary btn-adm-sm" data-action="moveRecommendation" data-arg0="arg" data-arg1="-1" ${idx === 0 ? 'disabled' : ''}>▲</button>
          <button type="button" class="btn-adm btn-adm-secondary btn-adm-sm" data-action="moveRecommendation" data-arg0="arg" data-arg1="1" ${idx === list.length - 1 ? 'disabled' : ''}>▼</button>
          <button type="button" class="btn-adm btn-adm-secondary btn-adm-sm" data-action="toggleRecommendationFeatured" data-arg0="arg">${rec.featured ? 'Unstar' : 'Star'}</button>
          <button type="button" class="btn-adm btn-adm-secondary btn-adm-sm" data-action="toggleRecommendationVisible" data-arg0="arg">${rec.visible !== false ? 'Hide' : 'Show'}</button>
          <button type="button" class="btn-adm btn-adm-secondary btn-adm-sm" data-action="editRecommendation" data-arg0="arg">Edit</button>
          <button type="button" class="btn-adm btn-adm-danger btn-adm-sm" data-action="deleteRecommendation" data-arg0="arg">Delete</button>
        </div>
      </div>
    `).join('');
  }

  window.moveRecommendation = function(idx, dir) {
    const list = data.recommendations || [];
    const targetIdx = idx + dir;
    if (targetIdx < 0 || targetIdx >= list.length) return;
    const temp = list[idx];
    list[idx] = list[targetIdx];
    list[targetIdx] = temp;
    renderRecommendationsList();
    showToast('Order updated.');
  };

  window.toggleRecommendationFeatured = function(idx) {
    const list = data.recommendations || [];
    list[idx].featured = !list[idx].featured;
    renderRecommendationsList();
    showToast(list[idx].featured ? 'Marked as featured.' : 'Removed from featured.');
  };

  window.toggleRecommendationVisible = function(idx) {
    const list = data.recommendations || [];
    // BUG-01 FIX: Was `!== false` which always evaluated to true — flipping correctly now
    list[idx].visible = list[idx].visible === false; // false→true, true→false
    renderRecommendationsList();
    showToast(list[idx].visible !== false ? 'Recommendation visible.' : 'Recommendation hidden.');
  };

  window.deleteRecommendation = function(idx) {
    if (confirm('Are you sure you want to delete this recommendation?')) {
      data.recommendations.splice(idx, 1);
      renderRecommendationsList();
      showToast('Recommendation deleted.');
    }
  };

  window.editRecommendation = function(idx) {
    const rec = data.recommendations[idx];
    openRecommendationFormModal(rec, false, idx);
  };

  function parseCSV(text) {
    const lines = [];
    let row = [""];
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      const next = text[i+1];

      if (c === '"') {
        if (inQuotes && next === '"') {
          row[row.length - 1] += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (c === ',' && !inQuotes) {
        row.push('');
      } else if ((c === '\r' || c === '\n') && !inQuotes) {
        if (c === '\r' && next === '\n') i++;
        lines.push(row);
        row = [''];
      } else {
        row[row.length - 1] += c;
      }
    }
    if (row.length > 1 || row[0] !== '') {
      lines.push(row);
    }
    return lines;
  }

  function handleCSVImport(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      const csvText = e.target.result;
      const rows = parseCSV(csvText);
      if (rows.length < 2) {
        alert('Invalid CSV structure or empty file.');
        return;
      }

      const headers = rows[0].map(h => h.trim().replace(/^"|"$/g, ''));
      const textIdx = headers.indexOf('Text');
      const firstNameIdx = headers.indexOf('First Name');
      const lastNameIdx = headers.indexOf('Last Name');
      const companyIdx = headers.indexOf('Company');
      const titleIdx = headers.indexOf('Job Title');
      const dateIdx = headers.indexOf('Creation Date');

      if (textIdx === -1 || firstNameIdx === -1) {
        alert('Missing required LinkedIn CSV columns. Ensure the file contains at least "First Name" and "Text".');
        return;
      }

      if (!data.recommendations) data.recommendations = [];
      let importedCount = 0;
      let duplicateCount = 0;

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (row.length < headers.length) continue;

        const text = row[textIdx].trim();
        const firstName = row[firstNameIdx].trim();
        const lastName = lastNameIdx !== -1 ? row[lastNameIdx].trim() : '';
        const author = `${firstName} ${lastName}`.trim();
        const company = companyIdx !== -1 ? row[companyIdx].trim() : '';
        const headline = titleIdx !== -1 ? row[titleIdx].trim() : '';
        const rawDate = dateIdx !== -1 ? row[dateIdx].trim() : '';

        if (!text || !firstName) continue;

        const isDuplicate = data.recommendations.some(r => {
          return r.author.toLowerCase() === author.toLowerCase() && 
                 r.text.substring(0, 50).toLowerCase() === text.substring(0, 50).toLowerCase();
        });

        if (isDuplicate) {
          duplicateCount++;
          continue;
        }

        let dateStr = rawDate;
        if (rawDate && rawDate.includes('/')) {
          try {
            const parsedD = new Date(rawDate.split(',')[0]);
            if (!isNaN(parsedD.getTime())) {
              const options = { year: 'numeric', month: 'long' };
              dateStr = parsedD.toLocaleDateString('en-US', options);
            }
          } catch(e) {}
        }

        data.recommendations.push({
          id: 'rec-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
          author: author,
          firstName: firstName,
          lastName: lastName,
          headline: headline,
          company: company,
          avatar: '',
          linkedinUrl: '',
          relationship: 'LinkedIn recommendation received',
          date: dateStr,
          text: text,
          featured: false,
          visible: true
        });
        importedCount++;
      }

      renderRecommendationsList();
      window.PortfolioStore.saveData(data).then(() => {
        showToast(`Imported ${importedCount} recommendations. (${duplicateCount} duplicates skipped) — Saved!`);
      }).catch(() => {
        showToast(`Imported ${importedCount} recommendations. (${duplicateCount} duplicates skipped) — Saved locally.`);
      });
    };
    reader.readAsText(file);
  }

  // Setup input triggers in DOM
  setTimeout(() => {
    const inputCsv = document.getElementById('input-rec-csv');
    const btnCsvTrigger = document.getElementById('btn-rec-csv-trigger');
    if (inputCsv && btnCsvTrigger) {
      btnCsvTrigger.addEventListener('click', () => inputCsv.click());
      inputCsv.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          handleCSVImport(file);
          e.target.value = '';
        }
      });
    }

    const btnAddRec = document.getElementById('btn-add-rec');
    if (btnAddRec) {
      btnAddRec.addEventListener('click', () => {
        openRecommendationFormModal({
          author: '',
          headline: '',
          company: '',
          avatar: '',
          linkedinUrl: '',
          relationship: 'Worked with Fazal',
          date: '',
          text: '',
          featured: false,
          visible: true
        }, true);
      });
    }

    const btnPasteTrigger = document.getElementById('btn-rec-paste-trigger');
    if (btnPasteTrigger) {
      btnPasteTrigger.addEventListener('click', () => {
        const template = `
          <div class="form-group full-width">
            <label class="form-label">Paste Raw Text or JSON</label>
            <textarea id="paste-rec-text" class="form-textarea" style="min-height: 250px;" placeholder="Paste raw recommendation text or a JSON array..."></textarea>
            <p style="font-size:0.8rem; color:var(--adm-muted); margin-top:0.5rem;">JSON format: [{"author":"Name", "text":"Text content", ...}] or plain text containing sections.</p>
          </div>
        `;
        openModal('Quick Paste Recommendation', template, () => {
          const raw = document.getElementById('paste-rec-text').value.trim();
          if (!raw) return false;

          try {
            if (raw.startsWith('[') || raw.startsWith('{')) {
              const parsed = JSON.parse(raw);
              const list = Array.isArray(parsed) ? parsed : [parsed];
              if (!data.recommendations) data.recommendations = [];
              list.forEach(item => {
                if (item.author && item.text) {
                  data.recommendations.push({
                    id: 'rec-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
                    author: item.author,
                    firstName: item.author.split(' ')[0] || '',
                    lastName: item.author.split(' ').slice(1).join(' ') || '',
                    headline: item.headline || '',
                    company: item.company || '',
                    avatar: item.avatar || '',
                    linkedinUrl: item.linkedinUrl || '',
                    relationship: item.relationship || 'LinkedIn recommendation received',
                    date: item.date || '',
                    text: item.text,
                    featured: !!item.featured,
                    visible: item.visible !== false
                  });
                }
              });
              renderRecommendationsList();
              showToast('JSON recommendations imported.');
              return true;
            }
          } catch(e) {
            const textClean = raw.replace(/\r\n/g, '\n');
            const lines = textClean.split('\n').filter(Boolean);
            if (lines.length >= 2) {
              const author = lines[0].trim();
              const text = lines.slice(1).join('\n').trim();
              if (!data.recommendations) data.recommendations = [];
              data.recommendations.push({
                id: 'rec-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
                author: author,
                firstName: author.split(' ')[0] || '',
                lastName: author.split(' ').slice(1).join(' ') || '',
                headline: 'LinkedIn Colleague',
                company: '',
                avatar: '',
                linkedinUrl: '',
                relationship: 'Worked with Fazal',
                date: '',
                text: text,
                featured: false,
                visible: true
              });
              renderRecommendationsList();
              showToast('Recommendation text imported.');
              return true;
            }
          }
          alert('Could not parse text. Ensure at least two lines: 1st line is Recommender Name, remaining lines are the text.');
          return false;
        });
      });
    }
  }, 100);

  function openRecommendationFormModal(rec, isNew, idx) {
    const template = `
      <div class="form-grid">
        <div class="form-group">
          <label class="form-label">Author Full Name *</label>
          <input type="text" id="modal-rec-author" class="form-input" value="${PortfolioUtils.escapeHtml(rec.author)}" required />
        </div>
        <div class="form-group">
          <label class="form-label">Job Title / Headline</label>
          <input type="text" id="modal-rec-headline" class="form-input" value="${PortfolioUtils.escapeHtml(rec.headline || '')}" placeholder="e.g. Senior Project Manager" />
        </div>
        <div class="form-group">
          <label class="form-label">Company Name</label>
          <input type="text" id="modal-rec-company" class="form-input" value="${PortfolioUtils.escapeHtml(rec.company || '')}" placeholder="e.g. Mediusware Limited" />
        </div>
        <div class="form-group">
          <label class="form-label">LinkedIn Profile URL</label>
          <input type="url" id="modal-rec-url" class="form-input" value="${PortfolioUtils.escapeHtml(rec.linkedinUrl || '')}" placeholder="https://linkedin.com/in/username" />
        </div>
        <div class="form-group">
          <label class="form-label">Relationship Badge</label>
          <input type="text" id="modal-rec-relationship" class="form-input" value="${PortfolioUtils.escapeHtml(rec.relationship || '')}" placeholder="e.g. Managed Fazal directly" />
        </div>
        <div class="form-group">
          <label class="form-label">Date</label>
          <input type="text" id="modal-rec-date" class="form-input" value="${PortfolioUtils.escapeHtml(rec.date || '')}" placeholder="e.g. July 2026" />
        </div>
        <div class="form-group">
          <label class="form-label">Avatar Image URL (Optional)</label>
          <input type="text" id="modal-rec-avatar" class="form-input" value="${PortfolioUtils.escapeHtml(rec.avatar || '')}" placeholder="assets/testimonials/avatar.jpg" />
        </div>
        <div class="form-group full-width">
          <label class="form-label">Recommendation Text *</label>
          <textarea id="modal-rec-text" class="form-textarea" style="min-height: 120px;" required>${PortfolioUtils.escapeHtml(rec.text || '')}</textarea>
        </div>
      </div>
    `;

    openModal(isNew ? 'Add Recommendation' : 'Edit Recommendation', template, () => {
      const author = document.getElementById('modal-rec-author').value.trim();
      const text = document.getElementById('modal-rec-text').value.trim();

      if (!author || !text) {
        alert('Please fill in Author Name and Recommendation Text.');
        return false;
      }

      const updated = {
        id: isNew ? 'rec-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5) : rec.id,
        author: author,
        firstName: author.split(' ')[0] || '',
        lastName: author.split(' ').slice(1).join(' ') || '',
        headline: document.getElementById('modal-rec-headline').value.trim(),
        company: document.getElementById('modal-rec-company').value.trim(),
        avatar: document.getElementById('modal-rec-avatar').value.trim(),
        linkedinUrl: document.getElementById('modal-rec-url').value.trim(),
        relationship: document.getElementById('modal-rec-relationship').value.trim(),
        date: document.getElementById('modal-rec-date').value.trim(),
        text: text,
        featured: rec.featured,
        visible: rec.visible !== false
      };

      if (!data.recommendations) data.recommendations = [];

      if (isNew) {
        data.recommendations.push(updated);
      } else {
        data.recommendations[idx] = updated;
      }

      renderRecommendationsList();
      showToast(isNew ? 'Recommendation added.' : 'Recommendation updated.');
      return true;
    });
  }

  /* ── 11. Modal Logic ────────────────────────────────────── */
  const modalBackdrop = document.getElementById('admin-modal-backdrop');
  const modalTitle = document.getElementById('modal-title');
  const modalBody = document.getElementById('modal-body');
  const modalSaveBtn = document.getElementById('modal-save-btn');
  const modalCancelBtn = document.getElementById('modal-cancel-btn');

  let modalSaveCallback = null;

  function openModal(title, htmlContent, onSave, onOpen) {
    // BUG-03 FIX: Guard against null modal DOM elements to prevent TypeError crashes
    if (!modalTitle || !modalBody || !modalBackdrop) {
      console.error('[Admin] openModal(): Modal DOM elements not found. Check admin.html for #modal-title, #modal-body, #admin-modal-backdrop.');
      return;
    }
    modalTitle.textContent = title;
    modalBody.innerHTML = htmlContent;
    modalSaveCallback = onSave;
    modalBackdrop.classList.add('open');
    if (typeof onOpen === 'function') {
      setTimeout(onOpen, 10);
    }
  }

  function closeModal() {
    modalBackdrop.classList.remove('open');
    modalSaveCallback = null;
  }

  if (modalSaveBtn) {
    modalSaveBtn.addEventListener('click', () => {
      if (modalSaveCallback) {
        const success = modalSaveCallback();
        if (success) closeModal();
      }
    });
  }

  if (modalCancelBtn) modalCancelBtn.addEventListener('click', closeModal);
  if (modalBackdrop) {
    modalBackdrop.addEventListener('click', (e) => {
      if (e.target === modalBackdrop) closeModal();
    });
  }

  /* ── 12. Save & Publish All Changes ─────────────────────── */
  const btnSaveAll = document.getElementById('btn-save-all');
  if (btnSaveAll) {
    btnSaveAll.addEventListener('click', async () => {
      // 1. Gather Profile
      data.profile.name = getVal('input-name');
      data.profile.firstName = getVal('input-firstName');
      data.profile.roleTitle = getVal('input-roleTitle');
      data.profile.heroBio = getVal('input-heroBio');
      data.profile.aboutLead = getVal('input-aboutLead');
      data.profile.fontPair = getVal('input-fontPair');
      
      // Save Rich Text About Story
      const aboutContent = aboutStoryEditor ? aboutStoryEditor.getHTML() : getVal('input-aboutParagraphs');
      if (aboutContent) {
        data.profile.aboutBodyParagraphs = [aboutContent];
      } else {
        data.profile.aboutBodyParagraphs = [];
      }

      data.profile.contactIntro = getVal('input-contactIntro');
      data.profile.email = getVal('input-email');
      data.profile.phone = getVal('input-phone');
      data.profile.linkedinUrl = getVal('input-linkedin');
      data.profile.githubUrl = getVal('input-github');
      data.profile.resumeUrl = getVal('input-resumeUrl');
      data.profile.location = getVal('input-location');
      data.profile.copyrightYear = parseInt(getVal('input-copyrightYear'), 10) || 2026;
      data.profile.footerTagline = getVal('input-footerTagline');

      // 2. Gather Availability & Typewriter
      if (!data.availability) data.availability = {};
      data.availability.status = getVal('input-avail-status');
      data.availability.badgeText = getVal('input-avail-text');
      data.availability.typewriterRoles = getVal('input-typewriter-roles').split(',').map(r => r.trim()).filter(Boolean);

      // 3. Gather Metrics
      if (data.metrics) {
        data.metrics.forEach((m, idx) => {
          const numEl = document.getElementById(`metric-num-${idx}`);
          const sufEl = document.getElementById(`metric-suffix-${idx}`);
          const lblEl = document.getElementById(`metric-label-${idx}`);
          const subEl = document.getElementById(`metric-subtext-${idx}`);
          if (numEl) m.number = numEl.value.trim();
          if (sufEl) m.suffix = sufEl.value.trim();
          if (lblEl) m.label = lblEl.value.trim();
          if (subEl) m.subtext = subEl.value.trim();
        });
      }

      // 4. Gather Navigation & Header
      if (!data.navigation) data.navigation = {};
      data.navigation.logoText = getVal('input-nav-logo-text');
      data.navigation.logoLink = getVal('input-nav-logo-link');
      data.navigation.logoDot = getChecked('checkbox-nav-logo-dot');
      if (!data.navigation.cta) data.navigation.cta = {};
      data.navigation.cta.text = getVal('input-nav-cta-text');
      data.navigation.cta.url = getVal('input-nav-cta-url');
      data.navigation.cta.visible = getChecked('checkbox-nav-cta-visible');

      // 5. Gather Page Sections & Visibility
      if (!data.sections) data.sections = {};
      
      // Home Hero
      if (!data.sections.homeHero) data.sections.homeHero = {};
      data.sections.homeHero.label = getVal('input-sec-home-hero-label');
      data.sections.homeHero.metricsVisible = getChecked('checkbox-sec-metrics-visible');
      if (!data.sections.homeHero.cta1) data.sections.homeHero.cta1 = {};
      data.sections.homeHero.cta1.text = getVal('input-sec-hero-cta1-text');
      data.sections.homeHero.cta1.url = getVal('input-sec-hero-cta1-url');
      // FIX 7: Preserve existing visibility instead of hardcoding true
      data.sections.homeHero.cta1.visible = data.sections.homeHero.cta1.visible !== false;

      if (!data.sections.homeHero.cta2) data.sections.homeHero.cta2 = {};
      data.sections.homeHero.cta2.text = getVal('input-sec-hero-cta2-text');
      data.sections.homeHero.cta2.url = getVal('input-sec-hero-cta2-url');
      data.sections.homeHero.cta2.visible = data.sections.homeHero.cta2.visible !== false;

      if (!data.sections.homeHero.cta3) data.sections.homeHero.cta3 = {};
      data.sections.homeHero.cta3.text = getVal('input-sec-hero-cta3-text');
      data.sections.homeHero.cta3.url = getVal('input-sec-hero-cta3-url');
      data.sections.homeHero.cta3.visible = data.sections.homeHero.cta3.visible !== false;

      // Expertise
      if (!data.sections.expertise) data.sections.expertise = {};
      data.sections.expertise.label = getVal('input-sec-exp-label');
      data.sections.expertise.visible = getChecked('checkbox-sec-exp-vis');

      // Awards
      if (!data.sections.awards) data.sections.awards = {};
      data.sections.awards.label = getVal('input-sec-awards-label');
      data.sections.awards.subtext = getVal('input-sec-awards-subtext');
      data.sections.awards.visible = getChecked('checkbox-sec-awards-vis');

      // Experience
      if (!data.sections.experience) data.sections.experience = {};
      data.sections.experience.label = getVal('input-sec-experience-label');
      data.sections.experience.subtext = getVal('input-sec-experience-subtext');
      data.sections.experience.ctaText = getVal('input-sec-experience-cta-text');
      data.sections.experience.ctaUrl = getVal('input-sec-experience-cta-url');
      data.sections.experience.visible = getChecked('checkbox-sec-experience-vis');

      // Work
      if (!data.sections.work) data.sections.work = {};
      data.sections.work.label = getVal('input-sec-work-label');
      data.sections.work.subtext = getVal('input-sec-work-subtext');
      data.sections.work.ctaText = getVal('input-sec-work-cta-text');
      data.sections.work.ctaUrl = getVal('input-sec-work-cta-url');
      data.sections.work.visible = getChecked('checkbox-sec-work-vis');

      // Articles
      if (!data.sections.articles) data.sections.articles = {};
      data.sections.articles.label = getVal('input-sec-art-label');
      data.sections.articles.subtext = getVal('input-sec-art-subtext');
      data.sections.articles.visible = getChecked('checkbox-sec-art-vis');

      // Recommendations
      if (!data.sections.recommendations) data.sections.recommendations = {};
      data.sections.recommendations.label = getVal('input-rec-section-label');
      data.sections.recommendations.subtext = getVal('input-rec-section-subtext');
      data.sections.recommendations.visible = getChecked('checkbox-sec-rec-vis');

      // About Page
      if (!data.sections.aboutPage) data.sections.aboutPage = {};
      data.sections.aboutPage.heroLabel = getVal('input-sec-ab-hero-label');
      data.sections.aboutPage.bioLabel = getVal('input-sec-ab-bio-label');
      data.sections.aboutPage.heroSubtitle = getVal('input-sec-ab-hero-sub');
      data.sections.aboutPage.awardsLabel = getVal('input-sec-ab-awards-label');
      data.sections.aboutPage.awardsVisible = getChecked('checkbox-sec-ab-awards-vis');
      data.sections.aboutPage.educationLabel = getVal('input-sec-ab-edu-label');
      data.sections.aboutPage.educationVisible = getChecked('checkbox-sec-ab-edu-vis');
      data.sections.aboutPage.experienceLabel = getVal('input-sec-ab-exp-label');
      data.sections.aboutPage.experienceVisible = getChecked('checkbox-sec-ab-exp-vis');
      data.sections.aboutPage.skillsLabel = getVal('input-sec-ab-skills-label');
      data.sections.aboutPage.skillsVisible = getChecked('checkbox-sec-ab-skills-vis');
      data.sections.aboutPage.extrasLabel = getVal('input-sec-ab-extras-label');
      data.sections.aboutPage.extrasVisible = getChecked('checkbox-sec-ab-extras-vis');

      // Projects Page
      if (!data.sections.projectsPage) data.sections.projectsPage = {};
      data.sections.projectsPage.heroLabel = getVal('input-sec-pr-hero-label');
      data.sections.projectsPage.heroTitle = getVal('input-sec-pr-hero-title');
      data.sections.projectsPage.heroSubtitle = getVal('input-sec-pr-hero-sub');
      data.sections.projectsPage.researchLabel = getVal('input-sec-pr-res-label');
      data.sections.projectsPage.researchVisible = getChecked('checkbox-sec-pr-res-vis');
      data.sections.projectsPage.publicationLabel = getVal('input-sec-pr-pub-label');
      data.sections.projectsPage.publicationVisible = getChecked('checkbox-sec-pr-pub-vis');
      data.sections.projectsPage.softwareLabel = getVal('input-sec-pr-soft-label');
      data.sections.projectsPage.softwareVisible = getChecked('checkbox-sec-pr-soft-vis');
      data.sections.projectsPage.volunteerLabel = getVal('input-sec-pr-vol-label');
      data.sections.projectsPage.volunteerVisible = getChecked('checkbox-sec-pr-vol-vis');

      // 404 Error Page
      if (!data.sections.errorPage) data.sections.errorPage = {};
      data.sections.errorPage.code = getVal('input-sec-404-code');
      data.sections.errorPage.heading = getVal('input-sec-404-heading');
      data.sections.errorPage.description = getVal('input-sec-404-desc');
      data.sections.errorPage.cta1Text = getVal('input-sec-404-cta1-text');
      data.sections.errorPage.cta1Url = getVal('input-sec-404-cta1-url');
      data.sections.errorPage.cta2Text = getVal('input-sec-404-cta2-text');
      data.sections.errorPage.cta2Url = getVal('input-sec-404-cta2-url');

      // 6. Gather Contact Section & Form
      if (!data.sections.contact) data.sections.contact = {};
      data.sections.contact.label = getVal('input-sec-contact-label');
      data.sections.contact.heading = getVal('input-sec-contact-heading');
      data.sections.contact.subtext = getVal('textarea-sec-contact-subtext');
      data.sections.contact.visible = getChecked('checkbox-sec-contact-vis');

      if (!data.sections.contact.form) data.sections.contact.form = {};
      data.sections.contact.form.nameLabel = getVal('input-contact-name-label');
      data.sections.contact.form.namePlaceholder = getVal('input-contact-name-ph');
      data.sections.contact.form.emailLabel = getVal('input-contact-email-label');
      data.sections.contact.form.emailPlaceholder = getVal('input-contact-email-ph');
      data.sections.contact.form.subjectLabel = getVal('input-contact-subj-label');
      data.sections.contact.form.subjectPlaceholder = getVal('input-contact-subj-ph');
      data.sections.contact.form.messageLabel = getVal('input-contact-msg-label');
      data.sections.contact.form.messagePlaceholder = getVal('input-contact-msg-ph');
      data.sections.contact.form.submitText = getVal('input-contact-submit-text');

      if (!data.sections.contact.details) data.sections.contact.details = {};
      data.sections.contact.details.emailLabel = getVal('input-contact-lbl-email');
      data.sections.contact.details.phoneLabel = getVal('input-contact-lbl-phone');
      data.sections.contact.details.locationLabel = getVal('input-contact-lbl-location');
      data.sections.contact.details.connectLabel = getVal('input-contact-lbl-connect');

      // 7. Gather Footer
      if (!data.footer) data.footer = {};
      data.footer.tagline = getVal('textarea-footer-tagline');
      data.footer.navTitle = getVal('input-footer-col1-title');
      data.footer.connectTitle = getVal('input-footer-col2-title');
      data.footer.copyright = getVal('input-footer-copyright');

      // 8. Gather SEO
      if (!data.seo) data.seo = {};
      data.seo.siteTitle = getVal('input-seo-title');
      data.seo.metaDescription = getVal('textarea-seo-desc');
      data.seo.keywords = getVal('textarea-seo-keywords');
      data.seo.ogImage = getVal('input-seo-og-image');

      // FIX 3: Guard against portfolioDataChanged listener re-reading data
      // mid-save and clobbering in-memory edits not yet flushed to localStorage.
      window._adminSaveInProgress = true;
      const res = await window.PortfolioStore.saveData(data);
      window._adminSaveInProgress = false;

      if (res.success) {
        if (res.serverSynced) {
          showToast('🚀 All changes saved and committed to GitHub! Live in ~30s.');
        } else {
          const errMsg = res.error ? `Sync failed: ${res.error}` : 'Configure a GitHub token in Settings to sync live.';
          showToast(`💾 Changes saved locally. (${errMsg})`, 'error');
        }
      } else {
        window._adminSaveInProgress = false;
        alert('Failed to save changes: ' + res.error);
      }
    });
  }

  /* ── 13. Password Change Form ───────────────────────────── */
  const formChangePassword = document.getElementById('form-change-password');
  if (formChangePassword) {
    formChangePassword.addEventListener('submit', async (e) => {
      e.preventDefault();
      const curr = getVal('input-curr-pwd');
      const newP = getVal('input-new-pwd');
      const conf = getVal('input-confirm-pwd');

      if (!curr || !newP || !conf) {
        alert('Please fill in all password fields.');
        return;
      }
      if (newP !== conf) {
        alert('New passwords do not match.');
        return;
      }
      if (newP.length < 4) {
        alert('New password must be at least 4 characters long.');
        return;
      }

      const res = await window.PortfolioStore.changePassword(curr, newP);
      if (res.success) {
        showToast('🔒 Master password successfully updated!');
        setVal('input-curr-pwd', '');
        setVal('input-new-pwd', '');
        setVal('input-confirm-pwd', '');
      } else {
        alert(res.error || 'Failed to update password.');
      }
    });
  }

  /* ── 14. Export, Import & Reset Backup Tools ────────────── */
  const btnExportJson = document.getElementById('btn-export-json');
  if (btnExportJson) {
    btnExportJson.addEventListener('click', () => {
      window.PortfolioStore.exportJSON();
      showToast('data.json backup downloaded.');
    });
  }

  const btnImportTrigger = document.getElementById('btn-import-trigger');
  const inputImportJson = document.getElementById('input-import-json');
  if (btnImportTrigger && inputImportJson) {
    btnImportTrigger.addEventListener('click', () => inputImportJson.click());
    inputImportJson.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async (event) => {
        const res = await window.PortfolioStore.importJSON(event.target.result);
        if (res.success) {
          data = res.data;
          populateAll();
          showToast('Backup restored successfully!');
        } else {
          alert('Import failed: ' + res.error);
        }
      };
      reader.readAsText(file);
    });
  }

  const btnResetDefault = document.getElementById('btn-reset-default');
  if (btnResetDefault) {
    btnResetDefault.addEventListener('click', () => {
      if (confirm('Reset all content to original resume defaults? Any unpublished modifications will be cleared.')) {
        const res = window.PortfolioStore.resetToDefault();
        if (res.success) {
          populateAll();
          showToast('Reset to original default data.');
        }
      }
    });
  }

  /* ── Helper: Toast Feedback ────────────────────────────── */
  function showToast(msg, type = 'success') {
    let toast = document.getElementById('admin-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'admin-toast';
      toast.className = 'admin-toast';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.className = `admin-toast ${type} show`;
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3200);
  }

  // Expose global PortfolioAdmin namespace
  window.PortfolioAdmin = {
    handleLogin,
    togglePasswordVisibility: function() {
      const inp = document.getElementById('input-admin-password');
      const btn = document.getElementById('btn-toggle-pwd');
      if (inp && btn) {
        const cur = inp.getAttribute('type') || 'password';
        const next = cur === 'password' ? 'text' : 'password';
        inp.setAttribute('type', next);
        btn.textContent = next === 'password' ? '👁️' : '🙈';
        btn.setAttribute('title', next === 'password' ? 'Show password' : 'Hide password');
        inp.focus();
      }
    },
    unlockDashboard,
    lockDashboard,
    populateAll,
    init: initAdminApp
  };

  // FIX 3: Only refresh in-memory data from store when it's safe to do so.
  // During an active save (_adminSaveInProgress), we skip the refresh to prevent
  // the event fired by our own saveData() from clobbering unsaved in-memory edits.
  window.addEventListener('portfolioDataChanged', () => {
    if (window._adminSaveInProgress) return;
    data = window.PortfolioStore.getData();
    // Only call populateAll if the dashboard is already unlocked (server-sync scenario)
    if (window.PortfolioStore.isAuthenticated() && mainContent && mainContent.style.display !== 'none') {
      try { populateAll(); } catch(e) {
        console.warn('[Admin] populateAll skipped on data change:', e);
      }
    }
  });

  // Initialize Auth Check
  checkAuth();
  // Global event delegation for list actions
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.getAttribute('data-action');
    if (action && typeof window[action] === 'function') {
      const arg0Str = btn.getAttribute('data-arg0');
      const arg1Str = btn.getAttribute('data-arg1');
      const arg0 = arg0Str ? (isNaN(arg0Str) ? arg0Str : parseInt(arg0Str, 10)) : undefined;
      const arg1 = arg1Str ? (isNaN(arg1Str) ? arg1Str : parseInt(arg1Str, 10)) : undefined;
      if (arg1 !== undefined) {
        window[action](arg0, arg1);
      } else if (arg0 !== undefined) {
        window[action](arg0);
      } else {
        window[action]();
      }
    }
  });

}

// Resilient auto-initialization
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAdminApp);
} else {
  initAdminApp();
}
