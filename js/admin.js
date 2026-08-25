/* ============================================================
   PORTFOLIO CMS ADMIN LOGIC & AUTH (js/admin.js)
   With Built-in Rich Text WYSIWYG Editor Support
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
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

      <div class="rte-content" contenteditable="true" data-placeholder="${escapeHtml(placeholder)}"></div>
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
          .map(p => `<p>${escapeHtml(p)}</p>`)
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
          document.execCommand('createLink', false, url);
          contentArea.querySelectorAll('a').forEach(a => a.setAttribute('target', '_blank'));
        }
        return;
      }

      if (cmd) {
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
    lockscreen.classList.add('hidden');
    if (sidebar) sidebar.style.display = 'flex';
    if (mainContent) mainContent.style.display = 'block';
    populateAll();
  }

  function lockDashboard() {
    lockscreen.classList.remove('hidden');
    if (sidebar) sidebar.style.display = 'none';
    if (mainContent) mainContent.style.display = 'none';
    if (inputAdminPassword) {
      inputAdminPassword.value = '';
      inputAdminPassword.focus();
    }
    if (lockErrorMsg) lockErrorMsg.classList.remove('visible');
  }

  async function handleLogin() {
    const password = inputAdminPassword ? inputAdminPassword.value : '';
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

  if (btnTogglePwd && inputAdminPassword) {
    btnTogglePwd.addEventListener('click', () => {
      const type = inputAdminPassword.getAttribute('type') === 'password' ? 'text' : 'password';
      inputAdminPassword.setAttribute('type', type);
      btnTogglePwd.textContent = type === 'password' ? '👁️' : '🔒';
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
    setVal('input-avail-text', avail.badgeText || 'Available for New Opportunities');
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
  }

  function setVal(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val !== undefined && val !== null ? val : '';
  }

  function getVal(id) {
    const el = document.getElementById(id);
    return el ? el.value.trim() : '';
  }

  /* ── 4. Metrics Editor ──────────────────────────────────── */
  function renderMetricsEditor() {
    const container = document.getElementById('metrics-editor-grid');
    if (!container) return;

    const metrics = data.metrics || [];
    container.innerHTML = metrics.map((m, idx) => `
      <div class="form-group" style="background:rgba(255,255,255,0.02); padding:1rem; border-radius:8px; border:1px solid var(--adm-border);">
        <label class="form-label" style="color:var(--adm-accent-hover)">Card #${idx + 1}: ${escapeHtml(m.label)}</label>
        <div style="display:grid; grid-template-columns: 2fr 1fr; gap:0.5rem; margin-bottom:0.5rem;">
          <input type="text" class="form-input" id="metric-num-${idx}" value="${escapeHtml(m.number)}" placeholder="Number (e.g. 21)" />
          <input type="text" class="form-input" id="metric-suffix-${idx}" value="${escapeHtml(m.suffix)}" placeholder="Suffix (+)" />
        </div>
        <input type="text" class="form-input" id="metric-label-${idx}" value="${escapeHtml(m.label)}" placeholder="Label" style="margin-bottom:0.5rem;" />
        <input type="text" class="form-input" id="metric-subtext-${idx}" value="${escapeHtml(m.subtext)}" placeholder="Subtext" />
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
          <h4>${escapeHtml(awd.title)} ${awd.badge ? `<span style="font-size:0.85rem; background:rgba(245,158,11,0.15); color:#FBBF24; padding:3px 8px; border-radius:4px; margin-left:6px;">${escapeHtml(awd.badge)}</span>` : ''}</h4>
          <p>${escapeHtml(awd.organization)} · <span style="color:var(--adm-accent)">${escapeHtml(awd.year)}</span></p>
        </div>
        <div class="item-actions">
          <button class="btn-adm btn-adm-secondary btn-adm-sm" onclick="window.editAward(${index})">Edit</button>
          <button class="btn-adm btn-adm-danger btn-adm-sm" onclick="window.deleteAward(${index})">Delete</button>
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
          <input type="text" id="modal-awd-title" class="form-input" value="${escapeHtml(awd.title)}" placeholder="e.g. Best Presentation Award" />
        </div>
        <div class="form-group">
          <label class="form-label">Organization / Conference *</label>
          <input type="text" id="modal-awd-org" class="form-input" value="${escapeHtml(awd.organization)}" placeholder="e.g. Springer CNC-2018" />
        </div>
        <div class="form-group">
          <label class="form-label">Year / Date</label>
          <input type="text" id="modal-awd-year" class="form-input" value="${escapeHtml(awd.year)}" placeholder="e.g. 2018" />
        </div>
        <div class="form-group full-width">
          <label class="form-label">Ribbon Badge Text (Optional)</label>
          <input type="text" id="modal-awd-badge" class="form-input" value="${escapeHtml(awd.badge || '')}" placeholder="e.g. Springer Award" />
        </div>
        <div class="form-group full-width">
          <label class="form-label">Description</label>
          <textarea id="modal-awd-desc" class="form-textarea" style="min-height:90px;" placeholder="Details about this award...">${escapeHtml(awd.description || '')}</textarea>
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
          <h4>${escapeHtml(art.title)} <span style="font-size:0.85rem; background:rgba(59,130,246,0.15); color:var(--adm-accent-hover); padding:3px 8px; border-radius:4px; margin-left:6px;">${escapeHtml(art.category || 'Article')}</span></h4>
          <p>${escapeHtml(art.date)} · <span style="color:var(--adm-muted)">${escapeHtml(art.readTime || '5 min read')}</span></p>
        </div>
        <div class="item-actions">
          <button class="btn-adm btn-adm-secondary btn-adm-sm" onclick="window.editArticle(${index})">Edit</button>
          <button class="btn-adm btn-adm-danger btn-adm-sm" onclick="window.deleteArticle(${index})">Delete</button>
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
          <input type="text" id="modal-art-title" class="form-input" value="${escapeHtml(art.title)}" placeholder="e.g. Bridging the Gap: CS + MBA Thinking" />
        </div>
        <div class="form-group">
          <label class="form-label">Category</label>
          <input type="text" id="modal-art-category" class="form-input" value="${escapeHtml(art.category)}" placeholder="e.g. Leadership / Operations" />
        </div>
        <div class="form-group">
          <label class="form-label">Publish Date &amp; Reading Time</label>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.5rem;">
            <input type="text" id="modal-art-date" class="form-input" value="${escapeHtml(art.date)}" placeholder="e.g. Aug 2024" />
            <input type="text" id="modal-art-readTime" class="form-input" value="${escapeHtml(art.readTime)}" placeholder="e.g. 5 min read" />
          </div>
        </div>
        <div class="form-group full-width">
          <label class="form-label">Summary / Excerpt (Displayed on homepage preview) *</label>
          <textarea id="modal-art-summary" class="form-textarea" style="min-height:75px;">${escapeHtml(art.summary)}</textarea>
        </div>
        <div class="form-group full-width">
          <label class="form-label">Tags (Comma-separated)</label>
          <input type="text" id="modal-art-tags" class="form-input" value="${escapeHtml((art.tags || []).join(', '))}" placeholder="Agile, SaaS, Leadership" />
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
          <h4>${escapeHtml(job.role)} <span style="color:var(--adm-muted)">at</span> ${escapeHtml(job.company)} ${job.isCurrent ? '<span style="font-size:0.85rem; background:rgba(16,185,129,0.2); color:#34D399; padding:3px 7px; border-radius:4px;">Current</span>' : ''}</h4>
          <p>${escapeHtml(job.period)}</p>
        </div>
        <div class="item-actions">
          <button class="btn-adm btn-adm-secondary btn-adm-sm" onclick="window.editExperience(${index})">Edit</button>
          <button class="btn-adm btn-adm-danger btn-adm-sm" onclick="window.deleteExperience(${index})">Delete</button>
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
          <input type="text" id="modal-exp-role" class="form-input" value="${escapeHtml(job.role)}" />
        </div>
        <div class="form-group">
          <label class="form-label">Company Name *</label>
          <input type="text" id="modal-exp-company" class="form-input" value="${escapeHtml(job.company)}" />
        </div>
        <div class="form-group">
          <label class="form-label">Company Website URL</label>
          <input type="url" id="modal-exp-companyUrl" class="form-input" value="${escapeHtml(job.companyUrl || '')}" />
        </div>
        <div class="form-group">
          <label class="form-label">Period (e.g. Aug 2024 — Present) *</label>
          <input type="text" id="modal-exp-period" class="form-input" value="${escapeHtml(job.period)}" />
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
          <h4>${escapeHtml(proj.title)} <span style="font-size:0.8rem; background:rgba(255,255,255,0.06); color:var(--adm-muted); padding:2px 6px; border-radius:4px;">${escapeHtml(proj.category)}</span></h4>
          <p>${escapeHtml(proj.year)}</p>
        </div>
        <div class="item-actions">
          <button class="btn-adm btn-adm-secondary btn-adm-sm" onclick="window.editProject(${index})">Edit</button>
          <button class="btn-adm btn-adm-danger btn-adm-sm" onclick="window.deleteProject(${index})">Delete</button>
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
          <input type="text" id="modal-proj-title" class="form-input" value="${escapeHtml(proj.title)}" />
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
          <input type="text" id="modal-proj-year" class="form-input" value="${escapeHtml(proj.year)}" />
        </div>
        <div class="form-group">
          <label class="form-label">External Project Link (Optional)</label>
          <input type="url" id="modal-proj-link" class="form-input" value="${escapeHtml(proj.link || '')}" placeholder="https://..." />
        </div>
        <div class="form-group">
          <label class="form-label">Honor Badge (e.g. Best Presentation)</label>
          <input type="text" id="modal-proj-badge" class="form-input" value="${escapeHtml(proj.badge || '')}" />
        </div>
        <div class="form-group full-width">
          <label class="form-label">Tags (Comma-separated)</label>
          <input type="text" id="modal-proj-tags" class="form-input" value="${escapeHtml((proj.tags || []).join(', '))}" />
        </div>
        <div class="form-group full-width">
          <label class="form-label">Project Description</label>
          <textarea id="modal-proj-desc" class="form-textarea" style="min-height:95px;">${escapeHtml(proj.description || '')}</textarea>
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
          <h4>${escapeHtml(edu.degree)}</h4>
          <p>${escapeHtml(edu.institution)} · <span style="color:var(--adm-accent)">${escapeHtml(edu.year)}</span></p>
        </div>
        <div class="item-actions">
          <button class="btn-adm btn-adm-secondary btn-adm-sm" onclick="window.editEducation(${index})">Edit</button>
          <button class="btn-adm btn-adm-danger btn-adm-sm" onclick="window.deleteEducation(${index})">Delete</button>
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
          <input type="text" id="modal-edu-degree" class="form-input" value="${escapeHtml(edu.degree)}" />
        </div>
        <div class="form-group">
          <label class="form-label">Field of Study</label>
          <input type="text" id="modal-edu-field" class="form-input" value="${escapeHtml(edu.field)}" />
        </div>
        <div class="form-group">
          <label class="form-label">Institution Name *</label>
          <input type="text" id="modal-edu-institution" class="form-input" value="${escapeHtml(edu.institution)}" />
        </div>
        <div class="form-group">
          <label class="form-label">Year of Completion</label>
          <input type="text" id="modal-edu-year" class="form-input" value="${escapeHtml(edu.year)}" />
        </div>
        <div class="form-group">
          <label class="form-label">Grade / GPA / CGPA</label>
          <input type="text" id="modal-edu-grade" class="form-input" value="${escapeHtml(edu.grade)}" />
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
          ${escapeHtml(skill)}
          <button type="button" onclick="window.removeSkillTag('${cat}', ${idx})" title="Remove skill">&times;</button>
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

  /* ── 11. Modal Logic ────────────────────────────────────── */
  const modalBackdrop = document.getElementById('admin-modal-backdrop');
  const modalTitle = document.getElementById('modal-title');
  const modalBody = document.getElementById('modal-body');
  const modalSaveBtn = document.getElementById('modal-save-btn');
  const modalCancelBtn = document.getElementById('modal-cancel-btn');

  let modalSaveCallback = null;

  function openModal(title, htmlContent, onSave, onOpen) {
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
    btnSaveAll.addEventListener('click', () => {
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

      // Save to storage
      const res = window.PortfolioStore.saveData(data);
      if (res.success) {
        showToast('🎉 All portfolio changes published live!');
      } else {
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
    inputImportJson.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        const res = window.PortfolioStore.importJSON(event.target.result);
        if (res.success) {
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

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Initialize Auth Check
  checkAuth();
});
