# Fazal Mahmud Hassan — Personal Portfolio & CMS

> A zero-dependency, production-grade personal portfolio built entirely on **Vanilla HTML5, modern CSS, and plain JavaScript** — no frameworks, no bundlers, no build steps. Includes a fully client-side Content Management System (CMS) with SHA-256 authentication, a custom WYSIWYG rich-text editor, a dual-mode animated canvas background, and an optional PHP flat-file persistence API.

**Current Version**: `v2.3.2` | **License**: MIT

---

## Table of Contents

1. [Overview & Philosophy](#1-overview--philosophy)
2. [Feature Highlights](#2-feature-highlights)
3. [Repository Structure](#3-repository-structure)
4. [Architecture Deep-Dive](#4-architecture-deep-dive)
   - [Data Layer — store.js](#data-layer--storejs)
   - [Renderer Engine — render.js](#renderer-engine--renderjs)
   - [Core Interactions — main.js](#core-interactions--mainjs)
   - [Admin CMS — admin.js](#admin-cms--adminjs)
5. [CSS Design System — style.css](#5-css-design-system--stylecss)
6. [Data Schema — default-data.js](#6-data-schema--default-datajs)
7. [Server Persistence API — GitHub API](#7-server-persistence-api---github-api)
8. [Authentication & Security Model](#8-authentication--security-model)
9. [Canvas Ambient Background System](#9-canvas-ambient-background-system)
10. [Typewriter Engine](#10-typewriter-engine)
11. [Theme & Font System](#11-theme--font-system)
12. [SEO & Metadata](#12-seo--metadata)
13. [CI/CD & Deployment](#13-cicd--deployment)
14. [Local Development](#14-local-development)
15. [CMS Admin Access](#15-cms-admin-access)
16. [Versioning & Changelog](#16-versioning--changelog)
17. [Branch History](#17-branch-history)

---

## 1. Overview & Philosophy

This portfolio was built around three principles:

1. **Zero runtime dependencies.** No React, no Vue, no build pipeline, no npm. The entire site is plain HTML/CSS/JS that runs straight from any static file server — or even a `file://` path locally.
2. **Self-contained CMS.** All content is editable through a password-protected admin panel at `/admin.html`. Data is stored in `localStorage`, synced to a flat JSON file on the server via the GitHub API, and merged against a hardcoded default schema on every read.
3. **Progressive enhancement.** Every page renders meaningfully with the default seed data baked into `data/default-data.js`. The `PortfolioStore` enriches it with any live edits — and gracefully falls back to defaults on any error.

---

## 2. Feature Highlights

| Category | Feature |
|---|---|
| **Visual** | AMOLED True Black (`#000000`) base with CSS film-grain noise overlay |
| **Visual** | Dual-mode animated canvas: meteor shower (dark) / flying birds (light) |
| **Visual** | HiDPI / Retina-aware canvas scaling via `devicePixelRatio` |
| **Visual** | Battery & GPU saver — canvas pauses when tab is hidden (`visibilitychange`) |
| **Visual** | Scroll-driven `IntersectionObserver` fade-up animations |
| **Visual** | Animated metric counters (count up on scroll-into-view) |
| **Animations** | Directional GPU-accelerated CSS `@keyframes` slide-fade transitions for paginated recommendations |
| **Experience** | Full reverse-chronological career timeline (all 6 positions, 34 verbatim bullets) directly on homepage |
| **Contact** | Serverless background email delivery via Web3Forms AJAX with inline feedback and mailto fallback |
| **Theme** | Dark / Light mode toggle with zero-FOUC instant restore |
| **Theme** | 4 selectable global font pairings via CMS |
| **CMS** | Password-protected `/admin.html` panel with SHA-256 hashed auth |
| **CMS** | Custom built-in WYSIWYG Rich Text Editor (RTE) with HTML source toggle |
| **CMS** | Full CRUD for Profile, Metrics, Expertise, Awards, Articles, Experience, Projects, Education, Skills |
| **CMS** | Web3Forms Access Key configuration directly manageable in Admin CMS |
| **CMS** | LinkedIn CSV import for Recommendations with auto-deduplication and immediate persistence |
| **CMS** | One-click JSON backup export and import with schema validation |
| **CMS** | Resilient `localStorage` + GitHub Contents API syncing (smart merge: localStorage wins for CMS arrays, server wins for timestamps) |
| **Icons** | Phosphor Icons (CDN) |
| **Fonts** | Space Grotesk (Hero), DM Sans (Body), JetBrains Mono (Code) |
| **Deploy** | GitHub Pages with GitHub Actions deploy |
| **a11y** | `aria-modal`, `aria-expanded`, `aria-label`, keyboard focus trapping |
| **a11y** | `@media (prefers-reduced-motion: reduce)` global animation overrides |

---

## 3. Repository Structure

```
fazal-portfolio/
|
+-- index.html               # Main portfolio view
+-- about.html               # Extended CV / Bio page
+-- projects.html            # Extended projects directory
+-- admin.html               # Password-protected CMS dashboard
+-- 404.html                 # Custom branded error page
|
+-- css/
|   +-- style.css            # Main design system
|   +-- admin.css            # Admin dashboard styles
|
+-- js/
|   +-- store.js             # PortfolioStore: data layer, GitHub API sync
|   +-- render.js            # PortfolioApp: DOM renderer
|   +-- main.js              # Core interactions
|   +-- admin.js             # CMS admin controller
|
+-- data/
|   +-- default-data.js      # Master seed schema
|   +-- portfolio-data.json  # Live persisted data (written by GitHub API)
|
+-- .github/
|   +-- workflows/
|       +-- deploy.yml       # GitHub Actions: Static deploy to GitHub Pages
|
+-- sitemap.xml              # Static XML sitemap
+-- robots.txt               # robots.txt with sitemap reference
+-- CHANGELOG.md             # Full version history
```

---

## 4. Architecture Deep-Dive

### Data Layer — store.js

`store.js` exposes a single global singleton `window.PortfolioStore` via an IIFE. It is responsible for all data reads, writes, schema validation, server sync, and authentication.

#### Initialization Flow

```
page load
  |
  +-- data/default-data.js  -> sets window.DEFAULT_PORTFOLIO_DATA (synchronous)
  +-- store.js loaded        -> defines PortfolioStore, calls PortfolioStore.fetchServerData()
  |     +-- fetchServerData():
  |           1. Fetch data/portfolio-data.json?t={timestamp}
  |           2. Read existing localStorage snapshot
  |           3. mergeSchema(defaults, serverData) -> serverMerged
  |           4. Smart merge: for CMS-managed arrays, keep whichever source has MORE items
  |           5. Save combined result to localStorage
  |           6. Dispatch CustomEvent 'portfolioDataChanged'
```

### Renderer Engine — render.js

`render.js` exposes `window.PortfolioApp` via an IIFE. It is the pure DOM rendering layer — it takes data from `PortfolioStore` and writes it to the HTML.

### Core Interactions — main.js

Handles all raw browser event wiring that isn't data-driven. All code runs inside a single `DOMContentLoaded` listener.

### Admin CMS — admin.js

The admin panel is a ~1,750-line self-contained controller. It checks `PortfolioStore.isAuthenticated()` on load and redirects to the password lockscreen if unauthenticated.

---

## 5. CSS Design System — style.css

The stylesheet is a pure CSS custom properties (variables) system. No preprocessor, no utility framework.

---

## 6. Data Schema — default-data.js

The file sets `window.DEFAULT_PORTFOLIO_DATA` — a deeply nested object that serves as the initial seed and fallback schema.

---

## 7. Server Persistence API — Dual Mode (GitHub API & Local Dev Server)

The CMS supports dual-mode flat-file persistence without requiring an external database:

### Mode 1: Production — GitHub Contents API
In production (GitHub Pages), the CMS persists data directly back to the GitHub repository using the GitHub Contents API:
1. **Admin Panel**: User provides a Personal Access Token (PAT) with repository write access in CMS Settings.
2. **File Check**: Retrieves the current SHA commit hash for `data/portfolio-data.json`.
3. **Commit**: Issues a PUT request to the GitHub API, creating a new commit with the updated JSON payload.
4. **Deployment**: The commit triggers the GitHub Actions workflow, rebuilding and deploying the site to GitHub Pages within seconds.

### Mode 2: Local Development — Flat-File Save API (`server.py`)
When running locally on `http://localhost:3000`:
1. **Zero Configuration**: No GitHub PAT is needed for local development.
2. **Atomic Disk Save**: Clicking "Save All Changes" sends a `POST /api/save` request to `server.py`, which atomically writes the JSON directly to `data/portfolio-data.json` on disk.
3. **Unsynced Draft Guard**: Browser `localStorage` tracks `_hasLocalChanges` to guarantee that fresh local edits are never overwritten by stale seed or server files upon page reload.

> [!IMPORTANT]
> **Production Data Isolation Policy**:
> The live/remote `data/portfolio-data.json` in GitHub is the single source of truth for production content (managed live by the owner). Local JSON files used during local testing must **NEVER** overwrite the live `portfolio-data.json` when merging code changes into `main`. When merging feature branches, always preserve or verify the remote production JSON data.

---

## 8. Authentication & Security Model

The admin panel uses a **client-side SHA-256 password hash** model. Session hash lives in `sessionStorage` and is cleared on browser close.

---

## 9. Canvas Ambient Background System

The ambient background is a `<canvas>` element dynamically created by `main.js` and prepended to `<body>` using HiDPI / Retina-aware scaling.

---

## 10. Typewriter Engine

Located in `render.js`, handles text cycling for the hero section with configurable typing/deleting speeds.

---

## 11. Theme & Font System

### Theme Toggle
`localStorage('portfolio_theme')` -> `'dark'` or `'light'`. Applied as `data-theme` on `<html>`.

### Font Pair Selector
4 curated pairings (Space Grotesk, Outfit, Playfair Display, Syne) selectable via CMS.

---

## 12. SEO & Metadata

Each page includes dynamic `<title>`, `<meta name="description">`, and `Open Graph` tags updated by `renderSEO()`.

---

## 13. CI/CD & Deployment

### GitHub Actions — `.github/workflows/deploy.yml`

Automated deployments are handled by GitHub Actions targeting GitHub Pages. The pipeline executes on every push to the `main` branch.

### Pipeline Steps
1. Checkout source code
2. Setup GitHub Pages
3. Upload static artifact
4. Deploy to GitHub Pages environment

---

## 14. Local Development

```bash
# Recommended: Python dev server with flat-file /api/save persistence
python server.py 3000

# Or standard static server (saves will stay in browser localStorage only)
python -m http.server 3000
```

> **Note**: Running `python server.py 3000` enables live flat-file saving. Whenever you click **Save All Changes** in `/admin.html`, updates are saved directly into `data/portfolio-data.json` on disk, allowing seamless offline development without requiring a GitHub PAT.

---

## 15. CMS Admin Access

| Detail | Value |
|---|---|
| URL | `/admin.html` |
| Default Password | `admin` |
| Default Hash (SHA-256) | `8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918` |
| Change Password | From inside the admin panel: Settings -> Password |

> **Warning**: Change the default password immediately on first deployment. The admin panel URL is intentionally not linked from anywhere on the public site.

---

## 16. Versioning & Changelog

This project uses [Semantic Versioning](https://semver.org/) and [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) conventions.

| Version | Date | Summary |
|---|---|---|
| v2.3.2 | 2026-09-08 | **CMS Edit & Delete Action Buttons**: Fixed broken `data-arg0` attributes across all 10 CMS list managers in `js/admin.js` to ensure item indexes are passed to modal editors and deletion handlers |
| v2.3.1 | 2026-09-08 | **CMS Persistence & Local Dev Server**: Fixed admin panel refresh data loss, added `_hasLocalChanges` draft protection, clock-skew guard, and added `server.py` flat-file save API for local development |
| v2.3.0 | 2026-09-07 | **CV Synchronization, Full Career Timeline & Web3Forms**: Strict CV sync (zero imagined data), all 6 positions on homepage, serverless background contact delivery via Web3Forms with mailto fallback, GPU keyframe pagination transitions, production backup tag |
| v2.2.2 | 2026-09-03 | **CMS Data Synchronization**: First Name single source of truth for logo text, opportunistic GitHub PAT save, restored missing DOM bindings |
| v2.2.1 | 2026-09-02 | **Award Card Styling**: Removed trophy icon and yellow gold border accent for minimal obsidian design |
| v2.2.0 | 2026-09-02 | **CI/CD Pipeline**: Migrated from legacy cPanel FTP to automated GitHub Actions GitHub Pages deploy |
| v1.10.0 | 2026-09-01 | **Codebase Audit & Refactoring**: event delegation, deduplication (utils.js), CSS extraction, magic numbers cleaned, data-driven email, recommendations UI updates & CMS visibility toggle |
| v1.9.0 | 2026-08-28 | Recommendations persistence fix (CSV import now saves), smart store merge (localStorage wins for CMS arrays), LinkedIn Voyager fetch scripts |
| v1.8.0 | 2026-08-27 | **Bug fix (by @pabonsaha)**: stateful SHA-256 rewrite (store.js), missing brace in admin.js save pipeline, form submit hardening in admin.html |
| v1.7.0 | 2026-08-25 | Admin dashboard redesign: obsidian palette, categorised sidebar, 2x2 skills grid |
| v1.6.0 | 2026-08-25 | Store resilience (deep merge), modular renderer, HiDPI canvas, tab visibility lifecycle, z-index tokens, reduced-motion a11y |
| v1.5.0 | 2026-08-25 | Light-mode bird animation, 4-pairing global font selector, FOUC prevention script |
| v1.4.0 | 2026-08-25 | AMOLED true black, film-grain CSS overlay, dark/light toggle with localStorage persist |
| v1.3.0 | 2026-08-25 | WYSIWYG Rich Text Editor (RTE) in CMS admin |
| v1.2.0 | 2026-08-25 | Full design system overhaul, 8px grid, Space Grotesk typography, responsive grids |
| v1.1.0 | 2026-08-22 | Mobile & tablet responsiveness |
| v1.0.0 | 2026-08-21 | Typewriter, availability badge, metric counters, awards, articles, contact form, CMS |
| v0.1.0 | 2026-08-20 | Initial scaffold |

See [CHANGELOG.md](./CHANGELOG.md) for full release notes.

---

## 17. Branch History

This table tracks which features and fixes were developed on which Git branches.

| Branch | Based On | Date | Files Changed | Feature / Fix |
|---|---|---|---|---|
| `main` | — | 2026-09-08 | `js/admin.js`, `server.py`, `js/store.js`, `data/default-data.js` | Fixed CMS list action buttons (Edit/Delete) across all managers, fixed persistence on refresh, added local dev flat-file save API (`server.py`), and established production JSON isolation |
| `cv` | `main` | 2026-09-07 | `data/*.{json,js}`, `js/*.js`, `*.html`, `css/style.css` | Strict CV synchronization, all 6 positions on homepage, Web3Forms serverless delivery, recommendation pagination keyframe animations, merged into `main` |
| `main-backup-20260907` | `main` | 2026-09-07 | Snapshot of `main` at `72317c3` | Safety backup branch and tag `backup-main-20260907` created prior to CV release merge |
| `main` | `Worked-from-office` | 2026-09-01 | `js/*.js`, `css/style.css`, `CHANGELOG.md` | Extensive codebase audit and refactoring (event delegation, data-driven strings, utilities deduplication, magic numbers, recommendation UI enhancements, and CMS visibility toggles) |
| `feature/recommendations-fix-and-linkedin-scripts` | `Worked-from-office` | 2026-08-28 | `js/admin.js`, `js/store.js`, `data/portfolio-data.json`, `fetch-linkedin*.ps1` | Fixed CSV import not persisting recommendations; fixed server fetch overwriting CMS localStorage data; added LinkedIn Voyager API PowerShell fetch scripts |
| `admin-login` | `main` | 2026-08-27 | `js/store.js`, `js/admin.js`, `admin.html` | Stateful SHA-256 bug fix, missing closing brace in admin save pipeline, login form submit hardening |
| `Worked-from-office` | `main` | 2026-08-25 | `admin.html`, `css/admin.css`, `js/admin.js` | Admin dashboard redesign (obsidian palette, categorised sidebar, 2x2 skills grid) |
| `main` | — | 2026-08-20 → ongoing | All files | Primary production branch. Receives merges from feature branches after review. |

---

## 18. Merging & Production Data Rules (Strict)

Whenever contributing, pairing, or merging branches to `main`:

1. **Production JSON Isolation**:
   - The live/remote `data/portfolio-data.json` is the sole source of truth for production portfolio content.
   - Local JSON modifications created during offline testing must **NEVER** overwrite the live `data/portfolio-data.json` on `main`.
   - When merging, always preserve the live `data/portfolio-data.json`.
2. **Mandatory Documentation on Merge**:
   - Whenever merging changes into `main`, **both `CHANGELOG.md` and `README.md` must be updated** to document the new features, bug fixes, or schema changes.
   - Increment semantic version tags and update release tables in both documents.
