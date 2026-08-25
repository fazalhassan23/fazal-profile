/* ============================================================
   PORTFOLIO DYNAMIC RENDERER (js/render.js)
   Binds stored CMS data to DOM elements on all pages.
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  if (!window.PortfolioStore) return;

  let typewriterTimer = null;

  function renderAll() {
    const data = window.PortfolioStore.getData();
    if (!data || !data.profile) return;

    const p = data.profile;
    const avail = data.availability || {};

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
        document.title = `${p.name} — ${p.roleTitle ? p.roleTitle.split('·')[0].trim() : 'Portfolio'}`;
      }
    }

    /* ── 2. Availability Badge ────────────────────────────── */
    const availContainer = document.getElementById('hero-availability');
    if (availContainer) {
      const status = avail.status || 'available';
      availContainer.className = `availability-badge ${status}`;
      const availText = document.getElementById('availability-text');
      if (availText) {
        availText.textContent = avail.badgeText || 'Available for New Opportunities';
      }
    }

    /* ── 3. Hero Section (index.html) ─────────────────────── */
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

    const heroBio = document.getElementById('hero-bio');
    if (heroBio) heroBio.textContent = p.heroBio || '';

    // Typewriter effect initialization
    initTypewriter(avail.typewriterRoles || [p.roleTitle || "Technical Project Manager"]);

    /* ── 4. Metric Counters (Rectangular Row Cards) ──────── */
    const metricsContainer = document.getElementById('hero-metrics-container');
    if (metricsContainer && data.metrics) {
      metricsContainer.innerHTML = data.metrics.map(m => `
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

    /* ── 5. Expertise Grid (2-Column Icon + Text Block) ───── */
    const expertiseContainer = document.getElementById('expertise-container');
    if (expertiseContainer && data.expertise) {
      expertiseContainer.innerHTML = data.expertise.map(exp => `
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

    /* ── 6. Awards & Honors Showcase (Subtle Gold Left Border) */
    const awardsContainer = document.getElementById('awards-container');
    if (awardsContainer && data.awards) {
      awardsContainer.innerHTML = data.awards.map(awd => `
        <div class="award-card fade-up visible">
          <div class="award-icon-box">🏆</div>
          <div class="award-content">
            <h3 class="award-title">${escapeHtml(awd.title || '')}</h3>
            <p class="award-org">${escapeHtml(awd.organization || '')} · <span class="award-year-inline">${escapeHtml(awd.year || '')}</span></p>
          </div>
        </div>
      `).join('');
    }

    /* ── 7. Articles & Insights Feed (2-Column Rows) ──────── */
    const articlesContainer = document.getElementById('articles-container');
    if (articlesContainer && data.articles) {
      articlesContainer.innerHTML = data.articles.map(art => {
        const tagsHtml = (art.tags || []).slice(0, 2).map(t => `<span class="article-tag">${escapeHtml(t)}</span>`).join('');
        return `
          <div class="article-card fade-up visible" onclick="window.openArticleModal('${escapeHtml(art.id)}')">
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
              <span class="article-read-btn">→</span>
            </div>
          </div>
        `;
      }).join('');
    }

    /* ── 8. Home Experience Preview (index.html - top 3) ─── */
    const homeExpContainer = document.getElementById('home-experience-container');
    if (homeExpContainer && data.experience) {
      const top3 = data.experience.slice(0, 3);
      homeExpContainer.innerHTML = top3.map(job => renderTimelineItem(job)).join('');
    }

    /* ── 9. Home Featured Work Preview (index.html) ──────── */
    const homeProjContainer = document.getElementById('home-projects-container');
    if (homeProjContainer && data.projects) {
      const featured = data.projects.slice(0, 3);
      homeProjContainer.innerHTML = featured.map(proj => renderProjectCard(proj)).join('');
    }

    /* ── 10. About Page Bio & Lead (about.html) ───────────── */
    const aboutLead = document.getElementById('about-lead');
    if (aboutLead) aboutLead.textContent = p.aboutLead || p.heroBio || '';

    const aboutParagraphs = document.getElementById('about-paragraphs');
    if (aboutParagraphs && p.aboutBodyParagraphs) {
      aboutParagraphs.innerHTML = p.aboutBodyParagraphs.map(text => `<p>${escapeHtml(text)}</p>`).join('');
    }

    /* ── 11. About Page Education (about.html) ────────────── */
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

    /* ── 12. About Page Full Experience Timeline ─────────── */
    const fullExpContainer = document.getElementById('full-experience-container');
    if (fullExpContainer && data.experience) {
      fullExpContainer.innerHTML = data.experience.map(job => renderTimelineItem(job)).join('');
    }

    /* ── 13. About Page Skills (about.html) ──────────────── */
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

    /* ── 14. About Page Extra Curriculars (about.html) ───── */
    const extrasContainer = document.getElementById('extras-container');
    if (extrasContainer && data.extraCurriculars) {
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

    /* ── 15. Projects Page (projects.html) ───────────────── */
    const researchContainer = document.getElementById('projects-research-container');
    if (researchContainer && data.projects) {
      const researchProjects = data.projects.filter(pr => pr.category === 'research');
      researchContainer.innerHTML = researchProjects.map(proj => renderProjectCard(proj)).join('');
    }

    const pubContainer = document.getElementById('projects-publication-container');
    if (pubContainer && data.projects) {
      const pubProjects = data.projects.filter(pr => pr.category === 'publication');
      pubContainer.innerHTML = pubProjects.map(proj => renderProjectCard(proj)).join('');
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

    /* ── 16. Contact Details & Links ─────────────────────── */
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

    document.querySelectorAll('[data-cms-link="resume"]').forEach(el => {
      if (p.resumeUrl) {
        el.setAttribute('href', p.resumeUrl);
        el.setAttribute('target', '_blank');
      } else {
        el.setAttribute('href', 'javascript:window.printCV()');
      }
    });

    /* ── 17. Footer ──────────────────────────────────────── */
    const footerTagline = document.getElementById('footer-tagline');
    if (footerTagline) footerTagline.textContent = p.footerTagline || '';

    const footerCopy = document.getElementById('footer-copy');
    if (footerCopy) footerCopy.textContent = `© ${p.copyrightYear || 2026} ${p.name}`;
  }

  /* ── Typewriter Engine (Clean, no distracting cursor) ── */
  function initTypewriter(roles) {
    const el = document.getElementById('hero-typewriter');
    if (!el || !roles || !roles.length) return;

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
  window.openArticleModal = function (articleId) {
    const data = window.PortfolioStore.getData();
    if (!data || !data.articles) return;
    const art = data.articles.find(a => a.id === articleId);
    if (!art) return;

    let overlay = document.getElementById('article-modal-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'article-modal-overlay';
      overlay.className = 'portfolio-modal-overlay';
      overlay.innerHTML = `
        <div class="portfolio-modal-box">
          <div class="modal-header">
            <div>
              <span class="article-category" id="modal-art-category"></span>
              <span class="article-date" style="margin-left:0.6rem" id="modal-art-meta"></span>
            </div>
            <button class="modal-close" onclick="window.closeArticleModal()" aria-label="Close modal">&times;</button>
          </div>
          <h2 class="modal-title" id="modal-art-title"></h2>
          <div class="modal-body" id="modal-art-body"></div>
          <div class="modal-footer">
            <div id="modal-art-tags" class="article-tags"></div>
            <button class="btn btn-outline" style="padding:0.4rem 0.9rem; font-size:0.875rem;" onclick="window.closeArticleModal()">Close</button>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) window.closeArticleModal();
      });
    }

    document.getElementById('modal-art-category').textContent = art.category || 'Article';
    document.getElementById('modal-art-meta').textContent = `${art.date || ''} · ${art.readTime || '5 min read'}`;
    document.getElementById('modal-art-title').textContent = art.title || '';
    
    // Parse paragraphs in content
    const contentHtml = (art.content || art.summary || '')
      .split('\n\n')
      .map(para => `<p>${escapeHtml(para)}</p>`)
      .join('');
    document.getElementById('modal-art-body').innerHTML = contentHtml;

    const tagsContainer = document.getElementById('modal-art-tags');
    if (tagsContainer) {
      tagsContainer.innerHTML = (art.tags || []).map(t => `<span class="article-tag">${escapeHtml(t)}</span>`).join('');
    }

    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  };

  window.closeArticleModal = function () {
    const overlay = document.getElementById('article-modal-overlay');
    if (overlay) {
      overlay.classList.remove('open');
      document.body.style.overflow = '';
    }
  };

  /* ── Interactive Print/CV Action ───────────────────────── */
  window.printCV = function () {
    window.open('about.html', '_blank');
  };

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
