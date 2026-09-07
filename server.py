#!/usr/bin/env python3
"""
Local Development Server with Flat-File Persistence API
Serves static portfolio assets and handles POST /api/save to persist CMS edits
directly to data/portfolio-data.json on disk.
"""

import http.server
import json
import os
import sys

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 3000
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_FILE = os.path.join(BASE_DIR, 'data', 'portfolio-data.json')

class PortfolioDevHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=BASE_DIR, **kwargs)

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()

    def do_POST(self):
        clean_path = self.path.split('?')[0].rstrip('/')
        if clean_path in ('/api/save', '/data/portfolio-data.json'):
            try:
                content_length = int(self.headers.get('Content-Length', 0))
                if content_length <= 0:
                    raise ValueError('Empty request payload')
                
                raw_bytes = self.rfile.read(content_length)
                try:
                    body = raw_bytes.decode('utf-8')
                except UnicodeDecodeError:
                    body = raw_bytes.decode('latin-1')
                data = json.loads(body)

                # Ensure data directory exists
                os.makedirs(os.path.dirname(DATA_FILE), exist_ok=True)

                # Atomic write via temporary file to prevent corruption
                tmp_file = DATA_FILE + '.tmp'
                with open(tmp_file, 'w', encoding='utf-8') as f:
                    json.dump(data, f, indent=2, ensure_ascii=False)
                
                if os.path.exists(DATA_FILE):
                    os.replace(tmp_file, DATA_FILE)
                else:
                    os.rename(tmp_file, DATA_FILE)

                response_body = json.dumps({
                    'success': True,
                    'localFileSaved': True,
                    'message': 'Changes persisted to data/portfolio-data.json'
                }).encode('utf-8')

                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.send_header('Content-Length', str(len(response_body)))
                self.end_headers()
                self.wfile.write(response_body)
                print(f"[DevServer] Successfully saved portfolio data to disk ({len(body)} bytes).")
                return

            except Exception as e:
                err_msg = str(e)
                print(f"[DevServer] Save error: {err_msg}")
                response_body = json.dumps({'success': False, 'error': err_msg}).encode('utf-8')
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.send_header('Content-Length', str(len(response_body)))
                self.end_headers()
                self.wfile.write(response_body)
                return

        self.send_response(404)
        self.end_headers()

    def do_PUT(self):
        self.do_POST()

    def end_headers(self):
        # Prevent browser caching of JSON data and scripts during development
        if self.path.endswith('.json') or self.path.endswith('.js') or self.path.endswith('.html'):
            self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
            self.send_header('Pragma', 'no-cache')
            self.send_header('Expires', '0')
        self.send_header('Access-Control-Allow-Origin', '*')
        super().end_headers()

if __name__ == '__main__':
    server = http.server.ThreadingHTTPServer(('0.0.0.0', PORT), PortfolioDevHandler)
    print(f"[DevServer] Portfolio dev server running at http://localhost:{PORT}")
    print(f"[DevServer] Root directory: {BASE_DIR}")
    print(f"[DevServer] Local save API enabled: POST http://localhost:{PORT}/api/save")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n[DevServer] Dev server stopped.")
