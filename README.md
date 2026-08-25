# Fazal Mahmud Hassan — Personal Portfolio & CMS

A portfolio website built with Vanilla HTML5, Modern CSS, and JavaScript. Includes a client-side Content Management System (CMS), animated ambient effects, and multi-theme support.

---

## 🌟 Key Highlights

- **Aesthetic**: AMOLED Solid Black (`#000000`) core with fine film-grain overlay and dynamic ambient background.
- **Theme Dual-Mode**: 🌙 / ☀️ Dark and Light mode toggle with instant zero-FOUC state restoration.
- **Dynamic Ambient Canvas**:
  - **Dark Mode**: Meteor shower with glowing gradients and trails.
  - **Light Mode**: Flock of flying birds with dynamic wing flapping.
  - **Battery & GPU Optimized**: Automatically pauses when the browser tab is hidden and respects `@media (prefers-reduced-motion)`.
  - **Retina / HiDPI Ready**: Scales with `devicePixelRatio` for sharp rendering on 4K and mobile screens.
- **Global Typography Selector**: 4 selectable font pairings (Geometric Tech, Sleek Minimalist, Warm & Elegant, Bold Editorial) selectable from the CMS.
- **Rich Text WYSIWYG Editor (RTE)**: Custom visual editor engine with live HTML code view toggle in the CMS.
- **Password-Protected CMS (`admin.html`)**: Direct URL access secured with Web Crypto SHA-256 password hashing.
- **Responsive Design**: Tested across mobile (375px), tablet (768px), and desktop (1440px) breakpoints.

---

## 📁 Architecture & File Structure

```text
├── index.html            # Homepage (Hero, Typewriter, Metrics, Expertise, Featured Work, Contact)
├── about.html            # Biography story, Education, Full Career Timeline, Categorized Skills
├── projects.html         # Research, Publications (Springer), Software Engineering, Leadership
├── admin.html            # Private CMS Admin Panel (Password Gate, RTE, Backup Tools)
├── CHANGELOG.md          # Release notes and history (v0.1.0 – v1.6.0)
│
├── css/
│   ├── style.css         # Modern design tokens, responsive grid, animations, theme overrides
│   └── admin.css         # Admin dashboard layout, lockscreen, and WYSIWYG editor styling
│
├── js/
│   ├── store.js          # Resilient data layer with deep fallback merging, schema validation & SHA-256 auth
│   ├── render.js         # Modular component renderer, accessible modals, and dynamic data bindings
│   ├── main.js           # Core navigation, HiDPI canvas background, and form handlers
│   └── admin.js          # Admin dashboard controller, RTE editor engine, and modal CRUD helpers
│
└── data/
    └── default-data.js   # Master seed data schema for resume, biography, projects, and articles
```

---

## 🚀 Running Locally & Deployment

### Local Development
Since this project uses modern vanilla web standards with zero build dependencies, you can run it directly:
```bash
# Using Python
python -m http.server 3000

# Using Node / npx
npx serve .
```
Then open `http://localhost:3000` in your browser.

### Hosting (GitHub Pages / Namecheap / Shared Hosting)
Upload all files (`*.html`, `css/`, `js/`, `data/`) directly to your public web directory (e.g. `public_html` or GitHub Pages repository branch).

---

## 🔒 CMS Admin Access
- Direct URL: `admin.html`
- Default Master Password: `fazal2026`
- Passwords can be changed securely directly inside the CMS admin panel.
