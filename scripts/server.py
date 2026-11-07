import http.server
import socketserver

class NoCacheHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

HOST = "0.0.0.0"
PORT = 8000
Handler = NoCacheHTTPRequestHandler

with socketserver.TCPServer((HOST, PORT), Handler) as httpd:
    print(f"Serving locally at http://localhost:{PORT} and on network at http://192.168.1.158:{PORT} with NO CACHING...")
    httpd.serve_forever()
