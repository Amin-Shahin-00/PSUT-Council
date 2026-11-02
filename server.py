"""
PSUT MailBox - backend server.

Pure Python standard library (no installs needed).
Run:  python server.py
Then open http://localhost:8000 (students) and http://localhost:8000/admin (admin portal).

Settings (environment variables):
  PSUT_ADMIN_PASSWORD   admin portal password (default: change-me-now)
  PSUT_HOST             interface to bind (default: 127.0.0.1, use 0.0.0.0 to allow other devices on the network)
  PSUT_PORT             port (default: 8000)
"""

import json
import mimetypes
import os
import re
import secrets
import sqlite3
import threading
import time
import webbrowser
from datetime import datetime, timezone
from http import HTTPStatus
from http.cookies import SimpleCookie
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
PUBLIC_DIR = BASE_DIR / "public"
DB_PATH = BASE_DIR / "mailbox.db"

ADMIN_PASSWORD = os.environ.get("PSUT_ADMIN_PASSWORD", "change-me-now")
HOST = os.environ.get("PSUT_HOST", "127.0.0.1")
PORT = int(os.environ.get("PSUT_PORT", "8000"))

SESSION_TTL = 8 * 60 * 60  # 8 hours
MAX_BODY = 32 * 1024

CATEGORIES = [
    "Academic Affairs",
    "Courses & Instructors",
    "Exams & Grades",
    "Registration & Admission",
    "Financial & Fees",
    "Facilities & Maintenance",
    "IT & E-Learning",
    "Library",
    "Transportation & Parking",
    "Cafeteria",
    "Student Activities & Clubs",
    "Safety & Security",
    "Harassment & Discrimination",
    "Suggestion",
    "Other",
]
TYPES = ["Complaint", "Note", "Suggestion"]
STATUSES = ["New", "In Review", "Resolved", "Dismissed"]

_sessions = {}  # token -> expiry timestamp
_sessions_lock = threading.Lock()
_login_attempts = {}  # ip -> [timestamps]
_submit_times = {}  # ip -> [timestamps]
_rate_lock = threading.Lock()


# ---------------------------------------------------------------- database

def db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    with db() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS submissions (
                id           INTEGER PRIMARY KEY AUTOINCREMENT,
                ref          TEXT UNIQUE NOT NULL,
                type         TEXT NOT NULL,
                category     TEXT NOT NULL,
                subject      TEXT NOT NULL,
                message      TEXT NOT NULL,
                anonymous    INTEGER NOT NULL,
                name         TEXT,
                student_id   TEXT,
                email        TEXT,
                status       TEXT NOT NULL DEFAULT 'New',
                admin_note   TEXT NOT NULL DEFAULT '',
                created_at   TEXT NOT NULL,
                updated_at   TEXT NOT NULL
            )
            """
        )


def now_iso():
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def new_ref():
    return "PSUT-" + datetime.now().strftime("%y%m") + "-" + secrets.token_hex(3).upper()


# ---------------------------------------------------------------- helpers

def rate_limited(store, ip, limit, window):
    t = time.time()
    with _rate_lock:
        hits = [h for h in store.get(ip, []) if t - h < window]
        if len(hits) >= limit:
            store[ip] = hits
            return True
        hits.append(t)
        store[ip] = hits
        return False


def clean(value, max_len):
    if value is None:
        return ""
    return str(value).strip()[:max_len]


def validate_submission(data):
    errors = []
    sub_type = clean(data.get("type"), 30)
    category = clean(data.get("category"), 60)
    subject = clean(data.get("subject"), 150)
    message = clean(data.get("message"), 5000)
    anonymous = bool(data.get("anonymous", True))
    name = clean(data.get("name"), 100)
    student_id = clean(data.get("studentId"), 20)
    email = clean(data.get("email"), 120)

    if sub_type not in TYPES:
        errors.append("Please choose a valid type.")
    if category not in CATEGORIES:
        errors.append("Please choose a valid category.")
    if len(subject) < 3:
        errors.append("Subject must be at least 3 characters.")
    if len(message) < 10:
        errors.append("Message must be at least 10 characters.")
    if anonymous:
        # Anonymous submissions never store identifying details.
        name = student_id = email = ""
    else:
        if len(name) < 2:
            errors.append("Please enter your name or choose to stay anonymous.")
        if student_id and not re.fullmatch(r"[0-9]{4,12}", student_id):
            errors.append("Student ID should contain digits only.")
        if email and not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", email):
            errors.append("Please enter a valid email address.")

    return errors, {
        "type": sub_type,
        "category": category,
        "subject": subject,
        "message": message,
        "anonymous": 1 if anonymous else 0,
        "name": name or None,
        "student_id": student_id or None,
        "email": email or None,
    }


def row_to_dict(row):
    return {
        "id": row["id"],
        "ref": row["ref"],
        "type": row["type"],
        "category": row["category"],
        "subject": row["subject"],
        "message": row["message"],
        "anonymous": bool(row["anonymous"]),
        "name": row["name"],
        "studentId": row["student_id"],
        "email": row["email"],
        "status": row["status"],
        "adminNote": row["admin_note"],
        "createdAt": row["created_at"],
        "updatedAt": row["updated_at"],
    }


# ---------------------------------------------------------------- handler

class Handler(BaseHTTPRequestHandler):
    server_version = "PSUTMailBox/1.0"

    # --- plumbing
    def log_message(self, fmt, *args):
        print("[%s] %s" % (self.log_date_time_string(), fmt % args))

    def client_ip(self):
        return self.client_address[0]

    def send_json(self, payload, status=HTTPStatus.OK, extra_headers=None):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        for k, v in (extra_headers or {}).items():
            self.send_header(k, v)
        self.end_headers()
        self.wfile.write(body)

    def read_json(self):
        length = int(self.headers.get("Content-Length") or 0)
        if length > MAX_BODY:
            return None
        try:
            return json.loads(self.rfile.read(length) or b"{}")
        except (ValueError, UnicodeDecodeError):
            return None

    def session_token(self):
        cookie = SimpleCookie(self.headers.get("Cookie", ""))
        return cookie["psut_admin"].value if "psut_admin" in cookie else None

    def is_admin(self):
        token = self.session_token()
        if not token:
            return False
        with _sessions_lock:
            exp = _sessions.get(token)
            if exp and exp > time.time():
                return True
            _sessions.pop(token, None)
        return False

    def same_origin(self):
        # Basic CSRF protection for state-changing admin requests.
        origin = self.headers.get("Origin")
        if not origin:
            return True
        return origin.split("://", 1)[-1] == self.headers.get("Host")

    # --- static files
    def serve_static(self, path):
        routes = {"/": "index.html", "/admin": "admin.html", "/admin/": "admin.html"}
        rel = routes.get(path, path.lstrip("/"))
        target = (PUBLIC_DIR / rel).resolve()
        if PUBLIC_DIR not in target.parents or not target.is_file():
            self.send_error(HTTPStatus.NOT_FOUND, "Not found")
            return
        data = target.read_bytes()
        ctype = mimetypes.guess_type(str(target))[0] or "application/octet-stream"
        if ctype.startswith("text/") or ctype in ("application/javascript",):
            ctype += "; charset=utf-8"
        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(data)))
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("X-Frame-Options", "DENY")
        self.end_headers()
        self.wfile.write(data)

    # --- routing
    def do_GET(self):
        path = self.path.split("?", 1)[0]
        if path == "/api/meta":
            return self.send_json({"categories": CATEGORIES, "types": TYPES, "statuses": STATUSES})
        if path == "/api/admin/session":
            return self.send_json({"authenticated": self.is_admin()})
        if path == "/api/admin/submissions":
            if not self.is_admin():
                return self.send_json({"error": "Unauthorized"}, HTTPStatus.UNAUTHORIZED)
            with db() as conn:
                rows = conn.execute("SELECT * FROM submissions ORDER BY id DESC").fetchall()
            return self.send_json({"submissions": [row_to_dict(r) for r in rows]})
        if path.startswith("/api/"):
            return self.send_json({"error": "Not found"}, HTTPStatus.NOT_FOUND)
        return self.serve_static(path)

    def do_POST(self):
        path = self.path.split("?", 1)[0]

        if path == "/api/submissions":
            if rate_limited(_submit_times, self.client_ip(), limit=5, window=600):
                return self.send_json(
                    {"error": "Too many submissions. Please wait a few minutes and try again."},
                    HTTPStatus.TOO_MANY_REQUESTS,
                )
            data = self.read_json()
            if not isinstance(data, dict):
                return self.send_json({"error": "Invalid request."}, HTTPStatus.BAD_REQUEST)
            errors, rec = validate_submission(data)
            if errors:
                return self.send_json({"error": " ".join(errors)}, HTTPStatus.BAD_REQUEST)
            ref, ts = new_ref(), now_iso()
            with db() as conn:
                conn.execute(
                    """INSERT INTO submissions
                       (ref, type, category, subject, message, anonymous, name, student_id, email,
                        status, created_at, updated_at)
                       VALUES (?,?,?,?,?,?,?,?,?, 'New', ?, ?)""",
                    (ref, rec["type"], rec["category"], rec["subject"], rec["message"],
                     rec["anonymous"], rec["name"], rec["student_id"], rec["email"], ts, ts),
                )
            return self.send_json({"ok": True, "ref": ref}, HTTPStatus.CREATED)

        if path == "/api/admin/login":
            if rate_limited(_login_attempts, self.client_ip(), limit=8, window=300):
                return self.send_json(
                    {"error": "Too many attempts. Try again in a few minutes."},
                    HTTPStatus.TOO_MANY_REQUESTS,
                )
            data = self.read_json() or {}
            password = str(data.get("password", ""))
            if not secrets.compare_digest(password.encode(), ADMIN_PASSWORD.encode()):
                return self.send_json({"error": "Incorrect password."}, HTTPStatus.UNAUTHORIZED)
            token = secrets.token_urlsafe(32)
            with _sessions_lock:
                _sessions[token] = time.time() + SESSION_TTL
            cookie = f"psut_admin={token}; HttpOnly; SameSite=Strict; Path=/; Max-Age={SESSION_TTL}"
            return self.send_json({"ok": True}, extra_headers={"Set-Cookie": cookie})

        if path == "/api/admin/logout":
            token = self.session_token()
            with _sessions_lock:
                _sessions.pop(token, None)
            return self.send_json(
                {"ok": True},
                extra_headers={"Set-Cookie": "psut_admin=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0"},
            )

        return self.send_json({"error": "Not found"}, HTTPStatus.NOT_FOUND)

    def do_PATCH(self):
        m = re.fullmatch(r"/api/admin/submissions/(\d+)", self.path.split("?", 1)[0])
        if not m:
            return self.send_json({"error": "Not found"}, HTTPStatus.NOT_FOUND)
        if not self.is_admin() or not self.same_origin():
            return self.send_json({"error": "Unauthorized"}, HTTPStatus.UNAUTHORIZED)
        data = self.read_json()
        if not isinstance(data, dict):
            return self.send_json({"error": "Invalid request."}, HTTPStatus.BAD_REQUEST)
        fields, values = [], []
        if "status" in data:
            if data["status"] not in STATUSES:
                return self.send_json({"error": "Invalid status."}, HTTPStatus.BAD_REQUEST)
            fields.append("status = ?")
            values.append(data["status"])
        if "adminNote" in data:
            fields.append("admin_note = ?")
            values.append(clean(data["adminNote"], 2000))
        if not fields:
            return self.send_json({"error": "Nothing to update."}, HTTPStatus.BAD_REQUEST)
        fields.append("updated_at = ?")
        values.extend([now_iso(), int(m.group(1))])
        with db() as conn:
            cur = conn.execute(f"UPDATE submissions SET {', '.join(fields)} WHERE id = ?", values)
            if cur.rowcount == 0:
                return self.send_json({"error": "Not found"}, HTTPStatus.NOT_FOUND)
            row = conn.execute("SELECT * FROM submissions WHERE id = ?", (int(m.group(1)),)).fetchone()
        return self.send_json({"ok": True, "submission": row_to_dict(row)})

    def do_DELETE(self):
        m = re.fullmatch(r"/api/admin/submissions/(\d+)", self.path.split("?", 1)[0])
        if not m:
            return self.send_json({"error": "Not found"}, HTTPStatus.NOT_FOUND)
        if not self.is_admin() or not self.same_origin():
            return self.send_json({"error": "Unauthorized"}, HTTPStatus.UNAUTHORIZED)
        with db() as conn:
            conn.execute("DELETE FROM submissions WHERE id = ?", (int(m.group(1)),))
        return self.send_json({"ok": True})


def main():
    init_db()
    if ADMIN_PASSWORD == "change-me-now":
        print("WARNING: using the default admin password 'change-me-now'. "
              "Set PSUT_ADMIN_PASSWORD before real use.")
    try:
        server = ThreadingHTTPServer((HOST, PORT), Handler)
    except OSError:
        print(f"ERROR: port {PORT} is already in use. PSUT MailBox may already be running -")
        print(f"open http://localhost:{PORT}/ in your browser, or close the other window first.")
        return
    if os.environ.get("PSUT_NO_BROWSER") != "1":
        threading.Timer(0.8, webbrowser.open, args=(f"http://localhost:{PORT}/",)).start()
    print(f"PSUT MailBox running:")
    print(f"  Student site : http://localhost:{PORT}/")
    print(f"  Admin portal : http://localhost:{PORT}/admin")
    print("Keep this window open while the website is in use. Press Ctrl+C to stop.")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopped.")


if __name__ == "__main__":
    main()
