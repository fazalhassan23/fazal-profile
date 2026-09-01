# Changelog

All notable changes to **fazal-profile** are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [2.0.0] — 2026-09-02

> Branch: `Worked-from-office` — Full end-to-end QA audit and bug-fix pass.

### Fixed

#### `js/admin.js` — Recommendation Visibility Toggle Always Set to Visible (Critical)
- **Root cause**: `toggleRecommendationVisible()` used `list[idx].visible = list[idx].visible !== false`. Since `!== false` evaluates to `true` when `.visible` is already `true`, clicking "Hide" was a no-op — no recommendation could ever be hidden from the live site.
- **Fix**: Corrected to `list[idx].visible = list[idx].visible === false`, properly flipping the boolean (`true → false` to hide, `false → true` to show).

#### `js/admin.js` — `openModal()` Crashes with TypeError on Null Elements (Critical)
- **Root cause**: `openModal()` directly accessed `modalTitle.textContent` and `modalBody.innerHTML` without null-checking. If any modal DOM element was absent, every CRUD operation (edit award, project, experience, article) threw `TypeError: Cannot set properties of null`.
- **Fix**: Added a null-guard at the top of `openModal()` that logs a descriptive console error and returns early if the required elements are missing.

#### `js/admin.js` — Admin `data` Variable Stale After Server Sync (Medium)
- **Root cause**: `data` was read once from `PortfolioStore.getData()` at admin initialization. If `fetchServerData()` resolved later and dispatched `portfolioDataChanged`, the admin's in-memory `data` stayed stale, causing subsequent saves to overwrite newer server-synced content.
- **Fix**: Added a `portfolioDataChanged` window event listener inside `initAdminApp()` that refreshes `data = window.PortfolioStore.getData()` and calls `populateAll()` if the dashboard is already unlocked.

#### `js/admin.js` — `importJSON` Not Awaited; Local `data` Not Refreshed Post-Import (Medium)
- **Root cause**: The backup restore handler called `window.PortfolioStore.importJSON()` without `await` and did not update the local `data` reference, leaving the admin's state stale after a successful import.
- **Fix**: Made the `reader.onload` callback `async`, properly awaits the import call, and updates `data = res.data` before calling `populateAll()`.

#### `js/admin.js` — Password Input Stays Visible as Plain Text After Logout (Minor)
- **Root cause**: If a user toggled the password to visible (`type="text"`) before logging in, `lockDashboard()` cleared the value but left `type="text"` intact. The lock screen then re-appeared with an exposed plain-text password field.
- **Fix**: `lockDashboard()` now resets `inputAdminPassword.setAttribute('type', 'password')` and restores the toggle icon to `👁️`.

#### `admin.html` — Broken Inline `onsubmit` on Login Form (Minor)
- **Root cause**: `<form id="lock-form">` had an inline `onsubmit` calling `window.PortfolioAdmin?.handleLogin()`. This global is only assigned inside `initAdminApp()`, which runs asynchronously. On fast devices this could fire before `PortfolioAdmin` was defined — silently no-opping.
- **Fix**: Removed the inline `onsubmit` attribute entirely. The `lockForm.addEventListener('submit', ...)` and `btnUnlockCms.addEventListener('click', ...)` listeners in `admin.js` are the single, reliable handlers.

#### `admin.html` — Admin Panel Indexable by Search Engines (Medium)
- **Root cause**: No `<meta name="robots">` directive existed on `admin.html`, leaving the private CMS panel potentially crawlable and indexable.
- **Fix**: Added `<meta name="robots" content="noindex, nofollow" />` to `<head>`.

#### `js/render.js` — Awards Never Rendered on `about.html` Due to Duplicate ID (Major)
- **Root cause**: `renderAwards()` looked up only `#awards-container`. `about.html` used the same ID, creating a duplicate-ID conflict — a browser only matches the first occurrence in a document, so the about-page grid was always empty.
- **Fix**: Renamed `about.html`'s container to `#about-awards-container`. Updated `renderAwards()` to populate both `#awards-container` (home page) and `#about-awards-container` (about page) from the same data.

#### `js/render.js` — Hero Section Label Not Updatable via CMS (Major)
- **Root cause**: `renderSectionHeadersAndVisibility()` called `document.getElementById('home-section-label')`, but the hero `<span class="section-label">` in `index.html` had no `id`. The lookup returned `null` on every render.
- **Fix**: Added `id="home-section-label"` to the hero section label `<span>` in `index.html`.

#### `js/render.js` — `renderIdentityAndTheme()` Title Update Broke After CMS Name Change (Medium)
- **Root cause**: The `<title>` update was gated on `parts[0].trim() === 'Fazal Mahmud Hassan'` — the hardcoded original name. After a CMS name update the condition never matched and the title was permanently stale.
- **Fix**: Replaced the rigid string match with a simple `if (document.title.includes('—') && p.name && p.roleTitle)` check that applies to any configured name.

#### `js/render.js` — `renderSEO()` `siteTitle` Block Was a Dead No-Op (Medium)
- **Root cause**: The `siteTitle` handling in `renderSEO()` contained an `if` block whose body was a nested `if` with no code inside — it computed a condition but never executed any statements. The SEO-configured site title was therefore never written to `document.title`.
- **Fix**: Replaced the no-op block with code that properly sets `document.title` to `${pagePrefix} — ${seo.siteTitle}`, preserving the page-specific prefix.

#### `js/main.js` — Contact Form `mailto:` Navigated Away from Page (Major)
- **Root cause**: Form submission set `window.location.href = mailtoUri`. On systems without a registered mail client this navigated the page away entirely, losing the success message and preventing the form-reset/button-re-enable code from executing.
- **Fix**: Replaced `window.location.href` with a dynamically created hidden `<a>` element that is programmatically `.click()`-ed then immediately removed from the DOM. The mail client is triggered without any page navigation.

#### `about.html` — Missing "Articles" Navigation Link (Major)
- **Root cause**: The `<nav>` in `about.html` had only 4 links (Home, About, Projects, Contact), omitting the Articles link present in `index.html`. Users arriving on the About page had no in-nav path to the Articles section.
- **Fix**: Added `<li><a href="index.html#articles">Articles</a></li>` to `about.html`'s navigation list.

#### `js/store.js` — SHA-256 Fallback Used Deprecated `unescape()` (Minor)
- **Root cause**: `jsSha256()` used `unescape(encodeURIComponent(str))` to produce a UTF-8 byte sequence. `unescape()` is a deprecated, non-standard global removed from strict mode in some environments.
- **Fix**: Replaced with `new TextEncoder().encode(str)`, returning a `Uint8Array` iterated directly for byte-packing — consistent with the Web Crypto path already present in the same file.

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
