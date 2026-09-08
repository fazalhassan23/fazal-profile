#!/usr/bin/env python3
"""
scripts/import_avatars_from_clipboard.py
Downloads recommender display pictures extracted from browser DevTools,
saves them to assets/testimonials/, and updates portfolio-data.json and default-data.js.
NO SECRETS OR SENSITIVE TOKENS ARE STORED OR USED.
"""

import os
import sys
import json
import re
import urllib.request
import subprocess

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_FILE = os.path.join(BASE_DIR, 'data', 'portfolio-data.json')
DEFAULT_DATA_JS = os.path.join(BASE_DIR, 'data', 'default-data.js')
AVATARS_DIR = os.path.join(BASE_DIR, 'assets', 'testimonials')

USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

def clean_slug(name):
    name = re.split(r'[,|(\[]', name)[0].strip()
    slug = re.sub(r'[^a-zA-Z0-9\s-]', '', name).strip()
    slug = re.sub(r'[\s_]+', '-', slug).lower()
    return slug

def download_image(url, dest_path):
    os.makedirs(os.path.dirname(dest_path), exist_ok=True)
    req = urllib.request.Request(
        url,
        headers={
            'User-Agent': USER_AGENT,
            'Referer': 'https://www.linkedin.com/'
        }
    )
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            if resp.status == 200:
                with open(dest_path, 'wb') as f:
                    f.write(resp.read())
                return True
    except Exception as e:
        print(f"   [Error] Failed to download {url[:45]}...: {e}")
    return False

def get_clipboard_text():
    try:
        out = subprocess.check_output(['powershell', '-Command', 'Get-Clipboard'], text=True)
        return out.strip()
    except Exception:
        return ""

def main():
    print("\n=======================================================")
    print("   LinkedIn Recommendations Avatar Importer")
    print("=======================================================\n")

    raw_json = get_clipboard_text()
    items = []

    if raw_json and (raw_json.startswith('[') or raw_json.startswith('{')):
        try:
            parsed = json.loads(raw_json)
            items = parsed if isinstance(parsed, list) else [parsed]
            print(f"Auto-detected JSON array with {len(items)} items from clipboard!")
        except Exception:
            items = []

    if not items:
        print("Please paste the JSON extracted from your LinkedIn Recommendations page:")
        print("(Press Ctrl+V then hit Enter, followed by Ctrl+Z / Enter or leave empty to exit):")
        lines = sys.stdin.read().strip()
        if not lines:
            print("No data provided. Aborting.")
            sys.exit(0)
        try:
            parsed = json.loads(lines)
            items = parsed if isinstance(parsed, list) else [parsed]
        except Exception as e:
            print(f"Failed to parse JSON: {e}")
            sys.exit(1)

    # Load portfolio-data.json
    try:
        with open(DATA_FILE, 'r', encoding='utf-8') as f:
            portfolio_data = json.load(f)
    except Exception as e:
        print(f"Error loading {DATA_FILE}: {e}")
        sys.exit(1)

    if 'recommendations' not in portfolio_data:
        portfolio_data['recommendations'] = []

    os.makedirs(AVATARS_DIR, exist_ok=True)

    downloaded = 0
    matched_count = 0

    print(f"\nProcessing {len(items)} recommenders...")
    for entry in items:
        name = entry.get('name') or entry.get('author') or ''
        profile_url = entry.get('profileUrl') or entry.get('linkedinUrl') or ''
        avatar_url = entry.get('avatarUrl') or entry.get('avatar') or ''

        if not name or not avatar_url:
            continue

        slug = clean_slug(name)
        local_filename = f"{slug}.jpg"
        local_filepath = os.path.join(AVATARS_DIR, local_filename)
        local_rel_path = f"assets/testimonials/{local_filename}"

        print(f" -> Downloading avatar for: {name} ...")
        success = download_image(avatar_url, local_filepath)
        if success:
            downloaded += 1
            print(f"    Saved to: {local_rel_path}")

        # Match in portfolio_data
        matched = None
        for r in portfolio_data['recommendations']:
            r_author = r.get('author', '').strip().lower()
            if r_author == name.strip().lower() or name.strip().lower() in r_author or r_author in name.strip().lower():
                matched = r
                break

        if matched:
            matched['avatar'] = local_rel_path
            if profile_url and not matched.get('linkedinUrl'):
                matched['linkedinUrl'] = profile_url
            matched_count += 1

    print("\n-------------------------------------------------------")
    print(f"Summary:")
    print(f" - Photos downloaded: {downloaded}")
    print(f" - Recommendations matched and updated: {matched_count}")
    print("-------------------------------------------------------\n")

    # Save portfolio-data.json
    with open(DATA_FILE, 'w', encoding='utf-8') as f:
        json.dump(portfolio_data, f, indent=2, ensure_ascii=False)
    print(f"Updated {DATA_FILE}")

    # Sync default-data.js
    try:
        with open(DEFAULT_DATA_JS, 'r', encoding='utf-8') as f:
            js_content = f.read()

        match = re.search(r'window\.DEFAULT_PORTFOLIO_DATA\s*=\s*(\{[\s\S]*\});?\s*$', js_content)
        if match:
            new_js = js_content[:match.start(1)] + json.dumps(portfolio_data, indent=2, ensure_ascii=False) + ';\n'
            with open(DEFAULT_DATA_JS, 'w', encoding='utf-8') as f:
                f.write(new_js)
            print(f"Updated {DEFAULT_DATA_JS}")
    except Exception as e:
        print(f"Note: Could not update default-data.js automatically: {e}")

    print("\nComplete! Refresh http://localhost:3000 to see all display pictures.")

if __name__ == '__main__':
    main()
