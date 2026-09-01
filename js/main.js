'use strict';

/* ============================================================
   PORTFOLIO MAIN INTERACTIONS (js/main.js)
   - Navigation scroll states & mobile drawer controller
   - HiDPI Canvas ambient background (Meteors / Birds)
   - Tab visibility lifecycle (Battery & GPU optimization)
   - Scroll-driven animations & IntersectionObservers
   - Animated metric counters
   - Accessible interactive contact form
   - Dark / Light mode toggle
   ============================================================ */

const NAV_SCROLL_THRESHOLD = 10;       // px scrolled before nav gets 'scrolled' class
const DESKTOP_BREAKPOINT = 880;        // matches CSS @media breakpoint in style.css
const METRIC_COUNTER_DURATION_MS = 1200;

document.addEventListener('DOMContentLoaded', () => {

  /* ── 1. Navigation Scroll State ───────────────────────────── */
  const nav = document.querySelector('.nav');
  if (nav) {
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          nav.classList.toggle('scrolled', window.scrollY > NAV_SCROLL_THRESHOLD);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ── 2. Mobile Navigation Drawer ─────────────────────────── */
  const navToggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');

  function closeMobileNav() {
    if (!navLinks || !navToggle) return;
    navLinks.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
    const spans = navToggle.querySelectorAll('span');
    if (spans.length >= 3) {
      spans[0].style.transform = '';
      spans[1].style.opacity = '';
      spans[2].style.transform = '';
    }
  }

  function openMobileNav() {
    if (!navLinks || !navToggle) return;
    navLinks.classList.add('open');
    navToggle.setAttribute('aria-expanded', 'true');
    const spans = navToggle.querySelectorAll('span');
    if (spans.length >= 3) {
      spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
      spans[1].style.opacity = '0';
      spans[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
    }
  }

  if (navToggle && navLinks) {
    navToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = navLinks.classList.contains('open');
      if (isOpen) {
        closeMobileNav();
      } else {
        openMobileNav();
      }
    });

    // Close menu when clicking nav link
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', closeMobileNav);
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (navLinks.classList.contains('open') && !navLinks.contains(e.target) && !navToggle.contains(e.target)) {
        closeMobileNav();
      }
    });

    // Close menu on Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && navLinks.classList.contains('open')) {
        closeMobileNav();
      }
    });

    // Reset when resizing to desktop
    window.addEventListener('resize', () => {
      if (window.innerWidth > DESKTOP_BREAKPOINT && navLinks.classList.contains('open')) {
        closeMobileNav();
      }
    });
  }

  /* ── 3. Active Nav Link Highlighting ─────────────────────── */
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });

  /* ── 4. Scroll Fade-Up Animations ────────────────────────── */
  const fadeEls = document.querySelectorAll('.fade-up');
  if (fadeEls.length && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -30px 0px' }
    );
    fadeEls.forEach(el => observer.observe(el));
  }

  /* ── 5. Animated Metric Counters ─────────────────────────── */
  function animateMetrics() {
    const metricElements = document.querySelectorAll('.metric-val');
    metricElements.forEach(el => {
      const targetStr = el.getAttribute('data-target') || el.textContent;
      const targetNum = parseInt(targetStr, 10);
      if (isNaN(targetNum)) return;

      let current = 0;
      const duration = METRIC_COUNTER_DURATION_MS;
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

  const metricsGrid = document.getElementById('hero-metrics-container');
  if (metricsGrid && 'IntersectionObserver' in window) {
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

  // FIX 2: Expose animateMetrics globally so render.js can re-trigger
  // counter animation after a CMS save re-renders the metrics container.
  window.triggerMetricAnimation = animateMetrics;

  /* ── 6. Contact Form Submission Handler ─────────────────── */
  const contactForm = document.getElementById('portfolio-contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const statusEl = document.getElementById('contact-form-status');
      const submitBtn = contactForm.querySelector('button[type="submit"]');

      const name = contactForm.querySelector('[name="name"]')?.value.trim() || '';
      const email = contactForm.querySelector('[name="email"]')?.value.trim() || '';
      const subject = contactForm.querySelector('[name="subject"]')?.value.trim() || '';
      const message = contactForm.querySelector('[name="message"]')?.value.trim() || '';

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

      setTimeout(() => {
        const pData = window.PortfolioStore ? window.PortfolioStore.getData() : {};
        const ownerEmail = pData?.profile?.email || 'fazal.mahmud.hassan@gmail.com';

        if (statusEl) {
          statusEl.className = 'form-status success';
          statusEl.innerHTML = `✅ Thank you, <strong>${escapeContactStr(name)}</strong>! Preparing your email client. If it does not open automatically, email me directly at <a href="mailto:${ownerEmail}" style="color:#34D399;text-decoration:underline;">${ownerEmail}</a>.`;
        }

        const mailtoUri = `mailto:${ownerEmail}?subject=${encodeURIComponent(subject || `Portfolio Inquiry from ${name}`)}&body=${encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`)}`;
        window.location.href = mailtoUri;

        contactForm.reset();
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Send Message ↗';
        }
      }, 400);
    });
  }

  function escapeContactStr(str) {
    return String(str).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[m]);
  }

  /* ── 7. Dark / Light Theme Toggle ───────────────────────── */
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'dark';
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('portfolio_theme', next);
    });
  }

  /* ── 8. Ambient Background Canvas (Retina & Battery Aware) ─ */
  initAmbientCanvas();

  function initAmbientCanvas() {
    const canvas = document.createElement('canvas');
    canvas.id = 'ambient-canvas';
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.style.zIndex = '-1';
    canvas.style.pointerEvents = 'none';
    document.body.prepend(canvas);

    const ctx = canvas.getContext('2d');
    let width = 0;
    let height = 0;
    let dpr = window.devicePixelRatio || 1;
    let isTabActive = true;
    let animFrameId = null;

    function resize() {
      dpr = window.devicePixelRatio || 1;
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // HiDPI scaling
    }
    resize();

    let resizeTimer = null;
    window.addEventListener('resize', () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 100);
    });

    // Battery / Background Tab Saver
    document.addEventListener('visibilitychange', () => {
      isTabActive = !document.hidden;
      if (isTabActive && !animFrameId) {
        animFrameId = requestAnimationFrame(renderLoop);
      }
    });

    // --- Dark Mode: Meteors ---
    const meteors = [];
    function createMeteor(initial = false) {
      return {
        x: initial ? Math.random() * width : Math.random() * width + width * 0.4,
        y: initial ? Math.random() * height : Math.random() * -150,
        length: Math.random() * 140 + 90,
        speed: Math.random() * 2.2 + 1.8,
        opacity: Math.random() * 0.28 + 0.18,
        width: Math.random() * 1.5 + 0.8
      };
    }
    for (let i = 0; i < 6; i++) {
      meteors.push(createMeteor(true));
    }

    // --- Light Mode: Flying Birds ---
    const birds = [];
    function createBird(initial = false) {
      return {
        x: initial ? Math.random() * (width + 200) - 100 : -100,
        y: Math.random() * (height * 0.6) + 80,
        size: Math.random() * 8 + 6,
        speedX: Math.random() * 0.8 + 0.5,
        speedY: (Math.random() - 0.5) * 0.1,
        flapPhase: Math.random() * Math.PI * 2,
        flapSpeed: Math.random() * 0.08 + 0.06,
        opacity: Math.random() * 0.18 + 0.12
      };
    }
    for (let i = 0; i < 4; i++) {
      birds.push(createBird(true));
    }

    function renderLoop() {
      if (!isTabActive) {
        animFrameId = null;
        return;
      }

      ctx.clearRect(0, 0, width, height);
      const isLight = document.documentElement.getAttribute('data-theme') === 'light';

      if (isLight) {
        // Render Birds
        for (let i = 0; i < birds.length; i++) {
          const b = birds[i];
          b.x += b.speedX;
          b.y += b.speedY;
          b.flapPhase += b.flapSpeed;

          const flapAngle = Math.sin(b.flapPhase);

          ctx.save();
          ctx.translate(b.x, b.y);
          ctx.strokeStyle = `rgba(59, 111, 224, ${b.opacity})`;
          ctx.lineWidth = 1.6;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';

          ctx.beginPath();
          ctx.moveTo(-b.size, flapAngle * b.size * 0.35);
          ctx.quadraticCurveTo(-b.size * 0.3, -b.size * 0.22, 0, 0);
          ctx.quadraticCurveTo(b.size * 0.3, -b.size * 0.22, b.size, flapAngle * b.size * 0.35);
          ctx.stroke();
          ctx.restore();

          if (b.x > width + 100) {
            birds[i] = createBird(false);
          }
        }
      } else {
        // Render Meteors
        for (let i = 0; i < meteors.length; i++) {
          const m = meteors[i];
          m.x -= m.speed;
          m.y += m.speed * 0.58;

          const grad = ctx.createLinearGradient(m.x, m.y, m.x + m.length, m.y - m.length * 0.58);
          grad.addColorStop(0, `rgba(74, 133, 255, ${m.opacity})`);
          grad.addColorStop(0.06, `rgba(255, 255, 255, ${m.opacity * 1.35})`);
          grad.addColorStop(1, 'rgba(74, 133, 255, 0)');

          ctx.beginPath();
          ctx.strokeStyle = grad;
          ctx.lineWidth = m.width;
          ctx.lineCap = 'round';
          ctx.moveTo(m.x, m.y);
          ctx.lineTo(m.x + m.length, m.y - m.length * 0.58);
          ctx.stroke();

          if (m.x < -m.length || m.y > height + m.length) {
            meteors[i] = createMeteor(false);
          }
        }
      }

      animFrameId = requestAnimationFrame(renderLoop);
    }

    animFrameId = requestAnimationFrame(renderLoop);
  }
});
