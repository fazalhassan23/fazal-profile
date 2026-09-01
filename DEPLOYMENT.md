# Automated GitHub Pages CI/CD Deployment Guide

This repository is configured with an automated **GitHub Actions CI/CD workflow** located at `.github/workflows/deploy.yml`. Every push to the `main` branch automatically builds and deploys the portfolio live to **GitHub Pages**.

---

## 🚀 How the CI/CD Pipeline Works

```
[Push to `main` branch]
         ↓
[GitHub Actions runner triggers `.github/workflows/deploy.yml`]
         ↓
  1. actions/checkout@v4       (Fetches latest repository code)
  2. actions/configure-pages@v5 (Configures GitHub Pages environment)
  3. actions/upload-pages-artifact@v3 (Bundles site files)
  4. actions/deploy-pages@v4   (Deploys bundle live to GitHub Pages)
         ↓
[Website updated live on GitHub Pages URL!]
```

---

## ⚙️ One-Time Setup in GitHub Repository Settings

To ensure GitHub Actions has permission to publish to GitHub Pages:

1. Open your repository on GitHub: [fazal-profile on GitHub](https://github.com/fazal-mahmud-hassan/fazal-profile) (or [fazalhassan23/fazal-profile](https://github.com/fazalhassan23/fazal-profile)).
2. Click on the **Settings** tab.
3. In the left sidebar, scroll down to the **Code and automation** section and click on **Pages**.
4. Under **Build and deployment**:
   * **Source**: Select **GitHub Actions**.
5. Save the configuration.

---

## 📌 Manual Workflow Trigger (Optional)

You can also trigger a production build manually at any time:
1. Go to the **Actions** tab on GitHub.
2. Select **Deploy to GitHub Pages** in the left sidebar.
3. Click the **Run workflow** dropdown, select `main`, and click **Run workflow**.
