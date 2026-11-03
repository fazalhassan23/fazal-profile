'use strict';

// Public-facing presentation layer. Content continues to come from PortfolioStore.
(() => {
  const root = document.documentElement;
  try {
    root.dataset.design = 'index';
    if (!localStorage.getItem('portfolio_theme')) root.dataset.theme = 'dark';
  } catch (_) { root.dataset.theme = 'dark'; }

  document.addEventListener('DOMContentLoaded', () => {
    const themeButton = document.getElementById('theme-toggle');
    if (themeButton) {
      function updateThemeLabel() {
        const dark = root.dataset.theme !== 'light';
        const icon = dark
          ? '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/>'
          : '<path d="M20.9 13.4A9 9 0 0 1 10.6 3.1 9 9 0 1 0 20.9 13.4Z"/>';
        themeButton.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icon}</svg>`;
        themeButton.title = dark ? 'Switch to day mode' : 'Switch to night mode';
        themeButton.setAttribute('aria-label', dark ? 'Switch to day mode' : 'Switch to night mode');
      }
      new MutationObserver(updateThemeLabel).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
      updateThemeLabel();
    }

    const hero = document.querySelector('section.hero');
    if (hero) {
      const main = document.createElement('div');
      main.className = 'hero-main';
      const metrics = document.getElementById('hero-metrics-container');
      Array.from(hero.children).forEach(child => { if (child !== metrics) main.append(child); });
      hero.prepend(main);
    }
    // Keep the complete career readable without overwhelming the home page.
    const timeline = document.getElementById('home-experience-container');
    if (timeline) {
      function foldExperience() {
        timeline.querySelectorAll('.timeline-item').forEach((item, index) => {
          const bullets = item.querySelector('.timeline-bullets');
          if (!bullets || bullets.parentElement.tagName === 'DETAILS') return;
          if (index < 2 && bullets.firstElementChild) {
            const highlight = document.createElement('p');
            highlight.className = 'timeline-highlight';
            highlight.textContent = bullets.firstElementChild.textContent;
            bullets.firstElementChild.remove();
            bullets.before(highlight);
            if (!bullets.children.length) {
              bullets.remove();
              return;
            }
          }
          const details = document.createElement('details');
          details.className = 'experience-details';
          const summary = document.createElement('summary');
          summary.textContent = 'Responsibilities & impact';
          bullets.before(details);
          details.append(summary, bullets);
        });
      }
      foldExperience();
      new MutationObserver(foldExperience).observe(timeline, { childList: true });
    }
  });
})();
