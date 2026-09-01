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

    // BUG-10 FIX: Update <title> for any CMS name — not just the hardcoded original.
    // Replaces everything before the — separator with the new name + role.
    if (document.title.includes('—') && p.name && p.roleTitle) {
      const shortRole = p.roleTitle.split('·')[0].trim();
      document.title = `${p.name} — ${shortRole}`;
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

    // FIX 2: Re-trigger counter animation after CMS re-renders the container.
    // The IntersectionObserver fires only once, so subsequent renders need this.
    if (typeof window.triggerMetricAnimation === 'function') {
      window.triggerMetricAnimation();
    }
  }

  function renderExpertise(expertise) {
    const container = document.getElementById('expertise-container');
    if (!container || !Array.isArray(expertise)) return;

    container.innerHTML = expertise.map(exp => `
      <div class="expertise-card fade-up visible">
        <div>
          <p class="card-category">${escapeHtml(exp.category || '')}</p>
          <h3>${escapeHtml(exp.title || '')}</h3>
          <p>${escapeHtml(exp.description || '')}</p>
        </div>
      </div>
    `).join('');
  }

  function renderAwards(awards) {
    if (!Array.isArray(awards)) return;

    const html = awards.map(awd => `
      <div class="award-card fade-up visible">
        <div class="award-icon-box">🏆</div>
        <div class="award-content">
          <h3 class="award-title">${escapeHtml(awd.title || '')}</h3>
          <p class="award-org">${escapeHtml(awd.organization || '')} · <span class="award-year-inline">${escapeHtml(awd.year || '')}</span></p>
        </div>
      </div>
    `).join('');

    // BUG-02 FIX: Populate both the home awards container AND the about-page awards container
    const homeContainer = document.getElementById('awards-container');
    if (homeContainer) homeContainer.innerHTML = html;

    const aboutContainer = document.getElementById('about-awards-container');
    if (aboutContainer) aboutContainer.innerHTML = html;
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

  function renderRecommendations(recommendations) {
    if (!Array.isArray(recommendations)) return;

    const visibleRecs = recommendations.filter(r => r.visible !== false);

    function getAvatarHtml(r) {
      if (r.avatar && r.avatar.trim()) {
        return `<img src="${escapeHtml(r.avatar)}" alt="${escapeHtml(r.author)}" class="rec-avatar" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" /><div class="rec-avatar-initials" style="display:none;"></div>`;
      }
      const initials = (r.author || '')
        .split(' ')
        .map(n => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
      return `<div class="rec-avatar-initials">${escapeHtml(initials)}</div>`;
    }

    function createCardHtml(r) {
      // Determine the data source icon (defaulting to LinkedIn)
      const sourceIconHtml = `
        <svg viewBox="0 0 24 24" width="24" height="24" style="fill: var(--text-muted); opacity: 0.5;">
          <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.8v8h2.8v-4.87c0-.26.05-.5.14-.68a1 1 0 0 1 .93-.68c.72 0 .88.61.88 1.5v4.73zm-11.25-9H10.1v-8H7.25zM8.65 4.25a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z"/>
        </svg>
      `;

      // Hide generic LinkedIn relationship text
      const relationshipHtml = (r.relationship && !r.relationship.toLowerCase().includes('linkedin recommendation received')) 
        ? `<span class="rec-relationship">${escapeHtml(r.relationship)}</span>` 
        : '';

      return `
        <div class="recommendation-card fade-up visible">
          <div class="rec-quote-mark" style="font-family: inherit; font-size: inherit; line-height: 0; color: inherit; top: 1.5rem; right: 1.5rem;">${sourceIconHtml}</div>
          <div class="rec-header">
            <div class="rec-avatar-wrap">
              ${getAvatarHtml(r)}
            </div>
            <div class="rec-author-info">
              <div class="rec-author-name">
                ${escapeHtml(r.author)}
                ${r.linkedinUrl ? `
                  <a href="${escapeHtml(r.linkedinUrl)}" target="_blank" rel="noopener noreferrer" class="rec-linkedin-link" title="View LinkedIn Profile">
                    <svg class="rec-linkedin-icon" viewBox="0 0 24 24" width="16" height="16" style="vertical-align: middle; margin-left: 4px; fill: var(--accent);"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.8v8h2.8v-4.87c0-.26.05-.5.14-.68a1 1 0 0 1 .93-.68c.72 0 .88.61.88 1.5v4.73zm-11.25-9H10.1v-8H7.25zM8.65 4.25a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z"/></svg>
                  </a>
                ` : ''}
              </div>
              <div class="rec-author-headline">${escapeHtml(r.headline || '')}</div>
              ${r.company ? `<div class="rec-author-company">${escapeHtml(r.company)}</div>` : ''}
            </div>
          </div>
          <div class="rec-meta">
            ${relationshipHtml}
            <span class="rec-date">${escapeHtml(r.date || '')}</span>
          </div>
          <div class="rec-text">
            ${r.text.length > 250 ? `
              <span class="rec-text-preview">${escapeHtml(r.text.slice(0, 250))}...</span>
              <span class="rec-text-full hidden">${escapeHtml(r.text)}</span>
              <button type="button" class="btn-rec-toggle" onclick="this.previousElementSibling.classList.toggle('hidden'); this.previousElementSibling.previousElementSibling.classList.toggle('hidden'); this.textContent = this.textContent === 'Read more' ? 'Read less' : 'Read more';">Read more</button>
            ` : `
              <span>${escapeHtml(r.text)}</span>
            `}
          </div>
        </div>
      `;
    }

    const homeContainer = document.getElementById('recommendations-container');
    if (homeContainer) {
      initRecommendationsPagination(visibleRecs, createCardHtml);
    }

    const aboutContainer = document.getElementById('about-recommendations-container');
    if (aboutContainer) {
      aboutContainer.innerHTML = visibleRecs.map(r => createCardHtml(r)).join('');
    }
  }

  function initRecommendationsPagination(recs, createCardHtml) {
    const container = document.getElementById('recommendations-container');
    const indicator = document.getElementById('rec-page-indicator');
    const prevBtn = document.getElementById('rec-prev');
    const nextBtn = document.getElementById('rec-next');
    if (!container || recs.length === 0) return;

    const pageSize = 4;
    const totalPages = Math.ceil(recs.length / pageSize);
    let currentPage = 0;

    function renderPage(page) {
      currentPage = (page + totalPages) % totalPages;
      const start = currentPage * pageSize;
      const pageItems = recs.slice(start, start + pageSize);

      container.innerHTML = pageItems.map(r => createCardHtml(r)).join('');
      if (indicator) {
        indicator.textContent = `Page ${currentPage + 1} of ${totalPages}`;
      }
      if (prevBtn) prevBtn.disabled = totalPages <= 1;
      if (nextBtn) nextBtn.disabled = totalPages <= 1;
    }

    renderPage(0);

    if (prevBtn) prevBtn.onclick = () => renderPage(currentPage - 1);
    if (nextBtn) nextBtn.onclick = () => renderPage(currentPage + 1);
  }

  function renderAboutPage(p, data) {
    const aboutLead = document.getElementById('about-lead');
    if (aboutLead) aboutLead.textContent = p.aboutLead || p.heroBio || '';

    const aboutParagraphs = document.getElementById('about-paragraphs');
    if (aboutParagraphs && p.aboutBodyParagraphs) {
      // FIX 6: Filter out empty strings before rendering to avoid blank <p> tags
      aboutParagraphs.innerHTML = p.aboutBodyParagraphs
        .filter(text => text && text.trim())
        .map(text => {
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

  function renderNavigation(navData, p) {
    const nav = navData || {};
    const logoElements = document.querySelectorAll('.nav-logo');
    logoElements.forEach(logo => {
      if (nav.logoLink) logo.setAttribute('href', nav.logoLink);
      const dotHtml = nav.logoDot !== false ? '<span class="dot">.</span>' : '';
      logo.innerHTML = `<span data-cms="firstName">${escapeHtml(nav.logoText || p.firstName || 'Fazal')}</span>${dotHtml}`;
    });

    const navLinksList = document.getElementById('nav-links');
    if (navLinksList && Array.isArray(nav.items) && nav.items.length > 0) {
      // FIX 4: Only overwrite nav links when the CMS has items configured.
      // If nav.items is empty, leave the hardcoded HTML fallback intact.
      const currentPage = window.location.pathname.split('/').pop() || 'index.html';
      navLinksList.innerHTML = nav.items
        .filter(item => item.visible !== false)
        .map(item => {
          const isExternal = item.isExternal || /^https?:\/\//i.test(item.url);
          const targetAttr = isExternal ? ' target="_blank" rel="noopener noreferrer"' : '';
          const isActive = item.url === currentPage || (currentPage === 'index.html' && item.url === 'index.html') ? ' class="active"' : '';
          return `<li><a href="${escapeHtml(item.url)}"${targetAttr}${isActive}>${escapeHtml(item.label)}</a></li>`;
        }).join('');
    }
    // If nav.items is empty/missing, leave hardcoded HTML intact — do nothing.
  }

  function renderSectionHeadersAndVisibility(sectionsData, data) {
    const s = sectionsData || {};

    // ── 1. Homepage Sections ──────────────────────────
    // Hero Section
    const heroLabel = document.getElementById('home-section-label');
    if (heroLabel && s.homeHero?.label) heroLabel.textContent = s.homeHero.label;

    const heroMetricsContainer = document.getElementById('hero-metrics-container');
    if (heroMetricsContainer && s.homeHero) {
      heroMetricsContainer.style.display = s.homeHero.metricsVisible !== false ? '' : 'none';
    }

    const heroCta1 = document.getElementById('hero-cta-1');
    if (heroCta1 && s.homeHero?.cta1) {
      heroCta1.textContent = s.homeHero.cta1.text || 'View My Work ↗';
      heroCta1.setAttribute('href', s.homeHero.cta1.url || 'projects.html');
      heroCta1.style.display = s.homeHero.cta1.visible !== false ? '' : 'none';
    }

    const heroCta2 = document.getElementById('hero-cta-2');
    if (heroCta2 && s.homeHero?.cta2) {
      heroCta2.textContent = s.homeHero.cta2.text || 'About & Experience';
      heroCta2.setAttribute('href', s.homeHero.cta2.url || 'about.html');
      heroCta2.style.display = s.homeHero.cta2.visible !== false ? '' : 'none';
    }

    const heroCta3 = document.getElementById('hero-cta-3');
    if (heroCta3 && s.homeHero?.cta3) {
      heroCta3.textContent = s.homeHero.cta3.text || 'Download Resume';
      heroCta3.setAttribute('href', s.homeHero.cta3.url || 'about.html');
      heroCta3.style.display = s.homeHero.cta3.visible !== false ? '' : 'none';
    }

    // Expertise Section
    const secExpertise = document.getElementById('expertise');
    if (secExpertise && s.expertise) {
      secExpertise.style.display = s.expertise.visible !== false ? '' : 'none';
      const label = document.getElementById('expertise-section-label');
      if (label && s.expertise.label) label.textContent = s.expertise.label;
    }

    // Awards Section
    const secAwards = document.getElementById('awards');
    if (secAwards && s.awards) {
      secAwards.style.display = s.awards.visible !== false ? '' : 'none';
      const label = document.getElementById('awards-section-label');
      if (label && s.awards.label) label.textContent = s.awards.label;
      const subtext = document.getElementById('awards-section-subtext');
      if (subtext && s.awards.subtext) subtext.textContent = s.awards.subtext;
    }

    // Experience Section
    const secExp = document.getElementById('experience');
    if (secExp && s.experience) {
      secExp.style.display = s.experience.visible !== false ? '' : 'none';
      const label = document.getElementById('experience-section-label');
      if (label && s.experience.label) label.textContent = s.experience.label;
      const subtext = document.getElementById('experience-section-subtext');
      if (subtext && s.experience.subtext) subtext.textContent = s.experience.subtext;
      const cta = document.getElementById('experience-section-cta');
      if (cta && s.experience.ctaText) {
        cta.innerHTML = `${escapeHtml(s.experience.ctaText)} <span class="arrow">→</span>`;
        if (s.experience.ctaUrl) cta.setAttribute('href', s.experience.ctaUrl);
      }
    }

    // Work Section
    const secWork = document.getElementById('work');
    if (secWork && s.work) {
      secWork.style.display = s.work.visible !== false ? '' : 'none';
      const label = document.getElementById('work-section-label');
      if (label && s.work.label) label.textContent = s.work.label;
      const subtext = document.getElementById('work-section-subtext');
      if (subtext && s.work.subtext) subtext.textContent = s.work.subtext;
      const cta = document.getElementById('work-section-cta');
      if (cta && s.work.ctaText) {
        cta.innerHTML = `${escapeHtml(s.work.ctaText)} <span class="arrow">→</span>`;
        if (s.work.ctaUrl) cta.setAttribute('href', s.work.ctaUrl);
      }
    }

    // Articles Section
    const secArticles = document.getElementById('articles');
    if (secArticles && s.articles) {
      secArticles.style.display = s.articles.visible !== false ? '' : 'none';
      const label = document.getElementById('articles-section-label');
      if (label && s.articles.label) label.textContent = s.articles.label;
      const subtext = document.getElementById('articles-section-subtext');
      if (subtext && s.articles.subtext) subtext.textContent = s.articles.subtext;
    }

    // Recommendations Section
    const secRec = document.getElementById('recommendations');
    if (secRec && s.recommendations) {
      secRec.style.display = s.recommendations.visible !== false ? '' : 'none';
      const label = document.getElementById('recommendations-section-label');
      if (label && s.recommendations.label) label.textContent = s.recommendations.label;
      const subtext = document.getElementById('recommendations-section-subtext');
      if (subtext && s.recommendations.subtext) subtext.textContent = s.recommendations.subtext;
    }

    // Contact Section
    const secContact = document.getElementById('contact');
    if (secContact && s.contact) {
      secContact.style.display = s.contact.visible !== false ? '' : 'none';
      const label = document.getElementById('contact-section-label');
      if (label && s.contact.label) label.textContent = s.contact.label;
      const heading = document.getElementById('contact-section-heading');
      if (heading && s.contact.heading) heading.textContent = s.contact.heading;
      const subtext = document.getElementById('contact-text');
      if (subtext && s.contact.subtext) subtext.textContent = s.contact.subtext;

      // Contact Form Labels & Placeholders
      const f = s.contact.form || {};
      const lblName = document.getElementById('label-contact-name');
      if (lblName && f.nameLabel) lblName.textContent = f.nameLabel;
      const inpName = document.getElementById('contact-name');
      if (inpName && f.namePlaceholder) inpName.setAttribute('placeholder', f.namePlaceholder);

      const lblEmail = document.getElementById('label-contact-email');
      if (lblEmail && f.emailLabel) lblEmail.textContent = f.emailLabel;
      const inpEmail = document.getElementById('contact-email');
      if (inpEmail && f.emailPlaceholder) inpEmail.setAttribute('placeholder', f.emailPlaceholder);

      const lblSubject = document.getElementById('label-contact-subject');
      if (lblSubject && f.subjectLabel) lblSubject.textContent = f.subjectLabel;
      const inpSubject = document.getElementById('contact-subject');
      if (inpSubject && f.subjectPlaceholder) inpSubject.setAttribute('placeholder', f.subjectPlaceholder);

      const lblMsg = document.getElementById('label-contact-msg');
      if (lblMsg && f.messageLabel) lblMsg.textContent = f.messageLabel;
      const inpMsg = document.getElementById('contact-msg');
      if (inpMsg && f.messagePlaceholder) inpMsg.setAttribute('placeholder', f.messagePlaceholder);

      const btnSubmit = document.getElementById('btn-contact-submit');
      if (btnSubmit && f.submitText) btnSubmit.textContent = f.submitText;

      // Contact Detail Labels
      const d = s.contact.details || {};
      const lblDetEmail = document.getElementById('contact-detail-label-email');
      if (lblDetEmail && d.emailLabel) lblDetEmail.textContent = d.emailLabel;

      const lblDetPhone = document.getElementById('contact-detail-label-phone');
      if (lblDetPhone && d.phoneLabel) lblDetPhone.textContent = d.phoneLabel;

      const lblDetLoc = document.getElementById('contact-detail-label-location');
      if (lblDetLoc && d.locationLabel) lblDetLoc.textContent = d.locationLabel;

      const lblDetConn = document.getElementById('contact-detail-label-connect');
      if (lblDetConn && d.connectLabel) lblDetConn.textContent = d.connectLabel;
    }

    // ── 2. About Page Headers & Visibility ────────────
    const ab = s.aboutPage || {};
    const abHeroLabel = document.getElementById('about-hero-label');
    if (abHeroLabel && ab.heroLabel) abHeroLabel.textContent = ab.heroLabel;

    const abHeroSubtitle = document.getElementById('about-hero-subtitle');
    if (abHeroSubtitle && ab.heroSubtitle) abHeroSubtitle.textContent = ab.heroSubtitle;

    const abBioLabel = document.getElementById('about-bio-label');
    if (abBioLabel && ab.bioLabel) abBioLabel.textContent = ab.bioLabel;

    const abBioCta1 = document.getElementById('about-bio-cta-1');
    if (abBioCta1 && ab.bioCta1Text) {
      abBioCta1.textContent = ab.bioCta1Text;
      if (ab.bioCta1Url) abBioCta1.setAttribute('href', ab.bioCta1Url);
    }
    const abBioCta2 = document.getElementById('about-bio-cta-2');
    if (abBioCta2 && ab.bioCta2Text) {
      abBioCta2.textContent = ab.bioCta2Text;
      if (ab.bioCta2Url) abBioCta2.setAttribute('href', ab.bioCta2Url);
    }
    const abBioCta3 = document.getElementById('about-bio-cta-3');
    if (abBioCta3 && ab.bioCta3Text) {
      abBioCta3.textContent = ab.bioCta3Text;
      if (ab.bioCta3Url) abBioCta3.setAttribute('href', ab.bioCta3Url);
    }

    const secAbAwards = document.getElementById('about-awards');
    if (secAbAwards) {
      secAbAwards.style.display = ab.awardsVisible !== false ? '' : 'none';
      const label = document.getElementById('about-awards-label');
      if (label && ab.awardsLabel) label.textContent = ab.awardsLabel;
    }

    const secAbEdu = document.getElementById('about-education');
    if (secAbEdu) {
      secAbEdu.style.display = ab.educationVisible !== false ? '' : 'none';
      const label = document.getElementById('about-education-label');
      if (label && ab.educationLabel) label.textContent = ab.educationLabel;
    }

    const secAbExp = document.getElementById('about-experience');
    if (secAbExp) {
      secAbExp.style.display = ab.experienceVisible !== false ? '' : 'none';
      const label = document.getElementById('about-experience-label');
      if (label && ab.experienceLabel) label.textContent = ab.experienceLabel;
    }

    const secAbSkills = document.getElementById('about-skills');
    if (secAbSkills) {
      secAbSkills.style.display = ab.skillsVisible !== false ? '' : 'none';
      const label = document.getElementById('about-skills-label');
      if (label && ab.skillsLabel) label.textContent = ab.skillsLabel;
    }

    const secAbExtras = document.getElementById('about-extras');
    if (secAbExtras) {
      secAbExtras.style.display = ab.extrasVisible !== false ? '' : 'none';
      const label = document.getElementById('about-extras-label');
      if (label && ab.extrasLabel) label.textContent = ab.extrasLabel;
    }

    const secAbRec = document.getElementById('about-recommendations');
    if (secAbRec) {
      secAbRec.style.display = (ab.recommendationsVisible !== false && s.recommendations?.visible !== false) ? '' : 'none';
      const label = document.getElementById('about-recommendations-label');
      if (label && s.recommendations?.label) label.textContent = s.recommendations.label;
    }

    // ── 3. Projects Page Headers & Visibility ─────────
    const pr = s.projectsPage || {};
    const prHeroLabel = document.getElementById('projects-hero-label');
    if (prHeroLabel && pr.heroLabel) prHeroLabel.textContent = pr.heroLabel;

    const prHeroTitle = document.getElementById('projects-hero-title');
    if (prHeroTitle && pr.heroTitle) prHeroTitle.textContent = pr.heroTitle;

    const prHeroSubtitle = document.getElementById('projects-hero-subtitle');
    if (prHeroSubtitle && pr.heroSubtitle) prHeroSubtitle.textContent = pr.heroSubtitle;

    const secPrResearch = document.getElementById('thesis');
    if (secPrResearch) {
      secPrResearch.style.display = pr.researchVisible !== false ? '' : 'none';
      const label = document.getElementById('projects-research-label');
      if (label && pr.researchLabel) label.textContent = pr.researchLabel;
    }

    const secPrPub = document.getElementById('publication');
    if (secPrPub) {
      secPrPub.style.display = pr.publicationVisible !== false ? '' : 'none';
      const label = document.getElementById('projects-publication-label');
      if (label && pr.publicationLabel) label.textContent = pr.publicationLabel;
    }

    const secPrSoft = document.getElementById('university-projects');
    if (secPrSoft) {
      secPrSoft.style.display = pr.softwareVisible !== false ? '' : 'none';
      const label = document.getElementById('projects-software-label');
      if (label && pr.softwareLabel) label.textContent = pr.softwareLabel;
    }

    const secPrVol = document.getElementById('volunteer');
    if (secPrVol) {
      secPrVol.style.display = pr.volunteerVisible !== false ? '' : 'none';
      const label = document.getElementById('projects-volunteer-label');
      if (label && pr.volunteerLabel) label.textContent = pr.volunteerLabel;
    }

    // ── 4. Error 404 Page ─────────────────────────────
    const err = s.errorPage || {};
    const errCode = document.getElementById('error-code');
    if (errCode && err.code) errCode.textContent = err.code;

    const errHeading = document.getElementById('error-heading');
    if (errHeading && err.heading) errHeading.textContent = err.heading;

    const errDesc = document.getElementById('error-description');
    if (errDesc && err.description) errDesc.textContent = err.description;

    const errCta1 = document.getElementById('error-cta-1');
    if (errCta1 && err.cta1Text) {
      errCta1.textContent = err.cta1Text;
      if (err.cta1Url) errCta1.setAttribute('href', err.cta1Url);
    }

    const errCta2 = document.getElementById('error-cta-2');
    if (errCta2 && err.cta2Text) {
      errCta2.textContent = err.cta2Text;
      if (err.cta2Url) errCta2.setAttribute('href', err.cta2Url);
    }
  }

  function renderContactAndFooter(p, footerData) {
    const f = footerData || {};

    // Dynamic Contact Links
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

    // Footer Tagline & Copy
    const footerTagline = document.getElementById('footer-tagline');
    if (footerTagline) footerTagline.textContent = f.tagline || p.footerTagline || '';

    const footerCopy = document.getElementById('footer-copy');
    if (footerCopy) {
      footerCopy.textContent = f.copyright || `© ${p.copyrightYear || 2026} ${p.name || 'Fazal Mahmud Hassan'}. All rights reserved.`;
    }

    const footerNavTitle = document.getElementById('footer-nav-title');
    if (footerNavTitle && f.navTitle) footerNavTitle.textContent = f.navTitle;

    const footerNavLinks = document.getElementById('footer-nav-links');
    if (footerNavLinks && Array.isArray(f.links) && f.links.length > 0) {
      footerNavLinks.innerHTML = f.links.map(link => `
        <li><a href="${escapeHtml(link.url)}">${escapeHtml(link.label)}</a></li>
      `).join('');
    }

    const footerConnectTitle = document.getElementById('footer-connect-title');
    if (footerConnectTitle && f.connectTitle) footerConnectTitle.textContent = f.connectTitle;

    const footerSocialLinks = document.getElementById('footer-social-links');
    if (footerSocialLinks && Array.isArray(f.socialLinks) && f.socialLinks.length > 0) {
      footerSocialLinks.innerHTML = f.socialLinks.map(link => {
        const isExternal = /^https?:\/\//i.test(link.url);
        const targetAttr = isExternal ? ' target="_blank" rel="noopener noreferrer"' : '';
        return `<li><a href="${escapeHtml(link.url)}"${targetAttr}>${escapeHtml(link.label)}</a></li>`;
      }).join('');
    }
  }

  function renderSEO(seoData, p) {
    const seo = seoData || {};

    // BUG-11 FIX: Was a no-op block that never applied siteTitle. Now properly updates the page title.
    if (seo.siteTitle) {
      // Append the SEO-configured site title as the suffix after a page prefix (e.g. "About — New Site Title")
      if (document.title.includes('\u2014')) {
        const pagePrefix = document.title.split('\u2014')[0].trim();
        document.title = `${pagePrefix} \u2014 ${seo.siteTitle}`;
      } else {
        document.title = seo.siteTitle;
      }
    }

    if (seo.metaDescription) {
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) metaDesc.setAttribute('content', seo.metaDescription);
    }

    if (seo.keywords) {
      const metaKw = document.querySelector('meta[name="keywords"]');
      if (metaKw) metaKw.setAttribute('content', seo.keywords);
    }
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
    renderNavigation(data.navigation, p);
    renderHero(p, avail);
    renderMetrics(data.metrics);
    renderExpertise(data.expertise);
    renderAwards(data.awards);
    renderArticles(data.articles);
    renderExperience(data.experience);
    renderProjects(data.projects);
    renderRecommendations(data.recommendations);
    renderAboutPage(p, data);
    renderSectionHeadersAndVisibility(data.sections, data);
    renderContactAndFooter(p, data.footer);
    renderSEO(data.seo, p);
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
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderAll);
  } else {
    renderAll();
  }
  window.addEventListener('portfolioDataChanged', renderAll);
})();
