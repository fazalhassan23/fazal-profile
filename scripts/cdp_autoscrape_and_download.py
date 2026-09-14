#!/usr/bin/env python3
"""
scripts/cdp_autoscrape_and_download.py
Connects to Brave via CDP (port 9222), scrolls through LinkedIn recommendations,
extracts all profile pictures and LinkedIn URLs, downloads photos locally to assets/testimonials/,
and syncs portfolio-data.json and default-data.js.
NO COOKIES OR SECRETS ARE STORED OR HANDLED IN FILE SYSTEM.
"""

import socket
import json
import base64
import os
import re
import time
import urllib.parse
import urllib.request

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

def ws_eval(ws_url, expression, timeout=30.0):
    parsed = urllib.parse.urlparse(ws_url)
    host = parsed.hostname
    port = parsed.port
    path = parsed.path
    
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.connect((host, port))
    
    key = base64.b64encode(os.urandom(16)).decode('ascii')
    handshake = (
        f"GET {path} HTTP/1.1\r\n"
        f"Host: {host}:{port}\r\n"
        f"Upgrade: websocket\r\n"
        f"Connection: Upgrade\r\n"
        f"Sec-WebSocket-Key: {key}\r\n"
        f"Sec-WebSocket-Version: 13\r\n\r\n"
    )
    s.sendall(handshake.encode('utf-8'))
    
    resp = b""
    while b"\r\n\r\n" not in resp:
        resp += s.recv(1024)
        
    msg_id = 1
    payload = json.dumps({
        "id": msg_id,
        "method": "Runtime.evaluate",
        "params": {
            "expression": expression,
            "returnByValue": True,
            "awaitPromise": True
        }
    }).encode('utf-8')
    
    length = len(payload)
    if length < 126:
        header = bytes([0x81, 0x80 | length, 0, 0, 0, 0])
    elif length < 65536:
        header = bytes([0x81, 0x80 | 126, (length >> 8) & 0xFF, length & 0xFF, 0, 0, 0, 0])
    else:
        header = bytes([0x81, 0x80 | 127]) + length.to_bytes(8, 'big') + bytes([0, 0, 0, 0])
        
    s.sendall(header + payload)
    
    raw_res = b""
    s.settimeout(timeout)
    for _ in range(100):
        try:
            chunk = s.recv(16384)
            if not chunk:
                break
            raw_res += chunk
            idx = raw_res.find(b'{"id":1')
            if idx != -1:
                fragment = raw_res[idx:]
                depth = 0
                end_pos = -1
                for i, char in enumerate(fragment):
                    if char == ord('{'):
                        depth += 1
                    elif char == ord('}'):
                        depth -= 1
                        if depth == 0:
                            end_pos = i
                            break
                if end_pos != -1:
                    json_str = fragment[:end_pos+1].decode('utf-8', errors='ignore')
                    s.close()
                    return json.loads(json_str)
        except Exception:
            break
            
    s.close()
    return None

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
        print(f"   [Error] Failed to download photo: {e}")
    return False

def main():
    print("\n=======================================================")
    print("   Brave CDP - Automated Recommendations & Avatars Sync")
    print("=======================================================\n")

    # 1. Connect to CDP list
    try:
        tabs = json.loads(urllib.request.urlopen('http://localhost:9222/json/list').read())
    except Exception as e:
        print(f"Error connecting to Brave CDP on port 9222: {e}")
        sys.exit(1)

    rec_tab = None
    for t in tabs:
        if 'recommendations' in t.get('url', '') or 'linkedin.com' in t.get('url', ''):
            rec_tab = t
            break

    target_url = "https://www.linkedin.com/in/fazal-mahmud-hassan-8915b0175/details/recommendations/"

    if not rec_tab:
        print(f"Opening target URL in Brave: {target_url}")
        req = urllib.request.Request(f'http://localhost:9222/json/new?{target_url}', method='PUT')
        rec_tab = json.loads(urllib.request.urlopen(req).read())
        time.sleep(4)

    ws_url = rec_tab.get('webSocketDebuggerUrl')
    print("Connected to Brave CDP WebSocket!")

    # Navigate to recommendations page if not already there
    cur_url = ws_eval(ws_url, "window.location.href").get('result', {}).get('result', {}).get('value', '')
    if 'details/recommendations' not in cur_url:
        print(f"Navigating Brave to recommendations page...")
        ws_eval(ws_url, f"window.location.href = '{target_url}'")
        time.sleep(4)

    print("Scrolling page in Python loop to trigger lazy-loading for all 27 recommendations...")
    scroll_js = """
    (() => {
      window.scrollBy(0, 600);
      document.querySelectorAll('button, a, div[role="button"]').forEach(btn => {
        const txt = (btn.innerText || btn.getAttribute('aria-label') || '').toLowerCase();
        if (txt.includes('show more') || txt.includes('load more') || btn.classList.contains('scaffold-finite-scroll__load-button')) {
          try { btn.click(); } catch(e) {}
        }
      });
    })()
    """
    for _ in range(30):
        ws_eval(ws_url, scroll_js, timeout=5.0)
        time.sleep(0.4)

    # Scroll to bottom once more
    ws_eval(ws_url, "window.scrollTo(0, document.body.scrollHeight)", timeout=5.0)
    time.sleep(1.0)
    
    scrape_js = """
    (() => {
      const results = [];
      
      document.querySelectorAll('li, div[data-view-name], div.artdeco-card, div.pvs-entity').forEach(card => {
        const link = card.querySelector('a[href*="/in/"]');
        const img = card.querySelector('img[src*="media.licdn.com"]');
        const nameEl = link ? link.querySelector('span[aria-hidden="true"]') : null;
        
        if (link && img && img.src && !img.src.includes('ghost')) {
          let name = nameEl ? nameEl.innerText.trim() : link.innerText.trim().split('\\n')[0];
          name = name.replace(/\\s+/g, ' ').trim();
          if (name && name.length >= 3 && !name.toLowerCase().includes('fazal') && !name.includes('View')) {
            if (!results.some(r => r.name.toLowerCase() === name.toLowerCase())) {
              results.push({
                name: name,
                profileUrl: link.href.split('?')[0],
                avatarUrl: img.src
              });
            }
          }
        }
      });
      
      document.querySelectorAll('a[href*="/in/"]').forEach(a => {
        let rawName = a.innerText.trim().split('\\n')[0].trim();
        if (!rawName || rawName.length < 3 || rawName.includes('View') || rawName.toLowerCase().includes('fazal')) return;
        
        let container = a.closest('li') || a.closest('div.artdeco-card') || a.parentElement;
        let img = container ? container.querySelector('img[src*="media.licdn.com"]') : null;
        if (!img) img = a.querySelector('img[src*="media.licdn.com"]');
        
        if (img && img.src && !img.src.includes('ghost')) {
          if (!results.some(r => r.name.toLowerCase() === rawName.toLowerCase())) {
            results.push({
              name: rawName,
              profileUrl: a.href.split('?')[0],
              avatarUrl: img.src
            });
          }
        }
      });

      return results;
    })()
    """

    res = ws_eval(ws_url, scrape_js)
    extracted = res.get('result', {}).get('result', {}).get('value', [])
    print(f"\nExtracted {len(extracted)} recommenders with display photos from Brave!")

    if not extracted:
        print("[Warning] No recommenders extracted. Make sure LinkedIn is logged in and visible in Brave.")
        sys.exit(1)

    # Load existing portfolio-data.json
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
    updated_count = 0

    print("\nDownloading avatars and linking to portfolio recommendations...")
    for item in extracted:
        name = item.get('name', '').strip()
        profile_url = item.get('profileUrl', '').strip()
        avatar_url = item.get('avatarUrl', '').strip()

        if not name or not avatar_url:
            continue

        slug = clean_slug(name)
        local_filename = f"{slug}.jpg"
        local_filepath = os.path.join(AVATARS_DIR, local_filename)
        local_rel_path = f"assets/testimonials/{local_filename}"

        print(f" -> {name}: Downloading photo...")
        if download_image(avatar_url, local_filepath):
            downloaded += 1
            print(f"    Saved to: {local_rel_path}")

        # Match in portfolio_data
        matched = None
        for r in portfolio_data['recommendations']:
            r_author = r.get('author', '').strip().lower()
            if r_author == name.lower() or name.lower() in r_author or r_author in name.lower():
                matched = r
                break

        if matched:
            matched['avatar'] = local_rel_path
            if profile_url and not matched.get('linkedinUrl'):
                matched['linkedinUrl'] = profile_url
            updated_count += 1
        else:
            new_rec = {
                "id": f"rec-{slug}",
                "author": name,
                "firstName": name.split(' ')[0],
                "lastName": ' '.join(name.split(' ')[1:]),
                "headline": "LinkedIn Colleague",
                "company": "",
                "avatar": local_rel_path,
                "linkedinUrl": profile_url,
                "relationship": "LinkedIn recommendation received",
                "date": "",
                "text": "",
                "featured": False,
                "visible": True
            }
            portfolio_data['recommendations'].append(new_rec)
            updated_count += 1

    print("\n-------------------------------------------------------")
    print(f"Summary:")
    print(f" - Display pictures downloaded: {downloaded}")
    print(f" - Recommendations updated in database: {updated_count}")
    print("-------------------------------------------------------\n")

    # Update portfolio-data.json
    with open(DATA_FILE, 'w', encoding='utf-8') as f:
        json.dump(portfolio_data, f, indent=2, ensure_ascii=False)
    print(f"Updated {DATA_FILE}")

    # Update default-data.js
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

    print("\nSync completed successfully! Refresh http://localhost:3000 to see all new display pictures.")

if __name__ == '__main__':
    main()
