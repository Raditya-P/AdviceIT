"""
AdviceIT by Radit, serve.py
---------------------------------------------------------------
Runs your laptop as the study server. Python standard library only.

    python3 serve.py            (default port 8000)
    python3 serve.py 8080       (another port)

It does two things:
1. Serves the app folder over http, so you can open it at
   http://localhost:8000 and participants on the same network can open
   it at http://<your-laptop-ip>:8000 (the script prints the address).
2. Collects responses. Every submitted response is also POSTed by the
   app to /api/responses and appended to data/responses.jsonl on this
   laptop. GET /api/responses.csv returns everything collected so far as
   a CSV file, and GET /api/responses.json as JSON.

The browser-side session log and CSV download keep working exactly as
before, so nothing is lost if the server is not running.

Note on the conversational (LLM) condition: WebGPU only runs on secure
origins. http://localhost counts as secure, a LAN address such as
http://192.168.1.20:8000 does not. For the LLM condition on other
devices, use the GitHub Pages https link, or start Chrome on that device
with the flag chrome://flags/#unsafely-treat-insecure-origin-as-secure
set to your laptop's address.
"""

import csv
import io
import json
import os
import socket
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

ROOT = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(ROOT, "data")
DATA_FILE = os.path.join(DATA_DIR, "responses.jsonl")

FIELDS = [
    "receivedAt", "timestamp", "participantId", "mode", "condition", "advisorModel",
    "scenario", "age", "horizon", "tolerance", "emergencyFund", "incomeStable",
    "knowledge", "toleranceInconsistent", "suitabilityTolerance", "suitabilityCapacity",
    "suitabilityLiquidity", "narrativeUsed", "ilsCaseId",
    "recommendedPortfolio", "soundPortfolio", "score", "margin",
    "confidence", "trustRating", "decision", "adjustedTo", "adjustSteps", "understanding",
    "decisionConfidence", "mentalDemand", "reason", "literacyScore", "literacyAnswers",
    "literacyLevel", "explanationContent", "explanationForm", "whatIfMoves", "whyNotAsked", "adaptiveVariant",
    "flow", "trialIndex", "trialProfileId", "attentionCheck", "decisionTimeMs", "llmModel",
    "llmExplanation", "llmTurns",
]


def read_rows():
    rows = []
    if os.path.exists(DATA_FILE):
        with open(DATA_FILE, encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line:
                    rows.append(json.loads(line))
    return rows


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def log_message(self, fmt, *args):
        # Quieter log: only API calls and errors.
        if "/api/" in (args[0] if args else "") or (args and str(args[1]).startswith(("4", "5"))):
            super().log_message(fmt, *args)

    def _send_json(self, status, payload):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if self.path.startswith("/api/responses.csv"):
            rows = read_rows()
            buf = io.StringIO()
            writer = csv.DictWriter(buf, fieldnames=FIELDS, extrasaction="ignore")
            writer.writeheader()
            for r in rows:
                writer.writerow(r)
            body = buf.getvalue().encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "text/csv; charset=utf-8")
            self.send_header("Content-Disposition", "attachment; filename=adviceit-responses.csv")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        if self.path.startswith("/api/responses.json"):
            self._send_json(200, {"count": len(read_rows()), "rows": read_rows()})
            return
        if self.path.startswith("/api/ping"):
            self._send_json(200, {"ok": True, "collected": len(read_rows())})
            return
        super().do_GET()

    def do_POST(self):
        if not self.path.startswith("/api/responses"):
            self._send_json(404, {"error": "not found"})
            return
        length = int(self.headers.get("Content-Length", "0"))
        try:
            row = json.loads(self.rfile.read(length).decode("utf-8"))
        except (ValueError, UnicodeDecodeError):
            self._send_json(400, {"error": "invalid JSON"})
            return
        from datetime import datetime, timezone
        row["receivedAt"] = datetime.now(timezone.utc).isoformat()
        os.makedirs(DATA_DIR, exist_ok=True)
        with open(DATA_FILE, "a", encoding="utf-8") as f:
            f.write(json.dumps(row, ensure_ascii=False) + "\n")
        self._send_json(200, {"ok": True, "collected": len(read_rows())})


def lan_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except OSError:
        return "127.0.0.1"


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    server = ThreadingHTTPServer(("0.0.0.0", port), Handler)
    print("AdviceIT study server")
    print(f"  on this laptop:        http://localhost:{port}/")
    print(f"  on the same network:   http://{lan_ip()}:{port}/")
    print(f"  participant link:      http://{lan_ip()}:{port}/?mode=participant&pid=P01&cond=feature   (AI advisor, use interpretable.html for the interpretable rule-based advisor)")
    print(f"  collected responses:   http://localhost:{port}/api/responses.csv")
    print(f"  data file:             {DATA_FILE}")
    print("Press Ctrl+C to stop.")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nstopped")


if __name__ == "__main__":
    main()
