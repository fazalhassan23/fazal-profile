/* ============================================================
   PORTFOLIO DYNAMIC RENDERER (js/render.js)
   Modular, accessible, and resilient DOM renderer for
   binding CMS data across all portfolio views.
   ============================================================ */

(function () {
  'use strict';

  let typewriterTimer = null;

  /**
   * Escape HTML to prevent XSS vulnerabilities in user-provided content
   * @param {*} str
   * @returns {string}
   */
  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /* ────────────────────────────────────────────────────────────
     COMPONENT RENDERERS
     ──────────────────────────────────────────────────────────── */

  function renderIdentityAndTheme(p) {
    // Dynamic Font Theme
    if (p.fontPair) {
      document.documentElement.setAttribute('data-font-pair', p.fontPair);
    } else {
      document.documentElement.removeAttribute('data-font-pair');
    }

    // Nav Brand & Full Name
    document.querySelectorAll('[data-cms="firstName"]').forEach(el => {
      el.textContent = p.firstName || 'Fazal';
    });

    document.querySelectorAll('[data-cms="fullName"]').forEach(el => {
      el.textContent = p.name || 'Fazal Mahmud Hassan';
    });

    // Dynamic Title tag
    if (document.title.includes('—')) {
      const parts = document.title.split('—');
      if (parts.length === 2 && parts[0].trim() === 'Fazal Mahmud Hassan') {
        const shortRole = p.roleTitle ? p.roleTitle.split('·')[0].trim() : 'Portfolio';
        document.title = `${p.name || 'Fazal Mahmud Hassan'} — ${shortRole}`;
      }
    }
  }

  function renderHero(p, avail) {
    // Availability Badge
    const availContainer = document.getElementById('hero-availability');
    if (availContainer) {
      const status = avail.status || 'available';
      availContainer.className = `availability-badge ${status}`;
      const availText = document.getElementById('availability-text');
      if (availText) {
        availText.textContent = avail.badgeText || 'Open to Research & Advisory';
      }
    }

    // Hero Title
    const heroTitle = document.getElementById('hero-title');
    if (heroTitle) {
      const nameParts = (p.name || '').trim().split(' ');
      if (nameParts.length > 1) {
        const lastWord = nameParts.pop();
        heroTitle.innerHTML = `${escapeHtml(nameParts.join(' '))}<br>${escapeHtml(lastWord)}.`;
      } else {
        heroTitle.innerHTML = `${escapeHtml(p.name || '')}.`;
      }
    }

    // Hero Bio
    const heroBio = document.getElementById('hero-bio');
    if (heroBio) {
      heroBio.textContent = p.heroBio || '';
    }

    // Typewriter
    initTypewriter(avail.typewriterRoles || [p.roleTitle || 'Technical Project Manager']);
  }

  function renderMetrics(metrics) {
    const container = document.getElementById('hero-metrics-container');
    if (!container || !Array.isArray(metrics)) return;

    container.innerHTML = metrics.map(m => `
      <div class="metric-card fade-up visible">
        <div class="metric-number-wrap">
          <span class="metric-val" data-target="${escapeHtml(m.number || '0')}">${escapeHtml(m.number || '0')}</span>
          <span class="metric-suffix">${escapeHtml(m.suffix || '')}</span>
        </div>
        <div class="metric-text-group">
          <p class="metric-label">${escapeHtml(m.label || '')}</p>
          <p class="metric-subtext">${escapeHtml(m.subtext || '')}</p>
        </div>
      </div>
    `).join('');
  }

  function renderExpertise(expertise) {
    const container = document.getElementById('expertise-container');
    if (!container || !Array.isArray(expertise)) return;

    container.innerHTML = expertise.map(exp => `
      <div class="expertise-card fade-up visible">
        <div class="card-icon">${escapeHtml(exp.icon || '⚡')}</div>
        <div>
          <p class="card-category">${escapeHtml(exp.category || '')}</p>
          <h3>${escapeHtml(exp.title || '')}</h3>
          <p>${escapeHtml(exp.description || '')}</p>
        </div>
      </div>
    `).join('');
  }

  function renderAwards(awards) {
    const container = document.getElementById('awards-container');
    if (!container || !Array.isArray(awards)) return;

    container.innerHTML = awards.map(awd => `
      <div class="award-card fade-up visible">
        <div class="award-icon-box">🏆</div>
        <div class="award-content">
          <h3 class="award-title">${escapeHtml(awd.title || '')}</h3>
          <p class="award-org">${escapeHtml(awd.organization || '')} · <span class="award-year-inline">${escapeHtml(awd.year || '')}</span></p>
        </div>
      </div>
    `).join('');
  }

  function renderArticles(articles) {
    const container = document.getElementById('articles-container');
    if (!container || !Array.isArray(articles)) return;

    container.innerHTML = articles.map(art => {
      const tagsHtml = (art.tags || []).slice(0, 2).map(t => `<span class="article-tag">${escapeHtml(t)}</span>`).join('');
      return `
        <div class="article-card fade-up visible" onclick="window.PortfolioApp.openArticleModal('${escapeHtml(art.id)}')" role="button" tabindex="0" aria-label="Read article: ${escapeHtml(art.title)}">
          <div class="article-card-content">
            <div class="article-meta">
              <span class="article-category">${escapeHtml(art.category || 'Article')}</span>
              <span class="article-date">${escapeHtml(art.date || '')} · ${escapeHtml(art.readTime || '5 min read')}</span>
            </div>
            <h3 class="article-title">${escapeHtml(art.title || '')}</h3>
            <p class="article-summary">${escapeHtml(art.summary || '')}</p>
          </div>
          <div class="article-card-right">
            <div class="article-tags">${tagsHtml}</div>
            <span class="article-read-btn" aria-hidden="true">→</span>
          </div>
        </div>
      `;
    }).join('');
  }

  function renderExperience(experience) {
    // Home preview (top 3)
    const homeContainer = document.getElementById('home-experience-container');
    if (homeContainer && Array.isArray(experience)) {
      homeContainer.innerHTML = experience.slice(0, 3).map(job => renderTimelineItem(job)).join('');
    }

    // Full timeline (about.html)
    const fullContainer = document.getElementById('full-experience-container');
    if (fullContainer && Array.isArray(experience)) {
      fullContainer.innerHTML = experience.map(job => renderTimelineItem(job)).join('');
    }
  }

  function renderProjects(projects) {
    // Home featured work (top 3)
    const homeProjContainer = document.getElementById('home-projects-container');
    if (homeProjContainer && Array.isArray(projects)) {
      homeProjContainer.innerHTML = projects.slice(0, 3).map(proj => renderProjectCard(proj)).join('');
    }

    // Categorized project containers (projects.html)
    const categoryContainers = [
      { id: 'projects-research-container', cat: 'research' },
      { id: 'projects-publication-container', cat: 'publication' },
      { id: 'projects-software-container', cat: 'software' },
      { id: 'projects-volunteer-container', cat: 'volunteer' }
    ];

    categoryContainers.forEach(({ id, cat }) => {
      const el = document.getElementById(id);
      if (el && Array.isArray(projects)) {
        const filtered = projects.filter(pr => pr.category === cat);
        el.innerHTML = filtered.map(proj => renderProjectCard(proj)).join('');
      }
    });
  }

  function renderAboutPage(p, data) {
    const aboutLead = document.getElementById('about-lead');
    if (aboutLead) aboutLead.textContent = p.aboutLead || p.heroBio || '';

    const aboutParagraphs = document.getElementById('about-paragraphs');
    if (aboutParagraphs && p.aboutBodyParagraphs) {
      aboutParagraphs.innerHTML = p.aboutBodyParagraphs.map(text => {
        if (!text) return '';
        if (/<\/?[a-z][\s\S]*>/i.test(text)) return text;
        return `<p>${escapeHtml(text)}</p>`;
      }).join('');
    }

    // Education
    const eduContainer = document.getElementById('education-container');
    if (eduContainer && Array.isArray(data.education)) {
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

    // Skills
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

    // Extras
    const extrasContainer = document.getElementById('extras-container');
    if (extrasContainer && Array.isArray(data.extraCurriculars)) {
      extrasContainer.innerHTML = data.extraCurriculars.map(extra => `
        <div class="expertise-card fade-up visible">
          <div class="card-icon">${escapeHtml(extra.icon || '✨')}</div>
          <div>
            <p class="card-category">${escapeHtml(extra.category || '')}</p>
            <h3>${escapeHtml(extra.title || '')}</h3>
            <p>${escapeHtml(extra.description || '')}</p>
          </div>
        </div>
      `).join('');
    }
  }

  function renderContactAndFooter(p) {
    const contactText = document.getElementById('contact-text');
    if (contactText) contactText.textContent = p.contactIntro || '';

    document.querySelectorAll('[data-cms-link="email"]').forEach(el => {
      el.setAttribute('href', `mailto:${p.email || ''}`);
      if (el.hasAttribute('data-cms-text')) el.textContent = p.email || '';
    });

    document.querySelectorAll('[data-cms-link="phone"]').forEach(el => {
      el.setAttribute('href', `tel:${(p.phone || '').replace(/\s+/g, '')}`);
      if (el.hasAttribute('data-cms-text')) el.textContent = p.phone || '';
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

    document.querySelectorAll('[data-cms-link="resume"]').forEach(el => {
      if (p.resumeUrl) {
        el.setAttribute('href', p.resumeUrl);
        el.setAttribute('target', '_blank');
        el.setAttribute('rel', 'noopener noreferrer');
      } else {
        el.setAttribute('href', 'about.html');
      }
    });

    // Footer
    const footerTagline = document.getElementById('footer-tagline');
    if (footerTagline) footerTagline.textContent = p.footerTagline || '';

    const footerCopy = document.getElementById('footer-copy');
    if (footerCopy) footerCopy.textContent = `© ${p.copyrightYear || 2026} ${p.name || 'Fazal Mahmud Hassan'}. All rights reserved.`;
  }

  /* ── Helper Renderers ──────────────────────────────────── */

  function renderTimelineItem(job) {
    const bulletsHtml = (job.bullets || []).map(b => `<li>${escapeHtml(b)}</li>`).join('');
    const badgeHtml = job.isCurrent ? `<span class="timeline-badge">Current</span>` : '';
    const companyHtml = job.companyUrl
      ? `<a href="${escapeHtml(job.companyUrl)}" target="_blank" rel="noopener noreferrer" class="timeline-company">${escapeHtml(job.company)}</a>`
      : `<span class="timeline-company">${escapeHtml(job.company)}</span>`;

    return `
      <div class="timeline-item fade-up visible">
        <div class="timeline-dot" aria-hidden="true"></div>
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
    const linkAttr = proj.link ? `href="${escapeHtml(proj.link)}" target="_blank" rel="noopener noreferrer"` : '';
    const tagType = proj.link ? 'a' : 'div';

    return `
      <${tagType} ${linkAttr} class="project-card fade-up visible">
        <div class="project-card-content">
          <h3>${escapeHtml(proj.title || '')}</h3>
          <p>${escapeHtml(proj.description || '')}</p>
        </div>
        <div class="project-card-right">
          <span class="project-year">${escapeHtml(proj.year || '')}</span>
          <div class="tags">
            ${tagsHtml}
            ${proj.badge ? `<span class="tag" style="background:var(--gold-light); color:var(--gold); border:1px solid var(--gold-border);">${escapeHtml(proj.badge)}</span>` : ''}
          </div>
        </div>
      </${tagType}>
    `;
  }

  /* ── Typewriter Engine ─────────────────────────────────── */

  function initTypewriter(roles) {
    const el = document.getElementById('hero-typewriter');
    if (!el || !Array.isArray(roles) || !roles.length) return;

    if (typewriterTimer) clearTimeout(typewriterTimer);

    let roleIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    const typingSpeed = 60;
    const deleteSpeed = 25;
    const pauseDelay = 2200;

    function step() {
      const currentRole = roles[roleIndex];
      if (!currentRole) return;

      if (!isDeleting) {
        charIndex++;
        el.textContent = currentRole.substring(0, charIndex);
        if (charIndex >= currentRole.length) {
          isDeleting = true;
          typewriterTimer = setTimeout(step, pauseDelay);
          return;
        }
        typewriterTimer = setTimeout(step, typingSpeed);
      } else {
        charIndex--;
        el.textContent = currentRole.substring(0, charIndex);
        if (charIndex <= 0) {
          isDeleting = false;
          roleIndex = (roleIndex + 1) % roles.length;
          typewriterTimer = setTimeout(step, 400);
          return;
        }
        typewriterTimer = setTimeout(step, deleteSpeed);
      }
    }

    step();
  }

  /* ── Article Modal Reader ──────────────────────────────── */

  function openArticleModal(articleId) {
    const data = window.PortfolioStore.getData();
    if (!data || !data.articles) return;
    const art = data.articles.find(a => a.id === articleId);
    if (!art) return;

    let overlay = document.getElementById('article-modal-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'article-modal-overlay';
      overlay.className = 'portfolio-modal-overlay';
      overlay.setAttribute('role', 'dialog');
      overlay.setAttribute('aria-modal', 'true');
      overlay.setAttribute('aria-labelledby', 'modal-art-title');

      overlay.innerHTML = `
        <div class="portfolio-modal-box">
          <div class="modal-header">
            <div>
              <span class="article-category" id="modal-art-category"></span>
              <span class="article-date" style="margin-left:0.6rem" id="modal-art-meta"></span>
            </div>
            <button class="modal-close" id="btn-modal-close" aria-label="Close article modal">&times;</button>
          </div>
          <h2 class="modal-title" id="modal-art-title"></h2>
          <div class="modal-body" id="modal-art-body"></div>
          <div class="modal-footer">
            <div id="modal-art-tags" class="article-tags"></div>
            <button class="btn btn-outline" id="btn-modal-footer-close" style="padding:0.4rem 0.9rem; font-size:0.875rem;">Close</button>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);

      // Event Listeners
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeArticleModal();
      });
      document.getElementById('btn-modal-close')?.addEventListener('click', closeArticleModal);
      document.getElementById('btn-modal-footer-close')?.addEventListener('click', closeArticleModal);

      // Escape key to close
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && overlay.classList.contains('open')) {
          closeArticleModal();
        }
      });
    }

    document.getElementById('modal-art-category').textContent = art.category || 'Article';
    document.getElementById('modal-art-meta').textContent = `${art.date || ''} · ${art.readTime || '5 min read'}`;
    document.getElementById('modal-art-title').textContent = art.title || '';

    const rawContent = art.content || art.summary || '';
    if (/<\/?[a-z][\s\S]*>/i.test(rawContent)) {
      document.getElementById('modal-art-body').innerHTML = rawContent;
    } else {
      document.getElementById('modal-art-body').innerHTML = rawContent
        .split('\n\n')
        .map(para => `<p>${escapeHtml(para)}</p>`)
        .join('');
    }

    const tagsContainer = document.getElementById('modal-art-tags');
    if (tagsContainer) {
      tagsContainer.innerHTML = (art.tags || []).map(t => `<span class="article-tag">${escapeHtml(t)}</span>`).join('');
    }

    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeArticleModal() {
    const overlay = document.getElementById('article-modal-overlay');
    if (overlay) {
      overlay.classList.remove('open');
      document.body.style.overflow = '';
    }
  }

  function printCV() {
    window.open('about.html', '_blank');
  }

  /* ── Master Render Orchestrator ────────────────────────── */

  function renderAll() {
    if (!window.PortfolioStore) return;
    const data = window.PortfolioStore.getData();
    if (!data || !data.profile) return;

    const p = data.profile;
    const avail = data.availability || {};

    renderIdentityAndTheme(p);
    renderHero(p, avail);
    renderMetrics(data.metrics);
    renderExpertise(data.expertise);
    renderAwards(data.awards);
    renderArticles(data.articles);
    renderExperience(data.experience);
    renderProjects(data.projects);
    renderAboutPage(p, data);
    renderContactAndFooter(p);
  }

  // Public Namespace & backward compatibility
  window.PortfolioApp = {
    renderAll,
    openArticleModal,
    closeArticleModal,
    printCV
  };
  window.openArticleModal = openArticleModal;
  window.closeArticleModal = closeArticleModal;
  window.printCV = printCV;

  // Initialize
  document.addEventListener('DOMContentLoaded', renderAll);
  window.addEventListener('portfolioDataChanged', renderAll);
})();
