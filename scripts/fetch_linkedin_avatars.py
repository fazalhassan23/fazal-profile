#!/usr/bin/env python3
"""
scripts/fetch_linkedin_avatars.py
Automated script to fetch LinkedIn recommendations with display pictures via Voyager API.
Downloads photos locally to assets/testimonials/ and updates portfolio-data.json and default-data.js.
"""

import os
import sys
import json
import re
import urllib.request
import urllib.parse
import http.cookiejar

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_FILE = os.path.join(BASE_DIR, 'data', 'portfolio-data.json')
DEFAULT_DATA_JS = os.path.join(BASE_DIR, 'data', 'default-data.js')
AVATARS_DIR = os.path.join(BASE_DIR, 'assets', 'testimonials')

USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

def clean_slug(name):
    # Remove titles, certifications like ", Registered Scrum Master", "SFPC", etc.
    name = re.split(r'[,|(\[]', name)[0].strip()
    slug = re.sub(r'[^a-zA-Z0-9\s-]', '', name).strip()
    slug = re.sub(r'[\s_]+', '-', slug).lower()
    return slug

def extract_image_url(picture_obj):
    if not picture_obj:
        return ""
    if isinstance(picture_obj, dict) and "com.linkedin.common.VectorImage" in picture_obj:
        picture_obj = picture_obj["com.linkedin.common.VectorImage"]
    
    root_url = picture_obj.get("rootUrl", "")
    artifacts = picture_obj.get("artifacts", [])
    
    if not root_url:
        return ""
    if not artifacts:
        return root_url
    
    # Sort artifacts by width descending to get highest resolution available
    sorted_artifacts = sorted(artifacts, key=lambda x: x.get("width", 0), reverse=True)
    segment = sorted_artifacts[0].get("fileIdentifyingUrlPathSegment", "")
    return root_url + segment

def download_file(url, target_path):
    os.makedirs(os.path.dirname(target_path), exist_ok=True)
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
                with open(target_path, 'wb') as f:
                    f.write(resp.read())
                return True
    except Exception as e:
        print(f"   [Error] Failed to download {url}: {e}")
    return False

def run_sync(li_at, is_dry_run=False):
    print("\n=======================================================")
    print("   LinkedIn Voyager API - Recommendation & Avatar Sync")
    print("=======================================================\n")

    csrf_token = "ajax:12345678901234567"
    cookie_str = f'li_at={li_at}; JSESSIONID="{csrf_token}";'

    headers = {
        'User-Agent': USER_AGENT,
        'Cookie': cookie_str,
        'Csrf-Token': csrf_token,
        'X-Restli-Protocol-Version': '2.0.0',
        'Accept': 'application/vnd.linkedin.normalized+json+2.1'
    }

    print("\nStep 2: Resolving your LinkedIn public identifier...")
    public_id = "fazalmahmudhassan"
    try:
        me_req = urllib.request.Request(
            'https://www.linkedin.com/voyager/api/me',
            headers=headers
        )
        with urllib.request.urlopen(me_req, timeout=20) as resp:
            me_data = json.loads(resp.read().decode('utf-8'))
            mini_profile = me_data.get('miniProfile', {})
            if mini_profile.get('publicIdentifier'):
                public_id = mini_profile.get('publicIdentifier')
        print(f"Profile identifier detected: {public_id}")
    except Exception as e:
        print(f"Using default profile ID '{public_id}' (Reason: {e})")

    print(f"\nStep 3: Fetching received recommendations for '{public_id}'...")
    rec_url = f"https://www.linkedin.com/voyager/api/identity/profiles/{public_id}/recommendationsReceived?count=100"
    rec_req = urllib.request.Request(rec_url, headers=headers)
    
    try:
        with urllib.request.urlopen(rec_req, timeout=25) as resp:
            payload = json.loads(resp.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        print(f"\n[Error] LinkedIn API request failed with HTTP {e.code}: {e.reason}")
        if e.code in (401, 403):
            print("Your 'li_at' cookie may be invalid or expired. Please grab a fresh cookie from DevTools.")
        sys.exit(1)
    except Exception as e:
        print(f"\n[Error] Failed to connect: {e}")
        sys.exit(1)

    elements = payload.get('elements', [])
    included = payload.get('included', [])
    print(f"Successfully retrieved {len(elements)} recommendations.")

    # Build lookup table of MiniProfiles from included collection (normalized format)
    miniprofiles = {}
    for entity in included:
        entity_type = entity.get('$type', '')
        entity_urn = entity.get('entityUrn', '')
        if 'MiniProfile' in entity_type or 'miniProfile' in entity_urn:
            miniprofiles[entity_urn] = entity

    # Load existing portfolio-data.json
    try:
        with open(DATA_FILE, 'r', encoding='utf-8') as f:
            portfolio_data = json.load(f)
    except Exception as e:
        print(f"Error loading {DATA_FILE}: {e}")
        sys.exit(1)

    if 'recommendations' not in portfolio_data:
        portfolio_data['recommendations'] = []

    print("\nStep 4: Downloading profile pictures and updating database...")
    os.makedirs(AVATARS_DIR, exist_ok=True)

    updated_count = 0
    downloaded_pics = 0

    for el in elements:
        # Recommender can be object or URN reference
        recommender = el.get('recommender')
        if isinstance(recommender, str) and recommender in miniprofiles:
            recommender = miniprofiles[recommender]
        elif not isinstance(recommender, dict):
            recommender = {}

        first_name = recommender.get('firstName', '').strip()
        last_name = recommender.get('lastName', '').strip()
        author = f"{first_name} {last_name}".strip()
        headline = recommender.get('occupation', '')
        public_identifier = recommender.get('publicIdentifier', '')
        text = el.get('text', '').strip()
        picture_obj = recommender.get('picture')

        if not author or not text:
            continue

        raw_avatar_url = extract_image_url(picture_obj)
        author_slug = clean_slug(author)
        local_avatar_rel = ""

        if raw_avatar_url:
            local_filename = f"{author_slug}.jpg"
            local_filepath = os.path.join(AVATARS_DIR, local_filename)
            local_avatar_rel = f"assets/testimonials/{local_filename}"

            print(f" -> Found photo for {author} ({raw_avatar_url[:45]}...)")
            if not is_dry_run:
                success = download_file(raw_avatar_url, local_filepath)
                if success:
                    downloaded_pics += 1
                    print(f"    Saved: {local_avatar_rel}")
            else:
                print(f"    [Dry Run] Would save to {local_avatar_rel}")

        # Find existing recommendation in portfolio_data
        existing_rec = None
        for r in portfolio_data['recommendations']:
            if r.get('author', '').strip().lower() == author.lower() or author.lower() in r.get('author', '').strip().lower():
                existing_rec = r
                break

        linkedin_url = f"https://linkedin.com/in/{public_identifier}" if public_identifier else ""

        if existing_rec:
            # Update existing record
            if local_avatar_rel:
                existing_rec['avatar'] = local_avatar_rel
            if linkedin_url and not existing_rec.get('linkedinUrl'):
                existing_rec['linkedinUrl'] = linkedin_url
            if headline and not existing_rec.get('headline'):
                existing_rec['headline'] = headline
            updated_count += 1
        else:
            # Append new record
            created_epoch = el.get('created')
            date_str = ""
            if created_epoch:
                import datetime
                try:
                    dt = datetime.datetime.fromtimestamp(created_epoch / 1000.0)
                    date_str = dt.strftime('%B %Y')
                except Exception:
                    pass

            new_rec = {
                "id": f"rec-{clean_slug(author)}-{public_identifier or 'li'}",
                "author": author,
                "firstName": first_name,
                "lastName": last_name,
                "headline": headline,
                "company": "",
                "avatar": local_avatar_rel,
                "linkedinUrl": linkedin_url,
                "relationship": el.get('relationship') or "LinkedIn recommendation received",
                "date": date_str,
                "text": text,
                "featured": False,
                "visible": True
            }
            portfolio_data['recommendations'].append(new_rec)
            updated_count += 1

    print(f"\nSummary:")
    print(f" - Matched / processed recommendations: {updated_count}")
    print(f" - Images downloaded: {downloaded_pics}")

    if not is_dry_run:
        # 1. Save data/portfolio-data.json
        with open(DATA_FILE, 'w', encoding='utf-8') as f:
            json.dump(portfolio_data, f, indent=2, ensure_ascii=False)
        print(f" Updated {DATA_FILE}")

        # 2. Update data/default-data.js
        try:
            with open(DEFAULT_DATA_JS, 'r', encoding='utf-8') as f:
                js_content = f.read()
            
            # Replace the DEFAULT_PORTFOLIO_DATA assignment cleanly
            match = re.search(r'window\.DEFAULT_PORTFOLIO_DATA\s*=\s*(\{[\s\S]*\});?\s*$', js_content)
            if match:
                new_js = js_content[:match.start(1)] + json.dumps(portfolio_data, indent=2, ensure_ascii=False) + ';\n'
                with open(DEFAULT_DATA_JS, 'w', encoding='utf-8') as f:
                    f.write(new_js)
                print(f" Updated {DEFAULT_DATA_JS}")
        except Exception as e:
            print(f"[Notice] Failed to automatically sync default-data.js: {e}")

        print("\nAll recommendation display pictures have been downloaded and linked successfully!")
    else:
        print("\n[Dry Run] No files were modified.")

if __name__ == '__main__':
    cookie_val = os.environ.get('LINKEDIN_LI_AT', '')

    # Check CLI arguments
    dry_run = '--dry-run' in sys.argv
    for arg in sys.argv[1:]:
        if not arg.startswith('--') and not cookie_val:
            cookie_val = arg.strip()

    if not cookie_val:
        print("Enter your LinkedIn 'li_at' cookie value:")
        print("(In Chrome: Open linkedin.com -> F12 -> Application -> Cookies -> li_at)")
        cookie_val = input("li_at: ").strip()

    if not cookie_val:
        print("Error: No 'li_at' cookie provided. Aborting.")
        sys.exit(1)

    run_sync(cookie_val, is_dry_run=dry_run)
