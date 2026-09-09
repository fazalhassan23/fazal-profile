# Changelog

All notable changes to **fazal-profile** are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [2.4.2] — 2026-09-09

> Branch: `cv` — Executive Typography System & Global CMS Font Switcher.

### Added

#### Executive Typography & Human Font Pair System
- **Modern Executive Default**: Replaced generic AI-style fonts (`Space Grotesk` / `DM Sans`) with **`Plus Jakarta Sans`** (Display headers) + **`Inter`** (Body text) across the portfolio for a crisp, executive leadership aesthetic (Vercel/Stripe design standard).
- **Expanded Font Themes**: Added 5 premium human typography options accessible directly in CMS:
  - ✨ `Modern Executive` (`Plus Jakarta Sans` / `Inter`)
  - ⚡ `Clean Tech Sans` (`Outfit` / `Plus Jakarta Sans`)
  - 📚 `Academic & Research` (`Lora Serif` / `Inter`)
  - 🎨 `Distinctive Humanist` (`Bricolage Grotesque` / `Plus Jakarta Sans`)
  - 🏢 `Precision Minimalist` (`Inter Tight` / `Inter`)
- **Global CMS Selector**: Updated Admin CMS (`admin.html`) under **Profile & Bio** → **Global Typography Theme** to switch the site-wide font pair instantly on save.

---

## [2.4.1] — 2026-09-09

> Branch: `cv` / `main` — Contact Form Spam & Automated Lorem Ipsum Protection.

### Added

#### Contact Form Anti-Spam & Autofill Protection
- **Autofill Prevention**: Added `autocomplete="off"`, `data-lpignore="true"`, and `data-1p-ignore="true"` to form inputs in [`index.html`](file:///c:/Users/Fazal%20Mahmud%20Hassan/.gemini/antigravity/scratch/fazal-portfolio/index.html) to prevent browser extensions and password managers from populating test data / autofill strings into form fields.
- **Web3Forms Honeypot**: Embedded a hidden `botcheck` input field (`style="display: none !important;"`) inside the contact form. Automated bots that fill hidden form fields trigger silent execution dropping.
- **Lorem Ipsum Filler Filter**: Enhanced submission validation in [`js/main.js`](file:///c:/Users/Fazal%20Mahmud%20Hassan/.gemini/antigravity/scratch/fazal-portfolio/js/main.js) with regex filtering (`/lorem\s+ipsum|dolor\s+sit\s+amet|consectetur\s+adipiscing|sit\s+amet|lipsum/i`). Submissions containing generic placeholder text are blocked before calling the API.

---

## [2.4.0] — 2026-09-09

> Branch: `cv` / `main` — Automated LinkedIn Recommendations Display Photo Sync & Compact Card Redesign.

### Added

#### Automated LinkedIn Avatar Sync & Local Storage
- **CDP Automated Browser Scraper**: Created [`scripts/cdp_autoscrape_and_download.py`](file:///c:/Users/Fazal%20Mahmud%20Hassan/.gemini/antigravity/scratch/fazal-portfolio/scripts/cdp_autoscrape_and_download.py) using Chrome DevTools Protocol (`port 9222`) to connect directly to the active Brave browser session, scroll lazy-loaded components, and extract public profile links and avatar images for all 27 recommenders.
- **Local Asset Storage**: Downloaded all 27 high-resolution display photos locally into [`assets/testimonials/`](file:///c:/Users/Fazal%20Mahmud%20Hassan/.gemini/antigravity/scratch/fazal-portfolio/assets/testimonials) (`assets/testimonials/<author-slug>.jpg`), eliminating CDN URL expirations and HTTP 403 hotlinking restrictions.
- **Database & Fallback Sync**: Updated [`data/portfolio-data.json`](file:///c:/Users/Fazal%20Mahmud%20Hassan/.gemini/antigravity/scratch/fazal-portfolio/data/portfolio-data.json) and [`data/default-data.js`](file:///c:/Users/Fazal%20Mahmud%20Hassan/.gemini/antigravity/scratch/fazal-portfolio/data/default-data.js) to link all 27 entries to their local avatar paths and LinkedIn profile URLs (`https://linkedin.com/in/...`).
- **Zero Credentials / Tokens**: Implemented in-memory execution and DevTools DOM extraction, ensuring zero cookies, tokens, or sensitive data are ever saved to disk or git history.

### Changed

#### Compact Recommendation Card Redesign
- **Top Dead Space Elimination**: Fixed CSS cascade conflict where `.recommendation-card > *` set `position: relative; z-index: 2`, overriding `position: absolute` on the quote/source icon and creating a 64px+ dead vertical block at the top of cards.
- **Absolute Source Badge**: Pinned `.rec-source-badge` to top-right (`position: absolute !important; top: 1.1rem; right: 1.15rem; z-index: 3`), taking 0px of vertical height flow and illuminating in accent color on card hover.
- **Flex Flow Optimization**: Replaced `justify-content: space-between` with natural vertical flow (`justify-content: flex-start; gap: 0.65rem`) to eliminate vertical stretching between elements when cards have varying text lengths.
- **Streamlined Padding & Dividers**: Reduced card padding from `2rem 1.75rem` down to `1.35rem 1.4rem 1.25rem` and replaced the empty double-bordered spacer bar with a clean single-line meta divider.

---

## [2.3.3] — 2026-09-08

> Branch: `main` — Fix Newly Added Job Experience Not Displaying at Top of Frontend & Cache Priority.

### Fixed

#### Job Experience Chronological Timeline Ordering
- **Reverse Chronological Placement**: Fixed `js/admin.js` to insert newly added job positions at the top of the `data.experience` array (`unshift`) rather than appending to the end (`push`).
- **Guaranteed Current Role Prioritization**: Enhanced `renderExperience()` in `js/render.js` to sort items so that positions marked with `isCurrent: true` always appear first at the top of both `#home-experience-container` and `#full-experience-container`.
- **Top Position Updated**: Positioned `"Senior Technical Project Manager"` at Mediusware Limited (`job-1788807858515`) at index 0 of `data/portfolio-data.json` and `data/default-data.js`.

#### Client Cache & Server Data Synchronization
- **Sanitized Server Payload**: Refined `saveData()` in `js/store.js` to strip the internal transient `_hasLocalChanges` flag before writing to disk or syncing to GitHub, preventing the production JSON file from permanently locking browser caches into stale states.
- **Frontend Live Data Priority**: Updated `fetchServerData()` in `js/store.js` so that public visitor pages (`index.html`, `about.html`, `projects.html`) always prioritize fresh server data whenever `serverTime >= localTime`, eliminating stale `localStorage` lockouts.

---

## [2.3.2] — 2026-09-08

> Branch: `main` — Fix CMS Edit and Delete Action Buttons Across All Content Managers.

### Fixed

#### CMS List Actions & Event Delegation
- **Dynamic Index Restoration**: Fixed broken `data-arg0` attributes across all 10 CMS list managers in `js/admin.js` (Experience, Projects, Education, Awards, Articles, Navigation, Footer Links, Footer Socials, Recommendations, Skills). An earlier script had replaced template literal indexes with the literal string `"arg"`, causing `undefined` item lookups and unhandled runtime exceptions on click.
- **Robust Event Delegation**: Enhanced the global click handler in `js/admin.js` using `btn.hasAttribute('data-argX')` so index `0`, negative directional offsets (`-1`, `1`), and string category arguments are reliably parsed and dispatched to modal editor and deletion functions.

---

## [2.3.1] — 2026-09-08

> Branch: `main` — CMS Admin Panel Persistence, Local Dev Server Flat-File Save API, and Production Data Isolation.

### Added

#### Local Development Flat-File Persistence Server (`server.py`)
- **Zero-Dependency Python Dev Server**: Added `server.py` using standard library `http.server.ThreadingHTTPServer` to serve static assets with no-cache headers and handle atomic `POST /api/save` and `POST /data/portfolio-data.json` requests.
- **Direct Disk Persistence**: Saves made in `/admin.html` on `localhost` now write directly to `data/portfolio-data.json` on disk, allowing full offline CMS functionality without requiring a GitHub PAT.

#### Local Draft & State Protection (`_hasLocalChanges`)
- **Unsynced Draft Guard**: Added `_hasLocalChanges` tracking in `js/store.js`. When changes are saved locally in the browser, neither `getData()` nor `fetchServerData()` will overwrite them with stale server or fallback default data.
- **Clock Skew Sanity Check**: Replaced inclusive `>=` checks with strict `>` comparisons and added sanity validation (`timestamp <= Date.now() + 60000`) so future-dated files cannot clobber local user drafts.

### Fixed

#### Admin Panel Refresh Data Loss
- **Future Timestamp Resolution**: Fixed `_savedAt` in `data/default-data.js` and `data/portfolio-data.json` from a future timestamp to a valid past timestamp, preventing immediate cache clobbering on page reload.
- **Admin UI Feedback**: Updated save toasts in `js/admin.js` to accurately indicate whether data was persisted directly to disk, committed to GitHub, or stored in browser storage.

### Governance & Workflow

#### Production Data Isolation Policy
- **Live JSON Protection**: Established repository rule that live/remote `data/portfolio-data.json` is the sole source of truth for production content. Local development/test JSON must never overwrite live data during merges to `main`.
- **Mandatory Documentation on Merge**: Established rule that `CHANGELOG.md` and `README.md` must be updated on every merge to `main`.

---

## [2.3.0] — 2026-09-07

> Branch: `cv` → Merged into `main` (Production) — Complete CV synchronization, full experience timeline, serverless background contact delivery, and recommendations pagination transitions.

### Added

#### Serverless Background Contact Form (Web3Forms)
- **Direct Inbox AJAX Delivery**: Integrated Web3Forms background API (`https://api.web3forms.com/submit`) into `js/main.js` for zero-redirect asynchronous contact submissions with real-time status feedback and automatic form resets.
- **Admin CMS Configuration**: Added a dedicated "Web3Forms Access Key" input field under Contact Form Settings in `admin.html` and wired persistence in `js/admin.js`.
- **Multi-Tier Fallback Hierarchy**: Embedded active access key in `data/portfolio-data.json`, `data/default-data.js`, and as a hidden DOM input in `index.html`, with a graceful fallback to `mailto:` if network submission fails.

#### Endorsements / Recommendations Pagination Transitions
- **GPU-Accelerated Keyframes**: Added CSS `@keyframes` slide-fade animations (`recSlideOutLeft`, `recSlideInRight`, `recSlideOutRight`, `recSlideInLeft`) in `css/style.css` for directional page transitions.
- **Animated Controller**: Refactored `initRecommendationsPagination()` in `js/render.js` to animate page transitions with debouncing to prevent rapid-click stutter, with automatic bypass under `prefers-reduced-motion`.

#### Production Backup & Safety Tag
- **Git Branch & Tag**: Created backup branch `main-backup-20260907` and annotated tag `backup-main-20260907` before merging CV updates to production.

### Changed

#### Experience Section — Full History on Homepage
- **All 6 Career Entries Directly on Homepage**: Removed the 3-item slice constraint in `js/render.js` so that all 6 professional positions (all 34 verbatim bullets from the CV) render directly on the homepage timeline in reverse chronological order:
  1. Lead Technical Project Manager / Project Manager — Mediusware Limited (Feb 2024 – Present)
  2. Product & Project Manager — Microters Ltd. (Aug 2023 – Jan 2024)
  3. Associate Project Manager / Scrum Master — DevsNest LLC (Jul 2022 – Aug 2023)
  4. Business Analyst / Junior Project Manager — Softzino Technologies (Oct 2021 – Jun 2022)
  5. IT Project Coordinator (Contract) — NextGen Innovations (Jan 2020 – Sep 2021)
  6. Junior Software Engineer / QA Analyst — CloudTech Solutions (Jan 2019 – Dec 2019)
- **Removed Redundant CTA**: Removed `#experience-section-cta` ("Full history →") since all positions are displayed on the main page.

#### Content & Schema Synchronization (Strict Non-Negotiable CV Alignment)
- **Zero Imagined Content**: Fully synchronized `data/portfolio-data.json` and `data/default-data.js` against the official uploaded resume.
- **Metrics**: Aligned to verified facts: 6+ Years Cross-Functional Leadership, 21+ Enterprise Deliverables, 95% On-Time Delivery Rate, 1.2M+ Users Impacted.
- **Education**: 4 entries (BRAC University B.Sc. CSE, University of Dhaka MBA, Notre Dame College HSC, Motijheel Model SSC).
- **Projects**: Cleaned to 9 academic and software projects (removed non-CV projects like eSports, Rantages, Poromporai Amra).
- **Skills & References**: Updated technical, professional, creative, language categories, and 2 professional references.

### Fixed

#### Contact Section UX
- **Duplicate Intro Text**: Removed redundant `#contact-intro` element that previously displayed the same text as `#contact-text`.

#### Store & Cache Synchronization
- **LocalStorage Priority**: Updated `js/store.js` merge logic so that newer database schema defaults (`_savedAt`) automatically update older browser `localStorage` caches.
- **Asset Cache Busting**: Updated cache-busting query strings across all HTML files to ensure immediate asset updates in visitor browsers.

---

## [2.2.2] — 2026-09-03

> Branch: `Staging` — Comprehensive CMS synchronization and UX fixes.

### Fixed

#### CMS Data Synchronization & Rendering
- **Single Source of Truth**: Fixed an issue where the "First Name" field did not update the frontend logo by removing the redundant "Logo Brand Text" input from `admin.html` and updating the fallback logic in `js/render.js`.
- **GitHub PAT Saving UX**: Added an opportunistic save check to the global "Save & Publish Changes" button so the GitHub Personal Access Token is saved even if the user forgets to click the inner "Save Token" button.
- **Missing DOM Bindings**: Restored several missing DOM element IDs across `admin.html` and `index.html` that were preventing the CMS (`js/admin.js`) from binding correctly to the frontend (`js/render.js`).

---

## [2.2.1] — 2026-09-02

> Branch: `Worked-from-office` — Cleaned up Recognition / Award card design system.

### Changed

#### `js/render.js` + `css/style.css` — Removed Trophy Icon & Yellow Accent Border
- **Removed**: Trophy emoji (`🏆`) icon container (`.award-icon-box`) from `renderAwards()` HTML generator.
- **Removed**: Yellow gold left border accent (`border-left: 2px solid var(--gold)`) from `.award-card` and `.award-card:hover`.
- **Layout**: Updated `.award-card` to a clean single-column flex layout for a sleek, minimal obsidian presentation matching the site design system.

---

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

## [1.11.0] — 2026-09-01

### Added
- **GitHub Pages Deployment**: Added `.github/workflows/deploy.yml` for automated deployment to GitHub Pages.
- **GitHub Contents API Integration**: CMS now saves data directly to the GitHub repository using the GitHub REST API (`PUT /repos/{owner}/{repo}/contents/{path}`), replacing the old PHP/FTP backend.
- **Admin Panel Enhancements**:
  - Added a "GitHub Sync Token" configuration card in `admin.html` allowing the user to input a fine-grained Personal Access Token.
  - Added a "Test Token" button to verify GitHub API connectivity and permissions directly from the CMS.
- **Custom Domain Setup**: Added `CNAME` file for `fazalmahmudhassan.com` redirection on GitHub Pages.

### Security
- **Data Sanitization**: Scrubbed all sensitive data (LinkedIn API cookies, default password hashes) from the repository.
- **History Wipe**: Rewrote Git commit history via `git-filter-repo` to permanently remove old sensitive credentials before transitioning the repository to public.
- **Default Credentials**: Changed the baseline default CMS password to `admin`.

### Removed
- **PHP Backend (`api/save.php`)**: Removed the legacy FTP/PHP server-side saving mechanism as Namecheap hosting is no longer used.

---

## [1.10.0] — 2026-09-01

### Added
- **CMS Section Visibility Toggles**: Added the ability to toggle the visibility of the "Recommendations / Endorsements" section directly from the admin panel (`admin.html`), syncing with the frontend renderer.

### Changed
- **Recommendation Cards UI**:
  - Replaced the generic large quotation mark icon with a LinkedIn logo to clearly indicate the source of the endorsements.
  - Aligned the recommendation date to the right side of the card.
  - Removed redundant generic text ("LinkedIn recommendation received") to clean up the card UI.

### Refactored & Enhanced
- **Codebase Audit & Technical Debt Cleanup**:
  - **Deduplication**: Extracted `escapeHtml` and LinkedIn SVG paths into a new shared `js/utils.js` file to eliminate duplicated code in `render.js` and `admin.js`.
  - **Event Delegation**: Replaced inline `onclick` handlers across all CMS CRUD lists (Awards, Articles, Experience, etc.) in `admin.js` with a secure `data-action` event delegation pattern.
  - **Data-Driven Logic**: The contact form's `mailto:` success link and handler in `main.js` now dynamically read the owner's email from the CMS (`data.profile.email`) instead of being hardcoded.
  - **Separation of Concerns**: Extracted inline CSS strings (`style="..."`) inside `render.js` HTML templates to dedicated classes in `css/style.css`.
  - **Code Hygiene**: Removed magic numbers in `main.js`, fixed silent `catch` blocks in `store.js`, and renamed the misleading `printCV()` function to `openAboutPage()`.

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
