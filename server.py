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
import tempfile
import threading

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 3000
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_FILE = os.path.join(BASE_DIR, 'data', 'portfolio-data.json')
MAX_REQUEST_BYTES = 2 * 1024 * 1024
WRITE_LOCK = threading.Lock()

class PortfolioDevHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=BASE_DIR, **kwargs)

    def do_OPTIONS(self):
        self.send_error(405, 'Cross-origin requests are not supported')

    def do_POST(self):
        clean_path = self.path.split('?')[0].rstrip('/')
        if clean_path in ('/api/save', '/data/portfolio-data.json'):
            try:
                origin = self.headers.get('Origin')
                allowed_origins = {f'http://localhost:{PORT}', f'http://127.0.0.1:{PORT}'}
                if origin and origin not in allowed_origins:
                    self.send_error(403, 'Cross-origin writes are not allowed')
                    return
                content_length = int(self.headers.get('Content-Length', 0))
                if content_length <= 0 or content_length > MAX_REQUEST_BYTES:
                    raise ValueError('Empty request payload')
                
                raw_bytes = self.rfile.read(content_length)
                try:
                    body = raw_bytes.decode('utf-8')
                except UnicodeDecodeError:
                    body = raw_bytes.decode('latin-1')
                data = json.loads(body)
                if not isinstance(data, dict) or not isinstance(data.get('profile'), dict):
                    raise ValueError('Invalid portfolio schema')

                # Ensure data directory exists
                os.makedirs(os.path.dirname(DATA_FILE), exist_ok=True)

                # Atomic write via temporary file to prevent corruption
                with WRITE_LOCK:
                    fd, tmp_file = tempfile.mkstemp(prefix='portfolio-data-', suffix='.tmp', dir=os.path.dirname(DATA_FILE))
                    try:
                        with os.fdopen(fd, 'w', encoding='utf-8') as f:
                            json.dump(data, f, indent=2, ensure_ascii=False)
                            f.flush()
                            os.fsync(f.fileno())
                        os.replace(tmp_file, DATA_FILE)
                    finally:
                        if os.path.exists(tmp_file):
                            os.unlink(tmp_file)

                response_body = json.dumps({
                    'success': True,
                    'localFileSaved': True,
                    'message': 'Changes persisted to data/portfolio-data.json'
                }).encode('utf-8')

                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
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
                self.send_header('Content-Length', str(len(response_body)))
                self.end_headers()
                self.wfile.write(response_body)
                return

        self.send_response(404)
        self.end_headers()

    def do_PUT(self):
        self.do_POST()

    def end_headers(self):
        if self.path.endswith(('.woff2', '.png', '.jpg', '.svg')):
            self.send_header('Cache-Control', 'public, max-age=604800')
        else:
            self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        super().end_headers()

if __name__ == '__main__':
    server = http.server.ThreadingHTTPServer(('127.0.0.1', PORT), PortfolioDevHandler)
    print(f"[DevServer] Portfolio dev server running at http://localhost:{PORT}")
    print(f"[DevServer] Root directory: {BASE_DIR}")
    print(f"[DevServer] Local save API enabled: POST http://localhost:{PORT}/api/save")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n[DevServer] Dev server stopped.")
