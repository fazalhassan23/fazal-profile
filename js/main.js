/* ============================================================
   main.js — Portfolio JS
   - Scrolled nav styling
   - Active nav link highlighting
   - Mobile menu toggle
   - Scroll-driven fade-up animations
   - Animated metric number counting
   - Interactive contact form handler
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

  /* ── Mobile menu toggle ──────────────────────────────────── */
  const toggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');
  if (toggle && navLinks) {
    toggle.addEventListener('click', () => {
      const isOpen = navLinks.classList.toggle('open');
      toggle.setAttribute('aria-expanded', isOpen);
      // Animate hamburger → X
      const spans = toggle.querySelectorAll('span');
      if (isOpen) {
        spans[0].style.transform = 'rotate(45deg) translate(4px, 4px)';
        spans[1].style.opacity = '0';
        spans[2].style.transform = 'rotate(-45deg) translate(4px, -4px)';
      } else {
        spans[0].style.transform = '';
        spans[1].style.opacity = '';
        spans[2].style.transform = '';
      }
    });

    // Close menu when a link is clicked
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('open');
        const spans = toggle.querySelectorAll('span');
        spans[0].style.transform = '';
        spans[1].style.opacity = '';
        spans[2].style.transform = '';
      });
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
    el.style.transform = 'translateY(16px)';
    el.style.transition = `opacity 0.55s ease ${i * 90}ms, transform 0.55s ease ${i * 90}ms`;
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
    }, { threshold: 0.2 });
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

      // Simulate instantaneous processing or create mailto fallback
      setTimeout(() => {
        if (statusEl) {
          statusEl.className = 'form-status success';
          statusEl.innerHTML = `✅ Thank you, <strong>${name}</strong>! Your message has been prepared. If your email client doesn't open, email me directly at <a href="mailto:fazal.mahmud.hassan@gmail.com" style="color:#34D399;text-decoration:underline;">fazal.mahmud.hassan@gmail.com</a>.`;
        }

        // Open mailto link with prepopulated body
        const mailtoUri = `mailto:fazal.mahmud.hassan@gmail.com?subject=${encodeURIComponent(subject || `Portfolio Contact from ${name}`)}&body=${encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`)}`;
        window.location.href = mailtoUri;

        contactForm.reset();
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Send Message ↗';
        }
      }, 600);
    });
  }

  /* ── Keyboard shortcut: Ctrl+Shift+A to open CMS ─────────── */
  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
      e.preventDefault();
      window.location.href = 'admin.html';
    }
  });

});
