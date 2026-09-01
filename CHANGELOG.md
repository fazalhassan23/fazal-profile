# Changelog

All notable changes to **fazal-profile** are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [2.2.0] — 2026-09-02

> Branch: `Worked-from-office` — Transitioned production CI/CD deployment pipeline to GitHub Pages.

### Changed

#### `.github/workflows/deploy.yml` — Automated GitHub Pages CI/CD Pipeline
- **Removed**: Legacy Namecheap cPanel FTP upload deployment action.
- **Added**: Official GitHub Pages CI/CD deployment workflow (`actions/checkout@v4`, `actions/configure-pages@v5`, `actions/upload-pages-artifact@v3`, `actions/deploy-pages@v4`) with `pages: write` and `id-token: write` permissions.
- **Documentation**: Updated `DEPLOYMENT.md` with step-by-step setup instructions for setting repository Pages source to **GitHub Actions**.

---

## [2.1.2] — 2026-09-02

> Branch: `Worked-from-office` — Expertise card layout & mobile text cramping resolution.

### Fixed

#### `css/style.css` + `js/render.js` — Expertise Card Mobile Cramping Fix (Major)
- **Root cause**: `renderExpertise()` rendered an unclassed `<div>` child inside `.expertise-card` without a `.card-icon` or body wrapper. In flexbox row containers without explicit `flex: 1` and `min-width: 0` rules, the child container collapsed down to min-content width on mobile devices, causing title and body text to cramp vertically on the left edge.
- **Fix**: Wrapped expertise card content in `.expertise-card-body` (`flex: 1; min-width: 0; width: 100%`) in `render.js`, re-added the category icon badge (`.card-icon`), and converted `.expertise-grid` into a responsive 3-column desktop / 1-column mobile grid system.

---

## [2.1.1] — 2026-09-02

> Branch: `Worked-from-office` — Mobile responsiveness audit and card layout fixes.

### Fixed

#### `css/style.css` — Mobile Card Layout & Text Overflow Fixes (Major)
- **`recommendation-card`**: Reduced mobile padding (`1.25rem 1rem 1rem`), added `min-width: 0` and `overflow-wrap: anywhere` to author info, wrapped author name with LinkedIn badge, and stacked metadata vertically on small screens (`<480px`).
- **`article-card`**: Applied column flex layout on mobile screens (`<640px`) with fluid spacing, responsive meta tag alignment, and text wrapping protection on title & summary blocks.
- **`project-card`**: Converted two-column grid into a fluid column layout on mobile (`<640px`) and reversed tag/year row layout on extra-small devices (`<480px`).
- **`metric-card`**: Switched 2-column metrics grid into vertical flex items (`<640px`) to prevent side-by-side number/label clipping on landscape phones and phablets.
- **`award-card`**, **`expertise-card`**, **`edu-item`**: Added `min-width: 0` containment and overflow handling to prevent long organization names, degrees, or titles from pushing cards out of screen boundaries.

#### `css/admin.css` — Admin Mobile Responsiveness Overrides (Minor)
- Added mobile layout flex rules for `.admin-topbar`, `.admin-item-card`, `.admin-item-actions`, and `.admin-modal` to ensure full usability on mobile viewports (`<680px`).

---

## [2.1.0] — 2026-09-02

> Branch: `Worked-from-office` — CMS-to-frontend data sync deep-dive and root cause resolution.

### Fixed

#### `index.html` — Hardcoded Metric Cards Bypassed CMS Renderer (Critical)
- **Root cause**: `#hero-metrics-container` had 4 static metric card blocks hardcoded in HTML. `renderMetrics()` uses `container.innerHTML = ...` to replace contents, but the `IntersectionObserver` in `main.js` fires on static cards on initial load and unobserves. After CMS saves, new cards render but the observer never re-fires.
- **Fix**: Removed all hardcoded metric card HTML from `index.html`. Container is now populated dynamically by `render.js`.

#### `js/main.js` + `js/render.js` — Metric Counter Animation Did Not Re-trigger After CMS Save (Major)
- **Root cause**: `animateMetrics()` was only wired via a one-shot `IntersectionObserver`. Subsequent CMS re-renders left counters displaying raw static numbers.
- **Fix**: Exposed `window.triggerMetricAnimation = animateMetrics` in `main.js` and called it at the end of `renderMetrics()` in `render.js`.

#### `js/admin.js` — `portfolioDataChanged` Listener Clobbered Unsaved In-Memory Edits (Critical)
- **Root cause**: The `portfolioDataChanged` listener called `populateAll()` on every event — including during active saving, resetting form inputs from localStorage before async saves finished.
- **Fix**: Added `window._adminSaveInProgress` flag around `saveData()` calls to skip data re-fetching during active save cycles.

#### `js/render.js` — `renderNavigation()` Left Nav Blank When `nav.items` Was Empty (Major)
- **Root cause**: If `nav.items` was empty, `renderNavigation()` skipped DOM updates, leaving the nav blank if a previous render had cleared it.
- **Fix**: Preserved DOM when `nav.items` is empty so fallback static HTML remains intact.

#### `js/render.js` — `renderAboutPage()` Rendered Blank `<p>` Tags (Medium)
- **Root cause**: When the rich text editor was empty, `aboutBodyParagraphs` contained `[""]`, rendering `<p></p>` tags.
- **Fix**: Added `.filter(text => text && text.trim())` before mapping paragraphs.

#### `js/admin.js` — Hero CTA `visible` Property Hardcoded to `true` on Save (Medium)
- **Root cause**: `btn-save-all` handler set `cta.visible = true` unconditionally.
- **Fix**: Updated to preserve existing boolean state (`cta.visible !== false`).

#### `admin.html` — Recommendations Section Inputs Missing from Sections Panel (Major)
- **Root cause**: Save handler called `getVal()` on non-existent recommendation input IDs, overwriting saved section configs with empty strings.
- **Fix**: Added Recommendations section inputs (`input-rec-section-label`, `input-rec-section-subtext`, `checkbox-sec-rec-vis`) to `admin.html`.

---

## [2.0.0] — 2026-09-02

> Branch: `Worked-from-office` — Full end-to-end QA audit and bug-fix pass.

### Fixed

- **BUG-01**: Fixed inverted `toggleRecommendationVisible()` logic in `js/admin.js`.
- **BUG-02**: Renamed `#awards-container` to `#about-awards-container` on `about.html` and updated `renderAwards()` in `js/render.js` to render to both containers.
- **BUG-03**: Added null guards to `openModal()` in `js/admin.js` to prevent `TypeError` crashes.
- **BUG-05**: Added missing "Articles" navigation link to `about.html`.
- **BUG-06**: Added `id="home-section-label"` to `index.html` hero section label span for CMS dynamic binding.
- **BUG-09**: Replaced `window.location.href = mailto:` with temporary anchor click in `js/main.js` to prevent page navigation.
- **BUG-10**: Updated `<title>` binding logic in `js/render.js` to work with any CMS profile name.
- **BUG-11**: Fixed no-op `renderSEO()` title logic to properly update `document.title`.
- **BUG-14**: Added `portfolioDataChanged` listener in `admin.js` to refresh stale `data` reference.
- **BUG-15**: Added `<meta name="robots" content="noindex, nofollow" />` to `admin.html`.
- **BUG-17**: Reset admin password input type to `password` on logout in `js/admin.js`.
- **BUG-18**: Removed broken inline `onsubmit` from `admin.html` login form.
- **BUG-20**: Replaced deprecated `unescape()` with `TextEncoder` in `js/store.js` SHA-256 fallback.

---

## [1.9.0] — 2026-08-28

> Branch: `feature/recommendations-fix-and-linkedin-scripts` (based on `Worked-from-office`)

### Fixed

#### `js/admin.js` — CSV Import Not Persisting Recommendations
- **Root cause**: `handleCSVImport()` updated the in-memory `data.recommendations` array and
  refreshed the admin UI list, but never called `PortfolioStore.saveData()`. When the admin
  session ended, all imported recommendations were silently lost — they existed only in JS heap
  memory for the duration of that browser tab.
- **Fix**: Added `window.PortfolioStore.saveData(data)` call immediately after the import loop
  completes. The toast message now confirms whether the save was server-synced (`— Saved!`) or
  local-only (`— Saved locally.`), giving clear feedback based on the environment.

#### `js/store.js` — Server Fetch Overwriting CMS-Managed localStorage Data
- **Root cause**: `fetchServerData()` fetched `data/portfolio-data.json` (which only had 1
  recommendation — the baseline committed to the repo) and called
  `localStorage.setItem(STORAGE_KEY, JSON.stringify(validated))` unconditionally, completely
  overwriting the richer localStorage state that contained all CMS-imported recommendations.
  Every page load on an HTTP server wiped the user's CMS work back to the JSON snapshot.
- **Fix**: `fetchServerData()` now reads the existing localStorage state before merging server
  data. For CMS-managed arrays (`recommendations`, `metrics`, `expertise`, `awards`, `articles`,
  `experience`, `projects`, `education`, `skills`) it keeps whichever source has **more items**,
  ensuring that CMS additions are never silently discarded by a server fetch.

### Added

#### `fetch-linkedin.ps1`, `fetch-linkedin2.ps1`, `fetch-linkedin3.ps1` — LinkedIn Voyager API Scripts
- PowerShell scripts that authenticate to the LinkedIn Voyager private API using a session
  `li_at` cookie, fetch received recommendations via
  `/voyager/api/identity/profiles/{id}/recommendationsReceived`, and merge the results directly
  into `data/portfolio-data.json` — populating `recommendations[]` without manual data entry.
- Scripts are for local use only and are not deployed to production.

---

## [1.8.0] — 2026-08-27

### Fixed (merged from `admin-login` branch — authored by @pabonsaha)

#### `js/store.js` — SHA-256 Pure-JS Implementation Rewrite
- **Root cause**: The original `jsSha256()` implementation used a lazy prime-sieve initialization
  pattern (`jsSha256.h`, `jsSha256.k` as mutable static properties on the function object) that
  caused the internal hash state to bleed across multiple calls in the same session. After the
  first successful login attempt, the constants array was permanently mutated, producing incorrect
  digests on all subsequent hash operations — making password changes and re-logins silently fail.
- **Fix**: Replaced the stateful sieve-based SHA-256 with a clean, stateless implementation that
  uses hardcoded round constants (`K[]`) and initial hash values (`H[]`). Key improvements:
  - Constants `K[64]` and initial hash registers `H[8]` are now defined inline as local `const`
    arrays within each function call — no shared mutable state between invocations.
  - Input string pre-processing now routes through `unescape(encodeURIComponent(str))` to correctly
    handle UTF-8 multi-byte characters (e.g. passwords containing non-ASCII characters, accented
    letters, emoji) before byte-packing into the message schedule.
  - Message schedule expansion (`W[64]`) is allocated with `new Array(64)` and filled cleanly per
    block, eliminating the `words.slice()` copy pattern that caused off-by-one errors.
  - Compression round uses named register variables (`a, b, c, d, e, f, g, h`) instead of
    destructuring array mutation — substantially easier to audit and verify for correctness.
  - Output hex encoding simplified: uses `(H[i] >>> 0).toString(16)` padded to 8 hex chars via
    `('00000000' + hex).slice(-8)`, replacing the previous double-loop with potential endianness issues.
  - Function parameter renamed from `ascii` to `str` to accurately reflect that UTF-8 strings are accepted.

#### `js/admin.js` — Missing Closing Brace Bug
- **Root cause**: A missing `}` closing brace in the metrics gather block (around line 1452) caused
  the JavaScript parser to silently swallow the entire Navigation & Header gather section into the
  metrics `forEach` callback scope. This meant `data.navigation`, `data.sections`, and all subsequent
  fields were never collected when saving from the admin panel, causing partial saves and data loss
  for nav/section configuration.
- **Fix**: Inserted the missing closing brace `}` to correctly terminate the `forEach` callback,
  restoring proper execution scope for all subsequent data-gather steps.

#### `admin.html` — Login Form Submit Hardening
- **Root cause**: The "Unlock Dashboard" button used `type="button"` with an inline `onclick`
  attribute (`window.PortfolioAdmin?.handleLogin()`). If `PortfolioAdmin` was not yet initialized
  at the moment of the click (e.g. slow device, script still executing), the optional-chain silently
  no-opped and nothing happened — locking the user out with no error feedback.
  The password visibility toggle button similarly relied on `window.PortfolioAdmin?.togglePasswordVisibility()`
  inline, creating the same fragility.
- **Fix**:
  - Changed the unlock button from `type="button"` to `type="submit"` and removed the inline
    `onclick` attribute. The form's `onsubmit` handler (`window.PortfolioAdmin?.handleLogin()`)
    was already present and correctly connected — making it the single, reliable trigger.
  - Removed the inline `onclick` from the password visibility toggle button; the handler is now
    registered programmatically inside `admin.js` after `PortfolioAdmin` is fully initialized,
    guaranteeing the function reference always exists before it can be invoked.

---

## [1.7.0] — 2026-08-25

### Refactored & Enhanced
- **Modernized CMS Admin Dashboard (`admin.html`, `css/admin.css`, `js/admin.js`)**:
  - **Decluttered Obsidian Design**: Transitioned to a deep obsidian palette (`#070709` body, `#111117` cards, `#15151E` inputs) with subtle borders and clean typography matching the main portfolio aesthetic.
  - **Categorized Sidebar Navigation**: Organized the 9 flat sidebar tabs into structured categories (*Core Content*, *Highlights & Skills*, *Settings*) with modern active pill states and subtle icon alignment.
  - **Noise & Emoji Elimination**: Removed noisy emojis and repetitive subheaders across all card headers and forms.
  - **2x2 Consolidated Skills Grid**: Combined 4 stacked full-width skill cards into a responsive 2-column grid to maximize screen real estate and reduce scrolling.
  - **Refined Metrics & Form Controls**: Redesigned metric tiles with consistent input padding, subtle borders, and smooth focus glow rings.

---

## [1.6.0] — 2026-08-25

### Refactored & Enhanced
- **Data Layer & Store Resilience (`js/store.js`)**:
  - Implemented deep schema fallback merging to guarantee all objects and arrays exist safely even if localStorage is empty or corrupted.
  - Added JSON schema validation for backup imports and robust error handling.
- **Component Architecture (`js/render.js`)**:
  - Modularized the monolithic renderer into focused, single-responsibility functions (`renderHero`, `renderMetrics`, `renderExpertise`, `renderAwards`, `renderArticles`, `renderExperience`, `renderProjects`, `renderAboutPage`, `renderContactAndFooter`).
  - Improved Article Reader modal with keyboard focus trapping, `Escape` key close listener, and accessible `aria-modal` dialog attributes.
  - Upgraded HTML sanitization helper for improved XSS protection.
- **Performance & Canvas Optimization (`js/main.js`)**:
  - Added Retina / HiDPI `devicePixelRatio` scaling for razor-sharp canvas rendering across 4K and high-density mobile screens.
  - Added Tab Visibility Lifecycle (`document.hidden` / `visibilitychange`) to pause `requestAnimationFrame` when the user leaves the tab, reducing battery and GPU usage.
  - Debounced window resize event listeners.
- **Design System & Accessibility (`css/style.css`)**:
  - Tokenized z-index layers (`--z-canvas`, `--z-base`, `--z-grain`, `--z-nav`, `--z-drawer`, `--z-modal`, `--z-toast`) to eliminate magic numbers.
  - Added universal `@media (prefers-reduced-motion: reduce)` accessibility overrides for all animations and transitions.
- **Code Hygiene & HTML Standards**:
  - Replaced outdated `javascript:void(0)` links with clean semantic hrefs.
  - Added `id="nav-links"` and `aria-controls` across all navigation headers.
  - Upgraded repository `README.md` and cleaned up temporary archive artifacts.

---

## [1.5.0] — 2026-08-25

### Added
- **Dynamic Theme-Adaptive Canvas Background**:
  - **Dark Mode**: Enhanced meteor shower visibility with increased base opacity (`0.18` to `0.45`), glowing multi-stop gradients, and thicker line trails for improved contrast on all displays.
  - **Light Mode**: Replaced meteors with an elegant, minimalist **flock of flying birds** that flap wings dynamically (using a sine-wave phase offsets) and slide across the sky slowly to convey a peaceful daytime aesthetic.
- **Global Typography Selector** in the CMS panel (Identity & Hero Details).
  - Supports 4 curated modern font configurations:
    1. **Geometric Tech**: Space Grotesk + DM Sans (Default)
    2. **Sleek Minimalist**: Outfit + Inter
    3. **Warm & Elegant**: Playfair Display + Plus Jakarta Sans
    4. **Bold Editorial**: Syne + Manrope
  - Embedded CSS overrides using custom properties dynamically active when `:root[data-font-pair="..."]` is loaded.
  - Linked preconnect and Google Fonts import rules in the heads of all HTML pages.
  - Custom FOUC script updated to read the saved font selector from storage instantly to prevent layout shift.

### Fixed
- **Typewriter layout jumps**: Added `min-height: 1.5rem;` to the `.hero-role` wrapper in `css/style.css` to prevent layout collapse and jumps during dynamic text transitions.
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
