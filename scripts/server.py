import http.server
import socketserver
import os

STATIC_MEDIA_EXTS = ('.png', '.webp', '.mp3', '.ogg', '.wav', '.woff2', '.woff', '.ttf', '.jpg', '.jpeg', '.mp4')

class SmartCacheHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Extract clean lower-case URL path without query params
        path = self.path.split('?')[0].lower()
        if path.endswith(STATIC_MEDIA_EXTS):
            # Static media (images, textures, audio): Cache locally on mobile devices to prevent Wi-Fi re-fetch stalls
            self.send_header('Cache-Control', 'public, max-age=86400')
        else:
            # Dynamic code/markup (.js, .html, .css, .json): Always fresh for live development iteration
            self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
            self.send_header('Pragma', 'no-cache')
            self.send_header('Expires', '0')
        super().end_headers()

class ThreadedTCPServer(socketserver.ThreadingMixIn, socketserver.TCPServer):
    allow_reuse_address = True
    daemon_threads = True

HOST = "0.0.0.0"
PORT = 8000
Handler = SmartCacheHTTPRequestHandler

with ThreadedTCPServer((HOST, PORT), Handler) as httpd:
    print(f"Serving locally at http://localhost:{PORT} and on network at http://192.168.1.158:{PORT} (Multi-Threaded + Smart Media Caching enabled)...", flush=True)
    httpd.serve_forever()
