# Fazal Mahmud Hassan — Personal Portfolio & CMS

> A zero-dependency, production-grade personal portfolio built entirely on **Vanilla HTML5, modern CSS, and plain JavaScript** — no frameworks, no bundlers, no build steps. Includes a fully client-side Content Management System (CMS) with SHA-256 authentication, a custom WYSIWYG rich-text editor, a dual-mode animated canvas background, and an optional PHP flat-file persistence API.

**Current Version**: `v1.8.0` | **License**: MIT

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
7. [Server Persistence API — save.php](#7-server-persistence-api--savephp)
8. [Authentication & Security Model](#8-authentication--security-model)
9. [Canvas Ambient Background System](#9-canvas-ambient-background-system)
10. [Typewriter Engine](#10-typewriter-engine)
11. [Theme & Font System](#11-theme--font-system)
12. [SEO & Metadata](#12-seo--metadata)
13. [CI/CD & Deployment](#13-cicd--deployment)
14. [Local Development](#14-local-development)
15. [CMS Admin Access](#15-cms-admin-access)
16. [Versioning & Changelog](#16-versioning--changelog)

---

## 1. Overview & Philosophy

This portfolio was built around three principles:

1. **Zero runtime dependencies.** No React, no Vue, no build pipeline, no npm. The entire site is plain HTML/CSS/JS that runs straight from any static file server — or even a `file://` path locally.
2. **Self-contained CMS.** All content is editable through a password-protected admin panel at `/admin.html`. Data is stored in `localStorage`, synced to a flat JSON file on the server via a lightweight PHP API, and merged against a hardcoded default schema on every read.
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
| **CMS** | One-click JSON backup export and import with schema validation |
| **CMS** | Resilient `localStorage` + optional PHP server sync |
| **SEO** | Dynamic `<title>`, meta description & keywords driven by CMS data |
| **a11y** | `aria-modal`, `aria-expanded`, `aria-label`, keyboard focus trapping |
| **a11y** | `@media (prefers-reduced-motion: reduce)` global animation overrides |
| **Deploy** | GitHub Actions FTP deploy to Namecheap cPanel on push to main |

---

## 3. Repository Structure

```
fazal-portfolio/
|
+-- index.html            # Homepage: Hero, Typewriter, Metrics, Expertise,
|                         #   Awards, Experience preview, Featured Work, Articles, Contact
+-- about.html            # Biography, Education, Full Career Timeline, Skills, Extras
+-- projects.html         # Research Thesis, Springer Publication, Software, Leadership/Volunteer
+-- admin.html            # Private CMS Admin Panel (Password gate, all editors, backup tools)
+-- 404.html              # Custom branded error page (content driven by CMS errorPage schema)
|
+-- css/
|   +-- style.css         # Main design system: tokens, layout, all components, animations,
|   |                     #   theme overrides, responsive breakpoints (880px, 600px)
|   +-- admin.css         # Admin dashboard: sidebar, lockscreen, card editors,
|                         #   WYSIWYG toolbar and contenteditable styles
|
+-- js/
|   +-- store.js          # PortfolioStore: data layer, schema merge, SHA-256 auth,
|   |                     #   localStorage CRUD, server sync, backup import/export
|   +-- render.js         # PortfolioApp: modular DOM renderer, typewriter engine,
|   |                     #   article modal, section visibility control
|   +-- main.js           # Core page interactions: nav scroll/mobile drawer,
|   |                     #   canvas ambient background, IntersectionObserver,
|   |                     #   metric counters, contact form, theme toggle
|   +-- admin.js          # CMS admin controller: WYSIWYG RTE engine, all CRUD
|                         #   section panels, password change flow, backup UI
|
+-- data/
|   +-- default-data.js   # Master seed schema (window.DEFAULT_PORTFOLIO_DATA)
|   |                     #   Loaded before store.js. Used as merge base + fallback.
|   +-- portfolio-data.json  # Live server-persisted data (written by api/save.php)
|                            #   Auto-fetched on load; syncs localStorage from server.
|
+-- api/
|   +-- save.php          # PHP flat-file persistence endpoint.
|                         #   POST-only, schema-validates, bearer-token auth,
|                         #   atomic write via tmp file + rename.
|
+-- assets/
|   +-- favicon.svg       # Inline SVG favicon (no extra network request)
|   +-- og-image.svg      # Open Graph social preview image
|   +-- fonts/            # Self-hosted font files (loaded via css/fonts.css)
|
+-- .github/
|   +-- workflows/
|       +-- deploy.yml    # GitHub Actions: FTP deploy to cPanel on push to main
|
+-- sitemap.xml           # Static XML sitemap for search engines
+-- robots.txt            # robots.txt with sitemap reference
+-- CHANGELOG.md          # Full version history (v0.1.0 to v1.8.0)
+-- DEPLOYMENT.md         # Step-by-step cPanel deployment guide
```

---

## 4. Architecture Deep-Dive

### Data Layer — store.js

`store.js` exposes a single global singleton `window.PortfolioStore` via an IIFE. It is responsible for all data reads, writes, schema validation, server sync, and authentication.

#### Initialization Flow

```
page load
  |
  +-- data/default-data.js  -> sets window.DEFAULT_PORTFOLIO_DATA (synchronous, always first)
  +-- store.js loaded        -> defines PortfolioStore, calls PortfolioStore.fetchServerData() eagerly
  |     +-- fetchServerData():
  |           1. Fetch data/portfolio-data.json?t={timestamp}  (cache-busted)
  |           2. If ok -> mergeSchema(defaults, serverData) -> save to localStorage
  |           3. Dispatch CustomEvent 'portfolioDataChanged'
  |           4. On failure (offline / static) -> fall back to getData() (localStorage or defaults)
  +-- render.js / admin.js  -> listen for 'portfolioDataChanged', re-render
```

#### `mergeSchema(defaults, saved)` — Deep Fallback Merge

This is the heart of the resilience model. Rather than a naive `Object.assign`, it performs a deep, property-level merge that **guarantees every key in the default schema exists** in the returned data, even if `localStorage` is empty, corrupted, or only partially populated.

Key rules implemented:
- Top-level scalar fields: `saved` wins over `defaults`
- Nested objects (`profile`, `availability`, `seo`, `adminAuth`, `sections.*`, `footer`, `navigation`): spread-merged individually so neither side can null out an entire sub-object
- Arrays (`metrics`, `expertise`, `awards`, `articles`, `experience`, `projects`, `education`, `extraCurriculars`, `skills.*`, `footer.links`, `footer.socialLinks`, `navigation.items`): if `saved[key]` is a real `Array`, use it; otherwise fall back to `defaults[key]`
- **Auto-migration**: detects stale `availability.badgeText` values and silently upgrades them

#### Storage Keys

| Key | Storage | Purpose |
|---|---|---|
| `fazal_portfolio_cms_data` | `localStorage` | Full portfolio data JSON |
| `fazal_portfolio_auth_session` | `sessionStorage` | SHA-256 hash of active admin session |

#### Public API

| Method | Returns | Description |
|---|---|---|
| `getData()` | `Object` | Reads localStorage, merges with defaults, returns validated data |
| `fetchServerData()` | `Promise<Object>` | Fetches server JSON, updates localStorage, dispatches event |
| `saveData(data)` | `Promise<{success, serverSynced}>` | Writes to localStorage + POSTs to `api/save.php` |
| `resetToDefault()` | `{success, data}` | Clears localStorage, restores defaults |
| `exportJSON()` | `void` | Downloads current data as a `.json` file (Blob URL) |
| `importJSON(jsonString)` | `Promise<{success, data, error}>` | Parses, validates, and merges an uploaded backup |
| `isAuthenticated()` | `boolean` | Checks `sessionStorage` for active session hash |
| `login(password)` | `Promise<{success, error}>` | Hashes input, compares against stored hash |
| `logout()` | `void` | Clears session hash from `sessionStorage` |
| `changePassword(old, new)` | `Promise<{success, error}>` | Verifies old, hashes new, persists updated hash |

---

### Renderer Engine — render.js

`render.js` exposes `window.PortfolioApp` via an IIFE. It is the pure DOM rendering layer — it takes data from `PortfolioStore` and writes it to the HTML. It has **no side effects on data** — reads only.

#### Rendering Pipeline

On every page load and on every `portfolioDataChanged` event, the renderer calls a chain of focused sub-functions:

```
PortfolioApp.init()
  |
  +-- renderIdentityAndTheme(data.profile)
  |     Sets font pair attribute, nav brand text, dynamic <title>
  |
  +-- renderNavigation(data.navigation, data.profile)
  |     Renders nav logo and dynamically builds nav items
  |     Marks current page link as active
  |
  +-- renderHero(data.profile, data.availability)
  |     Renders availability badge, hero name, hero bio, typewriter roles
  |
  +-- renderMetrics(data.metrics)
  |     Generates .metric-card HTML with data-target attributes for counter animation
  |
  +-- renderExpertise(data.expertise)
  |     Generates .expertise-card grid
  |
  +-- renderAwards(data.awards)
  |     Generates .award-card entries
  |
  +-- renderArticles(data.articles)
  |     Generates .article-card entries with onclick -> openArticleModal(id)
  |
  +-- renderExperience(data.experience)
  |     Renders top-3 preview on index.html, full list on about.html
  |     Each item uses renderTimelineItem(job) helper
  |
  +-- renderProjects(data.projects)
  |     Top-3 preview on index.html; category-filtered on projects.html
  |     Categories: research / publication / software / volunteer
  |
  +-- renderAboutPage(data.profile, data)
  |     About lead, multi-paragraph story, education list, categorised skills, extracurriculars
  |
  +-- renderSectionHeadersAndVisibility(data.sections, data)
  |     Updates all section label text, CTA text/href, show/hide via .style.display
  |     Covers: homeHero, expertise, awards, experience, work, articles, contact,
  |             aboutPage sections, projectsPage sections, errorPage
  |
  +-- renderContactAndFooter(data.profile, data.footer)
  |     Binds email, phone, LinkedIn, GitHub, resume hrefs via data-cms-link attributes
  |     Renders footer tagline, copyright, nav links, social links
  |
  +-- renderSEO(data.seo, data.profile)
        Updates <meta name="description"> and <meta name="keywords">
```

#### XSS Protection

All user-supplied strings pass through `escapeHtml(str)` before being written as `textContent` or interpolated into HTML templates. The only exception is `aboutBodyParagraphs` and `article.content`, where the CMS deliberately stores sanitised rich HTML — a regex test checks for HTML tags before injecting via `innerHTML` vs `textContent`.

#### Article Modal

`openArticleModal(articleId)` lazily creates a `<div role="dialog" aria-modal="true">` overlay on first call (DOM reuse on subsequent calls). It traps:
- `click` on backdrop -> close
- `Escape` keydown -> close
- Two close buttons (header x and footer Close) -> close
- `aria-labelledby` pointing at the modal title for screen readers

---

### Core Interactions — main.js

Handles all raw browser event wiring that isn't data-driven. All code runs inside a single `DOMContentLoaded` listener with `'use strict'`.

#### Modules (in execution order)

| # | Module | Technique |
|---|---|---|
| 1 | **Navigation Scroll State** | `scroll` event -> `requestAnimationFrame` throttle -> toggles `.scrolled` class on nav |
| 2 | **Mobile Navigation Drawer** | Three-span hamburger morphs to X via inline transform/opacity; closes on backdrop click, link click, Escape, or resize |
| 3 | **Active Nav Link** | Reads `window.location.pathname`, adds `.active` class to matching link |
| 4 | **Scroll Fade-Up Animations** | `IntersectionObserver` (threshold 0.08, rootMargin -30px) watches `.fade-up` elements; adds `.visible`, then `unobserve`s |
| 5 | **Animated Metric Counters** | Second `IntersectionObserver` (threshold 0.15) triggers `animateMetrics()` once; uses `setInterval` with adaptive step to count 0 -> target in ~1200ms |
| 6 | **Contact Form Handler** | Prevents default submit, validates required fields, builds `mailto:` URI with URL-encoded body, opens email client |
| 7 | **Dark / Light Theme Toggle** | Reads `data-theme` on html element, toggles to opposite, persists in `localStorage` |
| 8 | **Ambient Canvas Background** | See Canvas System section below |

---

### Admin CMS — admin.js

The admin panel is a ~1,750-line self-contained controller. It is only loaded on `admin.html`. It checks `PortfolioStore.isAuthenticated()` on load and redirects to the password lockscreen if unauthenticated.

#### Panel Sections (Sidebar Tabs)

| Tab | Content Managed |
|---|---|
| **Identity & Hero** | Name, role, bio, hero CTA labels/URLs, availability badge, typewriter roles, font pair selector |
| **Metrics** | CRUD list of metric cards (number, suffix, label, subtext) |
| **Expertise** | CRUD list of expertise cards (icon, category, title, description) |
| **Experience** | CRUD list of timeline jobs (role, company, period, bullets, isCurrent flag) |
| **Projects & Work** | CRUD list of projects (title, description, year, tags, category, link, badge) |
| **Awards** | CRUD list of award entries (title, organization, year) |
| **Articles** | CRUD list of articles with WYSIWYG body editor (title, category, date, readTime, summary, tags, content) |
| **About Page** | Biography lead text, multi-paragraph story (WYSIWYG), education list, extracurriculars, skills (4 categories), section visibility toggles |
| **Settings** | SEO meta description & keywords, section label/visibility overrides, footer text, social links, password change, JSON export/import, factory reset |

#### Built-in WYSIWYG Rich Text Editor (RTE)

`createRichTextEditor(container, initialContent, placeholder)` returns an editor object dynamically injected into any container. Architecture:

```
.rte-wrapper
  +-- .rte-toolbar
  |    +-- Group 1: Bold, Italic, Underline, Strikethrough  -> document.execCommand()
  |    +-- Group 2: H2, H3, Paragraph                       -> execCommand('formatBlock')
  |    +-- Group 3: Bullet list, Numbered list, Blockquote, Code block
  |    +-- Group 4: Insert link (prompt), Remove link, Clear formatting
  |    +-- Group 5: Undo, Redo
  |    +-- HTML toggle button -> switches between visual and raw code views
  +-- .rte-content   (contenteditable="true")  <- WYSIWYG visual pane
  +-- .rte-html-textarea                       <- Raw HTML pane (hidden by default)
```

When the HTML toggle is activated:
1. `.rte-content.innerHTML` is copied to `.rte-html-textarea.value`
2. Visual pane hidden, textarea shown
3. On toggle back: `textarea.value` is written back to `.rte-content.innerHTML`

The editor exposes `.getHTML()` and `.setHTML(html)` methods used by the admin save pipeline.

---

## 5. CSS Design System — style.css

The stylesheet is a pure CSS custom properties (variables) system. No preprocessor, no utility framework.

### Token Categories

| Category | Token Prefix | Examples |
|---|---|---|
| Background surfaces | `--bg`, `--surface` | `--bg: #000000`, `--surface: #0C0C10` |
| Text | `--text-*` | `--text-primary: #F4F4F9`, `--text-tertiary: #8A8AA4` |
| Accent (Electric Blue) | `--accent*` | `--accent: #4A85FF`, `--accent-glow: rgba(74,133,255,0.18)` |
| Gold (Awards) | `--gold*` | `--gold: #F5A623`, `--gold-border: rgba(245,166,35,0.25)` |
| Green (Status) | `--green*` | `--green: #34D399` |
| Borders | `--border*` | `--border: rgba(255,255,255,0.06)` |
| Typography | `--font-*` | `--font-display: 'Space Grotesk'`, `--font-mono: 'JetBrains Mono'` |
| Spacing (8px grid) | `--space-*` | `--space-sm: 0.5rem` -> `--space-4xl: 6rem` |
| Layout | `--max-width`, `--nav-height`, `--card-radius` | `--max-width: 1080px` |
| Transitions | `--ease`, `--ease-out` | `cubic-bezier(0.4, 0, 0.2, 1)` |
| Shadows | `--shadow-*` | `--shadow-modal: 0 24px 64px rgba(0,0,0,0.65)` |
| Z-Index layers | `--z-*` | `--z-canvas: -1`, `--z-nav: 100`, `--z-modal: 300` |

### Light Mode

`[data-theme="light"]` overrides all surface, text, and accent tokens to a carefully balanced light palette. Borders, nav blur, and the mobile drawer all adapt automatically because they reference the same custom properties.

### FOUC Prevention

An inline `<script>` in every `<head>` reads `localStorage.getItem('portfolio_theme')` and `localStorage.getItem('portfolio_font_pair')` synchronously before the first paint, setting `data-theme` and `data-font-pair` on `<html>`. This eliminates any flash of wrong theme or font.

### Film-Grain Overlay

A CSS-only animated noise overlay is applied via `body::before` using an SVG `feTurbulence` filter as the noise source, animated with `steps(10)` keyframes for a filmic, living texture. Zero network requests.

### Responsive Breakpoints

| Breakpoint | Target |
|---|---|
| `max-width: 880px` | Tablet — collapses nav to hamburger, adjusts grid columns |
| `max-width: 600px` | Mobile — single-column layouts, reduced padding |

### Reduced Motion

`@media (prefers-reduced-motion: reduce)` disables all CSS `animation`, `transition`, and the grain overlay globally, respecting user OS accessibility settings.

---

## 6. Data Schema — default-data.js

The file sets `window.DEFAULT_PORTFOLIO_DATA` — a deeply nested object that serves as:
1. The **initial seed** for a fresh install (no localStorage)
2. The **merge base** that guarantees all schema keys always exist
3. The **fallback** if server fetch or localStorage read fails

Top-level schema keys:

```js
{
  profile: { name, firstName, roleTitle, heroBio, email, phone, location,
             linkedinUrl, githubUrl, resumeUrl, aboutLead, aboutBodyParagraphs[],
             footerTagline, copyrightYear, fontPair },
  availability: { status, badgeText, typewriterRoles[] },
  metrics: [{ number, suffix, label, subtext }],
  expertise: [{ icon, category, title, description }],
  awards: [{ title, organization, year }],
  articles: [{ id, title, category, date, readTime, summary, tags[], content }],
  experience: [{ role, company, companyUrl, period, isCurrent, bullets[] }],
  projects: [{ title, description, year, tags[], category, link, badge }],
  education: [{ degree, institution, field, year, grade }],
  extraCurriculars: [{ icon, category, title, description }],
  skills: { technical[], professional[], creative[], languages[] },
  navigation: { logoText, logoLink, logoDot, items[{ label, url, visible, isExternal }], cta{} },
  sections: { homeHero{}, expertise{}, awards{}, experience{}, work{}, articles{}, contact{},
              aboutPage{}, projectsPage{}, errorPage{} },
  footer: { tagline, copyright, navTitle, links[], connectTitle, socialLinks[] },
  seo: { siteTitle, metaDescription, keywords },
  adminAuth: { passwordHash }   // SHA-256 hex of the master password
}
```

---

## 7. Server Persistence API — save.php

A minimal, secure PHP endpoint for hosting environments that support PHP (e.g., Namecheap cPanel).

### Request

```
POST /api/save.php
Content-Type: application/json
Authorization: Bearer {sha256_session_hash}

{...full portfolio data object...}
```

### Processing Pipeline

1. **Method guard** — rejects anything except `POST` with `405`
2. **Payload validation** — parses JSON body, rejects empty or malformed with `400`
3. **Schema validation** — checks for 10 required top-level keys; rejects missing fields with `422`
4. **Authentication** — extracts `Bearer` token from `Authorization` header; compares against `adminAuth.passwordHash` stored in the existing `data/portfolio-data.json` using PHP `hash_equals()` (constant-time comparison)
5. **Atomic write** — writes to a random temp file, then `rename()`s to the real path — prevents partial writes from corrupting live data
6. **Permissions** — sets `chmod 0644` on the written file
7. **Response** — returns `{success: true, message, updatedAt, bytesWritten}`

### Security Notes

- CORS is not configured — the endpoint is only called from the same origin
- `hash_equals()` prevents timing attacks on hash comparison
- The rename-based atomic write prevents race conditions
- `X-Content-Type-Options: nosniff` and `X-Frame-Options: DENY` headers are set

---

## 8. Authentication & Security Model

The admin panel uses a **client-side SHA-256 password hash** model:

### Login Flow

```
user types password -> PortfolioStore.login(password)
  |
  +-- computeSha256(password)
  |     +-- Attempts Web Crypto API: window.crypto.subtle.digest('SHA-256', ...)
  |     +-- Falls back to pure JS SHA-256 implementation (works on HTTP / non-HTTPS)
  |
  +-- inputHash compared to storedHash (from data.adminAuth.passwordHash)
  |     +-- storedHash source priority:
  |           1. localStorage data (if changed by user)
  |           2. Default schema in DEFAULT_PORTFOLIO_DATA
  |           3. Hardcoded default hash for "fazal2026"
  |
  +-- Match    -> sessionStorage.setItem('fazal_portfolio_auth_session', inputHash)
  +-- No match -> return { success: false, error: 'Incorrect password.' }
```

### Session Lifecycle

- Session hash lives in `sessionStorage` — cleared on tab/browser close automatically
- Every admin panel render checks `PortfolioStore.isAuthenticated()` — redirects to lockscreen if false
- On `saveData()`, the session hash is sent as a `Bearer` token in the `Authorization` header to the PHP API

### Password Change

1. Old password re-verified via `login(oldPassword)`
2. New password hashed via `computeSha256(newPassword)`
3. `data.adminAuth.passwordHash` updated in the live data object
4. `saveData()` called — persists to localStorage and server
5. `sessionStorage` updated to the new hash (keeps session alive)

---

## 9. Canvas Ambient Background System

The ambient background is a `<canvas>` element dynamically created by `main.js` and prepended to `<body>` with:
- `position: fixed; top: 0; left: 0; width: 100vw; height: 100vh`
- `z-index: -1` (behind all content)
- `pointer-events: none` (transparent to mouse/touch)

### HiDPI / Retina Scaling

```js
canvas.width  = Math.floor(window.innerWidth  * devicePixelRatio);
canvas.height = Math.floor(window.innerHeight * devicePixelRatio);
ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // scale all draw calls by DPR
```

This ensures pixel-perfect rendering on 2x, 3x, and 4K displays.

### Battery & GPU Optimization

```js
document.addEventListener('visibilitychange', () => {
  isTabActive = !document.hidden;
  if (isTabActive && !animFrameId) {
    animFrameId = requestAnimationFrame(renderLoop);
  }
});

function renderLoop() {
  if (!isTabActive) { animFrameId = null; return; } // stop RAF when tab hidden
  // ... draw ...
  animFrameId = requestAnimationFrame(renderLoop);
}
```

### Dark Mode — Meteor Shower

6 meteor objects are maintained. Each has: `{ x, y, length, speed, opacity, width }`.

Per frame:
- `m.x -= m.speed` / `m.y += m.speed * 0.58` (diagonal upper-right to lower-left trajectory)
- Draws a `LinearGradient` line: bright white at head (6% stop), blue-to-transparent tail
- Off-screen meteors are replaced with `createMeteor(false)` (spawns from top-right)

### Light Mode — Flying Birds

4 bird objects: `{ x, y, size, speedX, speedY, flapPhase, flapSpeed, opacity }`.

Per frame:
- `b.flapPhase += b.flapSpeed` (advances wing cycle via sine wave)
- Wing shape: two `quadraticCurveTo()` curves from center, with tip Y offset by `Math.sin(flapPhase)`
- Birds exit right edge and are replaced spawning from the left

---

## 10. Typewriter Engine

Located in `render.js`, targets `#hero-typewriter`. State machine:

| State | Action | Speed |
|---|---|---|
| Typing | Increment `charIndex`, update `el.textContent` | 60ms/char |
| Pause (full) | Wait before deleting | 2200ms |
| Deleting | Decrement `charIndex`, update `el.textContent` | 25ms/char |
| Pause (empty) | Wait before next role | 400ms |

Roles are cycled infinitely with `roleIndex = (roleIndex + 1) % roles.length`. The timer reference is tracked globally so the renderer can cancel and restart it cleanly on a `portfolioDataChanged` event.

---

## 11. Theme & Font System

### Theme Toggle

`localStorage('portfolio_theme')` -> `'dark'` or `'light'`

Applied to `document.documentElement` as `data-theme="light"` or `data-theme="dark"`. All light-mode overrides are scoped to `[data-theme="light"]` in CSS.

### Font Pair Selector

4 curated pairings, selectable from the CMS Identity panel:

| `data-font-pair` Value | Display Font | Body Font |
|---|---|---|
| *(default / unset)* | Space Grotesk | DM Sans |
| `sleek-minimalist` | Outfit | Inter |
| `warm-elegant` | Playfair Display | Plus Jakarta Sans |
| `bold-editorial` | Syne | Manrope |

Each pairing has a dedicated CSS block in `css/fonts.css` that overrides `--font-display` and `--font-body` custom properties. The selection persists in `localStorage` and is restored before paint via the inline FOUC script.

---

## 12. SEO & Metadata

Each HTML page includes:
- `<title>` — dynamic, updated by `renderIdentityAndTheme()`
- `<meta name="description">` — updated by `renderSEO()` from `data.seo.metaDescription`
- `<meta name="keywords">` — updated from `data.seo.keywords`
- `<meta property="og:*">` — Open Graph tags for social sharing (title, description, image)
- `<link rel="canonical">` — canonical URL per page
- `<link rel="sitemap">` pointing to `sitemap.xml`
- Semantic HTML5 landmarks: `<header>`, `<main>`, `<nav>`, `<section>`, `<article>`, `<footer>`

---

## 13. CI/CD & Deployment

### GitHub Actions — `.github/workflows/deploy.yml`

Triggers on every `push` to `main` (and manually via `workflow_dispatch`).

```yaml
- Checkout repository (actions/checkout@v4)
- Sync via FTP (SamKirkland/FTP-Deploy-Action@v4.3.4)
    server:     secrets.FTP_SERVER
    username:   secrets.FTP_USERNAME
    password:   secrets.FTP_PASSWORD
    server-dir: ./
```

**Excluded from FTP upload:**
`.git*`, `.github*`, `README.md`, `CHANGELOG.md`, `.agents/`, `.gemini/`, `mcp_config.json`, `hooks.json`

Required GitHub repository secrets:

| Secret | Value |
|---|---|
| `FTP_SERVER` | Your cPanel FTP hostname |
| `FTP_USERNAME` | cPanel FTP account username |
| `FTP_PASSWORD` | cPanel FTP account password |

---

## 14. Local Development

No build step required. Simply serve the directory over HTTP:

```bash
# Python 3
python -m http.server 3000

# Node.js / npx
npx serve .

# PHP built-in server (enables api/save.php)
php -S localhost:3000
```

Then open `http://localhost:3000`.

> **Note**: The PHP server is required only if you want to test server-side persistence (`api/save.php`). All CMS features work fully on the Python/Node static server using localStorage only.

---

## 15. CMS Admin Access

| Detail | Value |
|---|---|
| URL | `/admin.html` |
| Default Password | `fazal2026` |
| Default Hash (SHA-256) | `caf4346b968c185dce13d7145fa1bc1cc21e6460a66796f93d9baebc0fc49893` |
| Change Password | From inside the admin panel: Settings -> Password |

> **Warning**: Change the default password immediately on first deployment. The admin panel URL is intentionally not linked from anywhere on the public site.

---

## 16. Versioning & Changelog

This project uses [Semantic Versioning](https://semver.org/) and [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) conventions.

| Version | Date | Summary |
|---|---|---|
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
