# Changelog

All notable changes to **fazal-profile** are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased]

---

## [1.4.0] — 2026-08-25

### Added
- **True AMOLED black background** — replaced charcoal (`#0A0A0F`) with pure `#000000` across all surface tokens (`--bg`, `--bg-secondary`, `--surface`, `--surface-hover`, `--surface-raised`) so the site reads as pitch black on all displays, including OLED/AMOLED screens.
- **Animated grain / noise texture overlay** — a CSS-only, GPU-accelerated film-grain effect rendered via an inline SVG `feTurbulence` filter on `body::before`. Uses `steps(10)` keyframe animation for a living, subtle texture. Zero extra network requests.
- **Dark / Light mode toggle** — a 🌙 / ☀️ icon button in the navigation bar that:
  - Applies a full, carefully tuned **light mode palette** (`[data-theme="light"]`) with readable contrast and adjusted accent, gold, and green tones.
  - Persists the user's choice across pages and sessions via `localStorage` (`portfolio_theme`).
  - Prevents flash-of-unstyled-content (FOUC) via an inline `<script>` in `<head>` that sets `data-theme` before CSS renders.
- **Light mode element overrides** — nav backdrop, mobile drawer, scrollbar, and modal overlay all adapt correctly to the light palette.
- **`nav-actions` wrapper** — groups the theme toggle and mobile hamburger button together for clean responsive layout at all breakpoints.

### Changed
- Navigation background updated from `rgba(10,10,15,...)` to `rgba(0,0,0,...)` (dark) and `rgba(255,255,255,...)` (light) to match the new AMOLED palette.
- Mobile nav drawer background changed from a hardcoded RGBA value to `var(--bg)` so it inherits the active theme automatically.
- Body element now has `transition: background-color 0.25s, color 0.25s` for a smooth theme switch animation.

### Removed
- **CMS keyboard shortcut** (`Ctrl+Shift+A`) removed from `main.js`. The admin panel (`/admin.html`) is now only accessible via its direct URL — no public-facing hints remain.

### Security
- Admin panel is fully hidden from the public frontend. No links, buttons, or keyboard shortcuts expose the CMS entry point. Password gate on `admin.html` remains intact.

---

## [1.3.0] — 2026-08-25

### Added
- **Rich Text WYSIWYG Editor (RTE)** in the CMS admin panel.
  - Custom formatting toolbar: Bold, Italic, Underline, H2/H3 headings, blockquote, ordered/unordered lists, links.
  - Live `contenteditable` visual editing with real-time preview rendering.
  - HTML source toggle — switch between visual and raw HTML code views.
  - Applied to the "About Page Story" and "Article" content fields in `admin.html`.

---

## [1.2.0] — 2026-08-25

### Added
- Comprehensive **design system overhaul** — clean, modern, minimal and insightful aesthetic.
  - 17px base font, 8px spacing grid, minor-third typographic scale.
  - Space Grotesk (display), DM Sans (body), JetBrains Mono (code) font stack.
  - Standardised CSS custom property token system for colour, spacing, shadow, and radius.
- **Redesigned components**: hero, expertise cards, metric counters, experience timeline, articles, projects.
- **3-column footer** with brand, navigation links, and social columns.
- **Responsive grids** for tablet (880px) and mobile (600px) breakpoints.
- Standardised `.section-label`, `.card`, `.btn`, `.badge`, `.metric-card` utility classes.

### Changed
- All section padding aligned to the 8px grid.
- Nav height fixed at 60px with glassmorphism backdrop blur.

---

## [1.1.0] — 2026-08-22

### Added
- **Mobile & tablet responsiveness** — fluid grids and media queries across all pages.
- Increased base font size for improved readability.

---

## [1.0.0] — 2026-08-21

### Added
- **Animated typewriter** effect in hero section.
- **Live availability status badge** driven by CMS toggle.
- **Metric counters** with animated counting on scroll-into-view.
- **Awards & Recognition** spotlight section.
- **Thought leadership blog/articles** CMS panel and frontend render.
- **Contact form** with mailto integration.
- **Password-protected CMS** panel (`admin.html`) for managing all portfolio content via `localStorage`-backed `PortfolioStore`.

---

## [0.1.0] — 2026-08-20

### Added
- Initial project scaffold: `index.html`, `about.html`, `projects.html`, `admin.html`.
- Dark theme portfolio with `PortfolioStore` data layer and `render.js` DOM binding engine.
- `css/style.css`, `css/admin.css`, `js/main.js`, `js/admin.js`, `js/render.js`, `data/default-data.js`.
