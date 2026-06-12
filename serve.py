#!/usr/bin/env python3
"""Recipe app dev server — serves all files with no-cache headers so
every reload on every device always gets the latest code."""

import http.server
import os

PORT = 3721

class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def log_message(self, format, *args):
        print(f"{self.address_string()} → {args[0]} {args[1]}")

os.chdir(os.path.dirname(os.path.abspath(__file__)))
print(f"Recipes server running on http://localhost:{PORT}")
print("Press Ctrl+C to stop.\n")
httpd = http.server.HTTPServer(('', PORT), NoCacheHandler)
httpd.serve_forever()
