# CI/CD Deployment Guide for Namecheap cPanel

This guide provides step-by-step instructions on completing the set up for the automated GitHub Actions CI/CD pipeline. Once configured, every push to the `main` branch will automatically sync your latest code directly to your Namecheap cPanel hosting.

---

## Step 1: Create an FTP Account in Namecheap cPanel

First, you need dedicated FTP credentials for the GitHub Actions deployment runner:

1. Log in to your **Namecheap cPanel**.
2. Scroll to the **Files** section and click on **FTP Accounts**.
3. Fill in the **Add FTP Account** form:
   * **Log in:** `deploy-bot` (or any username you prefer).
   * **Domain:** Select your portfolio domain.
   * **Password:** Generate a strong, secure password and save it somewhere temporary.
   * **Directory:** Set the path to the root folder where your website is served. 
     * **Important:** If your portfolio is your primary website, set this to `public_html` or `public_html/subfolder` (if it's in a subdirectory).
     * *Note:* The FTP account will be jailed to this directory, meaning it will see this folder as the root `./`.
   * **Quota:** Unlimited.
4. Click **Create FTP Account**.

---

## Step 2: Add Secrets to Your GitHub Repository

To allow GitHub Actions to securely connect to your server without exposing your passwords in the code:

1. Go to your GitHub repository: [fazal-profile on GitHub](https://github.com/fazalhassan23/fazal-profile).
2. Click on the **Settings** tab.
3. In the left sidebar, expand **Secrets and variables** and click on **Actions**.
4. Click the **New repository secret** button at the top right.
5. Create the following three secrets:

### 1. `FTP_SERVER`
* **Name:** `FTP_SERVER`
* **Value:** Your FTP server domain name or IP address (e.g. `ftp.yourdomain.com` or your cPanel server's Shared IP address found on the cPanel sidebar).

### 2. `FTP_USERNAME`
* **Name:** `FTP_USERNAME`
* **Value:** The full FTP username generated in Step 1 (e.g. `deploy-bot@yourdomain.com`).

### 3. `FTP_PASSWORD`
* **Name:** `FTP_PASSWORD`
* **Value:** The strong password you created for the FTP account in Step 1.

---

## Step 3: Verify the Workflow Configuration

Your workflow configuration file is located at `.github/workflows/deploy.yml`. 

Depending on how you set up the directory scope for your FTP user in **Step 1**, you may need to adjust the `server-dir` field:

* **If your FTP account is jailed to `public_html`** (e.g. its home directory was explicitly set to `public_html` in cPanel):
  * Set `server-dir: ./` in `.github/workflows/deploy.yml` because the FTP server automatically drops the connection into that folder.
* **If your FTP account connects to your root home directory** (e.g. `/home/username/`):
  * Set `server-dir: public_html/` (or the folder path) to ensure the runner drops files in the public directory.

Currently, the configuration excludes developmental and hidden files (`.git`, `.github`, `.agents`, etc.) from being uploaded to keep the hosting space clean.

---

## Step 4: Run the Deployment

Once the secrets are set up:
1. Make a small change to your codebase (or merge a branch).
2. Commit and push the changes to the `main` branch.
3. Go to the **Actions** tab on your GitHub repository page.
4. You will see a live workflow run named **Deploy to Namecheap cPanel** executing. You can click it to view the real-time upload progress.
5. Once it completes with a green checkmark, check your site on your domain/iPad to confirm the updates are live! (Verified)
