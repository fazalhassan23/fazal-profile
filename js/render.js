/* ============================================================
   PORTFOLIO DYNAMIC RENDERER (js/render.js)
   Binds stored CMS data to DOM elements on all pages.
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  if (!window.PortfolioStore) return;

  function renderAll() {
    const data = window.PortfolioStore.getData();
    if (!data || !data.profile) return;

    const p = data.profile;

    /* ── 1. Global / Brand / Nav ─────────────────────────── */
    document.querySelectorAll('[data-cms="firstName"]').forEach(el => {
      el.textContent = p.firstName || "Fazal";
    });

    document.querySelectorAll('[data-cms="fullName"]').forEach(el => {
      el.textContent = p.name || "Fazal Mahmud Hassan";
    });

    // Update document title if applicable
    if (document.title.includes('—')) {
      const parts = document.title.split('—');
      if (parts.length === 2 && parts[0].trim() === 'Fazal Mahmud Hassan') {
        document.title = `${p.name} — ${p.roleTitle.split('·')[0].trim()}`;
      }
    }

    /* ── 2. Hero Section (index.html) ─────────────────────── */
    const heroTitle = document.getElementById('hero-title');
    if (heroTitle) {
      const nameParts = (p.name || '').split(' ');
      if (nameParts.length > 1) {
        const lastWord = nameParts.pop();
        heroTitle.innerHTML = `${nameParts.join(' ')}<br>${lastWord}.`;
      } else {
        heroTitle.innerHTML = `${p.name}.`;
      }
    }

    const heroRole = document.getElementById('hero-role');
    if (heroRole) heroRole.textContent = p.roleTitle || '';

    const heroBio = document.getElementById('hero-bio');
    if (heroBio) heroBio.textContent = p.heroBio || '';

    /* ── 3. Expertise Grid (index.html) ───────────────────── */
    const expertiseContainer = document.getElementById('expertise-container');
    if (expertiseContainer && data.expertise) {
      expertiseContainer.innerHTML = data.expertise.map(exp => `
        <div class="expertise-card fade-up visible">
          <div class="card-icon">${escapeHtml(exp.icon || '⚡')}</div>
          <p class="card-category">${escapeHtml(exp.category || '')}</p>
          <h3>${escapeHtml(exp.title || '')}</h3>
          <p>${escapeHtml(exp.description || '')}</p>
        </div>
      `).join('');
    }

    /* ── 4. Home Experience Preview (index.html - top 3) ─── */
    const homeExpContainer = document.getElementById('home-experience-container');
    if (homeExpContainer && data.experience) {
      const top3 = data.experience.slice(0, 3);
      homeExpContainer.innerHTML = top3.map(job => renderTimelineItem(job)).join('');
    }

    /* ── 5. Home Featured Work Preview (index.html) ──────── */
    const homeProjContainer = document.getElementById('home-projects-container');
    if (homeProjContainer && data.projects) {
      const featured = data.projects.slice(0, 3);
      homeProjContainer.innerHTML = featured.map(proj => renderProjectCard(proj)).join('');
    }

    /* ── 6. About Page Bio & Lead (about.html) ────────────── */
    const aboutLead = document.getElementById('about-lead');
    if (aboutLead) aboutLead.textContent = p.aboutLead || p.heroBio || '';

    const aboutParagraphs = document.getElementById('about-paragraphs');
    if (aboutParagraphs && p.aboutBodyParagraphs) {
      aboutParagraphs.innerHTML = p.aboutBodyParagraphs.map(text => `<p>${escapeHtml(text)}</p>`).join('');
    }

    /* ── 7. About Page Education (about.html) ─────────────── */
    const eduContainer = document.getElementById('education-container');
    if (eduContainer && data.education) {
      eduContainer.innerHTML = data.education.map(edu => `
        <div class="edu-item fade-up visible">
          <div>
            <p class="edu-degree">${escapeHtml(edu.degree || '')}</p>
            <p class="edu-institution">${escapeHtml(edu.institution || '')}</p>
            <p class="edu-meta">${escapeHtml(edu.field ? `${edu.field} · ` : '')}${escapeHtml(edu.year || '')}</p>
          </div>
          <p class="edu-gpa">${escapeHtml(edu.grade || '')}</p>
        </div>
      `).join('');
    }

    /* ── 8. About Page Full Experience Timeline ──────────── */
    const fullExpContainer = document.getElementById('full-experience-container');
    if (fullExpContainer && data.experience) {
      fullExpContainer.innerHTML = data.experience.map(job => renderTimelineItem(job)).join('');
    }

    /* ── 9. About Page Skills (about.html) ───────────────── */
    const skillsContainer = document.getElementById('skills-container');
    if (skillsContainer && data.skills) {
      const categories = [
        { key: 'technical', label: 'Technical' },
        { key: 'professional', label: 'Professional' },
        { key: 'creative', label: 'Creative' },
        { key: 'languages', label: 'Languages' }
      ];

      skillsContainer.innerHTML = categories.map(cat => {
        const items = data.skills[cat.key] || [];
        if (!items.length) return '';
        return `
          <div class="skill-group fade-up visible">
            <p class="skill-group-label">${cat.label}</p>
            <div class="skill-tags">
              ${items.map(skill => `<span class="skill-tag">${escapeHtml(skill)}</span>`).join('')}
            </div>
          </div>
        `;
      }).join('');
    }

    /* ── 10. About Page Extra Curriculars (about.html) ────── */
    const extrasContainer = document.getElementById('extras-container');
    if (extrasContainer && data.extraCurriculars) {
      extrasContainer.innerHTML = data.extraCurriculars.map(extra => `
        <div class="expertise-card fade-up visible">
          <div class="card-icon">${escapeHtml(extra.icon || '✨')}</div>
          <p class="card-category">${escapeHtml(extra.category || '')}</p>
          <h3>${escapeHtml(extra.title || '')}</h3>
          <p>${escapeHtml(extra.description || '')}</p>
        </div>
      `).join('');
    }

    /* ── 11. Projects Page (projects.html) ────────────────── */
    const researchContainer = document.getElementById('projects-research-container');
    if (researchContainer && data.projects) {
      const researchProjects = data.projects.filter(pr => pr.category === 'research');
      researchContainer.innerHTML = researchProjects.map(proj => renderProjectCard(proj)).join('');
    }

    const pubContainer = document.getElementById('projects-publication-container');
    if (pubContainer && data.projects) {
      const pubProjects = data.projects.filter(pr => pr.category === 'publication');
      pubContainer.innerHTML = pubProjects.map(proj => renderPublicationCard(proj)).join('');
    }

    const softwareContainer = document.getElementById('projects-software-container');
    if (softwareContainer && data.projects) {
      const softwareProjects = data.projects.filter(pr => pr.category === 'software');
      softwareContainer.innerHTML = softwareProjects.map(proj => renderProjectCard(proj)).join('');
    }

    const volunteerContainer = document.getElementById('projects-volunteer-container');
    if (volunteerContainer && data.projects) {
      const volunteerProjects = data.projects.filter(pr => pr.category === 'volunteer');
      volunteerContainer.innerHTML = volunteerProjects.map(proj => renderProjectCard(proj)).join('');
    }

    /* ── 12. Contact Details & Links ──────────────────────── */
    const contactText = document.getElementById('contact-text');
    if (contactText) contactText.textContent = p.contactIntro || '';

    document.querySelectorAll('[data-cms-link="email"]').forEach(el => {
      el.setAttribute('href', `mailto:${p.email}`);
      if (el.hasAttribute('data-cms-text')) el.textContent = p.email;
    });

    document.querySelectorAll('[data-cms-link="phone"]').forEach(el => {
      el.setAttribute('href', `tel:${(p.phone || '').replace(/\s+/g, '')}`);
      if (el.hasAttribute('data-cms-text')) el.textContent = p.phone;
    });

    document.querySelectorAll('[data-cms-link="linkedin"]').forEach(el => {
      el.setAttribute('href', p.linkedinUrl || 'https://linkedin.com');
    });

    document.querySelectorAll('[data-cms-link="github"]').forEach(el => {
      if (p.githubUrl) {
        el.setAttribute('href', p.githubUrl);
        el.style.display = '';
      } else {
        el.style.display = 'none';
      }
    });

    /* ── 13. Footer ───────────────────────────────────────── */
    const footerTagline = document.getElementById('footer-tagline');
    if (footerTagline) footerTagline.textContent = p.footerTagline || '';

    const footerCopy = document.getElementById('footer-copy');
    if (footerCopy) footerCopy.textContent = `© ${p.copyrightYear || 2026} ${p.name}`;
  }

  /* ── Helper Renderers ──────────────────────────────────── */
  function renderTimelineItem(job) {
    const bulletsHtml = (job.bullets || []).map(b => `<li>${escapeHtml(b)}</li>`).join('');
    const badgeHtml = job.isCurrent ? `<span class="timeline-badge">Current</span>` : '';
    const companyHtml = job.companyUrl
      ? `<a href="${escapeHtml(job.companyUrl)}" target="_blank" rel="noopener" class="timeline-company">${escapeHtml(job.company)}</a>`
      : `<span class="timeline-company">${escapeHtml(job.company)}</span>`;

    return `
      <div class="timeline-item fade-up visible">
        <div class="timeline-dot"></div>
        <div class="timeline-meta">
          <span class="timeline-date">${escapeHtml(job.period || '')}</span>
          ${badgeHtml}
        </div>
        <h3>${escapeHtml(job.role || '')}</h3>
        ${companyHtml}
        <ul class="timeline-bullets">
          ${bulletsHtml}
        </ul>
      </div>
    `;
  }

  function renderProjectCard(proj) {
    const tagsHtml = (proj.tags || []).map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('');
    const linkAttr = proj.link ? `href="${escapeHtml(proj.link)}" target="_blank" rel="noopener"` : '';
    const tagType = proj.link ? 'a' : 'div';

    return `
      <${tagType} ${linkAttr} class="project-card fade-up visible">
        <div class="project-card-top">
          <h3>${escapeHtml(proj.title || '')}</h3>
          <span class="project-year">${escapeHtml(proj.year || '')}</span>
        </div>
        <p>${escapeHtml(proj.description || '')}</p>
        <div class="tags">
          ${tagsHtml}
        </div>
      </${tagType}>
    `;
  }

  function renderPublicationCard(proj) {
    const tagsHtml = (proj.tags || []).map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('');
    const badgeHtml = proj.badge
      ? `<span class="tag" style="background: rgba(124, 58, 237, 0.2); color: #C4B5FD;">${escapeHtml(proj.badge)}</span>`
      : '';

    return `
      <div class="project-card fade-up visible" style="border-left-color: #7C3AED;">
        <div class="project-card-top">
          <h3>${escapeHtml(proj.title || '')}</h3>
          <span class="project-year">${escapeHtml(proj.year || '')}</span>
        </div>
        <p>${escapeHtml(proj.description || '')}</p>
        ${proj.badge ? `<p style="font-size:0.875rem; color: var(--text-tertiary); margin-top: 0.5rem; margin-bottom: 0.875rem;">🏆 Recognized as <strong style="color: var(--text-secondary)">${escapeHtml(proj.badge)}</strong>.</p>` : ''}
        <div class="tags">
          ${tagsHtml}
          ${badgeHtml}
        </div>
      </div>
    `;
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

  // Initial render
  renderAll();

  // Listen for live updates from CMS admin panel
  window.addEventListener('portfolioDataChanged', renderAll);
});
