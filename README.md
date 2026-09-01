# Fazal Mahmud Hassan — Personal Portfolio & CMS

> A zero-dependency, production-grade personal portfolio built entirely on **Vanilla HTML5, modern CSS, and plain JavaScript** — no frameworks, no bundlers, no build steps. Includes a fully client-side Content Management System (CMS) with SHA-256 authentication, a custom WYSIWYG rich-text editor, a dual-mode animated canvas background, and an optional PHP flat-file persistence API.

**Current Version**: `v1.10.0` | **License**: MIT

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
| **Theme** | Dark / Light mode toggle with zero-FOUC instant restore |
| **Theme** | 4 selectable global font pairings via CMS |
| **CMS** | Password-protected `/admin.html` panel with SHA-256 hashed auth |
| **CMS** | Custom built-in WYSIWYG Rich Text Editor (RTE) with HTML source toggle |
| **CMS** | Full CRUD for Profile, Metrics, Expertise, Awards, Articles, Experience, Projects, Education, Skills |
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

## 7. Server Persistence API — GitHub API

The CMS persists data directly back to the GitHub repository using the GitHub Contents API. This eliminates the need for a backend server or database.

### How it works:
1. **Admin Panel**: User provides a Personal Access Token (PAT) with repository write access.
2. **File Check**: Retrieves the current SHA commit hash for `data/portfolio-data.json`.
3. **Commit**: Issues a PUT request to the GitHub API, creating a new commit with the updated JSON string.
4. **Deployment**: The new commit automatically triggers the GitHub Actions workflow, rebuilding and deploying the site to GitHub Pages within seconds.

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
# Python simple HTTP server
python -m http.server 3000
```

> **Note**: You must run a local server to avoid CORS issues when fetching local JSON data. You can use any static server (Python, VS Code Live Server, Node `http-server`).

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
| `main` | `Worked-from-office` | 2026-09-01 | `js/*.js`, `css/style.css`, `CHANGELOG.md` | Extensive codebase audit and refactoring (event delegation, data-driven strings, utilities deduplication, magic numbers, recommendation UI enhancements, and CMS visibility toggles) |
| `feature/recommendations-fix-and-linkedin-scripts` | `Worked-from-office` | 2026-08-28 | `js/admin.js`, `js/store.js`, `data/portfolio-data.json`, `fetch-linkedin*.ps1` | Fixed CSV import not persisting recommendations; fixed server fetch overwriting CMS localStorage data; added LinkedIn Voyager API PowerShell fetch scripts |
| `admin-login` | `main` | 2026-08-27 | `js/store.js`, `js/admin.js`, `admin.html` | Stateful SHA-256 bug fix, missing closing brace in admin save pipeline, login form submit hardening |
| `Worked-from-office` | `main` | 2026-08-25 | `admin.html`, `css/admin.css`, `js/admin.js` | Admin dashboard redesign (obsidian palette, categorised sidebar, 2x2 skills grid) |
| `main` | — | 2026-08-20 → ongoing | All files | Primary production branch. Receives merges from feature branches after review. |

> **Convention**: All new features and bug fixes are developed on dedicated branches named
> `feature/<description>` or `fix/<description>`, then merged into `main` for deployment.
> The `Worked-from-office` branch tracks work done during in-office sessions before merge.
