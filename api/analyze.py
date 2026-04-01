from http.server import BaseHTTPRequestHandler
import json
import uuid
import sys
import os

# Add parent dir to path so we can import backend modules
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers.get('Content-Length', 0))
        # Read the upload (we don't actually need the video for mock)
        self.rfile.read(content_length)

        from backend.mock_inference import generate_mock_results

        analysis_id = str(uuid.uuid4())
        results = generate_mock_results(duration=30)

        response = {
            "analysisId": analysis_id,
            "status": "complete",
            "data": results,
            "error": None,
            "filename": "uploaded-video.mp4",
            "instant": True
        }

        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(response).encode())

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
