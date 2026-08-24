/* ============================================================
   PORTFOLIO CMS ADMIN LOGIC & AUTH (js/admin.js)
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  if (!window.PortfolioStore) {
    console.error('PortfolioStore not loaded.');
    return;
  }

  let data = window.PortfolioStore.getData();

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

  // Handle Login submission
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
      void lockCard.offsetWidth; // trigger reflow
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

  // Toggle show/hide password
  if (btnTogglePwd && inputAdminPassword) {
    btnTogglePwd.addEventListener('click', () => {
      const type = inputAdminPassword.getAttribute('type') === 'password' ? 'text' : 'password';
      inputAdminPassword.setAttribute('type', type);
      btnTogglePwd.textContent = type === 'password' ? '👁️' : '🔒';
    });
  }

  // Handle Logout
  if (btnLogout) {
    btnLogout.addEventListener('click', () => {
      window.PortfolioStore.logout();
      lockDashboard();
      showToast('Logged out of Admin CMS.', 'info');
    });
  }

  // Handle Change Password Form
  const btnUpdatePwd = document.getElementById('btn-update-pwd');
  if (btnUpdatePwd) {
    btnUpdatePwd.addEventListener('click', async () => {
      const curr = document.getElementById('input-curr-pwd').value;
      const next = document.getElementById('input-new-pwd').value;
      const confirm = document.getElementById('input-confirm-pwd').value;

      if (!curr) {
        showToast('Please enter your current password.', 'danger');
        return;
      }

      if (next !== confirm) {
        showToast('New password and confirmation do not match.', 'danger');
        return;
      }

      const res = await window.PortfolioStore.changePassword(curr, next);
      if (res.success) {
        document.getElementById('input-curr-pwd').value = '';
        document.getElementById('input-new-pwd').value = '';
        document.getElementById('input-confirm-pwd').value = '';
        showToast('Admin password updated successfully! 🔐');
      } else {
        showToast(res.error || 'Failed to update password.', 'danger');
      }
    });
  }

  /* ── 2. Tab Switching ──────────────────────────────────── */
  const navButtons = document.querySelectorAll('.admin-nav-item button');
  const panels = document.querySelectorAll('.admin-panel');

  navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetPanel = btn.getAttribute('data-tab');
      navButtons.forEach(b => b.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const panel = document.getElementById(`panel-${targetPanel}`);
      if (panel) panel.classList.add('active');
    });
  });

  /* ── 3. Toast System ───────────────────────────────────── */
  function showToast(message, type = 'success') {
    let container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icon = type === 'success' ? '✅' : (type === 'danger' ? '⚠️' : 'ℹ️');
    toast.innerHTML = `<span>${icon}</span> <span>${escapeHtml(message)}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  /* ── 4. Populate Profile Form ──────────────────────────── */
  function populateProfileForm() {
    const p = data.profile || {};
    setVal('input-name', p.name);
    setVal('input-firstName', p.firstName);
    setVal('input-roleTitle', p.roleTitle);
    setVal('input-location', p.location);
    setVal('input-heroBio', p.heroBio);
    setVal('input-aboutLead', p.aboutLead);
    setVal('input-aboutParagraphs', (p.aboutBodyParagraphs || []).join('\n\n'));
    setVal('input-contactIntro', p.contactIntro);
    setVal('input-email', p.email);
    setVal('input-phone', p.phone);
    setVal('input-linkedin', p.linkedinUrl);
    setVal('input-github', p.githubUrl);
    setVal('input-footerTagline', p.footerTagline);
    setVal('input-copyrightYear', p.copyrightYear || 2026);
  }

  function readProfileForm() {
    data.profile = data.profile || {};
    data.profile.name = getVal('input-name');
    data.profile.firstName = getVal('input-firstName');
    data.profile.roleTitle = getVal('input-roleTitle');
    data.profile.location = getVal('input-location');
    data.profile.heroBio = getVal('input-heroBio');
    data.profile.aboutLead = getVal('input-aboutLead');
    data.profile.aboutBodyParagraphs = getVal('input-aboutParagraphs')
      .split('\n\n')
      .map(s => s.trim())
      .filter(Boolean);
    data.profile.contactIntro = getVal('input-contactIntro');
    data.profile.email = getVal('input-email');
    data.profile.phone = getVal('input-phone');
    data.profile.linkedinUrl = getVal('input-linkedin');
    data.profile.githubUrl = getVal('input-github');
    data.profile.footerTagline = getVal('input-footerTagline');
    data.profile.copyrightYear = parseInt(getVal('input-copyrightYear'), 10) || 2026;
  }

  /* ── 5. Render Experience List ─────────────────────────── */
  const expListEl = document.getElementById('experience-list');
  function renderExperienceList() {
    if (!expListEl) return;
    expListEl.innerHTML = '';

    (data.experience || []).forEach((job, index) => {
      const row = document.createElement('div');
      row.className = 'item-row';
      row.innerHTML = `
        <div class="item-info">
          <h4>${escapeHtml(job.role)} ${job.isCurrent ? '<span class="tag" style="margin-left: 0.5rem;">Current</span>' : ''}</h4>
          <div class="item-sub">
            <span style="color: var(--adm-accent-hover);">${escapeHtml(job.company)}</span>
            <span>•</span>
            <span>${escapeHtml(job.period)}</span>
            <span>•</span>
            <span>${(job.bullets || []).length} bullets</span>
          </div>
        </div>
        <div class="item-actions">
          <button class="btn-adm btn-adm-secondary btn-adm-sm" data-action="edit-exp" data-index="${index}">✏️ Edit</button>
          <button class="btn-adm btn-adm-danger btn-adm-sm" data-action="delete-exp" data-index="${index}">🗑️</button>
        </div>
      `;
      expListEl.appendChild(row);
    });
  }

  /* ── 6. Render Projects List ───────────────────────────── */
  const projListEl = document.getElementById('projects-list');
  function renderProjectsList() {
    if (!projListEl) return;
    projListEl.innerHTML = '';

    (data.projects || []).forEach((proj, index) => {
      const row = document.createElement('div');
      row.className = 'item-row';
      row.innerHTML = `
        <div class="item-info">
          <h4>${escapeHtml(proj.title)}</h4>
          <div class="item-sub">
            <span class="tag">${escapeHtml(proj.category)}</span>
            <span>${escapeHtml(proj.year)}</span>
            <span>•</span>
            <span>${(proj.tags || []).join(', ')}</span>
          </div>
        </div>
        <div class="item-actions">
          <button class="btn-adm btn-adm-secondary btn-adm-sm" data-action="edit-proj" data-index="${index}">✏️ Edit</button>
          <button class="btn-adm btn-adm-danger btn-adm-sm" data-action="delete-proj" data-index="${index}">🗑️</button>
        </div>
      `;
      projListEl.appendChild(row);
    });
  }

  /* ── 7. Render Education List ──────────────────────────── */
  const eduListEl = document.getElementById('education-list');
  function renderEducationList() {
    if (!eduListEl) return;
    eduListEl.innerHTML = '';

    (data.education || []).forEach((edu, index) => {
      const row = document.createElement('div');
      row.className = 'item-row';
      row.innerHTML = `
        <div class="item-info">
          <h4>${escapeHtml(edu.degree)}</h4>
          <div class="item-sub">
            <span style="color: var(--adm-accent-hover);">${escapeHtml(edu.institution)}</span>
            <span>•</span>
            <span>${escapeHtml(edu.year)}</span>
            <span>•</span>
            <span>${escapeHtml(edu.grade)}</span>
          </div>
        </div>
        <div class="item-actions">
          <button class="btn-adm btn-adm-secondary btn-adm-sm" data-action="edit-edu" data-index="${index}">✏️ Edit</button>
          <button class="btn-adm btn-adm-danger btn-adm-sm" data-action="delete-edu" data-index="${index}">🗑️</button>
        </div>
      `;
      eduListEl.appendChild(row);
    });
  }

  /* ── 8. Render Skills Manager ──────────────────────────── */
  function renderSkillsManager() {
    const categories = ['technical', 'professional', 'creative', 'languages'];
    categories.forEach(cat => {
      const container = document.getElementById(`skills-tags-${cat}`);
      if (!container) return;
      container.innerHTML = '';

      const items = (data.skills && data.skills[cat]) || [];
      items.forEach((skill, index) => {
        const chip = document.createElement('div');
        chip.className = 'tag-chip';
        chip.innerHTML = `
          <span>${escapeHtml(skill)}</span>
          <button data-action="delete-skill" data-cat="${cat}" data-index="${index}" title="Remove">✕</button>
        `;
        container.appendChild(chip);
      });
    });
  }

  // Handle skill tag removal
  document.addEventListener('click', (e) => {
    if (e.target.matches('[data-action="delete-skill"]')) {
      const cat = e.target.getAttribute('data-cat');
      const idx = parseInt(e.target.getAttribute('data-index'), 10);
      if (data.skills && data.skills[cat]) {
        data.skills[cat].splice(idx, 1);
        renderSkillsManager();
      }
    }
  });

  // Handle skill tag addition
  document.querySelectorAll('[data-action="add-skill-btn"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const cat = btn.getAttribute('data-cat');
      const input = document.getElementById(`new-skill-${cat}`);
      if (input && input.value.trim()) {
        data.skills = data.skills || {};
        data.skills[cat] = data.skills[cat] || [];
        data.skills[cat].push(input.value.trim());
        input.value = '';
        renderSkillsManager();
      }
    });
  });

  /* ── 9. Modal Management ───────────────────────────────── */
  const modalBackdrop = document.getElementById('admin-modal-backdrop');
  const modalTitle = document.getElementById('modal-title');
  const modalBody = document.getElementById('modal-body');
  const modalSaveBtn = document.getElementById('modal-save-btn');
  const modalCancelBtn = document.getElementById('modal-cancel-btn');

  let currentModalSaveHandler = null;

  function openModal(title, bodyHtml, onSave) {
    modalTitle.textContent = title;
    modalBody.innerHTML = bodyHtml;
    currentModalSaveHandler = onSave;
    modalBackdrop.classList.add('open');
  }

  function closeModal() {
    modalBackdrop.classList.remove('open');
    currentModalSaveHandler = null;
  }

  if (modalCancelBtn) modalCancelBtn.addEventListener('click', closeModal);
  if (modalSaveBtn) {
    modalSaveBtn.addEventListener('click', () => {
      if (currentModalSaveHandler) {
        currentModalSaveHandler();
      }
      closeModal();
    });
  }

  /* ── 10. Experience Modals (Add / Edit) ─────────────────── */
  document.getElementById('btn-add-experience')?.addEventListener('click', () => {
    openExperienceModal();
  });

  expListEl?.addEventListener('click', (e) => {
    const editBtn = e.target.closest('[data-action="edit-exp"]');
    const delBtn = e.target.closest('[data-action="delete-exp"]');

    if (editBtn) {
      const idx = parseInt(editBtn.getAttribute('data-index'), 10);
      openExperienceModal(idx);
    } else if (delBtn) {
      const idx = parseInt(delBtn.getAttribute('data-index'), 10);
      if (confirm(`Delete position "${data.experience[idx].role}"?`)) {
        data.experience.splice(idx, 1);
        renderExperienceList();
        showToast('Position deleted', 'info');
      }
    }
  });

  function openExperienceModal(editIndex = null) {
    const isEdit = editIndex !== null;
    const job = isEdit ? data.experience[editIndex] : {
      company: '', companyUrl: '', role: '', period: '', isCurrent: false, bullets: ['']
    };

    const html = `
      <div class="form-grid">
        <div class="form-group">
          <label class="form-label">Job Title / Role</label>
          <input type="text" id="modal-exp-role" class="form-input" value="${escapeHtml(job.role)}" placeholder="e.g. Technical Project Manager" />
        </div>
        <div class="form-group">
          <label class="form-label">Company Name</label>
          <input type="text" id="modal-exp-company" class="form-input" value="${escapeHtml(job.company)}" placeholder="e.g. Mediusware Limited" />
        </div>
        <div class="form-group">
          <label class="form-label">Company URL</label>
          <input type="url" id="modal-exp-url" class="form-input" value="${escapeHtml(job.companyUrl || '')}" placeholder="https://..." />
        </div>
        <div class="form-group">
          <label class="form-label">Period / Duration</label>
          <input type="text" id="modal-exp-period" class="form-input" value="${escapeHtml(job.period)}" placeholder="e.g. Aug 2024 — Present" />
        </div>
        <div class="form-group full-width">
          <label style="display: flex; align-items: center; gap: 0.5rem; color: #fff; cursor: pointer;">
            <input type="checkbox" id="modal-exp-current" ${job.isCurrent ? 'checked' : ''} />
            <span>Currently working here (Show 'Current' badge)</span>
          </label>
        </div>
        <div class="form-group full-width">
          <label class="form-label">Key Responsibilities / Bullet Points (One per line)</label>
          <textarea id="modal-exp-bullets" class="form-textarea" style="min-height: 140px;" placeholder="Enter each accomplishment on a new line...">${(job.bullets || []).join('\n')}</textarea>
        </div>
      </div>
    `;

    openModal(isEdit ? 'Edit Experience' : 'Add Experience', html, () => {
      const updated = {
        id: job.id || `job-${Date.now()}`,
        role: document.getElementById('modal-exp-role').value.trim(),
        company: document.getElementById('modal-exp-company').value.trim(),
        companyUrl: document.getElementById('modal-exp-url').value.trim(),
        period: document.getElementById('modal-exp-period').value.trim(),
        isCurrent: document.getElementById('modal-exp-current').checked,
        bullets: document.getElementById('modal-exp-bullets').value
          .split('\n')
          .map(b => b.trim())
          .filter(Boolean)
      };

      data.experience = data.experience || [];
      if (isEdit) {
        data.experience[editIndex] = updated;
      } else {
        data.experience.unshift(updated);
      }

      renderExperienceList();
      showToast(isEdit ? 'Position updated' : 'Position added');
    });
  }

  /* ── 11. Projects Modals (Add / Edit) ──────────────────── */
  document.getElementById('btn-add-project')?.addEventListener('click', () => {
    openProjectModal();
  });

  projListEl?.addEventListener('click', (e) => {
    const editBtn = e.target.closest('[data-action="edit-proj"]');
    const delBtn = e.target.closest('[data-action="delete-proj"]');

    if (editBtn) {
      const idx = parseInt(editBtn.getAttribute('data-index'), 10);
      openProjectModal(idx);
    } else if (delBtn) {
      const idx = parseInt(delBtn.getAttribute('data-index'), 10);
      if (confirm(`Delete project "${data.projects[idx].title}"?`)) {
        data.projects.splice(idx, 1);
        renderProjectsList();
        showToast('Project deleted', 'info');
      }
    }
  });

  function openProjectModal(editIndex = null) {
    const isEdit = editIndex !== null;
    const proj = isEdit ? data.projects[editIndex] : {
      title: '', category: 'software', year: '2026', description: '', tags: [], link: '', badge: ''
    };

    const html = `
      <div class="form-grid">
        <div class="form-group full-width">
          <label class="form-label">Project / Publication Title</label>
          <input type="text" id="modal-proj-title" class="form-input" value="${escapeHtml(proj.title)}" placeholder="e.g. Automated Field Watering System" />
        </div>
        <div class="form-group">
          <label class="form-label">Category</label>
          <select id="modal-proj-cat" class="form-select">
            <option value="research" ${proj.category === 'research' ? 'selected' : ''}>Research & Thesis</option>
            <option value="publication" ${proj.category === 'publication' ? 'selected' : ''}>Publication</option>
            <option value="software" ${proj.category === 'software' ? 'selected' : ''}>Software & Engineering</option>
            <option value="volunteer" ${proj.category === 'volunteer' ? 'selected' : ''}>Volunteer & Leadership</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Year / Venue</label>
          <input type="text" id="modal-proj-year" class="form-input" value="${escapeHtml(proj.year)}" placeholder="e.g. 2026 or CNC-2018" />
        </div>
        <div class="form-group">
          <label class="form-label">External Link (Optional)</label>
          <input type="url" id="modal-proj-link" class="form-input" value="${escapeHtml(proj.link || '')}" placeholder="https://..." />
        </div>
        <div class="form-group">
          <label class="form-label">Highlight / Award Badge (Optional)</label>
          <input type="text" id="modal-proj-badge" class="form-input" value="${escapeHtml(proj.badge || '')}" placeholder="e.g. Best Presentation" />
        </div>
        <div class="form-group full-width">
          <label class="form-label">Description</label>
          <textarea id="modal-proj-desc" class="form-textarea" placeholder="Brief project summary...">${escapeHtml(proj.description || '')}</textarea>
        </div>
        <div class="form-group full-width">
          <label class="form-label">Tags (comma separated)</label>
          <input type="text" id="modal-proj-tags" class="form-input" value="${escapeHtml((proj.tags || []).join(', '))}" placeholder="e.g. IoT, Arduino, Machine Learning" />
        </div>
      </div>
    `;

    openModal(isEdit ? 'Edit Project' : 'Add Project', html, () => {
      const updated = {
        id: proj.id || `proj-${Date.now()}`,
        title: document.getElementById('modal-proj-title').value.trim(),
        category: document.getElementById('modal-proj-cat').value,
        year: document.getElementById('modal-proj-year').value.trim(),
        link: document.getElementById('modal-proj-link').value.trim(),
        badge: document.getElementById('modal-proj-badge').value.trim(),
        description: document.getElementById('modal-proj-desc').value.trim(),
        tags: document.getElementById('modal-proj-tags').value
          .split(',')
          .map(t => t.trim())
          .filter(Boolean)
      };

      data.projects = data.projects || [];
      if (isEdit) {
        data.projects[editIndex] = updated;
      } else {
        data.projects.unshift(updated);
      }

      renderProjectsList();
      showToast(isEdit ? 'Project updated' : 'Project added');
    });
  }

  /* ── 12. Education Modals (Add / Edit) ──────────────────── */
  document.getElementById('btn-add-education')?.addEventListener('click', () => {
    openEducationModal();
  });

  eduListEl?.addEventListener('click', (e) => {
    const editBtn = e.target.closest('[data-action="edit-edu"]');
    const delBtn = e.target.closest('[data-action="delete-edu"]');

    if (editBtn) {
      const idx = parseInt(editBtn.getAttribute('data-index'), 10);
      openEducationModal(idx);
    } else if (delBtn) {
      const idx = parseInt(delBtn.getAttribute('data-index'), 10);
      if (confirm(`Delete "${data.education[idx].degree}"?`)) {
        data.education.splice(idx, 1);
        renderEducationList();
        showToast('Education deleted', 'info');
      }
    }
  });

  function openEducationModal(editIndex = null) {
    const isEdit = editIndex !== null;
    const edu = isEdit ? data.education[editIndex] : {
      degree: '', field: '', institution: '', year: '', grade: ''
    };

    const html = `
      <div class="form-grid">
        <div class="form-group full-width">
          <label class="form-label">Degree / Certificate Name</label>
          <input type="text" id="modal-edu-degree" class="form-input" value="${escapeHtml(edu.degree)}" placeholder="e.g. Masters of Business Administration" />
        </div>
        <div class="form-group">
          <label class="form-label">Institution / University</label>
          <input type="text" id="modal-edu-inst" class="form-input" value="${escapeHtml(edu.institution)}" placeholder="e.g. University of Dhaka" />
        </div>
        <div class="form-group">
          <label class="form-label">Major / Field</label>
          <input type="text" id="modal-edu-field" class="form-input" value="${escapeHtml(edu.field || '')}" placeholder="e.g. HR and Management" />
        </div>
        <div class="form-group">
          <label class="form-label">Graduation Year</label>
          <input type="text" id="modal-edu-year" class="form-input" value="${escapeHtml(edu.year)}" placeholder="e.g. 2021" />
        </div>
        <div class="form-group">
          <label class="form-label">Grade / GPA</label>
          <input type="text" id="modal-edu-grade" class="form-input" value="${escapeHtml(edu.grade)}" placeholder="e.g. CGPA 3.73 / 4.00" />
        </div>
      </div>
    `;

    openModal(isEdit ? 'Edit Education' : 'Add Education', html, () => {
      const updated = {
        id: edu.id || `edu-${Date.now()}`,
        degree: document.getElementById('modal-edu-degree').value.trim(),
        institution: document.getElementById('modal-edu-inst').value.trim(),
        field: document.getElementById('modal-edu-field').value.trim(),
        year: document.getElementById('modal-edu-year').value.trim(),
        grade: document.getElementById('modal-edu-grade').value.trim()
      };

      data.education = data.education || [];
      if (isEdit) {
        data.education[editIndex] = updated;
      } else {
        data.education.unshift(updated);
      }

      renderEducationList();
      showToast(isEdit ? 'Education updated' : 'Education added');
    });
  }

  /* ── 13. Save All Changes ──────────────────────────────── */
  function saveAll() {
    readProfileForm();
    const res = window.PortfolioStore.saveData(data);
    if (res.success) {
      showToast('All changes saved and published to site! 🎉');
    } else {
      showToast('Error saving changes: ' + res.error, 'danger');
    }
  }

  document.getElementById('btn-save-all')?.addEventListener('click', saveAll);

  /* ── 14. Backup / Export / Import / Reset ───────────────── */
  document.getElementById('btn-export-json')?.addEventListener('click', () => {
    saveAll();
    window.PortfolioStore.exportJSON();
    showToast('Downloaded portfolio_backup.json');
  });

  const importFileInput = document.getElementById('input-import-json');
  document.getElementById('btn-import-trigger')?.addEventListener('click', () => {
    importFileInput.click();
  });

  importFileInput?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target.result;
      const res = window.PortfolioStore.importJSON(content);
      if (res.success) {
        data = res.data;
        populateAll();
        showToast('Successfully imported portfolio data!');
      } else {
        showToast('Import error: ' + res.error, 'danger');
      }
    };
    reader.readAsText(file);
  });

  document.getElementById('btn-reset-default')?.addEventListener('click', () => {
    if (confirm('Are you sure you want to reset all content back to defaults?')) {
      const res = window.PortfolioStore.resetToDefault();
      if (res.success) {
        data = res.data;
        populateAll();
        showToast('Reset back to default content', 'info');
      }
    }
  });

  /* ── Helpers ───────────────────────────────────────────── */
  function populateAll() {
    populateProfileForm();
    renderExperienceList();
    renderProjectsList();
    renderEducationList();
    renderSkillsManager();
  }

  function getVal(id) {
    const el = document.getElementById(id);
    return el ? el.value : '';
  }

  function setVal(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val !== undefined && val !== null ? val : '';
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

  // Check authentication status on startup
  checkAuth();
});
