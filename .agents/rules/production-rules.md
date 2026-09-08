# Production Merge & Data Protection Rules

## 1. Production JSON Data Isolation (Strict)
- The live/remote file `data/portfolio-data.json` on `main` is the sole source of truth for production portfolio content, managed live by the user.
- Local `data/portfolio-data.json` modifications made during offline development or testing must **NEVER** overwrite the live production data when merging into `main`.
- When merging branches or pulling upstream changes, always preserve the live `data/portfolio-data.json` and resolve any conflicts in favor of the production/remote content.

## 2. Mandatory Documentation Updates on Merge
- Whenever merging any changes or features to `main`, **both `CHANGELOG.md` and `README.md` must be updated**.
- Increment semantic version numbers (e.g. `v2.3.x`).
- Add comprehensive bullet points under `CHANGELOG.md` following Keep a Changelog conventions.
- Update the version number, feature descriptions, and Versioning & Changelog table in `README.md`.

## 3. Branch Target Strategy (Strict)
- Always commit and push changes exclusively to the `cv` branch (`origin/cv`).
- **NEVER** merge or push to `main` (production) unless the user explicitly requests to push to `main` or deploy to live/production.

