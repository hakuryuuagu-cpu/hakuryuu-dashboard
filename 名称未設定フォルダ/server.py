#!/usr/bin/env python3
"""
Virtual AI Office - ローカルプロキシサーバー
使い方: python3 server.py
ブラウザで http://localhost:3001 を開く
"""

from http.server import HTTPServer, BaseHTTPRequestHandler
import json
import urllib.request
import urllib.error
import os

PORT = 3001
HTML_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'virtual-office.html')


class ProxyHandler(BaseHTTPRequestHandler):

    def log_message(self, format, *args):
        print(f"  {args[0]} {args[1]}")

    def send_cors(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_cors()
        self.end_headers()

    def do_GET(self):
        if self.path in ('/', '/virtual-office.html'):
            try:
                with open(HTML_FILE, 'rb') as f:
                    content = f.read()
                self.send_response(200)
                self.send_header('Content-Type', 'text/html; charset=utf-8')
                self.send_cors()
                self.end_headers()
                self.wfile.write(content)
            except FileNotFoundError:
                self.send_response(404)
                self.end_headers()
                self.wfile.write(b'virtual-office.html not found in same folder')
        else:
            self.send_response(404)
            self.end_headers()

    def do_POST(self):
        length = int(self.headers.get('Content-Length', 0))
        raw = self.rfile.read(length)
        body = json.loads(raw)

        try:
            if self.path == '/api/claude':
                result = self.call_claude(body)
            elif self.path == '/api/gpt':
                result = self.call_gpt(body)
            elif self.path == '/api/gemini':
                result = self.call_gemini(body)
            else:
                self.send_response(404)
                self.end_headers()
                return

            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_cors()
            self.end_headers()
            self.wfile.write(json.dumps(result).encode())

        except urllib.error.HTTPError as e:
            error_body = e.read().decode()
            print(f"  API Error {e.code}: {error_body}")
            self.send_response(e.code)
            self.send_header('Content-Type', 'application/json')
            self.send_cors()
            self.end_headers()
            self.wfile.write(error_body.encode())

        except Exception as e:
            print(f"  Error: {e}")
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.send_cors()
            self.end_headers()
            self.wfile.write(json.dumps({'error': str(e)}).encode())

    def call_claude(self, body):
        url = 'https://api.anthropic.com/v1/messages'
        headers = {
            'x-api-key': body['apiKey'],
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
        }
        payload = {
            'model': 'claude-haiku-4-5-20251001',
            'max_tokens': 600,
            'system': body.get('system', ''),
            'messages': body.get('messages', []),
        }
        return self._post(url, headers, payload)

    def call_gpt(self, body):
        url = 'https://api.openai.com/v1/chat/completions'
        headers = {
            'Authorization': f"Bearer {body['apiKey']}",
            'Content-Type': 'application/json',
        }
        payload = {
            'model': 'gpt-4o',
            'max_tokens': 600,
            'messages': body.get('messages', []),
        }
        return self._post(url, headers, payload)

    def call_gemini(self, body):
        key = body['apiKey']
        url = f'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={key}'
        headers = {'Content-Type': 'application/json'}
        payload = {'contents': body.get('contents', [])}
        return self._post(url, headers, payload)

    def _post(self, url, headers, payload):
        data = json.dumps(payload).encode()
        req = urllib.request.Request(url, data=data, headers=headers, method='POST')
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read())


if __name__ == '__main__':
    server = HTTPServer(('localhost', PORT), ProxyHandler)
    print(f"\n{'='*50}")
    print(f"  Virtual AI Office サーバー起動中")
    print(f"  ブラウザで開く → http://localhost:{PORT}")
    print(f"{'='*50}")
    print(f"  停止するには Ctrl+C を押してください\n")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nサーバーを停止しました")
