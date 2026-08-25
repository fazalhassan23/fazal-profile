/* ============================================================
   main.js — Portfolio JS
   - Scrolled nav styling
   - Active nav link highlighting
   - Mobile menu toggle & accessible drawer
   - Scroll-driven fade-up animations
   - Animated metric number counting
   - Interactive contact form handler
   - Dark / Light theme toggle
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ── Nav: add .scrolled class on scroll ─────────────────── */
  const nav = document.querySelector('.nav');
  if (nav) {
    const onScroll = () => {
      nav.classList.toggle('scrolled', window.scrollY > 10);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ── Mobile menu toggle & drawer controller ──────────────── */
  const toggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');

  function closeMobileNav() {
    if (!navLinks || !toggle) return;
    navLinks.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
    const spans = toggle.querySelectorAll('span');
    if (spans.length >= 3) {
      spans[0].style.transform = '';
      spans[1].style.opacity = '';
      spans[2].style.transform = '';
    }
  }

  function openMobileNav() {
    if (!navLinks || !toggle) return;
    navLinks.classList.add('open');
    toggle.setAttribute('aria-expanded', 'true');
    const spans = toggle.querySelectorAll('span');
    if (spans.length >= 3) {
      spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
      spans[1].style.opacity = '0';
      spans[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
    }
  }

  if (toggle && navLinks) {
    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = navLinks.classList.contains('open');
      if (isOpen) {
        closeMobileNav();
      } else {
        openMobileNav();
      }
    });

    // Close menu when clicking any nav link
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        closeMobileNav();
      });
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (navLinks.classList.contains('open') && !navLinks.contains(e.target) && !toggle.contains(e.target)) {
        closeMobileNav();
      }
    });

    // Close menu on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && navLinks.classList.contains('open')) {
        closeMobileNav();
      }
    });

    // Reset when resizing to desktop view
    window.addEventListener('resize', () => {
      if (window.innerWidth > 880 && navLinks.classList.contains('open')) {
        closeMobileNav();
      }
    });
  }

  /* ── Active nav link ─────────────────────────────────────── */
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });

  /* ── Scroll fade-up animations ───────────────────────────── */
  const fadeEls = document.querySelectorAll('.fade-up');
  if (fadeEls.length) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );
    fadeEls.forEach(el => observer.observe(el));
  }

  /* ── Hero text: immediate fade-in on page load ───────────── */
  const heroContent = document.querySelectorAll('.hero > *');
  heroContent.forEach((el, i) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(10px)';
    el.style.transition = `opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1) ${i * 60}ms, transform 0.4s cubic-bezier(0.4, 0, 0.2, 1) ${i * 60}ms`;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
      });
    });
  });

  /* ── Animated Metric Counter ─────────────────────────────── */
  function animateMetrics() {
    const metricElements = document.querySelectorAll('.metric-val');
    metricElements.forEach(el => {
      const targetStr = el.getAttribute('data-target') || el.textContent;
      const targetNum = parseInt(targetStr, 10);
      if (isNaN(targetNum)) return;

      let current = 0;
      const duration = 1200;
      const stepTime = Math.max(15, Math.floor(duration / targetNum));
      const stepVal = Math.max(1, Math.ceil(targetNum / (duration / stepTime)));

      el.textContent = '0';
      const timer = setInterval(() => {
        current += stepVal;
        if (current >= targetNum) {
          el.textContent = targetNum;
          clearInterval(timer);
        } else {
          el.textContent = current;
        }
      }, stepTime);
    });
  }

  // Trigger metrics animation on scroll
  const metricsGrid = document.getElementById('hero-metrics-container');
  if (metricsGrid) {
    const metricObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateMetrics();
          metricObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    metricObserver.observe(metricsGrid);
  }

  /* ── Interactive Contact Form Submission ─────────────────── */
  const contactForm = document.getElementById('portfolio-contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const statusEl = document.getElementById('contact-form-status');
      const submitBtn = contactForm.querySelector('button[type="submit"]');

      const name = contactForm.querySelector('[name="name"]')?.value || '';
      const email = contactForm.querySelector('[name="email"]')?.value || '';
      const subject = contactForm.querySelector('[name="subject"]')?.value || '';
      const message = contactForm.querySelector('[name="message"]')?.value || '';

      if (!name || !email || !message) {
        if (statusEl) {
          statusEl.className = 'form-status error';
          statusEl.textContent = 'Please fill in all required fields.';
        }
        return;
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending Message...';
      }

      // Simulate instantaneous processing and prepare email
      setTimeout(() => {
        if (statusEl) {
          statusEl.className = 'form-status success';
          statusEl.innerHTML = `✅ Thank you, <strong>${name}</strong>! Your message has been prepared. If your email client doesn't open automatically, reach out to me directly at <a href="mailto:fazal.mahmud.hassan@gmail.com" style="color:#34D399;text-decoration:underline;">fazal.mahmud.hassan@gmail.com</a>.`;
        }

        const mailtoUri = `mailto:fazal.mahmud.hassan@gmail.com?subject=${encodeURIComponent(subject || `Portfolio Contact from ${name}`)}&body=${encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`)}`;
        window.location.href = mailtoUri;

        contactForm.reset();
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Send Message ↗';
        }
      }, 500);
    });
  }

  /* ── Dark / Light Theme Toggle ──────────────────────────── */
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'dark';
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('portfolio_theme', next);
    });
  }

});
